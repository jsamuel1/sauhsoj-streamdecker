/** Execute AppleScript and return output */
export async function runAppleScript(script: string): Promise<string> {
  const proc = Bun.spawn(['osascript', '-e', script], { stdout: 'pipe', stderr: 'pipe' });
  const output = await new Response(proc.stdout).text();
  await proc.exited;
  return output.trim();
}

/** Send keystroke to frontmost app */
export async function sendKeystroke(key: string): Promise<void> {
  await runAppleScript(`tell application "System Events" to keystroke "${key}"`);
}

/** Focus/activate an application */
export async function focusApp(appName: string): Promise<void> {
  await runAppleScript(`tell application "${appName}" to activate`);
}
