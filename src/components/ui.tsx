import type { ReactNode } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Database,
  type LucideIcon,
} from "lucide-react";
import type { RecommendationLevel } from "../types";

export function cx(
  ...classes: Array<string | false | null | undefined>
): string {
  return classes.filter(Boolean).join(" ");
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <header className="page-header">
      <div>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actions ? <div className="page-actions">{actions}</div> : null}
    </header>
  );
}

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={cx("card", className)}>{children}</section>;
}

export function CardHeader({
  icon: Icon,
  title,
  description,
  actions,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="card-header">
      <div className="card-title-wrap">
        {Icon ? (
          <span className="card-icon">
            <Icon size={20} />
          </span>
        ) : null}
        <div>
          <h2>{title}</h2>
          {description ? <p>{description}</p> : null}
        </div>
      </div>
      {actions ? <div className="card-actions">{actions}</div> : null}
    </div>
  );
}

export function StatCard({
  label,
  value,
  helper,
  icon: Icon,
  tone = "green",
}: {
  label: string;
  value: string | number;
  helper: string;
  icon: LucideIcon;
  tone?: "green" | "blue" | "amber" | "red" | "violet" | "slate";
}) {
  return (
    <Card className="stat-card">
      <div>
        <p className="stat-label">{label}</p>
        <strong>{value}</strong>
        <p className="stat-helper">{helper}</p>
      </div>
      <span className={`stat-icon stat-icon--${tone}`}>
        <Icon size={23} />
      </span>
    </Card>
  );
}

const levelClass: Record<RecommendationLevel, string> = {
  reward: "badge--reward",
  good: "badge--good",
  coaching: "badge--coaching",
  warning: "badge--warning",
  discipline: "badge--discipline",
  incomplete: "badge--incomplete",
};

export function RecommendationBadge({
  level,
  label,
}: {
  level: RecommendationLevel;
  label: string;
}) {
  return <span className={cx("badge", levelClass[level])}>{label}</span>;
}

export function ScorePill({ value }: { value: number | null }) {
  if (value === null) {
    return <span className="score-pill score-pill--empty">—</span>;
  }

  const tone =
    value >= 90
      ? "excellent"
      : value >= 80
        ? "good"
        : value >= 70
          ? "fair"
          : value >= 60
            ? "warning"
            : "danger";

  return (
    <span className={`score-pill score-pill--${tone}`}>
      {value.toFixed(2)}
    </span>
  );
}

export function MonthField({
  value,
  onChange,
  label = "Periode",
}: {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}) {
  return (
    <label className="field month-field">
      <span>{label}</span>
      <input
        type="month"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

export function EmptyState({
  title,
  description,
  icon: Icon = Database,
}: {
  title: string;
  description: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="empty-state">
      <span>
        <Icon size={28} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

export function Notice({
  type,
  children,
}: {
  type: "success" | "warning" | "danger" | "info";
  children: ReactNode;
}) {
  const Icon = type === "success" ? CheckCircle2 : AlertCircle;
  return (
    <div className={`notice notice--${type}`}>
      <Icon size={18} />
      <div>{children}</div>
    </div>
  );
}

export function Modal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="icon-button" onClick={onClose} aria-label="Tutup">
            ×
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
