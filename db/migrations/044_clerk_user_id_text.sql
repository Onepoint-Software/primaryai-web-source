-- Migration 044: Change user_id from UUID to TEXT for Clerk authentication
-- Clerk user IDs (e.g. user_2abc...) are not valid PostgreSQL UUIDs.
-- The app uses the Supabase service-role key which bypasses RLS, so the
-- auth.uid()-based policies below are ineffective with Clerk and are dropped.

-- Step 1: Drop all RLS policies that reference user_id (directly or via subquery)
DROP POLICY IF EXISTS "Users can manage their own scheduled lessons"     ON lesson_schedule;
DROP POLICY IF EXISTS "Users can manage their own lesson packs"          ON lesson_packs;
DROP POLICY IF EXISTS "Users can manage their own library folders"       ON library_folders;
DROP POLICY IF EXISTS "Users can manage their own library documents"     ON library_documents;
DROP POLICY IF EXISTS "Users manage their own notes"                     ON teacher_notes;
DROP POLICY IF EXISTS "Users manage their own note attachments"          ON note_attachments;
DROP POLICY IF EXISTS "School members can read lesson structures"        ON school_lesson_structures;
DROP POLICY IF EXISTS "School admins can manage lesson structures"       ON school_lesson_structures;
DROP POLICY IF EXISTS "School members can read unit plans"               ON school_unit_plans;
DROP POLICY IF EXISTS "School admins can manage unit plans"              ON school_unit_plans;
DROP POLICY IF EXISTS "Teachers manage their pupil planning profiles"    ON class_pupil_profiles;
DROP POLICY IF EXISTS "Teachers manage their critical planning drafts"   ON critical_planning_drafts;
DROP POLICY IF EXISTS "Users can manage their own plan sections"         ON plan_sections;
DROP POLICY IF EXISTS "Users can insert their own events"                ON planner_events;
DROP POLICY IF EXISTS "Users can read their own events"                  ON planner_events;
DROP POLICY IF EXISTS "Users can insert their own intercepts"            ON safeguarding_intercepts;
DROP POLICY IF EXISTS "Users can read their own intercepts"              ON safeguarding_intercepts;

-- Step 2: Drop FK constraints on user_id columns
ALTER TABLE IF EXISTS user_profile_setup      DROP CONSTRAINT IF EXISTS user_profile_setup_user_id_fkey;
ALTER TABLE IF EXISTS user_profile_settings   DROP CONSTRAINT IF EXISTS user_profile_settings_user_id_fkey;
ALTER TABLE IF EXISTS user_profile_terms      DROP CONSTRAINT IF EXISTS user_profile_terms_user_id_fkey;
ALTER TABLE IF EXISTS user_preferences        DROP CONSTRAINT IF EXISTS user_preferences_user_id_fkey;
ALTER TABLE IF EXISTS lesson_packs            DROP CONSTRAINT IF EXISTS lesson_packs_user_id_fkey;
ALTER TABLE IF EXISTS lesson_schedule         DROP CONSTRAINT IF EXISTS lesson_schedule_user_id_fkey;
ALTER TABLE IF EXISTS lesson_objective_links  DROP CONSTRAINT IF EXISTS lesson_objective_links_user_id_fkey;
ALTER TABLE IF EXISTS calendar_sync_tokens         DROP CONSTRAINT IF EXISTS calendar_sync_tokens_user_id_fkey;
ALTER TABLE IF EXISTS outlook_calendar_connections DROP CONSTRAINT IF EXISTS outlook_calendar_connections_user_id_fkey;
ALTER TABLE IF EXISTS google_calendar_connections  DROP CONSTRAINT IF EXISTS google_calendar_connections_user_id_fkey;
ALTER TABLE IF EXISTS personal_tasks   DROP CONSTRAINT IF EXISTS personal_tasks_user_id_fkey;
ALTER TABLE IF EXISTS personal_events  DROP CONSTRAINT IF EXISTS personal_events_user_id_fkey;
ALTER TABLE IF EXISTS inset_days       DROP CONSTRAINT IF EXISTS inset_days_user_id_fkey;
ALTER TABLE IF EXISTS day_templates    DROP CONSTRAINT IF EXISTS day_templates_user_id_fkey;
ALTER TABLE IF EXISTS library_folders   DROP CONSTRAINT IF EXISTS library_folders_user_id_fkey;
ALTER TABLE IF EXISTS library_documents DROP CONSTRAINT IF EXISTS library_documents_user_id_fkey;
ALTER TABLE IF EXISTS teacher_notes           DROP CONSTRAINT IF EXISTS teacher_notes_user_id_fkey;
ALTER TABLE IF EXISTS wellbeing_checkins      DROP CONSTRAINT IF EXISTS wellbeing_checkins_user_id_fkey;
ALTER TABLE IF EXISTS planner_events          DROP CONSTRAINT IF EXISTS planner_events_user_id_fkey;
ALTER TABLE IF EXISTS safeguarding_intercepts DROP CONSTRAINT IF EXISTS safeguarding_intercepts_user_id_fkey;
ALTER TABLE IF EXISTS subscriptions DROP CONSTRAINT IF EXISTS subscriptions_user_id_fkey;
ALTER TABLE IF EXISTS entitlements  DROP CONSTRAINT IF EXISTS entitlements_user_id_fkey;
ALTER TABLE IF EXISTS class_pupil_profiles     DROP CONSTRAINT IF EXISTS class_pupil_profiles_user_id_fkey;
ALTER TABLE IF EXISTS critical_planning_drafts DROP CONSTRAINT IF EXISTS critical_planning_drafts_user_id_fkey;
ALTER TABLE IF EXISTS schools DROP CONSTRAINT IF EXISTS schools_admin_user_id_fkey;

