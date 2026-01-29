# Icon Generation

## Model

**Amazon Titan Image Generator v2** (`amazon.titan-image-generator-v2:0`)
- Region: us-west-2
- Size: 512x512, resized to 144x144 and 96x96

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

## Prompts

Base template:
> A cute purple ghost/octopus mascot character {description}. Dark navy background #1a1a2e. Purple body #9b7ed9, pink cheeks. The character fills the entire image touching all edges. App icon style, square format. No borders.

| Icon | Description |
|------|-------------|
| kiro-focus | looking intently with focused eyes and a magnifying glass |
| kiro-cycle | with colorful circular arrows around it suggesting cycling |
| kiro-alert | looking alert with a small bell nearby |
| kiro-launch | holding a small rocket ship |
| kiro-yes | giving thumbs up with a green checkmark |
| kiro-no | shaking head with a red X mark |
| kiro-trust | thoughtful expression with a lightbulb |
| kiro-agent | with 3 or 4 small floating ghost companions orbiting around it (not touching it). 3D rendered style. |

## Output Files

Each icon has 3 sizes:
- `kiro-{name}.png` - Original 512x512
- `kiro-{name}-144.png` - 144x144 for display
- `kiro-{name}-96.png` - 96x96 for Stream Deck buttons

## Models Tested

| Model | Result |
|-------|--------|
| amazon.nova-2-omni-v1:0 | Inconsistent style, white border issues |
| stability.sd3-5-large-v1:0 | Good quality but different aesthetic |
| amazon.titan-image-generator-v2:0 | **Selected** - Best consistency and style |
