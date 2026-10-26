# Career Bridge: Responsive Work Empowerment & D3 Radar Chart Integration

Transform the Career Bridge workspace into a high-density, fully responsive command hub that visualizes skill proficiencies against target career requirements via an interactive D3 radar chart, while restructuring layout geometry to ensure all 7 feature cards and status telemetry are immediately accessible across mobile, tablet, and widescreen viewports without clipping or overlap.

### User Review & Critical Decisions

> [!IMPORTANT]
> The layout geometry and radar visualization have been calibrated to solve the viewport cut-off reported in recent testing while honoring the complete 7-feature specification from `workplace.html`.

- **Confirmed Layout Strategy**: Replace rigid nested viewport scroll containers with a fluid, adaptive CSS Grid (`grid-cols-1 md:grid-cols-2 xl:grid-cols-3` for top features, `grid-cols-1 sm:grid-cols-2 xl:grid-cols-4` for operational cards). Outer container uses native smooth scrolling with calculated min-heights, ensuring zero card clipping or hidden elements.
- **D3 Skill Gap Radar Integration**: The Skill Gap card will feature dual visualization modes—a compact progress breakdown and an interactive D3 radial polygon comparing **User Current Proficiency** vs. **Target Role Benchmark** across 6 core industry competencies (UI/UX Design, Data & Metrics, Frontend Architecture, User Research, Communication, Product Strategy).
- **Target Role Switching**: Users can toggle benchmarks dynamically between *Product Design*, *Frontend Engineering*, and *Data Analytics* to see instant radar morphing, gap deltas, and tailored course recommendations.

---

### 1. Overview & Core Concept

- **What It Does**: Career Bridge provides an all-in-one career readiness workspace featuring curated internship search, AI-powered CV revamping, interactive upskilling course tracking, D3 radar gap analysis, real-time interview practice with audio recording, job application tracking, personal career roadmaps, and global readiness telemetry.
- **Target Audience**: Aspiring students, interns, and transitioning professionals seeking structured feedback and actionable guidance to land high-impact tech, design, and marketing roles.
- **Key Value**: Bridges the gap between candidate resumes and live industry requirements through visual radar diagnostics and concrete 1-click upskilling pathways.

---

### 2. User Experience & Visual Design

#### A. Responsive Grid & Spatial Math
- **Desktop (1280px+)**: Clean 3-column top deck (Search Internships, Revamp CV, Access Courses) and balanced 4-column operational deck (Skill Gap Radar, Interview Practice, Application Pipeline, Milestone Roadmap), capped with the 3-point telemetry footer.
- **Tablet / Medium (768px - 1279px)**: 2-column adaptive flow with cards maintaining equal aspect ratios, prevent horizontal overflow.
- **Mobile (< 768px)**: Single-column vertical stream with touch-friendly 44px+ hit targets, collapsible preview drawers, and zero horizontal clip.
- **Vertical Spacing**: Reduced excessive margin padding from `space-y-8` and `min-h-screen` locks to a responsive container (`p-3 sm:p-5 lg:p-6`) so users see critical context immediately above the fold.

#### B. D3 Radar Chart Visualization
- **Mathematical Layout**: 6-axis polygonal web with concentric grid levels (20%, 40%, 60%, 80%, 100%) computed via D3 angle scales and radial generators.
- **Dual Polygons**:
  - *Current Candidate Level*: Solid `#1a6682` fill with 35% opacity, crisp `#145b77` border, and interactive data nodes.
  - *Target Role Benchmark*: Dashed `#f59e0b` / `#0284c7` perimeter outlining the required threshold.
- **Interactive Tooltips**: Hovering or tapping any axis node reveals the delta percentage (e.g. `Data Analysis: 58% vs 80% target (-22%)`) and links directly to the recommended course (e.g. *Data storytelling*).
- **Toggle View Mode**: Seamless switch between the standard bar gauge from `workplace.html` and the full D3 radar polygon right inside Card 4, with an expanded modal view for deep-dive diagnostics.

