export type EmployeeStatus = "Aktif" | "Nonaktif";

export interface Employee {
  nip: string;
  nama: string;
  jabatan: string;
  unit: string;
  status: EmployeeStatus;
}

export type WorkAttendanceStatus =
  | "Hadir"
  | "Terlambat"
  | "Alpa"
  | "Izin"
  | "Sakit"
  | "Cuti"
  | "Dinas Luar"
  | "Pulang Cepat"
  | "Tidak Absen";

export interface WorkAttendance {
  id?: number;
  nip: string;
  date: string;
  month: string;
  status: WorkAttendanceStatus;
  jamMasuk?: string;
  jamPulang?: string;
  keterangan?: string;
}

export type AppealAttendanceStatus = "Hadir" | "Terlambat" | "Tidak Hadir";

export interface AppealAttendance {
  id?: number;
  nip: string;
  date: string;
  month: string;
  status: AppealAttendanceStatus;
  keterangan?: string;
}

export interface MySimkariAudit {
  id: string;
  nip: string;
  month: string;
  auditDate: string;
  score: number;
  completeness: number;
  findings: number;
  notes: string;
  updatedAt: string;
}

export interface ScoringSettings {
  workWeight: number;
  appealWeight: number;
  mySimkariWeight: number;
  alpaPenalty: number;
  latePenalty: number;
  earlyLeavePenalty: number;
  missingCheckPenalty: number;
  appealAbsentPenalty: number;
  appealLatePenalty: number;
  rewardThreshold: number;
  goodThreshold: number;
  coachingThreshold: number;
  warningThreshold: number;
}

export interface AdminAccount {
  username: string;
  displayName: string;
  salt: string;
  passwordHash: string;
}

export interface AuditLog {
  id?: number;
  timestamp: string;
  action: string;
  entity: string;
  detail: string;
}

export interface WorkCounts {
  total: number;
  hadir: number;
  terlambat: number;
  alpa: number;
  izin: number;
  sakit: number;
  cuti: number;
  dinasLuar: number;
  pulangCepat: number;
  tidakAbsen: number;
}

export interface AppealCounts {
  total: number;
  hadir: number;
  terlambat: number;
  tidakHadir: number;
}

export type RecommendationLevel =
  | "reward"
  | "good"
  | "coaching"
  | "warning"
  | "discipline"
  | "incomplete";

export interface Recommendation {
  level: RecommendationLevel;
  label: string;
  description: string;
}

export interface EmployeeRecap {
  employee: Employee;
  month: string;
  workCounts: WorkCounts;
  appealCounts: AppealCounts;
  workScore: number | null;
  appealScore: number | null;
  mySimkari: MySimkariAudit | null;
  finalScore: number | null;
  recommendation: Recommendation;
  complete: boolean;
}

export interface ImportResult {
  inserted: number;
  updated: number;
  skipped: number;
  errors: string[];
}
