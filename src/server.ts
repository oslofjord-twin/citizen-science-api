import express from "express";
import cors from "cors";
import * as dotenv from "dotenv";
import { auth } from "./auth.js";
import { toNodeHandler } from "better-auth/node";
import measurementRoutes from "./routes/measurements.js";
import temperatureRoutes from "./routes/temperature.js";
import userRoutes from "./routes/user.js";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(cors({
  credentials: true,
  allowedHeaders: ['Content-Type', 'Cookie']
}));

app.use((req, _res, next) => {
  if (req.path.startsWith("/api/auth")) {
    console.log("REQ:", req.method, req.path);
  }
  next();
});

// Better Auth routes
// handles both /api/auth and /api/auth/anything
app.all(["/api/auth", "/api/auth/{*any}"], toNodeHandler(auth));
app.use(express.json());


// API routes
app.use("/api", measurementRoutes);
app.use("/api", temperatureRoutes);
app.use("/api", userRoutes);
app.use("/static", express.static(path.join(__dirname, "../public")));


// Health check
app.get("/health", (req, res) => {
  res.send("OK");
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Better Auth server running on port ${port}`);
});