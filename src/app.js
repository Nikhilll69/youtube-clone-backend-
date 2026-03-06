import express, { urlencoded } from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser';
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./swagger/swagger.config.js";


const app = express();
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,


}))

app.use(express.json({ limit: '16kb' }));
app.use(urlencoded({ extended: true, limit: '16kb' }));
app.use(cookieParser());
app.use(express.static('public'));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));


//route imports

import userRouter from './routes/user.routes.js'

app.use('/api/v1/users',userRouter )


//route decleration

// Global error handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    statusCode,
    message: err.message || "Internal Server Error",
    errors: err.errors || [],
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined
  });
});

export default app;