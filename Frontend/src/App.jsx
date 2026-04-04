import "./styles.css";
import React, { useState, useEffect, useRef, useCallback } from "react";

/* ─────────────────────────────────────────
   SKILLX — React Coding Platform
   Font: Syne (display) + JetBrains Mono (code)
   Palette: Obsidian · Plasma Violet · Acid Green · Crimson
───────────────────────────────────────── */


/* ── GLOBAL STYLES ── */
// Styles loaded from styles.css


/* ─────────────────────────────────────────
   API CONFIG — Django Backend
───────────────────────────────────────── */
const API_BASE = "http://localhost:8000/api";

const apiCall = async (endpoint, method = "GET", body = null, requiresAuth = false) => {
  const headers = { "Content-Type": "application/json" };
  if (requiresAuth) {
    const token = localStorage.getItem("skillx_token");
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Something went wrong");
  return data;
};

/* ─────────────────────────────────────────
   CANVAS: Plasma + Constellation + Particles
───────────────────────────────────────── */
const SkillXCanvas = () => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let W, H, t = 0, raf;
    const resize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);

    /* Stars */
    const stars = Array.from({ length: 160 }, () => ({
      x: Math.random(), y: Math.random(), r: Math.random() * 1.3 + .2,
      spd: Math.random() * .005 + .001, phase: Math.random() * Math.PI * 2,
    }));

    /* Constellation nodes */
    const nodes = Array.from({ length: 48 }, () => ({
      x: Math.random(), y: Math.random(),
      vx: (Math.random() - .5) * .0003, vy: (Math.random() - .5) * .0003,
    }));

    /* Plasma blobs */
    const blobs = [
      { cx: .15, cy: .25, r: .35, c: "rgba(124,58,237,", spd: .0004, phase: 0 },
      { cx: .75, cy: .65, r: .3,  c: "rgba(192,132,252,", spd: .0003, phase: 2 },
      { cx: .5,  cy: .8,  r: .25, c: "rgba(163,230,53,",  spd: .0005, phase: 4 },
      { cx: .85, cy: .2,  r: .2,  c: "rgba(56,189,248,",  spd: .0004, phase: 1 },
    ];

    /* Floating code particles */
    const codeChars = ["{}","=>","//","&&","||","fn","[]","<>","++","::","**","??"];
    const particles = Array.from({ length: 22 }, (_, i) => ({
      x: Math.random() * W, y: Math.random() * H,
      char: codeChars[i % codeChars.length],
      a: Math.random() * .18 + .04,
      spd: Math.random() * .3 + .1,
      drift: (Math.random() - .5) * .3,
      size: Math.floor(Math.random() * 4) + 10,
    }));

    const loop = () => {
      t++;
      ctx.clearRect(0, 0, W, H);

      /* bg */
      const bg = ctx.createRadialGradient(W * .5, H * .4, 0, W * .5, H * .5, H);
      bg.addColorStop(0, "rgba(14,10,28,.97)");
      bg.addColorStop(1, "rgba(6,6,8,1)");
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

      /* plasma blobs */
      blobs.forEach(b => {
        const cx = (b.cx + Math.sin(t * b.spd + b.phase) * .12) * W;
        const cy = (b.cy + Math.cos(t * b.spd * 1.4 + b.phase) * .09) * H;
        const r  = b.r * Math.min(W, H) * .9;
        const g  = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        g.addColorStop(0, b.c + ".065)");
        g.addColorStop(.5, b.c + ".02)");
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
      });

      /* stars */
      stars.forEach(s => {
        const a = .2 + .7 * (Math.sin(t * s.spd * 60 + s.phase) * .5 + .5);
        ctx.beginPath();
        ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200,200,255,${a * .5})`;
        ctx.fill();
      });

      /* constellation */
      nodes.forEach(n => {
        n.x = (n.x + n.vx + 1) % 1;
        n.y = (n.y + n.vy + 1) % 1;
      });
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = (nodes[i].x - nodes[j].x) * W;
          const dy = (nodes[i].y - nodes[j].y) * H;
          const d  = Math.sqrt(dx * dx + dy * dy);
          if (d < 150) {
            ctx.beginPath();
            ctx.moveTo(nodes[i].x * W, nodes[i].y * H);
            ctx.lineTo(nodes[j].x * W, nodes[j].y * H);
            ctx.strokeStyle = `rgba(168,85,247,${(1 - d / 150) * .1})`;
            ctx.lineWidth = .7; ctx.stroke();
          }
        }
        ctx.beginPath();
        ctx.arc(nodes[i].x * W, nodes[i].y * H, 1.2, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(168,85,247,.22)"; ctx.fill();
      }

      /* floating code particles */
      particles.forEach(p => {
        p.y -= p.spd; p.x += p.drift;
        if (p.y < -20) { p.y = H + 20; p.x = Math.random() * W; }
        if (p.x < -40 || p.x > W + 40) p.drift *= -1;
        ctx.font = `${p.size}px 'JetBrains Mono', monospace`;
        ctx.fillStyle = `rgba(163,230,53,${p.a})`;
        ctx.fillText(p.char, p.x, p.y);
      });

      /* scan line */
      const sy = (t * .35) % H;
      const sg = ctx.createLinearGradient(0, sy - 3, 0, sy + 3);
      sg.addColorStop(0, "rgba(124,58,237,0)");
      sg.addColorStop(.5, "rgba(124,58,237,.035)");
      sg.addColorStop(1, "rgba(124,58,237,0)");
      ctx.fillStyle = sg; ctx.fillRect(0, sy - 3, W, 6);

      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas id="skillx-canvas" ref={canvasRef} />;
};

/* ─────────────────────────────────────────
   TOAST
───────────────────────────────────────── */
const ToastContext = React.createContext(() => {});
const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((msg, color = "#a855f7") => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, color }]);
    setTimeout(() => setToasts(p => p.map(t => t.id === id ? { ...t, hiding: true } : t)), 3200);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3550);
  }, []);
  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div style={{ position: "fixed", bottom: 28, right: 28, zIndex: 9999, display: "flex", flexDirection: "column", gap: 10 }}>
        {toasts.map(t => (
          <div key={t.id} className={`toast${t.hiding ? " hiding" : ""}`} style={{ "--grad": `linear-gradient(${t.color},${t.color})` }}>
            {t.msg}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

/* ─────────────────────────────────────────
   SCROLL REVEAL HOOK
───────────────────────────────────────── */
const useReveal = () => {
  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      entries.forEach((e, i) => {
        if (e.isIntersecting) {
          setTimeout(() => e.target.classList.add("visible"), i * 70);
        }
      });
    }, { threshold: 0.07 });
    document.querySelectorAll(".reveal").forEach(el => obs.observe(el));
    return () => obs.disconnect();
  });
};

/* ─────────────────────────────────────────
   NAVBAR
───────────────────────────────────────── */
const Navbar = ({ onNav }) => {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);
  return (
    <nav className={`navbar${scrolled ? " scrolled" : ""}`}>
      <div className="nav-inner">
        <div className="nav-logo" onClick={() => onNav("landing")}>
          <div className="nav-logo-icon">&lt;/&gt;</div>
          <span>Skill<span className="grad-text">X</span></span>
        </div>
        <div className="nav-links">
          {["Features","How It Works"].map(l => (
            <button key={l} className="nav-link" onClick={() => {
              onNav("landing");
              setTimeout(() => {
                const el = document.getElementById(l === "Features" ? "features" : "how");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }, 80);
            }}>{l}</button>
          ))}
          <button className="btn btn-ghost btn-sm" onClick={() => onNav("login")}>Sign In</button>
          <button className="btn btn-primary btn-sm" onClick={() => onNav("signup")}>Get Started</button>
        </div>
      </div>
    </nav>
  );
};

/* ─────────────────────────────────────────
   LANDING PAGE
───────────────────────────────────────── */
const Landing = ({ onNav }) => {
  useReveal();
  return (
    <div className="page-enter" style={{ position: "relative", zIndex: 1 }}>
      <Navbar onNav={onNav} />

      {/* HERO */}
      <section className="hero-section">
        <div className="orb o1" />
        <div className="orb o2" />
        <div style={{ flex: 1, maxWidth: 640, position: "relative", zIndex: 2 }}>
          <div className="hero-badge">
            <span className="live-dot" />
            AI-Powered · Real-time Analysis · Adaptive Learning
          </div>
          <h1 className="hero-title">
            <span className="hero-line">Write</span>
            <span className="hero-line">Better</span>
            <span className="hero-line">Code.</span>
            <span className="hero-line grad-text">Land the Job.</span>
          </h1>
          <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.75, marginBottom: 42 }}>
            The platform that <em style={{ color: "var(--p3)", fontStyle: "normal", fontWeight: 700 }}>adapts to you</em> — AI-powered feedback, resume-matched interviews, and intelligent problem selection to get you hired faster.
          </p>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 52 }}>
            <button className="btn btn-acid btn-xl" onClick={() => onNav("signup")}>
              Start for Free →
            </button>
            <button className="btn btn-outline btn-xl" onClick={() => onNav("login")}>
              View Dashboard
            </button>
          </div>
          <div className="stats-row">
            {[["50K+","Developers"],["2.4M","Problems Solved"],["98%","Interview Rate"]].map(([v, l], i) => (
              <React.Fragment key={l}>
                {i > 0 && <div className="stat-div" />}
                <div className="stat-item">
                  <strong className="stat-val acid-text">{v}</strong>
                  <span className="stat-lbl">{l}</span>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Code card */}
        <div style={{ flex: 1, maxWidth: 500, position: "relative", zIndex: 2 }}>
          <div className="code-card">
            <div className="code-header">
              <div className="dot dot-r" /><div className="dot dot-y" /><div className="dot dot-g" />
              <span style={{ marginLeft: 8, fontSize: 12, color: "var(--muted)", fontFamily: "var(--mono)" }}>solution.py</span>
              <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--acid)", fontWeight: 700, fontFamily: "var(--mono)", animation: "dotPulse 2s infinite" }}>● AI LIVE</span>
            </div>
            <div className="code-body">
              <div><span className="token-kw">def </span><span className="token-fn2">twoSum</span><span style={{ color: "#6060aa" }}>(nums: </span><span className="token-def">list</span><span style={{ color: "#6060aa" }}>, target: </span><span className="token-def">int</span><span style={{ color: "#6060aa" }}>) -&gt; </span><span className="token-def">list</span><span style={{ color: "#6060aa" }}>:</span></div>
              <div style={{ paddingLeft: 20 }}><span className="token-cm"># AI: O(n²) → optimised to O(n)</span></div>
              <div style={{ paddingLeft: 20 }}><span className="token-fn">seen</span><span style={{ color: "#6060aa" }}> = </span><span style={{ color: "#6060aa" }}>{"{}"}</span></div>
              <div style={{ paddingLeft: 20 }}><span className="token-kw">for </span><span className="token-fn">i, num </span><span className="token-kw">in </span><span className="token-fn2">enumerate</span><span style={{ color: "#6060aa" }}>(nums):</span></div>
              <div style={{ paddingLeft: 40 }}><span className="token-fn">comp</span><span style={{ color: "#6060aa" }}> = target - num</span></div>
              <div style={{ paddingLeft: 40 }}><span className="token-kw">if </span><span className="token-fn">comp </span><span className="token-kw">in </span><span className="token-fn">seen</span><span style={{ color: "#6060aa" }}>:</span></div>
              <div style={{ paddingLeft: 60 }}><span className="token-kw">return </span><span style={{ color: "#6060aa" }}>[seen[comp], i]</span></div>
              <div style={{ paddingLeft: 40 }}><span className="token-fn">seen</span><span style={{ color: "#6060aa" }}>[num] = i</span></div>
              <div style={{ paddingLeft: 20 }}><span className="cursor-blink" /></div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 16px", background: "rgba(0,0,0,.25)", borderTop: "1px solid var(--border)" }}>
              <span className="score-pill">✦ 94/100</span>
              <span style={{ fontSize: 12, color: "var(--muted)" }}>Excellent hash-map approach</span>
            </div>
            <div className="metric-row">
              {[["O(n)","Time"],["O(n)","Space"],["142/142","Tests"]].map(([v, l]) => (
                <div className="metric" key={l}>
                  <div className="metric-val acid-text">{v}</div>
                  <div className="metric-lbl">{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="section" id="features">
        <div className="section-eye grad-text">⚡ FEATURES</div>
        <h2 className="section-title">Everything You Need to <span className="grad-text">Level Up</span></h2>
        <p className="section-sub">Three AI-powered tools. One platform. Infinite growth.</p>
        <div className="features-grid">
          {[
            { icon: "🧠", title: "AI Code Analyzer", desc: "Get instant feedback on time complexity, space complexity, edge cases, and code quality — like a senior engineer reviewing your PR in real time.", foot: "INSTANT · PRECISE · DEEP", bg: "rgba(124,58,237,.1)", border: "rgba(124,58,237,.14)" },
            { icon: "🎯", title: "Adaptive Learning", featured: true, badge: "✦ Most Popular", desc: "Our AI maps your weak spots daily and serves problems calibrated to push you exactly at the right difficulty level. Pure compounding growth.", foot: "ADAPTIVE · SMART · DAILY", bg: "linear-gradient(135deg,rgba(124,58,237,.08),rgba(163,230,53,.05))", border: "rgba(124,58,237,.25)" },
            { icon: "📄", title: "Resume Interviews", desc: "Upload your resume. AI extracts your tech stack and generates hyper-relevant questions — simulating exactly what FAANG companies ask.", foot: "FAANG-READY · CUSTOM · REAL", bg: "rgba(163,230,53,.06)", border: "rgba(163,230,53,.12)" },
          ].map(({ icon, title, desc, foot, bg, border, featured, badge }) => (
            <div key={title} className={`feature-card reveal${featured ? " featured" : ""}`} style={{ background: bg, borderColor: border }}>
              {badge && <div style={{ position: "absolute", top: 16, right: 16, background: "var(--grad)", color: "#fff", fontSize: 10, fontWeight: 800, padding: "4px 12px", borderRadius: 999, fontFamily: "var(--mono)", letterSpacing: ".5px" }}>{badge}</div>}
              <div className="feature-icon" style={{ background: bg, border: `1px solid ${border}` }}>{icon}</div>
              <h3>{title}</h3>
              <p>{desc}</p>
              <div className="feature-foot acid-text">{foot}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="section" id="how" style={{ paddingTop: 0 }}>
        <div className="section-eye grad-text">🚀 PROCESS</div>
        <h2 className="section-title">From Zero to <span className="acid-text">Hired</span></h2>
        <div className="steps-row">
          {[["01","👤","Create Profile","Sign up and upload your resume. AI builds your personalized coding roadmap instantly."],
            ["02","💻","Practice Daily","Solve AI-curated problems. Get instant feedback. Climb difficulty automatically."],
            ["03","📊","Track Progress","Visualize your growth. See streaks, heatmaps and weak-spot analysis."],
            ["04","🏆","Ace Interviews","Mock interviews powered by your resume. Practice with exactly the right questions."]
          ].map(([n, icon, title, desc], i) => (
            <React.Fragment key={n}>
              {i > 0 && <div className="step-arrow">→</div>}
              <div className="step-card reveal">
                <div className="step-num grad-text">{n}</div>
                <div className="step-icon">{icon}</div>
                <h4>{title}</h4>
                <p>{desc}</p>
              </div>
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="section-eye grad-text">💬 TESTIMONIALS</div>
        <h2 className="section-title">Developers Who <span className="grad-text">Made It</span></h2>
        <div className="testi-grid">
          {[
            { q: "SkillX completely changed how I prep. The AI feedback caught inefficiencies I never would have spotted. Got my Google offer after 6 weeks.", name: "Arjun Mehta", role: "SWE @ Google", av: "A", c: "#7c3aed,#a855f7" },
            { q: "The resume interview feature is next level. It generated questions based on my actual stack. Every real interview question was covered.", name: "Sara Kim", role: "ML Engineer @ Meta", av: "S", c: "#f43f5e,#a855f7" },
            { q: "Went from barely solving mediums to confidently tackling hards in 2 months. The adaptive difficulty is insanely well-calibrated.", name: "Ravi Patel", role: "Backend Eng @ Amazon", av: "R", c: "#a3e635,#38bdf8" },
          ].map(({ q, name, role, av, c }) => (
            <div key={name} className="testi-card reveal">
              <p className="testi-quote">{q}</p>
              <div className="testi-author">
                <div className="avatar" style={{ background: `linear-gradient(135deg,#${c.split(",")[0].replace("#","")},#${c.split(",")[1].replace("#","")})` }}>{av}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{name}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 1 }}>{role}</div>
                </div>
              </div>
              <div className="testi-stars">★★★★★</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="cta-glow" />
        <div className="cta-box glass reveal">
          <div style={{ fontSize: 38, marginBottom: 20 }}>✦ 〈/〉 ✦</div>
          <h2>Ready to <span className="grad-text">Level Up</span> Your Career?</h2>
          <p>Join 50,000+ developers who cracked FAANG with SkillX</p>
          <button className="btn btn-acid btn-xl" onClick={() => onNav("signup")}>Initialize Career.exe →</button>
          <p className="cta-note">No credit card required · Cancel anytime</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="nav-logo" style={{ cursor: "default" }}>
            <div className="nav-logo-icon">&lt;/&gt;</div>
            <span>Skill<span className="grad-text">X</span></span>
          </div>
          <div className="footer-links">
            {["Privacy","Terms","Blog","Contact","GitHub"].map(l => <span key={l} className="footer-link">{l}</span>)}
          </div>
          <p style={{ color: "var(--muted)", fontSize: 13 }}>© 2025 SkillX — Built for developers who ship</p>
        </div>
      </footer>
    </div>
  );
};

/* ─────────────────────────────────────────
   AUTH
───────────────────────────────────────── */
const AuthPage = ({ mode, onNav, onAuth }) => {
  const toast = React.useContext(ToastContext);
  const [loading, setLoading] = useState(false);
  const [pwVal, setPwVal] = useState("");
  const [errs, setErrs] = useState({});
  const isLogin = mode === "login";
  const GOOGLE_CLIENT_ID = "116466753701-aub28iau8h2n1p9cpiaqvtlrdkva99un.apps.googleusercontent.com";

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleLogin,
        });
        window.google.accounts.id.renderButton(
          document.getElementById("google-signin-btn"),
          { theme:"outline", size:"large", width:"100%", text:"continue_with" }
        );
      }
    };
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  const handleGoogleLogin = async (response) => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/auth/google/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: response.credential }),
      });
      const data = await res.json();
      if (data.token) {
        localStorage.setItem("skillx_token",    data.token);
        localStorage.setItem("skillx_username", data.username);
        onAuth(data.username);
        toast("✅ Google Sign-in successful!", "#a3e635");
      } else {
        setErrs({ api: data.error || "Google login failed" });
      }
    } catch(err) {
      setErrs({ api: "Backend not connected. Start Django server!" });
    } finally {
      setLoading(false);
    }
  };

  const getStrength = (v) => {
    let s = 0;
    if (v.length >= 8) s++;
    if (/[A-Z]/.test(v)) s++;
    if (/[0-9]/.test(v)) s++;
    if (/[^A-Za-z0-9]/.test(v)) s++;
    return s;
  };
  const strengthColors = ["", "#f43f5e", "#fbbf24", "#818cf8", "#a3e635"];
  const strengthLabels = ["", "Weak", "Fair", "Good", "Strong ✦"];

  const submit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const email    = fd.get("email")    || "";
    const pass     = fd.get("pass")     || "";
    const fname    = fd.get("fname")    || "";
    const confirm  = fd.get("confirm")  || "";

    // Frontend validation
    const errsNew = {};
    if (isLogin) {
      const uname = fd.get("username") || "";
      if (!uname.trim()) errsNew.email = "Username is required";
    } else {
      if (!email.includes("@")) errsNew.email = "Enter a valid email address";
    }
    if (pass.length < (isLogin ? 5 : 8)) errsNew.pass = `Password must be ${isLogin ? "5" : "8"}+ characters`;
    if (!isLogin && confirm !== pass) errsNew.confirm = "Passwords do not match";
    if (Object.keys(errsNew).length) { setErrs(errsNew); return; }
    setErrs({});
    setLoading(true);

    try {
      let data;
      if (isLogin) {
        // Real login API call — use username field directly
        const usernameField = fd.get("username") || "";
        data = await apiCall("/login/", "POST", {
          username: usernameField,
          password: pass,
        });
      } else {
        // Real signup API call
        data = await apiCall("/signup/", "POST", {
          username: fname || email.split("@")[0],
          email:    email,
          password: pass,
        });
      }

      // Store JWT token — Fix #8
      if (data.token) {
        try { localStorage.setItem("skillx_token", data.token); } catch(e) {}
      }

      const name = data.username || email.split("@")[0];
      onAuth(name);
      toast(
        isLogin ? `✦ Welcome back, ${name}!` : `✦ Account created! Welcome, ${name}!`,
        isLogin ? "#a855f7" : "#a3e635"
      );
      onNav("dashboard");

    } catch (err) {
      // Fix #10 — show real backend error
      setErrs({ api: err.message || "Server error. Is backend running?" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page page-enter">
      <div className="oa1" style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", filter: "blur(110px)", top: -100, left: -100, background: "rgba(124,58,237,.09)", pointerEvents: "none" }} />
      <div className="oa2" style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", filter: "blur(110px)", bottom: -80, right: -80, background: "rgba(163,230,53,.06)", pointerEvents: "none" }} />
      <div className="auth-card glass" style={{ zIndex: 1 }}>
        <div className="nav-logo" style={{ marginBottom: 8 }} onClick={() => onNav("landing")}>
          <div className="nav-logo-icon" style={{ width: 26, height: 26, fontSize: 12 }}>&lt;/&gt;</div>
          <span style={{ fontSize: 17 }}>Skill<span className="grad-text">X</span></span>
        </div>
        <h2 className="auth-title">{isLogin ? "Welcome Back, Dev ✦" : "Access Granted ✦"}</h2>
        <p className="auth-sub">{isLogin ? "Authenticate to continue" : "Join 50K+ developers levelling up"}</p>
        {/* Fix #10 — show backend/API errors */}
        {errs.api && (
          <div style={{ padding:"10px 14px", background:"rgba(244,63,94,.08)", border:"1px solid rgba(244,63,94,.25)", borderRadius:10, color:"#f43f5e", fontSize:13, fontWeight:600, marginBottom:16 }}>
            ⚠️ {errs.api}
          </div>
        )}

        <div id="google-signin-btn" style={{ width:"100%", marginBottom:4 }}></div>

        <div className="divider"><hr /><span>or use email</span><hr /></div>

        <form onSubmit={submit}>
          {!isLogin && (
            <div className="two-col">
              <div className="form-group">
                <label className="form-label">First Name</label>
                <div className="input-wrap"><span>👤</span><input name="fname" placeholder="Arjun" /></div>
              </div>
              <div className="form-group">
                <label className="form-label">Last Name</label>
                <div className="input-wrap"><span>👤</span><input name="lname" placeholder="Mehta" /></div>
              </div>
            </div>
          )}
          {isLogin ? (
            <div className="form-group">
              <label className="form-label">Username</label>
              <div className="input-wrap"><span>👤</span><input name="username" placeholder="Your username" required /></div>
              {errs.email && <span className="form-error">{errs.email}</span>}
            </div>
          ) : (
            <div className="form-group">
              <label className="form-label">Email</label>
              <div className="input-wrap"><span>✉</span><input name="email" type="email" placeholder="you@example.com" required /></div>
              {errs.email && <span className="form-error">{errs.email}</span>}
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-wrap"><span>🔒</span><input name="pass" type="password" placeholder={isLogin ? "Your password" : "Min. 8 characters"} required value={pwVal} onChange={e => setPwVal(e.target.value)} /></div>
            {!isLogin && pwVal && (
              <>
                <div className="strength-bar"><div className="strength-fill" style={{ width: `${getStrength(pwVal) * 25}%`, background: strengthColors[getStrength(pwVal)] }} /></div>
                <span style={{ fontSize: 11, color: strengthColors[getStrength(pwVal)], fontWeight: 600, marginTop: 4 }}>{strengthLabels[getStrength(pwVal)]}</span>
              </>
            )}
            {errs.pass && <span className="form-error">{errs.pass}</span>}
          </div>
          {!isLogin && (
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <div className="input-wrap"><span>🔒</span><input name="confirm" type="password" placeholder="Repeat password" required /></div>
              {errs.confirm && <span className="form-error">{errs.confirm}</span>}
            </div>
          )}
          {isLogin && <div style={{ textAlign: "right", marginBottom: 16 }}><a style={{ color: "var(--p3)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Forgot password?</a></div>}
          <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 4 }} disabled={loading} type="submit">
            {loading ? <><div className="spinner" style={{ display: "inline-block" }} />Processing…</> : (isLogin ? "Sign In →" : "Create Account →")}
          </button>
        </form>

        <p className="form-switch">{isLogin ? "New here?" : "Already have an account?"} <a onClick={() => onNav(isLogin ? "signup" : "login")}>{isLogin ? "Create free account →" : "Sign in →"}</a></p>
        <p className="form-back"><a onClick={() => onNav("landing")}>← Back to home</a></p>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────
   SIDEBAR
───────────────────────────────────────── */
const Sidebar = ({ activePage, onNav, username, onLogout, level, streak }) => {
  // Fix #1 — safe username, never crashes on null/undefined
  const safeName = (username && username.trim()) ? username.trim() : "Developer";
  const avatarLetter = safeName.charAt(0).toUpperCase();

  // Dynamic level label based on real level from backend
  const safeLevel = level && level > 0 ? level : 1;
  const getLevelTitle = (lvl) => {
    if (lvl >= 50) return "Legend";
    if (lvl >= 30) return "Master";
    if (lvl >= 20) return "Advanced";
    if (lvl >= 10) return "Intermediate";
    if (lvl >= 5)  return "Beginner";
    return "Newbie";
  };
  const levelTitle = getLevelTitle(safeLevel);

  const items = [
    { id: "dashboard", icon: "⬡", label: "Dashboard" },
    { id: "coding",    icon: "{ }", label: "Practice", badge: "13" },
    { id: "interview", icon: "◈",  label: "Interview", badge: "HOT" },
    { id: "analytics", icon: "▦",  label: "Analytics" },
    { id: "profile",   icon: "👤",  label: "Profile" },
  ];
  return (
    <aside className="sidebar">
      <div className="sidebar-logo" onClick={() => onNav("landing")}>
        <div className="nav-logo-icon" style={{ width: 28, height: 28, fontSize: 12 }}>&lt;/&gt;</div>
        <span>Skill<span className="grad-text">X</span></span>
      </div>
      <div className="sidebar-user">
        <div className="avatar">{avatarLetter}</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>{safeName}</div>
          <div style={{ fontSize: 11, fontWeight: 700, fontFamily: "var(--mono)" }} className="grad-text">✦ Level {safeLevel} · {levelTitle}</div>
        </div>
      </div>
      <nav className="sidebar-nav">
        {items.map(({ id, icon, label, badge }) => (
          <button key={id} className={`nav-item${activePage === id ? " active" : ""}`} onClick={() => onNav(id)}>
            <span style={{ fontFamily: "var(--mono)", fontSize: 15, minWidth: 20 }}>{icon}</span>
            <span>{label}</span>
            {badge && <span className="nav-badge">{badge}</span>}
          </button>
        ))}
        <button className="nav-item" onClick={() => onNav("landing")}>
          <span style={{ fontFamily: "var(--mono)", fontSize: 15, minWidth: 20 }}>←</span>
          <span>Home</span>
        </button>
        {/* Fix #9 — Logout clears session */}
        {onLogout && (
          <button className="nav-item" onClick={onLogout} style={{ marginTop: "auto", color: "var(--crim)", borderColor: "rgba(244,63,94,.15)" }}>
            <span style={{ fontFamily: "var(--mono)", fontSize: 15, minWidth: 20 }}>⏻</span>
            <span>Logout</span>
          </button>
        )}
      </nav>
      <div className="sidebar-footer">
        <div className="streak-box">
          <span style={{ fontSize: 26, animation: "sfPulse 1.5s ease-in-out infinite" }}>⭐</span>
          <div>
            <div style={{ fontSize: 24, fontWeight: 900, color: "var(--amber)", lineHeight: 1, fontFamily: "var(--mono)" }}>{streak || 0}</div>
            <div style={{ fontSize: 11, color: "var(--muted)", letterSpacing: ".5px", textTransform: "uppercase" }}>Day Streak</div>
          </div>
        </div>
      </div>
    </aside>
  );
};

/* ─────────────────────────────────────────
   DASHBOARD
───────────────────────────────────────── */
const Dashboard = ({ onNav, username, onLogout }) => {
  const [counts, setCounts]     = useState([0, 0, 0, 0]);
  const [stats,  setStats]      = useState(null);
  const [statsErr, setStatsErr] = useState("");
  const [userLevel, setUserLevel] = useState(1);
  const [userStreak, setUserStreak] = useState(0);
  const toast = React.useContext(ToastContext);

  // Fix #2 & #3 — fetch real stats from backend
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await apiCall("/dashboard/", "GET", null, true);
        setStats(data);
        const lvl = data.level || 1;
        setUserLevel(lvl);
        try { localStorage.setItem("skillx_level", lvl); } catch(e) {}
        const str = data.streak || 0;
        setUserStreak(str);
        try { localStorage.setItem("skillx_streak", str); } catch(e) {}
        // Animate real numbers
        const targets = [
          data.accuracy        || 0,
          data.problems_solved || 0,
          data.streak          || 0,
          (data.weak_topics && data.weak_topics.length) || 0,
        ];
        targets.forEach((t, i) => {
          let c = 0;
          const iv = setInterval(() => {
            c = Math.min(c + Math.ceil((t || 1) / 50), t);
            setCounts(p => { const n = [...p]; n[i] = c; return n; });
            if (c >= t) clearInterval(iv);
          }, 24);
        });
      } catch (err) {
        // Fix #10 — show error if backend is down
        setStatsErr("Could not load stats. " + (err.message || "Check if backend is running."));
        // Fallback to zeros animation
        [0,0,0,0].forEach((t, i) => setCounts(p => { const n=[...p]; n[i]=0; return n; }));
      }
    };
    fetchStats();
  }, []);

  const chartRef = useRef(null);
  useEffect(() => {
    if (!window.Chart || !chartRef.current) return;
    const ctx = chartRef.current.getContext("2d");
    const g = ctx.createLinearGradient(0, 0, 0, 280);
    g.addColorStop(0, "rgba(124,58,237,.28)");
    g.addColorStop(1, "rgba(124,58,237,.01)");
    const ch = new window.Chart(ctx, {
      type: "line",
      data: {
        labels: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
        datasets: [{ label: "Problems", data: [7,4,9,12,6,3,8], borderColor:"#a855f7", borderWidth:2.5, backgroundColor:g, pointBackgroundColor:"#a3e635", pointBorderColor:"#06060a", pointBorderWidth:2, pointRadius:5, pointHoverRadius:8, tension:.42, fill:true }]
      },
      options: {
        responsive:true, maintainAspectRatio:false,
        plugins:{ legend:{display:false}, tooltip:{ backgroundColor:"#111118", borderColor:"#a855f7", borderWidth:1, titleColor:"#a855f7", bodyColor:"#8888aa", padding:12 } },
        scales:{
          x:{grid:{color:"rgba(124,58,237,.04)"},ticks:{color:"#52526e",font:{family:"JetBrains Mono",size:11}}},
          y:{grid:{color:"rgba(124,58,237,.04)"},ticks:{color:"#52526e",font:{family:"JetBrains Mono",size:11}},beginAtZero:true}
        }
      }
    });
    return () => ch.destroy();
  }, []);

  const weakTopicsLabel = stats && stats.weak_topics
    ? stats.weak_topics.join(" · ")
    : "DP · Graphs · Tries";

  const cards = [
    { icon:"🎯", val:counts[0], sfx:"%", label:"Accuracy",       trend:"↑ +4% this week",  up:true  },
    { icon:"✅", val:counts[1], sfx:"",  label:"Problems Solved", trend:"↑ +18 this week",  up:true  },
    { icon:"⭐", val:counts[2], sfx:"",  label:"Day Streak",      trend:"↑ Personal best",  up:true  },
    { icon:"🧠", val:counts[3], sfx:"",  label:"Weak Topics",     trend:weakTopicsLabel,     up:false },
  ];
  const glows = ["rgba(124,58,237,.07)","rgba(163,230,53,.06)","rgba(251,191,36,.06)","rgba(244,63,94,.05)"];
  const gradients = ["var(--grad)","var(--grad2)","linear-gradient(135deg,#fbbf24,#f59e0b)","linear-gradient(135deg,#f43f5e,#a855f7)"];

  return (
    <div className="app-shell page-enter" style={{ position:"relative", zIndex:1 }}>
      <Sidebar activePage="dashboard" onNav={onNav} username={username} onLogout={onLogout} level={userLevel} streak={stats ? stats.streak : 0} />
      <main className="main-content">
        <div className="topbar">
          <div>
            <h1 style={{ fontFamily:"var(--display)", fontSize:21, fontWeight:800, letterSpacing:"-.4px" }}>Dashboard ⬡</h1>
            <p style={{ color:"var(--muted)", fontSize:13, marginTop:2 }}>Good morning, {username || 'Developer'}. Let's ship some code.</p>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ position:"relative", fontSize:18, cursor:"pointer" }}>🔔<div className="nd" style={{ position:"absolute", top:0, right:0, width:8, height:8, background:"var(--crim)", borderRadius:"50%", border:"2px solid var(--bg)", boxShadow:"0 0 8px var(--crim)" }} /></div>
            <div className="avatar" style={{ width:30, height:30, fontSize:12 }}>{(username && username.trim() ? username.charAt(0) : "D").toUpperCase()}</div>
          </div>
        </div>

        {/* Fix #10 — backend error banner */}
        {statsErr && (
          <div style={{ margin:"0 32px 16px", padding:"12px 18px", background:"rgba(244,63,94,.08)", border:"1px solid rgba(244,63,94,.2)", borderRadius:12, color:"#f43f5e", fontSize:13, fontWeight:600 }}>
            ⚠️ {statsErr}
          </div>
        )}
        <div className="stats-grid">
          {cards.map(({ icon, val, sfx, label, trend, up }, i) => (
            <div key={label} className="stat-card glass" style={{ boxShadow:`0 0 28px ${glows[i]}` }}>
              <div style={{ fontSize:26, marginBottom:10 }}>{icon}</div>
              <div className="stat-card-val" style={{ background:gradients[i], WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>{val}{sfx}</div>
              <div className="stat-card-lbl">{label}</div>
              <div className={`stat-card-trend ${up ? "trend-up" : "trend-dn"}`} style={{ fontFamily:"var(--mono)", fontSize:11 }}>{trend}</div>
            </div>
          ))}
        </div>

        <div className="dash-layout">
          <div className="chart-card glass">
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
              <h3 style={{ fontFamily:"var(--display)", fontSize:15, fontWeight:700 }}>📈 Weekly Progress</h3>
              <div className="chart-tabs">
                <button className="chart-tab active">Week</button>
                <button className="chart-tab">Month</button>
              </div>
            </div>
            <div className="chart-wrap"><canvas ref={chartRef} /></div>
          </div>
          <div className="chart-card glass">
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18 }}>
              <h3 style={{ fontFamily:"var(--display)", fontSize:15, fontWeight:700 }}>🎯 Recommended</h3>
              <span style={{ fontSize:13, color:"var(--p3)", cursor:"pointer", fontWeight:700 }} onClick={() => onNav("coding")}>See all →</span>
            </div>
            <div className="problems-list">
              {Object.values(PROBLEMS).slice(0,6).map(p => (
                <div key={p.id} className="problem-row" onClick={() => onNav("coding")}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700 }}>{p.id}. {p.title}</div>
                    <div style={{ fontSize:11, color:"var(--muted)", fontFamily:"var(--mono)" }}>{p.companies}</div>
                  </div>
                  <span className={`tag ${p.diffClass}`}>{p.difficulty}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

/* ─────────────────────────────────────────
   PROBLEMS DATA
───────────────────────────────────────── */
const PROBLEMS = {
  1: {
    id: 1, title: "Two Sum", difficulty: "Easy", diffClass: "tag-e", companies: "Google · Amazon",
    description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
    examples: [
      { input: "nums = [2,7,11,15], target = 9", output: "[0,1]", explain: "nums[0] + nums[1] = 2 + 7 = 9" },
      { input: "nums = [3,2,4], target = 6",      output: "[1,2]", explain: "nums[1] + nums[2] = 2 + 4 = 6" },
    ],
    starter: { python: `def twoSum(nums, target):
    # Write your solution here
    pass`, javascript: `function twoSum(nums, target) {
    // Write your solution here
}` },
  },
  2: {
    id: 2, title: "Reverse a String", difficulty: "Easy", diffClass: "tag-e", companies: "Microsoft · Facebook",
    description: "Write a function that reverses a string. The input string is given as a list of characters s. You must do it in-place with O(1) extra memory.",
    examples: [
      { input: 's = ["h","e","l","l","o"]', output: '["o","l","l","e","h"]', explain: "Reverse the array in place" },
      { input: 's = ["H","a","n","n","a","h"]', output: '["h","a","n","n","a","H"]', explain: "Reverse the array in place" },
    ],
    starter: { python: `def reverseString(s):
    # Write your solution here
    pass`, javascript: `function reverseString(s) {
    // Write your solution here (modify in place)
}` },
  },
  3: {
    id: 3, title: "FizzBuzz", difficulty: "Easy", diffClass: "tag-e", companies: "Apple · Netflix",
    description: 'Given an integer n, return a list of strings for numbers 1 to n. For multiples of 3 → "Fizz", multiples of 5 → "Buzz", both → "FizzBuzz".',
    examples: [
      { input: "n = 3", output: '["1","2","Fizz"]', explain: "3 is divisible by 3" },
      { input: "n = 5", output: '["1","2","Fizz","4","Buzz"]', explain: "5 is divisible by 5" },
    ],
    starter: { python: `def fizzBuzz(n):
    # Write your solution here
    pass`, javascript: `function fizzBuzz(n) {
    // Write your solution here
}` },
  },
  4: {
    id: 4, title: "Palindrome Number", difficulty: "Easy", diffClass: "tag-e", companies: "Amazon · Adobe",
    description: "Given an integer x, return true if x is a palindrome, and false otherwise. A palindrome reads the same forward and backward.",
    examples: [
      { input: "x = 121", output: "True", explain: "121 reads as 121 from left to right and right to left" },
      { input: "x = -121", output: "False", explain: "From left to right it reads -121. From right to left it reads 121-" },
    ],
    starter: { python: `def isPalindrome(x):
    # Write your solution here
    pass`, javascript: `function isPalindrome(x) {
    // Write your solution here
}` },
  },
  5: {
    id: 5, title: "Maximum Subarray", difficulty: "Medium", diffClass: "tag-m", companies: "Google · Microsoft",
    description: "Given an integer array nums, find the subarray with the largest sum, and return its sum. (Kadane's Algorithm)",
    examples: [
      { input: "nums = [-2,1,-3,4,-1,2,1,-5,4]", output: "6", explain: "Subarray [4,-1,2,1] has the largest sum = 6" },
      { input: "nums = [1]", output: "1", explain: "Only one element" },
    ],
    starter: { python: `def maxSubArray(nums):
    # Write your solution here
    pass`, javascript: `function maxSubArray(nums) {
    // Write your solution here
}` },
  },
  6: {
    id: 6, title: "Valid Parentheses", difficulty: "Easy", diffClass: "tag-e", companies: "Facebook · Twitter",
    description: "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.",
    examples: [
      { input: 's = "()"', output: "True", explain: "Opening and closing brackets match" },
      { input: 's = "()[]{}"', output: "True", explain: "All brackets match in order" },
      { input: 's = "(]"', output: "False", explain: "Brackets do not match" },
    ],
    starter: { python: `def isValid(s):
    # Write your solution here
    pass`, javascript: `function isValid(s) {
    // Write your solution here
}` },
  },
  7: {
    id: 7, title: "Climbing Stairs", difficulty: "Easy", diffClass: "tag-e", companies: "Amazon · Apple",
    description: "You are climbing a staircase. It takes n steps to reach the top. Each time you can climb 1 or 2 steps. In how many distinct ways can you climb to the top?",
    examples: [
      { input: "n = 2", output: "2", explain: "1+1 or 2 — two ways" },
      { input: "n = 3", output: "3", explain: "1+1+1, 1+2, 2+1 — three ways" },
    ],
    starter: { python: `def climbStairs(n):
    # Write your solution here
    pass`, javascript: `function climbStairs(n) {
    // Write your solution here
}` },
  },
  8: {
    id: 8, title: "Best Time to Buy Stock", difficulty: "Easy", diffClass: "tag-e", companies: "Amazon · Goldman Sachs",
    description: "Given an array prices where prices[i] is the price on day i, return the maximum profit you can achieve. You can only buy once and sell once.",
    examples: [
      { input: "prices = [7,1,5,3,6,4]", output: "5", explain: "Buy on day 2 (price=1), sell on day 5 (price=6), profit = 5" },
      { input: "prices = [7,6,4,3,1]", output: "0", explain: "No profit possible, return 0" },
    ],
    starter: { python: `def maxProfit(prices):
    # Write your solution here
    pass`, javascript: `function maxProfit(prices) {
    // Write your solution here
}` },
  },
  9: {
    id: 9, title: "Missing Number", difficulty: "Easy", diffClass: "tag-e", companies: "Microsoft · LinkedIn",
    description: "Given an array nums containing n distinct numbers in the range [0, n], return the only number in the range that is missing from the array.",
    examples: [
      { input: "nums = [3,0,1]", output: "2", explain: "n = 3, numbers 0,1,3 present, 2 is missing" },
      { input: "nums = [0,1]", output: "2", explain: "n = 2, numbers 0,1 present, 2 is missing" },
    ],
    starter: { python: `def missingNumber(nums):
    # Write your solution here
    pass`, javascript: `function missingNumber(nums) {
    // Write your solution here
}` },
  },
  10: {
    id: 10, title: "Count Vowels", difficulty: "Easy", diffClass: "tag-e", companies: "Infosys · TCS",
    description: "Given a string s, return the number of vowels (a, e, i, o, u) in the string. Both uppercase and lowercase vowels should be counted.",
    examples: [
      { input: 's = "Hello World"', output: "3", explain: "e, o, o are vowels" },
      { input: 's = "Python"', output: "1", explain: "o is the only vowel" },
    ],
    starter: { python: `def countVowels(s):
    # Write your solution here
    pass`, javascript: `function countVowels(s) {
    // Write your solution here
}` },
  },
  11: {
    id: 11, title: "Factorial", difficulty: "Easy", diffClass: "tag-e", companies: "Wipro · Accenture",
    description: "Given a non-negative integer n, return its factorial. The factorial of n is the product of all positive integers less than or equal to n.",
    examples: [
      { input: "n = 5", output: "120", explain: "5 x 4 x 3 x 2 x 1 = 120" },
      { input: "n = 0", output: "1", explain: "Factorial of 0 is 1 by definition" },
    ],
    starter: { python: `def factorial(n):
    # Write your solution here
    pass`, javascript: `function factorial(n) {
    // Write your solution here
}` },
  },
  12: {
    id: 12, title: "Find Maximum", difficulty: "Easy", diffClass: "tag-e", companies: "Google · Flipkart",
    description: "Given an array of integers, return the maximum element in the array without using Python's built-in max() function.",
    examples: [
      { input: "nums = [3,1,4,1,5,9,2,6]", output: "9", explain: "9 is the largest element" },
      { input: "nums = [-5,-3,-1,-4]", output: "-1", explain: "-1 is the largest among negatives" },
    ],
    starter: { python: `def findMax(nums):
    # Write your solution here
    pass`, javascript: `function findMax(nums) {
    // Write your solution here
}` },
  },
  13: {
    id: 13, title: "Second Largest", difficulty: "Medium", diffClass: "tag-m", companies: "Amazon · Zoho",
    description: "Given an array of integers, return the second largest unique element. If no second largest exists, return -1.",
    examples: [
      { input: "nums = [10, 5, 8, 20, 3]", output: "10", explain: "20 is largest, 10 is second largest" },
      { input: "nums = [5, 5, 5]", output: "-1", explain: "All elements same, no second largest" },
    ],
    starter: { python: `def secondLargest(nums):
    # Write your solution here
    pass`, javascript: `function secondLargest(nums) {
    // Write your solution here
}` },
  },
};

/* ─────────────────────────────────────────
   CODING PAGE
───────────────────────────────────────── */
const CodingPage = ({ onNav, username, onLogout, userLevel = 1, userStreak = 0 }) => {
  const [timer, setTimer]       = useState(0);
  const [timerOn, setTimerOn]   = useState(false);
  const [activeTab, setActiveTab] = useState("problem");
  const [result, setResult]     = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [hint, setHint]           = useState(null);
  const [hintLoading, setHintLoading] = useState(false);
  const [hintLevel, setHintLevel] = useState(0);
  const [running, setRunning]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [language,  setLanguage]  = useState("python");
  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    setCode(PROBLEMS[problemId].starter[lang] || PROBLEMS[problemId].starter.python);
  };
  const [problemId, setProblemId] = useState(1);
  const [code, setCode]           = useState(PROBLEMS[1].starter.python);
  const toast = React.useContext(ToastContext);
  const ivRef = useRef(null);

  const toggleTimer = () => {
    if (!timerOn) {
      setTimerOn(true);
      ivRef.current = setInterval(() => setTimer(t => t + 1), 1000);
    } else {
      setTimerOn(false);
      clearInterval(ivRef.current);
    }
  };
  useEffect(() => () => clearInterval(ivRef.current), []);
  const fmt = (s) => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

  const getHint = async () => {
    if (!code.trim()) { toast("⚠️ Write some code first!", "#f43f5e"); return; }
    setHintLoading(true);
    setActiveTab("hints");
    const problem = PROBLEMS[problemId];
    try {
      const token = localStorage.getItem("skillx_token");
      const res = await fetch("http://localhost:8000/api/code/hint/", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          problem_title: problem.title,
          problem_description: problem.description,
          user_code: code,
          hint_level: hintLevel,
          language: language,
        })
      });
      const data = await res.json();
      if (data.hint) {
        setHint(data.hint);
        setHintLevel(prev => Math.min(prev + 1, 2));
        toast("💡 Hint generated!", "#a855f7");
      } else {
        setHint("Could not generate hint. Try again!");
      }
    } catch(err) {
      setHint("Backend not connected. Make sure server is running!");
      toast("⚠️ Could not get hint", "#f43f5e");
    } finally {
      setHintLoading(false);
    }
  };

  const runCode = async () => {
    if (!code.trim()) { toast("⚠️ Write some code first!", "#f43f5e"); return; }
    setRunning(true);
    setResult(null);
    toast("▶ Running test cases…", "#818cf8");
    try {
      const data = await apiCall("/code/run/", "POST", {
        code:       code,
        language:   language,
        problem_id: problemId,
      }, true);

      setResult(data);

      const allPassed = data.results && data.results.every(r => r.passed);
      if (allPassed) {
        toast("✅ All test cases passed!", "#a3e635");
      } else {
        const failed = data.results ? data.results.filter(r => !r.passed).length : 0;
        toast(`❌ ${failed} test case(s) failed`, "#f43f5e");
      }
    } catch (err) {
      // Fix #10 — show real error
      setResult({ error: err.message || "Could not connect to backend" });
      toast("⚠️ " + (err.message || "Backend error"), "#f43f5e");
    } finally {
      setRunning(false);
    }
  };

  const submitCode = async () => {
    if (!code.trim()) { toast("⚠️ Write some code first!", "#f43f5e"); return; }
    setSubmitting(true);
    setAiResult(null);
    toast("⚡ Submitting solution…", "#a855f7");
    try {
      const data = await apiCall("/code/submit/", "POST", {
        code:       code,
        language:   language,
        problem_id: problemId,
      }, true);

      setAiResult(data);

      if (data.status === "Accepted") {
        toast(`🎉 Accepted! Score: ${data.score}/100`, "#a855f7");
      } else {
        toast(`❌ ${data.status || "Wrong Answer"}`, "#f43f5e");
      }
    } catch (err) {
      setAiResult({ error: err.message || "Could not connect to backend" });
      toast("⚠️ " + (err.message || "Backend error"), "#f43f5e");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-shell page-enter" style={{ position:"relative", zIndex:1 }}>
      <Sidebar activePage="coding" onNav={onNav} username={username} onLogout={onLogout} level={userLevel} streak={userStreak} />
      <main className="main-content" style={{ display:"flex", flexDirection:"column", padding:0, overflow:"hidden" }}>
        {/* Coding bar */}
        <div className="coding-bar">
          <button className="btn btn-ghost btn-sm" onClick={() => onNav("dashboard")}>← Back</button>
          <select
            className="select-input"
            value={problemId}
            onChange={e => {
              const pid = Number(e.target.value);
              setProblemId(pid);
              setResult(null);
              setAiResult(null);
              setActiveTab("problem");
              setCode(PROBLEMS[pid].starter[language] || PROBLEMS[pid].starter.python);
              setHint(null);
              setHintLevel(0);
            }}
          >
            {Object.values(PROBLEMS).map(p => (
              <option key={p.id} value={p.id}>{p.id}. {p.title} ({p.difficulty})</option>
            ))}
          </select>
          <span className={`tag ${PROBLEMS[problemId].diffClass}`}>{PROBLEMS[problemId].difficulty}</span>
          <span style={{ fontSize:12, color:"var(--muted)", fontFamily:"var(--mono)" }}>{PROBLEMS[problemId].companies}</span>
          <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:8 }}>
            <span className="timer-display">⏱ {fmt(timer)}</span>
            <button className="btn btn-ghost btn-sm" onClick={toggleTimer}>{timerOn ? "⏸" : "▶"} {timerOn ? "Pause" : "Start"}</button>
          </div>
        </div>

        {/* Split view */}
        <div className="editor-split">
          {/* Problem pane */}
          <div className="problem-pane">
            <div className="pane-tabs">
              {["problem","hints","solution"].map(t => (
                <button key={t} className={`pane-tab${activeTab===t?" active":""}`} onClick={() => setActiveTab(t)}>
                  {t==="problem"?"📋 Problem":t==="hints"?"💡 Hints":"📚 Solution"}
                </button>
              ))}
            </div>
            <div className="problem-body">
              {activeTab === "problem" && <>
                <h2 style={{ fontFamily:"var(--display)", fontSize:20, fontWeight:800, marginBottom:12, letterSpacing:"-.5px" }}>{problemId}. {PROBLEMS[problemId].title}</h2>
                <div style={{ display:"flex", gap:8, marginBottom:18 }}>
                  <span className={`tag ${PROBLEMS[problemId].diffClass}`}>{PROBLEMS[problemId].difficulty}</span>
                  <span className="problem-tag">{PROBLEMS[problemId].companies}</span>
                </div>
                <p style={{ color:"#5a5a8a", fontSize:14, lineHeight:1.8, marginBottom:12 }}>{PROBLEMS[problemId].description}</p>
                {PROBLEMS[problemId].examples.map((ex, i) => (
                  <div className="example-block" key={i} style={{ marginTop: i > 0 ? 12 : 0 }}>
                    <div className="example-label">Example {i+1}</div>
                    <pre style={{ fontFamily:"var(--mono)", fontSize:12.5, lineHeight:1.8, color:"#5a5a8a" }}>
                      {`Input:  ${ex.input}
Output: ${ex.output}${ex.explain ? `
// ${ex.explain}` : ""}`}
                    </pre>
                  </div>
                ))}
              </>}
              {activeTab === "hints" && <>
                <h3 style={{ marginBottom:8, fontFamily:"var(--display)" }} className="grad-text">💡 AI Hint Generator</h3>
                <p style={{ color:"var(--muted)", fontSize:13, marginBottom:16 }}>Stuck? Get a smart nudge without spoiling the answer!</p>
                <button
                  className="btn btn-primary"
                  onClick={getHint}
                  disabled={hintLoading}
                  style={{ marginBottom:20, width:"100%" }}
                >
                  {hintLoading ? "🤔 Thinking..." : hintLevel === 0 ? "💡 Get First Hint" : hintLevel === 1 ? "💡 Get Another Hint" : "💡 Get Final Hint"}
                </button>
                {hintLoading && (
                  <div style={{ textAlign:"center", padding:20 }}>
                    <div style={{ fontSize:32, marginBottom:8 }}>🤖</div>
                    <p style={{ color:"var(--muted)", fontSize:13 }}>AI is analyzing your code...</p>
                  </div>
                )}
                {hint && !hintLoading && (
                  <div className="example-block" style={{ marginTop:8, borderLeft:"3px solid #a855f7" }}>
                    <div className="example-label" style={{ color:"#a855f7" }}>💡 Hint {hintLevel}</div>
                    <p style={{ color:"#c4c4d4", fontSize:14, lineHeight:1.8, marginTop:8 }}>{hint}</p>
                  </div>
                )}
                {!hint && !hintLoading && (
                  <div style={{ textAlign:"center", padding:30, color:"var(--muted)", fontSize:13 }}>
                    <div style={{ fontSize:40, marginBottom:8 }}>🤖</div>
                    <p>Click the button above to get an AI-powered hint based on your current code!</p>
                  </div>
                )}
                {hintLevel >= 3 && (
                  <p style={{ color:"var(--muted)", fontSize:12, marginTop:12, textAlign:"center" }}>
                    Maximum hints reached! Try solving it now 💪
                  </p>
                )}
              </>}
              {activeTab === "solution" && <>
                <h3 style={{ marginBottom:14, fontFamily:"var(--display)" }} className="grad-text">📚 Optimal Solution</h3>
                <p style={{ color:"var(--muted)", fontSize:14, marginBottom:16 }}>Single-pass hash map. O(n) time, O(n) space.</p>
                <div style={{ background:"var(--bg1)", borderRadius:10, padding:"16px 20px", fontFamily:"var(--mono)", fontSize:13, lineHeight:1.8 }}>
                  <div><span className="token-kw">def </span><span className="token-fn2">twoSum</span><span style={{ color:"#5a5a8a" }}>(nums, target):</span></div>
                  <div style={{ paddingLeft:20 }}><span style={{ color:"#5a5a8a" }}>seen = {"{}"}</span></div>
                  <div style={{ paddingLeft:20 }}><span className="token-kw">for </span><span className="token-fn">i, n </span><span className="token-kw">in </span><span className="token-fn2">enumerate</span><span style={{ color:"#5a5a8a" }}>(nums):</span></div>
                  <div style={{ paddingLeft:40 }}><span className="token-kw">if </span><span style={{ color:"#5a5a8a" }}>target - n </span><span className="token-kw">in </span><span style={{ color:"#5a5a8a" }}>seen:</span></div>
                  <div style={{ paddingLeft:60 }}><span className="token-kw">return </span><span style={{ color:"#5a5a8a" }}>[seen[target - n], i]</span></div>
                  <div style={{ paddingLeft:40 }}><span style={{ color:"#5a5a8a" }}>seen[n] = i</span></div>
                </div>
              </>}
            </div>
          </div>

          {/* Editor pane */}
          <div className="editor-pane">
            <div className="editor-body" style={{ flex:1, display:"flex", flexDirection:"column" }}>
              <div className="editor-header">
                <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                  <div className="dot dot-r" /><div className="dot dot-y" /><div className="dot dot-g" />
                  <span style={{ fontSize:12, color:"var(--muted)", fontFamily:"var(--mono)", marginLeft:6 }}>
                    solution.{language === "python" ? "py" : language === "java" ? "java" : language === "cpp" ? "cpp" : "js"}
                  </span>
                </div>
                <select
                  className="select-input"
                  value={language}
                  onChange={e => handleLanguageChange(e.target.value)}
                >
                  <option value="python">🐍 Python</option>
                  <option value="javascript">🟨 JavaScript</option>
                  <option value="java">☕ Java</option>
                  <option value="cpp">⚡ C++</option>
                  <option value="javascript">🟡 JS</option>
                </select>
              </div>
              {/* Real textarea connected to code state */}
              <textarea
                value={code}
                onChange={e => setCode(e.target.value)}
                spellCheck={false}
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "#c4b5fd",
                  fontFamily: "var(--mono)",
                  fontSize: 14,
                  lineHeight: 1.8,
                  padding: "20px 24px",
                  resize: "none",
                  width: "100%",
                  minHeight: 260,
                  tabSize: 4,
                }}
                onKeyDown={e => {
                  // Tab key inserts 4 spaces instead of switching focus
                  if (e.key === "Tab") {
                    e.preventDefault();
                    const start = e.target.selectionStart;
                    const end   = e.target.selectionEnd;
                    const spaces = "    ";
                    setCode(code.substring(0, start) + spaces + code.substring(end));
                    setTimeout(() => e.target.setSelectionRange(start + 4, start + 4), 0);
                  }
                }}
                placeholder="Write your solution here..."
              />
              <div className="editor-footer">
                <span style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--muted)" }}>
                  {language === "python" ? "Python 3" : language} · UTF-8 · {code.split("\n").length} lines
                </span>
                <div style={{ display:"flex", gap:8 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => toast("⚡ Formatted!", "#818cf8")}>⚡ Format</button>
                  <button className="btn btn-outline btn-sm" onClick={runCode} disabled={running}>
                    {running ? "⏳ Running…" : "▶ Run"}
                  </button>
                  <button className="btn btn-primary btn-sm" onClick={submitCode} disabled={submitting}>
                    {submitting ? "⏳ Submitting…" : "⚡ Submit"}
                  </button>
                </div>
              </div>
            </div>

            {/* Test cases */}
            <div className="test-panel">
              <div className="test-tabs">
                {["Case 1","Case 2","Case 3"].map((c,i) => (
                  <button key={c} className={`test-tab${i===0?" active":""}`}>{c}</button>
                ))}
                <button className="test-tab" style={{ borderStyle:"dashed" }}>+ Add</button>
              </div>
              <div style={{ padding:"10px 16px" }}>
                <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:6 }}>
                  <span style={{ fontSize:12, color:"var(--muted)", fontFamily:"var(--mono)", minWidth:70 }}>nums =</span>
                  <code style={{ background:"rgba(124,58,237,.08)", padding:"3px 10px", borderRadius:6, fontFamily:"var(--mono)", fontSize:12, color:"var(--p3)" }}>[2, 7, 11, 15]</code>
                </div>
                <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:10 }}>
                  <span style={{ fontSize:12, color:"var(--muted)", fontFamily:"var(--mono)", minWidth:70 }}>target =</span>
                  <code style={{ background:"rgba(124,58,237,.08)", padding:"3px 10px", borderRadius:6, fontFamily:"var(--mono)", fontSize:12, color:"var(--p3)" }}>9</code>
                </div>
                {/* Fix #4 — show real test case results from backend */}
                {result && result.error && (
                  <div style={{ padding:"10px 14px", background:"rgba(244,63,94,.08)", border:"1px solid rgba(244,63,94,.2)", borderRadius:10, color:"#f43f5e", fontSize:13, fontWeight:600 }}>
                    ⚠️ {result.error}
                  </div>
                )}
                {result && result.results && (
                  <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                    {result.results.map((r, i) => (
                      <div key={i} style={{ display:"flex", gap:8, fontSize:13, alignItems:"center", padding:"6px 10px", background: r.passed ? "rgba(163,230,53,.06)" : "rgba(244,63,94,.06)", borderRadius:8, border: r.passed ? "1px solid rgba(163,230,53,.15)" : "1px solid rgba(244,63,94,.15)" }}>
                        <span style={{ fontWeight:700 }}>{r.passed ? "✅" : "❌"}</span>
                        <span style={{ fontFamily:"var(--mono)", color: r.passed ? "var(--acid)" : "#f43f5e" }}>
                          Case {i+1}: {r.passed ? "Passed" : "Failed"}
                          {r.output ? ` → ${r.output}` : ""}
                          {!r.passed && r.expected ? ` (expected: ${r.expected})` : ""}
                        </span>
                      </div>
                    ))}
                    {result.runtime && (
                      <div style={{ fontSize:12, color:"var(--muted)", fontFamily:"var(--mono)", marginTop:4 }}>
                        Runtime: {result.runtime} · Memory: {result.memory || "N/A"}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* AI panel */}
            {/* Fix #5 & #6 — show real submit results from backend */}
            {aiResult && (
              <div className="ai-panel">
                <div className="ai-panel-head">
                  <span style={{ fontWeight:700 }}>🤖 Submission Result</span>
                  {aiResult.score !== undefined && (
                    <div className="ai-score-pill">✦ Score: {aiResult.score}/100</div>
                  )}
                  <button style={{ background:"none", border:"none", color:"var(--muted)", fontSize:20, cursor:"pointer", marginLeft:8 }} onClick={() => setAiResult(null)}>×</button>
                </div>
                {aiResult.error ? (
                  <div style={{ padding:"12px 16px", color:"#f43f5e", fontSize:13, fontWeight:600 }}>
                    ⚠️ {aiResult.error}
                  </div>
                ) : (
                  <div className="ai-grid">
                    {[
                      ["🏆 Status",  aiResult.status   || "N/A",                            aiResult.status === "Accepted" ? "#a3e635" : "#f43f5e"],
                      ["⏱ Runtime",  aiResult.runtime  || "N/A",                            "#a3e635"],
                      ["💾 Memory",  aiResult.memory   || "N/A",                            "#a3e635"],
                      ["🧪 Tests",   aiResult.passed !== undefined ? `${aiResult.passed}/${aiResult.total}` : "N/A", "#a3e635"],
                      ["💡 Tip",     aiResult.feedback || "Keep practicing!",               "var(--muted)"],
                      ["📊 Score",   aiResult.score !== undefined ? `${aiResult.score}/100` : "N/A", "#a855f7"],
                    ].map(([l, v, c]) => (
                      <div key={l} className="ai-item">
                        <div className="ai-item-label">{l}</div>
                        <div className="ai-item-val" style={{ color: c }}>{v}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

/* ─────────────────────────────────────────
   ANALYTICS
───────────────────────────────────────── */
const Analytics = ({ onNav, username, onLogout, userLevel = 1, userStreak = 0 }) => {
  const lineRef  = useRef(null);
  const barRef   = useRef(null);
  const donutRef = useRef(null);
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch real stats from backend
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await apiCall("/dashboard/", "GET", null, true);
        setStats(data);
      } catch (err) {
        setStats(null);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  useEffect(() => {
    if (!window.Chart) return;
    const opts = {
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{display:false}, tooltip:{ backgroundColor:"#111118", borderColor:"#a855f7", borderWidth:1, titleColor:"#a855f7", bodyColor:"#8888aa", padding:10 } },
      scales:{
        x:{grid:{color:"rgba(124,58,237,.04)"},ticks:{color:"#52526e",font:{family:"JetBrains Mono",size:11}}},
        y:{grid:{color:"rgba(124,58,237,.04)"},ticks:{color:"#52526e",font:{family:"JetBrains Mono",size:11}},beginAtZero:true}
      }
    };
    const charts = [];
    if (lineRef.current) {
      const g = lineRef.current.getContext("2d").createLinearGradient(0,0,0,260);
      g.addColorStop(0,"rgba(124,58,237,.25)"); g.addColorStop(1,"rgba(124,58,237,.01)");
      const solved = stats ? stats.problems_solved : 0;
      charts.push(new window.Chart(lineRef.current, { type:"line", data:{ labels:["Mon","Tue","Wed","Thu","Fri","Sat","Sun"], datasets:[{ data:[0,0,0,0,0,0,solved], borderColor:"#a855f7", borderWidth:2.5, backgroundColor:g, pointBackgroundColor:"#a3e635", pointBorderColor:"#04040a", pointRadius:5, tension:.42, fill:true }] }, options:opts }));
    }
    if (barRef.current) {
      const acc = stats ? stats.accuracy : 0;
      charts.push(new window.Chart(barRef.current, { type:"bar", data:{ labels:["Easy","Medium","Hard"], datasets:[{ data:[acc,0,0], backgroundColor:["rgba(163,230,53,.5)","rgba(251,191,36,.5)","rgba(244,63,94,.5)"], borderColor:["#a3e635","#fbbf24","#f43f5e"], borderWidth:2, borderRadius:8, borderSkipped:false }] }, options:{...opts, scales:{...opts.scales, y:{...opts.scales.y, max:100}}} }));
    }
    if (donutRef.current) {
      const ps = stats ? stats.problems_solved : 0;
      charts.push(new window.Chart(donutRef.current, { type:"doughnut", data:{ labels:["Arrays","Strings","Trees","DP","Graphs","Other"], datasets:[{ data:[ps,0,0,0,0,0], backgroundColor:["rgba(124,58,237,.7)","rgba(168,85,247,.7)","rgba(163,230,53,.7)","rgba(251,191,36,.7)","rgba(244,63,94,.7)","rgba(82,82,110,.7)"], borderWidth:0, hoverOffset:6, borderRadius:3 }] }, options:{ responsive:true, maintainAspectRatio:false, cutout:"68%", plugins:{ legend:{ position:"right", labels:{ color:"#52526e", font:{size:11,family:"JetBrains Mono"}, boxWidth:11, padding:12 } }, tooltip:{ backgroundColor:"#111118", borderColor:"#a855f7", borderWidth:1, bodyColor:"#8888aa", padding:10 } } } }));
    }
    return () => charts.forEach(c => c.destroy());
  }, [stats]);

  return (
    <div className="app-shell page-enter" style={{ position:"relative", zIndex:1 }}>
      <Sidebar activePage="analytics" onNav={onNav} username={username} onLogout={onLogout} level={userLevel} streak={userStreak} />
      <main className="main-content">
        <div className="topbar">
          <div>
            <h1 style={{ fontFamily:"var(--display)", fontSize:21, fontWeight:800, letterSpacing:"-.4px" }}>Analytics ▦</h1>
            <p style={{ color:"var(--muted)", fontSize:13, marginTop:2 }}>Track every bit of progress</p>
          </div>
        </div>

        {/* Real user summary bar */}
        {stats && (
          <div style={{ display:"flex", gap:16, padding:"0 32px 24px", flexWrap:"wrap" }}>
            {[
              { icon:"🎯", label:"Accuracy",        val: `${stats.accuracy}%`        },
              { icon:"✅", label:"Problems Solved",  val: stats.problems_solved       },
              { icon:"⭐", label:"Day Streak",       val: stats.streak                },
              { icon:"🏆", label:"Level",            val: `Level ${stats.level}`      },
            ].map(({ icon, label, val }) => (
              <div key={label} className="glass" style={{ padding:"14px 22px", borderRadius:14, display:"flex", alignItems:"center", gap:12, flex:1, minWidth:140 }}>
                <span style={{ fontSize:22 }}>{icon}</span>
                <div>
                  <div style={{ fontSize:18, fontWeight:800, fontFamily:"var(--mono)" }} className="grad-text">{val}</div>
                  <div style={{ fontSize:11, color:"var(--muted)", marginTop:2 }}>{label}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        {loading && (
          <div style={{ padding:"0 32px 24px", color:"var(--muted)", fontSize:13 }}>⏳ Loading your stats…</div>
        )}

        <div className="analytics-grid">
          <div className="analytics-card glass span2">
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18 }}>
              <h3 style={{ fontFamily:"var(--display)", fontSize:15, fontWeight:700 }}>📈 Problems Solved Over Time</h3>
              <div className="chart-tabs"><button className="chart-tab active">Week</button><button className="chart-tab">Month</button></div>
            </div>
            <div style={{ height:210 }}><canvas ref={lineRef} /></div>
          </div>
          <div className="analytics-card glass">
            <h3 style={{ fontFamily:"var(--display)", fontSize:15, fontWeight:700, marginBottom:18 }}>🎯 Accuracy by Difficulty</h3>
            <div style={{ height:190 }}><canvas ref={barRef} /></div>
          </div>
          <div className="analytics-card glass">
            <h3 style={{ fontFamily:"var(--display)", fontSize:15, fontWeight:700, marginBottom:18 }}>🍕 Topic Distribution</h3>
            <div style={{ height:190 }}><canvas ref={donutRef} /></div>
          </div>
          <div className="analytics-card glass">
            <h3 style={{ fontFamily:"var(--display)", fontSize:15, fontWeight:700, marginBottom:18 }}>🧠 Topic Performance</h3>
            <div className="topic-bars">
              {(stats && stats.problems_solved > 0
                ? [["Arrays",stats.accuracy,"var(--grad)","var(--p3)"],["Strings",0,"var(--grad)","var(--p3)"],["Trees",0,"linear-gradient(135deg,#fbbf24,#f59e0b)","#fbbf24"],["Graphs",0,"linear-gradient(135deg,#f43f5e,#a855f7)","#f43f5e"],["DP",0,"linear-gradient(135deg,#f43f5e,#a855f7)","#f43f5e"],["Tries",0,"linear-gradient(135deg,#f43f5e,#a855f7)","#f43f5e"]]
                : [["Arrays",0,"var(--grad)","var(--p3)"],["Strings",0,"var(--grad)","var(--p3)"],["Trees",0,"linear-gradient(135deg,#fbbf24,#f59e0b)","#fbbf24"],["Graphs",0,"linear-gradient(135deg,#f43f5e,#a855f7)","#f43f5e"],["DP",0,"linear-gradient(135deg,#f43f5e,#a855f7)","#f43f5e"],["Tries",0,"linear-gradient(135deg,#f43f5e,#a855f7)","#f43f5e"]]
              ).map(([n,p,g,c]) => (
                <div key={n} className="topic-row">
                  <span className="topic-name">{n}</span>
                  <div className="topic-bar-bg"><div className="topic-bar-fill" style={{ width:`${p}%`, background:g }} /></div>
                  <span className="topic-pct" style={{ color:c }}>{p}%</span>
                </div>
              ))}
            </div>
          </div>
          <div className="analytics-card glass">
            <h3 style={{ fontFamily:"var(--display)", fontSize:15, fontWeight:700, marginBottom:18 }}>📅 Weekly Activity</h3>
            <div className="week-bars">
              {(stats && stats.problems_solved > 0
                ? [["Mon",0,false],["Tue",0,false],["Wed",0,false],["Thu",0,false],["Fri",0,false],["Sat",0,false],["Sun",stats.problems_solved * 10,true]]
                : [["Mon",0,false],["Tue",0,false],["Wed",0,false],["Thu",0,false],["Fri",0,false],["Sat",0,false],["Sun",0,false]]
              ).map(([d,h,peak]) => (
                <div key={d} className="week-col">
                  <span className="week-day">{d}</span>
                  <div className={`week-bar${peak?" peak":""}`} style={{ height:`${h}%` }} />
                  <span className="week-num grad-text">{Math.round(h/10)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

/* ─────────────────────────────────────────
   INTERVIEW PAGE
───────────────────────────────────────── */
const Interview = ({ onNav, username, onLogout, userLevel = 1, userStreak = 0 }) => {
  const [progress, setProgress] = useState(0);
  const [step, setStep]         = useState("");
  const [done, setDone]         = useState(false);
  const [drag, setDrag]         = useState(false);
  const [skills, setSkills]     = useState({});
  const [questions, setQuestions] = useState([]);
  const [resumeErr, setResumeErr] = useState("");
  const toast = React.useContext(ToastContext);

  const processResume = async (file) => {
    if (!file) return;
    if (!file.name.endsWith(".pdf")) {
      toast("⚠️ Only PDF files supported", "#f43f5e");
      return;
    }

    setResumeErr("");
    setDone(false);
    setSkills({});
    setQuestions([]);

    // Animate progress bar while uploading
    const steps = ["Parsing document…","Extracting skills…","Generating questions…","Done! ✦"];
    let w = 0, si = 0;
    setProgress(0); setStep(steps[0]);
    const iv = setInterval(() => {
      w = Math.min(w + 1.5, 90); // stop at 90 until API responds
      setProgress(w);
      if (w >= 25 * (si + 1) && si < 3) { si++; setStep(steps[si]); }
    }, 40);

    try {
      const token = localStorage.getItem("skillx_token");
      const formData = new FormData();
      formData.append("resume", file);

      const res = await fetch("http://localhost:8000/api/resume/upload/", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      clearInterval(iv);

      if (!res.ok) {
        setResumeErr(data.error || "Failed to analyze resume");
        setProgress(0);
        setStep("");
        toast("⚠️ " + (data.error || "Failed"), "#f43f5e");
        return;
      }

      setProgress(100);
      setStep("Done! ✦");
      setSkills(data.skills || {});
      setQuestions(data.questions || []);

      const totalSkills = Object.values(data.skills || {}).flat().length;
      setTimeout(() => {
        setDone(true);
        toast(`✦ Resume analyzed! ${totalSkills} skills detected`, "#a3e635");
      }, 400);

    } catch (err) {
      clearInterval(iv);
      setProgress(0);
      setStep("");
      setResumeErr("Could not connect to backend");
      toast("⚠️ Backend error", "#f43f5e");
    }
  };

  return (
    <div className="app-shell page-enter" style={{ position:"relative", zIndex:1 }}>
      <Sidebar activePage="interview" onNav={onNav} username={username} onLogout={onLogout} level={userLevel} streak={userStreak} />
      <main className="main-content">
        <div className="topbar">
          <div>
            <h1 style={{ fontFamily:"var(--display)", fontSize:21, fontWeight:800, letterSpacing:"-.4px" }}>Resume Interview ◈</h1>
            <p style={{ color:"var(--muted)", fontSize:13, marginTop:2 }}>Upload your resume → get personalized questions</p>
          </div>
        </div>
        <div className="interview-grid">
          {/* Upload zone */}
          <div className={`upload-zone${drag?" dragover":""}`} onDragOver={e=>{e.preventDefault();setDrag(true)}} onDragLeave={()=>setDrag(false)} onDrop={e=>{e.preventDefault();setDrag(false); const f=e.dataTransfer.files[0]; if(f) processResume(f);}}>
            <div className="upload-icon">📄</div>
            <h3 style={{ fontFamily:"var(--display)", fontSize:19, fontWeight:700, marginBottom:8 }}>Upload Your Resume</h3>
            <p style={{ color:"var(--muted)", fontSize:14, marginBottom:24 }}>Drag & drop or click to upload PDF or DOCX</p>
            <input type="file" id="resume-file" accept=".pdf" style={{ display:"none" }}
              onChange={e => { if (e.target.files[0]) processResume(e.target.files[0]); }} />
            <button className="btn btn-primary" onClick={() => document.getElementById("resume-file").click()}>Choose File</button>
            {resumeErr && <div style={{ marginTop:12, color:"#f43f5e", fontSize:13, fontWeight:600 }}>⚠️ {resumeErr}</div>}
            {progress > 0 && !done && (
              <div className="progress-wrap">
                <div className="progress-bar-bg"><div className="progress-bar-fill" style={{ width:`${progress}%` }} /></div>
                <span style={{ fontSize:13, color:"var(--muted)", fontWeight:600 }}>{step}</span>
              </div>
            )}
          </div>

          {/* Skills */}
          <div className="glass" style={{ padding:24 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18 }}>
              <h3 style={{ fontFamily:"var(--display)", fontSize:15, fontWeight:700 }}>🧠 Extracted Skills</h3>
              <span style={{ fontSize:12, color:"var(--acid)", fontWeight:700, fontFamily:"var(--mono)" }}>AI Detected</span>
            </div>
            {!done ? (
              <div style={{ textAlign:"center", padding:"36px 24px", color:"var(--muted)" }}>
                <div style={{ fontSize:42, marginBottom:12 }}>⏳</div>
                <p>Upload resume to extract skills</p>
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                {Object.keys(skills).length > 0 ? (
                  Object.entries(skills).map(([cat, tags]) => (
                    <div key={cat}>
                      <div style={{ fontSize:11, fontWeight:700, color:"var(--muted)", letterSpacing:"1.2px", textTransform:"uppercase", marginBottom:8, fontFamily:"var(--mono)" }}>{cat}</div>
                      <div className="skill-tags">{tags.map(t => <span key={t} className="skill-tag">{t}</span>)}</div>
                    </div>
                  ))
                ) : (
                  <div style={{ color:"var(--muted)", fontSize:13 }}>No skills detected. Try a different resume.</div>
                )}
              </div>
            )}
          </div>

          {/* Questions */}
          <div className="glass" style={{ padding:24 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18 }}>
              <h3 style={{ fontFamily:"var(--display)", fontSize:15, fontWeight:700 }}>❓ Generated Questions</h3>
              {done && <span style={{ fontSize:13, color:"var(--p3)", cursor:"pointer", fontWeight:700 }} onClick={() => toast("↻ Regenerating…", "#818cf8")}>↻ Regenerate</span>}
            </div>
            {!done ? (
              <div style={{ textAlign:"center", padding:"36px 24px", color:"var(--muted)" }}>
                <div style={{ fontSize:42, marginBottom:12 }}>🤖</div>
                <p>AI generates questions after resume upload</p>
              </div>
            ) : (
              <div className="questions-list">
                {questions.length > 0 ? questions.map((q, i) => {
                  const diffClass = q.difficulty === "Easy" ? "tag-e" : q.difficulty === "Hard" ? "tag-h" : "tag-m";
                  return (
                    <div key={i} className="question-item">
                      <div className="question-num">Q{i+1}</div>
                      <div>
                        <p style={{ fontSize:13, lineHeight:1.65, marginBottom:7, color:"#5a5a9a" }}>{q.question}</p>
                        <div style={{ display:"flex", gap:6 }}>
                          <span className="skill-tag" style={{ fontSize:11 }}>{q.skill}</span>
                          <span className={`tag ${diffClass}`}>{q.difficulty}</span>
                        </div>
                      </div>
                    </div>
                  );
                }) : (
                  <div style={{ color:"var(--muted)", fontSize:13 }}>No questions generated.</div>
                )}
              </div>
            )}
          </div>

          {/* Mock CTA */}
          <div className="mock-cta glass">
            <div style={{ fontSize:52, marginBottom:20, display:"block", textAlign:"center" }}>🎤</div>
            <h3 style={{ fontFamily:"var(--display)", fontSize:26, fontWeight:800, marginBottom:12, letterSpacing:"-.8px" }}>Ready for Your Mock Interview?</h3>
            <p style={{ color:"var(--muted)", fontSize:15, lineHeight:1.75, marginBottom:28 }}>AI will ask questions, analyze your answers, and provide detailed feedback — just like a real FAANG interview.</p>
            <div className="mock-features">
              {[["🤖","AI Interviewer"],["⏱","Timed Responses"],["📊","Instant Scoring"],["🔄","Unlimited Attempts"]].map(([ic,l]) => (
                <div key={l} className="mock-feat"><span>{ic}</span>{l}</div>
              ))}
            </div>
            <button className="btn btn-acid btn-xl" disabled style={{ opacity:0.5, cursor:"not-allowed" }}>
              🚧 Coming Soon
            </button>
            <p style={{ color:"var(--muted)", fontSize:13, marginTop:12 }}>
              {done ? "Mock interview feature launching soon!" : "Upload your resume first to extract skills"}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

/* ─────────────────────────────────────────
   PROFILE PAGE
───────────────────────────────────────── */
const ProfilePage = ({ onNav, username, onLogout, userLevel = 1, userStreak = 0 }) => {
  const [stats, setStats]     = useState(null);
  const [editing, setEditing] = useState(false);
  const [bio, setBio]         = useState(localStorage.getItem("skillx_bio") || "");
  const [college, setCollege] = useState(localStorage.getItem("skillx_college") || "");
  const [github, setGithub]   = useState(localStorage.getItem("skillx_github") || "");
  const toast = React.useContext(ToastContext);

  const safeName    = username || "Developer";
  const safeLevel   = Math.max(1, Number(userLevel) || 1);
  const avatarLetter = safeName.charAt(0).toUpperCase();
  const getLevelTitle = (l) => ["","Newbie","Beginner","Intermediate","Advanced","Master","Legend"][Math.min(l,6)] || "Legend";
  const getLevelColor = (l) => l >= 5 ? "#f59e0b" : l >= 3 ? "#a855f7" : "#818cf8";

  useEffect(() => {
    apiCall("/dashboard/","GET",null,true).then(d => setStats(d)).catch(()=>{});
  }, []);

  const saveProfile = () => {
    localStorage.setItem("skillx_bio", bio);
    localStorage.setItem("skillx_college", college);
    localStorage.setItem("skillx_github", github);
    setEditing(false);
    toast("✅ Profile saved!", "#a3e635");
  };

  const solved      = stats ? stats.problems_solved : 0;
  const accuracy    = stats ? stats.accuracy : 0;
  const submissions = stats ? stats.submissions : 0;

  return (
    <div className="app-shell page-enter" style={{ position:"relative", zIndex:1 }}>
      <Sidebar activePage="profile" onNav={onNav} username={safeName} onLogout={onLogout} level={safeLevel} streak={userStreak} />
      <main className="main-content">
        <div style={{ maxWidth:800, margin:"0 auto", padding:"32px 24px" }}>

          {/* Profile Header */}
          <div style={{ display:"flex", alignItems:"center", gap:24, marginBottom:28, background:"linear-gradient(135deg,rgba(129,140,248,.08),rgba(167,139,250,.05))", border:"1px solid rgba(129,140,248,.15)", borderRadius:20, padding:28 }}>
            <div style={{ width:80, height:80, borderRadius:"50%", background:"linear-gradient(135deg,var(--p1),var(--p2))", display:"flex", alignItems:"center", justifyContent:"center", fontSize:32, fontWeight:900, color:"#fff", flexShrink:0, boxShadow:"0 0 30px rgba(129,140,248,.3)" }}>
              {avatarLetter}
            </div>
            <div style={{ flex:1 }}>
              <h1 style={{ fontFamily:"var(--display)", fontSize:26, fontWeight:900, marginBottom:6 }}>{safeName}</h1>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:8 }}>
                <span style={{ background:"rgba(129,140,248,.15)", border:"1px solid rgba(129,140,248,.3)", borderRadius:20, padding:"3px 12px", fontSize:12, color:getLevelColor(safeLevel), fontWeight:700 }}>✦ Level {safeLevel} · {getLevelTitle(safeLevel)}</span>
                <span style={{ background:"rgba(52,211,153,.1)", border:"1px solid rgba(52,211,153,.2)", borderRadius:20, padding:"3px 12px", fontSize:12, color:"#34d399", fontWeight:700 }}>🔥 {userStreak} Day Streak</span>
              </div>
              {bio     && <p style={{ color:"var(--muted)", fontSize:13, marginBottom:4 }}>{bio}</p>}
              {college && <p style={{ color:"var(--muted)", fontSize:12, marginBottom:4 }}>🎓 {college}</p>}
              {github  && <p style={{ color:"#818cf8", fontSize:12, cursor:"pointer" }} onClick={() => window.open("https://github.com/"+github,"_blank")}>🔗 github.com/{github}</p>}
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => setEditing(!editing)} style={{ flexShrink:0 }}>
              {editing ? "✕ Cancel" : "✏️ Edit"}
            </button>
          </div>

          {/* Edit Form */}
          {editing && (
            <div style={{ background:"rgba(129,140,248,.05)", border:"1px solid rgba(129,140,248,.15)", borderRadius:16, padding:24, marginBottom:24 }}>
              <h3 style={{ fontFamily:"var(--display)", marginBottom:16, fontSize:16 }} className="grad-text">✏️ Edit Profile</h3>
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {[
                  { label:"BIO", val:bio, set:setBio, placeholder:"Tell us about yourself..." },
                  { label:"COLLEGE / COMPANY", val:college, set:setCollege, placeholder:"e.g. IIT Delhi, Google..." },
                  { label:"GITHUB USERNAME", val:github, set:setGithub, placeholder:"e.g. laxmiyadav708" },
                ].map(({ label, val, set, placeholder }) => (
                  <div key={label}>
                    <label style={{ fontSize:12, color:"var(--muted)", display:"block", marginBottom:4 }}>{label}</label>
                    <input value={val} onChange={e => set(e.target.value)} placeholder={placeholder}
                      style={{ width:"100%", background:"var(--bg1)", border:"1px solid var(--border)", borderRadius:8, padding:"8px 12px", color:"var(--text)", fontSize:13, boxSizing:"border-box" }} />
                  </div>
                ))}
                <button className="btn btn-primary" onClick={saveProfile}>💾 Save Profile</button>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:24 }}>
            {[
              { label:"Problems Solved", value:solved,       icon:"✅", color:"#a3e635" },
              { label:"Accuracy",        value:accuracy+"%", icon:"🎯", color:"#818cf8" },
              { label:"Submissions",     value:submissions,  icon:"📤", color:"#f472b6" },
              { label:"Level",           value:safeLevel,    icon:"⭐", color:getLevelColor(safeLevel) },
            ].map(({ label, value, icon, color }) => (
              <div key={label} style={{ background:"rgba(129,140,248,.05)", border:"1px solid rgba(129,140,248,.1)", borderRadius:14, padding:16, textAlign:"center" }}>
                <div style={{ fontSize:24, marginBottom:6 }}>{icon}</div>
                <div style={{ fontSize:22, fontWeight:900, color, fontFamily:"var(--mono)" }}>{value}</div>
                <div style={{ fontSize:11, color:"var(--muted)", marginTop:4 }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Level Progress */}
          <div style={{ background:"rgba(129,140,248,.05)", border:"1px solid rgba(129,140,248,.1)", borderRadius:16, padding:20, marginBottom:24 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
              <span style={{ fontSize:14, fontWeight:700 }}>Progress to Level {safeLevel + 1} — {getLevelTitle(safeLevel+1)}</span>
              <span style={{ fontSize:12, color:"var(--muted)", fontFamily:"var(--mono)" }}>{solved} / {safeLevel * 2 + 2} problems</span>
            </div>
            <div style={{ height:8, background:"rgba(255,255,255,.05)", borderRadius:99, overflow:"hidden" }}>
              <div style={{ height:"100%", width:Math.min(100,(solved/(safeLevel*2+2))*100)+"%", background:"linear-gradient(90deg,var(--p1),var(--p2))", borderRadius:99, transition:"width .5s" }} />
            </div>
            <p style={{ fontSize:12, color:"var(--muted)", marginTop:8 }}>
              Solve {Math.max(0,(safeLevel*2+2)-solved)} more problems to reach {getLevelTitle(safeLevel+1)}!
            </p>
          </div>

          {/* Problems Solved */}
          <div style={{ background:"rgba(129,140,248,.05)", border:"1px solid rgba(129,140,248,.1)", borderRadius:16, padding:20 }}>
            <h3 style={{ fontFamily:"var(--display)", fontSize:16, marginBottom:16 }} className="grad-text">🏆 Problems Solved ({solved})</h3>
            {solved > 0 ? (
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {Object.values(PROBLEMS).slice(0, solved).map(p => (
                  <div key={p.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", background:"rgba(163,230,53,.05)", border:"1px solid rgba(163,230,53,.1)", borderRadius:10, padding:"10px 16px" }}>
                    <div>
                      <span style={{ fontSize:13, fontWeight:700 }}>{p.id}. {p.title}</span>
                      <span style={{ fontSize:11, color:"var(--muted)", marginLeft:8, fontFamily:"var(--mono)" }}>{p.companies}</span>
                    </div>
                    <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                      <span className={`tag ${p.diffClass}`}>{p.difficulty}</span>
                      <span style={{ color:"#a3e635", fontSize:16 }}>✅</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign:"center", padding:30, color:"var(--muted)" }}>
                <div style={{ fontSize:40, marginBottom:8 }}>💻</div>
                <p style={{ marginBottom:12 }}>No problems solved yet. Start practicing!</p>
                <button className="btn btn-primary" onClick={() => onNav("coding")}>Start Practicing →</button>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
};

/* ─────────────────────────────────────────
   ROOT APP
───────────────────────────────────────── */
export default function App() {
  // FIX #9 — Restore page from localStorage on refresh
  const [page, setPage] = useState(() => {
    try {
      const saved = localStorage.getItem("skillx_page");
      const valid = ["dashboard","coding","analytics","interview","profile"];
      return valid.includes(saved) ? saved : "landing";
    } catch(e) { return "landing"; }
  });

  // FIX #1 — Safe username, never null/undefined
  const [username, setUsername] = useState(() => {
    try {
      const saved = localStorage.getItem("skillx_username");
      return (saved && saved.trim()) ? saved.trim() : "";
    } catch(e) { return ""; }
  });
  const [userLevel, setUserLevel] = useState(() => {
    try { return Number(localStorage.getItem("skillx_level")) || 1; } catch(e) { return 1; }
  });
  const [userStreak, setUserStreak] = useState(() => {
    try { return Number(localStorage.getItem("skillx_streak")) || 0; } catch(e) { return 0; }
  });

  // FIX #1 — Always a safe display name
  const displayName = (username && username.trim()) ? username.trim() : "Developer";

  // FIX #1 + #8 — Sanitize name, store safely
  const onAuth = (name) => {
    const safe = (name && name.trim()) ? name.trim() : "Developer";
    setUsername(safe);
    try { localStorage.setItem("skillx_username", safe); } catch(e) {}
    setPage("dashboard");
    localStorage.setItem("skillx_page", "dashboard");
  };

  // FIX #9 — Persist page on navigation
  const onNav = (p) => {
    setPage(p);
    window.scrollTo(0, 0);
    try {
      const valid = ["dashboard","coding","analytics","interview","profile"];
      if (valid.includes(p)) {
        localStorage.setItem("skillx_page", p);
      } else {
        localStorage.removeItem("skillx_page");
      }
    } catch(e) {}
  };

  // FIX #9 — Logout clears full session
  const onLogout = () => {
    try {
      localStorage.removeItem("skillx_username");
      localStorage.removeItem("skillx_page");
      localStorage.removeItem("skillx_token"); // Fix #8 — clear JWT on logout
    } catch(e) {}
    setUsername("");
    setPage("landing");
  };

  const renderPage = () => {
    switch (page) {
      case "landing":   return <Landing onNav={onNav} />;
      case "login":     return <AuthPage mode="login"  onNav={onNav} onAuth={onAuth} />;
      case "signup":    return <AuthPage mode="signup" onNav={onNav} onAuth={onAuth} />;
      case "dashboard": return <Dashboard onNav={onNav} username={displayName} onLogout={onLogout} />;
      case "coding":    return <CodingPage onNav={onNav} username={displayName} onLogout={onLogout} userLevel={userLevel} userStreak={userStreak} />;
      case "analytics": return <Analytics  onNav={onNav} username={displayName} onLogout={onLogout} userLevel={userLevel} userStreak={userStreak} />;
      case "interview": return <Interview  onNav={onNav} username={displayName} onLogout={onLogout} userLevel={userLevel} userStreak={userStreak} />;
      case "profile":   return <ProfilePage onNav={onNav} username={displayName} onLogout={onLogout} userLevel={userLevel} userStreak={userStreak} />;
      default:          return <Landing onNav={onNav} />;
    }
  };

  return (
    <ToastProvider>
      <SkillXCanvas />
      {renderPage()}
    </ToastProvider>
  );
}