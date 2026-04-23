/**
 * CPD micro-prompts
 *
 * One pedagogical principle is surfaced to the teacher per session.
 * Chosen by cycling through the list deterministically (not randomly),
 * so a teacher who uses PrimaryAI regularly encounters all principles
 * over time rather than seeing favourites repeatedly.
 *
 * Session position is stored in sessionStorage so it resets when the
 * teacher closes their browser, but persists across navigations within
 * a session (principle 4: teach the tool while using it).
 *
 * Each prompt has:
 *   id          — stable identifier for telemetry
 *   principle   — the named pedagogical concept
 *   headline    — one sentence the teacher reads on the banner
 *   detail      — 2–3 sentences of elaboration shown on expand
 *   source      — citation or further reading link
 *   oecd        — which OECD AI Literacy domain this builds
 */

export interface CpdPrompt {
  id: string;
  principle: string;
  headline: string;
  detail: string;
  source: string;
  oecd: string;
}

export const CPD_PROMPTS: CpdPrompt[] = [
  {
    id: "retrieval-001",
    principle: "Retrieval practice",
    headline: "Starting with retrieval boosts long-term retention by up to 50% compared to re-reading.",
    detail: "Retrieval practice (the testing effect) strengthens memory traces by forcing the brain to reconstruct knowledge. Even low-stakes quizzes at the start of a lesson produce measurable gains. The AI generated a retrieval starter for this lesson — check whether it targets prior learning from at least one week ago.",
    source: "Roediger & Karpicke (2006), Science. EEF Teaching and Learning Toolkit: Metacognition and self-regulated learning.",
    oecd: "Engage with AI — evaluate AI outputs against evidence-informed pedagogy",
  },
  {
    id: "spacing-001",
    principle: "Spacing effect",
    headline: "Lessons work better when they revisit prior content — spacing practice across time beats massed practice.",
    detail: "Distributing practice across multiple sessions outperforms concentrated practice in a single sitting. PrimaryAI's lesson hook and plenary are designed to create spacing opportunities. Ask yourself: when did pupils last encounter this concept, and does the plan include a retrieval bridge from that lesson?",
    source: "Cepeda et al. (2006), Psychological Bulletin. EEF Teaching and Learning Toolkit.",
    oecd: "Create with AI — collaborate with AI to elicit feedback and refine",
  },
  {
    id: "cogload-001",
    principle: "Cognitive load theory",
    headline: "Working memory is limited — good lesson design manages what pupils hold in mind at once.",
    detail: "Sweller's cognitive load theory distinguishes intrinsic load (the difficulty of the content), extraneous load (poorly designed instruction), and germane load (useful processing). Worked examples reduce extraneous load for novices; problem-solving becomes more appropriate as expertise grows. Review the worked example in this plan: does it break the problem into steps?",
    source: "Sweller (1988), Cognitive Science. EEF: Explicit instruction.",
    oecd: "Manage AI — determine when and how to use AI, retaining human judgement",
  },
  {
    id: "rosenshine-001",
    principle: "Rosenshine's Principles",
    headline: "Daily review, small steps, and checking for understanding are Rosenshine's three most impactful principles.",
    detail: "Rosenshine's 10 Principles of Instruction are drawn from research on effective teaching. The three with the strongest evidence base: begin with a short review of prior learning, present new material in small steps with practice at each step, and ask many questions to check understanding. Scan this lesson plan: does the structure reflect these three?",
    source: "Rosenshine (2012), American Educator. Available free via EEF.",
    oecd: "Engage with AI — recognise AI's role and evaluate its outputs",
  },
  {
    id: "dualcoding-001",
    principle: "Dual coding",
    headline: "Combining words and visuals is more effective than either alone — but only when they're integrated.",
    detail: "Paivio's dual coding theory holds that verbal and visual channels are processed separately, and combining them reduces load on either channel alone. The key condition: the image must be directly relevant and integrated with the text, not decorative. Does this lesson plan suggest visual representations for any abstract concepts?",
    source: "Paivio (1991). Clark & Paivio (1991), Educational Psychology Review.",
    oecd: "Create with AI — explore new perspectives that build on original ideas",
  },
  {
    id: "formative-001",
    principle: "Formative assessment (AfL)",
    headline: "Assessment for learning is most effective when it changes what you do in the next 5 minutes.",
    detail: "Dylan Wiliam defines formative assessment as evidence used to adapt teaching while it can still make a difference — not at the end of the unit. The mini-assessment and exit ticket in this plan are formative tools. Ask yourself: if half the class struggles with the exit ticket, what will you do differently next lesson?",
    source: "Black & Wiliam (1998), Inside the Black Box. Wiliam (2011), Embedded Formative Assessment.",
    oecd: "Manage AI — retain human responsibility for judgement on pupil progress",
  },
  {
    id: "modelling-001",
    principle: "Explicit modelling (I do, We do, You do)",
    headline: "The I do–We do–You do structure is one of the most reliably effective instructional sequences in primary classrooms.",
    detail: "Gradual release of responsibility: the teacher models first (I do), works through an example with the class (We do), then pupils work independently (You do). This structure is explicit in the worked example section of this plan. Before you teach: can you narrate your thinking aloud during the I do phase without referring to notes?",
    source: "Fisher & Frey (2008), Better Learning Through Structured Teaching.",
    oecd: "Create with AI — collaborate to elicit feedback and refine results",
  },
  {
    id: "afl-questioning-001",
    principle: "High-quality questioning",
    headline: "Most classroom questions are closed recall questions — open, Bloom's-aligned questions do more cognitive work.",
    detail: "Research on classroom questioning shows that the majority of teacher questions are low-order recall. The thinking questions in this plan are structured around Bloom's taxonomy. Before the lesson, choose 2–3 questions you will definitely ask, and decide how you will handle it if no pupil can answer.",
    source: "Walsh & Sattes (2005), Quality Questioning. Bloom et al. (1956), Taxonomy of Educational Objectives.",
    oecd: "Engage with AI — evaluate AI outputs for accuracy, fairness and bias",
  },
  {
    id: "send-001",
    principle: "Universal Design for Learning (UDL)",
    headline: "Designing for the most marginalised pupil usually improves the lesson for everyone.",
    detail: "UDL, developed by CAST, asks teachers to provide multiple means of representation, action and expression, and engagement. SEND adaptations are not add-ons — they are often the clearest signal of where the main lesson design has gaps. Review the SEND adaptations in this plan: could any of them benefit your core group too?",
    source: "CAST (2018), Universal Design for Learning Guidelines v2.2. EEF: SEND in Mainstream Schools.",
    oecd: "Manage AI — determine when and how to use AI, assessing risks and ethical implications",
  },
  {
    id: "metacog-001",
    principle: "Metacognition and self-regulation",
    headline: "Teaching pupils to plan, monitor, and evaluate their own learning has an average impact of +7 months in the EEF Toolkit.",
    detail: "Metacognitive strategies involve pupils thinking about their own thinking. Simple implementations: asking pupils to rate their confidence before and after a task, having them explain a concept in their own words, or using exit tickets that ask 'what was hard about this?'. Does the plenary in this plan include a metacognitive prompt?",
    source: "EEF Teaching and Learning Toolkit: Metacognition and self-regulated learning (+7 months). Flavell (1979).",
    oecd: "Engage with AI — recognise AI's influence; develop habits of reflection",
  },
  {
    id: "ailit-001",
    principle: "AI literacy: recognising AI limitations",
    headline: "AI does not know what happened in your classroom last week — you do.",
    detail: "One of the most important AI literacy habits for teachers is knowing what AI cannot access: your pupils' names, last week's misconceptions, the class dynamic on a difficult afternoon, and the school context you carry. PrimaryAI uses your class profile to personalise plans, but the professional judgement that makes those plans work in a real classroom is yours alone. Today, notice one thing you changed in this plan that the AI could not have known to include.",
    source: "OECD AI Literacy Framework (2025): Engage with AI — recognise AI's role and influence.",
    oecd: "Engage with AI — recognise AI's role and influence on learning",
  },
  {
    id: "ailit-002",
    principle: "AI literacy: the edit rate",
    headline: "The proportion of AI output you edit is a measure of professional judgement, not inefficiency.",
    detail: "Exporting an AI-generated plan without any changes should be a deliberate choice, not the default. PrimaryAI tracks your edit rate over time (visible in your workload report). A healthy edit rate signals that you are applying professional judgement to AI outputs. If you find yourself never editing, it may be worth asking whether the AI is calibrating to your standards — or whether you are calibrating to the AI's.",
    source: "Gerlich (2025), Societies: AI tools and cognitive offloading. EEF AI in education evidence summary.",
    oecd: "Manage AI — determine when and how to use AI, assessing its capabilities and risks",
  },
];

const SESSION_KEY = "pa_cpd_index";

/**
 * Get the CPD prompt for this session.
 * Increments the counter so the next session shows the next prompt.
 * Safe to call on the client only (uses sessionStorage).
 */
export function getSessionCpdPrompt(): CpdPrompt {
  if (typeof window === "undefined") return CPD_PROMPTS[0];

  const raw = sessionStorage.getItem(SESSION_KEY);
  const current = raw !== null ? parseInt(raw, 10) : 0;
  const index = isNaN(current) ? 0 : current % CPD_PROMPTS.length;

  // Advance for next session
  sessionStorage.setItem(SESSION_KEY, String((index + 1) % CPD_PROMPTS.length));

  return CPD_PROMPTS[index];
}
