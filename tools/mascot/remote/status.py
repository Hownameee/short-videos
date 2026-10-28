#!/usr/bin/env python3
"""Read rental progress; optionally refresh and estimate sampling cost."""
import argparse
import json
from pathlib import Path
import re
import shlex
import subprocess
import time
from ssh import connection

# Executed read-only through the existing SSH connection. No GPU work is queued.
SNAPSHOT = r'''
import json, pathlib, subprocess, time, sys
root = pathlib.Path(sys.argv[1])
r = root/'tools/mascot/wan-s2v/.runtime'
def read(p):
    return p.read_text(errors='replace') if p.exists() else ''
def tail(p, count=100000):
    if not p.exists(): return ''
    with p.open('rb') as f:
        f.seek(max(0,p.stat().st_size-count))
        return f.read().decode(errors='replace')
lock = json.loads((root/'tools/mascot/wan-s2v/runtime-lock.json').read_text())
models=[]
for m in lock['models']:
    p=r/'ComfyUI/models'/m['path']
    part=p.with_suffix(p.suffix+'.part')
    models.append({'name':p.name,'total':m['bytes'],'bytes':p.stat().st_size if p.exists() else part.stat().st_size if part.exists() else 0,'verified':p.with_suffix('.verified.json').exists()})
sessions=sorted((r/'runs').glob('*')) if (r/'runs').exists() else []
session=sessions[-1] if sessions else None
launch=max((p for p in [r/'launch.log',r/'restart.log'] if p.exists()), key=lambda p:p.stat().st_mtime, default=r/'launch.log')
worker=r/'worker.pid'
# worker.pid is written when the launch starts, unlike launch.log which keeps changing.
started=worker.stat().st_mtime if worker.exists() else None
live=False
if worker.exists():
    live=pathlib.Path('/proc')/read(worker).strip()
    live=live.exists()
gpu=subprocess.run(['nvidia-smi','--query-gpu=memory.used,memory.total,utilization.gpu,power.draw','--format=csv,noheader'],capture_output=True,text=True)
print(json.dumps({'now':time.time(),'started':started,'workerAlive':live,'status':read(r/'exit-code').strip(),'models':models,'dependenciesReady':(r/'dependencies.json').exists(),'setup':json.loads(read(r/'setup.json') or '{}'),'session':session.name if session else None,'inferenceStarted':(session/'workflow-api.json').stat().st_mtime if session and (session/'workflow-api.json').exists() else None,'comfyLog':tail(session/'comfy.log') if session else '', 'launchLog':tail(launch,3000),'gpu':gpu.stdout.strip()}))
'''


def duration(seconds):
    if seconds is None:
        return 'chưa đủ dữ liệu'
    seconds = max(0, round(seconds))
    return f'{seconds//3600:02d}:{seconds//60%60:02d}:{seconds%60:02d}'


def sampling_progress(log):
    # tqdm rewrites with CR and repeats the final 100% line. Identify a new
    # sampler only when the counter drops, not on repeated final lines.
    pattern = r'(\d+)/(\d+)\s*\[([^\]]*)\]'
    chunk, previous, latest = 1, None, None
    for match in re.finditer(pattern, log):
        step, total = int(match[1]), int(match[2])
        if total != 20:
            continue
        if previous is not None and step < previous:
            chunk += 1
        previous = step
        rate = re.search(r'([\d.]+)s/it', match[3])
        speed = float(rate[1]) if rate else None
        if speed is None:
            rate = re.search(r'([\d.]+)it/s', match[3])
            if rate and float(rate[1]) > 0:
                speed = 1 / float(rate[1])
        latest = {'chunk':chunk,'step':step,'total':total,'secondsPerStep':speed}
    return latest


