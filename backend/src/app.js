import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.routes.js';
import aiRoutes from './modules/ai/ai.routes.js';
import salesRoutes from './modules/sales-agent/sales.routes.js';
import marketingRoutes from './modules/marketing-agent/marketing.routes.js';
import supportRoutes from './modules/support-agent/support.routes.js';
import analyticsRoutes from './modules/analytics-agent/analytics.routes.js';
import orchestratorRoutes from './modules/orchestrator/orchestrator.routes.js';
import { swaggerDocs, swaggerUi } from './docs/swagger.js';
import { env } from './config/env.js';
import { notFoundHandler, errorHandler } from './middlewares/error.middleware.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: 'draft-7',
    legacyHeaders: false
  })
);

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'ai-business-platform-api' });
});

app.get('/api-docs.json', (_req, res) => {
  res.status(200).json(swaggerDocs);
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
app.use('/auth', authRoutes);
app.use('/ai', aiRoutes);
app.use('/sales', salesRoutes);
app.use('/marketing', marketingRoutes);
app.use('/support', supportRoutes);
app.use('/analytics', analyticsRoutes);
app.use('/orchestrator', orchestratorRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
