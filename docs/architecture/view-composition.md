# View Composition Architecture

## Design Principle: Micro-Frontends from YAML

Views are composed from **reusable components** (widgets). A page YAML doesn't define _how_ things render — it declares _what_ to show and _where_ the data comes from. The compiler maps widget types to a registry of React components.

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        YAML Authoring Layer                            │
│                                                                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                 │
│  │ stat-card    │  │ data-table   │  │ chart        │  ... widgets    │
│  │ .widget.yaml │  │ .widget.yaml │  │ .widget.yaml │                 │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                 │
│         │                 │                 │                          │
│         ▼                 ▼                 ▼                          │
│  ┌─────────────────────────────────────────────────────┐              │
│  │              Page YAML (view.yaml)                  │              │
│  │  sections:                                          │              │
│  │    - type: stat-cards  ←── references widgets       │              │
│  │      widgets: [...]                                 │              │
│  │    - type: data-table  ←── references widgets       │              │
│  │      source: solutions                              │              │
│  └──────────────────────┬──────────────────────────────┘              │
└─────────────────────────┼───────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     Compiler Pipeline                                   │
│                                                                        │
│  ┌────────────┐    ┌────────────┐    ┌────────────┐    ┌────────────┐ │
│  │  1. Parse   │───▶│ 2. Resolve │───▶│ 3. Validate│───▶│ 4. Generate│ │
│  │  YAML       │    │  Refs      │    │  Schema    │    │  Code      │ │
│  └────────────┘    └────────────┘    └────────────┘    └────────────┘ │
│       │                  │                 │                 │         │
│  Read widget +     Map widget types   Check data       Emit React     │
│  page YAMLs        to registry,       source refs,     components +   │
│                    resolve $ref,      validate props   route files     │
│                    flatten            against schema                   │
│                    compositions                                       │
└─────────────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     Generated Output                                    │
│                                                                        │
│  generated/                                                            │
│  └── views/                                                            │
│      ├── components/          ← Reusable widget components             │
│      │   ├── StatCard.tsx                                              │
│      │   ├── DataTable.tsx                                             │
│      │   ├── Chart.tsx                                                 │
│      │   ├── ChatMessages.tsx                                          │
│      │   ├── Hero.tsx                                                  │
│      │   └── index.ts                                                  │
│      ├── pages/               ← Page compositions (route files)        │
│      │   ├── AdminDashboard.page.tsx                                   │
│      │   ├── Analytics.page.tsx                                        │
│      │   ├── SolutionsTable.page.tsx                                   │
│      │   └── ChatUI.page.tsx                                           │
│      ├── loaders/             ← Server functions (data fetching)       │
│      │   ├── dashboard.loader.ts                                       │
│      │   └── analytics.loader.ts                                       │
│      └── routes.ts            ← Route registry                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Compilation Steps (Detailed)

```
                    ┌──────────────────┐
                    │  flusk-lang build │
                    │  --target views   │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │ 1. PARSE          │
                    │                   │
                    │ • Load widget     │
                    │   registry        │
                    │ • Parse page YAMLs│
                    │ • Parse component │
                    │   YAMLs           │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │ 2. RESOLVE        │
                    │                   │
                    │ • $ref → inline   │
                    │ • widget type →   │
                    │   component map   │
                    │ • data source →   │
                    │   loader function │
                    │ • slot → children │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │ 3. VALIDATE       │
                    │                   │
                    │ • Required props  │
                    │ • Data source     │
                    │   exists?         │
                    │ • Widget type     │
                    │   registered?     │
                    │ • Accessibility   │
                    │   rules met?      │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │ 4. GENERATE       │
                    │                   │
                    │ • Widget → React  │
                    │   component       │
                    │ • Page → composed │
                    │   route file      │
                    │ • Loader → server │
                    │   function        │
                    │ • Barrel exports   │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │ 5. OUTPUT         │
                    │                   │
                    │ generated/views/  │
                    │  ├── components/  │
                    │  ├── pages/       │
                    │  ├── loaders/     │
                    │  └── routes.ts    │
                    └──────────────────┘
```

## Widget System

### Core Concept

Widgets are the atomic building blocks. Each widget type maps to a React component. Pages compose widgets — they never define rendering logic.

### Widget Registry

```yaml
# schema/widgets/stat-card.widget.yaml
name: StatCard
type: display
description: Single metric card with label, value, icon, and trend
props:
  source:
    type: string
    required: true
    description: Data binding path (e.g. "stats.totalUsers")
  label:
    type: string
    required: true
  format:
    type: enum
    values: [number, currency, percent, duration]
    default: number
  icon:
    type: string
    required: false
  trend:
    type: object
    required: false
    fields:
      direction: { type: enum, values: [up, down, flat] }
      value: { type: string }
responsive:
  sizes: { sm: string, md: string, lg: string }
accessibility:
  role: region
  aria-label: "{{ label }}: {{ value }}"
```

### Widget Types (Built-in Registry)

