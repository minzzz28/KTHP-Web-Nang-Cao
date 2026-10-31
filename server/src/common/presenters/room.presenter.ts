import {
  Amenity,
  Room,
  RoomAmenity,
  RoomImage,
} from '../../database/entities';
import { ReviewStatus } from '../../database/enums/domain.enums';
import { presentPublicUserSummary } from './user.presenter';

function presentImage(image: RoomImage) {
  return {
    id: image.id,
    roomId: image.roomId,
    url: image.url,
    altText: image.altText,
    sortOrder: image.sortOrder,
    isCover: image.isCover,
    createdAt: image.createdAt,
  };
}

function presentAmenity(amenity: Amenity) {
  return {
    id: amenity.id,
    slug: amenity.slug,
    name: amenity.name,
    category: amenity.category,
    icon: amenity.icon,
    createdAt: amenity.createdAt,
    updatedAt: amenity.updatedAt,
  };
}

function presentRoomAmenity(roomAmenity: RoomAmenity) {
  return {
    roomId: roomAmenity.roomId,
    amenityId: roomAmenity.amenityId,
    createdAt: roomAmenity.createdAt,
    amenity: presentAmenity(roomAmenity.amenity),
  };
}

/**
 * Maps the lightweight room representation shared by the rooms and favorites
 * endpoints. It intentionally excludes raw reviews and password hashes.
 */
export function presentRoomList(room: Room) {
  const property = room.property;
  const roomImages = [...(room.images ?? [])]
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map(presentImage);
  const publishedReviews = (room.reviews ?? []).filter(
    (review) => review.status === ReviewStatus.PUBLISHED,
  );
  const averageRating = publishedReviews.length
    ? Number(
        (
          publishedReviews.reduce((sum, review) => sum + review.rating, 0) /
          publishedReviews.length
        ).toFixed(1),
      )
    : null;

  return {
    id: room.id,
    propertyId: room.propertyId,
    code: room.code,
    name: room.name,
    description: room.description,
    price: room.price,
    deposit: room.deposit,
    area: room.area,
    capacity: room.capacity,
    availableSlots: room.availableSlots,
    type: room.type,
    status: room.status,
    electricityPrice: room.electricityPrice,
    waterPrice: room.waterPrice,
    internetFee: room.internetFee,
    parkingFee: room.parkingFee,
    serviceFee: room.serviceFee,
    locationScore: room.locationScore,
    publishedAt: room.publishedAt,
    createdAt: room.createdAt,
    updatedAt: room.updatedAt,
    property: {
      id: property.id,
      landlordId: property.landlordId,
      slug: property.slug,
      name: property.name,
      description: property.description,
      address: property.address,
      ward: property.ward,
      district: property.district,
      city: property.city,
      latitude: property.latitude,
      longitude: property.longitude,
      rules: property.rules,
      openingHours: property.openingHours,
      contactPhone: property.contactPhone,
      verificationStatus: property.verificationStatus,
      createdAt: property.createdAt,
      updatedAt: property.updatedAt,
      landlord: presentPublicUserSummary(property.landlord),
    },
    // The legacy detail and landlord edit views both need the full ordered
    // gallery.  Image metadata is public listing content, not account data.
    images: roomImages,
    amenities: (room.amenities ?? []).map(presentRoomAmenity),
    averageRating,
  };
}
