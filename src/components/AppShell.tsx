import { useState, type ReactNode } from "react";
import {
  BarChart3,
  ClipboardCheck,
  Database,
  FileSpreadsheet,
  History,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { cx } from "./ui";

export type PageKey =
  | "dashboard"
  | "employees"
  | "imports"
  | "mysimkari"
  | "recap"
  | "settings"
  | "audit";

const navigation: Array<{
  key: PageKey;
  label: string;
  icon: typeof BarChart3;
}> = [
  { key: "dashboard", label: "Dashboard", icon: BarChart3 },
  { key: "employees", label: "Data Pegawai", icon: Users },
  { key: "imports", label: "Import Data", icon: FileSpreadsheet },
  { key: "mysimkari", label: "Audit mySIMKARI", icon: ClipboardCheck },
  { key: "recap", label: "Rekap Bulanan", icon: Database },
  { key: "settings", label: "Pengaturan Skor", icon: Settings },
  { key: "audit", label: "Histori Audit", icon: History },
];

export default function AppShell({
  page,
  onNavigate,
  adminName,
  onLogout,
  children,
}: {
  page: PageKey;
  onNavigate: (page: PageKey) => void;
  adminName: string;
  onLogout: () => void;
  children: ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navigate = (key: PageKey) => {
    onNavigate(key);
    setMobileOpen(false);
  };

  return (
    <div className="app-shell">
      <aside className={cx("sidebar", mobileOpen && "sidebar--open")}>
        <div className="brand">
          <span className="brand-mark">
            <ShieldCheck size={27} />
          </span>
          <div>
            <strong>SIM-RP</strong>
            <small>Kejati Kalteng</small>
          </div>
          <button
            className="sidebar-close"
            aria-label="Tutup menu"
            onClick={() => setMobileOpen(false)}
          >
            <X size={22} />
          </button>
        </div>

        <div className="admin-mini">
          <span>AD</span>
          <div>
            <strong>{adminName}</strong>
            <small>Administrator</small>
          </div>
        </div>

        <nav className="nav-list" aria-label="Menu utama">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                className={cx("nav-item", page === item.key && "nav-item--active")}
                onClick={() => navigate(item.key)}
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item nav-item--logout" onClick={onLogout}>
            <LogOut size={19} />
            <span>Keluar</span>
          </button>
          <p>Database lokal pada browser</p>
        </div>
      </aside>

      {mobileOpen ? (
        <button
          className="sidebar-overlay"
          aria-label="Tutup menu"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <div className="main-column">
        <div className="mobile-topbar">
          <button
            className="icon-button"
            onClick={() => setMobileOpen(true)}
            aria-label="Buka menu"
          >
            <Menu size={22} />
          </button>
          <div>
            <strong>SIM-RP</strong>
            <small>Kejati Kalteng</small>
          </div>
        </div>
        <main className="main-content">{children}</main>
      </div>
    </div>
  );
}
