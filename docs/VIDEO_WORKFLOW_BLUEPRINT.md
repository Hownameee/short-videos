# Blueprint: từ prompt đến video ngắn

Last reviewed: 2026-10-05

Mặc định cho video mới: **tiếng Anh, chuyển động theo nội dung và phụ đề karaoke
sáng từng từ**. Quy tắc, helper và bước kiểm tra dùng chung nằm trong
[VIDEO_PRODUCTION_DEFAULTS.md](VIDEO_PRODUCTION_DEFAULTS.md).

Tài liệu này là context biên tập cho video dọc giải thích/giáo dục, mặc định
45–75 giây. Pipeline dùng LLM/agent để nghiên cứu và viết, Kokoro cho giọng nói,
Remotion cho hình ảnh và render. Hai điểm duyệt của người dùng được giữ lại:
chọn hướng sau research và duyệt script trước production.

## Sườn nội dung linh hoạt

Các khoảng có thể chồng nhau. Hook có thể chứa lời hứa; CTA có thể chạy trên
payoff. Một video chỉ nên có một lời hứa chính và thường không quá ba core beat.

| Phần | Budget | Cửa sổ thường gặp ở video 60s | Mục đích |
| --- | ---: | ---: | --- |
| Tension hook | 3–7s | 0–7s | Nêu vấn đề, hậu quả hoặc kết quả đáng chú ý |
| Lời hứa | 2–5s | 3–10s | Cho biết người xem sẽ hiểu/làm được gì |
| Use case | 4–10s | 6–16s | Đặt vấn đề vào một tình huống cụ thể |
| Giải thích/demo | 20–40s | 12–50s | Dùng 1–3 beat để đi từ vấn đề đến lời giải |
| Payoff/bằng chứng | 5–15s | 35–60s | Trả đúng lời hứa bằng demo, before/after hoặc nguồn |
| Takeaway | 2–6s | 48–68s | Chốt một điều cần nhớ |
| CTA theo ngữ cảnh | 2–6s | 5–6 giây cuối | Dẫn tới bước tiếp theo có ích |

- Video 20–30 giây: gộp hook với lời hứa, giữ một core beat.
- Video 45–75 giây: dùng 2–3 core beat và một payoff rõ.
- Video trên 90 giây: chỉ thêm proof, phản biện hoặc ví dụ có giá trị.
- Nếu payoff đã xong, kết thúc; duration là giới hạn, không phải chỗ phải lấp đầy.

## Tension hook và CTA

Dùng mâu thuẫn có thật thay cho claim gây sốc không có bằng chứng. Hook phải khớp
first frame, title và payoff, đồng thời đọc thành tiếng trong khoảng 3–5 giây.

| Hook Docker | Dùng? | Lý do |
| --- | --- | --- |
| “Docker là trò lừa đảo lớn nhất ngành IT.” | Không | Quá mức và khó trả lời trung thực |
| “Docker không sửa được code tệ của bạn.” | Có điều kiện | Sắc nhưng đúng phạm vi nếu giải thích Docker giải quyết môi trường |
| “App chạy trên laptop chưa có nghĩa là nó chạy ở production.” | Nên dùng | Nêu đúng use case và dẫn thẳng vào payoff |
| “90% developer dùng Docker sai.” | Chỉ khi có nguồn | Không dùng số liệu do model tự nghĩ |

Mở đầu bằng vấn đề hoặc kết quả, không đặt logo/lời chào dài trước hook. Branding
có thể xuất hiện qua màu, type, watermark hoặc sonic cue. CTA nên nối với giá trị
vừa xem, ví dụ: “Video sau mình sẽ dựng image và container cạnh nhau.”

## Workflow ba phase

```text
PHASE 1 — DISCOVER
Prompt → project → research → 2–4 direction → người dùng chọn

PHASE 2 — SCRIPT
Direction → beat sheet → script + scene plan → người dùng duyệt

PHASE 3 — PRODUCE
Voice + assets + music/SFX + Remotion → preview/QC → final + snapshot
```

Mỗi phase lưu artifact trên disk để có thể dừng và tiếp tục. State và checksum
ngăn phase sau dùng research hoặc script cũ.

### Phase 1 — Discover

**Input:** prompt; audience, platform, language, duration, tone, goal và CTA nếu có.

