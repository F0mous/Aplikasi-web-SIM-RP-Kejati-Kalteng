import { useMemo, useState } from "react";
import {
  Download,
  Eye,
  FileDown,
  FileSpreadsheet,
  Search,
} from "lucide-react";
import {
  Card,
  CardHeader,
  EmptyState,
  Modal,
  MonthField,
  PageHeader,
  RecommendationBadge,
  ScorePill,
} from "../components/ui";
import { addAuditLog } from "../db/database";
import { exportRecapsToExcel } from "../services/excel";
import {
  exportEmployeeRecapPdf,
  exportMonthlyRecapPdf,
} from "../services/pdf";
import type { EmployeeRecap, ScoringSettings } from "../types";

export default function RecapPage({
  month,
  onMonthChange,
  recaps,
  settings,
  onChanged,
}: {
  month: string;
  onMonthChange: (value: string) => void;
  recaps: EmployeeRecap[];
  settings: ScoringSettings;
  onChanged: () => Promise<void>;
}) {
  const [search, setSearch] = useState("");
  const [unit, setUnit] = useState("");
  const [selected, setSelected] = useState<EmployeeRecap | null>(null);

  const units = useMemo(
    () => Array.from(new Set(recaps.map((recap) => recap.employee.unit))).sort(),
    [recaps],
  );

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return recaps.filter((recap) => {
      const matchesSearch =
        !keyword ||
        `${recap.employee.nama} ${recap.employee.nip} ${recap.employee.jabatan}`
          .toLowerCase()
          .includes(keyword);
      const matchesUnit = !unit || recap.employee.unit === unit;
      return matchesSearch && matchesUnit;
    });
  }, [recaps, search, unit]);

  const exportAllPdf = async () => {
    exportMonthlyRecapPdf(filtered, month);
    await addAuditLog(
      "EXPORT_PDF",
      "Rekap Bulanan",
      `Mencetak PDF rekap ${month} sebanyak ${filtered.length} pegawai.`,
    );
    await onChanged();
  };

  const exportExcel = async () => {
    exportRecapsToExcel(filtered, month);
    await addAuditLog(
      "EXPORT_EXCEL",
      "Rekap Bulanan",
      `Mengekspor Excel rekap ${month} sebanyak ${filtered.length} pegawai.`,
    );
    await onChanged();
  };

  const exportPersonPdf = async (recap: EmployeeRecap) => {
    exportEmployeeRecapPdf(recap, settings);
    await addAuditLog(
      "EXPORT_PDF",
      "Rekap Pegawai",
      `Mencetak PDF ${recap.employee.nama} periode ${month}.`,
    );
    await onChanged();
  };

  return (
    <>
      <PageHeader
        eyebrow="Laporan & Rekomendasi"
        title="Rekap Bulanan Per Pegawai"
        description="Lihat detail alpa, terlambat, absensi apel, nilai audit mySIMKARI, nilai akhir, dan rekomendasi sistem."
        actions={
          <>
            <MonthField value={month} onChange={onMonthChange} />
            <button className="button button--secondary" onClick={exportExcel}>
              <FileSpreadsheet size={17} />
              Export Excel
            </button>
            <button className="button button--primary" onClick={exportAllPdf}>
              <FileDown size={17} />
              Cetak PDF
            </button>
          </>
        }
      />

      <Card>
        <CardHeader
          title="Rekap Evaluasi"
          description={`${filtered.length} pegawai ditampilkan sesuai filter.`}
          actions={
            <div className="filter-row">
              <label className="search-box">
                <Search size={17} />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Cari nama atau NIP..."
                />
              </label>
              <select
                className="compact-select"
                value={unit}
                onChange={(event) => setUnit(event.target.value)}
              >
                <option value="">Semua Unit</option>
                {units.map((item) => (
                  <option value={item} key={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          }
        />

        {filtered.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>No</th>
                  <th>Pegawai</th>
                  <th>Unit</th>
                  <th>Alpa</th>
                  <th>Terlambat</th>
                  <th>Absen Apel</th>
                  <th>Nilai Hadir</th>
                  <th>Nilai Apel</th>
                  <th>mySIMKARI</th>
                  <th>Nilai Akhir</th>
                  <th>Rekomendasi</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((recap, index) => (
                  <tr key={recap.employee.nip}>
                    <td>{index + 1}</td>
                    <td>
                      <strong>{recap.employee.nama}</strong>
                      <small>{recap.employee.nip}</small>
                    </td>
                    <td>{recap.employee.unit}</td>
                    <td>{recap.workCounts.alpa}</td>
                    <td>{recap.workCounts.terlambat}</td>
                    <td>{recap.appealCounts.tidakHadir}</td>
                    <td>
                      <ScorePill value={recap.workScore} />
                    </td>
                    <td>
                      <ScorePill value={recap.appealScore} />
                    </td>
                    <td>
                      <ScorePill value={recap.mySimkari?.score ?? null} />
                    </td>
                    <td>
                      <ScorePill value={recap.finalScore} />
                    </td>
                    <td>
                      <RecommendationBadge
                        level={recap.recommendation.level}
                        label={recap.recommendation.label}
                      />
                    </td>
                    <td>
                      <button
                        className="icon-button"
                        title="Lihat detail"
                        onClick={() => setSelected(recap)}
                      >
                        <Eye size={17} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="Tidak ada rekap"
            description="Tidak ada pegawai yang cocok dengan filter atau belum ada master pegawai."
          />
        )}
      </Card>

      <Modal
        open={Boolean(selected)}
        title="Detail Rekap Pegawai"
        onClose={() => setSelected(null)}
      >
        {selected ? (
          <div className="recap-detail">
            <div className="employee-summary">
              <div className="avatar-large">
                {selected.employee.nama
                  .split(" ")
                  .slice(0, 2)
                  .map((word) => word[0])
                  .join("")}
              </div>
              <div>
                <h3>{selected.employee.nama}</h3>
                <p>
                  {selected.employee.nip} • {selected.employee.jabatan}
                </p>
                <span>{selected.employee.unit}</span>
              </div>
              <div className="final-score-block">
                <small>Nilai Akhir</small>
                <strong>
                  {selected.finalScore === null
                    ? "—"
                    : selected.finalScore.toFixed(2)}
                </strong>
              </div>
            </div>

            <div className="detail-grid">
              <div className="detail-panel">
                <h4>Kehadiran Kerja</h4>
                <dl>
                  <div><dt>Hadir</dt><dd>{selected.workCounts.hadir}</dd></div>
                  <div><dt>Terlambat</dt><dd>{selected.workCounts.terlambat}</dd></div>
                  <div><dt>Alpa</dt><dd>{selected.workCounts.alpa}</dd></div>
                  <div><dt>Izin</dt><dd>{selected.workCounts.izin}</dd></div>
                  <div><dt>Sakit</dt><dd>{selected.workCounts.sakit}</dd></div>
                  <div><dt>Cuti</dt><dd>{selected.workCounts.cuti}</dd></div>
                  <div><dt>Dinas Luar</dt><dd>{selected.workCounts.dinasLuar}</dd></div>
                  <div><dt>Pulang Cepat</dt><dd>{selected.workCounts.pulangCepat}</dd></div>
                  <div><dt>Tidak Absen</dt><dd>{selected.workCounts.tidakAbsen}</dd></div>
                </dl>
                <div className="detail-score">
                  Nilai Kehadiran
                  <ScorePill value={selected.workScore} />
                </div>
              </div>

              <div className="detail-panel">
                <h4>Kehadiran Apel</h4>
                <dl>
                  <div><dt>Total Jadwal</dt><dd>{selected.appealCounts.total}</dd></div>
                  <div><dt>Hadir</dt><dd>{selected.appealCounts.hadir}</dd></div>
                  <div><dt>Terlambat</dt><dd>{selected.appealCounts.terlambat}</dd></div>
                  <div><dt>Tidak Hadir</dt><dd>{selected.appealCounts.tidakHadir}</dd></div>
                </dl>
                <div className="detail-score">
                  Nilai Apel
                  <ScorePill value={selected.appealScore} />
                </div>
              </div>

              <div className="detail-panel">
                <h4>Audit mySIMKARI</h4>
                <dl>
                  <div><dt>Nilai Audit</dt><dd>{selected.mySimkari?.score ?? "—"}</dd></div>
                  <div><dt>Kelengkapan</dt><dd>{selected.mySimkari ? `${selected.mySimkari.completeness}%` : "—"}</dd></div>
                  <div><dt>Jumlah Temuan</dt><dd>{selected.mySimkari?.findings ?? "—"}</dd></div>
                  <div><dt>Tanggal Audit</dt><dd>{selected.mySimkari ? new Date(selected.mySimkari.auditDate).toLocaleDateString("id-ID") : "—"}</dd></div>
                </dl>
                <p className="audit-note">
                  {selected.mySimkari?.notes || "Belum ada catatan audit."}
                </p>
              </div>
            </div>

            <div className={`recommendation-box recommendation-box--${selected.recommendation.level}`}>
              <div>
                <RecommendationBadge
                  level={selected.recommendation.level}
                  label={selected.recommendation.label}
                />
                <p>{selected.recommendation.description}</p>
              </div>
              <button
                className="button button--primary"
                onClick={() => void exportPersonPdf(selected)}
              >
                <Download size={17} />
                PDF Pegawai
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  );
}
