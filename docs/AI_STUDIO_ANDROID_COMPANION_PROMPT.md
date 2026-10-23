# Google AI Studio Prompt — Sylvia Floating Android Companion

Use this prompt in **Google AI Studio → Build → Android**. It describes the native Android shell around the existing hosted Sylvia frontend. Replace `SYLVIA_WEB_APP_URL` in the generated configuration with the real public HTTPS URL of the **Sylvia frontend + Express gateway**. Do not use the Python ADK backend URL as the WebView URL.

---

## Prompt to paste into AI Studio

Build a native Android application called **Sylvia Companion** using Kotlin and Jetpack Compose. It is the Android shell for my existing Sylvia AI product, not a new AI chatbot. The app needs a Coucou-style floating companion that stays available over other Android apps, indicates when Sylvia is listening/working/waiting, and expands into the existing Sylvia interface.

### Preserve Sylvia's existing web UI and AI backend

- My existing React/TypeScript frontend and Express gateway are maintained in `https://github.com/Trispin-409/Sylvia-Ai`.
- The existing production Python Google ADK backend is `https://sylvia-agent-516232832461.africa-south1.run.app`, with A2A endpoint `/a2a/app`.
- The Android app should **load the published Sylvia frontend from one configurable HTTPS base URL**. The loaded frontend already includes the working chat, Gmail/Calendar tools, A2A protocol, and approval UI. Do not duplicate those features in a second Kotlin chatbot.
- Add a single `SYLVIA_WEB_APP_URL` configuration value for the public URL of the deployed React + Express frontend. I will fill in the actual frontend URL. Never substitute the ADK backend URL for this value.
- The remote page is the primary source of UI truth. Changes to its React UI should appear when the WebView reloads/reopens, without rebuilding the APK. Changes to native Android permissions/services still require updating the Android project and may require a new APK.
- The WebView must use the first-party frontend origin, enable JavaScript and DOM storage, require HTTPS, block file access, reject SSL certificate errors, and prevent the native bridge from being exposed to untrusted external URLs. External links should open in the system browser without the bridge.

### Two native surfaces

1. **MainActivity:** a native Android activity that hosts the same published Sylvia frontend in a full-screen WebView. It also explains and requests the permissions required to enable the floating companion.
2. **CompanionOverlayService:** a native service that creates an overlay window using `WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY`. The overlay hosts the same trusted Sylvia frontend in a WebView, starting on the companion home screen. Do not package a separate hardcoded copy of the React UI into the overlay.

### Collapsed companion

Create a small draggable floating island near the edge of the screen, inspired by the interaction pattern of Coucou, but use **Sylvia's own name and original character design**. It should show:

- Sylvia's character and a small truthful state label: Ready, Listening, Thinking, Working, Needs approval, Completed, or Error.
- A speak/stop control, a subtle status indicator and an expand control.
- A pending-approval indicator when known.
- A clear dismiss/disable action and a way to reopen the companion from the app/notification.

The collapsed view must not cover important system controls. Allow moving the island and save its screen position across launches.

### Expand/collapse must preserve the same session

The most important requirement is that expanding the island must **resize the existing overlay window and keep the same WebView instance alive**. Do not create a second WebView or restart the React app to expand it. That way, the current A2A context, conversation, pending approval objects, and loaded Gmail/Calendar state remain in the same JavaScript session.

- On Expand, resize the current overlay WebView to the available screen and dispatch:
  `window.dispatchEvent(new CustomEvent('sylvia:native-expand-workspace', { detail: { view, prompt } }))`
- The React app will select the requested workspace, render the existing full Sylvia UI, and submit an optional prompt using its existing `useSylvia`/A2A flow.
- On collapse, allow the React app to return to companion home, then shrink the same overlay window back to the compact island.
- If the app is launched from the launcher, MainActivity can show the same published frontend. Do not clear conversation or approval state when moving between the expanded and collapsed forms of the overlay.

### JavaScript bridge contract

Register an Android JavaScript interface named `SylviaAndroid` only for the allowlisted Sylvia HTTPS origin. Expose only the methods the companion needs:

- `isNativeApp(): Boolean`
- `isCompanionOverlay(): Boolean`
- `toggleListening(): void`
- `speakText(text: String): void`
- `expandCompanion(view: String, prompt: String?): void`
- `collapseCompanion(): void`

The React frontend declares this bridge in `src/vite-env.d.ts`. Do not expose ADB, arbitrary shell commands, arbitrary URLs, filesystem access, or general-purpose Java execution through the bridge.

When Android speech state changes, dispatch this event inside the active WebView:

```javascript
window.dispatchEvent(new CustomEvent('sylvia:native-voice-state', {
  detail: { isListening: true, transcript: 'recognized words' }
}));
```

Set `isListening: false` when listening finishes or is stopped. Include the recognized transcript; the existing React companion input will receive it. The native voice service should not submit a second A2A request itself—the existing React app sends the command through its normal backend flow.

### Microphone, listening and Android restrictions

- Start with **user-initiated push-to-talk**. Ask for the runtime microphone permission only when needed and always provide a clearly visible stop control.
- Start microphone capture only after a user action from a visible activity/overlay and follow the target Android SDK's foreground-service rules. For current Android versions, declare the required microphone foreground-service type and corresponding permissions in the manifest.
- While the microphone is actively used in the background, display an ongoing notification such as “Sylvia voice mode is active” with a Stop action. Stop audio capture immediately on Stop, service shutdown, denied permission, or an unrecoverable error.
- Request `SYSTEM_ALERT_WINDOW` through Android's special-access settings and explain why Sylvia needs it. Do not silently grant or bypass permissions.
- Do not claim that a constantly listening wake word works in the first build. Make push-to-talk solid first. Add optional wake-word mode only later, with explicit opt-in, an obvious listening indicator, battery testing, and an easy off switch. Do not silently listen in the background.
- Handle missing overlay permission, microphone denial, offline state, WebView load errors, Android process death, and battery restrictions gracefully. Offer instructions for the user to enable any required manufacturer-specific background settings, but do not try to bypass OS controls.

### Keep existing functionality and approval safety

- Keep the hosted React app's existing A2A JSON-RPC connection through its same-origin Express gateway.
- Do not hardcode Google Workspace credentials or Gemini API keys in the APK.
- Do not build a second mock agent and do not simulate email actions.
- Gmail/Calendar changes must continue to use the current Sylvia backend's human approval flow and structured result validation.
- Let Sylvia's real backend/UI state determine the label. Do not invent agent activity or show “completed” without the existing app confirming the result.
- The overlay can display a short current-state label; the expanded view remains the source of full tool results and approval details.

### ARTEMIS is for device testing, not the production runtime

Google ARTEMIS (`https://github.com/google/artemis`) is a developer-side Android automation/testing toolkit that uses a connected device and ADB/MCP. Do not bundle it in the APK or require it for Sylvia to work. I will use it from my development computer to test the installed APK and the actual phone UI.

### Required test checklist

1. Launch Sylvia and verify the current hosted frontend renders.
2. Grant overlay permission and enable the floating companion from a visible activity.
3. Return to another app and confirm the island remains visible above it.
4. Tap the mic, speak a short test request, stop listening, and confirm the transcript appears in Sylvia's input.
5. Send a non-writing command and confirm the response comes from the real Sylvia backend.
6. Send a request to check Gmail and expand to the full workspace. Verify the command is not sent twice and real records appear.
7. Request a Gmail draft. Confirm the approval card remains available when the panel expands, and that no draft is reported as created until the current backend validation confirms it.
8. Collapse and re-expand during a conversation; verify the context and pending approvals are preserved.
9. Deny the microphone and overlay permissions and verify helpful recovery UI.
10. Disable voice mode and verify the notification disappears and the microphone stops.

Generate the Kotlin/Jetpack Compose project, the WebView host, overlay service, microphone foreground-service handling, and the secure bridge. Verify what can be tested in the emulator; permissions, overlays, microphone behavior and device-background behaviour must also be tested on a physical Android phone.
