# Chọn giọng: chọn cách kể trước, chọn voice ID sau

Research: **2026-10-04**. “Nam/nữ” và accent chưa đủ quyết định độ hấp dẫn. Cần chọn persona, năng lượng, độ nhanh, điểm nhấn và khoảng nghỉ cho video. Các mapping dưới đây là gợi ý biên tập, không phải giới hạn khả năng một giọng.

## Các kiểu delivery nên có trong thư viện

| Kiểu | Hợp với | Cách diễn đạt / tìm voice | Cần tránh |
| --- | --- | --- | --- |
| Conversational explainer | Docker, coding, khoa học, how-to | `conversational, clear, curious`; như giải thích cho một người bạn | Đều giọng mọi câu, đọc như tài liệu |
| Authoritative documentary | Lịch sử, kinh tế, case study | `grounded, measured, documentary`; chắc nhưng không gằn | Giọng trailer khi chỉ đang giải thích cơ chế |
| Curious / investigative | Tension hook, myth-busting, câu hỏi “tại sao” | Nén câu đầu, nhấn câu hỏi, nghỉ trước bằng chứng | Tạo cảm giác giật gân vượt quá evidence |
| Warm storyteller | Chuyện cá nhân, hành trình, đời sống | `warm, intimate, reflective`; biến thiên nhịp | Chậm đến mức mất động lực câu chuyện |
| Energetic creator | Product reveal, mẹo nhanh, fitness | `upbeat, punchy, confident`; nhấn động từ | Gào và tăng tốc cả video |
| Playful teacher | ABC, trẻ nhỏ, học ngôn ngữ | `friendly, playful, patient`; phát âm rõ, nghỉ cho trẻ phản hồi | Giọng em bé giả, hiệu ứng che âm chữ |
| Deadpan / dry humor | Debug fail, meme, so sánh nghịch lý | `dry, understated`; giữ bình tĩnh trước punchline | Cường điệu làm mất joke; sarcasm không rõ với trẻ |
| News / neutral presenter | Tóm tắt tin, số liệu, update | `neutral, crisp, factual`; đọc số đơn vị nhất quán | Khô như đọc bảng; dùng accent khó hiểu với audience |
| Calm / meditative | Relax, sleep, self-care | `gentle, slow, soothing`; câu thưa, mềm | Dùng cho tutorial nhiều thông tin cần nhịp nhanh |
| Whisper / ASMR | ASMR, ambience, trải nghiệm gần | `soft, breathy, intimate`; nghe bằng headphone | Nhầm “giọng nữ” với ASMR; quá nhỏ trên loa điện thoại |
| Character dialogue | Skit, roleplay, kể chuyện nhiều vai | Hai voice phân biệt + nhịp đối đáp; tách WAV từng vai | Đổi accent/persona tùy tiện; clone người không được phép |
| Cinematic / trailer | Teaser, game, climax ngắn | `dramatic, cinematic`; khoảng nghỉ lớn, câu ít | Dùng toàn video giáo dục; bass làm mờ chữ |

## Provider đang có: chọn theo nhu cầu

