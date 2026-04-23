import React, { useState, useRef, useEffect, useContext } from "react";
import { Sidebar, Topbar, DiffTag, ToastContext } from "../components/shared.jsx";
import { PROBLEMS, apiCall } from "./DashboardPages.jsx";

const CodingPage = ({ onNav, username, onLogout, userLevel = 1, userStreak = 0 }) => {
  const toast      = useContext(ToastContext);
  const [pid, setPid]           = useState(1);
  const [code, setCode]         = useState(PROBLEMS[1].starter?.python || "");
  const [lang, setLang]         = useState("python");
  const [activeTab, setActiveTab] = useState("problem");
  const [result, setResult]     = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [hint, setHint]         = useState(null);
  const [hintLevel, setHintLevel] = useState(0);
  const [running, setRunning]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hintLoading, setHintLoading] = useState(false);
  const [timer, setTimer]       = useState(0);
  const [timerOn, setTimerOn]   = useState(false);
  const ivRef = useRef(null);

  // Populate starter code
  useEffect(() => {
    const p = PROBLEMS[pid];
    if (p?.starter) setCode(p.starter[lang] || p.starter.python || "");
  }, [pid, lang]);

  const toggleTimer = () => {
    if (!timerOn) {
      setTimerOn(true);
      ivRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
    } else {
      setTimerOn(false);
      clearInterval(ivRef.current);
    }
  };
  useEffect(() => () => clearInterval(ivRef.current), []);
  const fmt = (s) => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

  const runCode = async () => {
    if (!code.trim()) { toast("Write some code first", "warn"); return; }
    setRunning(true); setResult(null);
    try {
      const d = await apiCall("/code/run/", "POST", { code, language: lang, problem_id: pid }, true);
      setResult(d);
      const allPass = d.results?.every((r) => r.passed);
      toast(allPass ? "All test cases passed!" : `${d.results?.filter((r)=>!r.passed).length} failed`, allPass ? "success" : "error");
    } catch (err) {
      setResult({ error: err.message });
      toast(err.message, "error");
    } finally { setRunning(false); }
  };

  const submitCode = async () => {
    if (!code.trim()) { toast("Write some code first", "warn"); return; }
    setSubmitting(true); setAiResult(null);
    try {
      const d = await apiCall("/code/submit/", "POST", { code, language: lang, problem_id: pid }, true);
      setAiResult(d);
      toast(d.status === "Accepted" ? `Accepted! Score: ${d.score}/100` : d.status || "Wrong Answer", d.status === "Accepted" ? "success" : "error");
    } catch (err) {
      setAiResult({ error: err.message });
    } finally { setSubmitting(false); }
  };

  const getHint = async () => {
    if (!code.trim()) { toast("Write some code first", "warn"); return; }
    setHintLoading(true); setActiveTab("hints");
    const p = PROBLEMS[pid];
    try {
      const t = localStorage.getItem("skillx_token");
      const res = await fetch(`${import.meta.env.VITE_API_URL||"http://localhost:8000/api"}/code/hint/`, {
        method:"POST", headers:{"Content-Type":"application/json","Authorization":`Bearer ${t}`},
        body: JSON.stringify({ problem_title:p.title, problem_description:p.description, user_code:code, hint_level:hintLevel, language:lang })
      });
      const d = await res.json();
      setHint(d.hint || "Could not generate hint.");
      setHintLevel((h) => Math.min(h+1,2));
      toast("Hint ready!", "success");
    } catch { setHint("Backend not connected."); }
    finally { setHintLoading(false); }
  };

  const p = PROBLEMS[pid];

  return (
    <div className="app-shell page-enter">
      <Sidebar activePage="coding" onNav={onNav} username={username} onLogout={onLogout} level={userLevel} streak={userStreak} />
      <div className="main-content">
        {/* Coding bar */}
        <div className="coding-bar">
          <button className="btn btn-ghost btn-sm" onClick={() => onNav("dashboard")}>← Back</button>
          <div style={{ width:1,height:20,background:"var(--border)" }} />
          <select
            className="select-styled"
            value={pid}
            onChange={(e) => { const id=Number(e.target.value); setPid(id); setResult(null); setAiResult(null); setActiveTab("problem"); setHint(null); setHintLevel(0); }}
          >
            {Object.values(PROBLEMS).map((pr) => (
              <option key={pr.id} value={pr.id}>{pr.id}. {pr.title} · {pr.difficulty}</option>
            ))}
          </select>
          <DiffTag difficulty={p.difficulty} />
          <span style={{ fontSize:11,color:"var(--text-muted)",fontFamily:"var(--mono)" }}>{p.companies}</span>
          <div style={{ marginLeft:"auto",display:"flex",alignItems:"center",gap:8 }}>
            <span style={{ fontSize:12,fontFamily:"var(--mono)",color:"var(--text-muted)",minWidth:44 }}>⏱ {fmt(timer)}</span>
            <button className="btn btn-ghost btn-sm" onClick={toggleTimer}>{timerOn?"⏸ Pause":"▶ Start"}</button>
          </div>
        </div>

        {/* Split */}
        <div className="editor-split" style={{ height:"calc(100vh - 104px)" }}>
          {/* Problem pane */}
          <div className="problem-pane">
            <div className="pane-tabs">
              {["problem","hints","solutions"].map((t) => (
                <button key={t} className={`pane-tab${activeTab===t?" active":""}`} onClick={() => setActiveTab(t)}>
                  {t === "problem" ? "Problem" : t === "hints" ? "💡 Hints" : "📚 Solutions"}
                </button>
              ))}
            </div>
            <div className="problem-body">
              {activeTab === "problem" && (
                <>
                  <div className="problem-title-text">{p.id}. {p.title}</div>
                  <div style={{ display:"flex",gap:8,marginBottom:16 }}>
                    <DiffTag difficulty={p.difficulty} />
                    <span style={{ fontSize:11,padding:"2px 8px",borderRadius:99,background:"var(--bg-overlay)",color:"var(--text-muted)",border:"1px solid var(--border)" }}>{p.companies}</span>
                  </div>
                  <p style={{ fontSize:13.5,color:"var(--text-secondary)",lineHeight:1.8,marginBottom:14 }}>{p.description || "Problem description..."}</p>
                  {(p.examples||[]).map((ex,i) => (
                    <div key={i} className="example-block" style={{ marginBottom:10 }}>
                      <div className="example-label">Example {i+1}</div>
                      <pre style={{ fontFamily:"var(--mono)",fontSize:12,lineHeight:1.8,color:"var(--text-secondary)" }}>
{`Input:  ${ex.input}\nOutput: ${ex.output}${ex.explain?`\n// ${ex.explain}`:""}`}
                      </pre>
                    </div>
                  ))}
                </>
              )}
              {activeTab === "hints" && (
                <div>
                  <div style={{ fontSize:14,fontWeight:600,marginBottom:6,color:"var(--text-primary)" }}>AI Hint Generator</div>
                  <p style={{ fontSize:12,color:"var(--text-muted)",marginBottom:16 }}>Get nudges without spoilers — based on your code.</p>
                  <button className="btn btn-primary" style={{ width:"100%",justifyContent:"center",marginBottom:20 }} onClick={getHint} disabled={hintLoading||hintLevel>=3}>
                    {hintLoading ? <><div className="spinner"/>Thinking…</> : hintLevel===0?"Get First Hint":hintLevel===1?"Get Another Hint":"Get Final Hint"}
                  </button>
                  {hint && !hintLoading && (
                    <div style={{ background:"var(--bg-overlay)",border:"1px solid var(--border)",borderLeft:"3px solid var(--green)",borderRadius:8,padding:"12px 14px" }}>
                      <div style={{ fontSize:10,fontWeight:600,color:"var(--green)",fontFamily:"var(--mono)",marginBottom:6 }}>HINT {hintLevel}</div>
                      <p style={{ fontSize:13,color:"var(--text-secondary)",lineHeight:1.75 }}>{hint}</p>
                    </div>
                  )}
                  {hintLevel >= 3 && (
                    <p style={{ fontSize:12,color:"var(--text-muted)",textAlign:"center",marginTop:12 }}>Max hints reached! You got this 💪</p>
                  )}
                </div>
              )}
              {activeTab === "solutions" && (
                <div style={{ textAlign:"center",padding:"36px 20px",color:"var(--text-muted)" }}>
                  <div style={{ fontSize:32,marginBottom:10 }}>🔒</div>
                  <div style={{ fontSize:13,marginBottom:8 }}>Solutions unlock after submitting</div>
                  <div style={{ fontSize:12 }}>Try solving it first!</div>
                </div>
              )}
            </div>
          </div>

          {/* Editor pane */}
          <div className="editor-pane">
            <div className="editor-header">
              <div style={{ display:"flex",gap:5,alignItems:"center" }}>
                <div className="dot dot-r"/><div className="dot dot-y"/><div className="dot dot-g"/>
              </div>
              <span style={{ fontSize:11,color:"var(--text-muted)",fontFamily:"var(--mono)",marginLeft:6 }}>
                solution.{lang==="python"?"py":lang==="java"?"java":lang==="cpp"?"cpp":"js"}
              </span>
              <select className="select-styled" value={lang} onChange={(e)=>setLang(e.target.value)} style={{ marginLeft:"auto",fontSize:12,padding:"4px 10px" }}>
                <option value="python">🐍 Python 3</option>
                <option value="java">☕ Java</option>
                <option value="cpp">⚡ C++</option>
                <option value="c">🔵 C</option>
              </select>
            </div>

            <div className="editor-area" style={{ flex:1 }}>
              <textarea
                className="editor-textarea"
                style={{ height:"100%" }}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                spellCheck={false}
                onKeyDown={(e) => {
                  if (e.key === "Tab") {
                    e.preventDefault();
                    const s = e.target.selectionStart, end = e.target.selectionEnd;
                    setCode(code.substring(0,s)+"    "+code.substring(end));
                    setTimeout(() => e.target.setSelectionRange(s+4,s+4), 0);
                  }
                }}
                placeholder="Write your solution here…"
              />
            </div>

            <div className="editor-footer">
              <span style={{ fontFamily:"var(--mono)",fontSize:11,color:"var(--text-muted)" }}>
                {lang==="python"?"Python 3":lang} · {code.split("\n").length} lines
              </span>
              <div style={{ display:"flex",gap:8 }}>
                <button className="btn btn-ghost btn-sm" onClick={getHint}>💡 Hint</button>
                <button className="btn btn-ghost btn-sm" onClick={runCode} disabled={running}>
                  {running ? <><div className="spinner"/></> : "▶ Run"}
                </button>
                <button className="btn btn-primary btn-sm" onClick={submitCode} disabled={submitting}>
                  {submitting ? <><div className="spinner"/></> : "⚡ Submit"}
                </button>
              </div>
            </div>

            {/* Test panel */}
            <div className="test-panel">
              <div className="test-tabs">
                {["Case 1","Case 2"].map((c,i)=>(
                  <button key={c} className={`test-tab${i===0?" active":""}`}>{c}</button>
                ))}
                <button className="test-tab" style={{ borderStyle:"dashed" }}>+ Add</button>
              </div>
              <div style={{ padding:"10px 14px" }}>
                {result?.error && (
                  <div style={{ padding:"8px 12px",background:"#ef44440a",border:"1px solid #ef444430",borderRadius:6,color:"var(--red)",fontSize:12,marginBottom:8 }}>
                    ⚠ {result.error}
                  </div>
                )}
                {result?.results?.map((r,i) => (
                  <div key={i} style={{ display:"flex",alignItems:"center",gap:8,padding:"6px 10px",background:r.passed?"#22c55e08":"#ef44440a",borderRadius:6,border:`1px solid ${r.passed?"#22c55e20":"#ef444420"}`,marginBottom:5,fontSize:12 }}>
                    <span style={{ color:r.passed?"var(--green)":"var(--red)",fontWeight:700 }}>{r.passed?"✓":"✕"}</span>
                    <span style={{ fontFamily:"var(--mono)",color:r.passed?"var(--green)":"var(--red)" }}>
                      Case {i+1}: {r.passed?"Passed":"Failed"}{r.output?` → ${r.output}`:""}
                    </span>
                  </div>
                ))}
                {!result && (
                  <div style={{ fontSize:12,color:"var(--text-muted)",fontFamily:"var(--mono)" }}>
                    <div>nums = [2, 7, 11, 15]</div>
                    <div>target = 9</div>
                  </div>
                )}
              </div>
            </div>

            {/* AI Result */}
            {aiResult && (
              <div className="ai-result-panel">
                <div className="ai-result-head">
                  <span>🤖 Submission Result</span>
                  {aiResult.score !== undefined && (
                    <span style={{ marginLeft:6,background:"var(--green)",color:"#000",fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:99,fontFamily:"var(--mono)" }}>
                      {aiResult.score}/100
                    </span>
                  )}
                  <button style={{ marginLeft:"auto",background:"none",border:"none",color:"var(--text-muted)",fontSize:18,cursor:"pointer" }} onClick={() => setAiResult(null)}>×</button>
                </div>
                {aiResult.error ? (
                  <div style={{ padding:"10px 14px",color:"var(--red)",fontSize:12 }}>⚠ {aiResult.error}</div>
                ) : (
                  <div className="ai-grid">
                    {[["Status",aiResult.status||"N/A",aiResult.status==="Accepted"?"var(--green)":"var(--red)"],["Runtime",aiResult.runtime||"N/A","var(--green)"],["Memory",aiResult.memory||"N/A","var(--green)"],["Tests",aiResult.passed!=null?`${aiResult.passed}/${aiResult.total}`:"N/A","var(--text-primary)"],["Feedback",aiResult.feedback||"Keep going!","var(--text-secondary)"],["Score",aiResult.score!=null?`${aiResult.score}/100`:"N/A","var(--purple)"]].map(([l,v,c])=>(
                      <div key={l} className="ai-cell">
                        <div className="ai-cell-label">{l}</div>
                        <div className="ai-cell-val" style={{ color:c }}>{v}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Starter code for each problem
Object.assign(PROBLEMS[1], {
  description: "Given an array of integers nums and integer target, return indices of the two numbers that add up to target.",
  examples: [{ input:"nums=[2,7,11,15], target=9", output:"[0,1]", explain:"nums[0]+nums[1]=9" }],
  starter: { python:`def twoSum(nums, target):\n    seen = {}\n    for i, n in enumerate(nums):\n        if target - n in seen:\n            return [seen[target-n], i]\n        seen[n] = i`, java:`public int[] twoSum(int[] nums, int target) {\n    // write your solution\n    return new int[]{};\n}`, cpp:`vector<int> twoSum(vector<int>& nums, int target) {\n    // write your solution\n    return {};\n}`, c:`int* twoSum(int* nums, int n, int target) {\n    // write your solution\n    return NULL;\n}` }
});
[2,3,4,5,6,7,8,9,10].forEach((id) => {
  if (PROBLEMS[id]) PROBLEMS[id].starter = { python: `def solution():\n    # Write your solution here\n    pass` };
});

export default CodingPage;