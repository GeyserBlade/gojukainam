import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { prisma } from "./lib/prisma.js";
import { errorHandler } from "./utils/error-handler.js";
import { authMiddleware } from "./utils/auth.js";
import { router as auth } from "./routes/auth.js";
import { router as athletes } from "./routes/athletes.js";
import { router as entries } from "./routes/entries.js";
import { router as teams } from "./routes/teams.js";
import { router as review } from "./routes/review.js";
import { router as events } from "./routes/events.js";
import { router as reports } from "./routes/reports.js";
import { router as clubs } from "./routes/clubs.js";
import { router as users } from "./routes/users.js";
import { router as belts } from "./routes/belts.js";

const app = express();

// Allow multiple origins for development (Vite dev server and serve)
// In production (Railway), FRONTEND_URL will be set to the single production domain
// In development, allow both dev server (5173) and production build (3000)
const IS_PRODUCTION = process.env.NODE_ENV === "production";
const ALLOWED_ORIGINS = IS_PRODUCTION && process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL]
  : ["http://localhost:5173", "http://localhost:3000"];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);

    if (ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Auth routes before middleware because login shouldn't require auth
app.use("/api/auth", auth);

app.use(authMiddleware); // populates req.user with { id, role, clubId }

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/athletes", athletes);
app.use("/api/entries", entries);
app.use("/api/teams", teams);
app.use("/api/review", review);
app.use("/api/events", events);
app.use("/api/reports", reports);
app.use("/api/clubs", clubs);
app.use("/api/users", users);
app.use("/api/belts", belts);

app.use(errorHandler);

const PORT = process.env.PORT ?? 4000;
app.listen(PORT, () => console.log(`API on http://localhost:${PORT}`));

