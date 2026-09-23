/**
 * Enumerations persisted by the student-rental database.
 *
 * The string values intentionally mirror the existing Prisma/MySQL schema so
 * TypeORM can connect to the same database without changing stored data.
 */
export enum UserRole {
  STUDENT = 'STUDENT',
  LANDLORD = 'LANDLORD',
  ADMIN = 'ADMIN',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  DISABLED = 'DISABLED',
}

export enum VerificationStatus {
  UNVERIFIED = 'UNVERIFIED',
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

export enum VerificationType {
  STUDENT = 'STUDENT',
  LANDLORD = 'LANDLORD',
}

export enum RoomType {
  PRIVATE_ROOM = 'PRIVATE_ROOM',
  SHARED_ROOM = 'SHARED_ROOM',
  STUDIO = 'STUDIO',
  APARTMENT = 'APARTMENT',
  DORMITORY = 'DORMITORY',
}

export enum RoomStatus {
  AVAILABLE = 'AVAILABLE',
  RESERVED = 'RESERVED',
  RENTED = 'RENTED',
  MAINTENANCE = 'MAINTENANCE',
  HIDDEN = 'HIDDEN',
}

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
  PREFER_NOT_TO_SAY = 'PREFER_NOT_TO_SAY',
}

export enum SocialPreference {
  QUIET = 'QUIET',
  BALANCED = 'BALANCED',
  SOCIAL = 'SOCIAL',
}

export enum RoommatePostStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  ARCHIVED = 'ARCHIVED',
}

export enum RoommateRequestStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export enum RentalGroupStatus {
  OPEN = 'OPEN',
  FULL = 'FULL',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED',
}

export enum GroupMemberRole {
  LEADER = 'LEADER',
  MEMBER = 'MEMBER',
}

export enum ConversationType {
  DIRECT = 'DIRECT',
  GROUP = 'GROUP',
}

export enum MessageType {
  TEXT = 'TEXT',
  SYSTEM = 'SYSTEM',
}

export enum ViewingAppointmentStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  RESCHEDULED = 'RESCHEDULED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum ContractStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  TERMINATED = 'TERMINATED',
}

export enum InvoiceStatus {
  UNPAID = 'UNPAID',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
}

export enum InvoiceItemType {
  RENT = 'RENT',
  ELECTRICITY = 'ELECTRICITY',
  WATER = 'WATER',
  INTERNET = 'INTERNET',
  PARKING = 'PARKING',
  SERVICE = 'SERVICE',
  OTHER = 'OTHER',
}

export enum ReviewStatus {
  PUBLISHED = 'PUBLISHED',
  HIDDEN = 'HIDDEN',
}

export enum ReportTargetType {
  ROOM = 'ROOM',
  USER = 'USER',
  ROOMMATE_POST = 'ROOMMATE_POST',
  REVIEW = 'REVIEW',
}

export enum ReportReason {
  WRONG_INFO = 'WRONG_INFO',
  WRONG_IMAGE = 'WRONG_IMAGE',
  WRONG_PRICE = 'WRONG_PRICE',
  ROOM_UNAVAILABLE = 'ROOM_UNAVAILABLE',
  WRONG_ADDRESS = 'WRONG_ADDRESS',
  SCAM = 'SCAM',
  FAKE_ACCOUNT = 'FAKE_ACCOUNT',
  INAPPROPRIATE_CONTENT = 'INAPPROPRIATE_CONTENT',
  OTHER = 'OTHER',
}

export enum ReportStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  RESOLVED = 'RESOLVED',
  REJECTED = 'REJECTED',
}

export enum NotificationType {
  ROOM_MATCH = 'ROOM_MATCH',
  PRICE_CHANGED = 'PRICE_CHANGED',
  ROOMMATE_REQUEST = 'ROOMMATE_REQUEST',
  ROOMMATE_REQUEST_RESPONSE = 'ROOMMATE_REQUEST_RESPONSE',
  MESSAGE = 'MESSAGE',
  APPOINTMENT = 'APPOINTMENT',
  CONTRACT = 'CONTRACT',
  INVOICE = 'INVOICE',
  VERIFICATION = 'VERIFICATION',
  REPORT = 'REPORT',
}

export enum NearbyPlaceCategory {
  MARKET = 'MARKET',
  SUPERMARKET = 'SUPERMARKET',
  PHARMACY = 'PHARMACY',
  HOSPITAL = 'HOSPITAL',
  BUS_STOP = 'BUS_STOP',
  RESTAURANT = 'RESTAURANT',
  CONVENIENCE_STORE = 'CONVENIENCE_STORE',
  SCHOOL = 'SCHOOL',
}
