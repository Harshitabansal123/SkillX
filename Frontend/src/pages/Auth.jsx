import React, { useState, useEffect, useContext } from "react";
import { ToastContext } from "../components/shared.jsx";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const AuthPage = ({ mode, onNav, onAuth }) => {
  const toast = useContext(ToastContext);
  const [loading, setLoading] = useState(false);
  const [pw, setPw] = useState("");
  const [errs, setErrs] = useState({});
  const isLogin = mode === "login";

  // Google OAuth
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: "116466753701-aub28iau8h2n1p9cpiaqvtlrdkva99un.apps.googleusercontent.com",
          callback: handleGoogle,
        });
        window.google.accounts.id.renderButton(
          document.getElementById("g-btn"),
          { theme: "filled_black", size: "large", width: "100%", text: "continue_with" }
        );
      }
    };
    document.body.appendChild(script);
    return () => { try { document.body.removeChild(script); } catch (e) {} };
  }, []);

  const handleGoogle = async (res) => {
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/auth/google/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: res.credential }),
      });
      const d = await r.json();
      if (d.token) {
        localStorage.setItem("skillx_token", d.token);
        localStorage.setItem("skillx_username", d.username);
        onAuth(d.username);
        toast("Welcome back!", "success");
      } else {
        setErrs({ api: d.error || "Google login failed" });
      }
    } catch {
      setErrs({ api: "Backend not reachable" });
    } finally {
      setLoading(false);
    }
  };

  const strength = (v) => {
    let s = 0;
    if (v.length >= 8) s++;
    if (/[A-Z]/.test(v)) s++;
    if (/[0-9]/.test(v)) s++;
    if (/[^A-Za-z0-9]/.test(v)) s++;
    return s;
  };
  const swColors = ["", "#ef4444", "#f59e0b", "#3b82f6", "#22c55e"];
  const swLabels = ["", "Weak", "Fair", "Good", "Strong"];

  const submit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const pass = fd.get("pass") || "";
    const errsNew = {};
    if (isLogin) {
      if (!fd.get("username")?.trim()) errsNew.username = "Username required";
    } else {
      if (!fd.get("email")?.includes("@")) errsNew.email = "Valid email required";
      if (pass.length < 8) errsNew.pass = "Min 8 characters";
      if (fd.get("confirm") !== pass) errsNew.confirm = "Passwords don't match";
    }
    if (Object.keys(errsNew).length) { setErrs(errsNew); return; }
    setErrs({});
    setLoading(true);

    try {
      const endpoint = isLogin ? "/login/" : "/signup/";
      const payload  = isLogin
        ? { username: fd.get("username"), password: pass }
        : { username: fd.get("fname") || fd.get("email").split("@")[0], email: fd.get("email"), password: pass };

      const r = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Something went wrong");

      if (d.token) localStorage.setItem("skillx_token", d.token);
      if (d.refresh) localStorage.setItem("skillx_refresh", d.refresh);
      const name = d.username || payload.username;
      localStorage.setItem("skillx_username", name);
      onAuth(name);
      toast(isLogin ? `Welcome back, ${name}!` : `Account created! Welcome, ${name}!`, "success");
      onNav("dashboard");
    } catch (err) {
      setErrs({ api: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page page-enter">
      {/* Subtle glow blobs */}
      <div className="auth-glow" style={{ width: 400, height: 400, background: "rgba(34,197,94,.04)", top: -100, left: -100 }} />
      <div className="auth-glow" style={{ width: 300, height: 300, background: "rgba(59,130,246,.03)", bottom: -80, right: -80 }} />

      <div className="auth-card">
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24, cursor: "pointer" }} onClick={() => onNav("landing")}>
          <div className="logo-icon" style={{ width: 28, height: 28, fontSize: 11, background: "var(--green)", borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#000", fontFamily: "var(--mono)" }}>SX</div>
          <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>Skill<span style={{ color: "var(--green)" }}>X</span></span>
        </div>

        <h1 className="auth-title">{isLogin ? "Welcome back" : "Create account"}</h1>
        <p className="auth-sub">{isLogin ? "Sign in to continue your practice" : "Join 50K+ developers levelling up"}</p>

        {errs.api && (
          <div style={{ padding: "10px 14px", background: "#ef44440a", border: "1px solid #ef444430", borderRadius: 8, color: "var(--red)", fontSize: 12, fontWeight: 500, marginBottom: 16 }}>
            ⚠ {errs.api}
          </div>
        )}

        {/* Google */}
        <div id="g-btn" style={{ width: "100%", marginBottom: 4 }} />
        <div className="divider"><hr /><span>or</span><hr /></div>

        <form onSubmit={submit}>
          {!isLogin && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
              <div>
                <label className="form-label">First name</label>
                <input name="fname" className="input" placeholder="Arjun" />
              </div>
              <div>
                <label className="form-label">Last name</label>
                <input name="lname" className="input" placeholder="Mehta" />
              </div>
            </div>
          )}

          {isLogin ? (
            <div className="form-group">
              <label className="form-label">Username</label>
              <input name="username" className="input" placeholder="your_username" required />
              {errs.username && <div className="form-error">{errs.username}</div>}
            </div>
          ) : (
            <div className="form-group">
              <label className="form-label">Email</label>
              <input name="email" type="email" className="input" placeholder="you@example.com" required />
              {errs.email && <div className="form-error">{errs.email}</div>}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Password</label>
            <input name="pass" type="password" className="input" placeholder={isLogin ? "Your password" : "8+ characters"} required value={pw} onChange={(e) => setPw(e.target.value)} />
            {!isLogin && pw && (
              <>
                <div className="pw-strength">
                  <div className="pw-fill" style={{ width: `${strength(pw) * 25}%`, background: swColors[strength(pw)] }} />
                </div>
                <div style={{ fontSize: 11, color: swColors[strength(pw)], marginTop: 3 }}>{swLabels[strength(pw)]}</div>
              </>
            )}
            {errs.pass && <div className="form-error">{errs.pass}</div>}
          </div>

          {!isLogin && (
            <div className="form-group">
              <label className="form-label">Confirm password</label>
              <input name="confirm" type="password" className="input" placeholder="Repeat password" required />
              {errs.confirm && <div className="form-error">{errs.confirm}</div>}
            </div>
          )}

          {isLogin && (
            <div style={{ textAlign: "right", marginBottom: 14 }}>
              <span style={{ fontSize: 12, color: "var(--green)", cursor: "pointer" }}>Forgot password?</span>
            </div>
          )}

          <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 4 }} disabled={loading}>
            {loading ? <><div className="spinner" /> Processing…</> : (isLogin ? "Sign in →" : "Create account →")}
          </button>
        </form>

        <div className="auth-switch">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <a onClick={() => onNav(isLogin ? "signup" : "login")}>{isLogin ? "Sign up →" : "Sign in →"}</a>
        </div>
        <div style={{ textAlign: "center", marginTop: 10 }}>
          <span style={{ fontSize: 12, color: "var(--text-muted)", cursor: "pointer" }} onClick={() => onNav("landing")}>← Back to home</span>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;