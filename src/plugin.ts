import streamDeck from "@elgato/streamdeck";

import { FocusKiroAction } from "./actions/focus-kiro.js";
import { LaunchKiroCliAction } from "./actions/launch-kiro.js";
import { LaunchKiroFolderAction } from "./actions/launch-kiro-folder.js";
import { CycleKiroTabsAction } from "./actions/cycle-kiro-tabs.js";
import { NextAlertTabAction } from "./actions/next-alert-tab.js";
import { SwitchAgentAction } from "./actions/switch-agent.js";
import { SwitchAgentPersonalityAction } from "./actions/switch-agent-personality.js";
import { KiroStatusAction } from "./actions/kiro-status.js";
import { SendYesAction } from "./actions/send-yes.js";
import { SendNoAction } from "./actions/send-no.js";
import { SendThinkingAction } from "./actions/send-thinking.js";
import { setActiveTerminal } from "./kiro-utils.js";

// Register all actions
streamDeck.actions.registerAction(new FocusKiroAction());
streamDeck.actions.registerAction(new LaunchKiroCliAction());
streamDeck.actions.registerAction(new LaunchKiroFolderAction());
streamDeck.actions.registerAction(new CycleKiroTabsAction());
streamDeck.actions.registerAction(new NextAlertTabAction());
streamDeck.actions.registerAction(new SwitchAgentAction());
streamDeck.actions.registerAction(new SwitchAgentPersonalityAction());
streamDeck.actions.registerAction(new KiroStatusAction());
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
