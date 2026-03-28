import express from "express";
import cors from "cors";
import * as dotenv from "dotenv";
import { auth } from "./auth.js";
import { toNodeHandler } from "better-auth/node";
import measurementRoutes from "./routes/measurements.js";
import temperatureRoutes from "./routes/temperature.js";
import userRoutes from "./routes/user.js";
import communityRoutes from "./routes/community.js";
import simulationRoutes from "./routes/simulation.js";
import path from "path";
import { fileURLToPath } from "url";
import rateLimit from "express-rate-limit";
import helmet from 'helmet';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

app.set('trust proxy', 1);

app.use(helmet());

app.use(cors({
    origin: process.env.TRUSTED_ORIGINS?.split(','),
    credentials: true,
    allowedHeaders: ['Content-Type', 'Cookie']
}));

// Rate Limiting on all routes except /api/auth
const globalLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 200,
  standardHeaders: true, 
  legacyHeaders: false, 
  skip: (req, res) => {
    return req.originalUrl.startsWith('/api/auth');
  },
  message: { error: 'Too many requests from this IP, please try again after 15 minutes' }
});

app.use(globalLimiter);

// Better Auth routes
app.all("/api/auth/{*any}", toNodeHandler(auth));
app.use(express.json());

app.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'DELETE' && !req.is('application/json')) {
        return res.status(415).json({ error: 'Unsupported Media Type' });
    }
    next();
});

// API routes
app.use("/api", measurementRoutes);
app.use("/api", temperatureRoutes);
app.use("/api", userRoutes);
app.use("/api", communityRoutes);
app.use("/api", simulationRoutes);
app.use("/static", express.static(path.join(__dirname, "../public")));


// Health check
app.get("/health", (req, res) => {
  res.send("OK");
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Better Auth server running on port ${port}`);
});