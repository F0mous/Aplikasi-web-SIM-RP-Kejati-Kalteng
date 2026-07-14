import { useState, type FormEvent } from "react";
import {
  BarChart3,
  ClipboardCheck,
  FileSpreadsheet,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import { Notice } from "../components/ui";

export default function LoginPage({
  onLogin,
}: {
  onLogin: (username: string, password: string) => Promise<boolean>;
}) {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const valid = await onLogin(username, password);
      if (!valid) setError("Username atau password tidak sesuai.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <section className="login-hero">
        <div className="login-hero__content">
          <div className="login-kicker">
            <ShieldCheck size={17} />
            Kejaksaan Tinggi Kalimantan Tengah
          </div>
          <h1>
            Sistem Evaluasi
            <span>Reward & Punishment</span>
          </h1>
          <p>
            Mengolah kehadiran kerja, kehadiran apel, dan hasil audit
            mySIMKARI menjadi rekap bulanan, nilai terukur, serta rekomendasi
            otomatis yang transparan.
          </p>

          <div className="login-features">
            <div>
              <FileSpreadsheet size={23} />
              <strong>Import Excel</strong>
              <span>Pegawai, presensi kerja, dan apel.</span>
            </div>
            <div>
              <ClipboardCheck size={23} />
              <strong>Audit mySIMKARI</strong>
              <span>Nilai dan temuan diinput manual.</span>
            </div>
            <div>
              <BarChart3 size={23} />
              <strong>Skor Otomatis</strong>
              <span>Bobot, penalti, dan ambang dapat diatur.</span>
            </div>
          </div>
        </div>
      </section>

      <section className="login-panel">
        <form className="login-card" onSubmit={submit}>
          <div className="login-icon">
            <LockKeyhole size={26} />
          </div>
          <p className="eyebrow">Akses Administrator</p>
          <h2>Masuk ke Dashboard</h2>
          <p className="login-subtitle">
            Satu akun admin untuk seluruh pengelolaan aplikasi.
          </p>

          <label className="field">
            <span>Username</span>
            <input
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          {error ? <Notice type="danger">{error}</Notice> : null}

          <button className="button button--primary button--large" disabled={submitting}>
            {submitting ? "Memeriksa..." : "Masuk"}
          </button>

          <div className="demo-credential">
            <strong>Akun awal</strong>
            <span>admin / admin123</span>
            <small>Ubah password dari menu Pengaturan setelah login.</small>
          </div>
        </form>
      </section>
    </div>
  );
}
