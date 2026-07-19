from faster_whisper import WhisperModel

model = WhisperModel(
    "small",
    device="cpu",
    compute_type="int8",
)

def transcribe(audio_path):
    print(f"Transcribing: {audio_path}")

    segments, info = model.transcribe(
        audio_path,
        language="en",      # change if needed
        beam_size=5,
        vad_filter=True,
    )

    print("Detected language:", info.language)
    print("Language probability:", info.language_probability)

    texts = []

    for segment in segments:
        print(
            f"[{segment.start:.2f} - {segment.end:.2f}] {segment.text}"
        )
        texts.append(segment.text.strip())

    text = " ".join(texts)

    print("Final transcript:", text)

    return {
        "text": text,
        "language": info.language,
    }
