/**
 * Shared types for Receipt Splitter.
 *
 * Layered from database → UI:
 *   1. Database tables (Split, Participant, Item)
 *   2. Parse layer (what Claude returns)
 *   3. Computed UI state (reconciliation, per-person totals)
 *   4. API contracts (requests/responses)
 */

// ─────────────────────────────────────────────
// 1. DATABASE — matches Supabase schema
// ─────────────────────────────────────────────

export interface Split {
  id: string
  user_id: string
  created_at: string
  restaurant_name: string | null
  bill_subtotal: number
  bill_vat: number
  bill_service_charge: number
  bill_total: number
  tip_percent: number
  finalised_at: string | null
  adjustment: number
}

export interface Participant {
  id: string
  split_id: string
  name: string
  color: string | null
  created_at: string
}

export interface Item {
  id: string
  split_id: string
  name: string
  price: number
  claimed_by: string[]
  position: number
}

// ─────────────────────────────────────────────
// 2. PARSE LAYER — what Claude returns
// ─────────────────────────────────────────────

export interface ParsedReceipt {
  restaurant_name: string | null
  items: ParsedLineItem[]
  subtotal: number | null
  vat: number | null
  service_charge: number | null
  total: number | null
}

export interface ParsedLineItem {
  name: string
  price: number
}

// ─────────────────────────────────────────────
// 3. COMPUTED UI STATE
// ─────────────────────────────────────────────

export interface ReconciliationState {
  claimed_subtotal: number
  bill_subtotal: number
  difference: number
  status: 'unclaimed' | 'matched' | 'over-claimed'
}

export interface PersonTotal {
  participant: Participant
  claimed_subtotal: number
  claimed_items: string[]
  vat_share: number
  service_share: number
  tip_share: number
  total: number
}

// ─────────────────────────────────────────────
// 4. API CONTRACTS
// ─────────────────────────────────────────────

export interface ParseReceiptRequest {
  image: string
  mediaType?: string
}

export interface ApiError {
  error: string
  details?: string
}