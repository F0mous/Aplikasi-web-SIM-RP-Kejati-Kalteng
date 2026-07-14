import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { EmployeeRecap, ScoringSettings } from "../types";

const formatMonth = (month: string): string => {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, monthNumber - 1, 1));
};

const formatScore = (value: number | null): string =>
  value === null ? "-" : value.toFixed(2);

function addHeader(doc: jsPDF, title: string, subtitle: string): void {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(title, 14, 16);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("KEJAKSAAN TINGGI KALIMANTAN TENGAH", 14, 23);
  doc.text(subtitle, 14, 29);
  doc.setDrawColor(15, 81, 50);
  doc.setLineWidth(0.8);
  doc.line(14, 33, doc.internal.pageSize.getWidth() - 14, 33);
}

export function exportMonthlyRecapPdf(
  recaps: EmployeeRecap[],
  month: string,
): void {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm" });
  addHeader(
    doc,
    "REKAP EVALUASI REWARD & PUNISHMENT PEGAWAI",
    `Periode ${formatMonth(month)} • Dicetak ${new Date().toLocaleString("id-ID")}`,
  );

  autoTable(doc, {
    startY: 39,
    head: [
      [
        "No",
        "Nama / NIP",
        "Unit",
        "Alpa",
        "Terlambat",
        "Absen Apel",
        "Nilai Hadir",
        "Nilai Apel",
        "mySIMKARI",
        "Nilai Akhir",
        "Rekomendasi",
      ],
    ],
    body: recaps.map((recap, index) => [
      index + 1,
      `${recap.employee.nama}\n${recap.employee.nip}`,
      recap.employee.unit,
      recap.workCounts.alpa,
      recap.workCounts.terlambat,
      recap.appealCounts.tidakHadir,
      formatScore(recap.workScore),
      formatScore(recap.appealScore),
      recap.mySimkari ? recap.mySimkari.score.toFixed(2) : "-",
      formatScore(recap.finalScore),
      recap.recommendation.label,
    ]),
    styles: { fontSize: 7.5, cellPadding: 2, valign: "middle" },
    headStyles: { fillColor: [15, 81, 50], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [245, 248, 246] },
    margin: { left: 14, right: 14 },
  });

  doc.save(`rekap_reward_punishment_${month}.pdf`);
}

export function exportEmployeeRecapPdf(
  recap: EmployeeRecap,
  settings: ScoringSettings,
): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm" });
  addHeader(
    doc,
    "REKAP EVALUASI PEGAWAI",
    `Periode ${formatMonth(recap.month)} • Dicetak ${new Date().toLocaleString("id-ID")}`,
  );

  autoTable(doc, {
    startY: 39,
    theme: "grid",
    body: [
      ["Nama", recap.employee.nama],
      ["NIP", recap.employee.nip],
      ["Jabatan", recap.employee.jabatan],
      ["Unit Kerja", recap.employee.unit],
    ],
    styles: { fontSize: 9, cellPadding: 2.5 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 38 } },
  });

  const firstTableEnd =
    (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable
      ?.finalY ?? 70;

  autoTable(doc, {
    startY: firstTableEnd + 6,
    head: [["Komponen Kehadiran Kerja", "Jumlah"]],
    body: [
      ["Hadir", recap.workCounts.hadir],
      ["Terlambat", recap.workCounts.terlambat],
      ["Alpa", recap.workCounts.alpa],
      ["Izin", recap.workCounts.izin],
      ["Sakit", recap.workCounts.sakit],
      ["Cuti", recap.workCounts.cuti],
      ["Dinas Luar", recap.workCounts.dinasLuar],
      ["Pulang Cepat", recap.workCounts.pulangCepat],
      ["Tidak Absen", recap.workCounts.tidakAbsen],
      ["Nilai Kehadiran", formatScore(recap.workScore)],
    ],
    styles: { fontSize: 8.5, cellPadding: 2 },
    headStyles: { fillColor: [15, 81, 50] },
  });

  const secondTableEnd =
    (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable
      ?.finalY ?? 130;

  autoTable(doc, {
    startY: secondTableEnd + 6,
    head: [["Komponen Kehadiran Apel", "Jumlah"]],
    body: [
      ["Hadir", recap.appealCounts.hadir],
      ["Terlambat", recap.appealCounts.terlambat],
      ["Tidak Hadir", recap.appealCounts.tidakHadir],
      ["Nilai Apel", formatScore(recap.appealScore)],
    ],
    styles: { fontSize: 8.5, cellPadding: 2 },
    headStyles: { fillColor: [15, 81, 50] },
  });

  const thirdTableEnd =
    (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable
      ?.finalY ?? 175;

  autoTable(doc, {
    startY: thirdTableEnd + 6,
    head: [["Audit mySIMKARI", "Hasil"]],
    body: [
      ["Nilai Audit", recap.mySimkari?.score ?? "-"],
      ["Kelengkapan Data", recap.mySimkari ? `${recap.mySimkari.completeness}%` : "-"],
      ["Jumlah Temuan", recap.mySimkari?.findings ?? "-"],
      ["Catatan", recap.mySimkari?.notes || "-"],
    ],
    styles: { fontSize: 8.5, cellPadding: 2 },
    headStyles: { fillColor: [15, 81, 50] },
  });

  const fourthTableEnd =
    (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable
      ?.finalY ?? 220;

  const y = Math.min(fourthTableEnd + 8, 260);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(`NILAI AKHIR: ${formatScore(recap.finalScore)}`, 14, y);
  doc.setFontSize(11);
  doc.text(`REKOMENDASI: ${recap.recommendation.label}`, 14, y + 7);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  const recommendationLines = doc.splitTextToSize(
    recap.recommendation.description,
    180,
  );
  doc.text(recommendationLines, 14, y + 13);

  doc.setFontSize(7.5);
  doc.text(
    `Bobot: Kehadiran ${settings.workWeight}% • Apel ${settings.appealWeight}% • mySIMKARI ${settings.mySimkariWeight}%`,
    14,
    286,
  );

  doc.save(
    `rekap_${recap.employee.nip}_${recap.month}.pdf`,
  );
}
