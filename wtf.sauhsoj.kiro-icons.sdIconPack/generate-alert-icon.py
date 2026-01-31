from PIL import Image, ImageDraw, ImageFont

# Load cycle icon as base
cycle = Image.open('icons/kiro-cycle-96.png').convert('RGBA')

# Create overlay with ?>
overlay = Image.new('RGBA', (96, 96), (0, 0, 0, 0))
draw = ImageDraw.Draw(overlay)

# Draw ?> symbol in bottom right
try:
    font = ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc', 28)
except:
    font = ImageFont.load_default()

# White text with black outline
text = "?>"
x, y = 50, 58
# Outline
for dx, dy in [(-1,-1), (-1,1), (1,-1), (1,1), (-2,0), (2,0), (0,-2), (0,2)]:
    draw.text((x+dx, y+dy), text, font=font, fill=(0, 0, 0, 255))
# Text
draw.text((x, y), text, font=font, fill=(255, 255, 255, 255))

# Composite
result = Image.alpha_composite(cycle, overlay)
result.save('icons/kiro-alert-96.png')

# Also save 144px version
cycle144 = Image.open('icons/kiro-cycle-144.png').convert('RGBA')
overlay144 = Image.new('RGBA', (144, 144), (0, 0, 0, 0))
draw144 = ImageDraw.Draw(overlay144)
try:
    font144 = ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc', 42)
except:
    font144 = ImageFont.load_default()
x, y = 75, 87
for dx, dy in [(-1,-1), (-1,1), (1,-1), (1,1), (-2,0), (2,0), (0,-2), (0,2)]:
    draw144.text((x+dx, y+dy), text, font=font144, fill=(0, 0, 0, 255))
draw144.text((x, y), text, font=font144, fill=(255, 255, 255, 255))
result144 = Image.alpha_composite(cycle144, overlay144)
result144.save('icons/kiro-alert-144.png')

# Base size
result.resize((72, 72), Image.LANCZOS).save('icons/kiro-alert.png')

print("Alert icons generated")