| Lựa chọn | Điểm đáng dùng | Kiểm soát / hạn chế | Chi phí và quyền dùng |
| --- | --- | --- | --- |
| **Kokoro-82M** | Local nhỏ, hợp thử nhiều narrator cho video tiếng Anh | Voice ID, speed, text/punctuation; không có API emotion/SSML chính thức trong KPipeline. Tiếng Việt không nằm trong danh sách chính thức | Weights Apache-2.0; không phí API khi chạy local. [Model](https://huggingface.co/hexgrad/Kokoro-82M), [voices](https://huggingface.co/hexgrad/Kokoro-82M/blob/main/VOICES.md) |
| **Qwen3-TTS** | Voice design bằng mô tả và voice cloning; đáng thử khi persona quan trọng | Model/variant chọn theo voice design/custom voice/base; 10 ngôn ngữ theo báo cáo, không mặc định tiếng Việt; nặng hơn Kokoro. Chưa test máy này | Apache-2.0 theo [repo](https://github.com/QwenLM/Qwen3-TTS) và [technical report](https://arxiv.org/abs/2601.15621) |
| **Chatterbox** | Cloning và expressive speech; các variant phục vụ nhu cầu khác nhau | Emotion exaggeration ở model phù hợp; Turbo có paralinguistic tags. Không coi tất cả controls đều có ở mọi variant; chưa runtime-test | MIT code; kiểm tra model/variant cụ thể, reference audio và watermark. [Repo chính thức](https://github.com/resemble-ai/chatterbox) |
| **Piper hiện tại** | Narration local gọn, automation/offline | Chất lượng và ngôn ngữ tùy voice model; ít hướng diễn xuất | Engine hiện tại GPL-3.0; license voice model riêng. [OHF repo](https://github.com/OHF-Voice/piper1-gpl) |
| **ElevenLabs** | Nhiều voice, các model expressive và voice design; phù hợp creator/story/skit | Chọn model theo ngôn ngữ/control. v3/v4 có audio tags; không dùng SSML break như v2/Flash. Kiểm tra docs trước khi gọi | Free không có commercial license; nội dung tạo trên free phải đáp ứng attribution. Paid có điều kiện commercial. [Models](https://elevenlabs.io/docs/overview/models), [TTS controls](https://elevenlabs.io/docs/eleven-creative/playground/text-to-speech), [license](https://help.elevenlabs.io/hc/en-us/articles/13313564601361-Can-I-publish-the-content-I-generate-on-the-platform) |
| **Azure Speech** | Narration kiểm soát nhịp bằng SSML, nhiều locale | Rate/pitch/volume; speaking styles phụ thuộc voice. Phải kiểm tra supported style/locale của voice | Cloud có billing/quota, không mặc định miễn phí production. [SSML voice/style](https://learn.microsoft.com/en-us/azure/cognitive-services/speech-service/speech-synthesis-markup-voice) |
| **Google Cloud TTS / Chirp 3 HD** | Voice catalog rộng; hợp narration đa ngôn ngữ | Khả năng control tùy model, không giả định mọi voice hỗ trợ cùng SSML | Cloud billing/quota. [Chirp 3 HD](https://docs.cloud.google.com/text-to-speech/docs/chirp3-hd), [voice catalog](https://cloud.google.com/text-to-speech/docs/voices) |
| **FPT.AI Voice Maker** | Lựa chọn tiếng Việt Bắc/Trung/Nam, nam/nữ | Test accent và từ tiếng Anh chen trong tiếng Việt; UI/API riêng | Có đường thử; xem quota và quyền commercial của gói trước dùng. [Product](https://fpt.ai/products/fpt-ai-voice-maker/), [voice regions](https://fpt.ai/blogs/how-convert-text-speech-using-new-interface-fptai-voice-maker/) |

Không có “giọng tốt nhất cho mọi chủ đề”. Giọng nghe đẹp vẫn có thể đọc Docker/CoW/SQL sai, hoặc diễn đạt quá đều. Không lấy thứ hạng vendor làm bằng chứng chất lượng độc lập. Các provider ngoài Kokoro chưa được cài/tích hợp trong workflow hiện tại.

## Kokoro: bộ audition có sẵn

| Nhóm | ID nghe thử | Cách so sánh |
| --- | --- | --- |
| American female | `af_heart`, `af_bella`, `af_nicole` | So sự rõ chữ, nhấn câu hỏi, độ gần gũi; `af_heart` là baseline video đang dùng |
| American male | `am_michael`, `am_fenrir`, `am_puck` | So độ rõ phụ âm, tốc độ tự nhiên, chất giọng hợp brand |
| British female / male | `bf_emma`, `bm_george` | So accent và thuật ngữ với audience; tránh chỉ chọn vì “nghe sang” |

Các ID và family được kiểm tra từ [voice list chính thức](https://huggingface.co/hexgrad/Kokoro-82M/blob/main/VOICES.md). Tag giới tính/accent mô tả family; persona phải xác định bằng nghe. Các mẫu dùng cùng [text](audition-text.txt), cùng tốc độ và sample rate. Chưa có đánh giá thính giác độc lập cho các mẫu này.

Audition text mô tả tình huống **first write có thể copy cả file**: đó là hook thử giọng, không phải khẳng định mọi storage driver luôn copy toàn file. Script video thật cần giữ điều kiện kỹ thuật đã research.

## Làm giọng bớt “AI đọc bài”

1. Viết cho miệng: câu ngắn, mỗi câu một ý; có câu hỏi, tương phản và payoff. Không đọc bullet dài thành một hơi.
2. Đánh dấu intent trong audio brief: `curious hook → clear explanation → confident payoff`. Với Kokoro, intent hướng dẫn cách sửa text/nhịp; không chèn tag `[excited]` vì có thể bị đọc thành lời.
3. Test đoạn 10–20 giây gồm hook, thuật ngữ và số liệu. Chấm 1–5: rõ chữ, tự nhiên, đúng phát âm, hợp persona, hợp audience; dùng cùng text khi so provider.
4. Thử speed gần `0.95–1.05` như điểm bắt đầu; không dùng tăng tốc để chữa script dài. Đây là gợi ý biên tập, không preset chuẩn cho mọi voice.
5. Sửa pronunciation text riêng với caption. Tách abbreviation nếu cần; nghe lại để tránh lỗi đọc lặp “A A”.
6. Tạo WAV mỗi scene, nghe raw voice trước; sau đó nghe voice + nhạc trên loa điện thoại và headphone. Nhạc không chữa được cadence yếu.
7. Đổi voice/speed/text phải tạo lại WAV và đo timing. Không reuse sample cũ khi script khác; chỉ reuse model cache và voice choice.

Đọc [skill Kokoro](../.agent/skills/kokoro-tts/SKILL.md) trước implementation; [README thư viện](README.md) có lệnh audition và cách đưa media vào project.
