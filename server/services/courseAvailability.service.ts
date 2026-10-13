import { prisma } from '../db.js';

// In-memory set of course IDs that are marked as unavailable
// Backed by the SystemSetting table in the database (0 schema changes needed)
const unavailableCourseIds = new Set<string>();
let isInitialized = false;

const SETTING_KEY = 'unavailable_course_ids';

export async function initCourseAvailability(): Promise<void> {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: SETTING_KEY },
    });
    if (setting && setting.value) {
      const ids: string[] = JSON.parse(setting.value);
      unavailableCourseIds.clear();
      ids.forEach((id) => unavailableCourseIds.add(id));
    }
    isInitialized = true;
  } catch (err) {
    console.warn('[CourseAvailability] Could not load availability settings:', err);
  }
}

export function isCourseAvailable(courseId: string): boolean {
  if (!isInitialized) {
    // Lazily initialize in background
    initCourseAvailability().catch(() => {});
  }
  return !unavailableCourseIds.has(courseId);
}

export async function setCourseAvailability(courseId: string, available: boolean): Promise<boolean> {
  if (available) {
    unavailableCourseIds.delete(courseId);
  } else {
    unavailableCourseIds.add(courseId);
  }

  try {
    const ids = Array.from(unavailableCourseIds);
    await prisma.systemSetting.upsert({
      where: { key: SETTING_KEY },
      create: {
        key: SETTING_KEY,
        value: JSON.stringify(ids),
        description: 'List of course IDs that are disabled for new enrollments',
      },
      update: {
        value: JSON.stringify(ids),
      },
    });
  } catch (err) {
    console.error('[CourseAvailability] Failed to persist availability:', err);
  }

  return available;
}

export function getUnavailableCourseIds(): string[] {
  return Array.from(unavailableCourseIds);
}
