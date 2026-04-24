import React, { useState, useCallback, createContext, useContext } from "react";

/* ── TOAST ── */
export const ToastContext = createContext(() => {});

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((msg, type = "info") => {
    const id = Date.now();
    const colors = { success: "#22c55e", error: "#ef4444", info: "#3b82f6", warn: "#f59e0b" };
    const icons  = { success: "✓", error: "✕", info: "ℹ", warn: "⚠" };
    setToasts((p) => [...p, { id, msg, color: colors[type], icon: icons[type] }]);
    setTimeout(() => setToasts((p) => p.map((t) => t.id === id ? { ...t, hiding: true } : t)), 3000);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3300);
  }, []);

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast${t.hiding ? " hide" : ""}`}
            style={{ borderLeft: `3px solid ${t.color}` }}>
            <span style={{ color: t.color, marginRight: 8, fontWeight: 700 }}>{t.icon}</span>
            {t.msg}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/* ── SIDEBAR ── */
const NAV_ITEMS = [
  { id: "dashboard", icon: "⊞",  label: "Dashboard" },
  { id: "coding",    icon: "{ }", label: "Practice",  badge: "13" },
  { id: "roadmap",   icon: "⬡",   label: "Roadmap",   badge: "NEW" },
  { id: "companies", icon: "◫",   label: "Companies" },
  { id: "interview", icon: "◈",   label: "Interview", badge: "HOT", badgeType: "hot" },
  { id: "analytics", icon: "▦",   label: "Analytics" },
  { id: "profile",   icon: "○",   label: "Profile" },
];

export function Sidebar({ activePage, onNav, username, onLogout, level = 1, streak = 0 }) {
  const safeInitial = username ? username.charAt(0).toUpperCase() : "D";
  const safeName    = username || "Developer";
  const lvlLabel    = level >= 30 ? "Master" : level >= 20 ? "Advanced" : level >= 10 ? "Intermediate" : level >= 5 ? "Beginner" : "Newbie";

  return (
    <aside className="sidebar">
      <div className="sidebar-logo" onClick={() => onNav("landing")}>
        <div className="logo-icon">SX</div>
        <div className="logo-text">Skill<span>X</span></div>
      </div>

      <div className="sidebar-user">
        <div className="user-avatar">{safeInitial}</div>
        <div>
          <div className="user-name">{safeName}</div>
          <div className="user-level">Lv.{level} · {lvlLabel}</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Menu</div>
        {NAV_ITEMS.map(({ id, icon, label, badge, badgeType }) => (
          <button
            key={id}
            className={`nav-item${activePage === id ? " active" : ""}`}
            onClick={() => onNav(id)}
          >
            <span className="nav-icon" style={{ fontFamily: "var(--mono)", fontSize: 14 }}>{icon}</span>
            <span>{label}</span>
            {badge && (
              <span className={`nav-badge${badgeType === "hot" ? " hot" : ""}`}>{badge}</span>
            )}
          </button>
        ))}

        <div className="nav-section-label" style={{ marginTop: 8 }}>Account</div>
        <button className="nav-item" onClick={() => onNav("landing")}>
          <span className="nav-icon">←</span>
          <span>Home</span>
        </button>
        {onLogout && (
          <button className="nav-item" style={{ color: "var(--red)" }} onClick={onLogout}>
            <span className="nav-icon">⏻</span>
            <span>Logout</span>
          </button>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="streak-display">
          <span style={{ fontSize: 22 }}>🔥</span>
          <div>
            <div className="streak-count">{streak}</div>
            <div className="streak-label">Day streak</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

/* ── TOPBAR ── */
export function Topbar({ title, subtitle, children, username }) {
  const initial = username ? username.charAt(0).toUpperCase() : "D";
  return (
    <div className="topbar">
      <div>
        <div className="topbar-title">{title}</div>
        {subtitle && <div className="topbar-sub">{subtitle}</div>}
      </div>
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
        {children}
        <div className="user-avatar" style={{ width: 30, height: 30, fontSize: 12 }}>{initial}</div>
      </div>
    </div>
  );
}

/* ── STAT CARD ── */
export function StatCard({ icon, value, label, trend, trendUp, accent }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div className="stat-val" style={{ color: accent || "var(--text-primary)" }}>{value}</div>
      <div className="stat-lbl">{label}</div>
      {trend && (
        <div className={`stat-trend ${trendUp ? "trend-up" : "trend-dn"}`}>{trend}</div>
      )}
    </div>
  );
}

/* ── DIFF TAG ── */
export function DiffTag({ difficulty }) {
  const cls = difficulty === "Easy" ? "easy" : difficulty === "Medium" ? "medium" : "hard";
  return <span className={`tag tag-${cls}`}>{difficulty}</span>;
}

/* ── PROGRESS BAR ── */
export function ProgressBar({ value, max, color }) {
  const pct = max ? Math.round((value / max) * 100) : 0;
  return (
    <div className="progress-track">
      <div className="progress-fill" style={{ width: `${pct}%`, background: color || "var(--green)" }} />
    </div>
  );
}