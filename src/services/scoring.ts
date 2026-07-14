import type {
  AppealAttendance,
  AppealCounts,
  Employee,
  EmployeeRecap,
  MySimkariAudit,
  Recommendation,
  ScoringSettings,
  WorkAttendance,
  WorkCounts,
} from "../types";

const clamp = (value: number): number => Math.max(0, Math.min(100, value));

export function countWorkAttendance(records: WorkAttendance[]): WorkCounts {
  const counts: WorkCounts = {
    total: records.length,
    hadir: 0,
    terlambat: 0,
    alpa: 0,
    izin: 0,
    sakit: 0,
    cuti: 0,
    dinasLuar: 0,
    pulangCepat: 0,
    tidakAbsen: 0,
  };

  records.forEach((record) => {
    switch (record.status) {
      case "Hadir":
        counts.hadir += 1;
        break;
      case "Terlambat":
        counts.terlambat += 1;
        break;
      case "Alpa":
        counts.alpa += 1;
        break;
      case "Izin":
        counts.izin += 1;
        break;
      case "Sakit":
        counts.sakit += 1;
        break;
      case "Cuti":
        counts.cuti += 1;
        break;
      case "Dinas Luar":
        counts.dinasLuar += 1;
        break;
      case "Pulang Cepat":
        counts.pulangCepat += 1;
        break;
      case "Tidak Absen":
        counts.tidakAbsen += 1;
        break;
    }
  });

  return counts;
}

export function countAppealAttendance(
  records: AppealAttendance[],
): AppealCounts {
  const counts: AppealCounts = {
    total: records.length,
    hadir: 0,
    terlambat: 0,
    tidakHadir: 0,
  };

  records.forEach((record) => {
    switch (record.status) {
      case "Hadir":
        counts.hadir += 1;
        break;
      case "Terlambat":
        counts.terlambat += 1;
        break;
      case "Tidak Hadir":
        counts.tidakHadir += 1;
        break;
    }
  });

  return counts;
}

export function calculateWorkScore(
  counts: WorkCounts,
  settings: ScoringSettings,
): number | null {
  if (counts.total === 0) return null;

  return clamp(
    100 -
      counts.alpa * settings.alpaPenalty -
      counts.terlambat * settings.latePenalty -
      counts.pulangCepat * settings.earlyLeavePenalty -
      counts.tidakAbsen * settings.missingCheckPenalty,
  );
}

export function calculateAppealScore(
  counts: AppealCounts,
  settings: ScoringSettings,
): number | null {
  if (counts.total === 0) return null;

  return clamp(
    100 -
      counts.tidakHadir * settings.appealAbsentPenalty -
      counts.terlambat * settings.appealLatePenalty,
  );
}

export function getRecommendation(
  finalScore: number | null,
  settings: ScoringSettings,
): Recommendation {
  if (finalScore === null) {
    return {
      level: "incomplete",
      label: "Data Belum Lengkap",
      description:
        "Lengkapi data kehadiran kerja, kehadiran apel, dan audit mySIMKARI sebelum rekomendasi diterbitkan.",
    };
  }

  if (finalScore >= settings.rewardThreshold) {
    return {
      level: "reward",
      label: "Kandidat Reward",
      description:
        "Direkomendasikan sebagai kandidat penghargaan setelah verifikasi administratif oleh pejabat berwenang.",
    };
  }

  if (finalScore >= settings.goodThreshold) {
    return {
      level: "good",
      label: "Kinerja Baik",
      description:
        "Kinerja berada dalam kategori baik dan perlu dipertahankan.",
    };
  }

  if (finalScore >= settings.coachingThreshold) {
    return {
      level: "coaching",
      label: "Pembinaan & Monitoring",
      description:
        "Direkomendasikan pembinaan dan pemantauan perbaikan pada periode berikutnya.",
    };
  }

  if (finalScore >= settings.warningThreshold) {
    return {
      level: "warning",
      label: "Rekomendasi Teguran",
      description:
        "Direkomendasikan evaluasi dan teguran/pembinaan khusus sesuai hasil verifikasi.",
    };
  }

  return {
    level: "discipline",
    label: "Evaluasi Disiplin",
    description:
      "Direkomendasikan evaluasi tindakan disiplin sesuai ketentuan dan kewenangan yang berlaku.",
  };
}

export function buildEmployeeRecap(
  employee: Employee,
  month: string,
  workRecords: WorkAttendance[],
  appealRecords: AppealAttendance[],
  audit: MySimkariAudit | null,
  settings: ScoringSettings,
): EmployeeRecap {
  const workCounts = countWorkAttendance(workRecords);
  const appealCounts = countAppealAttendance(appealRecords);
  const workScore = calculateWorkScore(workCounts, settings);
  const appealScore = calculateAppealScore(appealCounts, settings);

  const complete =
    workScore !== null && appealScore !== null && audit !== null;

  const finalScore = complete
    ? Math.round(
        ((workScore as number) * settings.workWeight +
          (appealScore as number) * settings.appealWeight +
          (audit as MySimkariAudit).score * settings.mySimkariWeight) /
          100 *
          100,
      ) / 100
    : null;

  return {
    employee,
    month,
    workCounts,
    appealCounts,
    workScore,
    appealScore,
    mySimkari: audit,
    finalScore,
    recommendation: getRecommendation(finalScore, settings),
    complete,
  };
}

export function buildAllRecaps(
  employees: Employee[],
  month: string,
  workRecords: WorkAttendance[],
  appealRecords: AppealAttendance[],
  audits: MySimkariAudit[],
  settings: ScoringSettings,
): EmployeeRecap[] {
  return employees
    .filter((employee) => employee.status === "Aktif")
    .map((employee) =>
      buildEmployeeRecap(
        employee,
        month,
        workRecords.filter(
          (record) => record.nip === employee.nip && record.month === month,
        ),
        appealRecords.filter(
          (record) => record.nip === employee.nip && record.month === month,
        ),
        audits.find(
          (audit) => audit.nip === employee.nip && audit.month === month,
        ) ?? null,
        settings,
      ),
    )
    .sort((a, b) => {
      if (a.finalScore === null && b.finalScore === null) {
        return a.employee.nama.localeCompare(b.employee.nama);
      }
      if (a.finalScore === null) return 1;
      if (b.finalScore === null) return -1;
      return b.finalScore - a.finalScore;
    });
}
