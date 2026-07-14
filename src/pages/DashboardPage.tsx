import {
  AlertTriangle,
  Award,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Database,
  FileWarning,
  Users,
} from "lucide-react";
import {
  Card,
  CardHeader,
  EmptyState,
  MonthField,
  PageHeader,
  RecommendationBadge,
  ScorePill,
  StatCard,
} from "../components/ui";
import type { AuditLog, EmployeeRecap } from "../types";

const average = (values: Array<number | null>): number | null => {
  const valid = values.filter((value): value is number => value !== null);
  if (!valid.length) return null;
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
};

export default function DashboardPage({
  month,
  onMonthChange,
  recaps,
  recentLogs,
}: {
  month: string;
  onMonthChange: (value: string) => void;
  recaps: EmployeeRecap[];
  recentLogs: AuditLog[];
}) {
  const complete = recaps.filter((recap) => recap.complete);
  const reward = recaps.filter(
    (recap) => recap.recommendation.level === "reward",
  ).length;
  const coaching = recaps.filter((recap) =>
    ["coaching", "warning", "discipline"].includes(
      recap.recommendation.level,
    ),
  ).length;
  const incomplete = recaps.length - complete.length;
  const workAverage = average(recaps.map((recap) => recap.workScore));
  const appealAverage = average(recaps.map((recap) => recap.appealScore));
  const simkariAverage = average(
    recaps.map((recap) => recap.mySimkari?.score ?? null),
  );
  const finalAverage = average(recaps.map((recap) => recap.finalScore));

  const categoryCounts = [
    {
      label: "Kandidat Reward",
      count: reward,
      className: "bar--green",
    },
    {
      label: "Kinerja Baik",
      count: recaps.filter((r) => r.recommendation.level === "good").length,
      className: "bar--blue",
    },
    {
      label: "Pembinaan",
      count: recaps.filter((r) => r.recommendation.level === "coaching")
        .length,
      className: "bar--amber",
    },
    {
      label: "Teguran/Evaluasi",
      count: recaps.filter((r) =>
        ["warning", "discipline"].includes(r.recommendation.level),
      ).length,
      className: "bar--red",
    },
    {
      label: "Belum Lengkap",
      count: incomplete,
      className: "bar--slate",
    },
  ];
  const maxCategory = Math.max(1, ...categoryCounts.map((item) => item.count));

  return (
    <>
      <PageHeader
        eyebrow="Dashboard Administrator"
        title="Ringkasan Evaluasi Pegawai"
        description="Skor dihitung otomatis dari kehadiran kerja, kehadiran apel, dan hasil audit mySIMKARI pada periode yang dipilih."
        actions={
          <MonthField value={month} onChange={onMonthChange} />
        }
      />

      <div className="stats-grid stats-grid--5">
        <StatCard
          label="Pegawai Aktif"
          value={recaps.length}
          helper="Masuk dalam perhitungan periode"
          icon={Users}
          tone="slate"
        />
        <StatCard
          label="Evaluasi Lengkap"
          value={complete.length}
          helper={`${incomplete} pegawai masih belum lengkap`}
          icon={CheckCircle2}
          tone="blue"
        />
        <StatCard
          label="Kandidat Reward"
          value={reward}
          helper="Menunggu verifikasi administratif"
          icon={Award}
          tone="green"
        />
        <StatCard
          label="Perlu Tindak Lanjut"
          value={coaching}
          helper="Pembinaan, teguran, atau evaluasi"
          icon={AlertTriangle}
          tone="red"
        />
        <StatCard
          label="Rata-rata Nilai"
          value={finalAverage === null ? "—" : finalAverage.toFixed(2)}
          helper="Dari evaluasi yang lengkap"
          icon={BarChart3}
          tone="violet"
        />
      </div>

      <div className="metric-strip">
        <div>
          <span className="metric-icon metric-icon--green">
            <CalendarDays size={20} />
          </span>
          <div>
            <small>Rata-rata Kehadiran</small>
            <strong>{workAverage === null ? "—" : workAverage.toFixed(2)}</strong>
          </div>
        </div>
        <div>
          <span className="metric-icon metric-icon--blue">
            <Clock3 size={20} />
          </span>
          <div>
            <small>Rata-rata Kehadiran Apel</small>
            <strong>
              {appealAverage === null ? "—" : appealAverage.toFixed(2)}
            </strong>
          </div>
        </div>
        <div>
          <span className="metric-icon metric-icon--violet">
            <ClipboardCheck size={20} />
          </span>
          <div>
            <small>Rata-rata Audit mySIMKARI</small>
            <strong>
              {simkariAverage === null ? "—" : simkariAverage.toFixed(2)}
            </strong>
          </div>
        </div>
        <div>
          <span className="metric-icon metric-icon--amber">
            <FileWarning size={20} />
          </span>
          <div>
            <small>Data Belum Lengkap</small>
            <strong>{incomplete}</strong>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <Card className="dashboard-ranking">
          <CardHeader
            icon={BarChart3}
            title="Peringkat Nilai Bulanan"
            description="Urutan berdasarkan nilai akhir tertinggi."
          />
          {recaps.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Peringkat</th>
                    <th>Pegawai</th>
                    <th>Unit</th>
                    <th>Alpa</th>
                    <th>Absen Apel</th>
                    <th>mySIMKARI</th>
                    <th>Nilai Akhir</th>
                    <th>Rekomendasi</th>
                  </tr>
                </thead>
                <tbody>
                  {recaps.slice(0, 10).map((recap, index) => (
                    <tr key={recap.employee.nip}>
                      <td>
                        <span className="rank-number">{index + 1}</span>
                      </td>
                      <td>
                        <strong>{recap.employee.nama}</strong>
                        <small>{recap.employee.nip}</small>
                      </td>
                      <td>{recap.employee.unit}</td>
                      <td>{recap.workCounts.alpa}</td>
                      <td>{recap.appealCounts.tidakHadir}</td>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="Belum ada data pegawai"
              description="Import master pegawai untuk mulai membuat rekap evaluasi."
            />
          )}
        </Card>

        <div className="dashboard-side">
          <Card>
            <CardHeader
              icon={Database}
              title="Distribusi Rekomendasi"
              description="Jumlah pegawai pada setiap kategori."
            />
            <div className="bar-list">
              {categoryCounts.map((item) => (
                <div className="bar-row" key={item.label}>
                  <div className="bar-label">
                    <span>{item.label}</span>
                    <strong>{item.count}</strong>
                  </div>
                  <div className="bar-track">
                    <div
                      className={`bar-fill ${item.className}`}
                      style={{
                        width: `${(item.count / maxCategory) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader
              icon={Clock3}
              title="Aktivitas Terbaru"
              description="Riwayat perubahan terakhir oleh admin."
            />
            {recentLogs.length ? (
              <div className="activity-list">
                {recentLogs.slice(0, 6).map((log) => (
                  <div key={log.id}>
                    <span />
                    <div>
                      <strong>{log.action.replaceAll("_", " ")}</strong>
                      <p>{log.detail}</p>
                      <small>
                        {new Date(log.timestamp).toLocaleString("id-ID")}
                      </small>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="Belum ada aktivitas"
                description="Aktivitas import dan perubahan data akan muncul di sini."
              />
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
