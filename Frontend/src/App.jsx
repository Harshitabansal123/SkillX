import "./styles.css";
import React, { useState, useEffect, lazy, Suspense } from "react";
import { ToastProvider } from "./components/shared.jsx";
import AIAssistant from "./components/AIAssistant.jsx";
import Landing from "./pages/Landing.jsx";
import AuthPage from "./pages/Auth.jsx";
import { Dashboard, Analytics, ProfilePage } from "./pages/DashboardPages.jsx";

const CodingPage    = lazy(() => import("./pages/Coding.jsx"));
const RoadmapPage   = lazy(() => import("./pages/Roadmap.jsx"));
const CompaniesPage = lazy(() => import("./pages/Companies.jsx"));
const Interview     = lazy(() => import("./pages/Interview.jsx"));

const DASHBOARD_PAGES = ["dashboard","coding","roadmap","companies","interview","analytics","profile"];

function PageLoader() {
  return (
    <div style={{ display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",color:"var(--text-muted)",fontSize:14,gap:10 }}>
      <div className="spinner" style={{ borderTopColor:"var(--green)",borderColor:"rgba(34,197,94,.2)" }} />
      Loading…
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState(() => {
    try {
      const saved = localStorage.getItem("skillx_page");
      return DASHBOARD_PAGES.includes(saved) ? saved : "landing";
    } catch { return "landing"; }
  });

  const [username, setUsername] = useState(() => {
    try { return localStorage.getItem("skillx_username") || ""; } catch { return ""; }
  });

  const displayName = username?.trim() || "Developer";
  const level  = Number(localStorage.getItem("skillx_level"))  || 1;
  const streak = Number(localStorage.getItem("skillx_streak")) || 0;

  const onNav = (p) => {
    setPage(p);
    window.scrollTo(0, 0);
    try {
      if (DASHBOARD_PAGES.includes(p)) localStorage.setItem("skillx_page", p);
      else localStorage.removeItem("skillx_page");
    } catch {}
  };

  const onAuth = (name) => {
    const safe = name?.trim() || "Developer";
    setUsername(safe);
    try { localStorage.setItem("skillx_username", safe); } catch {}
  };

  const onLogout = () => {
    ["skillx_token","skillx_refresh","skillx_username","skillx_page"].forEach((k) => {
      try { localStorage.removeItem(k); } catch {}
    });
    setUsername("");
    setPage("landing");
  };

  const dashProps = { onNav, username: displayName, onLogout, userLevel: level, userStreak: streak };

  const renderPage = () => {
    switch (page) {
      case "landing":   return <Landing onNav={onNav} />;
      case "login":     return <AuthPage mode="login"  onNav={onNav} onAuth={onAuth} />;
      case "signup":    return <AuthPage mode="signup" onNav={onNav} onAuth={onAuth} />;
      case "dashboard": return <Dashboard {...dashProps} />;
      case "coding":    return <Suspense fallback={<PageLoader />}><CodingPage {...dashProps} /></Suspense>;
      case "roadmap":   return <Suspense fallback={<PageLoader />}><RoadmapPage {...dashProps} /></Suspense>;
      case "companies": return <Suspense fallback={<PageLoader />}><CompaniesPage {...dashProps} /></Suspense>;
      case "interview": return <Suspense fallback={<PageLoader />}><Interview {...dashProps} /></Suspense>;
      case "analytics": return <Analytics {...dashProps} />;
      case "profile":   return <ProfilePage {...dashProps} />;
      default:          return <Landing onNav={onNav} />;
    }
  };

  const showAI = DASHBOARD_PAGES.includes(page) && page !== "landing";

  return (
    <ToastProvider>
      {renderPage()}
      {showAI && (
        <AIAssistant
          currentPage={page}
          currentProblem={page === "coding" ? "Two Sum" : null}
        />
      )}
    </ToastProvider>
  );
}