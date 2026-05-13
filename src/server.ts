import express from "express";
import cors from "cors";
import * as dotenv from "dotenv";
import { auth } from "./auth.js";
import { toNodeHandler } from "better-auth/node";
import measurementRoutes from "./routes/measurements.js";
import temperatureRoutes from "./routes/temperature.js";
import userRoutes from "./routes/user.js";
import communityRoutes from "./routes/community.js"
import secchiSortRoutes from "./routes/secchiSort.js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Load env from the API project root regardless of where the process is started from.
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express();

// CORS: Allow ngrok/tunnel URLs in development
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
if (process.env.NODE_ENV === 'development') {
  allowedOrigins.push('http://localhost:8081', 'exp://localhost:8081');
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    
    // Allow ngrok URLs (*.ngrok-free.app, *.ngrok.io)
    if (origin.match(/https:\/\/.*\.ngrok(-free)?\.app/) || origin.match(/https:\/\/.*\.ngrok\.io/)) {
      return callback(null, true);
    }
    
    // Allow configured origins
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Cookie', 'Authorization'],
}));

// Better Auth routes
const authHandler = toNodeHandler(auth);
// Express 5 uses path-to-regexp v6; avoid wildcard patterns like "/api/auth/*".
// Use a regex to match the auth prefix and all subpaths.
app.all(/^\/api\/auth(?:\/.*)?$/, authHandler);

const bodyLimit = process.env.BODY_LIMIT || "30mb";
app.use(express.json({ limit: bodyLimit }));
app.use(express.urlencoded({ extended: true, limit: bodyLimit }));


// API routes
app.use("/api", measurementRoutes);
app.use("/api", temperatureRoutes);
app.use("/api", userRoutes);
app.use("/api", communityRoutes);
app.use("/api", secchiSortRoutes);
app.use("/static", express.static(path.join(__dirname, "../public")));


// Health check
app.get("/health", (req, res) => {
  res.send("OK");
});

const port = process.env.PORT || 3001;
const server = app.listen(port, () => {
  console.log(`Better Auth server running on port ${port}`);
});

const shutdown = (signal: string) => {
  console.log(`Received ${signal}, shutting down`);
  server.close(() => {
    process.exit(0);
  });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
