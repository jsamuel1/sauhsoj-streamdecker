#!/usr/bin/env python3
"""
Generate menubar icon for Kiro Deck.
Creates a simplified ghost mascot with transparent background from existing icon.
"""

from PIL import Image
import os

ICON_DIR = os.path.dirname(os.path.abspath(__file__))
SOURCE_PATH = os.path.join(ICON_DIR, "icons", "kiro-focus.png")
OUTPUT_DIR = os.path.join(ICON_DIR, "icons")

def create_menubar_icon():
    """Create menubar icon from existing kiro-focus icon."""
    img = Image.open(SOURCE_PATH).convert("RGBA")
    
    # Get pixel data
    pixels = img.load()
    width, height = img.size
    
    # Create new image with transparent background
    new_img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    new_pixels = new_img.load()
    
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            
            # Detect the purple ghost (not dark background)
            # Background is dark navy ~#1a1a2e (26, 26, 46)
            is_background = r < 60 and g < 60 and b < 80
            
            if not is_background:
                # Convert to white silhouette for menubar
                # Use luminance to determine opacity
                lum = (r + g + b) / 3
                alpha = min(255, int(lum * 1.5))
                new_pixels[x, y] = (255, 255, 255, alpha)
    
    # Resize for menubar (22x22 standard, 44x44 retina)
    img_22 = new_img.resize((22, 22), Image.Resampling.LANCZOS)
    img_44 = new_img.resize((44, 44), Image.Resampling.LANCZOS)
    
    # Save
    img_22.save(os.path.join(OUTPUT_DIR, "kiro-menubar.png"), "PNG")
    img_44.save(os.path.join(OUTPUT_DIR, "kiro-menubar@2x.png"), "PNG")
    
    print(f"Created: {os.path.join(OUTPUT_DIR, 'kiro-menubar.png')}")
    print(f"Created: {os.path.join(OUTPUT_DIR, 'kiro-menubar@2x.png')}")

if __name__ == "__main__":
    create_menubar_icon()
