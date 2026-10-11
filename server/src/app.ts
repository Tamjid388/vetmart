import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import { StatusCodes } from 'http-status-codes';
import morgan from 'morgan';
import config from './app/config/index.js';
import { globalErrorHandler } from './app/middlewares/globalErrorHandler.js';
import { notFound } from './app/middlewares/notFound.js';
import { appRoutes } from './app/routes/index.js';
import { sendResponse } from './app/shared/sendResponse.js';

export const app = express();

// Required on Vercel serverless so `Secure` cookies work behind the proxy.
app.set('trust proxy', 1);

// Security + parsing + observability (order matters)
app.use(helmet());
// CORS_ORIGIN may be a single URL or comma-list; trim + strip trailing slash
// so `https://x.netlify.app/` doesn't silently mismatch `https://x.netlify.app`.
const allowedOrigins = config.CORS_ORIGIN.split(',')
  .map((o) => o.trim().replace(/\/+$/, ''))
  .filter(Boolean);
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser clients (curl, health checks) with no Origin header.
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  }),
);
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan(config.isProduction ? 'combined' : 'dev'));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 200,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Too many requests, please try again later',
    },
  }),
);

app.get('/health', (_req, res) => {
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'BagherHat Poultry API is healthy',
    data: { uptime: process.uptime() },
  });
});

app.use('/api/v1', appRoutes);

// Must come after all routes
app.use(notFound);
app.use(globalErrorHandler);
