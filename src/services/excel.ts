import {
  read,
  utils,
  writeFileXLSX,
  type WorkBook,
  type WorkSheet,
} from "xlsx";
import { addAuditLog, db } from "../db/database";
import type {
  AppealAttendance,
  AppealAttendanceStatus,
  Employee,
  EmployeeRecap,
  EmployeeStatus,
  ImportResult,
  WorkAttendance,
  WorkAttendanceStatus,
} from "../types";

type Row = Record<string, unknown>;

const cleanKey = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^\w]/g, "");

const normalizeRow = (row: Row): Row =>
  Object.fromEntries(
    Object.entries(row).map(([key, value]) => [cleanKey(key), value]),
  );

const text = (value: unknown): string =>
  String(value ?? "")
    .trim()
    .replace(/\s+/g, " ");

function normalizeDate(value: unknown): string | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === "number") {
    const parsed = utils.parse_date_code(value);
    if (parsed) {
      return `${parsed.y}-${String(parsed.m).padStart(2, "0")}-${String(parsed.d).padStart(2, "0")}`;
    }
  }

  const raw = text(value);
  if (!raw) return null;

  const iso = raw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (iso) {
    return `${iso[1]}-${iso[2].padStart(2, "0")}-${iso[3].padStart(2, "0")}`;
  }

  const local = raw.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (local) {
    return `${local[3]}-${local[2].padStart(2, "0")}-${local[1].padStart(2, "0")}`;
  }

  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

function normalizeEmployeeStatus(value: unknown): EmployeeStatus {
  return text(value).toLowerCase() === "nonaktif" ? "Nonaktif" : "Aktif";
}

function normalizeWorkStatus(
  value: unknown,
): WorkAttendanceStatus | null {
  const raw = text(value).toLowerCase().replace(/[_-]/g, " ");
  const map: Record<string, WorkAttendanceStatus> = {
    hadir: "Hadir",
    terlambat: "Terlambat",
    telat: "Terlambat",
    alpa: "Alpa",
    alpha: "Alpa",
    izin: "Izin",
    sakit: "Sakit",
    cuti: "Cuti",
    "dinas luar": "Dinas Luar",
    dl: "Dinas Luar",
    "pulang cepat": "Pulang Cepat",
    "tidak absen": "Tidak Absen",
    "tidak presensi": "Tidak Absen",
  };
  return map[raw] ?? null;
}

function normalizeAppealStatus(
  value: unknown,
): AppealAttendanceStatus | null {
  const raw = text(value).toLowerCase().replace(/[_-]/g, " ");
  const map: Record<string, AppealAttendanceStatus> = {
    hadir: "Hadir",
    terlambat: "Terlambat",
    telat: "Terlambat",
    "tidak hadir": "Tidak Hadir",
    absen: "Tidak Hadir",
    alpa: "Tidak Hadir",
  };
  return map[raw] ?? null;
}

async function readRows(file: File): Promise<Row[]> {
  const buffer = await file.arrayBuffer();
  const workbook = read(buffer, { type: "array", cellDates: true });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  return utils
    .sheet_to_json<Row>(worksheet, { defval: "" })
    .map(normalizeRow);
}

export async function importEmployees(file: File): Promise<ImportResult> {
  const rows = await readRows(file);
  const result: ImportResult = {
    inserted: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  };

  for (const [index, row] of rows.entries()) {
    const nip = text(row.nip);
    const nama = text(row.nama ?? row.name);
    const jabatan = text(row.jabatan ?? row.position);
    const unit = text(row.unit ?? row.bidang);

    if (!nip || !nama || !jabatan || !unit) {
      result.skipped += 1;
      result.errors.push(
        `Baris ${index + 2}: NIP, nama, jabatan, dan unit wajib diisi.`,
      );
      continue;
    }

    const employee: Employee = {
      nip,
      nama,
      jabatan,
      unit,
      status: normalizeEmployeeStatus(row.status),
    };

    const existing = await db.employees.get(nip);
    await db.employees.put(employee);
    if (existing) result.updated += 1;
    else result.inserted += 1;
  }

  await addAuditLog(
    "IMPORT_EXCEL",
    "Pegawai",
    `${file.name}: ${result.inserted} baru, ${result.updated} diperbarui, ${result.skipped} dilewati.`,
  );

  return result;
}

