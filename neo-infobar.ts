import { openStreamDeck, listStreamDecks } from '@elgato-stream-deck/node'
import { createCanvas } from 'canvas'
import { execSync } from 'child_process'
import { readFileSync, existsSync } from 'fs'

const WIDTH = 248
const HEIGHT = 58
const TASKS_FILE = process.env.HOME + '/.kiro/infobar-tasks.txt'

// Kiro brand colors
const KIRO = {
  purple: '#9046ff',
  purpleLight: '#c6a0ff',
  bgDark: '#18181b',
  bgDeep: '#211d25',
  white: '#ffffff',
  gray: '#938f9b',
  green: '#80ffb5',
  blue: '#8dc8fb',
  pink: '#ffafd1',
  red: '#ff8080',
}

function getCalendarInfo(): { text: string; type: 'meeting' | 'upcoming' | null } {
  try {
    const now = execSync('icalBuddy -n -nc -nrd -ea -df "" -tf "%H:%M" -li 1 eventsNow 2>/dev/null', { encoding: 'utf8' }).trim()
    if (now) return { text: now, type: 'meeting' }
    const upcoming = execSync('icalBuddy -n -nc -nrd -ea -df "" -tf "%H:%M" -li 1 eventsFrom:now to:"+2h" 2>/dev/null', { encoding: 'utf8' }).trim()
    if (upcoming) return { text: upcoming, type: 'upcoming' }
  } catch {}
  return { text: '', type: null }
}

function getTask(): string {
  try {
    if (!existsSync(TASKS_FILE)) return ''
    const lines = readFileSync(TASKS_FILE, 'utf8').split('\n').filter(l => l.trim())
    if (lines.length === 0) return ''
    return lines[Math.floor(Math.random() * lines.length)]
  } catch { return '' }
}

function renderImage(text: string, icon: string, accentColor: string): Uint8Array {
  const canvas = createCanvas(WIDTH, HEIGHT)
  const ctx = canvas.getContext('2d')

  // Dark background
  ctx.fillStyle = KIRO.bgDark
  ctx.fillRect(0, 0, WIDTH, HEIGHT)

  // Accent bar on left
  ctx.fillStyle = accentColor
  ctx.fillRect(0, 0, 4, HEIGHT)

  // Icon
  ctx.font = '22px Arial'
  ctx.fillStyle = accentColor
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText(icon, 12, HEIGHT / 2)

  // Text
  ctx.font = '16px Arial'
  ctx.fillStyle = KIRO.white
  const maxWidth = WIDTH - 52
  let displayText = text
  while (ctx.measureText(displayText).width > maxWidth && displayText.length > 0) {
    displayText = displayText.slice(0, -1)
  }
  if (displayText !== text) displayText += '…'
  ctx.fillText(displayText, 44, HEIGHT / 2)

  const imageData = ctx.getImageData(0, 0, WIDTH, HEIGHT)
  return new Uint8Array(imageData.data.buffer)
}

async function main() {
  const devices = await listStreamDecks()
  const neoInfo = devices.find(d => d.model === 'neo')
  if (!neoInfo) { console.log('No Neo found'); return }

  const deck = await openStreamDeck(neoInfo.path)
  console.log('Neo LCD updater started')

  const update = async () => {
    let text: string, icon: string, accent: string

    const cal = getCalendarInfo()
    if (cal.type === 'meeting') {
      text = cal.text; icon = '📅'; accent = KIRO.red
    } else if (cal.type === 'upcoming') {
      text = cal.text; icon = '⏰'; accent = KIRO.blue
    } else {
      const task = getTask()
      if (task) {
        text = task; icon = '📋'; accent = KIRO.green
      } else {
        text = 'Ready'; icon = '✨'; accent = KIRO.purple
      }
    }

    const buffer = renderImage(text, icon, accent)
    await deck.fillLcd(0, buffer, { format: 'rgba' })
  }

  await update()
  setInterval(update, 30000)

  process.on('SIGINT', () => { deck.close(); process.exit() })
}

main().catch(console.error)