| Type | Category | Description |
|------|----------|-------------|
| `stat-card` | Display | Single metric with label + icon |
| `data-table` | Data | Sortable, filterable table |
| `chart` | Data | line, area, bar, donut, scatter |
| `bar-chart` | Data | Horizontal/vertical bars |
| `form` | Input | Dynamic form from field definitions |
| `chat-messages` | Interactive | Streaming chat with markdown |
| `chat-input` | Interactive | Message input with attachments |
| `hero` | Layout | Hero section with heading + CTA |
| `heading` | Typography | Semantic heading (h1-h6) |
| `paragraph` | Typography | Text block with max-lines |
| `badge` | Display | Status/role badge |
| `image` | Media | Responsive image with fallback |
| `action-group` | Navigation | Button group (primary/secondary) |
| `cta` | Navigation | Call-to-action section |
| `feature-grid` | Layout | Icon + title + description grid |
| `team-grid` | Layout | Avatar + name + role grid |
| `preview` | Display | Live preview pane |
| `stat-cards` | Composite | Grid of stat-card widgets |

### Custom Widgets

Users can define their own widget YAMLs in `schema/widgets/`. The compiler auto-discovers them and adds to the registry.

```yaml
# schema/widgets/usage-heatmap.widget.yaml
name: UsageHeatmap
type: data
description: 7-day heatmap of AI usage by hour
props:
  source: { type: string, required: true }
  colorScale: { type: enum, values: [green, blue, purple], default: green }
slots:
  tooltip: { description: "Custom tooltip content" }
```

## Page Composition

### How Pages Reference Widgets

```yaml
# schema/views/admin-dashboard.view.yaml
name: AdminDashboard
type: dashboard
route: /$tenant/admin
loader:
  source: Dashboard
  params: [tenant]

sections:
  - type: stat-cards                    # ← Widget type from registry
    widgets:
      - type: stat-card                 # ← Nested widget
        source: stats.totalUsers        # ← Data binding
        label: Total Users
        format: number

  - type: chart                         # ← Widget type
    source: queries.byDay              # ← Data binding
    chart:
      type: area
      xAxis: date
      yAxis: count

  - type: data-table                    # ← Widget type
    source: solutions                  # ← Data binding
    columns: [name, status, createdAt]
    actions: [edit, delete]
```

### What Gets Generated

```tsx
// generated/views/pages/AdminDashboard.page.tsx
// @generated by flusk-lang — DO NOT EDIT

import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/start'
import { StatCards, StatCard } from '../components/StatCard'
import { Chart } from '../components/Chart'
import { DataTable } from '../components/DataTable'

const loadDashboard = createServerFn('GET', async (params: { tenant: string }) => {
  const { getDashboard } = await import('~/loaders/dashboard.loader')
  return getDashboard(params.tenant)
})

export const Route = createFileRoute('/$tenant/admin')({
  component: AdminDashboard,
  loader: ({ params }) => loadDashboard({ tenant: params.tenant }),
})

function AdminDashboard() {
  const data = Route.useLoaderData()
  return (
    <main className="space-y-6 p-6">
      <StatCards layout={{ sm: 'stack', md: 'grid-3' }}>
        <StatCard source={data.stats.totalUsers} label="Total Users" format="number" />
        <StatCard source={data.stats.revenue} label="Monthly Revenue" format="currency" />
        <StatCard source={data.stats.growth} label="Growth" format="percent" />
      </StatCards>
      <Chart data={data.queries.byDay} type="area" xAxis="date" yAxis="count" color="blue" />
      <DataTable data={data.solutions} columns={['name','status','createdAt','usage']} actions={['edit','delete']} />
    </main>
  )
}
```

## $ref Composition (Micro-Frontend Reuse)

Pages can reference other page sections via `$ref`:

```yaml
# schema/views/full-admin.view.yaml
name: FullAdmin
type: dashboard
route: /$tenant/admin/full

sections:
  - $ref: admin-dashboard#Usage Stats     # ← Reuse section from another page
  - $ref: analytics#Cost Breakdown         # ← Mix and match
  - type: data-table                       # ← Add unique sections
    source: auditLog
    columns: [user, action, timestamp]
```

## Data Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Route    │────▶│  Loader  │────▶│  Page    │────▶│ Widgets  │
│  Match    │     │  (Server)│     │ Component│     │ (Render) │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
     │                │                │                │
  /$tenant/       Server fn:       Receives          Each widget
  admin           getDashboard()   typed data         binds to its
                  → DB/API call    as props           `source` path
                  → returns                           in the data
                    typed object
```

## File Structure

```
schema/
├── widgets/                    ← Widget definitions (reusable)
│   ├── stat-card.widget.yaml
│   ├── data-table.widget.yaml
│   ├── chart.widget.yaml
│   ├── chat-messages.widget.yaml
│   └── ...
├── views/                      ← Page compositions
│   ├── admin-dashboard.view.yaml
│   ├── analytics.view.yaml
│   ├── chat.view.yaml
│   └── ...
└── ...

compiler/
├── src/
│   ├── parsers/
│   │   ├── view.parser.ts      ← NEW: parse view YAMLs
│   │   └── widget.parser.ts    ← NEW: parse widget YAMLs
│   ├── schemas/
│   │   ├── view.schema.ts      ← NEW: view validation
│   │   └── widget.schema.ts    ← NEW: widget validation
│   ├── generators/
│   │   └── react/              ← NEW: React target
│   │       ├── page.gen.ts     ← Page composition → route file
│   │       ├── widget.gen.ts   ← Widget YAML → React component
│   │       ├── loader.gen.ts   ← Loader config → server fn
│   │       └── barrel.gen.ts   ← Route registry + exports
│   └── validators/
│       └── view.validator.ts   ← NEW: widget refs, data sources

generated/
└── views/
    ├── components/
    ├── pages/
    ├── loaders/
    └── routes.ts
```
