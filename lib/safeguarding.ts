/**
 * Safeguarding input scanner
 *
 * Intercepts teacher input before it reaches any AI model.
 * If a safeguarding keyword is detected the content is never sent to the model;
 * instead the teacher is redirected to their school's designated safeguarding
 * lead (DSL) process.
 *
 * Design principles:
 * - Conservative: false positives are better than false negatives
 * - No content stored: we log *that* an intercept occurred and its category,
 *   never the teacher's input itself
 * - UK primary school context: terminology matches Keeping Children Safe in
 *   Education (KCSiE) and the DfE generative AI product safety expectations
 */

export type SafeguardingCategory =
  | "abuse_disclosure"
  | "self_harm"
  | "neglect"
  | "sexual_content"
  | "radicalisation"
  | "domestic_violence"
  | "substance_misuse"
  | "online_harm";

interface ScanResult {
  safe: boolean;
  category?: SafeguardingCategory;
  matchedTerm?: string;
}

/**
 * Keyword lists by category.
 * Each entry is a word-boundary regex fragment (case-insensitive).
 * Deliberately broad — a teacher planning lesson content should not
 * encounter these; if they appear it warrants human review.
 */
const CATEGORIES: Record<SafeguardingCategory, string[]> = {
  abuse_disclosure: [
    "abuse",
    "abused",
    "abusing",
    "hit me",
    "hurts me",
    "hurting me",
    "bruise",
    "beaten",
    "smacked",
    "physical abuse",
    "emotional abuse",
    "verbal abuse",
    "neglected",
    "disclosure",
    "disclosed",
  ],
  self_harm: [
    "self.harm",
    "self harm",
    "self-harm",
    "cutting myself",
    "hurting myself",
    "suicide",
    "suicidal",
    "want to die",
    "kill myself",
    "end my life",
    "overdose",
  ],
  neglect: [
    "not fed",
    "no food",
    "no clothes",
    "left alone",
    "no one looks after",
    "parents don't care",
    "mum doesn't care",
    "dad doesn't care",
  ],
  sexual_content: [
    "sexual abuse",
    "sexually abused",
    "rape",
    "raped",
    "molested",
    "inappropriate touching",
    "grooming",
    "groomed",
    "indecent",
  ],
  radicalisation: [
    "radicalised",
    "extremist",
    "terrorism",
    "terrorist",
    "jihad",
    "far right",
    "channel referral",
    "prevent referral",
  ],
  domestic_violence: [
    "domestic violence",
    "domestic abuse",
    "mum hit",
    "dad hit",
    "parents fighting",
    "hitting at home",
    "violence at home",
  ],
  substance_misuse: [
    "drug",
    "drugs",
    "cocaine",
    "heroin",
    "cannabis",
    "weed",
    "alcohol abuse",
    "drunk parent",
    "drunk mum",
    "drunk dad",
  ],
  online_harm: [
    "online grooming",
    "sent pictures",
    "asked for pictures",
    "sexting",
    "cyberbullying",
    "threatened online",
    "sextortion",
  ],
};

/**
 * Scans free-text teacher input for safeguarding-related content.
 * Returns { safe: true } if clean, or { safe: false, category, matchedTerm } if flagged.
 */
export function scanInput(text: string): ScanResult {
  const normalised = text.toLowerCase();

  for (const [category, terms] of Object.entries(CATEGORIES) as [SafeguardingCategory, string[]][]) {
    for (const term of terms) {
      // Word-boundary aware: won't fire on "drug" inside "drugstore" for simple words,
      // but multi-word phrases are matched as substrings (intentionally conservative).
      const pattern = term.includes(" ") || term.includes(".")
        ? term.replace(/\./g, "\\s*")
        : `\\b${term}\\b`;
      if (new RegExp(pattern, "i").test(normalised)) {
        return { safe: false, category, matchedTerm: term };
      }
    }
  }

  return { safe: true };
}

/**
 * Logs a safeguarding intercept to Supabase.
 * Stores only the category — never the teacher's input.
 * Uses the service-role key so this works server-side even if the
 * teacher's session is not yet validated.
 */
export async function logIntercept(
  userId: string,
  category: SafeguardingCategory
): Promise<void> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return;

  await fetch(`${url}/rest/v1/safeguarding_intercepts`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ user_id: userId, matched_category: category }),
  }).catch(() => {
    // Never let a logging failure surface to the user
  });
}
