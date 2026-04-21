export type Priority = 'must' | 'should' | 'could' | 'wont'
export type Effort = 'Small' | 'Medium' | 'Large' | 'Not sure'

export interface UserStory {
  id: string
  story_ref: string
  who: string
  what: string
  why: string
  priority: Priority | null
  priority_label: string | null
  effort: Effort | null
  acceptance_criteria: string[]
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface CreateStoryPayload {
  who: string
  what: string
  why: string
  priority?: Priority
  priority_label?: string
  effort?: Effort
  acceptance_criteria?: string[]
  notes?: string
  created_by?: string
}
