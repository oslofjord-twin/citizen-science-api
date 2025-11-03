import express from "express";
import cors from "cors";
import * as dotenv from "dotenv";
import { auth } from "./auth.js";
import { toNodeHandler } from "better-auth/node";
import measurementRoutes from "./routes/measurements.js";
import temperatureRoutes from "./routes/temperature.js";
import userRoutes from "./routes/user.js";
import communityRoutes from "./routes/community.js"
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(cors({
  credentials: true,
  allowedHeaders: ['Content-Type', 'Cookie']
}));

// Better Auth routes
app.all("/api/auth/{*any}", toNodeHandler(auth));
app.use(express.json());


// API routes
app.use("/api", measurementRoutes);
app.use("/api", temperatureRoutes);
app.use("/api", userRoutes);
app.use("/api", communityRoutes);
app.use("/static", express.static(path.join(__dirname, "../public")));


// Health check
app.get("/health", (req, res) => {
  res.send("OK");
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Better Auth server running on port ${port}`);
});