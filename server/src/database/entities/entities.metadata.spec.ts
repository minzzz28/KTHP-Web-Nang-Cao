import { getMetadataArgsStorage } from 'typeorm';
import { entities } from './index';

describe('TypeORM entity mapping', () => {
  it('registers every model from the student-rental schema', () => {
    const tableNames = new Set(
      getMetadataArgsStorage().tables.map((table) => String(table.name)),
    );

    expect(entities).toHaveLength(30);
    expect([...tableNames]).toEqual(
      expect.arrayContaining([
        'users',
        'student_profiles',
        'landlord_profiles',
        'verification_requests',
        'universities',
        'properties',
        'nearby_places',
        'rooms',
        'room_images',
        'amenities',
        'room_amenities',
        'favorites',
        'room_price_histories',
        'room_views',
        'roommate_profiles',
        'roommate_posts',
        'roommate_requests',
        'rental_groups',
        'group_members',
        'conversations',
        'conversation_members',
        'messages',
        'viewing_appointments',
        'contracts',
        'contract_tenants',
        'invoices',
        'invoice_items',
        'reviews',
        'reports',
        'notifications',
      ]),
    );
  });
});
