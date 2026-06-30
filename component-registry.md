# Multi-Restaurant Meal Order Builder — Component Registry

## PURPOSE

This document maps each rendered UI component to the schema fields it depends on. Every field described here must be present in the AI-generated order schema for the corresponding UI element to render.

> **Note on schema shape:** Each slot has `options[]` (alternative configurations). The `selected_option_id` picks the active option. Items, subtotal, and restaurant are all **inside** the option, not at the slot level.

---

## COMPONENTS

### LayoutShell

**Renders:** The full order interface. Wraps warning banners, shared requirements bar, slot cards, and the order summary panel.

**Props:**
- `schema` — full order schema object
- `restaurants` — array from `restaurants.json`
- `menus` — array from `menus.json`
- `onSchemaChange` — callback for user modifications

**Schema fields it depends on:**
- `schema.slots` — array of slot objects (required)
- `schema.shared_requirements` — array (optional)
- `schema.warnings` — array of warning objects (optional)
- `schema.constraints` — object with budget / headcount / occasion (optional)
- `schema.diff` — object (refinement only; optional, used for visual indicators)
- `schema.order_summary` — order totals from AI (shown when cart is empty)
- `schema.order` — user cart state with `items[]` (built by user action; not from AI)

---

### SlotCard

**Renders:** One person's order. Shows restaurant info, ordered items with controls, and option selector tabs.

**Props:**
- `slot` — a single slot object from `schema.slots`
- `restaurants` / `menus` — full data arrays for lookups

