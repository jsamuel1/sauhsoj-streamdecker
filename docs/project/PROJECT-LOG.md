---
name: project-log
description: Chronological log of prompts, tasks, and decisions for the Kiro Deck project. Read when you need context on what has been done, user requirements, or implementation history.
---

# Project Log

## 2026-01-30

### Initial Prompt (07:28)

User requested a comprehensive Stream Deck Neo control application with the following requirements:

> I want the app to control both the buttons and actions. I want to use the next/prev page buttons to change agents IF we are focused on a kiro-cli tab of iterm. We'll do this using Ctrl-<key> shortcuts that we'll have set in the agent configs.
>
> The buttons should be as per the better touch tool config, including the functionality from the scripts (but it doesn't need to be the applescript -- we can call things from bun using the apple libraries).
>
> bun, not node, for the runtime.
>
> We should have a menubar menu, with a configure and about windows. Configure will include the commands to watch (eg. kiro-cli and pseudonyms like kiro-cli-dev or kv2), and modifying the favorites lists for both folders and agents, and clearing the MRU lists for them.
>
> We may in the future also have different type of information that we can display in the infobar, and different buttonsets for different sets of activities I may be doing (eg. If presenting a powerpoint, I may have a Powerpoint set of buttons for common actions like next/previous slide, bring Powerpoint window back to the foreground, switch to the Kiro terminal and bring it to the presentation screen, etc.
>
> So we should design things to be modular (but not overkill in modular).
>
> Consider: Pages of buttons with actions (that we can switch to/from based on criteria). Icons/Image sets for those buttons. Modifying the actions dynamically from a set of templated sets of common activities.
>
> For the infobar, consider where we want to pull information from -- eg. Last row of the iTerm2 window for current agent/percentage context window. Calendar for next appointment time and info. Notifications. Task management apps (let us customize this).
>
> Come up with a requirements document for all of this, in the forms of both a PRFAQ and Detailed set of functions to implement (without the code details).
>
> We should also have a proposed tech stack (eg. Bun w/ elgato-stream-deck and xxx and xxx) and proposed GUI theme, styling and design patterns.
>
> Functionally, it should launch on login, and run as a regular user. It should auto-update based on a published version. It should be lightweight and fast.
>
> We should also have a Stream Deck emulator mode (via a web browser), so that we can set up automated tests without the hardware. We are emulating and using a Stream Deck Neo, which has 8 buttons (2 rows of 4 buttons), 2 page-turn buttons and an infobar.
>
> Our button images should be themed for Kiro for the Kiro tab. For other software, we should look up the key colours for that applications icon and use that as the key colours for any action icons - but always with character and charm in the icons. Use Nova Canvas as the image generation model. Consider the techniques here: https://blog.serverlessadvocate.com/amazon-bedrock-ai-image-manipulation-with-amazon-nova-800511922208 for the code to do this. We should use these techniques to create a base image, and then modified images from that base for action versions of it.
>
> Note down this prompt in a file, and keep track of the tasks that you do, and the prompts that I give you as we implement this. (in a project subfolder for this)

### Tasks Completed

1. Created project docs folder structure
2. Saved initial prompt to project log
3. Created PRFAQ document
4. Created detailed functional requirements
5. Created tech stack and design document
6. Researched Nova Canvas API from blog article - documented task types, parameters, and icon generation workflow
7. Added YAML frontmatter to all docs (PROJECT-LOG.md, PRFAQ.md, REQUIREMENTS.md, TECH-STACK.md, neo-infobar-research.md)
8. Created .kiro/agents/streamdecker.json with knowledge base, skills, and MCP servers
9. Created .kiro/settings/cli.json with enableKnowledge, enableThinking, enableTodoList

### Files Created

- `docs/project/PROJECT-LOG.md` - This file
- `docs/project/PRFAQ.md` - Press Release / FAQ
- `docs/project/REQUIREMENTS.md` - Detailed functional requirements
- `docs/project/TECH-STACK.md` - Technology and design decisions
