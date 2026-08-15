import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertReport, InsertScan, InsertUser, reportEmailOptIns, reports, scans, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function createScan(scan: InsertScan) {
  const db = await getDb();
  if (!db) return undefined;
  await db.insert(scans).values(scan);
  const result = await db.select().from(scans).where(eq(scans.publicId, scan.publicId)).limit(1);
  return result[0];
}

export async function markScanFailed(publicId: string, errorMessage: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(scans).set({ status: "failed", errorMessage }).where(eq(scans.publicId, publicId));
}

export async function completeScanAndCreateReport(scanPublicId: string, report: InsertReport) {
  const db = await getDb();
  if (!db) return undefined;
  const scan = (await db.select().from(scans).where(eq(scans.publicId, scanPublicId)).limit(1))[0];
  if (!scan) return undefined;
  await db.update(scans).set({ status: "complete" }).where(eq(scans.id, scan.id));
  await db.insert(reports).values({ ...report, scanId: scan.id });
  const saved = await db.select().from(reports).where(eq(reports.publicId, report.publicId)).limit(1);
  return saved[0];
}

export async function getPublicReport(publicId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const report = (await db.select().from(reports).where(eq(reports.publicId, publicId)).limit(1))[0];
  if (!report) return undefined;
  const scan = (await db.select().from(scans).where(eq(scans.id, report.scanId)).limit(1))[0];
  return { report, scan };
}

export async function addReportEmailOptIn(reportId: number, email: string) {
  const db = await getDb();
  if (!db) return undefined;
  await db.insert(reportEmailOptIns).values({ reportId, email: email.trim().toLowerCase(), status: "active" });
  return { success: true } as const;
}
