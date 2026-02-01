# Icon Generation

## Model

**Amazon Titan Image Generator v2** (`amazon.titan-image-generator-v2:0`)
- Region: us-west-2
- Size: 512x512, resized as needed

## Generation Code

```python
import boto3
import base64
import json
from PIL import Image
import io

client = boto3.client('bedrock-runtime', region_name='us-west-2')

request_body = {
    "taskType": "TEXT_IMAGE",
    "textToImageParams": {"text": prompt},
    "imageGenerationConfig": {"numberOfImages": 1, "height": 512, "width": 512}
}

response = client.invoke_model(
    modelId='amazon.titan-image-generator-v2:0',
    body=json.dumps(request_body),
    contentType='application/json',
    accept='application/json'
)

result = json.loads(response['body'].read())
img_bytes = base64.b64decode(result['images'][0])
img = Image.open(io.BytesIO(img_bytes))
```

## App Icon (Streamdecker)

> A cute purple ghost mascot character holding or sitting on a Stream Deck device (small rectangular device with glowing colorful button grid). Dark navy background #1a1a2e. Purple body #9b7ed9, pink cheeks. The character fills most of the image. App icon style, square format. No borders. 3D rendered style.

Output sizes:
- 512x512 (app icon, plugin icon @2x)
- 288x288 (plugin icon)
- 128x128, 64x64, 32x32, 16x16 (for .icns)

## Button Icon Prompts

Base template:
> A cute purple ghost mascot character {description}. Dark navy background #1a1a2e. Purple body #9b7ed9, pink cheeks. The character fills the entire image touching all edges. App icon style, square format. No borders.

| Icon | Description |
|------|-------------|
| kiro-focus | looking intently with focused eyes and a magnifying glass |
| kiro-cycle | with colorful circular arrows around it suggesting cycling |
| kiro-alert | looking alert with a small bell nearby |
| kiro-launch | holding a small rocket ship |
| kiro-yes | giving thumbs up with a green checkmark |
| kiro-no | shaking head with a red X mark |
| kiro-trust | thoughtful expression with a lightbulb |
| kiro-agent | with 3 or 4 small floating ghost companions orbiting around it |
| kiro-switch | with colorful arrows pointing in different directions |

## Output Files

Button icons have 3 sizes:
- `kiro-{name}.png` - Original 512x512
- `kiro-{name}-144.png` - 144x144 for display
- `kiro-{name}-96.png` - 96x96 for Stream Deck buttons

## Resize Script

```bash
# Resize for button icons
for name in focus cycle alert launch yes no trust agent switch; do
  sips -z 144 144 "kiro-${name}.png" --out "kiro-${name}-144.png"
  sips -z 96 96 "kiro-${name}.png" --out "kiro-${name}-96.png"
done

# Resize for app icon
sips -z 512 512 streamdecker-icon.png --out icon-512.png
sips -z 288 288 streamdecker-icon.png --out icon-288.png
sips -z 128 128 streamdecker-icon.png --out icon-128.png
sips -z 64 64 streamdecker-icon.png --out icon-64.png
sips -z 32 32 streamdecker-icon.png --out icon-32.png
sips -z 16 16 streamdecker-icon.png --out icon-16.png
```
