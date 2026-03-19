import { Router } from "express";
import { db, reportsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { authMiddleware, JwtPayload } from "../lib/auth.js";

const router = Router();

router.get("/reports", authMiddleware, async (req, res) => {
  const user = (req as any).user as JwtPayload;
  const reports = await db.select().from(reportsTable).where(eq(reportsTable.userId, user.userId));
  res.json({ reports });
});

router.post("/reports", authMiddleware, async (req, res) => {
  const user = (req as any).user as JwtPayload;
  const { title, logs, result } = req.body;
  if (!title || !logs || !result) {
    res.status(400).json({ error: "title, logs, and result are required" });
    return;
  }
  const [report] = await db.insert(reportsTable).values({ userId: user.userId, title, logs, result }).returning();
  res.json(report);
});

router.delete("/reports/:id", authMiddleware, async (req, res) => {
  const user = (req as any).user as JwtPayload;
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid report ID" });
    return;
  }
  await db.delete(reportsTable).where(and(eq(reportsTable.id, id), eq(reportsTable.userId, user.userId)));
  res.json({ success: true });
});

export default router;
