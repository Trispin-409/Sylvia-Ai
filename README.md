# Sylvia AI — Collaborative Digital Operator

Sylvia is an AI-powered collaborative digital operator built around a Google ADK agent system and a React web command center. Instead of acting as a simple chatbot, Sylvia coordinates specialized reasoning and action workflows across missions, decision context, memory, Google Workspace operations, and human approvals.

The repository contains the **web frontend and same-origin gateway**. The agent runtime remains the existing Python Google ADK service deployed on Google Cloud Run.

## What Sylvia Does

- **Collaborative missions** — turns broad goals into ordered, trackable action plans.
- **Decision DNA** — keeps goals, priorities, constraints, preferences, aversions, working style, and decision rules available to the agent system.
- **Specialist orchestration** — routes work through specialist capabilities such as planning and Google Workspace operations.
- **Live Gmail and Calendar** — reads real Google Workspace data through the production ADK tools instead of using seeded/demo inbox records.
- **Human-in-the-loop approvals** — consequential Gmail/Calendar writes stop for explicit operator confirmation before execution.
- **Truthful execution states** — the UI distinguishes preparation, approval required, successful execution, verification, and failure; a text-only AI claim is not treated as proof that a write occurred.
- **Diagnostics and telemetry** — exposes A2A activity, backend health, context IDs, latency, workspace evidence, and regression checks for the operator.
- **Voice and command-center UX** — combines chat, presence, specialist status, Mission Control, Memory/Decision DNA, Workspace panels, Activity Feed, and diagnostics in one interface.
- **Career Bridge (FNB Youth Employment & Work Readiness)** — helps young people turn honest formal and informal experience into credible transferable-skill evidence, compare entry-level pathways, identify proof gaps, and follow a practical low-cost seven-day plan. Career-profile persistence is optional and requested only with explicit consent; the workflow reuses the existing ADK tools for saved context and Mission Control.

## Architecture

```mermaid
flowchart LR
    U[Operator / Browser]
    UI[Sylvia AI Command Center\nReact 19 + TypeScript + Vite + Tailwind]
    GW[Node/Express Gateway\nserver.ts\nSame-origin API + A2A proxy]
    A2A[A2A JSON-RPC 2.0\n/a2a/app]
    ADK[Python Google ADK Sylvia Runtime\nCloud Run]
    CORE[Sylvia Root Agent\nMission + Decision Context]
    SPEC[Specialist Agents / Tools]
    GMAIL[Gmail API\nread + draft write]
    CAL[Google Calendar API\nread + event write]
    MEM[Decision DNA / Context Memory]
    HITL[ADK Confirmation Gate\nHuman Approval]
    VERIFY[Execution + Result Verification]
    CLOUD[Google Cloud\nCloud Run + Vertex AI]

    U --> UI
    UI --> GW
    GW --> A2A
    A2A --> ADK
    ADK --> CORE
    CORE --> SPEC
    CORE --> MEM
    SPEC --> GMAIL
    SPEC --> CAL
    SPEC --> HITL
    HITL --> GMAIL
    HITL --> CAL
    GMAIL --> VERIFY
    CAL --> VERIFY
    VERIFY --> ADK
    ADK --> A2A
    A2A --> GW
    GW --> UI
    ADK -. hosted on .-> CLOUD
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for the component responsibilities and request flows.

## Production Backend

The frontend is connected to the live Sylvia ADK service:

`https://sylvia-agent-516232832461.africa-south1.run.app`

A2A requests are sent through:

`/a2a/app`

The browser normally communicates with the same-origin Node/Express gateway. Backend credentials stay server-side; OAuth tokens are never intended to be bundled into the browser application.

## Google Workspace Safety Model

Sylvia is designed so the UI does not invent Workspace state.

1. Gmail and Calendar panels begin empty until live backend evidence is received.
2. Workspace connection status is derived from the backend health/tool results rather than a UI-only toggle.
3. Read operations are grounded in actual Gmail/Calendar tool payloads.
4. A write operation enters **HUMAN APPROVAL REQUIRED** before the write is attempted.
5. After approval, the frontend evaluates the structured ADK tool result.
6. The UI only reports a Gmail draft as created when the backend returns a successful draft result containing a real draft identifier. It does not promote assistant prose into execution proof.

