import { useEffect, useState, type FormEvent } from "react";
import {
  Database,
  KeyRound,
  RotateCcw,
  Save,
  Settings,
  Trash2,
} from "lucide-react";
import {
  Card,
  CardHeader,
  Notice,
  PageHeader,
} from "../components/ui";
import {
  addAuditLog,
  clearOperationalData,
  db,
  resetDemoData,
  saveScoringSettings,
} from "../db/database";
import { createPasswordRecord, verifyPassword } from "../services/auth";
import type { ScoringSettings } from "../types";

export default function SettingsPage({
  settings,
  onChanged,
  onLogout,
}: {
  settings: ScoringSettings;
  onChanged: () => Promise<void>;
  onLogout: () => void;
}) {
  const [form, setForm] = useState<ScoringSettings>(settings);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [passwordForm, setPasswordForm] = useState({
    current: "",
    next: "",
    confirm: "",
  });

  useEffect(() => setForm(settings), [settings]);

  const updateNumber = (
    key: keyof ScoringSettings,
    value: string,
  ) => {
    setForm((current) => ({
      ...current,
      [key]: Number(value),
    }));
  };

  const saveSettings = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");

    const weightTotal =
      form.workWeight + form.appealWeight + form.mySimkariWeight;

    if (weightTotal !== 100) {
      setError(`Total bobot harus 100%. Saat ini ${weightTotal}%.`);
      return;
    }

    if (
      !(
        form.rewardThreshold > form.goodThreshold &&
        form.goodThreshold > form.coachingThreshold &&
        form.coachingThreshold > form.warningThreshold
      )
    ) {
      setError(
        "Urutan ambang harus: Reward > Baik > Pembinaan > Teguran.",
      );
      return;
    }

    await saveScoringSettings(form);
    setMessage("Pengaturan perhitungan berhasil disimpan.");
    await onChanged();
  };

  const changePassword = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (passwordForm.next.length < 8) {
      setError("Password baru minimal 8 karakter.");
      return;
    }
    if (passwordForm.next !== passwordForm.confirm) {
      setError("Konfirmasi password baru tidak sama.");
      return;
    }

    const admin = await db.admins.get("admin");
    if (!admin) {
      setError("Akun administrator tidak ditemukan.");
      return;
    }

    const valid = await verifyPassword(
      passwordForm.current,
      admin.salt,
      admin.passwordHash,
    );
    if (!valid) {
      setError("Password saat ini tidak sesuai.");
      return;
    }

    const passwordRecord = await createPasswordRecord(passwordForm.next);
    await db.admins.put({ ...admin, ...passwordRecord });
    await addAuditLog(
      "CHANGE_PASSWORD",
      "Administrator",
      "Password administrator berhasil diubah.",
    );
    setPasswordForm({ current: "", next: "", confirm: "" });
    setMessage("Password berhasil diubah. Silakan login ulang.");
    window.setTimeout(onLogout, 1200);
  };

  const clearData = async () => {
    const confirmed = window.confirm(
      "Hapus seluruh data pegawai, kehadiran, apel, audit mySIMKARI, dan histori? Tindakan ini tidak dapat dibatalkan.",
    );
    if (!confirmed) return;
    await clearOperationalData();
    setMessage("Seluruh data operasional berhasil dihapus.");
    await onChanged();
  };

  const resetDemo = async () => {
    const confirmed = window.confirm(
      "Pulihkan data contoh dan pengaturan awal? Data operasional saat ini akan diganti.",
    );
    if (!confirmed) return;
    await resetDemoData();
    setMessage("Data contoh berhasil dipulihkan.");
    await onChanged();
  };

  return (
    <>
      <PageHeader
        eyebrow="Konfigurasi Administrator"
        title="Pengaturan Perhitungan"
        description="Atur bobot komponen, penalti kejadian, ambang rekomendasi, keamanan akun, dan pengelolaan database lokal."
      />

      {message ? <Notice type="success">{message}</Notice> : null}
      {error ? <Notice type="danger">{error}</Notice> : null}

      <div className="settings-grid">
        <Card className="settings-main">
          <CardHeader
            icon={Settings}
            title="Bobot & Penalti"
            description="Perubahan langsung memengaruhi seluruh rekap bulanan."
          />
          <form className="form-grid" onSubmit={saveSettings}>
            <div className="settings-section">
              <h3>Bobot Komponen</h3>
              <p>Total bobot wajib 100%.</p>
              <div className="form-row form-row--3">
                <label className="field">
                  <span>Kehadiran Kerja (%)</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.workWeight}
                    onChange={(e) =>
                      updateNumber("workWeight", e.target.value)
                    }
                  />
                </label>
                <label className="field">
                  <span>Kehadiran Apel (%)</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.appealWeight}
                    onChange={(e) =>
                      updateNumber("appealWeight", e.target.value)
                    }
                  />
                </label>
                <label className="field">
                  <span>Audit mySIMKARI (%)</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.mySimkariWeight}
                    onChange={(e) =>
                      updateNumber("mySimkariWeight", e.target.value)
                    }
                  />
                </label>
              </div>
            </div>

            <div className="settings-section">
              <h3>Penalti Kehadiran Kerja</h3>
              <p>Nilai awal setiap komponen adalah 100.</p>
              <div className="form-row form-row--4">
                <label className="field">
                  <span>Alpa / kejadian</span>
                  <input
                    type="number"
                    min="0"
                    value={form.alpaPenalty}
                    onChange={(e) =>
                      updateNumber("alpaPenalty", e.target.value)
                    }
                  />
                </label>
                <label className="field">
                  <span>Terlambat / kejadian</span>
                  <input
                    type="number"
                    min="0"
                    value={form.latePenalty}
                    onChange={(e) =>
                      updateNumber("latePenalty", e.target.value)
                    }
                  />
                </label>
                <label className="field">
                  <span>Pulang cepat</span>
                  <input
                    type="number"
                    min="0"
                    value={form.earlyLeavePenalty}
                    onChange={(e) =>
                      updateNumber("earlyLeavePenalty", e.target.value)
                    }
                  />
                </label>
                <label className="field">
                  <span>Tidak absen</span>
                  <input
                    type="number"
                    min="0"
                    value={form.missingCheckPenalty}
                    onChange={(e) =>
                      updateNumber("missingCheckPenalty", e.target.value)
                    }
                  />
                </label>
              </div>
            </div>

            <div className="settings-section">
              <h3>Penalti Kehadiran Apel</h3>
              <div className="form-row">
                <label className="field">
                  <span>Tidak hadir / kejadian</span>
                  <input
                    type="number"
                    min="0"
                    value={form.appealAbsentPenalty}
                    onChange={(e) =>
                      updateNumber("appealAbsentPenalty", e.target.value)
                    }
                  />
                </label>
                <label className="field">
                  <span>Terlambat / kejadian</span>
                  <input
                    type="number"
                    min="0"
                    value={form.appealLatePenalty}
                    onChange={(e) =>
                      updateNumber("appealLatePenalty", e.target.value)
                    }
                  />
                </label>
              </div>
            </div>

            <div className="settings-section">
              <h3>Ambang Rekomendasi</h3>
              <div className="form-row form-row--4">
                <label className="field">
                  <span>Kandidat Reward ≥</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.rewardThreshold}
                    onChange={(e) =>
                      updateNumber("rewardThreshold", e.target.value)
                    }
                  />
                </label>
                <label className="field">
                  <span>Kinerja Baik ≥</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.goodThreshold}
                    onChange={(e) =>
                      updateNumber("goodThreshold", e.target.value)
                    }
                  />
                </label>
                <label className="field">
                  <span>Pembinaan ≥</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.coachingThreshold}
                    onChange={(e) =>
                      updateNumber("coachingThreshold", e.target.value)
                    }
                  />
                </label>
                <label className="field">
                  <span>Teguran ≥</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.warningThreshold}
                    onChange={(e) =>
                      updateNumber("warningThreshold", e.target.value)
                    }
                  />
                </label>
              </div>
            </div>

            <button className="button button--primary">
              <Save size={17} />
              Simpan Pengaturan
            </button>
          </form>
        </Card>

        <div className="settings-side">
          <Card>
            <CardHeader
              icon={KeyRound}
              title="Ubah Password"
              description="Password disimpan sebagai hash PBKDF2 di database browser."
            />
            <form className="form-grid" onSubmit={changePassword}>
              <label className="field">
                <span>Password Saat Ini</span>
                <input
                  type="password"
                  value={passwordForm.current}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      current: e.target.value,
                    })
                  }
                  required
                />
              </label>
              <label className="field">
                <span>Password Baru</span>
                <input
                  type="password"
                  value={passwordForm.next}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      next: e.target.value,
                    })
                  }
                  required
                />
              </label>
              <label className="field">
                <span>Konfirmasi Password Baru</span>
                <input
                  type="password"
                  value={passwordForm.confirm}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      confirm: e.target.value,
                    })
                  }
                  required
                />
              </label>
              <button className="button button--secondary">
                <KeyRound size={17} />
                Ubah Password
              </button>
            </form>
          </Card>

          <Card>
            <CardHeader
              icon={Database}
              title="Database Lokal"
              description="Data tersimpan di IndexedDB pada browser/perangkat ini."
            />
            <Notice type="warning">
              GitHub Pages adalah hosting statis. Database ini tidak otomatis
              tersinkron antar komputer. Untuk multi-user perlu backend
              terpusat seperti PostgreSQL/Supabase/API internal.
            </Notice>
            <div className="danger-actions">
              <button className="button button--secondary" onClick={resetDemo}>
                <RotateCcw size={17} />
                Pulihkan Data Contoh
              </button>
              <button className="button button--danger" onClick={clearData}>
                <Trash2 size={17} />
                Hapus Data Operasional
              </button>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
