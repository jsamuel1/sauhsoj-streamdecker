import streamDeck from "@elgato/streamdeck";

import { FocusKiroAction } from "./actions/focus-kiro.js";
import { LaunchKiroCliAction } from "./actions/launch-kiro.js";
import { SwitchAgentAction } from "./actions/switch-agent.js";
import { SendYesAction } from "./actions/send-yes.js";
import { SendNoAction } from "./actions/send-no.js";
import { SendThinkingAction } from "./actions/send-thinking.js";
import { setActiveTerminal } from "./kiro-utils.js";

// Register all actions
streamDeck.actions.registerAction(new FocusKiroAction());
streamDeck.actions.registerAction(new LaunchKiroCliAction());
streamDeck.actions.registerAction(new SwitchAgentAction());
streamDeck.actions.registerAction(new SendYesAction());
streamDeck.actions.registerAction(new SendNoAction());
streamDeck.actions.registerAction(new SendThinkingAction());

// Monitor terminal apps
streamDeck.system.onApplicationDidLaunch((ev) => {
  streamDeck.logger.info(`Terminal launched: ${ev.application}`);
  setActiveTerminal(ev.application);
});

streamDeck.system.onApplicationDidTerminate((ev) => {
  streamDeck.logger.info(`Terminal terminated: ${ev.application}`);
  setActiveTerminal(null);
});

// Connect to Stream Deck
streamDeck.connect();
