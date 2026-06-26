# component-registry.md
# Multi-Restaurant Meal Order Builder — Component Registry

---

## PURPOSE

This document is the instruction set for an AI agent generating order schema JSON.
It describes what each component renders, which schema fields it depends on, and how
to populate those fields correctly. Do not write output prose; output only the JSON
schema object described below. Every field described here maps directly to a rendered
UI element. Omitting a required field means that element will not render.

---

## SYSTEM SUMMARY

The component system renders a live, interactive order management interface for
complex multi-person, multi-restaurant meal orders. The top-level component
(LayoutShell) receives the full order schema and breaks it into sub-components.
Each person's order is one "slot". Slots can be grouped into "groups" with shared
context (shared address, shared payment, etc.). The schema also carries constraints
(budget, headcount, occasion), warnings (time conflicts, unavailability), and layout
preferences (view mode, grouping strategy, which slots to highlight). Every dynamic
field — preferences, constraints, shared, warnings — is an open object: you invent
both the keys and the values based on the user's request. Never assume a fixed key set.

---

## COMPONENTS

---

### LayoutShell

**Renders:** The full order interface. Wraps BudgetBar, WarningBanners,
view-mode tabs, grouping-strategy tabs, and the main slot content area.

**Props it accepts:**
- `schema` — the full order schema object (see below for shape)
- `restaurants` — full array of restaurant objects from restaurants.json
- `menus` — full array of menu item objects from menus.json
- `onSchemaChange` — callback fired when user modifies anything

**Schema fields it depends on:**
- `schema.slots` — array of all slot objects (required; can be empty)
- `schema.groups` — array of group objects (optional; used in unified view)
- `schema.constraints` — object with budget/occasion/headcount info
- `schema.warnings` — array of warning objects
- `schema.layout.view_mode` — "split" | "unified" | "timeline"
- `schema.layout.grouping_strategy` — "by_person" | "by_restaurant" | "by_time"
- `schema.layout.highlight` — array of slot_ids to visually emphasize

**How to populate:** Always include `layout`. Set `view_mode` and `grouping_strategy`
based on the user's request context (see Layout Decisions section below). Populate
`highlight` with any slot_id that needs user attention. Include `groups` when two or
more slots share delivery address or payment.

---

### SlotCard

**Renders:** One person's complete order from one restaurant. Shows restaurant
metadata, person preferences, all ordered items with interactive controls,
delivery details, and subtotal.

**Schema fields it depends on (one slot):**
- `slot.slot_id` — unique string identifier
- `slot.person.name` — string
- `slot.person.preferences` — open object (see Dynamic Fields section)
- `slot.restaurant_id` — must match a restaurant's `id` in restaurants.json
- `slot.items[]` — array of ordered items:
  - `item_id` — must match a menu item's `id` in menus.json
  - `quantity` — positive integer
  - `variant` — string or null; must match a variant name in the menu item's variants array
  - `notes` — free-text string or null
- `slot.delivery.address` — string
- `slot.delivery.target_time` — ISO 8601 datetime string
- `slot.delivery.estimated_arrival` — ISO 8601 datetime string
- `slot.subtotal` — numeric value in IDR (integer, no decimal)

**Highlight behaviour:** When `slot.slot_id` appears in `schema.layout.highlight`,
the card renders with an amber ring, amber border, and a gradient ribbon at the top.

**Subtotal note:** The subtotal is the food total only (items × price + variant delta
× quantity, summed). Delivery fee is NOT included in subtotal; it is on the restaurant.

---

### PersonTag

**Renders:** Person's name with an avatar initial, plus all preference badges.

**Schema fields it depends on:**
- `slot.person.name` — string
- `slot.person.preferences` — open object; all key-value pairs are rendered as badges

**Important:** Every key-value pair in `preferences` becomes a visible badge. The key
is the label (e.g. "halal"), the value is the descriptor (e.g. "strictly yes"). There
is no maximum number of preference keys; include as many as the user's request implies.
Badge colour is determined deterministically by key name — same key always gets same colour.

---

### ItemRow

**Renders:** One ordered menu item inside a SlotCard. Shows name, description,
variant selector, quantity stepper, notes, and line total.

**Schema fields it depends on:**
- `ordered_item.item_id` — matched to a menus.json entry
- `ordered_item.quantity` — integer ≥ 1
- `ordered_item.variant` — string or null (must match a name in `item.variants`)
- `ordered_item.notes` — string or null

**From the matched menu item:**
- `item.name`, `item.description`, `item.price` — always required
- `item.variants[]` — optional; if present, variant selector renders
- `item.tags` — if includes "best-seller", a star badge renders
- `item.available` — if false, item renders muted with an "Unavailable" badge

**Line total formula:** (item.price + active_variant.price_delta) × quantity

---

### GroupContainer

**Renders:** A dashed-border container that visually groups SlotCards sharing
context. Shows group label, shared-property pills, and slot count.