#### C. Color Palette & Typography
- **Canvas**: Clean soft neutral `#f0f4f9` background matching the reference screenshot.
- **Card Surfaces**: Pure white `#ffffff` cards with subtle 1px border (`border-slate-200/80`) and smooth rounded corners (`rounded-3xl`).
- **Brand Accents**: Deep petrol teal `#1a6682` (primary brand), rich navy `#145b77` (header icon background), amber `#d97706` (warning/pending status), and emerald `#10b981` (ready/offer status).
- **Typography**: Space Grotesk / Plus Jakarta Sans pairing, strict `tabular-nums` for percentages, scores, and dates.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: D3 Direct SVG vs Third-Party Chart Library**
  - *Chosen Approach*: Implement a custom D3 SVG component using `d3-scale`, `d3-shape`, and pure React SVG rendering.
  - *Why*: Zero layout jitter, pixel-perfect theme synchronization (`#1a6682`), smooth SVG transitions, and full control over responsive viewBox scaling without bundle bloat.
  - *Alternative Considered*: Chart.js or Recharts canvas renderers were rejected because they lack crisp responsive scaling on retina mobile screens and create heavy DOM wrappers.

- **Decision 2: Integrated Radar Card vs Modal-Only Radar**
  - *Chosen Approach*: Card 4 includes a responsive compact D3 radar preview with an instant toggle to standard bars, plus a "Deep Analysis" modal for full multi-role comparison.
  - *Why*: Solves user visibility—users see the radar immediately in the grid without needing to click modals first, while maintaining compact density.

- **Decision 3: Scrollable Viewport Structure**
  - *Chosen Approach*: Remove `overflow-hidden` constraints on the main workspace container and set `overflow-y-auto` with `overscroll-behavior: contain`.
  - *Why*: Guarantees that users on 1080p laptop screens, split-screen browsers, or mobile devices can smoothly view all 7 cards and the bottom status bar without elements getting clipped off.

---

### 4. Technical Architecture & Data Strategy

#### System & Component Architecture
```
┌────────────────────────────────────────────────────────┐
│               App.tsx (sylvia-workspace)               │
└──────────────────────────┬─────────────────────────────┘
                           │
             activeView === 'career'
                           │
┌──────────────────────────▼─────────────────────────────┐
│             CareerBridgeWorkspace.tsx                  │
│  - Adaptive Grid Container (Mobile / Tablet / Desktop) │
│  - Active Benchmark Role State (Product, Dev, Data)    │
└──────┬──────────────────────┬───────────────────┬──────┘
       │                      │                   │
┌──────▼──────┐       ┌───────▼───────┐    ┌──────▼───────┐
│ Top 3 Cards │       │ Operational 4 │    │ Status Strip │
│ 1. Interns  │       │ 4. Skill Radar│    │ Applications │
│ 2. Revamp CV│       │ 5. Interview  │    │ CV ATS Score │
│ 3. Courses  │       │ 6. Pipeline   │    │ Course Status│
└─────────────┘       │ 7. Roadmap    │    └──────────────┘
                      └───────┬───────┘
                              │
               ┌──────────────▼─────────────┐
               │ SkillGapRadarChart.tsx     │
               │ - Pure D3 SVG Scales       │
               │ - Responsive viewBox       │
               │ - Interactive Node Tooltip │
               │ - Role Benchmark Morphing  │
               └────────────────────────────┘
```

#### D3 Radar Data Model
```typescript
interface SkillDimension {
  axis: string;
  current: number;    // 0 - 100 candidate score
  benchmark: number;  // 0 - 100 role expectation
  courseSuggestion: string;
}

interface RoleBenchmarkProfile {
  id: string;
  roleName: string;
  skills: SkillDimension[];
}
```

#### Verification & Test Matrix
1. **Compilation**: Run `npm install` for `d3` and `@types/d3`, execute `compile_applet` and `lint_applet`.
2. **Mobile Viewport Test**: Verify layout at 375px (iPhone), 768px (iPad), 1024px (laptop), and 1440px (desktop) to ensure zero overlap and full scroll visibility of all 7 cards.
3. **Interactive Handlers**: Test benchmark role selector, card view toggle (bars vs radar), node hover tooltips, quick-apply actions, interview next-question generator, and ATS CV revamp feedback.
