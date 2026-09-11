import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import profileRoutes from './routes/profileRoutes.js';
import recommendationRoutes from './routes/recommendationRoutes.js';
import activityRoutes from './routes/activityRoutes.js';
import groupRoutes from './routes/groupRoutes.js';
import coupleRoutes from './routes/coupleRoutes.js';
import venueRoutes from './routes/venueRoutes.js';
import { setupGroupSocket } from './sockets/groupSocket.js';
import { db } from './db/store.js';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';


const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

app.use(cors());
app.use(express.json());

app.use(helmet());
app.use(compression());

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 200, // Limit each IP to 200 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Çok fazla istek gönderdiniz, lütfen daha sonra tekrar deneyin.' }
});

app.use('/api/', apiLimiter);


// Lightweight Request Logger & Timing Middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (!req.path.includes('/health')) {
      console.log(`[HTTP] ${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), app: 'Farketmez API' });
});

// API Routes
app.use('/api', profileRoutes);
app.use('/api', recommendationRoutes);
app.use('/api', activityRoutes);
app.use('/api', groupRoutes);
app.use('/api', coupleRoutes);
app.use('/api', venueRoutes);

// Setup Socket.io
setupGroupSocket(io);

// 404 Handler for undefined API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: `API route not found: ${req.method} ${req.originalUrl}` });
});

// Central Error Handling Middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Server Error]', err);
  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    error: err.message || 'Beklenmeyen bir sunucu hatası oluştu',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 Farketmez Backend Server running on http://localhost:${PORT}`);
});

// Graceful Shutdown Handling
const handleShutdown = async (signal: string) => {
  console.log(`\n[Server] Received ${signal}. Starting graceful shutdown...`);
  server.close(async () => {
    console.log('[Server] HTTP & WebSocket servers closed.');
    try {
      await db.flush();
      console.log('[Server] Database successfully flushed to disk.');
    } catch (e) {
      console.error('[Server] Error flushing DB during shutdown:', e);
    }
    process.exit(0);
  });

  // Force shutdown after 5 seconds if connections hang
  setTimeout(() => {
    console.error('[Server] Forced shutdown after timeout.');
    process.exit(1);
  }, 5000);
};

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));
