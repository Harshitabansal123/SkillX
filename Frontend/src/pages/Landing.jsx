import React, { useEffect, useRef } from "react";

const Landing = ({ onNav }) => {
  const chartRef = useRef(null);

  useEffect(() => {
    // Reveal animations
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.style.opacity = "1";
          e.target.style.transform = "translateY(0)";
        }
      });
    }, { threshold: 0.08 });
    document.querySelectorAll(".reveal").forEach((el) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(20px)";
      el.style.transition = "opacity .55s ease, transform .55s ease";
      obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  return (
    <div className="landing">
      {/* NAV */}
      <nav className="landing-nav">
        <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => onNav("landing")}>
          <div className="logo-icon" style={{ width: 30, height: 30, fontSize: 12, background: "var(--green)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#000", fontFamily: "var(--mono)" }}>SX</div>
          <span style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>Skill<span style={{ color: "var(--green)" }}>X</span></span>
        </div>
        <div className="landing-nav-links">
          <button className="nav-link" onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}>Features</button>
          <button className="nav-link" onClick={() => document.getElementById("how")?.scrollIntoView({ behavior: "smooth" })}>How It Works</button>
          <button className="btn btn-ghost btn-sm" onClick={() => onNav("login")}>Sign In</button>
          <button className="btn btn-primary btn-sm" onClick={() => onNav("signup")}>Get Started</button>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div>
          <div className="hero-badge">
            <span className="live-dot" />
            AI-Powered · Real Interviews · Adaptive
          </div>
          <h1 className="hero-title">
            Crack Your Next<br />
            <span className="accent">Coding Interview</span>
          </h1>
          <p className="hero-sub">
            Practice real interview questions, get instant AI feedback, and follow a structured roadmap designed to get you hired at FAANG and top startups.
          </p>
          <div className="hero-actions">
            <button className="btn btn-primary btn-lg" onClick={() => onNav("signup")}>
              Start for free →
            </button>
            <button className="btn btn-ghost btn-lg" onClick={() => onNav("login")}>
              View Dashboard
            </button>
          </div>
          <div className="hero-stats">
            {[["50K+", "Developers"], ["2.4M", "Problems Solved"], ["94%", "Offer Rate"]].map(([v, l]) => (
              <div key={l}>
                <div className="hero-stat-val">{v}</div>
                <div className="hero-stat-lbl">{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Code card */}
        <div className="code-preview">
          <div className="code-header">
            <div className="dot dot-r" /><div className="dot dot-y" /><div className="dot dot-g" />
            <span className="code-filename">solution.py</span>
            <span className="ai-live-badge">● AI LIVE</span>
          </div>
          <div className="code-body">
            <div><span className="token-kw">def </span><span className="token-fn2">twoSum</span><span className="token-var">(nums, target):</span></div>
            <div style={{ paddingLeft: 20 }}><span className="token-cm"># AI: Hash map → O(n) time</span></div>
            <div style={{ paddingLeft: 20 }}><span className="token-fn">seen</span><span className="token-var"> = {"{}"}</span></div>
            <div style={{ paddingLeft: 20 }}><span className="token-kw">for </span><span className="token-fn">i, n </span><span className="token-kw">in </span><span className="token-fn2">enumerate</span><span className="token-var">(nums):</span></div>
            <div style={{ paddingLeft: 40 }}><span className="token-kw">if </span><span className="token-var">target - n </span><span className="token-kw">in </span><span className="token-fn">seen</span><span className="token-var">:</span></div>
            <div style={{ paddingLeft: 60 }}><span className="token-kw">return </span><span className="token-var">[seen[target-n], i]</span></div>
            <div style={{ paddingLeft: 40 }}><span className="token-fn">seen</span><span className="token-var">[n] = i</span></div>
            <div style={{ paddingLeft: 20 }}><span className="cursor-blink" /></div>
          </div>
          <div className="code-result">
            <span className="score-pill">✦ 97/100</span>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Optimal hash map approach</span>
          </div>
          <div className="code-metrics">
            {[["O(n)", "Time"], ["O(n)", "Space"], ["142/142", "Tests"]].map(([v, l]) => (
              <div className="metric-item" key={l}>
                <div className="metric-val">{v}</div>
                <div className="metric-lbl">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROBLEM STATS BAND */}
      <div style={{ borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", background: "var(--bg-raised)", padding: "20px 48px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", gap: 40, alignItems: "center", justifyContent: "center" }}>
          {[
            ["Easy", "#22c55e", "843"],
            ["Medium", "#f59e0b", "1,764"],
            ["Hard", "#ef4444", "762"],
          ].map(([d, c, n]) => (
            <div key={d} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />
              <span style={{ fontSize: 13, color: "var(--text-secondary)", fontFamily: "var(--mono)" }}>{n} {d}</span>
            </div>
          ))}
          <div style={{ width: 1, height: 24, background: "var(--border)" }} />
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Problems across LeetCode, Codeforces, GFG & HackerRank</span>
        </div>
      </div>

      {/* FEATURES */}
      <section className="section" id="features">
        <div className="section-label reveal">Features</div>
        <h2 className="section-title reveal">Everything you need to<br />get hired</h2>
        <p className="section-sub reveal">Three AI-powered tools that adapt to you.</p>
        <div className="features-grid">
          {[
            {
              icon: "🧠", title: "AI Code Analyzer", featured: false,
              desc: "Get instant feedback on time complexity, space complexity, edge cases, and style — like having a senior engineer review every solution in real time.",
              foot: "Instant · Precise · Deep"
            },
            {
              icon: "⬡", title: "Adaptive Roadmap", featured: true, badge: "Roadmap.sh style",
              desc: "An interactive visual roadmap that tracks your progress across topics. Click any node, see curated problems from multiple platforms, mark solved.",
              foot: "Visual · Interactive · Tracked"
            },
            {
              icon: "📄", title: "Resume Interviews", featured: false,
              desc: "Upload your resume, AI reads your tech stack and generates company-specific interview questions. Practice exactly what FAANG will ask you.",
              foot: "FAANG · Personalized · Real"
            },
          ].map(({ icon, title, desc, foot, featured, badge }) => (
            <div key={title} className={`feature-card reveal${featured ? " featured" : ""}`}>
              {badge && (
                <div style={{ position: "absolute", top: 16, right: 16, background: "var(--green-faint)", border: "1px solid #22c55e22", color: "var(--green)", fontSize: 10, fontWeight: 600, padding: "3px 10px", borderRadius: 99, fontFamily: "var(--mono)" }}>
                  {badge}
                </div>
              )}
              <div className="feature-icon">{icon}</div>
              <div className="feature-title">{title}</div>
              <div className="feature-desc">{desc}</div>
              <div className="feature-foot">{foot}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="section" id="how" style={{ paddingTop: 0 }}>
        <div className="section-label reveal">Process</div>
        <h2 className="section-title reveal">From zero to <span style={{ color: "var(--green)" }}>hired</span></h2>
        <div className="steps-grid">
          {[
            ["01", "👤", "Create Profile", "Sign up and upload your resume. AI builds a personalized study plan instantly."],
            ["02", "🗺️", "Follow the Roadmap", "Work through the interactive DSA roadmap. Track every problem you solve."],
            ["03", "⚡", "Daily Practice", "Solve AI-curated problems with instant feedback. Climb difficulty naturally."],
            ["04", "🏆", "Ace Interviews", "Mock interviews powered by your actual resume. Practice with real company questions."],
          ].map(([n, icon, title, desc]) => (
            <div key={n} className="step-card reveal">
              <div className="step-num">{n}</div>
              <div className="step-icon">{icon}</div>
              <div className="step-title">{title}</div>
              <div className="step-desc">{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="section-label reveal">Testimonials</div>
        <h2 className="section-title reveal">Developers who made it</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
          {[
            { q: "SkillX's AI feedback caught inefficiencies I never would have spotted. Got my Google offer after 6 weeks.", name: "Arjun Mehta", role: "SWE @ Google" },
            { q: "The roadmap made it so clear what to study next. No more random grinding — just focused, structured practice.", name: "Sara Kim", role: "ML Engineer @ Meta" },
            { q: "The resume interview feature is next level. Every question it generated came up in my actual Amazon interview.", name: "Ravi Patel", role: "Backend Eng @ Amazon" },
          ].map(({ q, name, role }) => (
            <div key={name} className="card reveal">
              <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.75, marginBottom: 18 }}>"{q}"</p>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div className="user-avatar" style={{ width: 34, height: 34, fontSize: 13, flexShrink: 0 }}>
                  {name.charAt(0)}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{name}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>{role}</div>
                </div>
                <div style={{ marginLeft: "auto", color: "#f59e0b", fontSize: 13 }}>★★★★★</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div className="cta-section">
        <div className="cta-box reveal">
          <div style={{ fontSize: 42, marginBottom: 16 }}>⬡</div>
          <div className="cta-title">Ready to level up?</div>
          <div className="cta-sub">Join 50,000+ developers who cracked FAANG with SkillX. Free to start, no credit card required.</div>
          <button className="btn btn-primary btn-lg" onClick={() => onNav("signup")}>
            Create free account →
          </button>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 14 }}>No credit card · Cancel anytime</p>
        </div>
      </div>

      {/* FOOTER */}
      <footer>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div className="logo-icon" style={{ width: 26, height: 26, fontSize: 11, background: "var(--green)", borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#000", fontFamily: "var(--mono)" }}>SX</div>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Skill<span style={{ color: "var(--green)" }}>X</span></span>
        </div>
        <div className="footer-links">
          {["Privacy", "Terms", "Blog", "Contact", "GitHub"].map((l) => (
            <span key={l} className="footer-link">{l}</span>
          ))}
        </div>
        <p style={{ fontSize: 12, color: "var(--text-muted)" }}>© 2025 SkillX</p>
      </footer>
    </div>
  );
};

export default Landing;