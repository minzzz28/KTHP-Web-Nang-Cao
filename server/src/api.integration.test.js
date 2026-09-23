/*
 * These tests exercise the real Express routes against the seeded development
 * database. They are opt-in so a regular `npm test` remains self-contained.
 * Run with RUN_DB_TESTS=1 and a DATABASE_URL that points to a migrated, seeded
 * local database.
 */
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL ||= 'mysql://test:test@localhost:3306/test';
process.env.JWT_SECRET ||= 'test-secret-that-is-long-enough-for-jwt-validation';
process.env.CLIENT_URL ||= 'http://localhost:5173';

const request = require('supertest');
const fs = require('fs/promises');
const path = require('path');
const { prisma } = require('./lib/prisma');
const { createApp } = require('./app');
const { uploadDir } = require('./middleware/upload.middleware');

const describeDatabase = process.env.RUN_DB_TESTS === '1' ? describe : describe.skip;

describeDatabase('seeded API integration', () => {
  const app = createApp();
  let studentToken;
  let landlordToken;
  let university;
  let landlordRoom;
  let hiddenRoom;
  let workflowRoom;
  let workflowRoomState;
  let workflowTenant;
  let workflowCleanupPending = false;
  const workflowContractNumber = `IT-WORKFLOW-${Date.now().toString(36)}-${process.pid}`;
  const authTestSuffix = `${Date.now().toString(36)}${process.pid}`;
  const usernameOnlyAccount = {
    username: `ituser${authTestSuffix}`,
    password: 'Integration123!',
    fullName: 'Tài khoản chỉ tên đăng nhập'
  };
  const emailOnlyAccount = {
    email: `it.email.${authTestSuffix}@example.invalid`,
    password: 'Integration123!',
    fullName: 'Tài khoản chỉ email'
  };
  const duplicateUsernameAccount = {
    username: `itdupe${authTestSuffix}`,
    email: `it.dupe.${authTestSuffix}@example.invalid`,
    password: 'Integration123!',
    fullName: 'Tài khoản kiểm tra trùng tên'
  };
  const authTestUsernames = [usernameOnlyAccount.username, duplicateUsernameAccount.username];
  const authTestEmails = [emailOnlyAccount.email, duplicateUsernameAccount.email, `it.dupe.retry.${authTestSuffix}@example.invalid`];
  const uploadedImageIds = [];
  const uploadedFileNames = [];

  // Auth routes intentionally throttle repeated attempts. Create an isolated
  // app per authentication assertion so this suite can exercise validation
  // cases without weakening the production limiter or masking a 429 response.
  function authRequest() {
    return request(createApp());
  }

  async function cleanupAuthTestUsers() {
    await prisma.user.deleteMany({
      where: {
        OR: [
          { username: { in: authTestUsernames } },
          { email: { in: authTestEmails } }
        ]
      }
    });
  }

  async function cleanupLandlordWorkflow() {
    const contracts = await prisma.contract.findMany({
      where: { contractNumber: workflowContractNumber },
      select: { id: true }
    });
    const contractIds = contracts.map((contract) => contract.id);
    const invoices = contractIds.length
      ? await prisma.invoice.findMany({
        where: { contractId: { in: contractIds } },
        select: { id: true }
      })
      : [];
    const invoiceIds = invoices.map((invoice) => invoice.id);
    const notificationLinks = [
      ...contractIds.map((contractId) => `/contracts/${contractId}`),
      ...invoiceIds.map((invoiceId) => `/invoices/${invoiceId}`)
    ];

    await prisma.$transaction(async (tx) => {
      if (notificationLinks.length) {
        await tx.notification.deleteMany({ where: { linkUrl: { in: notificationLinks } } });
      }
      if (invoiceIds.length) {
        await tx.invoiceItem.deleteMany({ where: { invoiceId: { in: invoiceIds } } });
        await tx.invoice.deleteMany({ where: { id: { in: invoiceIds } } });
      }
      if (contractIds.length) {
        await tx.contractTenant.deleteMany({ where: { contractId: { in: contractIds } } });
        await tx.contract.deleteMany({ where: { id: { in: contractIds } } });
      }
      if (workflowRoomState) {
        await tx.room.update({
          where: { id: workflowRoomState.id },
          data: {
            availableSlots: workflowRoomState.availableSlots,
            status: workflowRoomState.status
          }
        });
      }
    });

    expect(await prisma.contract.count({ where: { contractNumber: workflowContractNumber } })).toBe(0);
    if (contractIds.length) {
      expect(await prisma.invoice.count({ where: { contractId: { in: contractIds } } })).toBe(0);
    }
    if (notificationLinks.length) {
      expect(await prisma.notification.count({ where: { linkUrl: { in: notificationLinks } } })).toBe(0);
    }
    if (workflowRoomState) {
      const restoredRoom = await prisma.room.findUnique({
        where: { id: workflowRoomState.id },
        select: { availableSlots: true, status: true }
      });
      expect(restoredRoom).toMatchObject({
        availableSlots: workflowRoomState.availableSlots,
        status: workflowRoomState.status
      });
    }
  }

  beforeAll(async () => {
    const login = await authRequest()
      .post('/api/auth/login')
      .send({ email: 'student@gmail.com', password: '123' });

    expect(login.status).toBe(200);
    studentToken = login.body.data.accessToken;
    const landlordLogin = await authRequest()
      .post('/api/auth/login')
      .send({ email: 'chutro@gmail.com', password: '123' });

    expect(landlordLogin.status).toBe(200);
    landlordToken = landlordLogin.body.data.accessToken;
    university = await prisma.university.findFirst({
      where: { isPrimary: true },
      select: { id: true, code: true, isPrimary: true }
    });
    landlordRoom = await prisma.room.findFirst({
      where: { property: { landlord: { email: 'chutro@gmail.com' } } },
      orderBy: { id: 'asc' },
      select: { id: true }
    });
    hiddenRoom = await prisma.room.findFirst({
      where: { status: 'HIDDEN' },
      orderBy: { id: 'asc' },
      select: { id: true }
    });
    workflowRoom = await prisma.room.findFirst({
      where: {
        code: 'B102',
        status: 'AVAILABLE',
        availableSlots: { gte: 1 },
        property: { landlord: { email: 'chutro@gmail.com' } }
      },
      select: { id: true, price: true, availableSlots: true, status: true }
    });
    workflowRoomState = workflowRoom && {
      id: workflowRoom.id,
      availableSlots: workflowRoom.availableSlots,
      status: workflowRoom.status
    };
    workflowTenant = await prisma.user.findUnique({
      where: { email: 'student@gmail.com' },
      select: { id: true }
    });
  });

  afterEach(async () => {
    if (!workflowCleanupPending) return;
    await cleanupLandlordWorkflow();
    workflowCleanupPending = false;
  });

  afterAll(async () => {
    if (workflowCleanupPending) {
      await cleanupLandlordWorkflow();
    }
    await cleanupAuthTestUsers();
    if (uploadedImageIds.length) {
      await prisma.roomImage.deleteMany({ where: { id: { in: uploadedImageIds } } });
    }
    await Promise.all(uploadedFileNames.map((fileName) => fs.unlink(path.join(uploadDir, fileName)).catch(() => undefined)));
    await prisma.$disconnect();
  });

  test('authenticates the seeded student with an email identifier without exposing the password hash', async () => {
    const response = await authRequest()
      .post('/api/auth/login')
      .send({ identifier: 'student@gmail.com', password: '123' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.accessToken).toEqual(expect.any(String));
    expect(response.body.data.user).toMatchObject({
      email: 'student@gmail.com',
      role: 'STUDENT'
    });
    expect(response.body.data.user.passwordHash).toBeUndefined();
    expect(response.body.data.user.password_hash).toBeUndefined();
  });

  test('authenticates the seeded student with a username identifier', async () => {
    const response = await authRequest()
      .post('/api/auth/login')
      .send({ identifier: 'student', password: '123' });

    expect(response.status).toBe(200);
    expect(response.body.data.user).toMatchObject({
      username: 'student',
      email: 'student@gmail.com',
      role: 'STUDENT'
    });
    expect(response.body.data.user.passwordHash).toBeUndefined();
  });

  test('continues accepting the legacy email login payload', async () => {
    const response = await authRequest()
      .post('/api/auth/login')
      .send({ email: 'student@gmail.com', password: '123' });

    expect(response.status).toBe(200);
    expect(response.body.data.accessToken).toEqual(expect.any(String));
    expect(response.body.data.user).toMatchObject({ username: 'student', email: 'student@gmail.com' });
  });

  test('registers a username-only account and normalizes its username for login', async () => {
    const response = await authRequest()
      .post('/api/auth/register')
      .send({ ...usernameOnlyAccount, username: usernameOnlyAccount.username.toUpperCase() });

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({
      accessToken: expect.any(String),
      user: {
        username: usernameOnlyAccount.username,
        email: null,
        role: 'STUDENT'
      }
    });
    expect(response.body.data.user.passwordHash).toBeUndefined();

    const login = await authRequest()
      .post('/api/auth/login')
      .send({ identifier: usernameOnlyAccount.username.toUpperCase(), password: usernameOnlyAccount.password });

    expect(login.status).toBe(200);
    expect(login.body.data.user).toMatchObject({ username: usernameOnlyAccount.username, email: null });
    expect(login.body.data.user.passwordHash).toBeUndefined();
  });

  test('registers an email-only account and accepts its legacy email login payload', async () => {
    const response = await authRequest()
      .post('/api/auth/register')
      .send({ ...emailOnlyAccount, email: emailOnlyAccount.email.toUpperCase() });

    expect(response.status).toBe(201);
    expect(response.body.data.user).toMatchObject({
      username: null,
      email: emailOnlyAccount.email,
      role: 'STUDENT'
    });
    expect(response.body.data.user.passwordHash).toBeUndefined();

    const login = await authRequest()
      .post('/api/auth/login')
      .send({ email: emailOnlyAccount.email.toUpperCase(), password: emailOnlyAccount.password });

    expect(login.status).toBe(200);
    expect(login.body.data.user).toMatchObject({ username: null, email: emailOnlyAccount.email });
    expect(login.body.data.user.passwordHash).toBeUndefined();
  });

  test('rejects registration and login requests that do not provide an identifier', async () => {
    const registration = await authRequest()
      .post('/api/auth/register')
      .send({ password: 'Integration123!', fullName: 'Thiếu định danh' });
    const login = await authRequest()
      .post('/api/auth/login')
      .send({ password: 'Integration123!' });

    expect(registration.status).toBe(422);
    expect(registration.body).toMatchObject({ success: false });
    expect(login.status).toBe(422);
    expect(login.body).toMatchObject({ success: false });
  });

  test('rejects a malformed login identifier before looking up an account', async () => {
    const response = await authRequest()
      .post('/api/auth/login')
      .send({ identifier: 'not an email@', password: 'Integration123!' });

    expect(response.status).toBe(422);
    expect(response.body).toMatchObject({ success: false });
  });

  test('returns the same generic error for a valid but unknown identifier', async () => {
    const response = await authRequest()
      .post('/api/auth/login')
      .send({ identifier: `unknown-${authTestSuffix}`, password: 'Integration123!' });

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      success: false,
      message: 'Tên đăng nhập/email hoặc mật khẩu không hợp lệ'
    });
  });

  test('rejects a case-insensitive duplicate username with a conflict response', async () => {
    const first = await authRequest()
      .post('/api/auth/register')
      .send(duplicateUsernameAccount);

    expect(first.status).toBe(201);

    const duplicate = await authRequest()
      .post('/api/auth/register')
      .send({
        ...duplicateUsernameAccount,
        username: duplicateUsernameAccount.username.toUpperCase(),
        email: authTestEmails[2]
      });

    expect(duplicate.status).toBe(409);
    expect(duplicate.body).toMatchObject({ success: false });
  });

  test('rejects an email-shaped username so email and username namespaces remain unambiguous', async () => {
    const response = await authRequest()
      .post('/api/auth/register')
      .send({
        username: 'student@gmail.com',
        password: 'Integration123!',
        fullName: 'Tên đăng nhập không hợp lệ'
      });

    expect(response.status).toBe(422);
    expect(response.body).toMatchObject({ success: false });
  });

  test('searches available rooms by price and only returns the selected radius', async () => {
    expect(university).toBeTruthy();
    expect(university).toMatchObject({ code: 'PHENIKAA', isPrimary: true });
    const response = await request(app)
      .get('/api/rooms/search')
      .query({
        minPrice: 2000000,
        maxPrice: 5000000,
        universityId: university.id,
        radiusKm: 10,
        sort: 'DISTANCE_ASC',
        limit: 20
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.items.length).toBeGreaterThan(0);
    expect(response.body.data.items.every((room) => Number(room.price) >= 2000000)).toBe(true);
    expect(response.body.data.items.every((room) => Number(room.price) <= 5000000)).toBe(true);
    expect(response.body.data.items.every((room) => room.distanceKm <= 10)).toBe(true);
    expect(response.body.meta).toMatchObject({ page: 1, limit: 20, total: expect.any(Number), totalPages: expect.any(Number) });
  });

  test('lists Phenikaa first as the configured primary university', async () => {
    const response = await request(app)
      .get('/api/universities')
      .query({ limit: 50 });

    expect(response.status).toBe(200);
    expect(response.body.data.items[0]).toMatchObject({
      code: 'PHENIKAA',
      name: 'Đại học Phenikaa',
      isPrimary: true
    });
    expect(response.body.data.items.filter((item) => item.isPrimary)).toHaveLength(1);
  });

  test('never exposes hidden listings or their price history through public room routes', async () => {
    expect(hiddenRoom).toBeTruthy();
    const listResponse = await request(app)
      .get('/api/rooms')
      .query({ availableOnly: false, limit: 50 });

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.data.items.some((room) => room.id === hiddenRoom.id || room.status === 'HIDDEN')).toBe(false);

    const historyResponse = await request(app).get(`/api/rooms/${hiddenRoom.id}/price-history`);
    expect(historyResponse.status).toBe(404);
  });

  test('rejects a student attempting a landlord-only room mutation', async () => {
    const response = await request(app)
      .post('/api/rooms')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({});

    expect(response.status).toBe(403);
    expect(response.body).toMatchObject({ success: false });
    expect(response.body.message).toContain('không có quyền');
  });

  test('lets the owning landlord activate a draft contract and issue its first valid invoice', async () => {
    expect(workflowRoom).toBeTruthy();
    expect(workflowTenant).toBeTruthy();
    workflowCleanupPending = true;

    const draftResponse = await request(app)
      .post('/api/contracts')
      .set('Authorization', `Bearer ${landlordToken}`)
      .send({
        contractNumber: workflowContractNumber,
        roomId: workflowRoom.id,
        startDate: '2027-01-01',
        endDate: '2027-12-31',
        rent: 3400000,
        deposit: 3400000,
        terms: 'Người thuê thanh toán đúng hạn và giữ gìn tài sản trong phòng.',
        tenants: [{ studentId: workflowTenant.id, isPrimaryTenant: true, moveInDate: '2027-01-01' }]
      });

    expect(draftResponse.status).toBe(201);
    expect(draftResponse.body).toMatchObject({
      success: true,
      data: {
        contractNumber: workflowContractNumber,
        roomId: workflowRoom.id,
        status: 'DRAFT'
      }
    });
    const contractId = draftResponse.body.data.id;
    expect(contractId).toEqual(expect.any(Number));

    const activationResponse = await request(app)
      .post(`/api/contracts/${contractId}/status`)
      .set('Authorization', `Bearer ${landlordToken}`)
      .send({ status: 'ACTIVE' });

    expect(activationResponse.status).toBe(200);
    expect(activationResponse.body.data).toMatchObject({ id: contractId, status: 'ACTIVE' });
    const roomAfterActivation = await prisma.room.findUnique({
      where: { id: workflowRoom.id },
      select: { availableSlots: true, status: true }
    });
    expect(roomAfterActivation).toMatchObject({
      availableSlots: workflowRoomState.availableSlots - 1,
      status: workflowRoomState.availableSlots === 1 ? 'RENTED' : 'AVAILABLE'
    });

    const invoiceResponse = await request(app)
      .post('/api/invoices')
      .set('Authorization', `Bearer ${landlordToken}`)
      .send({
        contractId,
        periodStart: '2027-01-01',
        periodEnd: '2027-01-31',
        dueDate: '2027-02-05',
        electricityStart: 100,
        electricityEnd: 113,
        electricityUnitPrice: 3500,
        waterStart: 10,
        waterEnd: 14,
        waterUnitPrice: 20000,
        rentAmount: 3400000,
        internetAmount: 100000,
        parkingAmount: 50000,
        serviceAmount: 25000,
        otherAmount: 10000
      });

    expect(invoiceResponse.status).toBe(201);
    expect(invoiceResponse.body).toMatchObject({
      success: true,
      data: {
        contractId,
        status: 'UNPAID',
        electricityUsage: '13',
        waterUsage: '4',
        totalAmount: '3710500'
      }
    });
    expect(invoiceResponse.body.data.items).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'RENT', amount: '3400000' }),
      expect.objectContaining({ type: 'ELECTRICITY', amount: '45500' }),
      expect.objectContaining({ type: 'WATER', amount: '80000' })
    ]));
  });

  test('allows the owning landlord to upload a supported room image', async () => {
    expect(landlordRoom).toBeTruthy();
    const image = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL9ygAAAABJRU5ErkJggg==', 'base64');
    const response = await request(app)
      .post(`/api/rooms/${landlordRoom.id}/images/upload`)
      .set('Authorization', `Bearer ${landlordToken}`)
      .attach('images', image, { filename: 'test-room.html', contentType: 'image/png' });
    const uploadedImage = response.body?.data?.items?.[0];

    if (uploadedImage?.id && uploadedImage?.url) {
      uploadedImageIds.push(uploadedImage.id);
      uploadedFileNames.push(path.basename(decodeURIComponent(uploadedImage.url)));
    }

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.items).toHaveLength(1);
    expect(uploadedImage).toMatchObject({ roomId: landlordRoom.id, url: expect.stringMatching(/^\/uploads\//) });
    expect(uploadedImage.url).toMatch(/\.png$/);
  });

  test('rejects a file whose bytes do not match its declared image type and removes it', async () => {
    const filesBefore = await fs.readdir(uploadDir);
    const response = await request(app)
      .post(`/api/rooms/${landlordRoom.id}/images/upload`)
      .set('Authorization', `Bearer ${landlordToken}`)
      .attach('images', Buffer.from('<script>alert(1)</script>'), { filename: 'not-an-image.png', contentType: 'image/png' });

    expect(response.status).toBe(422);
    expect(response.body).toMatchObject({ success: false });
    expect(response.body.message).toContain('Nội dung tệp');
    expect((await fs.readdir(uploadDir)).sort()).toEqual(filesBefore.sort());
  });

  test('returns a validation error for an unsupported upload type', async () => {
    const response = await request(app)
      .post(`/api/rooms/${landlordRoom.id}/images/upload`)
      .set('Authorization', `Bearer ${landlordToken}`)
      .attach('images', Buffer.from('not an image'), { filename: 'notes.txt', contentType: 'text/plain' });

    expect(response.status).toBe(422);
    expect(response.body).toMatchObject({ success: false });
    expect(response.body.message).toContain('JPEG');
  });
});
