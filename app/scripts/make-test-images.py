# Makes the test images for the photo check (no real agency names, emblems or officers: BNS §204).
# Run: python scripts/make-test-images.py  → public/samples/*.png
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).resolve().parent.parent / "public" / "samples"
OUT.mkdir(parents=True, exist_ok=True)


def font(size, bold=False):
    for name in (["arialbd.ttf", "DejaVuSans-Bold.ttf"] if bold else ["arial.ttf", "DejaVuSans.ttf"]):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            pass
    return ImageFont.load_default()


def warrant():
    img = Image.new("RGB", (900, 1200), "#fbf7ec")
    d = ImageDraw.Draw(img)
    d.rectangle([30, 30, 870, 1170], outline="#7a1f1f", width=6)
    d.ellipse([370, 60, 530, 220], outline="#7a1f1f", width=5)
    d.text((450, 140), "SEAL", fill="#7a1f1f", font=font(34, True), anchor="mm")
    d.text((450, 270), "CENTRAL INVESTIGATION CELL", fill="#111", font=font(40, True), anchor="mm")
    d.text((450, 320), "(DRILL - NOT A REAL AGENCY)", fill="#555", font=font(24), anchor="mm")
    d.text((450, 400), "ARREST WARRANT", fill="#a40000", font=font(56, True), anchor="mm")
    lines = [
        "Case No. CIC/2026/0417",
        "Name: Kamala Iyer",
        "Charge: Money laundering, illegal parcel",
        "linked to your Aadhaar number.",
        "",
        "You are under DIGITAL ARREST.",
        "Stay on the video call. Do not disconnect.",
        "This matter is STRICTLY CONFIDENTIAL.",
        "Do not tell family members or bank staff.",
        "",
        "To avoid jail, transfer your funds to the",
        "RBI Safe Custody Account for verification",
        "within 2 hours. Money will be refunded.",
    ]
    y = 490
    for line in lines:
        d.text((90, y), line, fill="#111", font=font(32, line.isupper() or "ARREST" in line), anchor="la")
        y += 46
    d.text((620, 1100), "Officer-in-charge", fill="#333", font=font(26), anchor="mm")
    img.save(OUT / "fake-warrant.png")


def ordinary():
    img = Image.new("RGB", (900, 700), "#eef6ff")
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([60, 80, 840, 620], radius=30, fill="#ffffff", outline="#c9d6e6", width=3)
    d.text((100, 120), "Message from Priya", fill="#444", font=font(28, True))
    msg = [
        "Hi Ma! Reached office safely.",
        "Will call you at lunch.",
        "Don't forget your 8 pm medicine.",
        "Love you!",
    ]
    y = 200
    for line in msg:
        d.text((100, y), line, fill="#111", font=font(38))
        y += 70
    img.save(OUT / "ordinary-message.png")


warrant()
ordinary()
print("wrote", sorted(p.name for p in OUT.glob("*.png")))
