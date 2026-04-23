import React, { useState, useEffect, useRef, useContext } from "react";
import { Sidebar, Topbar, StatCard, DiffTag, ToastContext } from "../components/shared.jsx";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
const apiCall = async (endpoint, method = "GET", body = null, auth = false) => {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const t = localStorage.getItem("skillx_token");
    if (t) headers["Authorization"] = `Bearer ${t}`;
  }
  const res = await fetch(`${API_BASE}${endpoint}`, { method, headers, body: body ? JSON.stringify(body) : null });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error");
  return data;
};

const PROBLEMS = {
  1:  { id:1,  title:"Two Sum",                difficulty:"Easy",   diffClass:"easy",   companies:"Google · Amazon" },
  2:  { id:2,  title:"Reverse a String",        difficulty:"Easy",   diffClass:"easy",   companies:"Microsoft · Meta" },
  3:  { id:3,  title:"FizzBuzz",                difficulty:"Easy",   diffClass:"easy",   companies:"Apple · Netflix" },
  4:  { id:4,  title:"Palindrome Number",       difficulty:"Easy",   diffClass:"easy",   companies:"Amazon · Adobe" },
  5:  { id:5,  title:"Maximum Subarray",        difficulty:"Medium", diffClass:"medium", companies:"Google · Microsoft" },
  6:  { id:6,  title:"Valid Parentheses",       difficulty:"Easy",   diffClass:"easy",   companies:"Meta · Twitter" },
  7:  { id:7,  title:"Climbing Stairs",         difficulty:"Easy",   diffClass:"easy",   companies:"Amazon · Apple" },
  8:  { id:8,  title:"Best Time to Buy Stock",  difficulty:"Easy",   diffClass:"easy",   companies:"Goldman · Amazon" },
  9:  { id:9,  title:"Missing Number",          difficulty:"Easy",   diffClass:"easy",   companies:"Microsoft · LinkedIn" },
  10: { id:10, title:"Second Largest",          difficulty:"Medium", diffClass:"medium", companies:"Amazon · Zoho" },
};

