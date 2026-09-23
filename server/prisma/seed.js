/*
 * Development-only demo seed. It uses persisted relational records rather than
 * frontend fixtures, and can be re-run safely against the same development DB.
 */
const path = require('path');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

// Prisma launches this script from /server, while the shared development
// configuration is intentionally kept at the repository root.
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const prisma = new PrismaClient();
// Development-only value. Production credentials must always be provided
// outside source control and must meet the application's password policy.
const DEMO_PASSWORD = process.env.DEMO_SEED_PASSWORD || '123';
const SALT_ROUNDS = 12;
const LEGACY_DEMO_EMAILS = {
  'admin@gmail.com': 'admin@example.com',
  'student@gmail.com': 'student@example.com',
  'linh.nguyen@gmail.com': 'linh.nguyen@example.com',
  'quang.tran@gmail.com': 'quang.tran@example.com',
  'thao.le@gmail.com': 'thao.le@example.com',
  'duc.pham@gmail.com': 'duc.pham@example.com',
  'mai.vu@gmail.com': 'mai.vu@example.com',
  'nam.do@gmail.com': 'nam.do@example.com',
  'han.bui@gmail.com': 'han.bui@example.com',
  // Keep existing development data on the same landlord account when its
  // public demo email is renamed.
  'chutro@gmail.com': ['landlord@gmail.com', 'landlord@example.com'],
  'ha.my@gmail.com': 'ha.my@example.com',
  'tuan.nguyen@gmail.com': 'tuan.nguyen@example.com',
};

const date = (value) => new Date(value);
const money = (value) => Number(value).toFixed(2);

async function ensureMutable(modelName, where, data) {
  const model = prisma[modelName];
  const existing = await model.findFirst({ where });

  if (existing) {
    return model.update({ where: { id: existing.id }, data });
  }

  return model.create({ data });
}

async function ensureImmutable(modelName, where, data) {
  const existing = await prisma[modelName].findFirst({ where });
  return existing || prisma[modelName].create({ data });
}

function directPairKey(firstUserId, secondUserId) {
  return [firstUserId, secondUserId].sort((left, right) => left - right).join(':');
}

function pendingRequestKey(senderId, recipientId) {
  return `${senderId}:${recipientId}`;
}

async function migrateLegacyDemoEmail(email) {
  const legacyEmails = LEGACY_DEMO_EMAILS[email];
  if (!legacyEmails) return;

  for (const legacyEmail of Array.isArray(legacyEmails) ? legacyEmails : [legacyEmails]) {
    const legacyUser = await prisma.user.findUnique({
      where: { email: legacyEmail },
      select: { id: true },
    });
    if (!legacyUser) continue;

    const destinationUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (destinationUser && destinationUser.id !== legacyUser.id) {
      throw new Error(`Không thể chuyển tài khoản demo ${legacyEmail} sang ${email}: email mới đã được sử dụng.`);
    }

    await prisma.user.update({
      where: { id: legacyUser.id },
      data: { email },
    });
  }
}

