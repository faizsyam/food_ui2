# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project: Ordr

An AI-powered multi-restaurant meal order builder. Users describe meal requests in natural language; an LLM (NVIDIA NIM, model: moonshotai/kimi-k2.6) generates a structured order schema, which is rendered into an interactive ordering UI. Users can refine orders conversationally, build a shopping cart, and proceed to a checkout confirmation.

## Tech Stack

- **Next.js 14** (Pages Router, not App Router)
- **React 18** + Hooks
- **Tailwind CSS 3** + PostCSS/Autoprefixer
- **Font**: DM Sans (from Google Fonts)
- **NVIDIA NIM** (Kimi K2.6) — AI inference
- **lucide-react** — icons

## Development Commands

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:3000)
npm run dev

# Production build
npm run build

# Production server
npm run start

# Lint with ESLint (Next.js config)
npm run lint
```

No test runner is installed. If adding tests, install `jest` or `vitest` and add a `test` script.

## Architecture Overview

### Data Flow (Request → AI → Render)

```
User types request
  ├── Stage 1: Requirement Generator Agent extracts filter criteria
  │     └── lib/requirementGeneratorPrompt.js + NVIDIA NIM
  ├── Stage 2: Data filtering (lib/filterData.js)
  └── Stage 3: Schema Generation Agent builds order schema
        └── lib/agentPrompt.js + NVIDIA NIM
                  │
    useOrderSchema ←←←── JSON schema
         │
    OrderRenderer ←── reduces + renders
         │
    LayoutShell + components
