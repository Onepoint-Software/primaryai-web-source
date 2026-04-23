/**
 * Hallucination detector
 *
 * Scans generated lesson pack text for patterns that commonly indicate
 * hallucinated or unverifiable facts:
 *   - Specific historical dates or years cited as fact
 *   - Precise statistics or percentages
 *   - Named researchers / studies cited as evidence
 *   - Named publications or reports
 *
 * This is a conservative regex scan — it flags things a teacher should
 * verify, not things that are necessarily wrong. False positives are
 * acceptable; false negatives (missing a hallucination) are not.
 *
 * Runs entirely client-side, zero added latency.
 */

export type HallucinationCategory =
  | "statistic"
  | "named_researcher"
  | "historical_date"
  | "named_publication";

export interface HallucinationFlag {
  category: HallucinationCategory;
  excerpt: string;        // The matched text snippet (max 120 chars)
  context: string;        // The surrounding sentence for display
  advice: string;         // What the teacher should do
}

// ── Pattern definitions ───────────────────────────────────────────────────────

const PATTERNS: Array<{
  category: HallucinationCategory;
  regex: RegExp;
  advice: string;
}> = [
  {
    category: "statistic",
    // Matches things like "75%", "1 in 3", "31 per cent", "around 40%"
    regex: /\b(?:(?:around|approximately|nearly|over|about|up to)\s+)?(?:\d{1,3}(?:\.\d+)?%|\d+\s+in\s+\d+|\d+\s+per\s+cent)\b/gi,
    advice: "Verify this statistic with a named source before sharing with colleagues.",
  },
  {
    category: "named_researcher",
    // Matches "Hattie found", "Rosenshine showed", "Vygotsky argued", etc.
    // Also "Research by Smith" / "A study by Jones"
    regex: /\b(?:[A-Z][a-z]+(?: [A-Z][a-z]+)?)\s+(?:found|showed|demonstrated|argued|concluded|suggested|reported|identified|noted|states|claimed|proposed|established)\b/g,
    advice: "Check this researcher's name and finding — AI often confuses or invents citations.",
  },
  {
    category: "named_researcher",
    // "According to Hattie", "as shown by Rosenshine"
    regex: /\b(?:according to|as shown by|as demonstrated by|cited by|per)\s+(?:[A-Z][a-z]+(?: [A-Z][a-z]+)?)\b/gi,
    advice: "Verify this citation — named researchers are a common hallucination point.",
  },
  {
    category: "historical_date",
    // Years 1000–2025 used as factual claims: "in 1066", "by 1832", "since 1944"
    regex: /\b(?:in|by|since|from|during|after|before|around|until)\s+(?:1[0-9]{3}|20[01][0-9]|202[0-5])\b/gi,
    advice: "Confirm this date against the National Curriculum programme of study or a reliable source.",
  },
  {
    category: "named_publication",
    // "the Education Endowment Foundation report", "the DfE guidance on...", named reports
    regex: /\b(?:the\s+)?(?:[A-Z][a-zA-Z]+(?: [A-Z][a-zA-Z]+){1,4})\s+(?:report|study|paper|review|guidance|framework|publication|journal|survey|trial|analysis)\b/g,
    advice: "Check this publication exists and that the finding described is accurate.",
  },
];

// Sentences that include a pattern match — used to extract context
function extractContext(text: string, matchIndex: number, matchLength: number): string {
  // Find the sentence containing the match
  const start = Math.max(0, text.lastIndexOf(".", matchIndex - 1) + 1);
  const end = text.indexOf(".", matchIndex + matchLength);
  const sentence = text.slice(start, end > -1 ? end + 1 : start + 200).trim();
  return sentence.length > 150 ? sentence.slice(0, 147) + "…" : sentence;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Flatten a lesson pack object into a single searchable string,
 * keeping track of which field each text came from (for deduplication).
 */
function flattenPack(pack: Record<string, unknown>): string {
  const parts: string[] = [];

  function walk(value: unknown) {
    if (typeof value === "string") {
      parts.push(value);
    } else if (Array.isArray(value)) {
      value.forEach(walk);
    } else if (value && typeof value === "object") {
      Object.values(value as Record<string, unknown>).forEach(walk);
    }
  }

  walk(pack);
  return parts.join(" ");
}

/**
 * Scan a lesson pack and return any hallucination flags found.
 * Deduplicates identical excerpts to avoid noise.
 */
export function scanForHallucinations(pack: Record<string, unknown>): HallucinationFlag[] {
  const text = flattenPack(pack);
  const flags: HallucinationFlag[] = [];
  const seenExcerpts = new Set<string>();

  // Skip scanning internal metadata fields
  const textWithoutMeta = text.replace(/"_meta"[\s\S]*?(?=\})/g, "");

  for (const { category, regex, advice } of PATTERNS) {
    regex.lastIndex = 0; // reset stateful regex
    let match: RegExpExecArray | null;

    while ((match = regex.exec(textWithoutMeta)) !== null) {
      const excerpt = match[0].trim();

      // Skip very short matches (e.g. single capital letter) and deduplicate
      if (excerpt.length < 4 || seenExcerpts.has(excerpt.toLowerCase())) continue;

      // Skip known-safe educator names that are legitimate curriculum references
      const SAFE_NAMES = ["National Curriculum", "Key Stage", "Year Group", "Ofsted", "DfE"];
      if (SAFE_NAMES.some(safe => excerpt.includes(safe))) continue;

      seenExcerpts.add(excerpt.toLowerCase());

      const context = extractContext(textWithoutMeta, match.index, excerpt.length);

      flags.push({ category, excerpt, context, advice });

      // Cap at 10 flags to avoid overwhelming the teacher
      if (flags.length >= 10) return flags;
    }
  }

  return flags;
}

export const CATEGORY_META: Record<HallucinationCategory, { label: string; color: string; icon: string }> = {
  statistic:         { label: "Statistic",        color: "#f59e0b", icon: "%" },
  named_researcher:  { label: "Named researcher",  color: "#ef4444", icon: "👤" },
  historical_date:   { label: "Historical date",   color: "#8b5cf6", icon: "📅" },
  named_publication: { label: "Named publication", color: "#3b82f6", icon: "📄" },
};
