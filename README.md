# Ordr — AI-Powered Multi-Restaurant Meal Order Builder

A polished, full-stack web application that lets users describe complex meal requests in natural language, then generates an interactive, adaptive UI for ordering from multiple restaurants.

---

## Quick Start

```bash
npm install
npm run dev
```

Requires a `NVIDIA_API_KEY` environment variable (set in `.env.local`).

---

## Tech Stack

- **Next.js 14** — React framework with API routes
- **Tailwind CSS** — Utility-first styling
- **NVIDIA NIM** — AI inference (Kimi K2.6 model)
- **lucide-react** — Icons

---

## File Structure

- `components/ui/` — Core order UI (SlotCard, ItemRow, PersonTag, GroupContainer, BudgetBar, WarningBanner, LayoutShell)
- `components/layout/` — Page layout (Navbar, HeroSection, HowItWorksSection)
- `components/RequestInput.jsx` — Natural language input
- `lib/agentPrompt.js` — AI system prompt
- `lib/resolveSchema.js` — Schema enrichment
- `lib/schemaReducer.js` — State mutation reducer
- `hooks/useOrderSchema.js` — Schema lifecycle hook
- `pages/index.jsx` — Main page
- `pages/api/generate-schema.js` — AI generation endpoint
- `data/restaurants.json` — 10 sample restaurants
- `data/menus.json` — 90 sample menu items

---

## Schema Shape (AI Output)

```json
{
  "slots": [
    {
      "slot_id": "slot_001",
      "person": { "name": "Alice", "preferences": { "diet": "vegan" } },
      "delivery": { "address": "...", "target_time": "..." },
      "options": [...],
      "selected_option_id": "opt_001"
    }
  ],
  "groups": [...],
  "constraints": {...},
  "warnings": [...],
  "layout": { "view_mode": "unified", "grouping_strategy": "by_person", "highlight": [] }
}
```

---

## License

MIT
