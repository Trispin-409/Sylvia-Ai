# Sylvia Android Companion Plan

## What the product should do

Sylvia has two connected surfaces:

- **Companion home:** the character, a truthful status label, voice/text command input, approvals needing attention, and quick links to chat, missions, Gmail, Calendar, memory, specialists and activity.
- **Floating island:** a native Android overlay that can remain on top of other apps when the user allows it. Tapping it opens quick controls; expanding it opens Sylvia's full application.

The React companion home in this branch is an in-app screen. A normal web page cannot create a system overlay over other Android apps by itself.

## Preserve the working backend

Keep the existing Python Google ADK backend and existing Gmail/Calendar and approval workflows. The current backend URL is:

https://sylvia-agent-516232832461.africa-south1.run.app

The A2A endpoint is /a2a/app. The existing web gateway is server.ts and the API client is src/services/sylviaApi.ts. The Android project needs an API adapter that preserves A2A conversation context and structured approval results.

## Native Android work still required

Implement these pieces in the Android project used by Google AI Studio:

1. A Kotlin overlay controller using Android's application overlay window. Ask the user for the explicit Display over other apps permission, and provide a clear off/close action.
2. A compact island with Sylvia's original character, a real state label, a speak button, a stop button, an expand action and a pending-approval indicator.
3. A microphone flow that starts only after the user enables it and grants permission. Use push-to-talk first. Show an ongoing notification while a microphone foreground service is active.
4. A way to open the full Sylvia app from the island. If the full app is hosted React content, keep loading that published frontend so normal UI changes do not require repackaging the native overlay. If AI Studio generated native screens, share the same backend contract and status model.
5. A bridge for state and voice controls between the native shell and the full app, limited to the actions Sylvia actually needs.

Android versions restrict starting microphone foreground services from the background. Start microphone capture from a visible activity, keep the required notification, and make listening explicit and easy to stop. Add wake-word detection only after push-to-talk works reliably and its battery use can be tested.

## ARTEMIS role

https://github.com/google/artemis

ARTEMIS is for development-time Android automation through a computer, ADB and MCP. Use it to test installation, permissions, overlay show/hide, expand/collapse, real Sylvia commands, approval states and screenshots/logs. Do not make ARTEMIS a runtime requirement for normal Sylvia chat or voice commands.

Coucou's Android README is a useful reference for the optional floating island and status-driven UI. Sylvia must use its own name, original character and sounds.

## Build order

1. Finish and test the companion-first React screen in this branch.
2. Add the native Android overlay to the Android project.
3. Connect push-to-talk to Sylvia's existing A2A flow.
4. Confirm the bubble reflects real backend state and approvals.
5. Use ARTEMIS against a connected device to test the end-to-end flows.