-- Step 3: Widen user_id columns to text
ALTER TABLE IF EXISTS user_profile_setup      ALTER COLUMN user_id TYPE text;
ALTER TABLE IF EXISTS user_profile_settings   ALTER COLUMN user_id TYPE text;
ALTER TABLE IF EXISTS user_profile_terms      ALTER COLUMN user_id TYPE text;
ALTER TABLE IF EXISTS user_preferences        ALTER COLUMN user_id TYPE text;
ALTER TABLE IF EXISTS lesson_packs            ALTER COLUMN user_id TYPE text;
ALTER TABLE IF EXISTS lesson_schedule         ALTER COLUMN user_id TYPE text;
ALTER TABLE IF EXISTS lesson_objective_links  ALTER COLUMN user_id TYPE text;
ALTER TABLE IF EXISTS calendar_sync_tokens         ALTER COLUMN user_id TYPE text;
ALTER TABLE IF EXISTS outlook_calendar_connections ALTER COLUMN user_id TYPE text;
ALTER TABLE IF EXISTS google_calendar_connections  ALTER COLUMN user_id TYPE text;
ALTER TABLE IF EXISTS personal_tasks   ALTER COLUMN user_id TYPE text;
ALTER TABLE IF EXISTS personal_events  ALTER COLUMN user_id TYPE text;
ALTER TABLE IF EXISTS inset_days       ALTER COLUMN user_id TYPE text;
ALTER TABLE IF EXISTS day_templates    ALTER COLUMN user_id TYPE text;
ALTER TABLE IF EXISTS library_folders   ALTER COLUMN user_id TYPE text;
ALTER TABLE IF EXISTS library_documents ALTER COLUMN user_id TYPE text;
ALTER TABLE IF EXISTS teacher_notes           ALTER COLUMN user_id TYPE text;
ALTER TABLE IF EXISTS wellbeing_checkins      ALTER COLUMN user_id TYPE text;
ALTER TABLE IF EXISTS planner_events          ALTER COLUMN user_id TYPE text;
ALTER TABLE IF EXISTS safeguarding_intercepts ALTER COLUMN user_id TYPE text;
ALTER TABLE IF EXISTS subscriptions ALTER COLUMN user_id TYPE text;
ALTER TABLE IF EXISTS entitlements  ALTER COLUMN user_id TYPE text;
ALTER TABLE IF EXISTS class_pupil_profiles     ALTER COLUMN user_id TYPE text;
ALTER TABLE IF EXISTS critical_planning_drafts ALTER COLUMN user_id TYPE text;
ALTER TABLE IF EXISTS schools ALTER COLUMN admin_user_id TYPE text;
