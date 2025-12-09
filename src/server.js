require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./../config/swagger');

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const app = express();

// Middleware
app.use(helmet());
app.use(compression());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  })
);
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Swagger UI
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    swaggerOptions: {
      persistAuthorization: true, // Authorization token сақтау
    },
  })
);

// Маршруттар
app.use('/api/v1/auth', require('./routes/authRoutes'));
app.use('/api/v1/products', require('./routes/productRoutes'));

// Негізгі маршрут
app.get('/', (req, res) => {
  res.json({
    message: 'E-commerce Backend API',
    version: '1.0.0',
    docs: '/api-docs',
    endpoints: {
      auth: '/api/v1/auth',
      products: '/api/v1/products',
    },
  });
});

// 404 қате
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Маршрут табылмады',
  });
});

// Global қателерді өңдеу
app.use((err, req, res, next) => {
  console.error(err.stack);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Ішкі сервер қатесі';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Базаға қосылу
async function connectDB() {
  try {
    await prisma.$connect();
    console.log('✅ PostgreSQL базасына қосылды');
  } catch (error) {
    console.error('❌ Базаға қосылу қатесі:', error);
    process.exit(1);
  }
}

// Серверді іске қосу
const PORT = process.env.PORT || 8080;
app.listen(PORT, async () => {
  await connectDB();
  console.log(`✅ Сервер ${PORT} портында іске қосылды`);
  console.log(`🌐 http://localhost:${PORT}`);
  console.log(`📚 API документация: http://localhost:${PORT}/api-docs`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  console.log('🛑 Базадан ажырады');
  process.exit(0);
});

module.exports = app;
