import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import { errorHandler } from "./utils/error-handler.js";
import { authMiddleware } from "./utils/auth.js";
import { router as athletes } from "./routes/athletes.js";
import { router as entries } from "./routes/entries.js";
import { router as teams } from "./routes/teams.js";
import { router as review } from "./routes/review.js";
import { router as events } from "./routes/events.js";
import { router as reports } from "./routes/reports.js";
import { router as clubs } from "./routes/clubs.js";

export const prisma = new PrismaClient();
const app = express();

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(authMiddleware); // populates req.user with { id, role, clubId }

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/athletes", athletes);
app.use("/api/entries", entries);
app.use("/api/teams", teams);
app.use("/api/review", review);
app.use("/api/events", events);
app.use("/api/reports", reports);
app.use("/api/clubs", clubs);

app.use(errorHandler);

const PORT = process.env.PORT ?? 4000;
app.listen(PORT, () => console.log(`🚀 API on http://localhost:${PORT}`));
