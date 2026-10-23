# Sylvia Android Companion Plan

## Product target

Sylvia becomes companion-first:

- **Companion home:** original Sylvia character, truthful status, voice/text command input, approval notice, and quick access to missions, Gmail, Calendar, memory, specialists and activity.
- **Floating island:** a native Android window above other apps, when the user explicitly grants overlay permission.
- **Expanded workspace:** the island resizes into the existing hosted React app, so the user can reach the same complete Sylvia UI without leaving the active conversation.

The React companion screen in this branch is an in-app screen. A normal webpage cannot put itself above unrelated Android apps. The OS-level overlay must be implemented in the Kotlin Android shell.

## Keep one UI and the existing AI backend

The recommended native shell hosts the **same published React frontend + Express gateway** in a trusted WebView:

- Configure the public frontend URL separately from the backend URL. The frontend must be the deployment that serves the React application and same-origin `server.ts` routes.
- The existing Python Google ADK backend is `https://sylvia-agent-516232832461.africa-south1.run.app`; A2A is `/a2a/app`. The WebView UI already uses the frontend's gateway and parses real responses/approvals.
- The overlay WebView should remain the same instance when the island expands and collapses. Resizing that window preserves its JavaScript state, current A2A context, real Gmail/Calendar results and pending approval objects. Do not launch a second WebView for the expand/collapse transition.
- UI changes deployed to the hosted React frontend can then appear when the WebView reloads/reopens; native permissions and service changes may still require a rebuilt APK.
- The WebView should only load the allowlisted first-party HTTPS origin. Fail closed on TLS errors and never expose the JavaScript bridge to arbitrary external pages.

## Native Android work still required

Implement in the Kotlin/Jetpack Compose project created in Google AI Studio:

1. A `MainActivity` with an onboarding/permissions screen and a WebView hosting the same frontend.
2. A `CompanionOverlayService` that owns a `WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY` window and its single WebView. The compact state is a floating island; the expanded state resizes this same window to the screen.
3. Request Android's explicit **Display over other apps** permission and microphone permission at the point of use. Provide visible disable/stop controls.
4. A microphone foreground-service flow started through a user action while the app is visible, with required current-SDK service types/permissions and an ongoing notification while microphone capture is active.
5. A tightly scoped JavaScript bridge using the methods declared in `src/vite-env.d.ts`: `isNativeApp()`, `isCompanionOverlay()`, `toggleListening()`, `speakText(text)`, `expandCompanion(view, prompt?)`, `collapseCompanion()`.
6. When Android speech recognition changes, dispatch `sylvia:native-voice-state` to the WebView. When the island expands, dispatch `sylvia:native-expand-workspace` with the selected `view` and optional `prompt`; the React app opens the workspace and sends the prompt through its existing Sylvia flow.
7. A security allowlist for the bridge and navigation. Never expose arbitrary URLs, shell commands, filesystem access, service credentials or generic Java execution.

The exact copy-ready AI Studio prompt is in [AI_STUDIO_ANDROID_COMPANION_PROMPT.md](./AI_STUDIO_ANDROID_COMPANION_PROMPT.md).

## Listening model and Android restrictions

Start with user-initiated **push-to-talk**. Android versions restrict starting microphone foreground services from the background; on current releases the service must declare the correct microphone type/permission and be started from an allowed visible/user action. Make mic state obvious, show an ongoing notification while it is active, and stop capture immediately when asked.

Do not silently listen. Add wake-word mode only after push-to-talk works reliably; it needs explicit opt-in, an obvious indicator, battery/device testing, and a simple off switch. OEM battery settings can affect background reliability, especially on some devices.

## ARTEMIS role

[Google ARTEMIS](https://github.com/google/artemis) is a developer-side Android automation/testing toolkit driven from a computer through ADB/MCP. Use it to test installation, permission prompts, overlay show/hide, expand/collapse, voice commands, Gmail checks, approvals and screenshots/logs. Do not bundle ARTEMIS into Sylvia or make normal chat/voice depend on a connected development computer.

Use Coucou as interaction inspiration and Dotpals as a character-customization reference, but create Sylvia's own character, visual identity and sounds.

## Build sequence

1. Verify the companion-first React home and existing backend integration.
2. Enter the actual hosted frontend URL in the native Android project.
3. Implement the secure WebView overlay and native push-to-talk bridge.
4. Verify the same conversation and approvals survive expand/collapse.
5. Use ARTEMIS with a connected physical device for the end-to-end tests.
