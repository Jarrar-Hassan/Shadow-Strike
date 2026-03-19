import app from "./app.js";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function seedAdmin() {
  const adminEmail = "jarrarhassan05@gmail.com";
  const adminPassword = "T3lthod@72";
  const existing = await db.select().from(usersTable).where(eq(usersTable.email, adminEmail)).limit(1);
  if (existing.length === 0) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await db.insert(usersTable).values({ email: adminEmail, passwordHash, role: "admin" });
    console.log("Admin account seeded");
  }
}

seedAdmin().catch(console.error);

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
