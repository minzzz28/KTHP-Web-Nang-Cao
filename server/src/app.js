const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { getEnv } = require('./config/env');
const { uploadDir } = require('./middleware/upload.middleware');
const { notFound, errorHandler } = require('./middleware/error.middleware');
const { apiRouter } = require('./routes');

function createApp() {
  const env = getEnv();
  fs.mkdirSync(uploadDir, { recursive: true });
  const clientDistDir = path.resolve(__dirname, '../../client/dist');
  const serveClient = process.env.SERVE_CLIENT === 'true' && fs.existsSync(clientDistDir);

  const app = express();
  app.disable('x-powered-by');
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' }
    })
  );
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || origin === env.CLIENT_URL) return callback(null, true);
        return callback(new Error('Origin không được phép bởi CORS'));
      },
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization']
    })
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false, limit: '1mb' }));
  if (env.NODE_ENV !== 'test') app.use(morgan('dev'));

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Bạn đã gửi quá nhiều yêu cầu xác thực. Vui lòng thử lại sau.'
    }
  });

  app.get('/health', (req, res) => {
    res.json({ success: true, message: 'Server đang hoạt động', data: { status: 'ok' } });
  });
  app.use('/uploads', express.static(uploadDir, { index: false, fallthrough: false, maxAge: '1h' }));
  app.use('/api/auth', authLimiter);
  app.use('/api', apiRouter);
  if (serveClient) {
    app.use(express.static(clientDistDir, { index: false, maxAge: '1h' }));
    app.get('*', (req, res, next) => {
      if (req.path === '/api' || req.path.startsWith('/api/')) return next();
      return res.sendFile(path.join(clientDistDir, 'index.html'));
    });
  }
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
