#!/usr/bin/env python3
"""
Generate all icon sizes from a master PNG.
Usage: Place your master image as 'icon-master.png' in this folder, then run:
       python generate-icons.py
"""
from PIL import Image
import os

MASTER = "icon-master.png"
SIZES = {
    "icon-192.png": 192,
    "icon-512.png": 512,
    "apple-touch-icon.png": 180,
    "icon-1024.png": 1024,
}

if not os.path.exists(MASTER):
    print(f"ERROR: {MASTER} not found!")
    print("Please copy your master icon image as 'icon-master.png' into this folder.")
    exit(1)

img = Image.open(MASTER).convert("RGBA")

# Make square if not already
w, h = img.size
if w != h:
    size = max(w, h)
    new = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    new.paste(img, ((size - w) // 2, (size - h) // 2))
    img = new

for filename, px in SIZES.items():
    resized = img.resize((px, px), Image.LANCZOS)
    resized.save(filename)
    print(f"Generated {filename} ({px}x{px})")

print("Done! Now commit & push these files to GitHub.")
