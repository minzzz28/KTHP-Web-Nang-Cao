import { presentPublicUserSummary } from '../../common/presenters/user.presenter';
import { RoommateProfile } from '../../database/entities';

function presentUniversity(profile: RoommateProfile) {
  const university = profile.university;
  if (!university) return null;

  return {
    id: university.id,
    code: university.code,
    name: university.name,
  };
}

/**
 * Maps an accommodation profile to the legacy-compatible public shape.
 * Account contact details and credential material never leave this presenter.
 */
export function presentRoommateProfile(profile: RoommateProfile) {
  const publicUser = profile.student
    ? presentPublicUserSummary(profile.student)
    : null;

  return {
    id: profile.id,
    studentId: profile.studentId,
    universityId: profile.universityId,
    gender: profile.gender,
    hometown: profile.hometown,
    faculty: profile.faculty,
    academicYear: profile.academicYear,
    budgetMin: profile.budgetMin,
    budgetMax: profile.budgetMax,
    preferredArea: profile.preferredArea,
    maxDistanceKm: profile.maxDistanceKm,
    isSmoking: profile.isSmoking,
    acceptsSmoking: profile.acceptsSmoking,
    hasPets: profile.hasPets,
    acceptsPets: profile.acceptsPets,
    cooksOften: profile.cooksOften,
    sleepTime: profile.sleepTime,
    wakeUpTime: profile.wakeUpTime,
    cleanlinessLevel: profile.cleanlinessLevel,
    socialPreference: profile.socialPreference,
    preferredRoommates: profile.preferredRoommates,
    bio: profile.bio,
    isVisible: profile.isVisible,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
    university: presentUniversity(profile),
    student: publicUser
      ? {
          ...publicUser,
          user: { ...publicUser },
        }
      : null,
    user: publicUser,
    // Aliases retained for the previous Express response and existing clients.
    cohort: profile.academicYear,
    minBudget: profile.budgetMin,
    maxBudget: profile.budgetMax,
    smoking: profile.isSmoking,
    wakeTime: profile.wakeUpTime,
    desiredRoommates: profile.preferredRoommates,
  };
}
