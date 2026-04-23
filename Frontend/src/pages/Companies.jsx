import React, { useState, useEffect, useContext } from "react";
import { Sidebar, Topbar, DiffTag, ToastContext } from "../components/shared.jsx";
import { apiCall } from "./DashboardPages.jsx";

const COMPANY_DOMAINS = {
  amazon:"amazon.com", google:"google.com", microsoft:"microsoft.com",
  adobe:"adobe.com", facebook:"meta.com", apple:"apple.com",
  uber:"uber.com", netflix:"netflix.com", goldmansachs:"goldmansachs.com",
  bloomberg:"bloomberg.com", oracle:"oracle.com", salesforce:"salesforce.com",
  morganstanley:"morganstanley.com"
};

function CompanyLogo({ name, domain, emoji }) {
  const [failed, setFailed] = useState(false);
  if (!domain || failed) {
    return <div className="company-logo-fallback">{emoji||"🏢"}</div>;
  }
  return (
    <div className="company-logo">
      <img
        src={`https://logo.clearbit.com/${domain}`}
        alt={name}
        onError={() => setFailed(true)}
        style={{ width:22,height:22,objectFit:"contain" }}
      />
    </div>
  );
}

export function CompaniesPage({ onNav, username, onLogout, userLevel=1, userStreak=0 }) {
  const toast = useContext(ToastContext);
  const [companies, setCompanies] = useState([]);
  const [selected, setSelected]   = useState(null);
  const [questions, setQuestions] = useState([]);
  const [companyInfo, setCompanyInfo] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [qLoading, setQLoading]   = useState(false);
  const [search, setSearch]       = useState("");
  const [diffFilter, setDiffFilter] = useState("");

  useEffect(() => {
    apiCall("/companies/","GET").then((d) => {
      setCompanies(d.companies||[]);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const loadCompany = async (id) => {
    setSelected(id); setQLoading(true); setDiffFilter("");
    try {
      const d = await apiCall(`/companies/${id}/`,"GET");
      setQuestions(d.questions||[]);
      setCompanyInfo(d.company||null);
    } catch { toast("Could not load questions","error"); }
    finally { setQLoading(false); }
  };

  const filtered = companies.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));
  const filteredQ = questions.filter((q) => !diffFilter || q.difficulty===diffFilter);
  const PLAT = { lc:["#FEF3C7","#92400E","LeetCode"], cf:["#EDE9FE","#5B21B6","Codeforces"], gfg:["#D1FAE5","#065F46","GFG"] };
  const diffC = { Easy:"var(--easy)", Medium:"var(--medium)", Hard:"var(--hard)" };

  return (
    <div className="app-shell page-enter">
      <Sidebar activePage="companies" onNav={onNav} username={username} onLogout={onLogout} level={userLevel} streak={userStreak} />
      <div className="main-content">
        <Topbar title="Company Questions" subtitle="Real interview questions · click to open on platform" username={username} />
        <div className="companies-layout">
          {/* Company sidebar */}
          <div className="company-sidebar">
            <div className="company-search">
              <input className="input" placeholder="🔍 Search company…" value={search} onChange={(e)=>setSearch(e.target.value)} style={{ fontSize:13 }} />
            </div>
            <div className="company-list">
              {loading ? (
                <div style={{ padding:20,textAlign:"center",color:"var(--text-muted)",fontSize:13 }}>Loading…</div>
              ) : filtered.map((c) => (
                <div key={c.id} className={`company-item${selected===c.id?" active":""}`} onClick={() => loadCompany(c.id)}>
                  <CompanyLogo name={c.name} domain={COMPANY_DOMAINS[c.id]} emoji={c.emoji} />
                  <div>
                    <div className="company-name">{c.name}</div>
                    <div className="company-count">{c.question_count} questions</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Questions panel */}
          <div className="questions-panel">
            {!selected ? (
              <div style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",color:"var(--text-muted)" }}>
                <div style={{ fontSize:52,marginBottom:16 }}>🏢</div>
                <div style={{ fontSize:16,fontWeight:500,marginBottom:6,color:"var(--text-secondary)" }}>Select a company</div>
                <div style={{ fontSize:13 }}>Click any company to see their interview questions</div>
              </div>
            ) : (
              <>
                <div className="questions-header">
                  {companyInfo && (
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:16,fontWeight:600,marginBottom:6 }}>{companyInfo.full_name}</div>
                      <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
                        {(companyInfo.rounds||[]).map((r) => (
                          <span key={r} style={{ fontSize:11,padding:"2px 8px",borderRadius:99,background:"var(--green-faint)",border:"1px solid #22c55e22",color:"var(--green)",fontFamily:"var(--mono)" }}>{r}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div style={{ display:"flex",gap:8,alignItems:"center",marginLeft:"auto" }}>
                    <select className="select-styled" value={diffFilter} onChange={(e)=>setDiffFilter(e.target.value)} style={{ fontSize:12 }}>
                      <option value="">All</option>
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                    <span style={{ fontSize:11,color:"var(--text-muted)",fontFamily:"var(--mono)" }}>{filteredQ.length} Q</span>
                  </div>
                </div>

                <div className="questions-list">
                  {qLoading ? (
                    <div style={{ padding:40,textAlign:"center",color:"var(--text-muted)",fontSize:13 }}>Loading…</div>
                  ) : filteredQ.map((q,i) => {
                    const [bg,fg,plname] = PLAT[q.platform?.toLowerCase()]||PLAT.lc;
                    return (
                      <div key={i} className="question-row" onClick={() => window.open(q.leetcode_url,"_blank")}>
                        <span className="q-num">{q.id}</span>
                        <span className="q-title">{q.title}</span>
                        <div className="q-meta">
                          <span style={{ fontSize:10,padding:"1px 6px",borderRadius:3,fontWeight:600,background:bg,color:fg }}>{q.topic}</span>
                          <DiffTag difficulty={q.difficulty} />
                          <span style={{ fontSize:18,color:"var(--text-muted)" }}>↗</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── INTERVIEW PAGE ── */
export function Interview({ onNav, username, onLogout, userLevel=1, userStreak=0 }) {
  const toast = useContext(ToastContext);
  const [drag, setDrag]         = useState(false);
  const [progress, setProgress] = useState(0);
  const [step, setStep]         = useState("");
  const [done, setDone]         = useState(false);
  const [skills, setSkills]     = useState({});
  const [questions, setQuestions] = useState([]);
  const [err, setErr]           = useState("");

  const processResume = async (file) => {
    if (!file?.name?.endsWith(".pdf")) { toast("Only PDF files supported","warn"); return; }
    setErr(""); setDone(false); setSkills({}); setQuestions([]); setProgress(0);
    const steps = ["Parsing document…","Extracting skills…","Generating questions…","Done! ✓"];
    let w=0, si=0;
    setStep(steps[0]);
    const iv = setInterval(() => {
      w = Math.min(w+1.5, 90); setProgress(w);
      if (w >= 25*(si+1) && si < 3) { si++; setStep(steps[si]); }
    }, 40);
    try {
      const t = localStorage.getItem("skillx_token");
      const fd = new FormData(); fd.append("resume", file);
      const res = await fetch(`${import.meta.env.VITE_API_URL||"http://localhost:8000/api"}/resume/upload/`, {
        method:"POST", headers:{"Authorization":`Bearer ${t}`}, body:fd
      });
      const d = await res.json(); clearInterval(iv);
      if (!res.ok) { setErr(d.error||"Failed"); setProgress(0); setStep(""); return; }
      setProgress(100); setStep("Done! ✓");
      setSkills(d.skills||{}); setQuestions(d.questions||[]);
      setTimeout(() => { setDone(true); toast(`Resume analyzed! ${Object.values(d.skills||{}).flat().length} skills found`,"success"); }, 400);
    } catch { clearInterval(iv); setProgress(0); setStep(""); setErr("Could not connect to backend"); }
  };

  return (
    <div className="app-shell page-enter">
      <Sidebar activePage="interview" onNav={onNav} username={username} onLogout={onLogout} level={userLevel} streak={userStreak} />
      <div className="main-content">
        <Topbar title="Resume Interview" subtitle="Upload resume → get personalized FAANG questions" username={username} />
        <div className="page-body">
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16 }}>
            {/* Upload zone */}
            <div className={`upload-zone${drag?" dragover":""}`}
              onDragOver={(e)=>{e.preventDefault();setDrag(true)}}
              onDragLeave={()=>setDrag(false)}
              onDrop={(e)=>{e.preventDefault();setDrag(false);processResume(e.dataTransfer.files[0])}}
            >
              <div style={{ fontSize:44 }}>📄</div>
              <div className="upload-title">Upload Your Resume</div>
              <div className="upload-sub">Drag & drop or click to upload PDF</div>
              <input type="file" id="rf" accept=".pdf" style={{ display:"none" }} onChange={(e)=>processResume(e.target.files[0])} />
              <button className="btn btn-primary" onClick={() => document.getElementById("rf").click()}>Choose File</button>
              {err && <div style={{ color:"var(--red)",fontSize:12,marginTop:12 }}>⚠ {err}</div>}
              {progress > 0 && !done && (
                <div style={{ width:"100%",marginTop:20 }}>
                  <div style={{ height:3,background:"var(--bg-overlay)",borderRadius:2,overflow:"hidden",marginBottom:8 }}>
                    <div style={{ height:"100%",width:`${progress}%`,background:"var(--green)",borderRadius:2,transition:"width .3s" }} />
                  </div>
                  <div style={{ fontSize:12,color:"var(--text-muted)" }}>{step}</div>
                </div>
              )}
            </div>

            {/* Skills */}
            <div className="card">
              <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16 }}>
                <div style={{ fontSize:14,fontWeight:600 }}>Extracted Skills</div>
                <span style={{ fontSize:11,color:"var(--green)",fontFamily:"var(--mono)" }}>AI Detected</span>
              </div>
              {!done ? (
                <div style={{ textAlign:"center",padding:"30px 0",color:"var(--text-muted)" }}>
                  <div style={{ fontSize:32,marginBottom:10 }}>⏳</div>
                  <div style={{ fontSize:13 }}>Upload resume to extract skills</div>
                </div>
              ) : Object.keys(skills).length > 0 ? (
                Object.entries(skills).map(([cat,tags]) => (
                  <div key={cat} style={{ marginBottom:14 }}>
                    <div style={{ fontSize:10,fontWeight:600,color:"var(--text-muted)",letterSpacing:"1px",textTransform:"uppercase",fontFamily:"var(--mono)",marginBottom:7 }}>{cat}</div>
                    <div style={{ display:"flex",flexWrap:"wrap",gap:6 }}>
                      {tags.map((t) => (
                        <span key={t} style={{ fontSize:12,padding:"3px 10px",borderRadius:99,background:"var(--bg-overlay)",border:"1px solid var(--border)",color:"var(--text-secondary)" }}>{t}</span>
                      ))}
                    </div>
                  </div>
                ))
              ) : <div style={{ color:"var(--text-muted)",fontSize:13 }}>No skills detected.</div>}
            </div>
          </div>

          {/* Questions */}
          <div className="card" style={{ marginBottom:16 }}>
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16 }}>
              <div style={{ fontSize:14,fontWeight:600 }}>Generated Questions</div>
              {done && <span style={{ fontSize:12,color:"var(--green)",cursor:"pointer",fontWeight:500 }} onClick={() => toast("Regenerating…","info")}>↻ Regenerate</span>}
            </div>
            {!done ? (
              <div style={{ textAlign:"center",padding:"28px 0",color:"var(--text-muted)" }}>
                <div style={{ fontSize:32,marginBottom:10 }}>🤖</div>
                <div style={{ fontSize:13 }}>AI generates questions after resume upload</div>
              </div>
            ) : questions.length > 0 ? (
              <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
                {questions.map((q,i) => (
                  <div key={i} style={{ padding:"12px 14px",background:"var(--bg-overlay)",borderRadius:8,border:"1px solid var(--border)" }}>
                    <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:6 }}>
                      <span style={{ fontSize:11,fontWeight:700,color:"var(--text-muted)",fontFamily:"var(--mono)",minWidth:20 }}>Q{i+1}</span>
                      <DiffTag difficulty={q.difficulty} />
                      <span style={{ fontSize:11,padding:"2px 7px",borderRadius:4,background:"var(--bg-card)",border:"1px solid var(--border)",color:"var(--text-muted)" }}>{q.skill}</span>
                    </div>
                    <p style={{ fontSize:13,color:"var(--text-secondary)",lineHeight:1.7 }}>{q.question}</p>
                  </div>
                ))}
              </div>
            ) : <div style={{ color:"var(--text-muted)",fontSize:13 }}>No questions generated.</div>}
          </div>

          {/* Mock CTA */}
          <div className="card" style={{ textAlign:"center",padding:"36px 28px" }}>
            <div style={{ fontSize:44,marginBottom:16 }}>🎤</div>
            <div style={{ fontSize:20,fontWeight:700,marginBottom:10 }}>Ready for your mock interview?</div>
            <p style={{ fontSize:14,color:"var(--text-secondary)",lineHeight:1.75,maxWidth:500,margin:"0 auto 24px" }}>
              AI will ask questions live, analyze your responses, and give detailed feedback — just like a real FAANG interview.
            </p>
            <div style={{ display:"flex",justifyContent:"center",gap:20,marginBottom:28,flexWrap:"wrap" }}>
              {[["🤖","AI Interviewer"],["⏱","Timed"],["📊","Scored"],["🔄","Unlimited"]].map(([ic,l])=>(
                <div key={l} style={{ display:"flex",alignItems:"center",gap:6,fontSize:13,color:"var(--text-secondary)" }}>
                  <span>{ic}</span>{l}
                </div>
              ))}
            </div>
            <button className="btn btn-ghost" disabled style={{ opacity:.5,cursor:"not-allowed" }}>🚧 Coming Soon</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CompaniesPage;