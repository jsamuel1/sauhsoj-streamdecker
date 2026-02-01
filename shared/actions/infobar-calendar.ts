// Neo info bar is only available in standalone mode (kiro-deck app)
// This file is kept for compatibility but the functionality is disabled in the Elgato plugin
// Use kiro-deck standalone mode for full Neo LCD support

import streamDeck from "@elgato/streamdeck";

export function registerNeoHandlers(): void {
  streamDeck.logger.info("[Neo] Info bar disabled in plugin mode - use standalone kiro-deck app");
}