export async function importWorkAttendance(
  file: File,
): Promise<ImportResult> {
  const rows = await readRows(file);
  const result: ImportResult = {
    inserted: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  };

  for (const [index, row] of rows.entries()) {
    const nip = text(row.nip);
    const date = normalizeDate(row.tanggal ?? row.date);
    const status = normalizeWorkStatus(row.status ?? row.keterangan_status);

    if (!nip || !date || !status) {
      result.skipped += 1;
      result.errors.push(
        `Baris ${index + 2}: NIP, tanggal, atau status tidak valid.`,
      );
      continue;
    }

    const employee = await db.employees.get(nip);
    if (!employee) {
      result.skipped += 1;
      result.errors.push(
        `Baris ${index + 2}: NIP ${nip} belum ada pada master pegawai.`,
      );
      continue;
    }

    const existing = await db.workAttendance
      .where("[nip+date]")
      .equals([nip, date])
      .first();

    const record: WorkAttendance = {
      ...(existing?.id ? { id: existing.id } : {}),
      nip,
      date,
      month: date.slice(0, 7),
      status,
      jamMasuk: text(row.jam_masuk ?? row.jammasuk),
      jamPulang: text(row.jam_pulang ?? row.jampulang),
      keterangan: text(row.keterangan ?? row.catatan),
    };

    if (existing?.id) {
      await db.workAttendance.put(record);
      result.updated += 1;
    } else {
      await db.workAttendance.add(record);
      result.inserted += 1;
    }
  }

  await addAuditLog(
    "IMPORT_EXCEL",
    "Kehadiran Kerja",
    `${file.name}: ${result.inserted} baru, ${result.updated} diperbarui, ${result.skipped} dilewati.`,
  );

  return result;
}

export async function importAppealAttendance(
  file: File,
): Promise<ImportResult> {
  const rows = await readRows(file);
  const result: ImportResult = {
    inserted: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  };

  for (const [index, row] of rows.entries()) {
    const nip = text(row.nip);
    const date = normalizeDate(row.tanggal ?? row.date);
    const status = normalizeAppealStatus(
      row.status ?? row.status_apel ?? row.keterangan_status,
    );

    if (!nip || !date || !status) {
      result.skipped += 1;
      result.errors.push(
        `Baris ${index + 2}: NIP, tanggal, atau status apel tidak valid.`,
      );
      continue;
    }

    const employee = await db.employees.get(nip);
    if (!employee) {
      result.skipped += 1;
      result.errors.push(
        `Baris ${index + 2}: NIP ${nip} belum ada pada master pegawai.`,
      );
      continue;
    }

    const existing = await db.appealAttendance
      .where("[nip+date]")
      .equals([nip, date])
      .first();

    const record: AppealAttendance = {
      ...(existing?.id ? { id: existing.id } : {}),
      nip,
      date,
      month: date.slice(0, 7),
      status,
      keterangan: text(row.keterangan ?? row.catatan),
    };

    if (existing?.id) {
      await db.appealAttendance.put(record);
      result.updated += 1;
    } else {
      await db.appealAttendance.add(record);
      result.inserted += 1;
    }
  }

  await addAuditLog(
    "IMPORT_EXCEL",
    "Kehadiran Apel",
    `${file.name}: ${result.inserted} baru, ${result.updated} diperbarui, ${result.skipped} dilewati.`,
  );

  return result;
}

function downloadWorkbook(
  filename: string,
  sheetName: string,
  rows: Row[],
): void {
  const workbook: WorkBook = utils.book_new();
  const worksheet: WorkSheet = utils.json_to_sheet(rows);
  utils.book_append_sheet(workbook, worksheet, sheetName);
  writeFileXLSX(workbook, filename);
}

export function downloadEmployeeTemplate(): void {
  downloadWorkbook("template_data_pegawai.xlsx", "pegawai", [
    {
      nip: "199001012020011001",
      nama: "Nama Pegawai",
      jabatan: "Jaksa Fungsional",
      unit: "Tindak Pidana Umum",
      status: "Aktif",
    },
  ]);
}

export function downloadWorkAttendanceTemplate(): void {
  downloadWorkbook("template_kehadiran_kerja.xlsx", "kehadiran", [
    {
      nip: "199001012020011001",
      tanggal: new Date().toISOString().slice(0, 10),
      status: "Hadir",
      jam_masuk: "07:20",
      jam_pulang: "16:00",
      keterangan: "",
    },
  ]);
}

export function downloadAppealAttendanceTemplate(): void {
  downloadWorkbook("template_kehadiran_apel.xlsx", "apel", [
    {
      nip: "199001012020011001",
      tanggal: new Date().toISOString().slice(0, 10),
      status: "Hadir",
      keterangan: "",
    },
  ]);
}

export function exportRecapsToExcel(
  recaps: EmployeeRecap[],
  month: string,
): void {
  downloadWorkbook(`rekap_penilaian_${month}.xlsx`, "rekap", recaps.map((r) => ({
    periode: month,
    nip: r.employee.nip,
    nama: r.employee.nama,
    jabatan: r.employee.jabatan,
    unit: r.employee.unit,
    hadir: r.workCounts.hadir,
    terlambat: r.workCounts.terlambat,
    alpa: r.workCounts.alpa,
    izin: r.workCounts.izin,
    sakit: r.workCounts.sakit,
    tidak_hadir_apel: r.appealCounts.tidakHadir,
    terlambat_apel: r.appealCounts.terlambat,
    nilai_kehadiran: r.workScore ?? "",
    nilai_apel: r.appealScore ?? "",
    nilai_mysimkari: r.mySimkari?.score ?? "",
    kelengkapan_mysimkari: r.mySimkari?.completeness ?? "",
    nilai_akhir: r.finalScore ?? "",
    rekomendasi: r.recommendation.label,
  })));
}