## Development

Install dependencies:

```bash
npm install
```

Run locally:

```bash
npm run dev
```

Type-check:

```bash
npm run lint
```

Build the production bundle:

```bash
npm run build
```

Start the compiled server:

```bash
npm start
```

The server respects the `PORT` environment variable for hosted environments.

## Backend Configuration

The default gateway targets the live Sylvia ADK Cloud Run service. To use another deployment, configure the backend URL through the project's supported environment variable instead of embedding credentials in frontend code.

Do **not** commit OAuth credentials, refresh tokens, service-account keys, or other secrets.

## Google AI Studio

This repository is structured so Google AI Studio can clone and run the frontend command center while preserving the existing Python Google ADK backend.

Recommended workflow after cloning:

```bash
npm install
npm run dev
```

Keep the existing `server.ts` gateway and the live ADK backend integration intact. The frontend is the operator console; the Python ADK service remains the agent runtime and Google Workspace execution layer.

## Project Structure

```text
Sylvia-Ai/
├─ src/                    # React UI, services, hooks, panels and components
├─ server.ts               # Node/Express gateway and A2A proxy
├─ ARCHITECTURE.md         # Architecture and runtime flows
├─ package.json            # Frontend/runtime dependencies and scripts
└─ README.md
```

## Why Sylvia

Most AI assistants stop at producing text. Sylvia is designed around the next step: **turning intent into coordinated work while keeping the operator in control of real-world actions**.

The core design principle is simple:

> **Reason → coordinate → request approval → execute → verify → report truthfully.**

## FNB App of the Year Hackathon — Career Bridge

The FNB challenge selected for this build is **Youth employment and work readiness**:

> How might we shorten the distance between young people and meaningful income by translating skills into credible profiles, practical experience, work opportunities and career mobility?

Career Bridge adds an interactive, real-time workflow to the existing Sylvia application—not a static landing page. It accepts a user's actual experience (including informal work, community contribution, school projects and self-taught work), strengths, interests and access barriers. The existing Google ADK backend is asked to analyse that evidence, distinguish stated facts from inferences, recommend practical entry-level pathways, identify proof gaps and propose low-cost next steps.

### Feature flow

1. Open **Career Bridge** from the sidebar, command palette or companion home.
2. Enter a real example of something the person has done; choose optional education, strengths, role interests, area and barriers.
3. Ask Sylvia to return an evidence-grounded skills map, up to three plausible role pathways, a concise CV/profile summary and a seven-day work-readiness plan.
4. If the person explicitly opts in, Sylvia is asked to save a concise career profile through the existing persistent Context Memory tool. Without opt-in, the workflow asks the agent not to store the profile.
5. The backend may load existing Decision DNA, career context and Mission Control. The UI reflects mission and memory information only when it receives structured backend tool results.
6. Demonstrate fairness and trust: informal experience counts, inferred skills are labelled, and no vacancy, employer, qualification or application outcome is invented.

**Current boundary:** this feature produces career guidance and action planning; it does not claim to provide verified live vacancies or submit job applications unless those capabilities are separately connected and confirmed. Confirm actual tool results during the demo rather than relying on AI-generated statements.

### Suggested 90-second demo story

- **0–15 seconds:** Introduce a young person with limited formal experience and a real example of informal work or a project.
- **15–35 seconds:** Enter the example and relevant access barriers, then run Career Bridge.
- **35–55 seconds:** Show the returned transferable skills with evidence/inference distinction and the realistic role pathways.
- **55–70 seconds:** Show the low-cost seven-day action plan and open the resulting Mission Control state if the backend confirmed it.
- **70–82 seconds:** Show explicit career-profile consent and the structured backend tool trace; point out that a request is not treated as persistence unless the tool confirms it.
- **82–90 seconds:** Close with the impact: help turn experience into credible evidence and a practical next step toward meaningful income.

The separate submission pack should include a deck of no more than 10 slides, a demo video no longer than 90 seconds, the SSDLC, and the Lean Business Canvas, as required by the FNB programme brief.

## License

See the repository license and project files for the applicable terms.
