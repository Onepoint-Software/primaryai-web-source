import { prisma } from "@/src/db/prisma";
import type { TeacherProfile } from "@/src/engine/types";

const DEFAULT_PROFILE = {
  defaultYearGroup: "Year 4",
  defaultSubject: "Maths",
  tone: "professional_uk",
  schoolType: "primary",
  sendFocus: false,
  autoSave: false,
  formatPrefs: JSON.stringify({ slidesStyle: "standard", worksheetStyle: "standard" }),
  classNotes: null as string | null,
  teachingApproach: "cpa" as string | null,
  abilityMix: "mixed" as string | null,
};

export async function getOrCreateTeacherProfile(userId: string) {
  try {
    return await prisma.teacherProfile.upsert({
      where: { userId },
      update: {},
      create: {
        userId,
        ...DEFAULT_PROFILE,
      },
    });
  } catch {
    return {
      id: `ephemeral-${userId}`,
      userId,
      ...DEFAULT_PROFILE,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}

export async function updateTeacherProfile(userId: string, patch: Partial<TeacherProfile>) {
  try {
    return await prisma.teacherProfile.upsert({
      where: { userId },
      update: {
        defaultYearGroup: patch.defaultYearGroup ?? undefined,
        defaultSubject: patch.defaultSubject ?? undefined,
        tone: patch.tone ?? undefined,
        schoolType: patch.schoolType ?? undefined,
        sendFocus: typeof patch.sendFocus === "boolean" ? patch.sendFocus : undefined,
        autoSave: typeof patch.autoSave === "boolean" ? patch.autoSave : undefined,
        formatPrefs: patch.formatPrefs ?? undefined,
        classNotes: patch.classNotes !== undefined ? patch.classNotes : undefined,
        teachingApproach: patch.teachingApproach !== undefined ? patch.teachingApproach : undefined,
        abilityMix: patch.abilityMix !== undefined ? patch.abilityMix : undefined,
      },
      create: {
        userId,
        defaultYearGroup: patch.defaultYearGroup ?? DEFAULT_PROFILE.defaultYearGroup,
        defaultSubject: patch.defaultSubject ?? DEFAULT_PROFILE.defaultSubject,
        tone: patch.tone ?? DEFAULT_PROFILE.tone,
        schoolType: patch.schoolType ?? DEFAULT_PROFILE.schoolType,
        sendFocus: typeof patch.sendFocus === "boolean" ? patch.sendFocus : DEFAULT_PROFILE.sendFocus,
        autoSave: typeof patch.autoSave === "boolean" ? patch.autoSave : DEFAULT_PROFILE.autoSave,
        formatPrefs: patch.formatPrefs ?? DEFAULT_PROFILE.formatPrefs,
        classNotes: patch.classNotes ?? DEFAULT_PROFILE.classNotes,
        teachingApproach: patch.teachingApproach ?? DEFAULT_PROFILE.teachingApproach,
        abilityMix: patch.abilityMix ?? DEFAULT_PROFILE.abilityMix,
      },
    });
  } catch {
    return {
      id: `ephemeral-${userId}`,
      userId,
      defaultYearGroup: patch.defaultYearGroup ?? DEFAULT_PROFILE.defaultYearGroup,
      defaultSubject: patch.defaultSubject ?? DEFAULT_PROFILE.defaultSubject,
      tone: patch.tone ?? DEFAULT_PROFILE.tone,
      schoolType: patch.schoolType ?? DEFAULT_PROFILE.schoolType,
      sendFocus: typeof patch.sendFocus === "boolean" ? patch.sendFocus : DEFAULT_PROFILE.sendFocus,
      autoSave: typeof patch.autoSave === "boolean" ? patch.autoSave : DEFAULT_PROFILE.autoSave,
      formatPrefs: patch.formatPrefs ?? DEFAULT_PROFILE.formatPrefs,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}

export function toEngineProfile(profile: Awaited<ReturnType<typeof getOrCreateTeacherProfile>>) {
  return {
    defaultYearGroup: profile.defaultYearGroup,
    defaultSubject: profile.defaultSubject,
    tone: profile.tone,
    schoolType: profile.schoolType,
    sendFocus: profile.sendFocus,
    classNotes: profile.classNotes,
    teachingApproach: profile.teachingApproach,
    abilityMix: profile.abilityMix,
  };
}
