import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { authMiddleware, adminMiddleware } from "../lib/auth.js";

const router = Router();

router.get("/admin/users", authMiddleware, adminMiddleware, async (req, res) => {
  const users = await db.select({
    id: usersTable.id,
    email: usersTable.email,
    role: usersTable.role,
    createdAt: usersTable.createdAt,
  }).from(usersTable);
  res.json({ users });
});

export default router;
