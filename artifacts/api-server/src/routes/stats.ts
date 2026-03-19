import { Router } from "express";
import { db, reportsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authMiddleware, JwtPayload } from "../lib/auth.js";

const router = Router();

router.get("/stats", authMiddleware, async (req, res) => {
  const user = (req as any).user as JwtPayload;
  const reports = await db.select().from(reportsTable).where(eq(reportsTable.userId, user.userId));
  
  const total = reports.length;
  const criticalCount = reports.filter(r => (r.result as any).threatLevel === "critical").length;
  const highCount = reports.filter(r => (r.result as any).threatLevel === "high").length;
  const mediumCount = reports.filter(r => (r.result as any).threatLevel === "medium").length;
  const lowCount = reports.filter(r => (r.result as any).threatLevel === "low").length;
  
  const avgRiskScore = total > 0
    ? Math.round(reports.reduce((sum, r) => sum + ((r.result as any).riskScore ?? 0), 0) / total)
    : 0;

  const attackTypeCounts: Record<string, number> = {};
  for (const r of reports) {
    const type = (r.result as any).attackType ?? "Unknown";
    attackTypeCounts[type] = (attackTypeCounts[type] ?? 0) + 1;
  }
  const topAttackTypes = Object.entries(attackTypeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([type, count]) => ({ type, count }));

  const recentActivity = reports
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)
    .map(r => ({
      time: new Date(r.createdAt).toISOString().replace('T', ' ').substring(0, 19),
      event: `Report "${r.title}" — ${(r.result as any).attackType}`,
      severity: (r.result as any).threatLevel as any,
    }));

  res.json({ totalReports: total, avgRiskScore, criticalCount, highCount, mediumCount, lowCount, topAttackTypes, recentActivity });
});

export default router;
