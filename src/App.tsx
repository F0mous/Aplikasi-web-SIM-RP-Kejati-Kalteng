import { useCallback, useEffect, useMemo, useState } from "react";
import AppShell, { type PageKey } from "./components/AppShell";
import { DEFAULT_SCORING_SETTINGS } from "./data/defaults";
import {
  addAuditLog,
  db,
  getScoringSettings,
  initializeDatabase,
} from "./db/database";
import AuditPage from "./pages/AuditPage";
import DashboardPage from "./pages/DashboardPage";
import EmployeesPage from "./pages/EmployeesPage";
import ImportPage from "./pages/ImportPage";
import LoginPage from "./pages/LoginPage";
import MySimkariPage from "./pages/MySimkariPage";
import RecapPage from "./pages/RecapPage";
import SettingsPage from "./pages/SettingsPage";
import { verifyPassword } from "./services/auth";
import { buildAllRecaps } from "./services/scoring";
import type {
  AppealAttendance,
  AuditLog,
  Employee,
  MySimkariAudit,
  ScoringSettings,
  WorkAttendance,
} from "./types";

const SESSION_KEY = "sim-rp-kejati-admin-session";
const currentMonth = new Date().toISOString().slice(0, 7);

export default function App() {
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(
    sessionStorage.getItem(SESSION_KEY) === "active",
  );
  const [page, setPage] = useState<PageKey>("dashboard");
  const [month, setMonth] = useState(currentMonth);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [workAttendance, setWorkAttendance] = useState<WorkAttendance[]>([]);
  const [appealAttendance, setAppealAttendance] = useState<
    AppealAttendance[]
  >([]);
  const [mySimkari, setMySimkari] = useState<MySimkariAudit[]>([]);
  const [settings, setSettings] = useState<ScoringSettings>(
    DEFAULT_SCORING_SETTINGS,
  );
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const refresh = useCallback(async () => {
    const [
      employeeRows,
      workRows,
      appealRows,
      simkariRows,
      scoringSettings,
      logs,
    ] = await Promise.all([
      db.employees.orderBy("nama").toArray(),
      db.workAttendance.toArray(),
      db.appealAttendance.toArray(),
      db.mySimkari.toArray(),
      getScoringSettings(),
      db.auditLogs.orderBy("timestamp").reverse().toArray(),
    ]);

    setEmployees(employeeRows);
    setWorkAttendance(workRows);
    setAppealAttendance(appealRows);
    setMySimkari(simkariRows);
    setSettings(scoringSettings);
    setAuditLogs(logs);
  }, []);

  useEffect(() => {
    const start = async () => {
      await initializeDatabase();
      await refresh();
      setReady(true);
    };
    void start();
  }, [refresh]);

  const recaps = useMemo(
    () =>
      buildAllRecaps(
        employees,
        month,
        workAttendance,
        appealAttendance,
        mySimkari,
        settings,
      ),
    [employees, month, workAttendance, appealAttendance, mySimkari, settings],
  );

  const login = async (
    username: string,
    password: string,
  ): Promise<boolean> => {
    const admin = await db.admins.get(username.trim());
    if (!admin) return false;
    const valid = await verifyPassword(
      password,
      admin.salt,
      admin.passwordHash,
    );
    if (!valid) return false;

    sessionStorage.setItem(SESSION_KEY, "active");
    setAuthenticated(true);
    await addAuditLog(
      "LOGIN",
      "Administrator",
      `${admin.displayName} masuk ke aplikasi.`,
    );
    await refresh();
    return true;
  };

  const logout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setAuthenticated(false);
    setPage("dashboard");
    void addAuditLog(
      "LOGOUT",
      "Administrator",
      "Administrator keluar dari aplikasi.",
    );
  };

  if (!ready) {
    return (
      <div className="loading-screen">
        <div className="loader" />
        <strong>Menyiapkan database aplikasi...</strong>
      </div>
    );
  }

  if (!authenticated) {
    return <LoginPage onLogin={login} />;
  }

  const content = {
    dashboard: (
      <DashboardPage
        month={month}
        onMonthChange={setMonth}
        recaps={recaps}
        recentLogs={auditLogs}
      />
    ),
    employees: (
      <EmployeesPage employees={employees} onChanged={refresh} />
    ),
    imports: <ImportPage onImported={refresh} />,
    mysimkari: (
      <MySimkariPage
        month={month}
        onMonthChange={setMonth}
        employees={employees}
        audits={mySimkari}
        onChanged={refresh}
      />
    ),
    recap: (
      <RecapPage
        month={month}
        onMonthChange={setMonth}
        recaps={recaps}
        settings={settings}
        onChanged={refresh}
      />
    ),
    settings: (
      <SettingsPage
        settings={settings}
        onChanged={refresh}
        onLogout={logout}
      />
    ),
    audit: <AuditPage logs={auditLogs} />,
  }[page];

  return (
    <AppShell
      page={page}
      onNavigate={setPage}
      adminName="Administrator Kejati"
      onLogout={logout}
    >
      {content}
    </AppShell>
  );
}
