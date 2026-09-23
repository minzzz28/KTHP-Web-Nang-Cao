const express = require('express');
const { authRouter } = require('../modules/auth/routes');
const { usersRouter } = require('../modules/users/routes');
const { universitiesRouter } = require('../modules/universities/routes');
const { propertiesRouter } = require('../modules/properties/routes');
const { roomsRouter } = require('../modules/rooms/routes');
const { favoritesRouter } = require('../modules/favorites/routes');
const { roommatesRouter } = require('../modules/roommates/routes');
const { roommatePostsRouter } = require('../modules/roommate-posts/routes');
const { roommateRequestsRouter } = require('../modules/roommate-requests/routes');
const { groupsRouter } = require('../modules/groups/routes');
const { chatRouter } = require('../modules/chat/routes');
const { appointmentsRouter } = require('../modules/appointments/routes');
const { contractsRouter } = require('../modules/contracts/routes');
const { invoicesRouter } = require('../modules/invoices/routes');
const { reviewsRouter } = require('../modules/reviews/routes');
const { reportsRouter } = require('../modules/reports/routes');
const { notificationsRouter } = require('../modules/notifications/routes');
const { verificationsRouter } = require('../modules/verifications/routes');
const { adminRouter } = require('../modules/admin/routes');
const { studentDashboardRouter, landlordDashboardRouter } = require('../modules/dashboards/routes');
const { tenantsRouter } = require('../modules/tenants/routes');

const apiRouter = express.Router();

apiRouter.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Student Rental API đang hoạt động',
    data: { version: '1.0.0' }
  });
});

apiRouter.use('/auth', authRouter);
apiRouter.use('/users', usersRouter);
apiRouter.use('/universities', universitiesRouter);
apiRouter.use('/properties', propertiesRouter);
apiRouter.use('/rooms', roomsRouter);
apiRouter.use('/favorites', favoritesRouter);
apiRouter.use('/roommates', roommatesRouter);
apiRouter.use('/roommate-posts', roommatePostsRouter);
apiRouter.use('/roommate-requests', roommateRequestsRouter);
apiRouter.use('/groups', groupsRouter);
apiRouter.use('/conversations', chatRouter);
apiRouter.use('/appointments', appointmentsRouter);
apiRouter.use('/contracts', contractsRouter);
apiRouter.use('/invoices', invoicesRouter);
apiRouter.use('/reviews', reviewsRouter);
apiRouter.use('/reports', reportsRouter);
apiRouter.use('/notifications', notificationsRouter);
apiRouter.use('/verifications', verificationsRouter);
apiRouter.use('/admin', adminRouter);
apiRouter.use('/students', studentDashboardRouter);
apiRouter.use('/landlords', landlordDashboardRouter);
apiRouter.use('/student', studentDashboardRouter);
apiRouter.use('/landlord', landlordDashboardRouter);
apiRouter.use('/tenants', tenantsRouter);

module.exports = { apiRouter };