/* ── DASHBOARD ── */
export function Dashboard({ onNav, username, onLogout }) {
  const [stats, setStats]   = useState(null);
  const [counts, setCounts] = useState([0, 0, 0, 0]);
  const [err, setErr]       = useState("");
  const chartRef = useRef(null);
  const level  = Number(localStorage.getItem("skillx_level")) || 1;
  const streak = Number(localStorage.getItem("skillx_streak")) || 0;

  useEffect(() => {
    apiCall("/dashboard/", "GET", null, true)
      .then((d) => {
        setStats(d);
        localStorage.setItem("skillx_level",  d.level  || 1);
        localStorage.setItem("skillx_streak", d.streak || 0);
        const targets = [d.accuracy||0, d.problems_solved||0, d.streak||0, (d.weak_topics||[]).length||0];
        targets.forEach((t, i) => {
          let c = 0;
          const iv = setInterval(() => {
            c = Math.min(c + Math.ceil((t||1)/40), t);
            setCounts((p) => { const n=[...p]; n[i]=c; return n; });
            if (c >= t) clearInterval(iv);
          }, 22);
        });
      })
      .catch((e) => setErr(e.message));
  }, []);

  useEffect(() => {
    if (!window.Chart || !chartRef.current) return;
    const ctx = chartRef.current.getContext("2d");
    const g = ctx.createLinearGradient(0,0,0,200);
    g.addColorStop(0,"rgba(34,197,94,.18)"); g.addColorStop(1,"rgba(34,197,94,.01)");
    const ch = new window.Chart(ctx, {
      type:"line",
      data:{labels:["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],datasets:[{data:[3,7,5,11,8,4,9],borderColor:"#22c55e",borderWidth:2,backgroundColor:g,pointBackgroundColor:"#22c55e",pointBorderColor:"var(--bg-base)",pointBorderWidth:2,pointRadius:4,tension:.42,fill:true}]},
      options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{backgroundColor:"var(--bg-card)",borderColor:"var(--border)",borderWidth:1,titleColor:"#22c55e",bodyColor:"var(--text-secondary)",padding:10}},scales:{x:{grid:{color:"rgba(255,255,255,.04)"},ticks:{color:"var(--text-muted)",font:{family:"DM Mono",size:10}}},y:{grid:{color:"rgba(255,255,255,.04)"},ticks:{color:"var(--text-muted)",font:{family:"DM Mono",size:10}},beginAtZero:true}}}
    });
    return () => ch.destroy();
  }, []);

  return (
    <div className="app-shell page-enter">
      <Sidebar activePage="dashboard" onNav={onNav} username={username} onLogout={onLogout} level={level} streak={streak} />
      <div className="main-content">
        <Topbar title="Dashboard" subtitle={`Good to see you, ${username || "Developer"}`} username={username}>
          <div style={{ position:"relative", cursor:"pointer", fontSize:18 }}>
            🔔
            <div style={{ position:"absolute",top:0,right:0,width:7,height:7,background:"var(--red)",borderRadius:"50%",border:"2px solid var(--bg-raised)" }} />
          </div>
        </Topbar>
        <div className="page-body">
          {err && (
            <div style={{ padding:"10px 14px",background:"#ef44440a",border:"1px solid #ef444430",borderRadius:8,color:"var(--red)",fontSize:12,marginBottom:16 }}>
              ⚠ {err} — using demo data
            </div>
          )}

          {/* Stats */}
          <div className="stats-grid">
            <StatCard icon="🎯" value={`${counts[0]}%`} label="Accuracy" trend="↑ +4% this week" trendUp accent="var(--green)" />
            <StatCard icon="✅" value={counts[1]} label="Problems Solved" trend="↑ +18 this week" trendUp />
            <StatCard icon="🔥" value={counts[2]} label="Day Streak" trend="↑ Keep it up!" trendUp accent="var(--amber)" />
            <StatCard icon="🧠" value={counts[3]} label="Weak Topics" trend={stats?.weak_topics?.join(" · ") || "DP · Graphs · Tries"} />
          </div>

          {/* Charts */}
          <div className="dash-grid">
            <div className="chart-card">
              <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16 }}>
                <div className="chart-title">Weekly Progress</div>
                <div style={{ display:"flex",gap:4 }}>
                  {["Week","Month"].map((t,i)=>(
                    <button key={t} style={{ fontSize:11,padding:"4px 10px",borderRadius:6,background:i===0?"var(--green-faint)":"transparent",border:i===0?"1px solid #22c55e22":"1px solid var(--border)",color:i===0?"var(--green)":"var(--text-muted)",cursor:"pointer" }}>{t}</button>
                  ))}
                </div>
              </div>
              <div className="chart-wrap"><canvas ref={chartRef} /></div>
            </div>

            <div className="chart-card">
              <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14 }}>
                <div className="chart-title">Recommended Problems</div>
                <span style={{ fontSize:12,color:"var(--green)",cursor:"pointer",fontWeight:500 }} onClick={() => onNav("coding")}>See all →</span>
              </div>
              <div className="problem-list">
                {Object.values(PROBLEMS).slice(0,7).map((p) => (
                  <div key={p.id} className="problem-row" onClick={() => onNav("coding")}>
                    <span className="problem-id">{p.id}.</span>
                    <span className="problem-title">{p.title}</span>
                    <span className="problem-co">{p.companies.split("·")[0].trim()}</span>
                    <DiffTag difficulty={p.difficulty} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Difficulty breakdown - LeetCode style */}
          <div className="chart-card" style={{ marginTop:16 }}>
            <div className="chart-title" style={{ marginBottom:20 }}>Difficulty Breakdown</div>
            <div style={{ display:"flex",gap:40,alignItems:"center" }}>
              {[["Easy","#22c55e",stats?.easy_solved||0,843],["Medium","#f59e0b",stats?.medium_solved||0,1764],["Hard","#ef4444",stats?.hard_solved||0,762]].map(([d,c,s,t])=>(
                <div key={d} style={{ textAlign:"center" }}>
                  <div style={{ position:"relative",width:72,height:72,margin:"0 auto 10px" }}>
                    <svg width="72" height="72" style={{ transform:"rotate(-90deg)" }}>
                      <circle cx="36" cy="36" r="30" fill="none" stroke="var(--bg-overlay)" strokeWidth="5" />
                      <circle cx="36" cy="36" r="30" fill="none" stroke={c} strokeWidth="5" strokeLinecap="round"
                        strokeDasharray={`${(s/t)*188.5} 188.5`} />
                    </svg>
                    <div style={{ position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center" }}>
                      <div style={{ fontSize:15,fontWeight:700,color:"var(--text-primary)",fontFamily:"var(--mono)",lineHeight:1 }}>{s}</div>
                      <div style={{ fontSize:9,color:"var(--text-muted)",marginTop:1 }}>/{t}</div>
                    </div>
                  </div>
                  <div style={{ fontSize:12,fontWeight:500,color:c }}>{d}</div>
                </div>
              ))}
              <div style={{ flex:1,marginLeft:20 }}>
                {[["Arrays",72],["Strings",45],["Trees",38],["DP",22],["Graphs",18]].map(([t,p])=>(
                  <div key={t} style={{ display:"flex",alignItems:"center",gap:10,marginBottom:10 }}>
                    <span style={{ fontSize:12,color:"var(--text-secondary)",width:70 }}>{t}</span>
                    <div style={{ flex:1,height:5,background:"var(--bg-overlay)",borderRadius:3,overflow:"hidden" }}>
                      <div style={{ height:"100%",width:`${p}%`,background:"var(--green)",borderRadius:3 }} />
                    </div>
                    <span style={{ fontSize:11,color:"var(--text-muted)",fontFamily:"var(--mono)",width:28,textAlign:"right" }}>{p}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── ANALYTICS ── */
export function Analytics({ onNav, username, onLogout }) {
  const lineRef = useRef(null); const barRef = useRef(null); const donutRef = useRef(null);
  const [stats, setStats] = useState(null);
  const level  = Number(localStorage.getItem("skillx_level")) || 1;
  const streak = Number(localStorage.getItem("skillx_streak")) || 0;

  useEffect(() => { apiCall("/dashboard/","GET",null,true).then(setStats).catch(()=>{}); }, []);

  useEffect(() => {
    if (!window.Chart) return;
    const charts = [];
    const opts = { responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{backgroundColor:"var(--bg-card)",borderColor:"var(--border)",borderWidth:1,titleColor:"var(--green)",bodyColor:"var(--text-secondary)",padding:10}},scales:{x:{grid:{color:"rgba(255,255,255,.03)"},ticks:{color:"var(--text-muted)",font:{family:"DM Mono",size:10}}},y:{grid:{color:"rgba(255,255,255,.03)"},ticks:{color:"var(--text-muted)",font:{family:"DM Mono",size:10}},beginAtZero:true}} };

    if (lineRef.current) {
      const g = lineRef.current.getContext("2d").createLinearGradient(0,0,0,240);
      g.addColorStop(0,"rgba(34,197,94,.2)"); g.addColorStop(1,"rgba(34,197,94,.01)");
      charts.push(new window.Chart(lineRef.current,{type:"line",data:{labels:["W1","W2","W3","W4","W5","W6","W7","W8"],datasets:[{data:[4,9,7,14,11,18,15,22],borderColor:"#22c55e",borderWidth:2.5,backgroundColor:g,pointBackgroundColor:"#22c55e",pointBorderColor:"var(--bg-base)",pointRadius:4,tension:.4,fill:true}]},options:{...opts,scales:{...opts.scales,y:{...opts.scales.y,max:30}}}}));
    }
    if (barRef.current) {
      charts.push(new window.Chart(barRef.current,{type:"bar",data:{labels:["Easy","Medium","Hard"],datasets:[{data:[stats?.accuracy||72,stats?.accuracy?Math.round(stats.accuracy*.7):50,stats?.accuracy?Math.round(stats.accuracy*.4):30],backgroundColor:["rgba(34,197,94,.4)","rgba(245,158,11,.4)","rgba(239,68,68,.4)"],borderColor:["#22c55e","#f59e0b","#ef4444"],borderWidth:1.5,borderRadius:6,borderSkipped:false}]},options:{...opts,scales:{...opts.scales,y:{...opts.scales.y,max:100}}}}));
    }
    if (donutRef.current) {
      charts.push(new window.Chart(donutRef.current,{type:"doughnut",data:{labels:["Arrays","Strings","Trees","DP","Graphs","Other"],datasets:[{data:[35,22,18,12,8,5],backgroundColor:["rgba(34,197,94,.7)","rgba(59,130,246,.7)","rgba(245,158,11,.7)","rgba(168,85,247,.7)","rgba(239,68,68,.7)","rgba(100,116,139,.5)"],borderWidth:0,hoverOffset:6,borderRadius:4}]},options:{responsive:true,maintainAspectRatio:false,cutout:"68%",plugins:{legend:{position:"right",labels:{color:"var(--text-secondary)",font:{size:11,family:"DM Mono"},boxWidth:10,padding:10}},tooltip:{backgroundColor:"var(--bg-card)",borderColor:"var(--border)",borderWidth:1,bodyColor:"var(--text-secondary)",padding:10}}}}));
    }
    return () => charts.forEach((c) => c.destroy());
  }, [stats]);

  return (
    <div className="app-shell page-enter">
      <Sidebar activePage="analytics" onNav={onNav} username={username} onLogout={onLogout} level={level} streak={streak} />
      <div className="main-content">
        <Topbar title="Analytics" subtitle="Track every bit of progress" username={username} />
        <div className="page-body">
          {stats && (
            <div className="stats-grid" style={{ marginBottom:20 }}>
              <StatCard icon="🎯" value={`${stats.accuracy}%`} label="Accuracy" accent="var(--green)" />
              <StatCard icon="✅" value={stats.problems_solved} label="Problems Solved" />
              <StatCard icon="🔥" value={stats.streak} label="Day Streak" accent="var(--amber)" />
              <StatCard icon="⭐" value={`Lv.${stats.level}`} label="Level" accent="var(--purple)" />
            </div>
          )}
          <div className="analytics-grid">
            <div className="analytics-card span2">
              <div className="chart-title" style={{ marginBottom:14 }}>Problems Over Time</div>
              <div style={{ height:220 }}><canvas ref={lineRef} /></div>
            </div>
            <div className="analytics-card">
              <div className="chart-title" style={{ marginBottom:14 }}>Accuracy by Difficulty</div>
              <div style={{ height:190 }}><canvas ref={barRef} /></div>
            </div>
            <div className="analytics-card">
              <div className="chart-title" style={{ marginBottom:14 }}>Topic Distribution</div>
              <div style={{ height:190 }}><canvas ref={donutRef} /></div>
            </div>
            <div className="analytics-card">
              <div className="chart-title" style={{ marginBottom:16 }}>Topic Mastery</div>
              {[["Arrays",72],["Strings",55],["Trees",38],["DP",22],["Graphs",18],["Tries",8]].map(([n,p])=>(
                <div key={n} className="topic-row">
                  <span className="topic-name">{n}</span>
                  <div className="topic-bar-bg"><div className="topic-bar-fill" style={{ width:`${p}%` }} /></div>
                  <span className="topic-pct">{p}%</span>
                </div>
              ))}
            </div>
            <div className="analytics-card">
              <div className="chart-title" style={{ marginBottom:16 }}>Weekly Activity</div>
              <div style={{ display:"flex",gap:6,alignItems:"flex-end",height:120 }}>
                {[["Mon",40],["Tue",65],["Wed",30],["Thu",80],["Fri",55],["Sat",20],["Sun",70]].map(([d,h])=>(
                  <div key={d} style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:6 }}>
                    <div style={{ width:"100%",height:`${h}%`,background:h>60?"var(--green)":"var(--bg-overlay)",borderRadius:"4px 4px 0 0",border:"1px solid",borderColor:h>60?"#22c55e30":"var(--border)",transition:"height .5s" }} />
                    <span style={{ fontSize:10,color:"var(--text-muted)" }}>{d}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── PROFILE ── */
export function ProfilePage({ onNav, username, onLogout }) {
  const toast = useContext(ToastContext);
  const [stats, setStats]     = useState(null);
  const [editing, setEditing] = useState(false);
  const [bio, setBio]         = useState(localStorage.getItem("skillx_bio") || "");
  const [college, setCollege] = useState(localStorage.getItem("skillx_college") || "");
  const [github, setGithub]   = useState(localStorage.getItem("skillx_github") || "");
  const level  = Number(localStorage.getItem("skillx_level")) || 1;
  const streak = Number(localStorage.getItem("skillx_streak")) || 0;
  const safeName = username || "Developer";
  const lvlLabel = level >= 30?"Master":level >= 20?"Advanced":level >= 10?"Intermediate":level >= 5?"Beginner":"Newbie";

  useEffect(() => { apiCall("/dashboard/","GET",null,true).then(setStats).catch(()=>{}); }, []);

  const save = () => {
    localStorage.setItem("skillx_bio", bio);
    localStorage.setItem("skillx_college", college);
    localStorage.setItem("skillx_github", github);
    setEditing(false);
    toast("Profile saved!", "success");
  };

  return (
    <div className="app-shell page-enter">
      <Sidebar activePage="profile" onNav={onNav} username={username} onLogout={onLogout} level={level} streak={streak} />
      <div className="main-content">
        <Topbar title="Profile" username={username} />
        <div className="page-body" style={{ maxWidth:760 }}>
          {/* Header */}
          <div className="profile-header">
            <div className="profile-avatar">{safeName.charAt(0).toUpperCase()}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:22,fontWeight:700,letterSpacing:"-.4px",marginBottom:6 }}>{safeName}</div>
              <div style={{ display:"flex",gap:8,flexWrap:"wrap",marginBottom:bio?8:0 }}>
                <span style={{ fontSize:12,padding:"3px 10px",borderRadius:99,background:"var(--green-faint)",border:"1px solid #22c55e22",color:"var(--green)",fontFamily:"var(--mono)" }}>Lv.{level} · {lvlLabel}</span>
                <span style={{ fontSize:12,padding:"3px 10px",borderRadius:99,background:"#f59e0b0a",border:"1px solid #f59e0b20",color:"var(--amber)",fontFamily:"var(--mono)" }}>🔥 {streak} day streak</span>
              </div>
              {bio && <div style={{ fontSize:13,color:"var(--text-secondary)",marginBottom:4 }}>{bio}</div>}
              {college && <div style={{ fontSize:12,color:"var(--text-muted)" }}>🎓 {college}</div>}
              {github && <div style={{ fontSize:12,color:"var(--blue)",cursor:"pointer",marginTop:4 }} onClick={() => window.open(`https://github.com/${github}`,"_blank")}>⬡ github.com/{github}</div>}
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => setEditing(!editing)}>
              {editing ? "Cancel" : "✏ Edit"}
            </button>
          </div>

          {editing && (
            <div className="card" style={{ marginBottom:16 }}>
              <div style={{ fontSize:13,fontWeight:600,marginBottom:14,color:"var(--green)" }}>Edit Profile</div>
              {[{l:"Bio",v:bio,s:setBio,p:"Tell us about yourself..."},{l:"College / Company",v:college,s:setCollege,p:"e.g. IIT Delhi, Google..."},{l:"GitHub username",v:github,s:setGithub,p:"e.g. harshita123"}].map(({l,v,s,p})=>(
                <div key={l} style={{ marginBottom:12 }}>
                  <label className="form-label">{l}</label>
                  <input value={v} onChange={(e)=>s(e.target.value)} placeholder={p} className="input" />
                </div>
              ))}
              <button className="btn btn-primary btn-sm" onClick={save}>Save Profile</button>
            </div>
          )}

          {/* Stats */}
          <div className="profile-stats">
            {[["✅",stats?.problems_solved||0,"Solved"],["🎯",`${stats?.accuracy||0}%`,"Accuracy"],["📤",stats?.submissions||0,"Submissions"],["⭐",`Lv.${level}`,"Level"]].map(([ic,v,l])=>(
              <div key={l} className="profile-stat">
                <div style={{ fontSize:22,marginBottom:8 }}>{ic}</div>
                <div className="profile-stat-val" style={{ color:l==="Solved"?"var(--green)":l==="Level"?"var(--purple)":"var(--text-primary)" }}>{v}</div>
                <div className="profile-stat-lbl">{l}</div>
              </div>
            ))}
          </div>

          {/* Level Progress */}
          <div className="card" style={{ marginBottom:16 }}>
            <div style={{ display:"flex",justifyContent:"space-between",marginBottom:8 }}>
              <span style={{ fontSize:13,fontWeight:500 }}>Progress to Level {level+1}</span>
              <span style={{ fontSize:12,color:"var(--text-muted)",fontFamily:"var(--mono)" }}>{stats?.problems_solved||0} / {level*2+2} problems</span>
            </div>
            <div style={{ height:6,background:"var(--bg-overlay)",borderRadius:3,overflow:"hidden",marginBottom:8 }}>
              <div style={{ height:"100%",width:`${Math.min(100,((stats?.problems_solved||0)/(level*2+2))*100)}%`,background:"var(--green)",borderRadius:3,transition:"width .6s" }} />
            </div>
            <div style={{ fontSize:12,color:"var(--text-muted)" }}>
              Solve {Math.max(0,(level*2+2)-(stats?.problems_solved||0))} more problems to reach Level {level+1}
            </div>
          </div>

          {/* Solved problems */}
          <div className="card">
            <div style={{ fontSize:14,fontWeight:600,marginBottom:14 }}>Solved Problems ({stats?.problems_solved||0})</div>
            {(stats?.problems_solved||0) > 0 ? (
              <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
                {Object.values(PROBLEMS).slice(0,stats?.problems_solved||0).map((p)=>(
                  <div key={p.id} style={{ display:"flex",alignItems:"center",gap:12,padding:"9px 12px",background:"var(--bg-overlay)",borderRadius:8,border:"1px solid var(--border)" }}>
                    <span style={{ fontSize:11,color:"var(--text-muted)",fontFamily:"var(--mono)",width:20 }}>{p.id}.</span>
                    <span style={{ fontSize:13,flex:1 }}>{p.title}</span>
                    <span style={{ fontSize:11,color:"var(--text-muted)" }}>{p.companies}</span>
                    <DiffTag difficulty={p.difficulty} />
                    <span style={{ color:"var(--green)" }}>✓</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign:"center",padding:"28px 0",color:"var(--text-muted)" }}>
                <div style={{ fontSize:36,marginBottom:10 }}>💻</div>
                <div style={{ fontSize:13,marginBottom:14 }}>No problems solved yet</div>
                <button className="btn btn-primary btn-sm" onClick={() => onNav("coding")}>Start practicing →</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export { PROBLEMS, apiCall };