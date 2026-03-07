import "./styles.css";
import React, { useState, useEffect, useRef, useCallback } from "react";
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
            <button className="btn btn-outline btn-xl" onClick={() => onNav("dashboard")}>
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

  const submit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const email = fd.get("email") || "";
    const pass  = fd.get("pass")  || "";
    const errsNew = {};
    if (!email.includes("@")) errsNew.email = "Enter a valid email address";
    if (pass.length < (isLogin ? 5 : 8)) errsNew.pass = `Password must be ${isLogin ? "5" : "8"}+ characters`;
    if (!isLogin && fd.get("confirm") !== pass) errsNew.confirm = "Passwords do not match";
    if (Object.keys(errsNew).length) { setErrs(errsNew); return; }
    setErrs({});
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const name = fd.get("fname") || email.split("@")[0];
      onAuth(name);
      toast(isLogin ? `✦ Welcome back, ${name}!` : `✦ Account created! Welcome, ${name}!`, isLogin ? "#a855f7" : "#a3e635");
      onNav("dashboard");
    }, isLogin ? 1400 : 1700);
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

        <button className="google-btn" onClick={() => { onAuth("Developer"); toast("✦ Signed in with Google!", "#a855f7"); onNav("dashboard"); }}>
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

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
          <div className="form-group">
            <label className="form-label">Email</label>
            <div className="input-wrap"><span>✉</span><input name="email" type="email" placeholder="you@example.com" required /></div>
            {errs.email && <span className="form-error">{errs.email}</span>}
          </div>
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
const Sidebar = ({ activePage, onNav, username }) => {
  const items = [
    { id: "dashboard", icon: "⬡", label: "Dashboard" },
    { id: "coding",    icon: "{ }", label: "Practice", badge: "3" },
    { id: "interview", icon: "◈",  label: "Interview", badge: "HOT" },
    { id: "analytics", icon: "▦",  label: "Analytics" },
  ];
  return (
    <aside className="sidebar">
      <div className="sidebar-logo" onClick={() => onNav("landing")}>
        <div className="nav-logo-icon" style={{ width: 28, height: 28, fontSize: 12 }}>&lt;/&gt;</div>
        <span>Skill<span className="grad-text">X</span></span>
      </div>
      <div className="sidebar-user">
        <div className="avatar">{username.charAt(0).toUpperCase()}</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>{username}</div>
          <div style={{ fontSize: 11, fontWeight: 700, fontFamily: "var(--mono)" }} className="grad-text">✦ Level 12 · Expert</div>
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
      </nav>
      <div className="sidebar-footer">
        <div className="streak-box">
          <span style={{ fontSize: 26, animation: "sfPulse 1.5s ease-in-out infinite" }}>⭐</span>
          <div>
            <div style={{ fontSize: 24, fontWeight: 900, color: "var(--amber)", lineHeight: 1, fontFamily: "var(--mono)" }}>7</div>
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
const Dashboard = ({ onNav, username }) => {
  const [counts, setCounts] = useState([0, 0, 0, 0]);
  const toast = React.useContext(ToastContext);
  const targets = [87, 243, 7, 3];
  useEffect(() => {
    targets.forEach((t, i) => {
      let c = 0;
      const iv = setInterval(() => {
        c = Math.min(c + Math.ceil(t / 50), t);
        setCounts(p => { const n = [...p]; n[i] = c; return n; });
        if (c >= t) clearInterval(iv);
      }, 24);
    });
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

  const cards = [
    { icon:"🎯", val:counts[0], sfx:"%", label:"Accuracy", trend:"↑ +4% this week", up:true },
    { icon:"✅", val:counts[1], sfx:"", label:"Problems Solved", trend:"↑ +18 this week", up:true },
    { icon:"⭐", val:counts[2], sfx:"", label:"Day Streak", trend:"↑ Personal best", up:true },
    { icon:"🧠", val:counts[3], sfx:"", label:"Weak Topics", trend:"DP · Graphs · Tries", up:false },
  ];
  const glows = ["rgba(124,58,237,.07)","rgba(163,230,53,.06)","rgba(251,191,36,.06)","rgba(244,63,94,.05)"];
  const gradients = ["var(--grad)","var(--grad2)","linear-gradient(135deg,#fbbf24,#f59e0b)","linear-gradient(135deg,#f43f5e,#a855f7)"];

  return (
    <div className="app-shell page-enter" style={{ position:"relative", zIndex:1 }}>
      <Sidebar activePage="dashboard" onNav={onNav} username={username} />
      <main className="main-content">
        <div className="topbar">
          <div>
            <h1 style={{ fontFamily:"var(--display)", fontSize:21, fontWeight:800, letterSpacing:"-.4px" }}>Dashboard ⬡</h1>
            <p style={{ color:"var(--muted)", fontSize:13, marginTop:2 }}>Good morning, {username}. Let's ship some code.</p>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ position:"relative", fontSize:18, cursor:"pointer" }}>🔔<div className="nd" style={{ position:"absolute", top:0, right:0, width:8, height:8, background:"var(--crim)", borderRadius:"50%", border:"2px solid var(--bg)", boxShadow:"0 0 8px var(--crim)" }} /></div>
            <div className="avatar" style={{ width:30, height:30, fontSize:12 }}>{username.charAt(0).toUpperCase()}</div>
          </div>
        </div>

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
              {[["Two Sum","Google","tag-e","Easy"],["Longest Substring","Amazon","tag-m","Medium"],["Word Break II","Meta","tag-h","Hard"],["Coin Change","Microsoft","tag-m","Medium"],["N-Queens","Netflix","tag-h","Hard"]].map(([name, co, tc, diff]) => (
                <div key={name} className="problem-row" onClick={() => onNav("coding")}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700 }}>{name}</div>
                    <div style={{ fontSize:11, color:"var(--muted)", fontFamily:"var(--mono)" }}>{co}</div>
                  </div>
                  <span className={`tag ${tc}`}>{diff}</span>
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
   CODING PAGE
───────────────────────────────────────── */
const CodingPage = ({ onNav, username }) => {
  const [timer, setTimer] = useState(0);
  const [timerOn, setTimerOn] = useState(false);
  const [activeTab, setActiveTab] = useState("problem");
  const [result, setResult] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
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

  const runCode = () => {
    setRunning(true);
    toast("▶ Running test cases…", "#818cf8");
    setTimeout(() => {
      setRunning(false);
      setResult("pass");
      toast("✅ All test cases passed!", "#a3e635");
    }, 1200);
  };

  const submitCode = () => {
    setSubmitting(true);
    toast("⚡ Submitting solution…", "#a855f7");
    setTimeout(() => {
      setSubmitting(false);
      setAiResult(true);
      toast("🎉 Accepted! Score: 94/100", "#a855f7");
    }, 1700);
  };

  return (
    <div className="app-shell page-enter" style={{ position:"relative", zIndex:1 }}>
      <Sidebar activePage="coding" onNav={onNav} username={username} />
      <main className="main-content" style={{ display:"flex", flexDirection:"column", padding:0, overflow:"hidden" }}>
        {/* Coding bar */}
        <div className="coding-bar">
          <button className="btn btn-ghost btn-sm" onClick={() => onNav("dashboard")}>← Back</button>
          <select className="select-input">
            <option>Two Sum</option>
            <option>Longest Substring Without Repeating Chars</option>
            <option>Coin Change</option>
          </select>
          <span className="tag tag-e">Easy</span>
          <span style={{ fontSize:12, color:"var(--muted)", fontFamily:"var(--mono)" }}>Google · Amazon</span>
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
                <h2 style={{ fontFamily:"var(--display)", fontSize:20, fontWeight:800, marginBottom:12, letterSpacing:"-.5px" }}>1. Two Sum</h2>
                <div style={{ display:"flex", gap:8, marginBottom:18 }}>
                  <span className="tag tag-e">Easy</span>
                  <span className="problem-tag">Array</span>
                  <span className="problem-tag">Hash Table</span>
                </div>
                <p style={{ color:"#5a5a8a", fontSize:14, lineHeight:1.8, marginBottom:12 }}>Given an array of integers <span className="code-tag">nums</span> and an integer <span className="code-tag">target</span>, return <em style={{ color:"var(--p3)", fontStyle:"normal" }}>indices of the two numbers</em> such that they add up to target.</p>
                <div className="example-block">
                  <div className="example-label">Example 1</div>
                  <pre style={{ fontFamily:"var(--mono)", fontSize:12.5, lineHeight:1.8, color:"#5a5a8a" }}>{"Input:  nums = [2,7,11,15], target = 9\nOutput: [0,1]  ← 2 + 7 = 9"}</pre>
                </div>
                <div className="example-block" style={{ marginTop:12 }}>
                  <div className="example-label">Example 2</div>
                  <pre style={{ fontFamily:"var(--mono)", fontSize:12.5, lineHeight:1.8, color:"#5a5a8a" }}>{"Input:  nums = [3,2,4], target = 6\nOutput: [1,2]"}</pre>
                </div>
                <div className="constraints">
                  <div style={{ fontSize:13, fontWeight:700, marginBottom:9 }}>Constraints</div>
                  <ul style={{ paddingLeft:18, color:"var(--muted)", fontSize:13, lineHeight:1.9, fontFamily:"var(--mono)" }}>
                    <li>2 ≤ nums.length ≤ 10⁴</li>
                    <li>-10⁹ ≤ nums[i] ≤ 10⁹</li>
                    <li>Only one valid answer exists.</li>
                  </ul>
                </div>
              </>}
              {activeTab === "hints" && <>
                <h3 style={{ marginBottom:16, fontFamily:"var(--display)" }} className="grad-text">💡 Hints</h3>
                {["Brute force is O(n²). Think about a data structure for O(1) lookup.","Fix x. You need to find target − x. Can you store numbers you've already seen?","A hash map storing value → index lets you check any complement in O(1)."].map((h, i) => (
                  <div key={i} className="example-block" style={{ marginTop:12 }}>
                    <div className="example-label">Hint {i+1}</div>
                    <p style={{ color:"var(--muted)", fontSize:14 }}>{h}</p>
                  </div>
                ))}
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
                  <span style={{ fontSize:12, color:"var(--muted)", fontFamily:"var(--mono)", marginLeft:6 }}>solution.py</span>
                </div>
                <select className="select-input">
                  <option>🐍 Python</option><option>☕ Java</option><option>⚡ C++</option><option>🟡 JS</option>
                </select>
              </div>
              <div className="editor-content" contentEditable spellCheck={false}>
                <span className="token-kw">class </span><span className="token-fn2">Solution</span>:<br/>
                {"    "}<span className="token-kw">def </span><span className="token-fn2">twoSum</span><span style={{ color:"#5a5a8a" }}>(self, nums, target):</span><br/>
                {"        "}<span className="token-cm"># Your solution here</span><br/>
                {"        "}<span style={{ color:"#5a5a8a" }}>seen = {"{}"}</span><br/>
                {"        "}<span className="token-kw">for </span><span className="token-fn">i, num </span><span className="token-kw">in </span><span className="token-fn2">enumerate</span><span style={{ color:"#5a5a8a" }}>(nums):</span><br/>
                {"            "}<span className="token-fn">complement</span><span style={{ color:"#5a5a8a" }}> = target - num</span><br/>
                {"            "}<span className="token-kw">if </span><span className="token-fn">complement </span><span className="token-kw">in </span><span style={{ color:"#5a5a8a" }}>seen:</span><br/>
                {"                "}<span className="token-kw">return </span><span style={{ color:"#5a5a8a" }}>[seen[complement], i]</span><br/>
                {"            "}<span style={{ color:"#5a5a8a" }}>seen[num] = i</span><br/>
                {"        "}<span className="token-kw">return </span><span style={{ color:"#5a5a8a" }}>[]</span><span className="cursor-blink" />
              </div>
              <div className="editor-footer">
                <span style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--muted)" }}>Python 3 · UTF-8 · Ln 9</span>
                <div style={{ display:"flex", gap:8 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => toast("⚡ Formatted!", "#818cf8")}>⚡ Format</button>
                  <button className="btn btn-outline btn-sm" onClick={runCode} disabled={running}>
                    {running ? "Running…" : "▶ Run"}
                  </button>
                  <button className="btn btn-primary btn-sm" onClick={submitCode} disabled={submitting}>
                    {submitting ? "Submitting…" : "⚡ Submit"}
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
                {result === "pass" && (
                  <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                    {["Case 1: Passed → [0,1]","Case 2: Passed → [1,2]","Case 3: Passed → [0,1]"].map(r => (
                      <div key={r} style={{ display:"flex", gap:8, fontSize:13, alignItems:"center" }}>
                        <span style={{ color:"var(--acid)", fontWeight:700 }}>✅</span>
                        <span style={{ color:"var(--acid)", fontFamily:"var(--mono)" }}>{r}</span>
                      </div>
                    ))}
                    <div style={{ fontSize:12, color:"var(--muted)", fontFamily:"var(--mono)", marginTop:4 }}>Runtime: 41ms · Memory: 14.1 MB</div>
                  </div>
                )}
              </div>
            </div>

            {/* AI panel */}
            {aiResult && (
              <div className="ai-panel">
                <div className="ai-panel-head">
                  <span style={{ fontWeight:700 }}>🤖 AI Code Analysis</span>
                  <div className="ai-score-pill">✦ Score: 94/100</div>
                  <button style={{ background:"none", border:"none", color:"var(--muted)", fontSize:20, cursor:"pointer", marginLeft:8 }} onClick={() => setAiResult(null)}>×</button>
                </div>
                <div className="ai-grid">
                  {[["⏱ Time","O(n) ✅","var(--acid)"],["💾 Space","O(n) ✅","var(--acid)"],["🧪 Tests","142/142 ✅","var(--acid)"],["📊 Beats","89% Python","var(--p3)"],["💡 Tip","Add type hints","var(--muted)"],["✦ Rating","✦✦✦✦","var(--p2)"]].map(([l, v, c]) => (
                    <div key={l} className="ai-item">
                      <div className="ai-item-label">{l}</div>
                      <div className="ai-item-val" style={{ color:`var(--${c.replace("var(--","").replace(")","")})` || c }}>{v}</div>
                    </div>
                  ))}
                </div>
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
const Analytics = ({ onNav, username }) => {
  const lineRef = useRef(null);
  const barRef  = useRef(null);
  const donutRef = useRef(null);
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
      charts.push(new window.Chart(lineRef.current, { type:"line", data:{ labels:["Mon","Tue","Wed","Thu","Fri","Sat","Sun"], datasets:[{ data:[7,4,9,12,6,3,8], borderColor:"#a855f7", borderWidth:2.5, backgroundColor:g, pointBackgroundColor:"#a3e635", pointBorderColor:"#04040a", pointRadius:5, tension:.42, fill:true }] }, options:opts }));
    }
    if (barRef.current) {
      charts.push(new window.Chart(barRef.current, { type:"bar", data:{ labels:["Easy","Medium","Hard"], datasets:[{ data:[94,78,55], backgroundColor:["rgba(163,230,53,.5)","rgba(251,191,36,.5)","rgba(244,63,94,.5)"], borderColor:["#a3e635","#fbbf24","#f43f5e"], borderWidth:2, borderRadius:8, borderSkipped:false }] }, options:{...opts, scales:{...opts.scales, y:{...opts.scales.y, max:100}}} }));
    }
    if (donutRef.current) {
      charts.push(new window.Chart(donutRef.current, { type:"doughnut", data:{ labels:["Arrays","Strings","Trees","DP","Graphs","Other"], datasets:[{ data:[30,20,18,14,10,8], backgroundColor:["rgba(124,58,237,.7)","rgba(168,85,247,.7)","rgba(163,230,53,.7)","rgba(251,191,36,.7)","rgba(244,63,94,.7)","rgba(82,82,110,.7)"], borderWidth:0, hoverOffset:6, borderRadius:3 }] }, options:{ responsive:true, maintainAspectRatio:false, cutout:"68%", plugins:{ legend:{ position:"right", labels:{ color:"#52526e", font:{size:11,family:"JetBrains Mono"}, boxWidth:11, padding:12 } }, tooltip:{ backgroundColor:"#111118", borderColor:"#a855f7", borderWidth:1, bodyColor:"#8888aa", padding:10 } } } }));
    }
    return () => charts.forEach(c => c.destroy());
  }, []);

  return (
    <div className="app-shell page-enter" style={{ position:"relative", zIndex:1 }}>
      <Sidebar activePage="analytics" onNav={onNav} username={username} />
      <main className="main-content">
        <div className="topbar">
          <div>
            <h1 style={{ fontFamily:"var(--display)", fontSize:21, fontWeight:800, letterSpacing:"-.4px" }}>Analytics ▦</h1>
            <p style={{ color:"var(--muted)", fontSize:13, marginTop:2 }}>Track every bit of progress</p>
          </div>
        </div>
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
              {[["Arrays",92,"var(--grad)","var(--p3)"],["Strings",85,"var(--grad)","var(--p3)"],["Trees",74,"linear-gradient(135deg,#fbbf24,#f59e0b)","#fbbf24"],["Graphs",52,"linear-gradient(135deg,#f43f5e,#a855f7)","#f43f5e"],["DP",41,"linear-gradient(135deg,#f43f5e,#a855f7)","#f43f5e"],["Tries",38,"linear-gradient(135deg,#f43f5e,#a855f7)","#f43f5e"]].map(([n,p,g,c]) => (
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
              {[["Mon",70,false],["Tue",40,false],["Wed",90,false],["Thu",100,true],["Fri",60,false],["Sat",30,false],["Sun",50,false]].map(([d,h,peak]) => (
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
const Interview = ({ onNav, username }) => {
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState("");
  const [done, setDone] = useState(false);
  const [drag, setDrag] = useState(false);
  const toast = React.useContext(ToastContext);

  const processResume = () => {
    const steps = ["Parsing document…","Extracting skills…","Generating questions…","Done! ✦"];
    let w = 0, si = 0;
    setProgress(0); setStep(steps[0]);
    const iv = setInterval(() => {
      w = Math.min(w + 2.5, 100);
      setProgress(w);
      if (w >= 25 * (si + 1) && si < 3) { si++; setStep(steps[si]); }
      if (w >= 100) { clearInterval(iv); setTimeout(() => { setDone(true); toast("✦ Resume analyzed! 14 skills detected", "#a3e635"); }, 400); }
    }, 50);
  };

  return (
    <div className="app-shell page-enter" style={{ position:"relative", zIndex:1 }}>
      <Sidebar activePage="interview" onNav={onNav} username={username} />
      <main className="main-content">
        <div className="topbar">
          <div>
            <h1 style={{ fontFamily:"var(--display)", fontSize:21, fontWeight:800, letterSpacing:"-.4px" }}>Resume Interview ◈</h1>
            <p style={{ color:"var(--muted)", fontSize:13, marginTop:2 }}>Upload your resume → get personalized questions</p>
          </div>
        </div>
        <div className="interview-grid">
          {/* Upload zone */}
          <div className={`upload-zone${drag?" dragover":""}`} onDragOver={e=>{e.preventDefault();setDrag(true)}} onDragLeave={()=>setDrag(false)} onDrop={e=>{e.preventDefault();setDrag(false);processResume();}}>
            <div className="upload-icon">📄</div>
            <h3 style={{ fontFamily:"var(--display)", fontSize:19, fontWeight:700, marginBottom:8 }}>Upload Your Resume</h3>
            <p style={{ color:"var(--muted)", fontSize:14, marginBottom:24 }}>Drag & drop or click to upload PDF or DOCX</p>
            <input type="file" id="resume-file" accept=".pdf,.docx" style={{ display:"none" }} onChange={processResume} />
            <button className="btn btn-primary" onClick={() => document.getElementById("resume-file").click()}>Choose File</button>
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
                {[["Languages",["Python","Java","JavaScript","C++"]],["Frameworks",["React","Spring Boot","Node.js"]],["Cloud & Tools",["Docker","AWS","Kubernetes","Git"]],["Databases",["PostgreSQL","MongoDB","Redis"]]].map(([cat, tags]) => (
                  <div key={cat}>
                    <div style={{ fontSize:11, fontWeight:700, color:"var(--muted)", letterSpacing:"1.2px", textTransform:"uppercase", marginBottom:8, fontFamily:"var(--mono)" }}>{cat}</div>
                    <div className="skill-tags">{tags.map(t => <span key={t} className="skill-tag">{t}</span>)}</div>
                  </div>
                ))}
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
                {[["Docker containers vs VMs — how have you used Docker in production?","Docker","tag-m"],["Design a scalable REST API with Spring Boot — patterns you follow?","Spring Boot","tag-h"],["Optimise a slow PostgreSQL query — describe your indexing strategy.","PostgreSQL","tag-m"],["Implement a React hook that debounces API calls.","React","tag-e"]].map(([q, tag, tc], i) => (
                  <div key={i} className="question-item">
                    <div className="question-num">Q{i+1}</div>
                    <div>
                      <p style={{ fontSize:13, lineHeight:1.65, marginBottom:7, color:"#5a5a9a" }}>{q}</p>
                      <div style={{ display:"flex", gap:6 }}>
                        <span className="skill-tag" style={{ fontSize:11 }}>{tag}</span>
                        <span className={`tag ${tc}`}>{tc==="tag-e"?"Easy":tc==="tag-m"?"Medium":"Hard"}</span>
                      </div>
                    </div>
                  </div>
                ))}
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
            <button className="btn btn-acid btn-xl" disabled={!done} onClick={() => { toast("🎤 Starting mock interview…", "#a855f7"); setTimeout(() => onNav("coding"), 1200); }}>
              Start Mock Interview →
            </button>
            {!done && <p style={{ color:"var(--muted)", fontSize:13, marginTop:12 }}>Upload your resume first to enable</p>}
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
  const [page, setPage] = useState("landing");
  const [username, setUsername] = useState("Developer");

  const onAuth = (name) => setUsername(name);
  const onNav  = (p) => { setPage(p); window.scrollTo(0, 0); };

  const renderPage = () => {
    switch (page) {
      case "landing":   return <Landing onNav={onNav} />;
      case "login":     return <AuthPage mode="login"  onNav={onNav} onAuth={onAuth} />;
      case "signup":    return <AuthPage mode="signup" onNav={onNav} onAuth={onAuth} />;
      case "dashboard": return <Dashboard onNav={onNav} username={username} />;
      case "coding":    return <CodingPage onNav={onNav} username={username} />;
      case "analytics": return <Analytics onNav={onNav} username={username} />;
      case "interview": return <Interview onNav={onNav} username={username} />;
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