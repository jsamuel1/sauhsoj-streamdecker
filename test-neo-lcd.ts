import { openStreamDeck, listStreamDecks } from '@elgato-stream-deck/node'

async function main() {
  const devices = await listStreamDecks()
  console.log('Found devices:', devices.length)
  
  for (const dev of devices) {
    console.log(`- ${dev.model} (${dev.path})`)
  }

  if (devices.length === 0) {
    console.log('No Stream Deck found')
    return
  }

  // Find Neo
  const neoInfo = devices.find(d => d.model === 'neo')
  if (!neoInfo) {
    console.log('No Neo found')
    return
  }

  const deck = await openStreamDeck(neoInfo.path)
  console.log(`Opened: ${deck.MODEL}`)

  // Create a simple test image (248x58, RGBA)
  const width = 248
  const height = 58
  const buffer = new Uint8Array(width * height * 4)

  // Fill with purple gradient
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      buffer[i] = 155     // R - purple
      buffer[i + 1] = 89  // G
      buffer[i + 2] = 182 // B
      buffer[i + 3] = 255 // A
    }
  }

  // Draw "KIRO" text area (white rectangle in center)
  const textX = 80, textY = 15, textW = 88, textH = 28
  for (let y = textY; y < textY + textH; y++) {
    for (let x = textX; x < textX + textW; x++) {
      const i = (y * width + x) * 4
      buffer[i] = 255     // White
      buffer[i + 1] = 255
      buffer[i + 2] = 255
      buffer[i + 3] = 255
    }
  }

  console.log('Sending image to LCD...')
  await deck.fillLcd(0, buffer, { format: 'rgba' })
  console.log('Done! Check your Neo info bar.')

  // Keep running for a moment
  await new Promise(r => setTimeout(r, 5000))
  
  deck.close()
}

main().catch(console.error)
