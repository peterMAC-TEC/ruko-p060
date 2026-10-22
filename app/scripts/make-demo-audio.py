"""Makes the audio for /demo/call from app/data/demo-call-script.json.

Free: Microsoft's natural Indian neural voices through the edge-tts package (pip install edge-tts), then ffmpeg for the
phone-line sound. Run from the repo root:  python app/scripts/make-demo-audio.py
It writes app/public/demo-audio/{en,hi}/<line id>.mp3, a manifest with each clip's length, and a short chime.
The finished files are committed, so the app never needs the internet or these tools to play the demo.

To change how a voice sounds, edit VOICES or FILTERS below and run it again.
"""
import asyncio
import json
import os
import pathlib
import subprocess

import edge_tts

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT / "app" / "public" / "demo-audio"
SCRIPT = json.loads((ROOT / "app" / "data" / "demo-call-script.json").read_text(encoding="utf8"))["lines"]

# lang -> role -> (voice, rate, pitch, volume)
VOICES = {
    "en": {
        "scammer": ("en-IN-PrabhatNeural", "+8%", "-3Hz", "+0%"),
        "kamala": ("en-IN-NeerjaNeural", "-6%", "-5Hz", "-6%"),  # slower and lower: an older, shaken voice
        "ruko": ("en-IN-NeerjaExpressiveNeural", "-8%", "+0Hz", "+0%"),
    },
    "hi": {
        "scammer": ("hi-IN-MadhurNeural", "+6%", "-3Hz", "+0%"),
        "kamala": ("hi-IN-SwaraNeural", "-6%", "-5Hz", "-6%"),
        "ruko": ("hi-IN-SwaraNeural", "-6%", "+4Hz", "+0%"),
    },
}

# What each voice is "heard through". The caller is on a phone line; Kamala is next to the mic; Ruko is clean and warm.
FILTERS = {
    "scammer": "highpass=f=320,lowpass=f=3300,acompressor=threshold=-20dB:ratio=3,volume=1.5",
    "kamala": "vibrato=f=5:d=0.05,lowpass=f=7500",
    "ruko": "equalizer=f=220:t=h:w=120:g=2,lowpass=f=9000",
}
FINISH = "loudnorm=I=-18:TP=-2:LRA=9,apad=pad_dur=0.2"


def ff(*args):
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *args], check=True)


def duration(path: pathlib.Path) -> float:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", str(path)],
        capture_output=True, text=True, check=True,
    ).stdout.strip()
    return round(float(out), 2)


async def speak(text: str, voice: str, rate: str, pitch: str, volume: str, dest: pathlib.Path):
    # The free service sometimes answers 503 for a moment: wait and try again.
    for attempt in range(8):
        try:
            await edge_tts.Communicate(text, voice, rate=rate, pitch=pitch, volume=volume).save(str(dest))
            return
        except Exception as e:  # noqa: BLE001
            print("  retrying after:", type(e).__name__)
            await asyncio.sleep(3 + attempt * 3)
    raise RuntimeError("the voice service did not answer; try again in a few minutes")


async def main():
    manifest = {}
    for lang in ("en", "hi"):
        folder = OUT / lang
        folder.mkdir(parents=True, exist_ok=True)
        manifest[lang] = {}
        for line in SCRIPT:
            voice, rate, pitch, volume = VOICES[lang][line["who"]]
            raw = folder / f"{line['id']}.raw.mp3"
            final = folder / f"{line['id']}.mp3"
            if os.environ.get("SKIP_EXISTING") and final.exists():
                manifest[lang][line["id"]] = duration(final)
                continue
            await speak(line[lang], voice, rate, pitch, volume, raw)
            try:
                ff("-i", str(raw), "-af", f"{FILTERS[line['who']]},{FINISH}", "-ar", "24000", "-ac", "1", "-codec:a", "libmp3lame", "-q:a", "5", str(final))
            except subprocess.CalledProcessError:
                # The loudness filter crashes on a few clips; plain volume is fine for those.
                ff("-i", str(raw), "-af", f"{FILTERS[line['who']]},volume=0.9,apad=pad_dur=0.2", "-ar", "24000", "-ac", "1", "-codec:a", "libmp3lame", "-q:a", "5", str(final))
            raw.unlink()
            manifest[lang][line["id"]] = duration(final)
            print(lang, line["id"], manifest[lang][line["id"]], "s")
    # A soft two-note chime played just before Ruko speaks.
    ff(
        "-f", "lavfi", "-i", "sine=f=660:d=0.22", "-f", "lavfi", "-i", "sine=f=990:d=0.5",
        "-filter_complex", "[0]afade=t=out:st=0.12:d=0.1[a];[1]afade=t=out:st=0.1:d=0.4[b];[a][b]concat=n=2:v=0:a=1,volume=0.35",
        "-ar", "24000", "-codec:a", "libmp3lame", "-q:a", "5", str(OUT / "chime.mp3"),
    )
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=1), encoding="utf8")
    print("done:", OUT)


asyncio.run(main())
