import hashlib
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

TOOLS = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(TOOLS))
sys.path.insert(0, str(TOOLS.parent / 'remote'))
from common import ROOT, inside, load_job
from download import download
from workflow import build
from run import completed, verify_video
from ssh import connection


class PipelineTests(unittest.TestCase):
    def test_project_inputs_and_graph(self):
        path = ROOT / 'projects/002-saturn-rings/remote/wan-s2v/job.json'
        job = load_job(path)
        graph = build(job, 'presenter.png', 'audio.wav', 'mascot')
        self.assertEqual(json.loads(path.with_name('workflow-api.json').read_text()), graph)
        self.assertEqual(graph['13']['inputs']['video_latent'], ['12', 0])
        self.assertEqual(graph['15']['inputs']['samples2'], ['14', 0])
        latent_frames = 2 * ((job['chunkFrames'] - 1) // 4 + 1) + 1
        available_frames = (latent_frames - 1) * 4 + 1 - 3
        self.assertGreaterEqual(available_frames, 160)
        self.assertEqual(graph['19']['inputs']['length'] / graph['20']['inputs']['fps'], 10)
        for node in graph.values():
            for value in node['inputs'].values():
                if isinstance(value, list):
                    self.assertIn(value[0], graph)

    def test_path_escape(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            for value in ['../outside', '/etc/passwd']:
                with self.assertRaises(ValueError):
                    inside(root, value)
            (root / 'escape').symlink_to(root.parent, target_is_directory=True)
            with self.assertRaises(ValueError):
                inside(root, 'escape/outside')

    def test_model_integrity_and_cache(self):
        data = b'complete model test payload'
        model = {'path': 'vae/test.safetensors', 'bytes': len(data),
                 'sha256': hashlib.sha256(data).hexdigest(), 'url': 'https://example.invalid/model'}
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            partial = root / 'vae/test.safetensors.part'
            partial.parent.mkdir()
            partial.write_bytes(data[:5])
            def fake_curl(command, **kwargs):
                self.assertIn('--continue-at', command)
                partial.write_bytes(data)
                return subprocess.CompletedProcess(command, 0)
            with patch('download.subprocess.run', side_effect=fake_curl) as curl:
                download(model, root)
                download(model, root)
                self.assertEqual(curl.call_count, 1)
            target = root / model['path']
            target.write_bytes(b'corrupt')
            with self.assertRaisesRegex(RuntimeError, 'Invalid existing'):
                download(model, root)

    def test_corrupt_partial_is_not_promoted(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            (root / 'test.part').write_bytes(b'bad')
            with self.assertRaisesRegex(RuntimeError, 'Checksum'):
                download({'path': 'test', 'bytes': 3, 'sha256': '0' * 64}, root)
            self.assertFalse((root / 'test').exists())

    def test_inference_errors_do_not_count_as_completion(self):
        self.assertFalse(completed({}, 'id'))
        self.assertTrue(completed({'id': {'status': {'completed': True}}}, 'id'))
        with self.assertRaises(RuntimeError):
            completed({'id': {'status': {'completed': True, 'status_str': 'error', 'messages': ['OOM']}}}, 'id')

    def test_ssh_reuses_identity_without_forwarding(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            identity = root / 'existing'
            identity.touch()
            identity.with_suffix('.pub').touch()
            opts, target = connection('gpu.example', 1234, 'root', identity, root / 'state', bootstrap=True)
            self.assertIn(f'IdentityFile={identity.resolve()}', opts)
            self.assertNotIn('-i', opts)  # ssh-copy-id reserves -i for the public key.
            self.assertIn('ForwardAgent=no', opts)
            self.assertIn('StrictHostKeyChecking=ask', opts)
            self.assertEqual(target, 'root@gpu.example')
            opts, _ = connection('gpu.example', 1234, 'root', identity, root / 'state')
            self.assertIn('BatchMode=yes', opts)
            self.assertIn('StrictHostKeyChecking=yes', opts)
            with self.assertRaises(ValueError):
                connection('bad;host', 22, 'root', identity, root / 'state')

    def test_real_mp4_verification_and_rejection(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / 'test.mp4'
            subprocess.run(['ffmpeg', '-v', 'error', '-f', 'lavfi', '-i', 'color=c=gray:s=480x832:r=16:d=10',
                            '-f', 'lavfi', '-i', 'anullsrc=r=16000:cl=mono', '-t', '10', '-c:v', 'libx264',
                            '-preset', 'ultrafast', '-c:a', 'aac', str(path)], check=True)
            verify_video(path)
            with patch('run.probe', return_value={'streams': [
                {'codec_type': 'video', 'width': 480, 'height': 832, 'avg_frame_rate': '16/1', 'nb_frames': '158'},
                {'codec_type': 'audio'}]}):
                with self.assertRaisesRegex(RuntimeError, 'Unexpected video'):
                    verify_video(path)


if __name__ == '__main__':
    unittest.main()
