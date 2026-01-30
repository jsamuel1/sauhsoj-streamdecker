#!/usr/bin/env python3
"""
Generate menubar icon for Kiro Deck.
Simple white ghost with thin black outline.
"""

from PIL import Image, ImageDraw
import os

ICON_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(ICON_DIR, "icons")

def create_menubar_icon():
    """Create simple ghost icon for menubar."""
    
    # Draw a simple ghost shape at 44x44
    size = 44
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Ghost body - rounded top, wavy bottom
    # Main body outline
    outline_color = (0, 0, 0, 255)
    fill_color = (255, 255, 255, 255)
    
    # Draw filled ghost shape
    # Head (ellipse)
    draw.ellipse([8, 4, 36, 28], fill=fill_color, outline=outline_color, width=2)
    
    # Body (rectangle connecting to head)
    draw.rectangle([8, 16, 36, 36], fill=fill_color)
    draw.line([8, 16, 8, 36], fill=outline_color, width=2)
    draw.line([36, 16, 36, 36], fill=outline_color, width=2)
    
    # Wavy bottom - 3 bumps
    draw.ellipse([6, 30, 18, 42], fill=fill_color, outline=outline_color, width=2)
    draw.ellipse([15, 30, 29, 42], fill=fill_color, outline=outline_color, width=2)
    draw.ellipse([26, 30, 38, 42], fill=fill_color, outline=outline_color, width=2)
    
    # Cover internal lines with white
    draw.rectangle([10, 18, 34, 32], fill=fill_color)
    
    # Eyes - two black dots
    draw.ellipse([14, 14, 19, 19], fill=outline_color)
    draw.ellipse([25, 14, 30, 19], fill=outline_color)
    
    # Save both sizes
    img_22 = img.resize((22, 22), Image.Resampling.LANCZOS)
    
    img_22.save(os.path.join(OUTPUT_DIR, "kiro-menubar.png"), "PNG")
    img.save(os.path.join(OUTPUT_DIR, "kiro-menubar@2x.png"), "PNG")
    
    print(f"Created: {os.path.join(OUTPUT_DIR, 'kiro-menubar.png')}")
    print(f"Created: {os.path.join(OUTPUT_DIR, 'kiro-menubar@2x.png')}")

if __name__ == "__main__":
    create_menubar_icon()
