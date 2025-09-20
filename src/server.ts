import express from "express";
import * as dotenv from "dotenv";
import { auth } from "./auth.js";
import { toNodeHandler } from "better-auth/node";
import measurementRoutes from "./routes/measurements.js";
import dataTypeRoutes from "./routes/dataTypes.js";

dotenv.config();

const app = express();
app.use(express.json());

// Better Auth routes
app.all("/api/auth/{*any}", toNodeHandler(auth));

// API routes
app.use("/api", measurementRoutes);
app.use("/api", dataTypeRoutes);

// Health check
app.get("/health", (req, res) => {
  res.send("OK");
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Better Auth server running on port ${port}`);
});
