"""Records the live call's scripted lines (data/live-lines.json, made by scripts/dump-live-lines.ts).

Free: Microsoft's natural Indian neural voices through the edge-tts package, then ffmpeg for the phone-line sound, the
same way as scripts/make-demo-audio.py. Writes app/public/live-audio/{en,hing}/<key>.mp3 and manifest.json (key -> seconds).
Run from the repo root:  python app/scripts/make-live-audio.py     (SKIP_EXISTING=1 keeps clips already made)
The finished files are committed, so the app never needs the internet or these tools to play them.
Hinglish (Hindi in Roman letters) is read by the Indian English voice, which pronounces it better than the Hindi voice does.
"""
import asyncio, json, os, pathlib, subprocess
import edge_tts

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT / "app" / "public" / "live-audio"
LINES = json.loads((ROOT / "app" / "data" / "live-lines.json").read_text(encoding="utf8"))

# role -> (voice, rate, pitch, volume): the officer is lower and steady; Ruko is warm and slower.
VOICES = {"officer": ("en-IN-PrabhatNeural", "+2%", "-5Hz", "+0%"), "ruko": ("en-IN-NeerjaExpressiveNeural", "-8%", "+0Hz", "+0%")}
FILTERS = {
    "officer": "highpass=f=300,lowpass=f=3400,acompressor=threshold=-20dB:ratio=3,volume=1.5",
    "ruko": "equalizer=f=220:t=h:w=120:g=2,lowpass=f=9000",
}
FINISH = "loudnorm=I=-18:TP=-2:LRA=9,apad=pad_dur=0.15"


def ff(*a):
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *a], check=True)


def duration(p):
    return round(float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", str(p)], capture_output=True, text=True, check=True).stdout.strip()), 2)


async def speak(text, voice, rate, pitch, volume, dest):
    for attempt in range(8):
        try:
            await edge_tts.Communicate(text, voice, rate=rate, pitch=pitch, volume=volume).save(str(dest))
            return
        except Exception as e:  # noqa: BLE001
            print("  retrying after:", type(e).__name__)
            await asyncio.sleep(3 + attempt * 3)
    raise RuntimeError("the voice service did not answer; try again in a few minutes")


async def main():
    manifest = {"en": {}, "hing": {}}
    for ln in LINES:
        folder = OUT / ln["lang"]
        folder.mkdir(parents=True, exist_ok=True)
        raw, final = folder / f"{ln['key']}.raw.mp3", folder / f"{ln['key']}.mp3"
        if os.environ.get("SKIP_EXISTING") and final.exists():
            manifest[ln["lang"]][ln["key"]] = duration(final)
            continue
        voice, rate, pitch, volume = VOICES[ln["role"]]
        await speak(ln["text"], voice, rate, pitch, volume, raw)
        try:
            ff("-i", str(raw), "-af", f"{FILTERS[ln['role']]},{FINISH}", "-ar", "24000", "-ac", "1", "-codec:a", "libmp3lame", "-q:a", "5", str(final))
        except subprocess.CalledProcessError:
            ff("-i", str(raw), "-af", f"{FILTERS[ln['role']]},volume=0.9,apad=pad_dur=0.15", "-ar", "24000", "-ac", "1", "-codec:a", "libmp3lame", "-q:a", "5", str(final))
        raw.unlink()
        manifest[ln["lang"]][ln["key"]] = duration(final)
        print(ln["lang"], ln["key"], manifest[ln["lang"]][ln["key"]], "s", flush=True)
    (OUT / "manifest.json").write_text(json.dumps(manifest), encoding="utf8")
    print("done:", OUT)


asyncio.run(main())