**Schema fields it depends on (one slot):**
- `slot.slot_id` — unique string identifier
- `slot.person.name` — string
- `slot.person.preferences` — open object; all key-value pairs render as badges
- `slot.selected_option_id` — string referencing an option inside `slot.options[]`
- `slot.delivery` — delivery details for this slot:
  - `delivery.address` — string or null (user-provided delivery address)
  - `delivery.target_time` — ISO 8601 string or null (ASAP if null)
  - `delivery.estimated_arrival` — ISO 8601 string (mirrored from selected option's estimated_arrival)
- `slot.options[]` — array of 1–3 alternative configurations:
  - `option.option_id` — unique string
  - `option.label` — short human-readable name (e.g. "Cheapest")
  - `option.restaurant_id` — must match a restaurant's `id` in `restaurants.json`
  - `option.items[]` — ordered items:
    - `item_id` — must match a menu item's `id` in `menus.json`
    - `quantity` — positive integer
    - `variant` — string or null (must match a variant name in the item's variants)
    - `notes` — string or null
  - `option.subtotal` — food total in IDR
  - `option.delivery_fee` — restaurant delivery fee in IDR
  - `option.meets_min_order` — boolean, true if subtotal >= the matched restaurant's min_order
  - `option.meets_preferences` — boolean, true only if every strict preference key in this slot's `person.preferences` is satisfied by the items actually present in this option
  - `option.deadline_ok` — boolean or null. null means the user gave no deadline. true/false means this specific option does or does not arrive within the user's stated deadline.
  - `option.estimated_arrival` — ISO 8601 string (current_time + restaurant.delivery_time_minutes + max(preparation_time_minutes across this option's items))
  - `option.highlight_reason` — max 12 words. States only what is NOT already obvious from items[] and the boolean flags — e.g. why this one over the others (fastest, best value, premium pick).

**Option Selection Priority**
Preference correctness is a precondition, not a tiebreaker. The AI generates options from items that satisfy every strict preferences key (the "Option Generation Floor"). Among those options:
1. Eliminate any option where `meets_min_order` is false, unless every option fails min_order (in which case keep all eligible and surface MIN_ORDER_NOT_MET).
2. Among remaining options, eliminate any where `deadline_ok` is false, unless every remaining option fails the deadline (in which case keep all eligible and surface UNREALISTIC_DEADLINE).
3. If still tied, pick the lowest subtotal.

All originally generated options remain visible in `options[]` regardless of elimination; only `selected_option_id` is affected. The UI may render a non-selected option tab that has `meets_min_order: false`, `meets_preferences: false`, or `deadline_ok: false` — those flags exist so the option tab can show why it wasn't chosen.

---

### PersonTag

**Renders:** Person's name with an avatar initial, plus preference badges.

**Schema fields it depends on:**
- `slot.person.name` — string
- `slot.person.preferences` — open object; every key-value pair becomes a colour-coded badge

---

### ItemRow

**Renders:** One ordered item inside a SlotCard. Name, description, variant selector, quantity stepper, notes, and line total.

**Schema fields it depends on:**
- `item.item_id` — matched to a `menus.json` entry
- `item.quantity` — integer ≥ 1
- `item.variant` — string or null
- `item.notes` — string or null

**From the matched menu item:**
- `item.name`, `item.description`, `item.price` — always required
- `item.variants[]` — optional; if present, a variant selector renders
- `item.available` — if false, a muted "Unavailable" badge renders
- `item.promo` — optional; when present, a promo badge and discounted price renders. Shape: `{ type, discount_percent, discounted_price, label }`

**Line total formula:** (effective_base_price + active_variant.price_delta) × quantity
- `effective_base_price` = `item.promo.discounted_price` when `item.promo` is present, otherwise `item.price`

---

### SlotCard — Delivery Section

**Renders:** Delivery address, target time, and estimated arrival for the selected option.

**Schema fields it depends on:**
- `slot.delivery.address` — shown as the delivery address label
- `slot.delivery.target_time` — shown as "Target: HH:MM" when not null
- `slot.delivery.estimated_arrival` — shown as the delivery time estimate (derived from chosen option)
- `option.estimated_arrival` — used to set `slot.delivery.estimated_arrival` on the backend

---

### BudgetBar

**Renders:** Grand total, food subtotal, delivery total, slot count, and — if a budget key exists in constraints — a colour-coded progress bar.

**Schema fields it depends on:**
- `schema.slots[].options[].subtotal` — summed for food total
- `schema.slots[].options[].restaurant_id` — used to look up delivery_fee per restaurant
- `schema.constraints` — scanned for a budget key

**Budget parsing:** Keys matching /budget|limit|max|total/i (case-insensitive) are parsed as IDR:
- "Rp150k" → 150,000
- "Rp 1.5jt" → 1,500,000
- Plain number → treated as IDR directly

**Colour thresholds:** ≥100% red (over), ≥80% amber (near), <80% green.

---

### WarningBanner

**Renders:** Dismissible alert with warning type, message, suggestion, and affected slot count.

**Schema fields it depends on (one warning):**
- `warning.code` — string (e.g. "MIN_ORDER_NOT_MET", "MISSING_ADDRESS")
- `warning.message` — string (shown as primary alert text)
- `warning.severity` — "blocking" or "info"
- `warning.suggestion` — string or omit (shown as secondary guidance below the message)
- `warning.related_slot_ids` — array of slot_ids (required)
- `warning.related_item_ids` — array of item_ids (optional, for deep-linking)

**Severity mapping:**
- "blocking" → red, prevents checkout
- "info" → yellow/orange, dismissible

---

### SharedRequirementsBar

**Renders:** Shared requirement chips with slot count and resolution status from the AI.

**Schema fields it depends on (one requirement):**
- `requirement.requirement_id` — string
- `requirement.label` — display text for the chip
- `requirement.slot_ids` — array of slot_ids (used to show "X people")
- `requirement.resolution_note` — string or omit (explains what was done, e.g. "Slots at different restaurants got closest matching items")
- `requirement.resolved_items[]` — array of `{ slot_id, item_id, restaurant_id }` showing exactly which items satisfied this requirement per slot

---

### OrderSummaryPanel / OrderSummaryCard

**Renders:** Grand total, per-restaurant breakdown, delivery fees, budget progress, and checkout button.

**Schema fields it depends on:**
- `schema.order_summary` (AI-computed — shown when user cart is empty):
  - `order_summary.restaurant_breakdown[]` — per-restaurant totals
  - `order_summary.grand_total` — combined total of all selected options
  - `order_summary.checkout_ready` — whether checkout is allowed
  - `order_summary.blocking_issues[]` — warnings blocking checkout
- `schema.order` (user cart — used once items are added by user action):
  - `order.items[]` — user-selected items with quantities, line totals
- `schema.constraints.total_budget` — triggers budget progress bar display
- `schema.constraints.headcount` — shows per-head cost when budget is set
- `schema.constraints.occasion` — shown as context in the order summary header
- `schema.constraints` (other keys) — displayed as order context badges

---

## DYNAMIC FIELDS

The following schema fields are open objects. The AI invents both keys and values based on the user's request. Never assume a fixed key set.

---

### slot.person.preferences

Each key is a preference category; each value is the user's stance.

Examples:

1. Office halal lunch: `{ "halal": "strictly yes", "avoid": "onion, garlic" }`
2. Kids birthday party: `{ "allergen": "no nuts", "spice": "mild only", "portion": "child size" }`
3. Corporate catering: `{ "diet": "vegan", "gluten": "free required", "budget": "premium ok" }`
4. Gym post-workout: `{ "protein": "high", "carbs": "moderate", "calories": "under 700" }`

Add as many keys as needed.

---

### schema.constraints

Each key describes a constraint on the overall order.

Examples:

1. Budget: `{ "total_budget": 150000, "occasion": "office lunch", "headcount": 4 }`
2. Time-sensitive: `{ "max_delivery_time": "30 minutes", "target_arrival": "12:30", "headcount": 8 }`
3. Dietary event: `{ "diet_requirement": "all halal certified", "occasion": "team iftar", "headcount": 12 }`

Include a budget key when the user mentions a spending limit. BudgetBar shows the progress bar only if a parseable budget key exists.

Money values in constraints: raw numbers (e.g. `"total_budget": 150000`).
Time/duration values: short natural-language phrases (e.g. `"deadline": "under 60 minutes"`, `"max_delivery_time": "30 minutes"`, `"target_arrival": "12:30"`).
Other values: short descriptive phrases (e.g. `"occasion": "office lunch"`, `"headcount": 4`).

---

### schema.warnings

Each warning needs at minimum: `code`, `message`, `severity`, `related_slot_ids`. Add `suggestion` whenever possible.

Examples:

```json
{
  "code": "MIN_ORDER_NOT_MET",
  "message": "slot_003 is Rp5,000 below rest_002's minimum order of Rp20,000",
  "severity": "blocking",
  "related_slot_ids": ["slot_003"],
  "suggestion": "Add one more item to meet the minimum."
}
```

```json
{
  "code": "MULTI_RESTAURANT_ORDER",
  "message": "Order spans 3 different restaurants.",
  "severity": "info",
  "related_slot_ids": ["slot_001", "slot_002", "slot_003"],
  "suggestion": "Review delivery fees — each restaurant charges its own."
}
```

Generate warnings only for real, verifiable problems. Do not fabricate warnings.

---

### schema.diff (included only in refinement responses)

An object describing what changed during conversational refinement. Rendered by the UI to communicate updates to the user through subtle visual indicators — not explicit text announcements.

**Shape:**
```json
{
  "diff": {
    "added": [{ "slot_id": "string", "description": "string" }],
    "removed": [{ "slot_id": "string", "description": "string" }],
    "modified": [{ "slot_id": "string", "field": "string", "description": "string" }],
    "rejected": [{ "instruction": "string", "reason": "string" }]
  }
}
```

**UI effects:**
- `added`: slots show a "New" pill badge and fade-in animation for 6 seconds
- `modified`: slots get a blue left-border highlight for 4 seconds
- `rejected`: displayed as a dismissible warning banner at the top of the layout

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
      "selected_option_id": "opt_001",
      "delivery": {
        "address": "string or null",
        "target_time": "ISO 8601 or null",
        "estimated_arrival": "ISO 8601"
      },
      "options": [
        {
          "option_id": "opt_001",
          "label": "string",
          "restaurant_id": "string — must match restaurants.json id and be open",
          "items": [
            {
              "item_id": "string — must match menus.json id with available: true",
              "quantity": 1,
              "variant": "string or null",
              "notes": "string or null"
            }
          ],
          "subtotal": 0,
          "delivery_fee": 0,
          "meets_min_order": true,
          "meets_preferences": true,
          "deadline_ok": true,
          "estimated_arrival": "ISO 8601",
          "highlight_reason": "string"
        }
      ]
    }
  ],
  "shared_requirements": [
    {
      "requirement_id": "string",
      "label": "string",
      "slot_ids": ["slot_001"],
      "resolution_note": "string",
      "resolved_items": [{ "slot_id": "string", "item_id": "string", "restaurant_id": "string" }]
    }
  ],
  "order_summary": {
    "restaurant_breakdown": [
      {
        "restaurant_id": "string",
        "slot_ids": ["slot_001"],
        "items_subtotal": 0,
        "delivery_fee": 0,
        "min_order": 0,
        "meets_min_order": true
      }
    ],
    "grand_total": 0,
    "checkout_ready": true,
    "blocking_issues": []
  },
  "constraints": { "<key>": "<value>" },
  "warnings": [
    {
      "code": "string",
      "message": "string",
      "severity": "blocking | info",
      "related_slot_ids": ["slot_001"],
      "suggestion": "string or omit",
      "related_item_ids": ["item_001"]
    }
  ]
}
```

---

*This document is machine-readable. Do not add commentary outside this format.*
*Last updated to match component API version 1.x*
