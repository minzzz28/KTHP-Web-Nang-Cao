import {
  LandlordProfile,
  StudentProfile,
  University,
  User,
} from '../../database/entities';
import {
  UserRole,
  UserStatus,
  VerificationStatus,
} from '../../database/enums/domain.enums';

export interface UniversitySummary {
  id: number;
  code: string;
  name: string;
}

export interface UniversityView extends UniversitySummary {
  address: string;
  latitude: string;
  longitude: string;
  website: string | null;
  isPrimary: boolean;
}

type UniversityMode = 'summary' | 'full';

export interface OwnStudentProfile {
  id: number;
  userId: number;
  studentCode: string | null;
  universityId: number | null;
  schoolEmail: string | null;
  faculty: string | null;
  academicYear: string | null;
  hometown: string | null;
  bio: string | null;
  createdAt: Date;
  updatedAt: Date;
  university: UniversitySummary | UniversityView | null;
}

export interface OwnLandlordProfile {
  id: number;
  userId: number;
  businessName: string | null;
  nationalId: string | null;
  contactAddress: string | null;
  bio: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface OwnUser {
  id: number;
  username: string | null;
  email: string | null;
  fullName: string;
  phone: string | null;
  avatarUrl: string | null;
  role: UserRole;
  status: UserStatus;
  verificationStatus: VerificationStatus;
  createdAt: Date;
  updatedAt: Date;
  studentProfile: OwnStudentProfile | null;
  landlordProfile: OwnLandlordProfile | null;
}

export interface PublicStudentProfile {
  faculty: string | null;
  academicYear: string | null;
  hometown: string | null;
  bio: string | null;
  university: UniversityView | null;
}

export interface PublicLandlordProfile {
  businessName: string | null;
  contactAddress: string | null;
  bio: string | null;
}

export interface PublicUser {
  id: number;
  username: string | null;
  fullName: string;
  avatarUrl: string | null;
  role: UserRole;
  verificationStatus: VerificationStatus;
  createdAt: Date;
  studentProfile: PublicStudentProfile | null;
  landlordProfile: PublicLandlordProfile | null;
}

export interface PublicUserSummary {
  id: number;
  username: string | null;
  fullName: string;
  avatarUrl: string | null;
  role: UserRole;
  verificationStatus: VerificationStatus;
}

export function presentPublicUserSummary(user: User): PublicUserSummary {
  return {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl,
    role: user.role,
    verificationStatus: user.verificationStatus,
  };
}

function presentUniversity(
  university: University | null | undefined,
  mode: UniversityMode,
): UniversitySummary | UniversityView | null {
  if (!university) return null;

  const summary: UniversitySummary = {
    id: university.id,
    code: university.code,
    name: university.name,
  };

  if (mode === 'summary') return summary;

  return {
    ...summary,
    address: university.address,
    latitude: university.latitude,
    longitude: university.longitude,
    website: university.website,
    isPrimary: university.isPrimary,
  };
}

function presentOwnStudentProfile(
  profile: StudentProfile,
  universityMode: UniversityMode,
): OwnStudentProfile {
  return {
    id: profile.id,
    userId: profile.userId,
    studentCode: profile.studentCode,
    universityId: profile.universityId,
    schoolEmail: profile.schoolEmail,
    faculty: profile.faculty,
    academicYear: profile.academicYear,
    hometown: profile.hometown,
    bio: profile.bio,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
    university: presentUniversity(profile.university, universityMode),
  };
}

function presentOwnLandlordProfile(profile: LandlordProfile): OwnLandlordProfile {
  return {
    id: profile.id,
    userId: profile.userId,
    businessName: profile.businessName,
    nationalId: profile.nationalId,
    contactAddress: profile.contactAddress,
    bio: profile.bio,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

/** A complete self-service view that never contains the password hash. */
export function presentOwnUser(
  user: User,
  universityMode: UniversityMode = 'full',
): OwnUser {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    fullName: user.fullName,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    role: user.role,
    status: user.status,
    verificationStatus: user.verificationStatus,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    studentProfile: user.studentProfile
      ? presentOwnStudentProfile(user.studentProfile, universityMode)
      : null,
    landlordProfile: user.landlordProfile
      ? presentOwnLandlordProfile(user.landlordProfile)
      : null,
  };
}

/** The intentionally smaller view shown to other users. */
export function presentPublicUser(user: User): PublicUser {
  return {
    ...presentPublicUserSummary(user),
    createdAt: user.createdAt,
    studentProfile: user.studentProfile
      ? {
          faculty: user.studentProfile.faculty,
          academicYear: user.studentProfile.academicYear,
          hometown: user.studentProfile.hometown,
          bio: user.studentProfile.bio,
          university: presentUniversity(user.studentProfile.university, 'full') as
            | UniversityView
            | null,
        }
      : null,
    landlordProfile: user.landlordProfile
      ? {
          businessName: user.landlordProfile.businessName,
          contactAddress: user.landlordProfile.contactAddress,
          bio: user.landlordProfile.bio,
        }
      : null,
  };
}
