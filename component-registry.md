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
- `schema.warnings` — array of warning objects
- `schema.constraints` — object with budget / headcount / occasion

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
  - `option.estimated_arrival` — ISO 8601 string
  - `option.highlight_reason` — one-sentence label explaining why this option fits

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
- `warning.suggestion` — string or omit
- `warning.related_slot_ids` — array of slot_ids (required)

**Severity mapping:**
- "blocking" → red, prevents checkout
- "info" → yellow/orange, dismissible

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

1. Budget: `{ "total_budget": "Rp150k", "occasion": "office lunch", "headcount": 4 }`
2. Time-sensitive: `{ "max_delivery_time": "30 minutes", "target_arrival": "12:30", "headcount": 8 }`
3. Dietary event: `{ "diet_requirement": "all halal certified", "occasion": "team iftar", "headcount": 12 }`

Include a budget key when the user mentions a spending limit. BudgetBar shows the progress bar only if a parseable budget key exists.

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
          "estimated_arrival": "ISO 8601",
          "highlight_reason": "string"
        }
      ],
      "delivery": {
        "address": "string or null",
        "target_time": "ISO 8601 or null",
        "estimated_arrival": "ISO 8601"
      }
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
  "constraints": { "<key>": "<value>" },
  "warnings": [
    {
      "code": "string",
      "message": "string",
      "severity": "blocking | info",
      "related_slot_ids": ["slot_001"],
      "suggestion": "string or omit"
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
  }
}
```

---

*This document is machine-readable. Do not add commentary outside this format.*
*Last updated to match component API version 1.x*
