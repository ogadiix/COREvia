import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './src/api/routes.ts';
import {
  securityHeaders,
  hardenedCors,
  requestCorrelationAndLogging,
  csrfProtection,
} from './src/middleware/security.ts';
import { validateEnvironment } from './src/lib/env.ts';
import { seedAuthUsersAndRoles } from './src/db/seedAuthUsers.ts';
import { seedPhase24Interactions } from './src/db/seedInteractions.ts';
import { seedPhase25Documents } from './src/db/seedDocuments.ts';
import { seedRelationshipTwinData } from './src/db/seedRelationshipTwin.ts';
import { seedPhase28RelationshipGraphData } from './src/db/seedRelationshipGraph.ts';
import { seedDecisionTraces } from './src/db/seedDecisionTraces.ts';
import { seedStrategyScenarios } from './src/db/seedStrategyScenarios.ts';
import { seedJourneys } from './src/db/seedJourneys.ts';

async function startServer() {
  // Validate required configuration before starting
  validateEnvironment();

  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Disable server identification header
  app.disable('x-powered-by');

  // Security Headers & Hardened CORS
  app.use(securityHeaders);
  app.use(hardenedCors);

  // Request Correlation and Structured Observability
  app.use(requestCorrelationAndLogging);

  // Request parsing with strict payload bounds (supports safe base64 document uploads up to 20MB)
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));
  app.use(cookieParser());

  // CSRF Protection for state-changing requests
  app.use(csrfProtection);

  // Mount API routes FIRST
  app.use('/api', apiRouter);

  // Vite middleware for development vs static dist for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Seed Enterprise Auth Users, Phase 24 Interactions, Phase 25 Documents, Phase 26 Relationship Twin & Phase 28 Relationship Graph if database is ready
  try {
    await seedAuthUsersAndRoles();
    await seedPhase24Interactions();
    await seedPhase25Documents();
    await seedRelationshipTwinData();
    await seedPhase28RelationshipGraphData();
    await seedDecisionTraces();
    await seedStrategyScenarios();
    await seedJourneys();
  } catch (err: any) {
    console.warn(`[Startup Info] Database auto-seed deferred: ${err.message || 'Database not yet reachable'}`);
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`COREvia Server running on http://0.0.0.0:${PORT}`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n❌ Error: Port ${PORT} is already in use by another process.`);
      console.error(`👉 Tip: Free the port using 'kill -9 $(lsof -t -i :${PORT})' or specify another port: 'PORT=${PORT + 1} npm run dev'\n`);
    } else {
      console.error('Server error:', err);
    }
    process.exit(1);
  });

  const gracefulShutdown = () => {
    console.log('Received shutdown signal. Closing HTTP server...');
    server.close(() => {
      console.log('HTTP server closed. Exiting process.');
      process.exit(0);
    });

    // Force close after 10s if connections linger
    setTimeout(() => {
      console.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
}

startServer();
