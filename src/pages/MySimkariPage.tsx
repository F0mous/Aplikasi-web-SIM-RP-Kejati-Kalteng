import { useMemo, useState, type FormEvent } from "react";
import {
  ClipboardCheck,
  FileWarning,
  PencilLine,
  Save,
  Search,
} from "lucide-react";
import {
  Card,
  CardHeader,
  EmptyState,
  MonthField,
  Notice,
  PageHeader,
  ScorePill,
} from "../components/ui";
import { addAuditLog, db } from "../db/database";
import type { Employee, MySimkariAudit } from "../types";

interface AuditForm {
  nip: string;
  auditDate: string;
  score: number;
  completeness: number;
  findings: number;
  notes: string;
}

const today = new Date().toISOString().slice(0, 10);

export default function MySimkariPage({
  month,
  onMonthChange,
  employees,
  audits,
  onChanged,
}: {
  month: string;
  onMonthChange: (value: string) => void;
  employees: Employee[];
  audits: MySimkariAudit[];
  onChanged: () => Promise<void>;
}) {
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState<AuditForm>({
    nip: employees[0]?.nip ?? "",
    auditDate: today,
    score: 100,
    completeness: 100,
    findings: 0,
    notes: "",
  });

  const monthAudits = useMemo(
    () => audits.filter((audit) => audit.month === month),
    [audits, month],
  );

  const employeeMap = useMemo(
    () => new Map(employees.map((employee) => [employee.nip, employee])),
    [employees],
  );

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    const rows = monthAudits
      .map((audit) => ({
        audit,
        employee: employeeMap.get(audit.nip),
      }))
      .filter(
        (
          row,
        ): row is {
          audit: MySimkariAudit;
          employee: Employee;
        } => Boolean(row.employee),
      );

    if (!keyword) return rows;
    return rows.filter(({ employee }) =>
      `${employee.nama} ${employee.nip} ${employee.unit}`
        .toLowerCase()
        .includes(keyword),
    );
  }, [monthAudits, employeeMap, search]);

  const edit = (audit: MySimkariAudit) => {
    setForm({
      nip: audit.nip,
      auditDate: audit.auditDate,
      score: audit.score,
      completeness: audit.completeness,
      findings: audit.findings,
      notes: audit.notes,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.nip) return;

    const audit: MySimkariAudit = {
      id: `${form.nip}_${month}`,
      nip: form.nip,
      month,
      auditDate: form.auditDate,
      score: Number(form.score),
      completeness: Number(form.completeness),
      findings: Number(form.findings),
      notes: form.notes.trim(),
      updatedAt: new Date().toISOString(),
    };

    await db.mySimkari.put(audit);
    const employee = employeeMap.get(form.nip);
    await addAuditLog(
      "SAVE_MYSIMKARI",
      "Audit mySIMKARI",
      `${employee?.nama ?? form.nip} • ${month} • nilai ${audit.score}.`,
    );
    setMessage("Hasil audit mySIMKARI berhasil disimpan.");
    setForm((current) => ({
      ...current,
      score: 100,
      completeness: 100,
      findings: 0,
      notes: "",
    }));
    await onChanged();
  };

  return (
    <>
      <PageHeader
        eyebrow="Komponen Penilaian Manual"
        title="Audit Kelengkapan mySIMKARI"
        description="Masukkan nilai audit, persentase kelengkapan, jumlah temuan, dan catatan untuk setiap pegawai pada periode penilaian."
        actions={<MonthField value={month} onChange={onMonthChange} />}
      />

      <div className="two-column-layout">
        <Card>
          <CardHeader
            icon={ClipboardCheck}
            title="Input Hasil Audit"
            description="Satu hasil audit per pegawai untuk setiap bulan."
          />
          {employees.length ? (
            <form className="form-grid" onSubmit={save}>
              <label className="field">
                <span>Pegawai</span>
                <select
                  value={form.nip}
                  onChange={(event) =>
                    setForm({ ...form, nip: event.target.value })
                  }
                  required
                >
                  {employees
                    .filter((employee) => employee.status === "Aktif")
                    .map((employee) => (
                      <option value={employee.nip} key={employee.nip}>
                        {employee.nama} • {employee.nip}
                      </option>
                    ))}
                </select>
              </label>

              <label className="field">
                <span>Tanggal Audit</span>
                <input
                  type="date"
                  value={form.auditDate}
                  onChange={(event) =>
                    setForm({ ...form, auditDate: event.target.value })
                  }
                  required
                />
              </label>

              <div className="form-row form-row--3">
                <label className="field">
                  <span>Nilai Audit</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={form.score}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        score: Number(event.target.value),
                      })
                    }
                    required
                  />
                </label>
                <label className="field">
                  <span>Kelengkapan (%)</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={form.completeness}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        completeness: Number(event.target.value),
                      })
                    }
                    required
                  />
                </label>
                <label className="field">
                  <span>Jumlah Temuan</span>
                  <input
                    type="number"
                    min="0"
                    value={form.findings}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        findings: Number(event.target.value),
                      })
                    }
                    required
                  />
                </label>
              </div>

              <label className="field">
                <span>Catatan Auditor</span>
                <textarea
                  rows={5}
                  value={form.notes}
                  onChange={(event) =>
                    setForm({ ...form, notes: event.target.value })
                  }
                  placeholder="Temuan, data yang belum lengkap, dan tindak lanjut..."
                />
              </label>

              {message ? <Notice type="success">{message}</Notice> : null}

              <button className="button button--primary">
                <Save size={17} />
                Simpan Hasil Audit
              </button>
            </form>
          ) : (
            <EmptyState
              title="Belum ada pegawai"
              description="Import data pegawai terlebih dahulu sebelum mengisi audit mySIMKARI."
            />
          )}
        </Card>

        <Card className="wide-card">
          <CardHeader
            icon={FileWarning}
            title="Hasil Audit Periode"
            description={`${monthAudits.length} dari ${employees.filter((employee) => employee.status === "Aktif").length} pegawai sudah diaudit.`}
            actions={
              <label className="search-box">
                <Search size={17} />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Cari pegawai..."
                />
              </label>
            }
          />
          {filtered.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Pegawai</th>
                    <th>Unit</th>
                    <th>Nilai</th>
                    <th>Kelengkapan</th>
                    <th>Temuan</th>
                    <th>Tanggal Audit</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(({ audit, employee }) => (
                    <tr key={audit.id}>
                      <td>
                        <strong>{employee.nama}</strong>
                        <small>{employee.nip}</small>
                      </td>
                      <td>{employee.unit}</td>
                      <td>
                        <ScorePill value={audit.score} />
                      </td>
                      <td>{audit.completeness.toFixed(2)}%</td>
                      <td>{audit.findings}</td>
                      <td>
                        {new Date(audit.auditDate).toLocaleDateString("id-ID")}
                      </td>
                      <td>
                        <button
                          className="icon-button"
                          title="Edit hasil audit"
                          onClick={() => edit(audit)}
                        >
                          <PencilLine size={17} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="Belum ada hasil audit"
              description="Isi nilai audit mySIMKARI untuk pegawai pada periode ini."
            />
          )}
        </Card>
      </div>
    </>
  );
}
