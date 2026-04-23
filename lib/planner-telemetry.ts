/**
 * Planner telemetry
 *
 * Fires structured events to the planner_events table for every meaningful
 * teacher interaction. These events are the raw data for:
 *   - time-to-plan (EEF-equivalent metric)
 *   - edit rate (sections revised / total sections)
 *   - export-without-edit rate
 *   - regeneration rate per section
 *
 * All calls are fire-and-forget — a telemetry failure must never surface
 * to the teacher or block any user action.
 *
 * Event catalogue (mirrors spec §9):
 *   planner_form_opened        — teacher opens /lesson-pack
 *   planner_submitted          — teacher clicks Generate
 *   planner_safeguarding_intercept — input scanner fired
 *   section_generated          — one section completed by engine
 *   plan_ready                 — all sections complete
 *   section_accepted           — teacher accepts a section (explicit or on export)
 *   section_revised            — teacher edits a section inline
 *   section_rejected           — teacher rejects a section
 *   section_regenerated        — teacher requests a redo of one section
 *   plan_exported              — teacher downloads PDF / copies to clipboard
 *   cpd_prompt_shown           — CPD micro-prompt appears
 *   cpd_prompt_engaged         — teacher interacts with CPD prompt
 */

export type PlannerEventType =
  | "planner_form_opened"
  | "planner_submitted"
  | "planner_safeguarding_intercept"
  | "section_generated"
  | "plan_ready"
  | "section_accepted"
  | "section_revised"
  | "section_rejected"
  | "section_regenerated"
  | "plan_exported"
  | "cpd_prompt_shown"
  | "cpd_prompt_engaged";

export interface PlannerEventPayload {
  // planner_submitted
  year_group?: string;
  subject?: string;
  topic?: string;
  tags?: string[];
  objective_length?: number;
  // planner_safeguarding_intercept
  matched_category?: string;
  // section_generated / accepted / revised / rejected / regenerated
  section_key?: string;
  tokens_in?: number;
  tokens_out?: number;
  duration_ms?: number;
  edit_distance?: number;
  had_instruction?: boolean;
  // plan_ready
  total_duration_ms?: number;
  total_tokens?: number;
  // plan_exported
  format?: string;
  elapsed_since_ready_ms?: number;
  // cpd_prompt_shown / engaged
  prompt_id?: string;
  action?: string;
  // anything else
  [key: string]: unknown;
}

/**
 * Fire a telemetry event. Always non-blocking — errors are silently swallowed.
 */
export function trackEvent(
  userId: string,
  eventType: PlannerEventType,
  payload: PlannerEventPayload = {},
  planId?: string
): void {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || !userId) return;

  const body: Record<string, unknown> = {
    user_id: userId,
    event_type: eventType,
    payload,
  };
  if (planId) body.plan_id = planId;

  fetch(`${url}/rest/v1/planner_events`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(body),
  }).catch(() => {});
}

/**
 * Client-side helper: POST to an API route that fires the event server-side.
 * Use this from React components where server env vars are not available.
 */
export async function trackEventClient(
  eventType: PlannerEventType,
  payload: PlannerEventPayload = {},
  planId?: string
): Promise<void> {
  try {
    await fetch("/api/planner/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventType, payload, planId }),
    });
  } catch {
    // Never surface telemetry failures to the user
  }
}
