"""
Local XTTS v2 TTS server for the Horror Pipeline.

Replaces ElevenLabs with a free, self-hosted voice cloning model.
Drop a reference WAV file into tts/voices/ and set TTS_REFERENCE_VOICE.

Requires Python 3.11 (Coqui TTS does not support 3.12+).

Usage:
    cd tts
    brew install python@3.11
    python3.11 -m venv .venv
    source .venv/bin/activate
    pip install -r requirements.txt
    python server.py
"""

import os
import wave
import uuid

# Auto-accept Coqui CPML license (non-commercial) so the server can start unattended.
os.environ.setdefault("COQUI_TOS_AGREED", "1")

import torch
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from TTS.api import TTS

app = FastAPI(title="Horror Pipeline TTS")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

REFERENCE_VOICE = os.environ.get(
    "TTS_REFERENCE_VOICE", os.path.join(os.path.dirname(__file__), "voices", "reference.wav")
)
OUTPUT_DIR = os.environ.get("OUTPUT_DIR", os.path.join(os.path.dirname(__file__), "..", "output"))
TTS_MODEL = "tts_models/multilingual/multi-dataset/xtts_v2"

tts_engine: TTS | None = None


class SynthesizeRequest(BaseModel):
    text: str
    output_id: str = ""
    language: str = "en"


@app.on_event("startup")
def load_model():
    global tts_engine
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Loading XTTS v2 on {device}...")
    tts_engine = TTS(TTS_MODEL).to(device)
    print("XTTS v2 loaded.")


@app.post("/synthesize")
def synthesize(req: SynthesizeRequest):
    if tts_engine is None:
        raise HTTPException(status_code=503, detail="TTS model not loaded yet")

    if not os.path.isfile(REFERENCE_VOICE):
        raise HTTPException(
            status_code=500,
            detail=f"Reference voice file not found: {REFERENCE_VOICE}. "
            "Place a short WAV clip in tts/voices/reference.wav",
        )

    output_id = req.output_id or str(uuid.uuid4())
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    output_path = os.path.join(OUTPUT_DIR, f"{output_id}-narration.wav")

    tts_engine.tts_to_file(
        text=req.text,
        speaker_wav=REFERENCE_VOICE,
        language=req.language,
        file_path=output_path,
    )

    # Read actual duration from generated WAV
    with wave.open(output_path, "r") as wf:
        frames = wf.getnframes()
        rate = wf.getframerate()
        duration = frames / float(rate)

    return {
        "audioUrl": f"/output/{output_id}-narration.wav",
        "audioFilePath": os.path.abspath(output_path),
        "durationSeconds": round(duration),
        "characterCount": len(req.text),
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
        "model_loaded": tts_engine is not None,
        "device": "cuda" if torch.cuda.is_available() else "cpu",
        "reference_voice": REFERENCE_VOICE,
        "reference_exists": os.path.isfile(REFERENCE_VOICE),
    }


if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("TTS_PORT", "8321"))
    print(f"Starting TTS server on port {port}...")
    uvicorn.run(app, host="0.0.0.0", port=port)
