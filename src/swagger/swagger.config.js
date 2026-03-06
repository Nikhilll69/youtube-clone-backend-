import swaggerJsdoc from "swagger-jsdoc";
import { authPaths } from "./paths/auth.swagger.js";
import { userPaths } from "./paths/user.swagger.js";
import { authSchemas } from "./schemas/auth.schema.js";
import { userSchemas } from "./schemas/user.schema.js";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "YouTube Clone Backend API",
      version: "1.0.0",
      description: "API documentation for YouTube Clone Backend",
    },
    servers: [
      {
        url: "http://localhost:8000",
      },
    ],
    components: {
      schemas: {
        ...userSchemas,
        ...authSchemas,
      },
    },
    paths: {
      ...authPaths,
      ...userPaths,
    },
  },
  apis: [], // We are defining paths and schemas directly now
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