**Process:**

1. CLI cấp số kế tiếp và tạo `projects/NNN-slug` ngay khi nhận prompt.
2. Research tạo 3–7 claim, nguồn, use case, thuật ngữ và warning.
3. Sinh 2–4 hướng khác nhau về narrative, không chỉ thay câu hook.
4. Mỗi hướng có tension hook, promise, payoff, core beats, visual/audio approach,
   duration range, evidence và risk.
5. Người dùng chọn direction hoặc đưa notes.

**Output:** `request.json`, `research.md`, `research.json`, `directions.json`, sau
khi chọn có thêm `direction.json`.

**Gate:** một direction đã được ghi nhận và khớp research version. Chưa viết final
script, gọi TTS, tải asset hoặc render trước gate này.

CLI hiện tại:

```console
npm run video -- discover --prompt "Docker giải quyết works on my machine ra sao?"
# Agent/người viết điền research.md, research.json, directions.json
npm run video -- discover --project projects/001-docker-giai-quyet-works-on-my-machine-ra-sao --complete
npm run video -- script --project projects/001-docker-giai-quyet-works-on-my-machine-ra-sao --direction 1
```

`discover --prompt` hiện tạo project và file mẫu; nó chưa tự gọi search hay LLM.

### Phase 2 — Script

**Input:** direction đã chọn và research đã version hóa.

**Process:** viết beat sheet trước, rồi narration, on-screen text, visual, source,
pronunciation, transition, music/SFX cue, takeaway và CTA. Câu đọc ngắn, mỗi câu
một ý. Timing vẫn là range cho tới khi có duration thật của voice.

Mỗi scene tối thiểu cần:

```json
{
  "id": "why-it-breaks",
  "purpose": "So sánh môi trường local và production",
  "durationRangeSec": { "min": 6, "max": 10 },
  "narration": "Máy bạn có runtime đúng. Server có thể không có.",
  "onScreenText": "SAME CODE ≠ SAME ENVIRONMENT",
  "visualType": "split-comparison"
}
```

**Output:** `script.md` để người dùng đọc và `video.json` cho production.

**Gate:** CLI hash nội dung của `script.md` và `video.json`. Mọi thay đổi sau khi
duyệt trong hai file này làm approval cũ hết hiệu lực. Sửa music/SFX/caption mode
dùng `video revise` và `production.json`, không sửa dữ liệu script đã duyệt.

```console
npm run video -- script --project projects/001-... --draft
npm run video -- script --project projects/001-... --approve
```

CLI hiện validate script tối thiểu, `meta`, `design`, scene ID/narration/duration
và approval version; nó chưa tự viết beat sheet hoặc script.

### Phase 3 — Produce

**Input:** `video.json` có approval khớp script version.

**Process:**

1. Kokoro tạo WAV cho scene thay đổi, dùng lại clip đã xác minh; lưu input text,
   duration, word timing và checksum. `--force` tạo lại toàn bộ khi cần.
2. Chọn voice/music từ [audio library dùng chung](../audio-library/README.md):
   nghe sample, lọc tag, kiểm tra license; copy track và credit vào project.
   Chuẩn bị visual, asset và SFX; lưu source/license. Narration vẫn tạo mới từ
   script đã approve, không dùng voice audition làm audio scene.
3. Remotion dựng caption, animation, transition và audio mix.
4. Render preview nhẹ và contact sheet để review.
5. Render final, kiểm tra media, snapshot source và cập nhật state.

```console
npm run video -- render --project projects/001-... --preview
npm run video -- render --project projects/001-... --final
npm run video -- status --project projects/001-...
```

CLI hiện gọi Remotion, `ffprobe` và `ffmpeg`; preview tạo `preview.mp4` cùng
`contact-sheet.png` cho mở đầu, từng scene và kết thúc. Final yêu cầu preview
khớp fingerprint input hiện tại, kiểm tra dimensions/FPS/duration theo timeline,
H.264/AAC, full decode và loudness/true peak thực tế. CLI stage project
media, truyền video/voice manifest vào renderer và chuẩn hóa audio trước khi tạo:

- `output/final.mp4` và `output/report.json`;
- `src/`, snapshot chính xác của `renderer/src/` dùng cho final;
- `render.snapshot.json` chứa runtime và checksum của `video.json`, source,
  lockfile và MP4;
