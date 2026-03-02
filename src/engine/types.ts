export interface EngineProvider {
  id: string;
  isAvailable(): boolean;
  generate(prompt: string): Promise<unknown>;
}

export interface LessonPackRequest {
  year_group: string;
  subject: string;
  topic: string;
  teacher_id?: string;
  profile?: {
    defaultYearGroup?: string | null;
    defaultSubject?: string | null;
    tone?: string | null;
    schoolType?: string | null;
    sendFocus?: boolean | null;
  };
}

export type LessonPackReview = {
  approved: boolean;
  improvements: string[];
};

export type TeacherProfile = {
  id: string;
  userId?: string;
  defaultYearGroup?: string | null;
  defaultSubject?: string | null;
  tone?: string | null;
  schoolType?: string | null;
  sendFocus?: boolean;
  autoSave?: boolean;
  formatPrefs?: string | null;
};
