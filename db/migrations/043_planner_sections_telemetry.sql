-- Extend lesson_packs with plan metadata needed for show-working features
ALTER TABLE lesson_packs
  ADD COLUMN IF NOT EXISTS school_id             uuid         REFERENCES schools(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS lesson_length_minutes int,
  ADD COLUMN IF NOT EXISTS class_context_tags    text[]       NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS prompt_version        text,
  ADD COLUMN IF NOT EXISTS status                text         NOT NULL DEFAULT 'ready'
    CHECK (status IN ('generating','ready','failed','archived')),
  ADD COLUMN IF NOT EXISTS exported_at           timestamptz,
  ADD COLUMN IF NOT EXISTS archived_at           timestamptz;

-- Per-section storage — each section of a lesson pack stored individually
-- so we can track edit, accept/revise/reject, and regeneration per section.
CREATE TABLE IF NOT EXISTS plan_sections (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id             uuid        NOT NULL REFERENCES lesson_packs(id) ON DELETE CASCADE,
  section_key         text        NOT NULL,
  section_order       int         NOT NULL,
  content_md          text        NOT NULL DEFAULT '',
  rationale_md        text        NOT NULL DEFAULT '',
  rationale_principles text[]     NOT NULL DEFAULT '{}',
  state               text        NOT NULL DEFAULT 'accepted'
    CHECK (state IN ('accepted','revised','rejected')),
  last_edited_at      timestamptz,
  regenerated_count   int         NOT NULL DEFAULT 0,
  created_at          timestamptz NOT NULL DEFAULT NOW(),
  UNIQUE (plan_id, section_key)
);

CREATE INDEX IF NOT EXISTS plan_sections_plan_idx
  ON plan_sections (plan_id, section_order);

ALTER TABLE plan_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own plan sections"
  ON plan_sections
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM lesson_packs lp
      WHERE lp.id = plan_sections.plan_id
        AND lp.user_id = auth.uid()
    )
  );

-- Telemetry events — append-only, never deleted
-- Captures every meaningful teacher interaction for EEF-equivalent metrics.
CREATE TABLE IF NOT EXISTS planner_events (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id     uuid        REFERENCES lesson_packs(id) ON DELETE SET NULL,
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type  text        NOT NULL,
  payload     jsonb       NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS planner_events_plan_idx
  ON planner_events (plan_id, created_at);

CREATE INDEX IF NOT EXISTS planner_events_user_type_idx
  ON planner_events (user_id, event_type, created_at);

ALTER TABLE planner_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own events"
  ON planner_events
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can read their own events"
  ON planner_events
  FOR SELECT
  USING (user_id = auth.uid());

-- Safeguarding intercept log — records that an intercept happened, never the content
CREATE TABLE IF NOT EXISTS safeguarding_intercepts (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  matched_category text        NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT NOW()
);

ALTER TABLE safeguarding_intercepts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own intercepts"
  ON safeguarding_intercepts
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can read their own intercepts"
  ON safeguarding_intercepts
  FOR SELECT
  USING (user_id = auth.uid());