**Schema fields it depends on (one group):**
- `group.group_id` — unique string identifier
- `group.label` — human-readable label (e.g. "Office Lunch", "Floor 3 Orders")
- `group.slot_ids` — array of slot_ids belonging to this group
- `group.shared` — open object (see Dynamic Fields section); all truthy keys render
  as "Shared [Key]" pills (e.g. `{ "address": true }` renders as "Shared Address")

**When to include groups:** Create a group whenever two or more people share a
delivery address, payment method, discount code, or any other logistical property.
One slot can belong to only one group.

---

### BudgetBar

**Renders:** Grand total, food subtotal, delivery fee total, slot count, and — if
a budget-related key is found in constraints — a colour-coded progress bar.

**Schema fields it depends on:**
- `schema.slots[].subtotal` — summed across all slots for food total
- `schema.constraints` — scanned for a budget key (see below)

**Delivery fees:** Fetched from `restaurants[].delivery_fee` by matching
`slot.restaurant_id`. Pass the full restaurants array to LayoutShell.

**Budget parsing:** BudgetBar scans constraint keys for "budget", "limit", "max",
or "total" (case-insensitive). If found, it parses the value as IDR:
- "Rp150k" → 150,000
- "Rp 1.5jt" → 1,500,000
- A plain number string → treated as IDR directly

**Colour thresholds:** ≥100% red (over budget), ≥80% amber (near limit), <80% green.

---

### WarningBanner

**Renders:** A dismissible alert with warning type label, message, suggestion,
affected slot count, and any extra AI-generated fields.

**Schema fields it depends on (one warning):**
- `warning.message` — string (required; shown as the primary alert text)
- `warning.affected_slot_ids` — array of slot_ids (required; count shown)
- `warning.type` — string (optional; determines colour theme)
- `warning.suggestion` — string (optional; shown as "Suggestion: …")
- Any additional keys — rendered as supplementary key: value pairs

**Type colour mapping:**
- "time_conflict", "delivery_delay" → amber
- "budget_exceeded", "availability", "item_unavailable" → red
- Anything else → yellow

---

## DYNAMIC FIELDS

The following schema fields are open objects. You, the AI agent, invent both the
keys and the values. Never assume a fixed key set. Generate what the user's request
actually implies.

---

### slot.person.preferences

Each key is a preference category; each value is the user's stance or constraint.
Render all key-value pairs as colour-coded badges.

Examples for different request types:

1. Office halal lunch: `{ "halal": "strictly yes", "avoid": "onion, garlic" }`
2. Kids birthday party: `{ "allergen": "no nuts", "spice": "mild only", "portion": "child size" }`
3. Corporate catering: `{ "diet": "vegan", "gluten": "free required", "budget": "premium ok" }`
4. Gym crowd post-workout: `{ "protein": "high", "carbs": "moderate", "calories": "under 700kcal" }`

You may add as many keys as needed. Do not limit to two.

---

### schema.constraints

Each key describes a constraint on the overall order; each value is the limit or context.

Examples for different request types:

1. Budget-focused: `{ "total_budget": "Rp150k for everything", "occasion": "office lunch", "headcount": 4 }`
2. Time-sensitive: `{ "max_delivery_time": "30 minutes", "target_arrival": "12:30", "headcount": 8 }`
3. Dietary event: `{ "diet_requirement": "all halal certified", "occasion": "team iftar", "headcount": 12 }`
4. Multi-criteria: `{ "total_budget": "Rp500k", "max_restaurants": 3, "occasion": "team birthday", "headcount": 10 }`

Include a budget key whenever the user mentions a spending limit, otherwise omit it.
BudgetBar will only show the progress bar if a parseable budget key exists.

---

### group.shared

Each key is a logistical property that is shared within the group; the value is a
boolean (true) or a concrete shared value.

Examples:

1. `{ "address": true, "payment": true }` — shared delivery address and payment method
2. `{ "address": true, "discount_code": true }` — shared address and promo code
3. `{ "payment": true, "note": true }` — shared payment and delivery note
4. `{ "address": true }` — only the delivery address is shared

Only include keys that are genuinely shared. All truthy-value keys render as pills.

---

### schema.warnings

Each warning is an object with at minimum `message` and `affected_slot_ids`. Add
`type` and `suggestion` whenever you can. You may also add extra descriptive keys.

Examples:

1. Time conflict:
```json
{
  "type": "time_conflict",
  "message": "rest_003 estimated arrival exceeds target time by 10 minutes",
  "affected_slot_ids": ["slot_001"],
  "suggestion": "Switch to rest_005 which delivers in 20 min",
  "delay_minutes": 10
}
```

2. Budget exceeded:
```json
{
  "type": "budget_exceeded",
  "message": "Current total of Rp165,000 exceeds the Rp150,000 budget",
  "affected_slot_ids": ["slot_001", "slot_002", "slot_003"],
  "suggestion": "Remove one item from slot_002 to bring total within budget",
  "overage": "Rp15,000"
}
```

