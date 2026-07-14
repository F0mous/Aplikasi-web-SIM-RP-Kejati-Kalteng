import { useMemo, useState, type FormEvent } from "react";
import { Search, Trash2, UserPlus, Users } from "lucide-react";
import { addAuditLog, db } from "../db/database";
import { UNITS } from "../data/defaults";
import type { Employee, EmployeeStatus } from "../types";
import {
  Card,
  CardHeader,
  EmptyState,
  Notice,
  PageHeader,
} from "../components/ui";

const emptyForm: Employee = {
  nip: "",
  nama: "",
  jabatan: "",
  unit: UNITS[0],
  status: "Aktif",
};

export default function EmployeesPage({
  employees,
  onChanged,
}: {
  employees: Employee[];
  onChanged: () => Promise<void>;
}) {
  const [form, setForm] = useState<Employee>(emptyForm);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return employees;
    return employees.filter((employee) =>
      `${employee.nip} ${employee.nama} ${employee.jabatan} ${employee.unit}`
        .toLowerCase()
        .includes(keyword),
    );
  }, [employees, search]);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    const existing = await db.employees.get(form.nip);
    await db.employees.put({
      ...form,
      nip: form.nip.trim(),
      nama: form.nama.trim(),
      jabatan: form.jabatan.trim(),
      unit: form.unit.trim(),
    });
    await addAuditLog(
      existing ? "UPDATE_EMPLOYEE" : "CREATE_EMPLOYEE",
      "Pegawai",
      `${form.nama} (${form.nip}) ${existing ? "diperbarui" : "ditambahkan"}.`,
    );
    setForm(emptyForm);
    setMessage("Data pegawai berhasil disimpan.");
    await onChanged();
  };

  const remove = async (employee: Employee) => {
    const confirmed = window.confirm(
      `Hapus ${employee.nama} dari master pegawai? Data kehadiran historis tidak ikut dihapus.`,
    );
    if (!confirmed) return;
    await db.employees.delete(employee.nip);
    await addAuditLog(
      "DELETE_EMPLOYEE",
      "Pegawai",
      `${employee.nama} (${employee.nip}) dihapus dari master.`,
    );
    await onChanged();
  };

  return (
    <>
      <PageHeader
        eyebrow="Master Data"
        title="Data Pegawai"
        description="Kelola pegawai secara manual atau gunakan menu Import Data untuk memasukkan banyak pegawai sekaligus."
      />

      <div className="two-column-layout">
        <Card>
          <CardHeader
            icon={UserPlus}
            title="Tambah / Perbarui Pegawai"
            description="NIP digunakan sebagai identitas unik."
          />
          <form className="form-grid" onSubmit={save}>
            <label className="field">
              <span>NIP</span>
              <input
                value={form.nip}
                onChange={(event) =>
                  setForm({ ...form, nip: event.target.value })
                }
                required
                placeholder="18 digit NIP"
              />
            </label>
            <label className="field">
              <span>Nama Lengkap</span>
              <input
                value={form.nama}
                onChange={(event) =>
                  setForm({ ...form, nama: event.target.value })
                }
                required
                placeholder="Nama dan gelar"
              />
            </label>
            <label className="field">
              <span>Jabatan</span>
              <input
                value={form.jabatan}
                onChange={(event) =>
                  setForm({ ...form, jabatan: event.target.value })
                }
                required
              />
            </label>
            <label className="field">
              <span>Unit / Bidang</span>
              <input
                list="unit-options"
                value={form.unit}
                onChange={(event) =>
                  setForm({ ...form, unit: event.target.value })
                }
                required
              />
              <datalist id="unit-options">
                {UNITS.map((unit) => (
                  <option value={unit} key={unit} />
                ))}
              </datalist>
            </label>
            <label className="field">
              <span>Status</span>
              <select
                value={form.status}
                onChange={(event) =>
                  setForm({
                    ...form,
                    status: event.target.value as EmployeeStatus,
                  })
                }
              >
                <option value="Aktif">Aktif</option>
                <option value="Nonaktif">Nonaktif</option>
              </select>
            </label>
            {message ? <Notice type="success">{message}</Notice> : null}
            <button className="button button--primary">Simpan Pegawai</button>
          </form>
        </Card>

        <Card className="wide-card">
          <CardHeader
            icon={Users}
            title="Daftar Pegawai"
            description={`${employees.length} pegawai tersimpan pada database.`}
            actions={
              <label className="search-box">
                <Search size={17} />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Cari nama, NIP, unit..."
                />
              </label>
            }
          />
          {filtered.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>NIP</th>
                    <th>Nama</th>
                    <th>Jabatan</th>
                    <th>Unit</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((employee) => (
                    <tr key={employee.nip}>
                      <td>{employee.nip}</td>
                      <td>
                        <strong>{employee.nama}</strong>
                      </td>
                      <td>{employee.jabatan}</td>
                      <td>{employee.unit}</td>
                      <td>
                        <span
                          className={`status-dot status-dot--${employee.status === "Aktif" ? "active" : "inactive"}`}
                        >
                          {employee.status}
                        </span>
                      </td>
                      <td>
                        <button
                          className="icon-button icon-button--danger"
                          onClick={() => remove(employee)}
                          title="Hapus pegawai"
                        >
                          <Trash2 size={17} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="Pegawai tidak ditemukan"
              description="Coba ubah kata kunci pencarian atau import data pegawai."
            />
          )}
        </Card>
      </div>
    </>
  );
}