function invoiceAmounts({
  electricityStart,
  electricityEnd,
  electricityUnitPrice,
  waterStart,
  waterEnd,
  waterUnitPrice,
  rentAmount,
  internetAmount,
  parkingAmount,
  serviceAmount,
  otherAmount,
}) {
  const electricityUsage = electricityEnd - electricityStart;
  const waterUsage = waterEnd - waterStart;
  const electricityAmount = electricityUsage * electricityUnitPrice;
  const waterAmount = waterUsage * waterUnitPrice;
  const totalAmount = [
    rentAmount,
    electricityAmount,
    waterAmount,
    internetAmount,
    parkingAmount,
    serviceAmount,
    otherAmount,
  ].reduce((total, item) => total + item, 0);

  return {
    electricityStart: money(electricityStart),
    electricityEnd: money(electricityEnd),
    electricityUsage: money(electricityUsage),
    electricityUnitPrice: money(electricityUnitPrice),
    electricityAmount: money(electricityAmount),
    waterStart: money(waterStart),
    waterEnd: money(waterEnd),
    waterUsage: money(waterUsage),
    waterUnitPrice: money(waterUnitPrice),
    waterAmount: money(waterAmount),
    rentAmount: money(rentAmount),
    internetAmount: money(internetAmount),
    parkingAmount: money(parkingAmount),
    serviceAmount: money(serviceAmount),
    otherAmount: money(otherAmount),
    totalAmount: money(totalAmount),
  };
}

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, SALT_ROUNDS);

  const userRows = [
    {
      key: 'admin',
      username: 'admin',
      email: 'admin@gmail.com',
      fullName: 'Quản trị viên ',
      phone: '0900000001',
      role: 'ADMIN',
      verificationStatus: 'VERIFIED',
    },
    {
      key: 'student',
      username: 'student',
      email: 'student@gmail.com',
      fullName: 'Nguyễn Minh Anh',
      phone: '0900000011',
      role: 'STUDENT',
      verificationStatus: 'VERIFIED',
    },
    {
      key: 'linh',
      username: 'linh.nguyen',
      email: 'linh.nguyen@gmail.com',
      fullName: 'Nguyễn Khánh Linh',
      phone: '0900000012',
      role: 'STUDENT',
      verificationStatus: 'VERIFIED',
    },
    {
      key: 'quang',
      username: 'quang.tran',
      email: 'quang.tran@gmail.com',
      fullName: 'Trần Đức Quang',
      phone: '0900000013',
      role: 'STUDENT',
      verificationStatus: 'PENDING',
    },
    {
      key: 'thao',
      username: 'thao.le',
      email: 'thao.le@gmail.com',
      fullName: 'Lê Phương Thảo',
      phone: '0900000014',
      role: 'STUDENT',
      verificationStatus: 'VERIFIED',
    },
    {
      key: 'duc',
      username: 'duc.pham',
      email: 'duc.pham@gmail.com',
      fullName: 'Phạm Hoàng Đức',
      phone: '0900000015',
      role: 'STUDENT',
      verificationStatus: 'UNVERIFIED',
    },
    {
      key: 'mai',
      username: 'mai.vu',
      email: 'mai.vu@gmail.com',
      fullName: 'Vũ Thu Mai',
      phone: '0900000016',
      role: 'STUDENT',
      verificationStatus: 'VERIFIED',
    },
    {
      key: 'nam',
      username: 'nam.do',
      email: 'nam.do@gmail.com',
      fullName: 'Đỗ Quốc Nam',
      phone: '0900000017',
      role: 'STUDENT',
      verificationStatus: 'VERIFIED',
    },
    {
      key: 'han',
      username: 'han.bui',
      email: 'han.bui@gmail.com',
      fullName: 'Bùi Ngọc Hân',
      phone: '0900000018',
      role: 'STUDENT',
      verificationStatus: 'REJECTED',
    },
    {
      key: 'landlord',
      username: 'landlord',
      email: 'chutro@gmail.com',
      fullName: 'Trần Quốc Huy',
      phone: '0900000021',
      role: 'LANDLORD',
      verificationStatus: 'VERIFIED',
    },
    {
      key: 'landlord2',
      username: 'ha.my',
      email: 'ha.my@gmail.com',
      fullName: 'Lê Hà My',
      phone: '0900000022',
      role: 'LANDLORD',
      verificationStatus: 'VERIFIED',
    },
    {
      key: 'landlord3',
      username: 'tuan.nguyen',
      email: 'tuan.nguyen@gmail.com',
      fullName: 'Nguyễn Anh Tuấn',
      phone: '0900000023',
      role: 'LANDLORD',
      verificationStatus: 'PENDING',
    },
  ];

  const users = {};
  for (const row of userRows) {
    await migrateLegacyDemoEmail(row.email);
    users[row.key] = await prisma.user.upsert({
      where: { email: row.email },
      update: {
        username: row.username,
        passwordHash,
        fullName: row.fullName,
        phone: row.phone,
        role: row.role,
        status: 'ACTIVE',
        verificationStatus: row.verificationStatus,
      },
      create: {
        username: row.username,
        email: row.email,
        passwordHash,
        fullName: row.fullName,
        phone: row.phone,
        role: row.role,
        status: 'ACTIVE',
        verificationStatus: row.verificationStatus,
      },
    });
  }

  const universityRows = [
    {
      code: 'PHENIKAA',
      name: 'Đại học Phenikaa',
      address: 'Đường Nguyễn Trác, phường Dương Nội, thành phố Hà Nội',
      latitude: '20.9612416',
      longitude: '105.7474728',
      website: 'https://phenikaa-uni.edu.vn',
      isPrimary: true,
    },
    {
      code: 'HUST',
      name: 'Đại học Bách khoa Hà Nội',
      address: 'Số 1 Đại Cồ Việt, Hai Bà Trưng, Hà Nội',
      latitude: '21.0045000',
      longitude: '105.8431000',
      website: 'https://hust.edu.vn',
      isPrimary: false,
    },
    {
      code: 'NEU',
      name: 'Đại học Kinh tế Quốc dân',
      address: '207 Giải Phóng, Hai Bà Trưng, Hà Nội',
      latitude: '21.0019000',
      longitude: '105.8418000',
      website: 'https://neu.edu.vn',
      isPrimary: false,
    },
    {
      code: 'NUCE',
      name: 'Đại học Xây dựng Hà Nội',
      address: '55 Giải Phóng, Hai Bà Trưng, Hà Nội',
      latitude: '21.0030000',
      longitude: '105.8455000',
      website: 'https://huce.edu.vn',
      isPrimary: false,
    },
    {
      code: 'TLU',
      name: 'Đại học Thủy lợi',
      address: '175 Tây Sơn, Đống Đa, Hà Nội',
      latitude: '21.0072000',
      longitude: '105.8286000',
      website: 'https://tlu.edu.vn',
      isPrimary: false,
    },
  ];

  const universities = {};
  for (const row of universityRows) {
    universities[row.code] = await prisma.university.upsert({
      where: { code: row.code },
      update: row,
      create: row,
    });
  }
  // Re-seeding must not leave an older custom campus marked as primary.
  // The demo is intentionally centered on Phenikaa throughout the product.
  await prisma.university.updateMany({
    where: { code: { not: 'PHENIKAA' } },
    data: { isPrimary: false },
  });
  universities.PHENIKAA = await prisma.university.update({
    where: { code: 'PHENIKAA' },
    data: { isPrimary: true },
  });

  const studentProfileRows = [
    ['student', 'SV23010228', 'PHENIKAA', 'minh.anh@phenikaa-uni.edu.vn', 'Công nghệ thông tin', 'K68', 'Hà Nội'],
    ['linh', 'SV23010229', 'NEU', 'linh.nguyen@neu.edu.vn', 'Kế toán', 'K66', 'Hải Phòng'],
    ['quang', 'SV23010230', 'NUCE', 'quang.tran@huce.edu.vn', 'Kỹ thuật xây dựng', 'K68', 'Nam Định'],
    ['thao', 'SV23010231', 'HUST', 'thao.le@hust.edu.vn', 'Điện tử viễn thông', 'K68', 'Nghệ An'],
    ['duc', 'SV23010232', 'TLU', 'duc.pham@tlu.edu.vn', 'Công nghệ thông tin', 'K65', 'Thái Bình'],
    ['mai', 'SV23010233', 'NEU', 'mai.vu@neu.edu.vn', 'Marketing', 'K66', 'Hà Nội'],
    ['nam', 'SV23010234', 'NUCE', 'nam.do@huce.edu.vn', 'Kiến trúc', 'K68', 'Bắc Ninh'],
    ['han', 'SV23010235', 'TLU', 'han.bui@tlu.edu.vn', 'Kinh tế', 'K65', 'Hưng Yên'],
  ];

  for (const [userKey, studentCode, universityCode, schoolEmail, faculty, academicYear, hometown] of studentProfileRows) {
    const data = {
      studentCode,
      universityId: universities[universityCode].id,
      schoolEmail,
      faculty,
      academicYear,
      hometown,
      bio: 'Hồ sơ sinh viên dùng cho luồng tìm phòng và ở ghép trong môi trường demo.',
    };
    await prisma.studentProfile.upsert({
      where: { userId: users[userKey].id },
      update: data,
      create: { userId: users[userKey].id, ...data },
    });
  }

  const landlordProfileRows = [
    ['landlord', 'Nhà trọ Huy Minh', 'Khu vực Hai Bà Trưng, Hà Nội', 'Chủ trọ hỗ trợ sinh viên xem phòng theo lịch hẹn.'],
    ['landlord2', 'Nhà trọ Hà My', 'Khu vực Đống Đa, Hà Nội', 'Có kinh nghiệm quản lý phòng trọ cho sinh viên.'],
    ['landlord3', 'Nhà trọ Anh Tuấn', 'Khu vực Cầu Giấy, Hà Nội', 'Hồ sơ đang chờ xác minh trong dữ liệu demo.'],
  ];

  for (const [userKey, businessName, contactAddress, bio] of landlordProfileRows) {
    const data = { businessName, contactAddress, bio };
    await prisma.landlordProfile.upsert({
      where: { userId: users[userKey].id },
      update: data,
      create: { userId: users[userKey].id, ...data },
    });
  }

  await ensureMutable(
    'verificationRequest',
    { userId: users.student.id, type: 'STUDENT', status: 'VERIFIED' },
    {
      userId: users.student.id,
      reviewedById: users.admin.id,
      type: 'STUDENT',
      status: 'VERIFIED',
      studentCode: 'SV23010228',
      schoolEmail: 'minh.anh@phenikaa-uni.edu.vn',
      documentUrl: 'https://example.com/demo/student-card-minh-anh',
      reviewerNote: 'Đã đối chiếu mã sinh viên trong dữ liệu demo.',
      reviewedAt: date('2026-08-12T03:00:00.000Z'),
    },
  );
  await ensureMutable(
    'verificationRequest',
    { userId: users.landlord.id, type: 'LANDLORD', status: 'VERIFIED' },
    {
      userId: users.landlord.id,
      reviewedById: users.admin.id,
      type: 'LANDLORD',
      status: 'VERIFIED',
      documentUrl: 'https://example.com/demo/landlord-huy-id',
      reviewerNote: 'Đã xác minh thông tin liên hệ cho môi trường demo.',
      reviewedAt: date('2026-08-13T03:00:00.000Z'),
    },
  );
  await ensureMutable(
    'verificationRequest',
    { userId: users.landlord3.id, type: 'LANDLORD', status: 'PENDING' },
    {
      userId: users.landlord3.id,
      type: 'LANDLORD',
      status: 'PENDING',
      documentUrl: 'https://example.com/demo/landlord-tuan-id',
      note: 'Yêu cầu chờ admin kiểm tra trong luồng demo.',
    },
  );

  const amenityRows = [
    ['wifi', 'Wifi', 'Kết nối', 'wifi'],
    ['air-conditioner', 'Điều hòa', 'Thiết bị', 'snow'],
    ['water-heater', 'Bình nóng lạnh', 'Thiết bị', 'thermometer-half'],
    ['private-bathroom', 'Nhà vệ sinh riêng', 'Phòng tắm', 'door-closed'],
    ['parking', 'Chỗ để xe', 'Dịch vụ', 'bicycle'],
    ['kitchen', 'Bếp', 'Không gian', 'cup-hot'],
    ['balcony', 'Ban công', 'Không gian', 'window'],
    ['washing-machine', 'Máy giặt', 'Thiết bị', 'water'],
    ['pet-friendly', 'Cho phép thú cưng', 'Quy định', 'heart'],
    ['security-camera', 'Camera an ninh', 'An ninh', 'camera-video'],
    ['elevator', 'Thang máy', 'Tòa nhà', 'arrows-expand'],
    ['bed', 'Giường ngủ', 'Nội thất', 'bed'],
  ];

  const amenities = {};
  for (const [slug, name, category, icon] of amenityRows) {
    amenities[slug] = await prisma.amenity.upsert({
      where: { slug },
      update: { name, category, icon },
      create: { slug, name, category, icon },
    });
  }

  const propertyRows = [
    {
      key: 'phenikaa',
      landlordKey: 'landlord',
      slug: 'khu-tro-duong-noi',
      name: 'Khu trọ Dương Nội',
      description: 'Khu trọ dành cho sinh viên, di chuyển thuận tiện tới Đại học Phenikaa.',
      address: 'Khu đô thị Dương Nội, phường Dương Nội, thành phố Hà Nội',
      ward: 'Dương Nội',
      district: 'Hà Đông',
      latitude: '20.9632000',
      longitude: '105.7500000',
      rules: 'Không gây ồn sau 23:00, giữ gìn vệ sinh khu chung.',
      openingHours: '06:00 - 23:00',
      contactPhone: '0900000021',
      verificationStatus: 'VERIFIED',
    },
    {
      key: 'minh-khai',
      landlordKey: 'landlord',
      slug: 'khu-tro-minh-khai',
      name: 'Khu trọ Minh Khai',
      description: 'Khu trọ yên tĩnh, thuận tiện di chuyển tới các trường khu Bách Khoa.',
      address: 'Ngõ 121 Minh Khai, Hai Bà Trưng, Hà Nội',
      ward: 'Vĩnh Tuy',
      district: 'Hai Bà Trưng',
      latitude: '20.9958000',
      longitude: '105.8638000',
      rules: 'Không gây ồn sau 23:00, giữ gìn vệ sinh khu chung.',
      openingHours: '06:00 - 23:00',
      contactPhone: '0900000021',
      verificationStatus: 'VERIFIED',
    },
    {
      key: 'bach-khoa',
      landlordKey: 'landlord',
      slug: 'nha-tro-bach-khoa',
      name: 'Nhà trọ Bách Khoa',
      description: 'Nhà trọ gần Đại học Bách khoa và Đại học Kinh tế Quốc dân.',
      address: 'Ngõ 48 Tạ Quang Bửu, Hai Bà Trưng, Hà Nội',
      ward: 'Bách Khoa',
      district: 'Hai Bà Trưng',
      latitude: '21.0039000',
      longitude: '105.8468000',
      rules: 'Khách qua đêm cần báo trước với chủ trọ.',
      openingHours: '05:30 - 23:30',
      contactPhone: '0900000021',
      verificationStatus: 'VERIFIED',
    },
    {
      key: 'cau-giay',
      landlordKey: 'landlord3',
      slug: 'residence-cau-giay',
      name: 'Residence Cầu Giấy',
      description: 'Phòng studio có thang máy, phù hợp nhóm hai sinh viên.',
      address: 'Ngõ 76 Nguyễn Khang, Cầu Giấy, Hà Nội',
      ward: 'Yên Hòa',
      district: 'Cầu Giấy',
      latitude: '21.0198000',
      longitude: '105.8017000',
      rules: 'Không nuôi thú cưng tại khu vực hành lang chung.',
      openingHours: '24/7',
      contactPhone: '0900000023',
      verificationStatus: 'PENDING',
    },
    {
      key: 'khuong-thuong',
      landlordKey: 'landlord2',
      slug: 'khu-tro-khuong-thuong',
      name: 'Khu trọ Khương Thượng',
      description: 'Khu trọ gần Đại học Thủy lợi, có bãi xe và camera an ninh.',
      address: 'Ngõ 178 Tây Sơn, Đống Đa, Hà Nội',
      ward: 'Khương Thượng',
      district: 'Đống Đa',
      latitude: '21.0064000',
      longitude: '105.8294000',
      rules: 'Tôn trọng giờ nghỉ và phân loại rác tại khu chung.',
      openingHours: '06:00 - 24:00',
      contactPhone: '0900000022',
      verificationStatus: 'VERIFIED',
    },
    {
      key: 'thai-ha',
      landlordKey: 'landlord2',
      slug: 'nha-tro-thai-ha',
      name: 'Nhà trọ Thái Hà',
      description: 'Căn hộ mini khu Thái Hà, di chuyển thuận tiện tới Đống Đa.',
      address: 'Ngõ 89 Thái Hà, Đống Đa, Hà Nội',
      ward: 'Trung Liệt',
      district: 'Đống Đa',
      latitude: '21.0121000',
      longitude: '105.8216000',
      rules: 'Không hút thuốc trong phòng và hành lang.',
      openingHours: '06:00 - 23:00',
      contactPhone: '0900000022',
      verificationStatus: 'VERIFIED',
    },
    {
      key: 'my-dinh',
      landlordKey: 'landlord',
      slug: 'nha-tro-my-dinh',
      name: 'Nhà trọ Mỹ Đình',
      description: 'Khu studio có góc học tập và bếp nhỏ, phù hợp nhóm một đến hai sinh viên.',
      address: 'Ngõ 64 Lê Quang Đạo, phường Mỹ Đình 2, Nam Từ Liêm, Hà Nội',
      ward: 'Mỹ Đình 2',
      district: 'Nam Từ Liêm',
      latitude: '21.0147000',
      longitude: '105.7657000',
      rules: 'Giữ yên tĩnh tại khu hành lang sau 23:00.',
      openingHours: '06:00 - 23:30',
      contactPhone: '0900000021',
      verificationStatus: 'VERIFIED',
    },
    {
      key: 'co-nhue',
      landlordKey: 'landlord2',
      slug: 'nha-tro-co-nhue',
      name: 'Nhà trọ Cổ Nhuế',
      description: 'Phòng khép kín yên tĩnh, thuận tiện di chuyển tới khu Phạm Văn Đồng.',
      address: 'Ngõ 7 Phạm Văn Đồng, phường Cổ Nhuế 1, Bắc Từ Liêm, Hà Nội',
      ward: 'Cổ Nhuế 1',
      district: 'Bắc Từ Liêm',
      latitude: '21.0651000',
      longitude: '105.7868000',
      rules: 'Không để xe tại lối thoát hiểm.',
      openingHours: '06:00 - 23:00',
      contactPhone: '0900000022',
      verificationStatus: 'VERIFIED',
    },
    {
      key: 'nhan-chinh',
      landlordKey: 'landlord',
      slug: 'can-ho-nhan-chinh',
      name: 'Căn hộ Nhân Chính',
      description: 'Căn hộ mini có ban công và khu bếp độc lập tại Thanh Xuân.',
      address: 'Ngõ 116 Nhân Hòa, phường Nhân Chính, Thanh Xuân, Hà Nội',
      ward: 'Nhân Chính',
      district: 'Thanh Xuân',
      latitude: '21.0012000',
      longitude: '105.8091000',
      rules: 'Không hút thuốc trong phòng và khu vực chung.',
      openingHours: '24/7',
      contactPhone: '0900000021',
      verificationStatus: 'VERIFIED',
    },
    {
      key: 'dai-kim',
      landlordKey: 'landlord2',
      slug: 'khu-tro-dai-kim',
      name: 'Khu trọ Đại Kim',
      description: 'Khu trọ có các phòng rộng cho nhóm sinh viên cùng thuê.',
      address: 'Ngõ 192 Kim Giang, phường Đại Kim, Hoàng Mai, Hà Nội',
      ward: 'Đại Kim',
      district: 'Hoàng Mai',
      latitude: '20.9749000',
      longitude: '105.8246000',
      rules: 'Tôn trọng không gian chung và phân loại rác.',
      openingHours: '06:00 - 24:00',
      contactPhone: '0900000022',
      verificationStatus: 'VERIFIED',
    },
    {
      key: 'ngoc-lam',
      landlordKey: 'landlord',
      slug: 'studio-ngoc-lam',
      name: 'Studio Ngọc Lâm',
      description: 'Studio sáng thoáng với bếp và khu giặt riêng tại Long Biên.',
      address: 'Ngõ 97 Nguyễn Văn Cừ, phường Ngọc Lâm, Long Biên, Hà Nội',
      ward: 'Ngọc Lâm',
      district: 'Long Biên',
      latitude: '21.0439000',
      longitude: '105.8793000',
      rules: 'Không gây ồn sau 23:00.',
      openingHours: '06:00 - 23:30',
      contactPhone: '0900000021',
      verificationStatus: 'VERIFIED',
    },
    {
      key: 'xuan-la',
      landlordKey: 'landlord2',
      slug: 'nha-tro-xuan-la',
      name: 'Nhà trọ Xuân La',
      description: 'Nhà trọ có phòng khép kín, không gian sáng và chỗ để xe riêng.',
      address: 'Ngõ 445 Lạc Long Quân, phường Xuân La, Tây Hồ, Hà Nội',
      ward: 'Xuân La',
      district: 'Tây Hồ',
      latitude: '21.0668000',
      longitude: '105.8021000',
      rules: 'Khách tới thăm cần đăng ký tại cổng.',
      openingHours: '06:00 - 23:00',
      contactPhone: '0900000022',
      verificationStatus: 'VERIFIED',
    },
    {
      key: 'mo-lao',
      landlordKey: 'landlord',
      slug: 'residence-mo-lao',
      name: 'Residence Mỗ Lao',
      description: 'Studio có thang máy, bàn học và bếp nhỏ ở khu Mỗ Lao.',
      address: 'Ngõ 2 Nguyễn Văn Lộc, phường Mỗ Lao, Hà Đông, Hà Nội',
      ward: 'Mỗ Lao',
      district: 'Hà Đông',
      latitude: '20.9954000',
      longitude: '105.7820000',
      rules: 'Giữ gìn thang máy và khu hành lang chung.',
      openingHours: '24/7',
      contactPhone: '0900000021',
      verificationStatus: 'VERIFIED',
    },
    {
      key: 'trau-quy',
      landlordKey: 'landlord2',
      slug: 'khu-tro-trau-quy',
      name: 'Khu trọ Trâu Quỳ',
      description: 'Khu ở ghép sạch sẽ, có giường và khu giặt chung.',
      address: 'Ngõ 24 Ngô Xuân Quảng, thị trấn Trâu Quỳ, Gia Lâm, Hà Nội',
      ward: 'Trâu Quỳ',
      district: 'Gia Lâm',
      latitude: '21.0096000',
      longitude: '105.9383000',
      rules: 'Không để đồ cá nhân tại lối đi chung.',
      openingHours: '06:00 - 23:30',
      contactPhone: '0900000022',
      verificationStatus: 'VERIFIED',
    },
    {
      key: 'tan-trieu',
      landlordKey: 'landlord',
      slug: 'nha-tro-tan-trieu',
      name: 'Nhà trọ Tân Triều',
      description: 'Phòng khép kín gần các tuyến xe buýt, phù hợp ngân sách vừa phải.',
      address: 'Ngõ 300 Nguyễn Xiển, xã Tân Triều, Thanh Trì, Hà Nội',
      ward: 'Tân Triều',
      district: 'Thanh Trì',
      latitude: '20.9819000',
      longitude: '105.8009000',
      rules: 'Đóng cổng đúng giờ và bảo quản tài sản cá nhân.',
      openingHours: '06:00 - 23:00',
      contactPhone: '0900000021',
      verificationStatus: 'VERIFIED',
    },
    {
      key: 'ngoc-khanh',
      landlordKey: 'landlord2',
      slug: 'can-ho-ngoc-khanh',
      name: 'Căn hộ Ngọc Khánh',
      description: 'Căn hộ mini có phòng ngủ, bếp và ban công tại Ba Đình.',
      address: 'Ngõ 535 Kim Mã, phường Ngọc Khánh, Ba Đình, Hà Nội',
      ward: 'Ngọc Khánh',
      district: 'Ba Đình',
      latitude: '21.0325000',
      longitude: '105.8140000',
      rules: 'Không để đồ tại lối thoát hiểm và hành lang.',
      openingHours: '24/7',
      contactPhone: '0900000022',
      verificationStatus: 'VERIFIED',
    },
  ];

  const properties = {};
  for (const { key, landlordKey, ...data } of propertyRows) {
    properties[key] = await prisma.property.upsert({
      where: { slug: data.slug },
      update: { ...data, landlordId: users[landlordKey].id },
      create: { ...data, landlordId: users[landlordKey].id },
    });
  }

  const roomRows = [
    ['pk-p101', 'phenikaa', 'P101', 'Phòng P101 gần Đại học Phenikaa', 'Phòng khép kín, phù hợp sinh viên muốn đi học trong vài phút.', '2800000', '2800000', '24.00', 2, 1, 'PRIVATE_ROOM', 'AVAILABLE', '3500', '20000', '100000', '100000', '50000', '9.4', '2026-08-20', ['wifi', 'air-conditioner', 'water-heater', 'private-bathroom', 'parking', 'security-camera']],
    ['pk-p102', 'phenikaa', 'P102', 'Studio P102 có bàn học', 'Studio sáng thoáng, có bếp nhỏ và bàn học riêng.', '3300000', '3300000', '29.00', 2, 2, 'STUDIO', 'AVAILABLE', '3500', '20000', '120000', '100000', '50000', '9.5', '2026-08-22', ['wifi', 'air-conditioner', 'water-heater', 'private-bathroom', 'parking', 'kitchen', 'bed', 'security-camera']],
    ['pk-p201', 'phenikaa', 'P201', 'Phòng P201 yên tĩnh tại Dương Nội', 'Phòng có ban công, thuận tiện cho hai bạn cùng học tại Phenikaa.', '3000000', '3000000', '26.00', 2, 1, 'SHARED_ROOM', 'AVAILABLE', '3500', '20000', '100000', '80000', '30000', '9.2', '2026-08-24', ['wifi', 'water-heater', 'private-bathroom', 'parking', 'balcony', 'kitchen']],
    ['mk-a101', 'minh-khai', 'A101', 'Studio A101 sáng thoáng', 'Studio có cửa sổ lớn, phù hợp một đến hai sinh viên.', '2800000', '2800000', '24.00', 2, 1, 'STUDIO', 'AVAILABLE', '3500', '20000', '100000', '100000', '50000', '8.6', '2026-07-15', ['wifi', 'air-conditioner', 'water-heater', 'private-bathroom', 'parking', 'kitchen', 'security-camera']],
    ['mk-a102', 'minh-khai', 'A102', 'Phòng A102 khép kín', 'Phòng khép kín tầng hai, có chỗ phơi đồ riêng.', '2600000', '2600000', '20.00', 2, 1, 'PRIVATE_ROOM', 'RESERVED', '3500', '20000', '100000', '80000', '30000', '8.2', '2026-07-20', ['wifi', 'water-heater', 'private-bathroom', 'parking', 'balcony']],
    ['mk-a103', 'minh-khai', 'A103', 'Phòng A103 tiết kiệm', 'Phòng dành cho hai bạn cùng học tại khu Bách Khoa.', '2500000', '2500000', '22.00', 2, 0, 'SHARED_ROOM', 'RENTED', '3500', '20000', '100000', '80000', '30000', '8.0', '2026-06-01', ['wifi', 'private-bathroom', 'parking', 'kitchen']],
    ['mk-a201', 'minh-khai', 'A201', 'Studio A201 có ban công', 'Studio tầng hai có ban công và ánh sáng tự nhiên.', '3200000', '3200000', '28.00', 2, 2, 'STUDIO', 'AVAILABLE', '3500', '20000', '100000', '100000', '50000', '8.8', '2026-08-01', ['wifi', 'air-conditioner', 'water-heater', 'private-bathroom', 'parking', 'balcony', 'washing-machine']],
    ['bk-b101', 'bach-khoa', 'B101', 'Phòng B101 gần Bách Khoa', 'Phòng tầng một, đi bộ tới cổng trường trong vài phút.', '3000000', '3000000', '25.00', 2, 1, 'PRIVATE_ROOM', 'AVAILABLE', '3800', '22000', '100000', '100000', '50000', '9.1', '2026-08-10', ['wifi', 'air-conditioner', 'water-heater', 'private-bathroom', 'parking', 'security-camera']],
    ['bk-b102', 'bach-khoa', 'B102', 'Studio B102 đầy đủ nội thất', 'Có giường, tủ, bàn học và bếp nhỏ.', '3400000', '3400000', '30.00', 2, 2, 'STUDIO', 'AVAILABLE', '3800', '22000', '120000', '100000', '50000', '9.2', '2026-08-12', ['wifi', 'air-conditioner', 'water-heater', 'private-bathroom', 'parking', 'kitchen', 'bed', 'security-camera']],
    ['bk-b201', 'bach-khoa', 'B201', 'Phòng B201 cho hai sinh viên', 'Phòng đang có hợp đồng demo với hai sinh viên.', '2800000', '2800000', '26.00', 2, 0, 'SHARED_ROOM', 'RENTED', '3500', '20000', '100000', '100000', '50000', '9.0', '2026-05-01', ['wifi', 'air-conditioner', 'water-heater', 'private-bathroom', 'parking', 'kitchen']],
    ['bk-b202', 'bach-khoa', 'B202', 'Phòng B202 yên tĩnh', 'Phòng sát khu học tập, phù hợp bạn cần không gian yên tĩnh.', '2900000', '2900000', '23.00', 2, 1, 'PRIVATE_ROOM', 'RESERVED', '3500', '20000', '100000', '80000', '30000', '8.9', '2026-08-18', ['wifi', 'water-heater', 'private-bathroom', 'parking', 'security-camera']],
    ['cg-c101', 'cau-giay', 'C101', 'Studio C101 Cầu Giấy', 'Studio có thang máy, diện tích phù hợp hai người.', '3800000', '3800000', '32.00', 2, 0, 'STUDIO', 'RENTED', '4000', '25000', '150000', '120000', '80000', '8.4', '2026-06-15', ['wifi', 'air-conditioner', 'water-heater', 'private-bathroom', 'parking', 'elevator', 'bed']],
    ['cg-c102', 'cau-giay', 'C102', 'Phòng C102 có bếp', 'Phòng mới hoàn thiện, có bếp và ban công nhỏ.', '3600000', '3600000', '29.00', 2, 2, 'STUDIO', 'AVAILABLE', '4000', '25000', '150000', '120000', '80000', '8.3', '2026-08-22', ['wifi', 'air-conditioner', 'water-heater', 'private-bathroom', 'kitchen', 'balcony', 'elevator']],
    ['cg-c201', 'cau-giay', 'C201', 'Phòng C201 tiết kiệm', 'Phòng khép kín, thích hợp sinh viên có ngân sách vừa phải.', '3100000', '3100000', '24.00', 2, 1, 'PRIVATE_ROOM', 'AVAILABLE', '4000', '25000', '120000', '100000', '50000', '7.9', '2026-08-25', ['wifi', 'water-heater', 'private-bathroom', 'parking', 'elevator']],
    ['kt-d101', 'khuong-thuong', 'D101', 'Phòng D101 gần Thủy lợi', 'Tầng một dễ di chuyển, khu vực có nhiều dịch vụ ăn uống.', '2700000', '2700000', '23.00', 2, 1, 'PRIVATE_ROOM', 'AVAILABLE', '3500', '20000', '100000', '80000', '30000', '9.0', '2026-08-05', ['wifi', 'air-conditioner', 'water-heater', 'private-bathroom', 'parking', 'security-camera']],
    ['kt-d102', 'khuong-thuong', 'D102', 'Studio D102 có máy giặt', 'Studio nội thất cơ bản, dùng máy giặt chung của tầng.', '3300000', '3300000', '29.00', 2, 2, 'STUDIO', 'AVAILABLE', '3500', '20000', '120000', '100000', '50000', '9.1', '2026-08-07', ['wifi', 'air-conditioner', 'water-heater', 'private-bathroom', 'parking', 'washing-machine', 'bed']],
    ['kt-d201', 'khuong-thuong', 'D201', 'Phòng D201 đang bảo trì', 'Phòng tạm ngừng đăng do đang thay mới thiết bị vệ sinh.', '3000000', '3000000', '25.00', 2, 0, 'PRIVATE_ROOM', 'MAINTENANCE', '3500', '20000', '100000', '80000', '30000', '8.5', '2026-07-28', ['wifi', 'water-heater', 'private-bathroom', 'parking']],
    ['kt-d202', 'khuong-thuong', 'D202', 'Phòng D202 cho nhóm hai bạn', 'Phòng đang thuê, dùng để demo hợp đồng và hóa đơn thứ hai.', '2900000', '2900000', '27.00', 2, 0, 'SHARED_ROOM', 'RENTED', '3500', '20000', '100000', '80000', '30000', '8.8', '2026-05-10', ['wifi', 'air-conditioner', 'water-heater', 'private-bathroom', 'parking', 'kitchen']],
    ['th-e101', 'thai-ha', 'E101', 'Căn hộ mini E101', 'Căn hộ mini có ban công, không gian học tập riêng.', '4200000', '4200000', '35.00', 2, 2, 'APARTMENT', 'AVAILABLE', '4000', '25000', '150000', '120000', '80000', '8.7', '2026-08-15', ['wifi', 'air-conditioner', 'water-heater', 'private-bathroom', 'parking', 'kitchen', 'balcony', 'bed']],
    ['th-e102', 'thai-ha', 'E102', 'Studio E102 có thang máy', 'Studio hướng sáng, có thang máy và camera tầng.', '3900000', '3900000', '31.00', 2, 1, 'STUDIO', 'AVAILABLE', '4000', '25000', '150000', '120000', '80000', '8.6', '2026-08-19', ['wifi', 'air-conditioner', 'water-heater', 'private-bathroom', 'parking', 'elevator', 'security-camera']],
    ['th-e201', 'thai-ha', 'E201', 'Phòng E201 tạm ẩn', 'Phòng được tạm ẩn trong khi chủ trọ cập nhật thông tin.', '3500000', '3500000', '27.00', 2, 0, 'PRIVATE_ROOM', 'HIDDEN', '4000', '25000', '120000', '100000', '50000', '8.1', '2026-07-10', ['wifi', 'water-heater', 'private-bathroom', 'parking']],
    ['md-f101', 'my-dinh', 'F101', 'Studio F101 gần Mỹ Đình', 'Studio 32m² thoáng sáng, có bếp nhỏ và góc học tập riêng.', '4200000', '4200000', '32.00', 2, 2, 'STUDIO', 'AVAILABLE', '4000', '25000', '150000', '120000', '80000', '9.1', '2026-09-02', ['wifi', 'air-conditioner', 'water-heater', 'private-bathroom', 'parking', 'kitchen', 'bed', 'security-camera']],
    ['cn-g101', 'co-nhue', 'G101', 'Phòng G101 Cổ Nhuế', 'Phòng khép kín yên tĩnh, thuận tiện di chuyển tới khu Phạm Văn Đồng.', '2900000', '2900000', '23.00', 2, 1, 'PRIVATE_ROOM', 'AVAILABLE', '3500', '20000', '100000', '80000', '30000', '8.8', '2026-09-03', ['wifi', 'air-conditioner', 'water-heater', 'private-bathroom', 'parking', 'security-camera']],
    ['nc-h101', 'nhan-chinh', 'H101', 'Căn hộ mini H101 Nhân Chính', 'Căn hộ mini đầy đủ nội thất, có ban công và khu bếp độc lập.', '4600000', '4600000', '36.00', 2, 2, 'APARTMENT', 'AVAILABLE', '4000', '25000', '150000', '120000', '80000', '9.0', '2026-09-04', ['wifi', 'air-conditioner', 'water-heater', 'private-bathroom', 'parking', 'kitchen', 'balcony', 'bed']],
    ['dk-j101', 'dai-kim', 'J101', 'Phòng J101 cho nhóm ba bạn', 'Phòng rộng, phù hợp nhóm sinh viên cần tiết kiệm chi phí thuê.', '3300000', '3300000', '28.00', 3, 2, 'SHARED_ROOM', 'AVAILABLE', '3500', '20000', '100000', '80000', '30000', '8.5', '2026-09-05', ['wifi', 'water-heater', 'private-bathroom', 'parking', 'kitchen', 'washing-machine']],
    ['nl-l101', 'ngoc-lam', 'L101', 'Studio L101 Ngọc Lâm', 'Studio có cửa sổ lớn, bếp và khu giặt riêng trong phòng.', '3700000', '3700000', '28.00', 2, 1, 'STUDIO', 'AVAILABLE', '4000', '25000', '120000', '100000', '50000', '8.7', '2026-09-06', ['wifi', 'air-conditioner', 'water-heater', 'private-bathroom', 'parking', 'kitchen', 'washing-machine', 'bed']],
    ['xl-m101', 'xuan-la', 'M101', 'Phòng M101 Xuân La', 'Phòng khép kín gần hồ, không gian sáng và có chỗ để xe riêng.', '3300000', '3300000', '22.00', 2, 2, 'PRIVATE_ROOM', 'AVAILABLE', '4000', '25000', '100000', '100000', '50000', '8.6', '2026-09-07', ['wifi', 'air-conditioner', 'water-heater', 'private-bathroom', 'parking', 'balcony', 'security-camera']],
    ['ml-n101', 'mo-lao', 'N101', 'Studio N101 Mỗ Lao', 'Studio có thang máy, bàn học và bếp nhỏ; phù hợp hai sinh viên.', '3500000', '3500000', '30.00', 2, 2, 'STUDIO', 'AVAILABLE', '3500', '20000', '120000', '100000', '50000', '9.0', '2026-09-08', ['wifi', 'air-conditioner', 'water-heater', 'private-bathroom', 'parking', 'kitchen', 'elevator', 'bed']],
    ['tq-q101', 'trau-quy', 'Q101', 'Phòng ở ghép Q101 Trâu Quỳ', 'Phòng ở ghép sạch sẽ, giá theo một chỗ ở, có giường và máy giặt chung.', '1800000', '1800000', '40.00', 4, 2, 'DORMITORY', 'AVAILABLE', '3500', '20000', '100000', '80000', '30000', '8.6', '2026-09-09', ['wifi', 'air-conditioner', 'water-heater', 'parking', 'washing-machine', 'security-camera', 'bed']],
    ['tt-r101', 'tan-trieu', 'R101', 'Phòng R101 Tân Triều', 'Phòng khép kín gần nhiều tuyến xe buýt, phù hợp ngân sách vừa phải.', '2850000', '2850000', '24.00', 2, 1, 'PRIVATE_ROOM', 'AVAILABLE', '3500', '20000', '100000', '80000', '30000', '8.4', '2026-09-10', ['wifi', 'water-heater', 'private-bathroom', 'parking', 'balcony', 'security-camera']],
    ['nk-s101', 'ngoc-khanh', 'S101', 'Căn hộ mini S101 Ngọc Khánh', 'Căn hộ mini có phòng ngủ, bếp và ban công; thuận tiện đi học, đi làm.', '5200000', '5200000', '38.00', 2, 2, 'APARTMENT', 'AVAILABLE', '4000', '25000', '150000', '120000', '80000', '8.9', '2026-09-11', ['wifi', 'air-conditioner', 'water-heater', 'private-bathroom', 'parking', 'kitchen', 'balcony', 'elevator', 'bed']],
  ];

  const rooms = {};
  const roomSeedDetails = {};
  for (const row of roomRows) {
    const [key, propertyKey, code, name, description, price, deposit, area, capacity, availableSlots, type, status, electricityPrice, waterPrice, internetFee, parkingFee, serviceFee, locationScore, publishedAt, amenitySlugs] = row;
    const data = {
      code,
      name,
      description,
      price,
      deposit,
      area,
      capacity,
      availableSlots,
      type,
      status,
      electricityPrice,
      waterPrice,
      internetFee,
      parkingFee,
      serviceFee,
      locationScore,
      publishedAt: date(`${publishedAt}T03:00:00.000Z`),
    };
    const propertyId = properties[propertyKey].id;
    rooms[key] = await prisma.room.upsert({
      where: { propertyId_code: { propertyId, code } },
      update: data,
      create: { propertyId, ...data },
    });
    roomSeedDetails[key] = { propertyKey, price, amenitySlugs };
  }

  // Ảnh demo được phục vụ trực tiếp từ Unsplash theo Unsplash License.
  // Mỗi tin có ảnh bìa riêng để danh sách phòng không bị lặp hình.
  const unsplashImage = (photoId) => `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&w=1200&q=80`;
  const roomDetailPhotoIds = [
    '1615874959474-d609969a20ed',
    '1616047006789-b7af5afb8c20',
    '1566665797739-1674de7a421a',
    '1616486029423-aaa4789e8c9a',
    '1560185893-a55cbc8c57e8',
    '1616594039964-ae9021a400a0',
    '1783962211635-ef0af72c7759',
  ];
  const roomCoverRows = [
    ['pk-p101', '1522708323590-d24dbb6b0267', 'Không gian phòng P101 gần Dương Nội'],
    ['pk-p102', '1560185008-b033106af5c3', 'Studio P102 có góc học tập'],
    ['pk-p201', '1781249144484-f5969c55e54e', 'Phòng P201 có ánh sáng tự nhiên'],
    ['mk-a101', '1774311237295-a65a4c1ff38a', 'Studio A101 sáng thoáng'],
    ['mk-a102', '1780777698633-283d4b7bf4a6', 'Phòng A102 khép kín'],
    ['mk-a103', '1499955085172-a104c9463ece', 'Không gian phòng A103 tiết kiệm'],
    ['mk-a201', '1650137938625-11576502aecd', 'Studio A201 có ban công'],
    ['bk-b101', '1656122381069-9ec666d95cf1', 'Phòng B101 gần khu Bách Khoa'],
    ['bk-b102', '1721738857280-f4e7c1c43f2f', 'Studio B102 đầy đủ nội thất'],
    ['bk-b201', '1661006112431-26a5f60547a3', 'Phòng B201 cho hai sinh viên'],
    ['bk-b202', '1770757587087-766db2874c21', 'Phòng B202 yên tĩnh'],
    ['cg-c101', '1749878064232-1cc820ad561f', 'Studio C101 Cầu Giấy'],
    ['cg-c102', '1774226905114-1daa47ee03dc', 'Phòng C102 có bếp'],
    ['cg-c201', '1651294846983-8f67b217fe64', 'Phòng C201 tiết kiệm'],
    ['kt-d101', '1767348923171-f5535f88fb39', 'Phòng D101 gần khu Thủy lợi'],
    ['kt-d102', '1757417983938-2c2a931d41aa', 'Studio D102 có máy giặt'],
    ['kt-d201', '1560769407-8ee7b93c602c', 'Phòng D201 đang bảo trì'],
    ['kt-d202', '1583847268964-b28dc8f51f92', 'Phòng D202 cho nhóm hai bạn'],
    ['th-e101', '1484154218962-a197022b5858', 'Căn hộ mini E101 có ban công'],
    ['th-e102', '1585128792020-803d29415281', 'Studio E102 có thang máy'],
    ['th-e201', '1502672260266-1c1ef2d93688', 'Phòng E201 tạm ẩn'],
    ['md-f101', '1628592102751-ba83b0314276', 'Studio F101 tại Mỹ Đình'],
    ['cn-g101', '1613575831056-0acd5da8f085', 'Phòng G101 Cổ Nhuế'],
    ['nc-h101', '1675279200694-8529c73b1fd0', 'Căn hộ mini H101 Nhân Chính'],
    ['dk-j101', '1612320648993-61c1cd604b71', 'Phòng J101 cho nhóm ba bạn'],
    ['nl-l101', '1560448204-e02f11c3d0e2', 'Studio L101 Ngọc Lâm'],
    ['xl-m101', '1564078516393-cf04bd966897', 'Phòng M101 Xuân La'],
    ['ml-n101', '1512918728675-ed5a9ecdebfd', 'Studio N101 Mỗ Lao'],
    ['tq-q101', '1665249934445-1de680641f50', 'Phòng ở ghép Q101 Trâu Quỳ'],
    ['tt-r101', '1562438668-bcf0ca6578f0', 'Phòng R101 Tân Triều'],
    ['nk-s101', '1598928636135-d146006ff4be', 'Căn hộ mini S101 Ngọc Khánh'],
  ];
  const roomImagesByKey = Object.fromEntries(
    roomCoverRows.map(([key, coverPhotoId, coverAltText], index) => [
      key,
      [
        { url: unsplashImage(coverPhotoId), altText: coverAltText },
        {
          url: unsplashImage(roomDetailPhotoIds[index % roomDetailPhotoIds.length]),
          altText: `${coverAltText} - góc nội thất`,
        },
      ],
    ]),
  );

  for (const [key, room] of Object.entries(rooms)) {
    const images = roomImagesByKey[key];
    if (!images) {
      throw new Error(`Thiếu ảnh demo cho phòng ${key}`);
    }

    for (const [sortOrder, image] of images.entries()) {
      await prisma.roomImage.upsert({
        where: { roomId_sortOrder: { roomId: room.id, sortOrder } },
        update: {
          url: image.url,
          altText: image.altText,
          isCover: sortOrder === 0,
        },
        create: {
          roomId: room.id,
          url: image.url,
          altText: image.altText,
          sortOrder,
          isCover: sortOrder === 0,
        },
      });
    }

    for (const amenitySlug of roomSeedDetails[key].amenitySlugs) {
      await prisma.roomAmenity.upsert({
        where: {
          roomId_amenityId: {
            roomId: room.id,
            amenityId: amenities[amenitySlug].id,
          },
        },
        update: {},
        create: { roomId: room.id, amenityId: amenities[amenitySlug].id },
      });
    }

    const initialPrice = money(Number(roomSeedDetails[key].price) - 150000);
    const landlordId = properties[roomSeedDetails[key].propertyKey].landlordId;
    const historyRows = [
      {
        oldPrice: null,
        newPrice: initialPrice,
        reason: 'Giá đăng ban đầu cho dữ liệu demo.',
        changedAt: date('2026-05-01T03:00:00.000Z'),
      },
      {
        oldPrice: initialPrice,
        newPrice: roomSeedDetails[key].price,
        reason: 'Điều chỉnh giá theo chi phí vận hành.',
        changedAt: date('2026-08-01T03:00:00.000Z'),
      },
    ];
    for (const history of historyRows) {
      await ensureImmutable(
        'roomPriceHistory',
        { roomId: room.id, changedAt: history.changedAt },
        { roomId: room.id, changedById: landlordId, ...history },
      );
    }
  }

  const favoriteRows = [
    ['student', 'pk-p101'],
    ['student', 'pk-p102'],
    ['student', 'bk-b101'],
    ['student', 'bk-b102'],
    ['student', 'kt-d101'],
    ['linh', 'bk-b201'],
    ['linh', 'mk-a201'],
    ['thao', 'kt-d102'],
    ['duc', 'cg-c201'],
    ['mai', 'th-e101'],
  ];
  for (const [studentKey, roomKey] of favoriteRows) {
    const studentId = users[studentKey].id;
    const roomId = rooms[roomKey].id;
    await prisma.favorite.upsert({
      where: { studentId_roomId: { studentId, roomId } },
      update: {},
      create: { studentId, roomId },
    });
  }

  const viewRows = [
    ['student', 'bk-b101', '2026-09-01T03:05:00.000Z'],
    ['student', 'bk-b102', '2026-09-01T03:10:00.000Z'],
    ['student', 'kt-d101', '2026-09-01T03:16:00.000Z'],
    ['linh', 'bk-b201', '2026-09-02T02:20:00.000Z'],
    ['thao', 'kt-d102', '2026-09-02T08:30:00.000Z'],
    ['duc', 'cg-c201', '2026-09-03T01:45:00.000Z'],
  ];
  for (const [studentKey, roomKey, viewedAtText] of viewRows) {
    const viewedAt = date(viewedAtText);
    await ensureImmutable(
      'roomView',
      { roomId: rooms[roomKey].id, viewerId: users[studentKey].id, viewedAt },
      {
        roomId: rooms[roomKey].id,
        viewerId: users[studentKey].id,
        sessionId: `seed-${studentKey}-${roomKey}`,
        viewedAt,
      },
    );
  }

  const roommateProfileRows = [
    ['student', 'PHENIKAA', 'MALE', 'Hà Nội', 'Công nghệ thông tin', 'K68', '2200000', '3300000', 'Dương Nội, Hà Đông', '3.00', false, false, false, true, true, '23:30', '07:00', 4, 'BALANCED', 1, 'Tìm một bạn ở cùng, ưu tiên khu vực gần Đại học Phenikaa và lịch sinh hoạt gọn gàng.'],
    ['linh', 'NEU', 'FEMALE', 'Hải Phòng', 'Kế toán', 'K66', '2200000', '3200000', 'Hai Bà Trưng', '3.00', false, false, false, true, true, '23:00', '06:30', 4, 'QUIET', 1, 'Muốn tìm bạn nữ cùng trường hoặc khu vực Bách Khoa.'],
    ['quang', 'NUCE', 'MALE', 'Nam Định', 'Kỹ thuật xây dựng', 'K68', '2500000', '3800000', 'Hai Bà Trưng, Cầu Giấy', '5.00', false, false, false, false, true, '00:00', '07:30', 3, 'SOCIAL', 1, 'Ưu tiên phòng gần trường, có bếp và chỗ để xe.'],
    ['thao', 'HUST', 'FEMALE', 'Nghệ An', 'Điện tử viễn thông', 'K68', '2500000', '3600000', 'Hai Bà Trưng, Đống Đa', '4.00', false, false, false, true, false, '23:30', '06:45', 5, 'QUIET', 1, 'Tìm bạn nữ tôn trọng không gian học tập và giữ phòng sạch.'],
    ['duc', 'TLU', 'MALE', 'Thái Bình', 'Công nghệ thông tin', 'K65', '2200000', '3200000', 'Đống Đa', '3.50', false, false, false, true, true, '00:30', '07:30', 3, 'BALANCED', 1, 'Thân thiện, thường tự nấu ăn vào cuối tuần.'],
    ['mai', 'NEU', 'FEMALE', 'Hà Nội', 'Marketing', 'K66', '3000000', '4500000', 'Đống Đa, Cầu Giấy', '5.00', false, false, false, true, false, '23:00', '07:00', 4, 'SOCIAL', 1, 'Muốn ở ghép với bạn nữ, thích không gian có ánh sáng tự nhiên.'],
    ['nam', 'NUCE', 'MALE', 'Bắc Ninh', 'Kiến trúc', 'K68', '2500000', '3500000', 'Hai Bà Trưng', '3.00', false, false, false, false, true, '00:00', '07:00', 4, 'BALANCED', 1, 'Ưu tiên phòng có bàn học và internet ổn định.'],
    ['han', 'TLU', 'FEMALE', 'Hưng Yên', 'Kinh tế', 'K65', '2000000', '3000000', 'Đống Đa', '3.00', false, false, false, true, false, '22:30', '06:30', 4, 'QUIET', 1, 'Hồ sơ demo đang chờ cập nhật xác minh.'],
  ];

  for (const row of roommateProfileRows) {
    const [studentKey, universityCode, gender, hometown, faculty, academicYear, budgetMin, budgetMax, preferredArea, maxDistanceKm, isSmoking, acceptsSmoking, hasPets, acceptsPets, cooksOften, sleepTime, wakeUpTime, cleanlinessLevel, socialPreference, preferredRoommates, bio] = row;
    const data = {
      universityId: universities[universityCode].id,
      gender,
      hometown,
      faculty,
      academicYear,
      budgetMin,
      budgetMax,
      preferredArea,
      maxDistanceKm,
      isSmoking,
      acceptsSmoking,
      hasPets,
      acceptsPets,
      cooksOften,
      sleepTime,
      wakeUpTime,
      cleanlinessLevel,
      socialPreference,
      preferredRoommates,
      bio,
      isVisible: studentKey !== 'han',
    };
    await prisma.roommateProfile.upsert({
      where: { studentId: users[studentKey].id },
      update: data,
      create: { studentId: users[studentKey].id, ...data },
    });
  }

  const roommatePostRows = [
    {
      key: 'post-student',
      studentKey: 'student',
      roomKey: 'bk-b102',
      title: 'Tìm một bạn nam ở ghép gần Bách Khoa',
      content: 'Mình đã xem phòng B102, muốn tìm bạn cùng ngân sách để đi xem và ký hợp đồng nếu phù hợp.',
      area: 'Bách Khoa, Hai Bà Trưng',
      budgetPerPerson: '1700000',
      neededPeople: 1,
      preferredGender: 'MALE',
      moveInDate: date('2026-10-01T00:00:00.000Z'),
      requirements: 'Không hút thuốc, tôn trọng giờ học buổi tối.',
      status: 'OPEN',
    },
    {
      key: 'post-linh',
      studentKey: 'linh',
      roomKey: 'mk-a201',
      title: 'Tìm bạn nữ ở ghép khu Hai Bà Trưng',
      content: 'Ưu tiên bạn nữ sạch sẽ, có thể cùng đi xem phòng vào cuối tuần.',
      area: 'Hai Bà Trưng',
      budgetPerPerson: '1600000',
      neededPeople: 1,
      preferredGender: 'FEMALE',
      moveInDate: date('2026-09-20T00:00:00.000Z'),
      requirements: 'Không hút thuốc, chia sẻ việc dọn dẹp công bằng.',
      status: 'OPEN',
    },
    {
      key: 'post-thao',
      studentKey: 'thao',
      roomKey: 'kt-d102',
      title: 'Tìm bạn nữ ở ghép gần Đại học Thủy lợi',
      content: 'Phòng studio có máy giặt, cần thêm một bạn nữ cùng giữ nếp sinh hoạt yên tĩnh.',
      area: 'Đống Đa',
      budgetPerPerson: '1650000',
      neededPeople: 1,
      preferredGender: 'FEMALE',
      moveInDate: date('2026-10-05T00:00:00.000Z'),
      requirements: 'Ưu tiên không nuôi thú cưng và ngủ trước nửa đêm.',
      status: 'OPEN',
    },
    {
      key: 'post-quang',
      studentKey: 'quang',
      roomKey: 'cg-c102',
      title: 'Tìm bạn ở ghép khu Cầu Giấy',
      content: 'Bài đăng đã đóng vì nhóm đã đủ thành viên trong dữ liệu demo.',
      area: 'Cầu Giấy',
      budgetPerPerson: '1800000',
      neededPeople: 1,
      preferredGender: 'MALE',
      moveInDate: date('2026-09-15T00:00:00.000Z'),
      requirements: 'Cùng trao đổi trước khi đi xem phòng.',
      status: 'CLOSED',
    },
  ];

  const roommatePosts = {};
  for (const { key, studentKey, roomKey, ...data } of roommatePostRows) {
    roommatePosts[key] = await ensureMutable(
      'roommatePost',
      { studentId: users[studentKey].id, title: data.title },
      {
        studentId: users[studentKey].id,
        roomId: rooms[roomKey].id,
        ...data,
      },
    );
  }

  const roommateRequestRows = [
    {
      senderKey: 'student',
      recipientKey: 'quang',
      postKey: 'post-student',
      roomKey: 'bk-b102',
      message: 'Mình thấy tiêu chí của bạn khá phù hợp, cùng trao đổi thêm nhé.',
      status: 'PENDING',
      createdAt: date('2026-09-03T03:00:00.000Z'),
    },
    {
      senderKey: 'linh',
      recipientKey: 'thao',
      postKey: 'post-linh',
      roomKey: 'mk-a201',
      message: 'Mình muốn mời bạn cùng xem phòng cuối tuần này.',
      status: 'ACCEPTED',
      respondedAt: date('2026-09-01T08:00:00.000Z'),
      createdAt: date('2026-08-30T03:00:00.000Z'),
    },
    {
      senderKey: 'duc',
      recipientKey: 'nam',
      postKey: null,
      roomKey: 'kt-d101',
      message: 'Bạn có muốn ghép nhóm tìm phòng gần Thủy lợi không?',
      status: 'REJECTED',
      respondedAt: date('2026-09-02T05:00:00.000Z'),
      createdAt: date('2026-09-01T04:00:00.000Z'),
    },
    {
      senderKey: 'mai',
      recipientKey: 'han',
      postKey: 'post-thao',
      roomKey: 'kt-d102',
      message: 'Mình gửi lời mời trước khi chốt lịch xem phòng.',
      status: 'CANCELLED',
      respondedAt: date('2026-09-04T05:00:00.000Z'),
      createdAt: date('2026-09-03T04:00:00.000Z'),
    },
  ];

  for (const row of roommateRequestRows) {
    const senderId = users[row.senderKey].id;
    const recipientId = users[row.recipientKey].id;
    const postId = row.postKey ? roommatePosts[row.postKey].id : null;
    const roomId = rooms[row.roomKey].id;
    const data = {
      senderId,
      recipientId,
      postId,
      roomId,
      message: row.message,
      status: row.status,
      activePairKey: row.status === 'PENDING' ? pendingRequestKey(senderId, recipientId) : null,
      respondedAt: row.respondedAt || null,
      createdAt: row.createdAt,
    };

    if (data.activePairKey) {
      await prisma.roommateRequest.upsert({
        where: { activePairKey: data.activePairKey },
        update: data,
        create: data,
      });
    } else {
      await ensureMutable(
        'roommateRequest',
        { senderId, recipientId, postId, status: row.status },
        data,
      );
    }
  }

  const rentalGroup = await ensureMutable(
    'rentalGroup',
    { creatorId: users.student.id, name: 'Nhóm tìm phòng Bách Khoa tháng 10' },
    {
      creatorId: users.student.id,
      roomId: rooms['bk-b102'].id,
      name: 'Nhóm tìm phòng Bách Khoa tháng 10',
      maxMembers: 2,
      budgetPerPerson: '1700000',
      moveInDate: date('2026-10-01T00:00:00.000Z'),
      rules: 'Cùng xác nhận chi phí trước khi ký hợp đồng, giữ yên tĩnh sau 23:00.',
      zaloGroupUrl: 'https://zalo.me/g/demo-bach-khoa',
      telegramGroupUrl: 'https://t.me/demo_bach_khoa',
      status: 'OPEN',
    },
  );

  const groupMemberRows = [
    ['student', 'LEADER', '2026-09-03T03:30:00.000Z'],
    ['quang', 'MEMBER', '2026-09-03T04:00:00.000Z'],
  ];
  for (const [studentKey, role, joinedAtText] of groupMemberRows) {
    const studentId = users[studentKey].id;
    await prisma.groupMember.upsert({
      where: { groupId_studentId: { groupId: rentalGroup.id, studentId } },
      update: { role, joinedAt: date(joinedAtText), leftAt: null },
      create: { groupId: rentalGroup.id, studentId, role, joinedAt: date(joinedAtText) },
    });
  }

  const directConversation = await prisma.conversation.upsert({
    where: { directPairKey: directPairKey(users.student.id, users.landlord.id) },
    update: {
      type: 'DIRECT',
      title: null,
      lastMessageAt: date('2026-09-02T04:15:00.000Z'),
    },
    create: {
      type: 'DIRECT',
      directPairKey: directPairKey(users.student.id, users.landlord.id),
      lastMessageAt: date('2026-09-02T04:15:00.000Z'),
    },
  });

  const groupConversation = await prisma.conversation.upsert({
    where: { rentalGroupId: rentalGroup.id },
    update: {
      type: 'GROUP',
      title: 'Nhóm tìm phòng Bách Khoa tháng 10',
      directPairKey: null,
      lastMessageAt: date('2026-09-03T04:20:00.000Z'),
    },
    create: {
      type: 'GROUP',
      title: 'Nhóm tìm phòng Bách Khoa tháng 10',
      rentalGroupId: rentalGroup.id,
      lastMessageAt: date('2026-09-03T04:20:00.000Z'),
    },
  });

  const conversationMembers = [
    [directConversation, 'student', '2026-09-02T04:15:00.000Z'],
    [directConversation, 'landlord', '2026-09-02T04:15:00.000Z'],
    [groupConversation, 'student', '2026-09-03T04:20:00.000Z'],
    [groupConversation, 'quang', null],
  ];
  for (const [conversation, userKey, lastReadAtText] of conversationMembers) {
    const userId = users[userKey].id;
    await prisma.conversationMember.upsert({
      where: { conversationId_userId: { conversationId: conversation.id, userId } },
      update: { lastReadAt: lastReadAtText ? date(lastReadAtText) : null, leftAt: null },
      create: {
        conversationId: conversation.id,
        userId,
        lastReadAt: lastReadAtText ? date(lastReadAtText) : null,
      },
    });
  }

  const messageRows = [
    [directConversation.id, 'student', 'Chào anh, phòng B101 còn có thể xem vào chiều thứ bảy không?', '2026-09-02T04:00:00.000Z'],
    [directConversation.id, 'landlord', 'Chào em, phòng còn lịch xem lúc 15:00 thứ bảy. Em đặt lịch trên hệ thống giúp anh nhé.', '2026-09-02T04:10:00.000Z'],
    [directConversation.id, 'student', 'Vâng, em đã gửi yêu cầu xem phòng. Cảm ơn anh.', '2026-09-02T04:15:00.000Z'],
    [groupConversation.id, 'student', 'Mình đã lưu phòng B102, chiều mai chúng ta cùng xem nhé.', '2026-09-03T04:00:00.000Z'],
    [groupConversation.id, 'quang', 'Ổn đó, mình sẽ kiểm tra thêm chi phí điện nước trước khi quyết định.', '2026-09-03T04:12:00.000Z'],
    [groupConversation.id, 'student', 'Mình đã nhắn chủ trọ và sẽ cập nhật lại sau.', '2026-09-03T04:20:00.000Z'],
  ];
  for (const [conversationId, senderKey, content, sentAtText] of messageRows) {
    const sentAt = date(sentAtText);
    await ensureImmutable(
      'message',
      { conversationId, senderId: users[senderKey].id, content, sentAt },
      { conversationId, senderId: users[senderKey].id, content, sentAt },
    );
  }

  const appointmentRows = [
    {
      roomKey: 'bk-b101',
      studentKey: 'student',
      landlordKey: 'landlord',
      scheduledAt: '2026-09-12T08:00:00.000Z',
      status: 'ACCEPTED',
      studentNote: 'Em muốn xem kỹ hợp đồng mẫu và chi phí dịch vụ.',
      landlordNote: 'Anh sẽ mở phòng và chuẩn bị thông tin chi phí.',
      respondedAt: '2026-09-02T04:12:00.000Z',
    },
    {
      roomKey: 'kt-d101',
      studentKey: 'duc',
      landlordKey: 'landlord2',
      scheduledAt: '2026-09-13T03:00:00.000Z',
      status: 'PENDING',
      studentNote: 'Em muốn xem phòng vào buổi sáng cuối tuần.',
    },
    {
      roomKey: 'cg-c102',
      studentKey: 'quang',
      landlordKey: 'landlord3',
      scheduledAt: '2026-09-11T10:00:00.000Z',
      proposedAt: '2026-09-12T08:30:00.000Z',
      status: 'RESCHEDULED',
      studentNote: 'Nhóm em có hai người cùng đi xem.',
      landlordNote: 'Chủ trọ đề xuất chuyển sang sáng thứ bảy.',
      respondedAt: '2026-09-04T03:00:00.000Z',
    },
    {
      roomKey: 'mk-a201',
      studentKey: 'linh',
      landlordKey: 'landlord',
      scheduledAt: '2026-08-29T08:00:00.000Z',
      status: 'COMPLETED',
      studentNote: 'Đã xem phòng cùng bạn ở ghép.',
      landlordNote: 'Đã dẫn khách xem phòng.',
      respondedAt: '2026-08-28T03:00:00.000Z',
    },
  ];
  for (const row of appointmentRows) {
    const roomId = rooms[row.roomKey].id;
    const studentId = users[row.studentKey].id;
    const scheduledAt = date(row.scheduledAt);
    await ensureMutable(
      'viewingAppointment',
      { roomId, studentId, scheduledAt },
      {
        roomId,
        studentId,
        landlordId: users[row.landlordKey].id,
        scheduledAt,
        proposedAt: row.proposedAt ? date(row.proposedAt) : null,
        status: row.status,
        studentNote: row.studentNote,
        landlordNote: row.landlordNote || null,
        respondedAt: row.respondedAt ? date(row.respondedAt) : null,
      },
    );
  }

  const contractOne = await prisma.contract.upsert({
    where: { contractNumber: 'HD-2026-001' },
    update: {
      roomId: rooms['bk-b201'].id,
      landlordId: users.landlord.id,
      startDate: date('2026-08-01T00:00:00.000Z'),
      endDate: date('2027-07-31T00:00:00.000Z'),
      rent: '2800000',
      deposit: '2800000',
      terms: 'Tiền phòng thanh toán trước ngày 05 hàng tháng. Người thuê giữ gìn tài sản và báo trước 30 ngày khi chấm dứt hợp đồng.',
      status: 'ACTIVE',
      signedAt: date('2026-07-28T03:00:00.000Z'),
      terminatedAt: null,
    },
    create: {
      contractNumber: 'HD-2026-001',
      roomId: rooms['bk-b201'].id,
      landlordId: users.landlord.id,
      startDate: date('2026-08-01T00:00:00.000Z'),
      endDate: date('2027-07-31T00:00:00.000Z'),
      rent: '2800000',
      deposit: '2800000',
      terms: 'Tiền phòng thanh toán trước ngày 05 hàng tháng. Người thuê giữ gìn tài sản và báo trước 30 ngày khi chấm dứt hợp đồng.',
      status: 'ACTIVE',
      signedAt: date('2026-07-28T03:00:00.000Z'),
    },
  });

  const contractTwo = await prisma.contract.upsert({
    where: { contractNumber: 'HD-2026-002' },
    update: {
      roomId: rooms['kt-d202'].id,
      landlordId: users.landlord2.id,
      startDate: date('2026-09-01T00:00:00.000Z'),
      endDate: date('2027-08-31T00:00:00.000Z'),
      rent: '2900000',
      deposit: '2900000',
      terms: 'Điện, nước và dịch vụ được chốt theo chỉ số thực tế mỗi tháng. Người thuê không tự ý cho thuê lại.',
      status: 'ACTIVE',
      signedAt: date('2026-08-27T03:00:00.000Z'),
      terminatedAt: null,
    },
    create: {
      contractNumber: 'HD-2026-002',
      roomId: rooms['kt-d202'].id,
      landlordId: users.landlord2.id,
      startDate: date('2026-09-01T00:00:00.000Z'),
      endDate: date('2027-08-31T00:00:00.000Z'),
      rent: '2900000',
      deposit: '2900000',
      terms: 'Điện, nước và dịch vụ được chốt theo chỉ số thực tế mỗi tháng. Người thuê không tự ý cho thuê lại.',
      status: 'ACTIVE',
      signedAt: date('2026-08-27T03:00:00.000Z'),
    },
  });

  const contractTenantRows = [
    [contractOne, 'student', true, '2026-08-01T00:00:00.000Z'],
    [contractOne, 'linh', false, '2026-08-01T00:00:00.000Z'],
    [contractTwo, 'quang', true, '2026-09-01T00:00:00.000Z'],
  ];
  for (const [contract, studentKey, isPrimaryTenant, moveInDateText] of contractTenantRows) {
    const studentId = users[studentKey].id;
    await prisma.contractTenant.upsert({
      where: { contractId_studentId: { contractId: contract.id, studentId } },
      update: {
        isPrimaryTenant,
        moveInDate: date(moveInDateText),
        moveOutDate: null,
        signedAt: contract.signedAt,
      },
      create: {
        contractId: contract.id,
        studentId,
        isPrimaryTenant,
        moveInDate: date(moveInDateText),
        signedAt: contract.signedAt,
      },
    });
  }

  const invoiceRows = [
    {
      contract: contractOne,
      invoiceNumber: 'HD-2026-001-202608',
      periodStart: date('2026-08-01T00:00:00.000Z'),
      periodEnd: date('2026-08-31T00:00:00.000Z'),
      dueDate: date('2026-09-05T00:00:00.000Z'),
      status: 'PAID',
      issuedAt: date('2026-09-01T02:00:00.000Z'),
      paidAt: date('2026-09-03T04:00:00.000Z'),
      meters: {
        electricityStart: 120,
        electricityEnd: 155,
        electricityUnitPrice: 3500,
        waterStart: 10,
        waterEnd: 15,
        waterUnitPrice: 20000,
        rentAmount: 2800000,
        internetAmount: 100000,
        parkingAmount: 100000,
        serviceAmount: 50000,
        otherAmount: 0,
      },
    },
    {
      contract: contractOne,
      invoiceNumber: 'HD-2026-001-202609',
      periodStart: date('2026-09-01T00:00:00.000Z'),
      periodEnd: date('2026-09-30T00:00:00.000Z'),
      dueDate: date('2026-10-05T00:00:00.000Z'),
      status: 'UNPAID',
      issuedAt: date('2026-10-01T02:00:00.000Z'),
      paidAt: null,
      meters: {
        electricityStart: 155,
        electricityEnd: 187,
        electricityUnitPrice: 3500,
        waterStart: 15,
        waterEnd: 20,
        waterUnitPrice: 20000,
        rentAmount: 2800000,
        internetAmount: 100000,
        parkingAmount: 100000,
        serviceAmount: 50000,
        otherAmount: 0,
      },
    },
    {
      contract: contractTwo,
      invoiceNumber: 'HD-2026-002-202609',
      periodStart: date('2026-09-01T00:00:00.000Z'),
      periodEnd: date('2026-09-30T00:00:00.000Z'),
      dueDate: date('2026-10-05T00:00:00.000Z'),
      status: 'OVERDUE',
      issuedAt: date('2026-10-01T02:00:00.000Z'),
      paidAt: null,
      meters: {
        electricityStart: 45,
        electricityEnd: 71,
        electricityUnitPrice: 3500,
        waterStart: 4,
        waterEnd: 8,
        waterUnitPrice: 20000,
        rentAmount: 2900000,
        internetAmount: 100000,
        parkingAmount: 80000,
        serviceAmount: 30000,
        otherAmount: 50000,
      },
    },
  ];

  const invoices = {};
  for (const row of invoiceRows) {
    const amounts = invoiceAmounts(row.meters);
    const data = {
      contractId: row.contract.id,
      periodStart: row.periodStart,
      periodEnd: row.periodEnd,
      dueDate: row.dueDate,
      status: row.status,
      issuedAt: row.issuedAt,
      paidAt: row.paidAt,
      ...amounts,
    };
    invoices[row.invoiceNumber] = await prisma.invoice.upsert({
      where: { invoiceNumber: row.invoiceNumber },
      update: data,
      create: { invoiceNumber: row.invoiceNumber, ...data },
    });

    const itemRows = [
      ['RENT', 'Tiền phòng', 1, Number(amounts.rentAmount)],
      ['ELECTRICITY', 'Tiền điện', Number(amounts.electricityUsage), Number(amounts.electricityUnitPrice)],
      ['WATER', 'Tiền nước', Number(amounts.waterUsage), Number(amounts.waterUnitPrice)],
      ['INTERNET', 'Internet', 1, Number(amounts.internetAmount)],
      ['PARKING', 'Gửi xe', 1, Number(amounts.parkingAmount)],
      ['SERVICE', 'Phí dịch vụ', 1, Number(amounts.serviceAmount)],
    ];
    if (Number(amounts.otherAmount) > 0) {
      itemRows.push(['OTHER', 'Dịch vụ khác', 1, Number(amounts.otherAmount)]);
    }
    for (const [type, description, quantity, unitPrice] of itemRows) {
      await ensureMutable(
        'invoiceItem',
        { invoiceId: invoices[row.invoiceNumber].id, type, description },
        {
          invoiceId: invoices[row.invoiceNumber].id,
          type,
          description,
          quantity: money(quantity),
          unitPrice: money(unitPrice),
          amount: money(quantity * unitPrice),
        },
      );
    }
  }

  await prisma.review.upsert({
    where: {
      contractId_studentId: {
        contractId: contractOne.id,
        studentId: users.student.id,
      },
    },
    update: {
      roomId: rooms['bk-b201'].id,
      landlordId: users.landlord.id,
      rating: 5,
      roomQuality: 5,
      security: 4,
      cleanliness: 5,
      wifiQuality: 5,
      utilityPrice: 4,
      listingAccuracy: 5,
      landlordAttitude: 5,
      comment: 'Phòng đúng mô tả, wifi ổn định và chủ trọ phản hồi lịch xem nhanh.',
      status: 'PUBLISHED',
      moderatedById: users.admin.id,
      moderationNote: 'Đã kiểm tra hợp đồng và nội dung đánh giá demo.',
      moderatedAt: date('2026-09-05T03:00:00.000Z'),
    },
    create: {
      contractId: contractOne.id,
      studentId: users.student.id,
      roomId: rooms['bk-b201'].id,
      landlordId: users.landlord.id,
      rating: 5,
      roomQuality: 5,
      security: 4,
      cleanliness: 5,
      wifiQuality: 5,
      utilityPrice: 4,
      listingAccuracy: 5,
      landlordAttitude: 5,
      comment: 'Phòng đúng mô tả, wifi ổn định và chủ trọ phản hồi lịch xem nhanh.',
      status: 'PUBLISHED',
      moderatedById: users.admin.id,
      moderationNote: 'Đã kiểm tra hợp đồng và nội dung đánh giá demo.',
      moderatedAt: date('2026-09-05T03:00:00.000Z'),
    },
  });

  const linhReview = await prisma.review.upsert({
    where: {
      contractId_studentId: {
        contractId: contractOne.id,
        studentId: users.linh.id,
      },
    },
    update: {
      roomId: rooms['bk-b201'].id,
      landlordId: users.landlord.id,
      rating: 4,
      roomQuality: 4,
      security: 4,
      cleanliness: 4,
      wifiQuality: 5,
      utilityPrice: 4,
      listingAccuracy: 4,
      landlordAttitude: 5,
      comment: 'Không gian phù hợp hai người; thông tin chi phí được chủ trọ giải thích rõ.',
      status: 'PUBLISHED',
    },
    create: {
      contractId: contractOne.id,
      studentId: users.linh.id,
      roomId: rooms['bk-b201'].id,
      landlordId: users.landlord.id,
      rating: 4,
      roomQuality: 4,
      security: 4,
      cleanliness: 4,
      wifiQuality: 5,
      utilityPrice: 4,
      listingAccuracy: 4,
      landlordAttitude: 5,
      comment: 'Không gian phù hợp hai người; thông tin chi phí được chủ trọ giải thích rõ.',
      status: 'PUBLISHED',
    },
  });

  const reportRows = [
    {
      reporterKey: 'student',
      targetType: 'ROOM',
      roomKey: 'cg-c102',
      reason: 'WRONG_PRICE',
      description: 'Sinh viên muốn admin kiểm tra lại phần phí dịch vụ được mô tả trong tin đăng.',
      status: 'PENDING',
    },
    {
      reporterKey: 'mai',
      targetType: 'USER',
      targetUserKey: 'landlord3',
      reason: 'OTHER',
      description: 'Người dùng đề nghị làm rõ trạng thái xác minh của chủ trọ trước khi đặt lịch xem.',
      status: 'PROCESSING',
      reviewedByKey: 'admin',
      adminNote: 'Admin đã tiếp nhận và đang kiểm tra hồ sơ xác minh.',
    },
    {
      reporterKey: 'landlord',
      targetType: 'REVIEW',
      review: linhReview,
      reason: 'OTHER',
      description: 'Chủ trọ yêu cầu kiểm tra nội dung review trong luồng quản trị demo.',
      status: 'RESOLVED',
      reviewedByKey: 'admin',
      adminNote: 'Nội dung review có căn cứ từ hợp đồng và vẫn được giữ công khai.',
      resolvedAt: '2026-09-05T05:00:00.000Z',
    },
    {
      reporterKey: 'han',
      targetType: 'ROOMMATE_POST',
      postKey: 'post-quang',
      reason: 'INAPPROPRIATE_CONTENT',
      description: 'Yêu cầu admin rà soát bài đăng đã đóng trong dữ liệu demo.',
      status: 'REJECTED',
      reviewedByKey: 'admin',
      adminNote: 'Bài đăng không vi phạm; trạng thái đã đóng do nhóm đủ thành viên.',
      resolvedAt: '2026-09-04T06:00:00.000Z',
    },
  ];
  for (const row of reportRows) {
    const reporterId = users[row.reporterKey].id;
    const targetUserId = row.targetUserKey ? users[row.targetUserKey].id : null;
    const roomId = row.roomKey ? rooms[row.roomKey].id : null;
    const roommatePostId = row.postKey ? roommatePosts[row.postKey].id : null;
    const reviewId = row.review ? row.review.id : null;
    await ensureMutable(
      'report',
      { reporterId, targetType: row.targetType, targetUserId, roomId, roommatePostId, reviewId, reason: row.reason },
      {
        reporterId,
        targetType: row.targetType,
        targetUserId,
        roomId,
        roommatePostId,
        reviewId,
        reason: row.reason,
        description: row.description,
        status: row.status,
        reviewedById: row.reviewedByKey ? users[row.reviewedByKey].id : null,
        adminNote: row.adminNote || null,
        resolvedAt: row.resolvedAt ? date(row.resolvedAt) : null,
      },
    );
  }

  const notificationRows = [
    ['student', 'ROOM_MATCH', 'Có phòng phù hợp mới', 'Phòng B101 phù hợp với mức ngân sách và bán kính bạn đã chọn.', '/rooms/' + rooms['bk-b101'].id, false, null, '2026-09-01T03:20:00.000Z'],
    ['student', 'PRICE_CHANGED', 'Giá phòng đã thay đổi', 'Giá phòng B102 đã được cập nhật trong lịch sử giá.', '/rooms/' + rooms['bk-b102'].id, true, '2026-09-02T03:00:00.000Z', '2026-09-01T03:30:00.000Z'],
    ['student', 'ROOMMATE_REQUEST', 'Lời mời ở ghép mới', 'Quang Trần đã được thêm vào nhóm tìm phòng của bạn.', '/groups/' + rentalGroup.id, false, null, '2026-09-03T04:05:00.000Z'],
    ['student', 'APPOINTMENT', 'Lịch xem phòng được xác nhận', 'Chủ trọ đã xác nhận lịch xem phòng B101.', '/appointments', false, null, '2026-09-02T04:12:00.000Z'],
    ['student', 'INVOICE', 'Hóa đơn tháng 8', 'Hóa đơn HD-2026-001-202608 đã được thanh toán.', '/invoices/' + invoices['HD-2026-001-202608'].id, true, '2026-09-03T04:10:00.000Z', '2026-09-01T02:05:00.000Z'],
    ['linh', 'MESSAGE', 'Tin nhắn mới trong nhóm', 'Nhóm tìm phòng Bách Khoa có cập nhật lịch xem phòng.', '/conversations/' + groupConversation.id, false, null, '2026-09-03T04:20:00.000Z'],
    ['quang', 'VERIFICATION', 'Yêu cầu xác minh đang chờ duyệt', 'Admin sẽ thông báo khi yêu cầu xác minh sinh viên được xử lý.', '/profile/verification', false, null, '2026-09-02T05:10:00.000Z'],
    ['landlord3', 'REPORT', 'Báo cáo cần phản hồi', 'Có báo cáo liên quan đến trạng thái xác minh tài khoản của bạn.', '/landlord/reports', false, null, '2026-09-04T05:30:00.000Z'],
  ];
  for (const [userKey, type, title, content, linkUrl, isRead, readAtText, createdAtText] of notificationRows) {
    const userId = users[userKey].id;
    await ensureMutable(
      'notification',
      { userId, title },
      {
        userId,
        type,
        title,
        content,
        linkUrl,
        isRead,
        readAt: readAtText ? date(readAtText) : null,
        createdAt: date(createdAtText),
      },
    );
  }

  const nearbyPlaceRows = [
    ['phenikaa', 'Đại học Phenikaa', 'SCHOOL', 'Đường Nguyễn Trác, phường Dương Nội, thành phố Hà Nội', '20.9612416', '105.7474728', 340],
    ['minh-khai', 'VinMart+ Minh Khai', 'CONVENIENCE_STORE', '123 Minh Khai, Hai Bà Trưng, Hà Nội', '20.9960000', '105.8631000', 180],
    ['minh-khai', 'Trạm xe buýt Minh Khai', 'BUS_STOP', 'Đường Minh Khai, Hai Bà Trưng, Hà Nội', '20.9956000', '105.8644000', 120],
    ['bach-khoa', 'Đại học Bách khoa Hà Nội', 'SCHOOL', 'Số 1 Đại Cồ Việt, Hai Bà Trưng, Hà Nội', '21.0045000', '105.8431000', 420],
    ['bach-khoa', 'Nhà thuốc Tạ Quang Bửu', 'PHARMACY', 'Tạ Quang Bửu, Hai Bà Trưng, Hà Nội', '21.0041000', '105.8474000', 110],
    ['cau-giay', 'Chợ Yên Hòa', 'MARKET', 'Yên Hòa, Cầu Giấy, Hà Nội', '21.0188000', '105.8024000', 280],
    ['cau-giay', 'Bến xe buýt Nguyễn Khang', 'BUS_STOP', 'Nguyễn Khang, Cầu Giấy, Hà Nội', '21.0193000', '105.8005000', 170],
    ['khuong-thuong', 'Đại học Thủy lợi', 'SCHOOL', '175 Tây Sơn, Đống Đa, Hà Nội', '21.0072000', '105.8286000', 260],
    ['khuong-thuong', 'Siêu thị WinMart Tây Sơn', 'SUPERMARKET', 'Tây Sơn, Đống Đa, Hà Nội', '21.0069000', '105.8303000', 150],
    ['thai-ha', 'Bệnh viện Đống Đa', 'HOSPITAL', '192 Nguyễn Lương Bằng, Đống Đa, Hà Nội', '21.0141000', '105.8245000', 480],
    ['thai-ha', 'Quán ăn Thái Hà', 'RESTAURANT', 'Thái Hà, Đống Đa, Hà Nội', '21.0117000', '105.8223000', 130],
  ];
  for (const [propertyKey, name, category, address, latitude, longitude, distanceMeters] of nearbyPlaceRows) {
    const propertyId = properties[propertyKey].id;
    await ensureMutable(
      'nearbyPlace',
      { propertyId, name },
      { propertyId, name, category, address, latitude, longitude, distanceMeters },
    );
  }

  console.info('Development demo data seeded successfully.');
}

main()
  .catch((error) => {
    console.error('Unable to seed development demo data.', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