```

1. **Input**: `RequestInput.jsx` captures natural language input. `QueryBar` handles conversational refinement.
2. **Submission**: `useOrderSchema` POSTs to `/api/generate-schema`.
3. **AI Generation — Two-Stage Pipeline**:
   - **Stage 1**: `callRequirementAgent()` sends the user's request (plus optional previous schema/filters for refinement) to a requirement extraction agent. Returns filter criteria (tags, cuisine, budget, etc.).
   - **Stage 2**: `lib/filterData.js` narrows `restaurants.json` and `menus.json` using the extracted filters.
   - **Stage 3**: `AGENT_PROMPT` (`lib/agentPrompt.js`) sends the filtered dataset to the main AI, which returns the full order schema JSON.
4. **Rendering**: `OrderRenderer.jsx` enriches the raw schema with menu/restaurant data via `lib/resolveSchema.js` and renders the interactive UI via `LayoutShell`.
5. **Mutations**: User actions (quantity, variant, remove, option selection, add to cart, etc.) are dispatched through a pure reducer in `lib/schemaReducer.js`.

### Key Files and Roles

| File | Role |
|------|------|
| `pages/index.jsx` | Main page. Manages view state (IDLE → LOADING → RESULT → CONFIRMED), renders `HeroSection`, `RequestInput`, `QueryBar`, `OrderRenderer`, and `OrderConfirmation`. |
| `pages/api/generate-schema.js` | API route. Orchestrates the two-stage AI pipeline: calls requirement agent → filters data → calls schema agent. Strips markdown fences, sanitizes JSON, validates schema, applies post-processing (recomputes timing, fixes selected_option_id, recalculates order_summary, handles fallback address). |
| `lib/agentPrompt.js` | Exports `AGENT_PROMPT` — the extensive system prompt defining the JSON schema shape for the main AI. Authoritative schema definition. |
| `lib/requirementGeneratorPrompt.js` | Exports `REQUIREMENT_GENERATOR_PROMPT` — system prompt for the Stage 1 requirement extraction agent. |
| `lib/filterData.js` | Pure utility. Filters restaurants and menu items based on extracted filters (cuisine, tags, price, prep time, delivery time, etc.). Falls back to unfiltered data when fewer than 5 items survive. |
| `lib/resolveSchema.js` | Pure utility. Resolves raw schema slots against `restaurants.json` and `menus.json`. Computes subtotals, budgets, warnings, and timing. |
| `lib/schemaReducer.js` | Pure reducer. Handles: `UPDATE_QUANTITY`, `UPDATE_VARIANT`, `REMOVE_ITEM`, `DISMISS_WARNING`, `SELECT_OPTION`, `ADD_ITEM`. Also handles order cart actions: `ADD_ORDER_ITEM`, `REMOVE_ORDER_ITEM`, `UPDATE_ORDER_ITEM_QTY`. |
| `lib/format.js` | Formatting utilities. `formatIDR(amount)`, `formatTime(isoString)`, `formatShortTime(isoString)`. |
| `lib/timing.js` | Timing utilities. `calculateOptionTiming()`, `calculateSlotTiming()`, `formatTimingPasses()`, `calculateOrderTiming()`. Computes delivery + prep times for order ETA. |
| `lib/recentRequests.js` | localStorage persistence for recent request history and schema cache. `getRecent()`, `saveRequest()`, `getCachedSchema()`, `saveCachedSchema()`. |
| `hooks/useOrderSchema.js` | Custom hook. Manages request lifecycle: loading state, error handling, schema storage, dispatch wrapper for `schemaReducer`, localStorage caching, and request history. |
| `hooks/useIsMobile.js` | Mobile viewport detection via matchMedia API. |
| `OrderRenderer.jsx` | Top-level rendering component. Enriches schema with `resolveSchema.js`, manages `useReducer` for mutations, maintains the live shopping cart, computes `cart_summary`, and passes all callbacks down to `LayoutShell`. |
| `components/ui/index.js` | Barrel export for all UI components. |

### Project Structure

```
├── pages/
│   ├── _app.jsx
│   ├── index.jsx                         # Main page (view orchestration)
│   └── api/
│       └── generate-schema.js            # Two-stage AI pipeline API
├── components/
│   ├── RequestInput.jsx                  # Natural language input
│   ├── layout/
│   │   ├── Navbar.jsx                    # App navbar with stateful actions
│   │   ├── HeroSection.jsx               # Hero with input
│   │   └── HowItWorksSection.jsx         # Marketing/how-it-works section
│   └── ui/
│       ├── LayoutShell.jsx               # Main results layout
│       ├── SlotCard.jsx                  # Person/slot card with options
│       ├── ItemRow.jsx                   # Single item row with qty controls
│       ├── PersonTag.jsx                 # Person avatar/tag component
│       ├── BudgetBar.jsx                 # Budget display component
│       ├── WarningBanner.jsx             # Warning/alert display
│       ├── SharedRequirements.jsx        # Shared group requirements
│       ├── SharedRequirementsBar.jsx     # Shared requirements bar UI
│       ├── OrderSummaryCard.jsx          # Order summary card
│       ├── OrderSummaryPanel.jsx         # Full order summary panel
│       ├── QueryBar.jsx                  # Conversational refinement input
│       ├── ItemBrowser.jsx               # Browse/search menu items
│       ├── TimelineView.jsx              # Delivery timeline visualization
│       ├── GroupedResultCard.jsx         # Grouped result card layout
│       ├── GroupContainer.jsx            # Group wrapper container
│       ├── MobileCheckoutBar.jsx         # Sticky mobile checkout bar
│       ├── OrderConfirmation.jsx         # Checkout confirmation screen
│       └── index.js                      # Barrel export
├── hooks/
│   ├── useOrderSchema.js                 # Schema fetch + state hook
│   └── useIsMobile.js                    # Viewport detection
├── lib/
│   ├── agentPrompt.js                    # Main AI prompt (schema generation)
│   ├── requirementGeneratorPrompt.js     # Stage 1 AI prompt (requirement extraction)
│   ├── filterData.js                     # Data filtering utility
│   ├── resolveSchema.js                  # Schema data enrichment utility
│   ├── schemaReducer.js                  # Pure state reducer
│   ├── timing.js                         # Delivery + prep time math
│   ├── format.js                         # IDR/time formatting
│   └── recentRequests.js               # localStorage persistence
├── data/
│   ├── restaurants.json                  # Restaurant data
│   └── menus.json                        # Menu item data
├── public/
│   ├── item_001.webp .. item_090.webp    # Menu item images
│   └── rest_001.webp .. rest_010.webp    # Restaurant images
├── styles/
│   └── globals.css                       # Global styles + animations
└── tailwind.config.js                    # Custom Tailwind theme
```

### Two-Stage AI Pipeline Details

**Stage 1 — Requirement Extraction** (`callRequirementAgent()`)
- Prompt: `lib/requirementGeneratorPrompt.js`
- Extracts: `required_tags`, `excluded_tags`, `cuisine`, `excluded_cuisines`, `categories`, `max_price`, `max_preparation_time`, `max_delivery_time`, `max_total_time`, `max_delivery_fee`, `min_rating`, `promo_only`
- Handles refinements by carrying forward existing filters and updating only what the user explicitly changes.

**Stage 2 — Data Filtering** (`lib/filterData.js`)
- Filters restaurants by cuisine, delivery time/fee, rating.
- Filters menu items by tags, category, price, prep time, promotions.
- Fallback: returns the full unfiltered dataset if fewer than 5 items survive.

**Stage 3 — Schema Generation** (`lib/agentPrompt.js`)
- Receives filtered dataset.
- Generates full order schema with slots, options, shared requirements, order summary, constraints, and warnings.
- Supports conversational refinement: previous schema + instruction → incremental updates with `diff` tracking.

### Tailwind Configuration

`tailwind.config.js` extends the theme with a custom warm-toned color palette (`primary` = `#E8521A` accent, `background`, `surface`, `success`, `warning`, `error`, and custom text/border shadows), custom fonts (DM Sans), custom easing curves, and premium shadow system. The `content` array points to `pages/`, `components/`, `app/`, and `OrderRenderer.jsx`.

### Global Styles

`styles/globals.css` imports DM Sans from Google Fonts and defines custom keyframe animations (`fade-in-up`, `fade-in-from-below`, `fade-in`, `slide-up`, `pulse-soft`, `pulse-glow`, `float-gentle`, `spin-slow`, `scale-in`, `shimmer`) plus `.animate-*` utility classes used across the UI. Also defines custom scrollbar styles and focus ring behavior.

### Environment Variables

- `NVIDIA_API_KEY` — required in `.env.local` for the AI generation endpoint. If missing, the API route returns `500` with `"AI API configuration missing"`.

### Key Design Decisions

1. **Schema enrichment happens twice**: once in the API (`generate-schema.js`) for validation and post-processing, and again in `OrderRenderer` via `resolveSlot` for the UI layer. The latter is the live, interactive view.
2. **Reducer state shape**: the reducer maintains both AI-generated `order_summary` and a user-built `order` (cart) state. `cart_summary` is computed on the fly from the `order` items.
3. **Refinement state**: previous filters are stored in `schema._requirementFilters` and passed back on subsequent calls so the requirement agent can carry forward unchanged constraints.
4. **localStorage cache**: `recentRequests.js` caches schemas keyed by request text. Identical requests skip the API entirely on repeat visits (excluding refinement requests).