- state `produced` chỉ sau khi các artifact trên được thay thành công.

Renderer nhận video config đã resolve với production override và voice manifest.
Storyboard override chưa được hỗ trợ và bị chặn. Renderer hiện có Kubernetes và
eclipses với animation và component karaoke dùng chung.
`tools/kokoro/generate_audio.py` tạo WAV, word timestamps và phrase captions theo
scene nhưng chưa được `npm run video` gọi tự động. Render preflight chặn karaoke
thiếu timestamp hoặc caption sai nội dung. Với chủ đề mới, agent vẫn cần triển
khai visual component/scene mapping và chuyển động phù hợp.

## Visual và audio contract

Chốt visual system trước JSX: visual thesis, 2–3 mood word, palette/type roles,
safe area, asset language và motion grammar. Mỗi scene có một vai trò hình chính:

| Nguồn | Hợp khi | Cần kiểm tra |
| --- | --- | --- |
| Remotion native | Diagram, UI giả lập, kinetic text, code | Đọc được trên màn hình nhỏ |
| Asset local | Screenshot, logo, footage tự quay | Quyền dùng và độ phân giải |
| Stock | B-roll đời sống hoặc bối cảnh | License và độ khớp nội dung |
| AI image/video | Cảnh khó quay, phong cách riêng | Nhất quán, lỗi hình, chi phí, quyền dùng |

Audio gồm voice, nhạc nền, SFX và khoảng lặng. Mix từ voice ra ngoài; có thể bắt
đầu với nhạc thấp hơn voice 15–20 dB rồi nghe lại trên loa điện thoại. Duck nhạc
ở câu dày, dùng SFX có chủ ý và lưu license ngay khi lấy asset.

Caption nên có 1–2 dòng theo cụm nghĩa, không che focal point hoặc UI của nền
tảng. Dùng duration WAV thật để quyết định frame count; không ép TTS nói quá nhanh.

## `video.json` tối thiểu

```json
{
  "schemaVersion": 1,
  "meta": {
    "title": "Why it breaks after deploy",
    "width": 1080,
    "height": 1920,
    "fps": 30
  },
  "design": {
    "visualThesis": "A stable system replaces an unpredictable environment"
  },
  "audio": null,
  "scenes": [
    {
      "id": "hook",
      "narration": "Working on your laptop does not guarantee it works in production.",
      "onScreenText": ["SAME CODE, DIFFERENT ENVIRONMENT"],
      "durationRangeSec": { "min": 3, "max": 7 }
    }
  ]
}
```

Đây là ví dụ tối thiểu để record draft; `audio: null` là lựa chọn im lặng rõ ràng,
không phải mặc định production. Video mới vẫn cần visual renderer, voice và nhạc
phù hợp theo production defaults. CLI tự thêm `scriptVersion` và approval. Contract đầy đủ nằm trong
[`artifact-contracts.md`](../.agent/skills/short-video-workflow/references/artifact-contracts.md).

## QC trước final

- **Nội dung:** hook khớp title/first frame; promise có payoff; claim có nguồn.
- **Hình:** một focal point; text đọc được ở phone scale; không asset vỡ/frame đen.
- **Âm thanh:** không lặp/cắt từ; voice rõ hơn music/SFX; loop/fade không lộ.
- **Kỹ thuật:** 1080×1920, đúng FPS/duration; có audio khi manifest khai báo.
- **Quyền dùng:** asset, music và SFX có source/license metadata.
- **Archive:** source snapshot và checksum khớp final mới nhất.

## Nguồn tham khảo

- [YouTube: audience retention](https://support.google.com/youtube/answer/9314415)
- [YouTube: recommendation performance](https://support.google.com/youtube/answer/16559650?hl=en)
- [YouTube: end screens](https://support.google.com/youtube/answer/6388789)
- [TikTok Creative Codes](https://ads.tiktok.com/business/en-US/creative-codes)
- [W3C: captions for prerecorded media](https://www.w3.org/WAI/WCAG22/Understanding/captions-prerecorded)
- [W3C: accessible audio and video](https://www.w3.org/WAI/media/av/)
- [Brady et al. (2021): moral outrage expression](https://pubmed.ncbi.nlm.nih.gov/34389534/)
