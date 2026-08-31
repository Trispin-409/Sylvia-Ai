# Sylvia-Ai

Sylvia is a Google ADK-powered collaborative digital operator with a React/Vite web interface and an A2A JSON-RPC gateway.

## Architecture

- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS
- **UI:** Chat, Sylvia presence, Mission Control, specialist graph, Decision DNA/context memory, Gmail, Calendar, activity feed, approvals, diagnostics and command palette
- **Backend:** existing Python Google ADK Sylvia service
- **Protocol:** A2A JSON-RPC 2.0 at `/a2a/app`
- **UI gateway:** `server.ts` proxies `/a2a/app` and `/api/a2a/app` to the live ADK service
- **Live ADK service:** `https://sylvia-agent-516232832461.africa-south1.run.app`

The Python ADK backend is **not** replaced by this repository. This repository is the web frontend/gateway that connects to it.

## Run locally

```bash
npm install
npm run dev
```

Open the Vite/Express URL shown in the terminal.

## Production build

```bash
npm run build
npm start
```

The server respects the `PORT` environment variable for hosted environments such as Cloud Run and AI Studio.

## Backend configuration

The default backend is already configured to the live Sylvia ADK Cloud Run URL. To point the UI at another ADK deployment, set:

```text
SYLVIA_BACKEND_URL=https://your-adk-service.example.com
```

or configure `VITE_SYLVIA_API_URL` as documented in `.env.example`.

Do **not** commit OAuth credentials, access tokens, service-account keys, or other secrets. The browser communicates with the same-origin gateway; backend credentials must remain server-side.

## Google AI Studio

This repository is structured so Google AI Studio can clone it as the frontend project. After cloning:

1. Install dependencies with `npm install`.
2. Run with `npm run dev` or build with `npm run build`.
3. Keep the existing React UI and `server.ts` gateway intact.
4. Keep the live Python Google ADK backend as the agent runtime.
5. If the backend URL changes, set `SYLVIA_BACKEND_URL` rather than hard-coding credentials into the frontend.

## Connection test

The deployed ADK endpoint should answer A2A `message/send` requests at:

```text
https://sylvia-agent-516232832461.africa-south1.run.app/a2a/app
```

The UI diagnostics panel uses `/api/health`, which performs a real A2A `message/send` probe rather than calling the unsupported `health/check` JSON-RPC method.