def render(snapshot, previous=None, hourly_rate=None):
    elapsed = snapshot['now'] - snapshot['started'] if snapshot['started'] else None
    progress = sampling_progress(snapshot['comfyLog'])
    downloaded = sum(m['bytes'] for m in snapshot['models'])
    total = sum(m['total'] for m in snapshot['models'])
    verified = all(m['verified'] for m in snapshot['models'])
    status = snapshot['status']
    if status == '0':
        phase = 'Hoàn thành remote; kiểm tra collector để xác nhận đã copy về'
    elif status.isdigit():
        phase = 'LỖI — xem launch.log / comfy.log'
    elif not snapshot['workerAlive']:
        phase = 'Không thấy worker sống; trạng thái lưu trên disk có thể đã cũ'
    elif not verified or not snapshot['dependenciesReady']:
        phase = 'Setup / tải và kiểm tra model'
    elif progress and progress['chunk'] >= 2 and progress['step'] == 20:
        phase = 'Sampling xong; decode / encode / kiểm tra MP4'
    elif progress:
        phase = 'Sampling'
    else:
        phase = 'Khởi động inference / load model / encode input'
    lines = [time.strftime('%Y-%m-%d %H:%M:%S %Z'), f'Trạng thái: {phase}',
             f'Thời gian từ worker start: {duration(elapsed)}',
             f'Dependencies + CUDA: {"đạt" if snapshot["dependenciesReady"] else "đang chuẩn bị"}',
             f'Model: {downloaded/1e9:.2f}/{total/1e9:.2f} GB ({100*downloaded/total:.1f}%), {sum(m["verified"] for m in snapshot["models"])}/4 đã xác minh']
    if previous and not verified:
        dt = snapshot['now'] - previous['now']
        delta = downloaded - sum(m['bytes'] for m in previous['models'])
        if dt > 0 and delta > 0:
            rate = delta/dt
            lines.append(f'Tải: {rate/1e6:.1f} MB/s; ETA tải: {duration(max(0,total-downloaded)/rate)} (chưa tính hash và inference)')
    if snapshot['inferenceStarted']:
        lines.append('Bắt đầu generate: '+time.strftime('%Y-%m-%d %H:%M:%S %Z',time.localtime(snapshot['inferenceStarted'])))
        lines.append(f'Inference gồm load/decode: {duration(snapshot["now"]-snapshot["inferenceStarted"])}')
    if progress:
        chunk, step = progress['chunk'], progress['step']
        lines.append(f'Sampling: đoạn {chunk}/2, bước {step}/20')
        speed = progress['secondsPerStep']
        if speed and chunk <= 2:
            remaining = max(0,(2-chunk)*20+20-step)
            lines.append(f'Tốc độ log gần nhất: {speed:.1f} giây/bước; ETA sampling: {duration(remaining*speed)}')
            lines.append('ETA sampling ngoại suy từ tốc độ hiện tại; chưa gồm chuyển đoạn/load/decode/copy.')
    else:
        lines.append('ETA inference: chờ các bước sampling đầu tiên, chưa thể ước tính đáng tin cậy.')
    lines.append('GPU (VRAM dùng/tổng, utilization, power): '+snapshot['gpu'])
    if hourly_rate is not None and elapsed is not None:
        lines.append(f'Chi phí từ worker start: ~{elapsed/3600*hourly_rate:,.2f} (đơn vị theo giá/giờ nhập vào; chưa gồm thời gian thuê trước đó)')
    if status.isdigit() and status != '0':
        lines.append(snapshot['launchLog'][-1800:])
    return '\n'.join(lines)


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--host', required=True)
    p.add_argument('--port', required=True, type=int)
    p.add_argument('--user', default='root')
    p.add_argument('--identity', default=str(Path.home()/'.ssh/ckey_n3_ed25519'))
    p.add_argument('--remote-root', default='/root/short-videos')
    p.add_argument('--watch', action='store_true')
    p.add_argument('--interval', type=int, default=15)
    p.add_argument('--hourly-rate', type=float)
    args = p.parse_args()
    if args.interval < 5:
        p.error('interval must be at least 5 seconds')
    state = Path(__file__).resolve().parents[1]/'.runtime/ssh'
    opts, target = connection(args.host,args.port,args.user,args.identity,state)
    previous = None
    while True:
        try:
            result = subprocess.run(['ssh',*opts,target,shlex.join(['python3','-c',SNAPSHOT,args.remote_root])],
                                    capture_output=True,text=True,timeout=45,check=True)
            snapshot = json.loads(result.stdout)
            print(render(snapshot, previous, args.hourly_rate), flush=True)
            previous = snapshot
        except (subprocess.SubprocessError, json.JSONDecodeError) as error:
            print(f'Không lấy được snapshot: {error}. Không dùng dữ liệu cũ để báo tiến độ.',flush=True)
            if not args.watch:
                raise SystemExit(1)
        if not args.watch:
            break
        print('\n'+'─'*64,flush=True)
        time.sleep(args.interval)


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        pass
