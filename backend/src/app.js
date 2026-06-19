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
import insightsRoutes from './modules/insights/insights.routes.js';
import orchestratorRoutes from './modules/orchestrator/orchestrator.routes.js';
import memoryRoutes from './modules/memory/memory.routes.js';
import knowledgeRoutes from './modules/knowledge/knowledge.routes.js';
import promptRoutes from './modules/prompts/prompts.routes.js';
import workflowRoutes from './modules/workflow/workflow.routes.js';
import workflowBuilderRoutes from './modules/workflow/builder.routes.js';
import monitoringRoutes from './modules/monitoring/monitoring.routes.js';
import { swaggerDocs, swaggerUi } from './docs/swagger.js';
import { env } from './config/env.js';
import { notFoundHandler, errorHandler } from './middlewares/error.middleware.js';

const app = express();
const allowedOrigins = (env.clientUrl || 'http://localhost:5174')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(helmet());
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true
  })
);
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
app.use('/insights', insightsRoutes);
app.use('/orchestrator', orchestratorRoutes);
app.use('/memory', memoryRoutes);
app.use('/knowledge', knowledgeRoutes);
app.use('/prompts', promptRoutes);
app.use('/workflow', workflowRoutes);
app.use('/builder', workflowBuilderRoutes);
app.use('/monitoring', monitoringRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
