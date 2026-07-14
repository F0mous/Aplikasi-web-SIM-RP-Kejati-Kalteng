import { useRef, useState } from "react";
import {
  CalendarCheck,
  Download,
  FileSpreadsheet,
  UploadCloud,
  Users,
} from "lucide-react";
import {
  downloadAppealAttendanceTemplate,
  downloadEmployeeTemplate,
  downloadWorkAttendanceTemplate,
  importAppealAttendance,
  importEmployees,
  importWorkAttendance,
} from "../services/excel";
import type { ImportResult } from "../types";
import {
  Card,
  CardHeader,
  Notice,
  PageHeader,
} from "../components/ui";

type ImportKind = "employees" | "work" | "appeal";

interface ImportConfig {
  title: string;
  description: string;
  icon: typeof Users;
  acceptLabel: string;
  headers: string;
  downloadTemplate: () => void;
  importer: (file: File) => Promise<ImportResult>;
}

const configs: Record<ImportKind, ImportConfig> = {
  employees: {
    title: "Master Data Pegawai",
    description:
      "Import atau perbarui pegawai berdasarkan NIP sebagai identitas unik.",
    icon: Users,
    acceptLabel: "pegawai",
    headers: "nip, nama, jabatan, unit, status",
    downloadTemplate: downloadEmployeeTemplate,
    importer: importEmployees,
  },
  work: {
    title: "Kehadiran Kerja",
    description:
      "Data harian presensi kerja untuk menghitung alpa, terlambat, pulang cepat, dan tidak absen.",
    icon: CalendarCheck,
    acceptLabel: "kehadiran kerja",
    headers:
      "nip, tanggal, status, jam_masuk, jam_pulang, keterangan",
    downloadTemplate: downloadWorkAttendanceTemplate,
    importer: importWorkAttendance,
  },
  appeal: {
    title: "Kehadiran Apel",
    description:
      "Data kehadiran apel untuk menghitung hadir, terlambat, dan tidak hadir.",
    icon: FileSpreadsheet,
    acceptLabel: "kehadiran apel",
    headers: "nip, tanggal, status, keterangan",
    downloadTemplate: downloadAppealAttendanceTemplate,
    importer: importAppealAttendance,
  },
};

function ImportCard({
  kind,
  onImported,
}: {
  kind: ImportKind;
  onImported: () => Promise<void>;
}) {
  const config = configs[kind];
  const inputRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const importFile = async (file: File) => {
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const importResult = await config.importer(file);
      setResult(importResult);
      await onImported();
    } catch (caught) {
      console.error(caught);
      setError(
        "File gagal dibaca. Pastikan format XLSX/XLS valid dan header sesuai template.",
      );
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const Icon = config.icon;

  return (
    <Card className="import-card">
      <CardHeader
        icon={Icon}
        title={config.title}
        description={config.description}
      />
      <div className="template-box">
        <div>
          <strong>Header wajib</strong>
          <code>{config.headers}</code>
        </div>
        <button
          className="button button--secondary"
          onClick={config.downloadTemplate}
        >
          <Download size={17} />
          Template
        </button>
      </div>

      <label className="drop-zone">
        <UploadCloud size={32} />
        <strong>
          {busy ? "Sedang memproses..." : `Pilih file ${config.acceptLabel}`}
        </strong>
        <span>Format .xlsx atau .xls • Maksimum disarankan 10 MB</span>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          disabled={busy}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void importFile(file);
          }}
        />
      </label>

      {result ? (
        <Notice type={result.errors.length ? "warning" : "success"}>
          <strong>Import selesai.</strong>
          <div className="import-summary">
            <span>{result.inserted} baru</span>
            <span>{result.updated} diperbarui</span>
            <span>{result.skipped} dilewati</span>
          </div>
          {result.errors.length ? (
            <details>
              <summary>Lihat {result.errors.length} catatan</summary>
              <ul>
                {result.errors.slice(0, 20).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </details>
          ) : null}
        </Notice>
      ) : null}

      {error ? <Notice type="danger">{error}</Notice> : null}
    </Card>
  );
}

export default function ImportPage({
  onImported,
}: {
  onImported: () => Promise<void>;
}) {
  return (
    <>
      <PageHeader
        eyebrow="Integrasi Data"
        title="Import Data dari Excel"
        description="Import master pegawai terlebih dahulu, lalu data kehadiran kerja dan kehadiran apel. Baris dengan NIP dan tanggal yang sama akan diperbarui, bukan diduplikasi."
      />

      <Notice type="info">
        <strong>Urutan yang disarankan:</strong> Master Pegawai → Kehadiran
        Kerja → Kehadiran Apel → Input Audit mySIMKARI.
      </Notice>

      <div className="import-grid">
        <ImportCard kind="employees" onImported={onImported} />
        <ImportCard kind="work" onImported={onImported} />
        <ImportCard kind="appeal" onImported={onImported} />
      </div>

      <Card>
        <CardHeader
          icon={FileSpreadsheet}
          title="Status yang Didukung"
          description="Gunakan ejaan berikut agar data dapat dipetakan secara otomatis."
        />
        <div className="status-guide">
          <div>
            <strong>Kehadiran kerja</strong>
            <p>
              Hadir, Terlambat, Alpa, Izin, Sakit, Cuti, Dinas Luar,
              Pulang Cepat, Tidak Absen.
            </p>
          </div>
          <div>
            <strong>Kehadiran apel</strong>
            <p>Hadir, Terlambat, Tidak Hadir.</p>
          </div>
          <div>
            <strong>Format tanggal</strong>
            <p>YYYY-MM-DD atau DD/MM/YYYY.</p>
          </div>
        </div>
      </Card>
    </>
  );
}
