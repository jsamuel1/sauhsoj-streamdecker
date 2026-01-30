import sharp from 'sharp';

const WIDTH = 248;
const HEIGHT = 58;
const BG = '#18181b';

/** Render info bar image */
export async function renderInfoBar(
  text: string,
  accentColor = '#9046ff'
): Promise<Buffer> {
  const svg = `
    <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${WIDTH}" height="${HEIGHT}" fill="${BG}"/>
      <rect width="4" height="${HEIGHT}" fill="${accentColor}"/>
      <text x="12" y="${HEIGHT / 2 + 5}" font-family="Arial" font-size="16" fill="#fff">
        ${escapeXml(text.slice(0, 30))}
      </text>
    </svg>
  `;
  // Neo LCD needs RGBA format, 248x58x4 = 57536 bytes
  return sharp(Buffer.from(svg))
    .resize(WIDTH, HEIGHT)
    .ensureAlpha()
    .raw()
    .toBuffer();
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
