import Dexie, { type EntityTable } from "dexie";
import {
  DEFAULT_SCORING_SETTINGS,
  DEMO_APPEAL_ATTENDANCE,
  DEMO_EMPLOYEES,
  DEMO_MYSIMKARI,
  DEMO_WORK_ATTENDANCE,
} from "../data/defaults";
import type {
  AdminAccount,
  AppealAttendance,
  AuditLog,
  Employee,
  MySimkariAudit,
  ScoringSettings,
  WorkAttendance,
} from "../types";
import { createPasswordRecord } from "../services/auth";

interface SettingRecord {
  key: string;
  value: unknown;
}

class KejatiDatabase extends Dexie {
  employees!: EntityTable<Employee, "nip">;
  workAttendance!: EntityTable<WorkAttendance, "id">;
  appealAttendance!: EntityTable<AppealAttendance, "id">;
  mySimkari!: EntityTable<MySimkariAudit, "id">;
  settings!: EntityTable<SettingRecord, "key">;
  admins!: EntityTable<AdminAccount, "username">;
  auditLogs!: EntityTable<AuditLog, "id">;

  constructor() {
    super("KejatiKaltengRewardPunishment");

    this.version(1).stores({
      employees: "&nip,nama,unit,status",
      workAttendance: "++id,[nip+date],nip,date,month,status",
      appealAttendance: "++id,[nip+date],nip,date,month,status",
      mySimkari: "&id,nip,month,auditDate",
      settings: "&key",
      admins: "&username",
      auditLogs: "++id,timestamp,action,entity",
    });
  }
}

export const db = new KejatiDatabase();

export async function addAuditLog(
  action: string,
  entity: string,
  detail: string,
): Promise<void> {
  await db.auditLogs.add({
    timestamp: new Date().toISOString(),
    action,
    entity,
    detail,
  });
}

export async function initializeDatabase(): Promise<void> {
  const adminCount = await db.admins.count();
  if (adminCount === 0) {
    const record = await createPasswordRecord("admin123");
    await db.admins.add({
      username: "admin",
      displayName: "Administrator Kejati Kalteng",
      ...record,
    });
  }

  const settings = await db.settings.get("scoring");
  if (!settings) {
    await db.settings.put({
      key: "scoring",
      value: DEFAULT_SCORING_SETTINGS,
    });
  }

  const seeded = await db.settings.get("demoSeeded");
  if (!seeded) {
    await db.transaction(
      "rw",
      [
        db.employees,
        db.workAttendance,
        db.appealAttendance,
        db.mySimkari,
        db.settings,
        db.auditLogs,
      ],
      async () => {
        await db.employees.bulkPut(DEMO_EMPLOYEES);
        await db.workAttendance.bulkAdd(DEMO_WORK_ATTENDANCE);
        await db.appealAttendance.bulkAdd(DEMO_APPEAL_ATTENDANCE);
        await db.mySimkari.bulkPut(DEMO_MYSIMKARI);
        await db.settings.put({ key: "demoSeeded", value: true });
        await db.auditLogs.add({
          timestamp: new Date().toISOString(),
          action: "INIT",
          entity: "Database",
          detail: "Database awal dan data contoh berhasil dibuat.",
        });
      },
    );
  }
}

export async function getScoringSettings(): Promise<ScoringSettings> {
  const record = await db.settings.get("scoring");
  return (record?.value as ScoringSettings) ?? DEFAULT_SCORING_SETTINGS;
}

export async function saveScoringSettings(
  settings: ScoringSettings,
): Promise<void> {
  await db.settings.put({ key: "scoring", value: settings });
  await addAuditLog(
    "UPDATE_SETTINGS",
    "Scoring",
    "Bobot, penalti, dan ambang rekomendasi diperbarui.",
  );
}

export async function clearOperationalData(): Promise<void> {
  await db.transaction(
    "rw",
    [
      db.employees,
      db.workAttendance,
      db.appealAttendance,
      db.mySimkari,
      db.auditLogs,
      db.settings,
    ],
    async () => {
      await db.employees.clear();
      await db.workAttendance.clear();
      await db.appealAttendance.clear();
      await db.mySimkari.clear();
      await db.auditLogs.clear();
      await db.settings.put({ key: "demoSeeded", value: true });
      await db.auditLogs.add({
        timestamp: new Date().toISOString(),
        action: "CLEAR_DATA",
        entity: "Database",
        detail: "Seluruh data operasional dihapus oleh administrator.",
      });
    },
  );
}

export async function resetDemoData(): Promise<void> {
  await db.transaction(
    "rw",
    [
      db.employees,
      db.workAttendance,
      db.appealAttendance,
      db.mySimkari,
      db.auditLogs,
      db.settings,
    ],
    async () => {
      await db.employees.clear();
      await db.workAttendance.clear();
      await db.appealAttendance.clear();
      await db.mySimkari.clear();
      await db.auditLogs.clear();
      await db.employees.bulkPut(DEMO_EMPLOYEES);
      await db.workAttendance.bulkAdd(DEMO_WORK_ATTENDANCE);
      await db.appealAttendance.bulkAdd(DEMO_APPEAL_ATTENDANCE);
      await db.mySimkari.bulkPut(DEMO_MYSIMKARI);
      await db.settings.put({ key: "scoring", value: DEFAULT_SCORING_SETTINGS });
      await db.settings.put({ key: "demoSeeded", value: true });
      await db.auditLogs.add({
        timestamp: new Date().toISOString(),
        action: "RESET_DEMO",
        entity: "Database",
        detail: "Data contoh dan pengaturan awal dipulihkan.",
      });
    },
  );
}
