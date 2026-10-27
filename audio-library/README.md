# Thư viện audio dùng chung

Research cập nhật **2026-10-04**. Dùng cho mọi `projects/NNN-slug`, độc lập renderer và môi trường Kokoro dùng chung.

Chọn giọng: đọc [giọng đọc](VOICE_GUIDE.md). Chọn nhạc/ambience/SFX: đọc phần liên quan trong [background guide](BACKGROUND_GUIDE.md). Không cần đọc cả hai cho mỗi lần sửa mix. Mở **[listen.html](listen.html)** để nghe file local; không cần cài UI/server.

Đây là taxonomy thực dụng cho video, không phải toàn bộ thể loại âm nhạc trên thế giới. Gợi ý “hợp chủ đề” là quyết định biên tập; sample cần được nghe với script thật trước khi chọn.

## Có gì ở đây?

```text
audio-library/
├── VOICE_GUIDE.md             # Persona, provider, cách chọn và chỉnh delivery
├── BACKGROUND_GUIDE.md        # Loại nhạc, keyword, nguồn, cách mix
├── catalog.json              # ID, tag, URL, license, metadata, checksum
├── listen.html               # Nghe / lọc file local và xem credit
├── audition-text.txt         # Đoạn tiếng Anh giống nhau cho các sample
├── licenses/                 # Credit từng bài + evidence nguồn lúc tải
└── files/
    ├── music/                # Bản gốc nhạc tải từ nguồn
    ├── voice-samples/        # Mẫu Kokoro để chọn giọng
    ├── ambience/             # Dự phòng cho gió, mưa, room tone…
    └── sfx/                  # Dự phòng cho pop, bubble, whoosh…
```

Catalog khởi đầu có **6 lựa chọn nhạc và 8 voice ID**. Trạng thái thực tế xem bằng lệnh `list` hoặc trang nghe thử; folder ambience/SFX chưa có file bên ngoài. Các nguồn bổ sung có trong guide.

## Tìm, tải và nghe nhanh

Chạy từ root, dùng Python 3 và `ffprobe` hiện có:

```console
python3 tools/audio-kokoro/library.py list
python3 tools/audio-kokoro/library.py list --tag tech
python3 tools/audio-kokoro/library.py fetch cipher deliberate-thought chill-wave
python3 tools/audio-kokoro/library.py fetch carefree monkeys-spinning-monkeys investigations
```

`fetch` chỉ hỗ trợ các URL Incompetech đã curate. File có checksum đúng sẽ được dùng lại, không tải lại. File bị thay đổi hoặc chưa được xác minh sẽ báo lỗi để tránh ghi đè. Mỗi file mới được `ffprobe` kiểm tra và ghi duration/checksum. Chạy một tiến trình cập nhật catalog mỗi lần.

Tạo hoặc dùng lại sample bằng môi trường Kokoro đã cài:

```console
.venv-kokoro/bin/python tools/audio-kokoro/voice_samples.py
.venv-kokoro/bin/python tools/audio-kokoro/voice_samples.py --voices am_michael af_bella
python3 tools/audio-kokoro/library.py index
```

Lần đầu một voice có thể cần tải weights. Sample dùng `speed=1.0`, 24 kHz, cùng text; không tự kéo dài/normalize timing vì cần so sánh delivery thực. Tốc độ thấp/cao hơn nên thử sau khi đã chọn giọng.

## Dùng trong một video

1. Chọn voice/style và 2–3 bài ứng viên phù hợp ở Phase 2; ghi ID trong audio brief. Nghe cùng narration thật trước khi quyết định.
2. Phase 3 tạo narration mới từ **script đã approve**, mỗi scene một WAV. Sample trong thư viện chỉ để audition. Đổi voice yêu cầu đo lại duration và caption/timeline.
3. Copy nhạc đã chọn vào project để project tự chứa media; giữ bản gốc trong library. Ví dụ từ root:

```console
mkdir -p projects/NNN-topic/assets/music
cp audio-library/files/music/chill-wave.mp3 projects/NNN-topic/assets/music/
cp audio-library/licenses/chill-wave.md projects/NNN-topic/assets/music/
```

4. Ghi source, catalog ID, checksum, license, credit và các chỉnh sửa vào asset/report của project. Dùng `video revise`, đặt `production.json.audio.music.file` và gain/fade, rồi preflight/preview/final. **Copy file không tự đổi soundtrack**; cần cấu hình track được chọn.
5. Lưu trim/loop/fade hoặc mix riêng trong project, không sửa bản gốc chung. Credit phải đi vào mô tả video khi publish, không chỉ nằm trong repo.

Thư viện phục vụ dùng nội bộ. Stock từ Mixkit/Pixabay có hạn chế phân phối file độc lập; không mặc định đưa toàn bộ folder binary lên repo công khai. Các bài Incompetech ở đây yêu cầu credit CC BY 4.0; xem source record từng bài.

## Thêm file mới

Tải qua trang chính thức, lưu vào `files/<kind>/`, tạo record riêng trong `licenses/`, thêm entry vào `catalog.json` theo entry cùng loại, rồi chạy `index`. Ghi `sourcePage`, creator, license/link, attribution, tags, suggestedUse, caution, localPath, duration và checksum. Lưu certificate nếu nhà cung cấp cấp; không trộn license giữa các provider.

Ví dụ metadata/checksum cho file tải thủ công:

```console
ffprobe -v error -show_format -show_streams -of json audio-library/files/ambience/your-file.wav
shasum -a 256 audio-library/files/ambience/your-file.wav
```

Không có account/API trả phí mới được gọi; các provider ngoài Kokoro trong guide là lựa chọn nghiên cứu, chưa được tích hợp/runtime-test.
