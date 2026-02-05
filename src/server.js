require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const compression = require("compression");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./../config/swagger");
const orderHistoryRoutes = require("./routes/orderHistoryRoutes");
const orderRoutes = require("./routes/orderRoutes");

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const app = express();

// Middleware
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginOpenerPolicy: false,
    originAgentCluster: false,
  }),
);
app.use(compression());

// CORS - Swagger үшін кеңейтілген баптау
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  }),
);

app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Swagger UI - Жетілдірілген баптау
const swaggerOptions = {
  swaggerOptions: {
    url: "/api-docs/swagger.json",
    validatorUrl: null,
    docExpansion: "list",
    defaultModelsExpandDepth: 2,
    displayRequestDuration: true,
    showCommonExtensions: true,
    oauth2RedirectUrl: "/api-docs/oauth2-redirect.html",
    defaultModelRendering: "example",
    persistAuthorization: true,
  },
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .information-container { background-color: #f5f5f5; padding: 20px; }
    .swagger-ui .scheme-container { background-color: #fff; padding: 15px; }
  `,
  customSiteTitle: "E-commerce API Documentation",
  customCssUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui.min.css",
  customJs: [
    "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-bundle.js",
    "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-standalone-preset.js",
  ],
};

// Swagger UI қосу
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    swaggerOptions: {
      persistAuthorization: true,
    },
    customCss: ".swagger-ui .topbar { display: none }", // Мысалы, интерфейсті сәл реттеу
  }),
);

// Swagger JSON файлын бөлек алу үшін
app.get("/api-docs/swagger.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

// Swagger UI статикалық файлдары (егер CDN жұмыс істемесе)
app.use("/swagger-ui", express.static("node_modules/swagger-ui-dist"));

// Маршруттар
app.use("/api/v1/auth", require("./routes/authRoutes"));
app.use("/api/v1/products", require("./routes/productRoutes"));
app.use("/api/v1/orders/history", orderHistoryRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/courier", require("./routes/courierRoutes"));
app.use("/api/v1/categories", require("./routes/categoryRoutes"));

// Негізгі маршрут
app.get("/", (req, res) => {
  const protocol =
    req.protocol === "https" || req.headers["x-forwarded-proto"] === "https"
      ? "https"
      : "http";
  const host = req.headers.host;

  res.json({
    message: "E-commerce Backend API",
    version: "1.0.0",
    docs: "/api-docs",
    endpoints: {
      auth: "/api/v1/auth",
      products: "/api/v1/products",
      orders: "/api/orders",
      courier: "/api/v1/courier",
      swagger: "/api-docs",
      swaggerJson: "/api-docs/swagger.json",
    },
    access: {
      current: `${protocol}://${host}`,
      direct: `http://46.247.41.196`,
      nginx: `https://46.247.41.196`,
      api: `${protocol}://${host.replace(/:3000$/, "")}/api/v1`,
    },
  });
});

// Swagger UI үшін қосымша маршрут
app.get("/api-docs/redirect", (req, res) => {
  const isHttps =
    req.protocol === "https" || req.headers["x-forwarded-proto"] === "https";
  const baseUrl = isHttps
    ? `https://${req.headers.host.replace(/:3000$/, "")}`
    : `http://${req.headers.host}`;

  res.send(`
    <html>
      <head>
        <meta http-equiv="refresh" content="0; url=${baseUrl}/api-docs">
        <title>Swagger UI Redirect</title>
      </head>
      <body>
        <p>Swagger UI-ға бағытталуда... <a href="${baseUrl}/api-docs">Мұнда басыңыз</a></p>
      </body>
    </html>
  `);
});

// 404 қате
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Маршрут табылмады",
    requestedUrl: req.originalUrl,
    availableEndpoints: {
      apiDocs: "/api-docs",
      api: "/api/v1",
      home: "/",
    },
  });
});

// Global қателерді өңдеу
app.use((err, req, res, next) => {
  console.error(err.stack);

  const statusCode = err.statusCode || 500;
  const message = err.message || "Ішкі сервер қатесі";

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// Базаға қосылу
async function connectDB() {
  try {
    await prisma.$connect();
    console.log("✅ PostgreSQL базасына қосылды");
  } catch (error) {
    console.error("❌ Базаға қосылу қатесі:", error);
    process.exit(1);
  }
}

// Серверді іске қосу
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "0.0.0.0";
app.listen(PORT, HOST, async () => {
  await connectDB();
  console.log(`✅ Сервер ${PORT} портында іске қосылды`);
  console.log(`🌐 Тікелей қосылу: http://${HOST}:${PORT}`);
  console.log(`🌐 Nginx арқылы: https://46.247.41.196`);
  console.log(`📚 API документация:`);
  console.log(`   - http://localhost:${PORT}/api-docs`);
  console.log(`   - https://46.247.41.196/api-docs`);
  console.log(`📊 Swagger JSON: http://${HOST}:${PORT}/api-docs/swagger.json`);
});

// Graceful shutdown
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  console.log("🛑 Базадан ажырады");
  process.exit(0);
});

module.exports = app;
