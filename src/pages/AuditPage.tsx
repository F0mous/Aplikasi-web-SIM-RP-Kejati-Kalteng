import { useMemo, useState } from "react";
import { History, Search } from "lucide-react";
import {
  Card,
  CardHeader,
  EmptyState,
  PageHeader,
} from "../components/ui";
import type { AuditLog } from "../types";

export default function AuditPage({ logs }: { logs: AuditLog[] }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return logs;
    return logs.filter((log) =>
      `${log.action} ${log.entity} ${log.detail}`
        .toLowerCase()
        .includes(keyword),
    );
  }, [logs, search]);

  return (
    <>
      <PageHeader
        eyebrow="Akuntabilitas Sistem"
        title="Histori Audit"
        description="Setiap login, import, perubahan nilai, perubahan pengaturan, dan ekspor laporan dicatat otomatis."
      />

      <Card>
        <CardHeader
          icon={History}
          title="Log Aktivitas Administrator"
          description={`${filtered.length} aktivitas ditampilkan.`}
          actions={
            <label className="search-box">
              <Search size={17} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari aktivitas..."
              />
            </label>
          }
        />
        {filtered.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Waktu</th>
                  <th>Aksi</th>
                  <th>Entitas</th>
                  <th>Detail</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log) => (
                  <tr key={log.id}>
                    <td>
                      {new Date(log.timestamp).toLocaleString("id-ID")}
                    </td>
                    <td>
                      <span className="action-label">
                        {log.action.replaceAll("_", " ")}
                      </span>
                    </td>
                    <td>{log.entity}</td>
                    <td>{log.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="Log tidak ditemukan"
            description="Belum ada aktivitas atau tidak ada hasil yang cocok dengan pencarian."
          />
        )}
      </Card>
    </>
  );
}