3. Item unavailable:
```json
{
  "type": "item_unavailable",
  "message": "Nasi Goreng Spesial is currently unavailable at Warung Bu Sari",
  "affected_slot_ids": ["slot_001"],
  "suggestion": "Try Ayam Bakar as an alternative at the same restaurant"
}
```

4. Minimum order not met:
```json
{
  "type": "min_order_unmet",
  "message": "slot_003 is Rp5,000 below rest_002 minimum order of Rp20,000",
  "affected_slot_ids": ["slot_003"],
  "suggestion": "Add one more item to meet the minimum",
  "shortfall": "Rp5,000"
}
```

Generate warnings whenever you detect a real problem. Do not generate warnings
for conditions you cannot verify from the available data.

---

## LAYOUT DECISIONS

Use these guidelines to set `schema.layout.view_mode` and
`schema.layout.grouping_strategy`.

---

### view_mode

**"split"** — Use when:
- All orders are independent (no shared delivery, no groups)
- User wants a quick side-by-side comparison of all orders
- 2–4 slots with no shared context
- Example: "Order lunch for 3 separate people at different restaurants"

**"unified"** — Use when (this is the default):
- Two or more slots share an address, payment, or occasion
- schema.groups exists with populated slot_ids
- The user treats this as a single coordinated order
- Example: "Order office lunch for the whole team to one address"

**"timeline"** — Use when:
- Orders are staggered across different target times
- The user cares about delivery sequence and timing
- Example: "Order breakfast at 8am, snacks at 10am, and lunch at noon"
- Also use when a time_conflict warning exists for any slot

---

### grouping_strategy

**"by_person"** (default) — Use when each person has distinct preferences or items.
Best for personalised orders, dietary restrictions, individual customisations.

**"by_restaurant"** — Use when multiple people are ordering from the same restaurant,
or when comparing what's coming from each restaurant matters more than who ordered it.
Good for bulk orders or catering scenarios.

**"by_time"** — Use when orders span multiple time windows and the user cares about
delivery sequencing. Always pair with `view_mode: "timeline"` when possible.

**Combination recommendations:**
- Office lunch (same address, varied preferences) → `unified` + `by_person`
- Catering from 2 restaurants → `unified` + `by_restaurant`
- Multi-meal day (breakfast/lunch/dinner) → `timeline` + `by_time`
- Quick comparison of independent orders → `split` + `by_person`
- Large event with clustered delivery windows → `timeline` + `by_restaurant`

---

## HIGHLIGHT

`schema.layout.highlight` is an array of `slot_id` strings. Highlighted slots render
with an amber ring, amber border, and a gradient ribbon. Use highlight to draw the
user's attention to something that needs action.

**When to highlight:**

1. **Conflict resolution needed:** A slot has a time_conflict or min_order warning —
   highlight its slot_id so the user immediately sees which card to act on.

2. **Budget risk:** The slot with the most expensive subtotal when over budget.

3. **Unavailable items:** Any slot containing an item with `available: false`.

4. **Personalisation call-out:** When a person has a critical dietary need (e.g.
   severe allergy) that you want the user to double-check before placing the order.

5. **New or recently changed slot:** If the AI just added or modified a slot in response
   to the user's edit, highlight it so the user sees what changed.

**Do not highlight every slot.** Highlight is a signal; overusing it defeats the purpose.
Highlight 1–2 slots maximum unless there is a genuine reason for more.

---

## SCHEMA SHAPE REFERENCE

```json
{
  "slots": [
    {
      "slot_id": "slot_001",
      "person": {
        "name": "string",
        "preferences": { "<key>": "<value>" }
      },
      "restaurant_id": "string — must match restaurants.json id",
      "items": [
        {
          "item_id": "string — must match menus.json id",
          "quantity": 1,
          "variant": "string or null",
          "notes": "string or null"
        }
      ],
      "delivery": {
        "address": "string",
        "target_time": "ISO 8601",
        "estimated_arrival": "ISO 8601"
      },
      "subtotal": 0
    }
  ],
  "groups": [
    {
      "group_id": "string",
      "label": "string",
      "slot_ids": ["slot_001"],
      "shared": { "<key>": true }
    }
  ],
  "constraints": {
    "<key>": "<value>"
  },
  "warnings": [
    {
      "type": "string",
      "message": "string",
      "affected_slot_ids": ["slot_001"],
      "suggestion": "string or omit"
    }
  ],
  "layout": {
    "view_mode": "split | unified | timeline",
    "grouping_strategy": "by_person | by_restaurant | by_time",
    "highlight": ["slot_001"]
  }
}
```

---

*This document is machine-readable. Do not add commentary outside this format.*
*Last updated to match component API version 1.0.0*
