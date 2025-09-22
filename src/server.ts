import express from "express";
import cors from "cors";
import * as dotenv from "dotenv";
import { auth } from "./auth.js";
import { toNodeHandler } from "better-auth/node";
import measurementRoutes from "./routes/measurements.js";

dotenv.config();

const app = express();
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Better-Auth-Token']
}));

// Better Auth routes
app.all("/api/auth/{*any}", toNodeHandler(auth));
app.use(express.json());

// API routes
app.use("/api", measurementRoutes);
// Remove dataTypeRoutes since we're not using it anymore

// Health check
app.get("/health", (req, res) => {
  res.send("OK");
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Better Auth server running on port ${port}`);
});