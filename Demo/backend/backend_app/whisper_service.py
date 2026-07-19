from faster_whisper import WhisperModel
import os

model = WhisperModel(
    "small",
    device="cpu",
    compute_type="int8",
)

def transcribe(audio_path):
    print("=" * 60)
    print("Audio:", audio_path)
    print("Exists:", os.path.exists(audio_path))
    print("Size:", os.path.getsize(audio_path), "bytes")

    segments, info = model.transcribe(
    audio_path,
    language="en",
    beam_size=5,
    vad_filter=False,)

    print("Detected language:", info.language)
    print("Probability:", info.language_probability)

    texts = []

    for segment in segments:
        print(
            f"{segment.start:.2f} -> {segment.end:.2f}: {segment.text}"
        )
        texts.append(segment.text.strip())

    text = " ".join(texts)

    print("Transcript:", repr(text))
    print("=" * 60)

    return {
        "text": text,
        "language": info.language,
    }
