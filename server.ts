import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { createServer as createViteServer } from 'vite';

import { connectDB } from './server/config/db.ts';
import { ensureSeeded } from './server/seed/seedData.ts';
import { errorHandler } from './server/middleware/errorHandler.ts';

import authRoutes from './server/routes/authRoutes.ts';
import memberRoutes from './server/routes/memberRoutes.ts';
import planRoutes from './server/routes/planRoutes.ts';
import saladRoutes from './server/routes/saladRoutes.ts';
import ingredientRoutes from './server/routes/ingredientRoutes.ts';
import customSaladRoutes from './server/routes/customSaladRoutes.ts';
import orderRoutes from './server/routes/orderRoutes.ts';
import subscriptionRoutes from './server/routes/subscriptionRoutes.ts';
import paymentRoutes from './server/routes/paymentRoutes.ts';

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);

  // Connect MongoDB & seed initial sample data if database is empty
  await connectDB();
  await ensureSeeded();

  // Global middleware
  app.use(cors());
  app.use(express.json({ limit: '2mb' }));

  // Serve generated salad images in both dev and production builds
  app.use(
    '/src/assets',
    express.static(path.resolve(process.cwd(), 'src/assets'))
  );

  // API health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'Verdant Bowl API' });
  });

  // REST API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/members', memberRoutes);
  app.use('/api/plans', planRoutes);
  app.use('/api/salads', saladRoutes);
  app.use('/api/ingredients', ingredientRoutes);
  app.use('/api/custom-salads', customSaladRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/subscriptions', subscriptionRoutes);
  app.use('/api/payments', paymentRoutes);

  // 404 for unknown API routes
  app.use('/api/*', (_req, res) => {
    res.status(404).json({ message: 'API endpoint not found.' });
  });

  // Mount Vite middleware in development or static dist in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Centralized error handler
  app.use(errorHandler);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Verdant Bowl MERN server listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start Verdant Bowl server:', err);
  process.exit(1);
});
