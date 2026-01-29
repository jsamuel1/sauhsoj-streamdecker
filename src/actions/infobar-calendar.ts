import streamDeck from "@elgato/streamdeck";

const NEO_ACTION_UUID = "wtf.sauhsoj.streamdecker.infobar-calendar";

// Track Neo info bar contexts and their intervals
const neoContexts = new Map<string, ReturnType<typeof setInterval>>();

interface NeoEventData {
  action: string;
  event: string;
  context: string;
  payload?: { controller?: string };
}

// Will be set after connection is available
let sendCommand: ((cmd: object) => Promise<void>) | null = null;

async function updateDisplay(context: string): Promise<void> {
  if (!sendCommand) {
    streamDeck.logger.error("[Neo] sendCommand not available");
    return;
  }

  try {
    const now = new Date();
    const hours = now.getHours();
    const mins = now.getMinutes();
    const h12 = hours % 12 || 12;
    const ampm = hours >= 12 ? "PM" : "AM";

    // Try setFeedbackLayout with a built-in layout
    await sendCommand({
      event: "setFeedbackLayout",
      context,
      payload: { layout: "InfobarLayouts/DigitalTime/digital_time_01.sdLayoutEx" },
    });

    // Then setFeedback with the time values
    await sendCommand({
      event: "setFeedback",
      context,
      payload: {
        hour1: { value: h12.toString().padStart(2, "0") },
        min1: { value: mins.toString().padStart(2, "0") },
        am_pm: { value: ampm },
      },
    });

    streamDeck.logger.info(`[Neo] Sent layout+feedback: ${h12}:${mins} ${ampm}`);
  } catch (err) {
    streamDeck.logger.error(`[Neo] Update failed: ${err}`);
  }
}

// Access connection via rollup-injected global
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare let __neo_connection: any;

export function registerNeoHandlers(): void {
  streamDeck.logger.info("[Neo] Registering handlers...");

  // Wait a tick for connection to be initialized
  setTimeout(() => {
    if (__neo_connection) {
      sendCommand = (cmd) => __neo_connection.send(cmd);

      __neo_connection.on("neoEvent", (data: NeoEventData) => {
        streamDeck.logger.info(`[Neo] Received: ${JSON.stringify(data)}`);

        if (data.action !== NEO_ACTION_UUID) return;

        if (data.event === "willAppear") {
          updateDisplay(data.context);
          const id = setInterval(() => updateDisplay(data.context), 30000);
          neoContexts.set(data.context, id);
        }

        if (data.event === "willDisappear") {
          const id = neoContexts.get(data.context);
          if (id) clearInterval(id);
          neoContexts.delete(data.context);
        }
      });

      streamDeck.logger.info("[Neo] Handlers registered");
    } else {
      streamDeck.logger.error("[Neo] __neo_connection not available");
    }
  }, 0);
}
