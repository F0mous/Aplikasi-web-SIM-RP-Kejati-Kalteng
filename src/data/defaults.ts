import type {
  AppealAttendance,
  Employee,
  MySimkariAudit,
  ScoringSettings,
  WorkAttendance,
} from "../types";

export const UNITS = [
  "Pembinaan",
  "Intelijen",
  "Tindak Pidana Umum",
  "Tindak Pidana Khusus",
  "Perdata dan Tata Usaha Negara",
  "Pengawasan",
  "Tata Usaha",
];

export const DEFAULT_SCORING_SETTINGS: ScoringSettings = {
  workWeight: 40,
  appealWeight: 25,
  mySimkariWeight: 35,
  alpaPenalty: 10,
  latePenalty: 2,
  earlyLeavePenalty: 2,
  missingCheckPenalty: 2,
  appealAbsentPenalty: 5,
  appealLatePenalty: 2,
  rewardThreshold: 90,
  goodThreshold: 80,
  coachingThreshold: 70,
  warningThreshold: 60,
};

export const DEMO_EMPLOYEES: Employee[] = [
  {
    nip: "198703122010122001",
    nama: "Rina Sari, S.H.",
    jabatan: "Jaksa Fungsional",
    unit: "Tindak Pidana Umum",
    status: "Aktif",
  },
  {
    nip: "198504062009121003",
    nama: "Arman Wijaya, S.H., M.H.",
    jabatan: "Kasi Intelijen",
    unit: "Intelijen",
    status: "Aktif",
  },
  {
    nip: "199002182014042002",
    nama: "Dewi Lestari, S.E.",
    jabatan: "Analis Kepegawaian",
    unit: "Pembinaan",
    status: "Aktif",
  },
  {
    nip: "199406082018031001",
    nama: "M. Fajar Nugraha, S.Kom.",
    jabatan: "Pranata Komputer",
    unit: "Tata Usaha",
    status: "Aktif",
  },
  {
    nip: "199112202015032004",
    nama: "Nadia Permata, S.H.",
    jabatan: "Jaksa Fungsional",
    unit: "Tindak Pidana Khusus",
    status: "Aktif",
  },
];

const month = new Date().toISOString().slice(0, 7);
const days = ["01", "02", "03", "04", "05", "08", "09", "10", "11", "12"];

export const DEMO_WORK_ATTENDANCE: WorkAttendance[] = DEMO_EMPLOYEES.flatMap(
  (employee, employeeIndex) =>
    days.map((day, dayIndex) => {
      let status: WorkAttendance["status"] = "Hadir";
      if (employeeIndex === 2 && [2, 7].includes(dayIndex)) status = "Alpa";
      if (employeeIndex === 2 && dayIndex === 4) status = "Terlambat";
      if (employeeIndex === 4 && [3, 8].includes(dayIndex)) status = "Terlambat";
      if (employeeIndex === 1 && dayIndex === 5) status = "Izin";
      return {
        nip: employee.nip,
        date: `${month}-${day}`,
        month,
        status,
        jamMasuk: status === "Terlambat" ? "08:05" : status === "Alpa" ? "" : "07:20",
        jamPulang: status === "Alpa" ? "" : "16:05",
        keterangan: "",
      };
    }),
);

export const DEMO_APPEAL_ATTENDANCE: AppealAttendance[] = DEMO_EMPLOYEES.flatMap(
  (employee, employeeIndex) =>
    ["01", "08", "15", "22"].map((day, dayIndex) => {
      let status: AppealAttendance["status"] = "Hadir";
      if (employeeIndex === 2 && [1, 2, 3].includes(dayIndex)) status = "Tidak Hadir";
      if (employeeIndex === 4 && dayIndex === 2) status = "Terlambat";
      return {
        nip: employee.nip,
        date: `${month}-${day}`,
        month,
        status,
        keterangan: "",
      };
    }),
);

export const DEMO_MYSIMKARI: MySimkariAudit[] = DEMO_EMPLOYEES.map(
  (employee, index) => {
    const scores = [94, 88, 82, 97, 76];
    return {
      id: `${employee.nip}_${month}`,
      nip: employee.nip,
      month,
      auditDate: `${month}-12`,
      score: scores[index],
      completeness: Math.min(100, scores[index] + 3),
      findings: index === 3 ? 0 : index + 1,
      notes:
        index === 3
          ? "Data lengkap dan diperbarui tepat waktu."
          : "Perlu menindaklanjuti beberapa elemen data yang belum lengkap.",
      updatedAt: new Date().toISOString(),
    };
  },
);
