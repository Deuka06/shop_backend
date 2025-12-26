const swaggerJsdoc = require("swagger-jsdoc");

const isProduction = process.env.NODE_ENV === "production";
const serverUrl = isProduction
  ? "https://194.32.142.105/api/v1" // Production
  : "http://localhost:3000/api/v1"; // Development

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "E-commerce API",
      version: "1.0.0",
      description: "Онлайн дүкен Backend API",
      contact: {
        name: "API Support",
        email: "support@ecommerce.com",
      },
    },
    servers: [
      {
<<<<<<< HEAD
        url: "http://localhost:3000/api/v1",
        description: "Development Server",
=======
        url: 'http://localhost:3000/',
        description: 'Development Server',
>>>>>>> 45419a03ee6667dde46943c4bb77b6f57ea9e063
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT токеніңізді енгізіңіз. Формат: Bearer <token>",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
