const swaggerJsdoc = require("swagger-jsdoc");
const path = require("path");

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
        url: "http://46.247.41.196/api/v1",
        description: "Production Server",
      },
      {
        url: "http://localhost:3000/api/v1",
        description: "Development Server",
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
  apis: [path.join(process.cwd(), "src", "routes", "*.js")],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
