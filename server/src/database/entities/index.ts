import { ConversationMember } from './chat/conversation-member.entity';
import { Conversation } from './chat/conversation.entity';
import { Message } from './chat/message.entity';
import { LandlordProfile } from './identity/landlord-profile.entity';
import { StudentProfile } from './identity/student-profile.entity';
import { User } from './identity/user.entity';
import { VerificationRequest } from './identity/verification-request.entity';
import { NearbyPlace } from './location/nearby-place.entity';
import { Property } from './location/property.entity';
import { University } from './location/university.entity';
import { Amenity } from './listings/amenity.entity';
import { Favorite } from './listings/favorite.entity';
import { RoomAmenity } from './listings/room-amenity.entity';
import { RoomImage } from './listings/room-image.entity';
import { RoomPriceHistory } from './listings/room-price-history.entity';
import { RoomView } from './listings/room-view.entity';
import { Room } from './listings/room.entity';
import { Notification } from './moderation/notification.entity';
import { Report } from './moderation/report.entity';
import { Review } from './moderation/review.entity';
import { ContractTenant } from './rental/contract-tenant.entity';
import { Contract } from './rental/contract.entity';
import { InvoiceItem } from './rental/invoice-item.entity';
import { Invoice } from './rental/invoice.entity';
import { ViewingAppointment } from './rental/viewing-appointment.entity';
import { GroupMember } from './social/group-member.entity';
import { RentalGroup } from './social/rental-group.entity';
import { RoommatePost } from './social/roommate-post.entity';
import { RoommateProfile } from './social/roommate-profile.entity';
import { RoommateRequest } from './social/roommate-request.entity';

export {
  Amenity,
  Conversation,
  ConversationMember,
  Contract,
  ContractTenant,
  Favorite,
  GroupMember,
  Invoice,
  InvoiceItem,
  LandlordProfile,
  Message,
  NearbyPlace,
  Notification,
  Property,
  RentalGroup,
  Report,
  Review,
  Room,
  RoomAmenity,
  RoomImage,
  RoommatePost,
  RoommateProfile,
  RoommateRequest,
  RoomPriceHistory,
  RoomView,
  StudentProfile,
  University,
  User,
  VerificationRequest,
  ViewingAppointment,
};

/** Every TypeORM entity mapped to the existing MySQL schema. */
export const entities = [
  User,
  StudentProfile,
  LandlordProfile,
  VerificationRequest,
  University,
  Property,
  NearbyPlace,
  Room,
  RoomImage,
  Amenity,
  RoomAmenity,
  Favorite,
  RoomPriceHistory,
  RoomView,
  RoommateProfile,
  RoommatePost,
  RoommateRequest,
  RentalGroup,
  GroupMember,
  Conversation,
  ConversationMember,
  Message,
  ViewingAppointment,
  Contract,
  ContractTenant,
  Invoice,
  InvoiceItem,
  Review,
  Report,
  Notification,
];
