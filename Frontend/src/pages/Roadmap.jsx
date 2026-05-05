import React, { useState, useEffect } from "react";
import { Sidebar, Topbar, ToastContext } from "../components/shared.jsx";
import { useContext } from "react";

const ROADMAP_DATA = {
  Arrays: {
    color:"#3b82f6", light:"#1e3a5f", desc:"Foundation of everything. Master these patterns first.",
    prereqs:[], time:"2–3 weeks",
    easy:[
      {id:1,   name:"Two Sum",                     url:"https://leetcode.com/problems/two-sum/",                              plat:"lc"},
      {id:121, name:"Best Time to Buy/Sell Stock",  url:"https://leetcode.com/problems/best-time-to-buy-and-sell-stock/",     plat:"lc"},
      {id:217, name:"Contains Duplicate",           url:"https://leetcode.com/problems/contains-duplicate/",                  plat:"lc"},
      {id:283, name:"Move Zeroes",                  url:"https://leetcode.com/problems/move-zeroes/",                         plat:"lc"},
    ],
    medium:[
      {id:15,  name:"3Sum",                         url:"https://leetcode.com/problems/3sum/",                                plat:"lc"},
      {id:238, name:"Product of Array Except Self", url:"https://leetcode.com/problems/product-of-array-except-self/",        plat:"lc"},
      {id:53,  name:"Maximum Subarray (Kadane)",    url:"https://leetcode.com/problems/maximum-subarray/",                    plat:"lc"},
      {id:"cf1",name:"Turbo Sort (CF)",             url:"https://codeforces.com/contest/4/problem/C",                         plat:"cf"},
    ],
    hard:[
      {id:42,  name:"Trapping Rain Water",          url:"https://leetcode.com/problems/trapping-rain-water/",                 plat:"lc"},
      {id:84,  name:"Largest Rect in Histogram",    url:"https://leetcode.com/problems/largest-rectangle-in-histogram/",      plat:"lc"},
      {id:41,  name:"First Missing Positive",       url:"https://leetcode.com/problems/first-missing-positive/",              plat:"lc"},
    ]
  },
  Strings: {
    color:"#3b82f6", light:"#1e3a5f", desc:"Sliding window, two pointers, and hashing are the core patterns.",
    prereqs:["Arrays"], time:"1–2 weeks",
    easy:[
      {id:344, name:"Reverse String",               url:"https://leetcode.com/problems/reverse-string/",                      plat:"lc"},
      {id:125, name:"Valid Palindrome",             url:"https://leetcode.com/problems/valid-palindrome/",                    plat:"lc"},
      {id:"hr1",name:"Anagram Check (HR)",          url:"https://www.hackerrank.com/challenges/anagram/problem",              plat:"hr"},
    ],
    medium:[
      {id:3,   name:"Longest Substring No Repeat",  url:"https://leetcode.com/problems/longest-substring-without-repeating-characters/", plat:"lc"},
      {id:49,  name:"Group Anagrams",               url:"https://leetcode.com/problems/group-anagrams/",                     plat:"lc"},
      {id:"gfg1",name:"Count Distinct Substrings",  url:"https://www.geeksforgeeks.org/count-distinct-substrings-of-a-string-using-suffix-trie/", plat:"gfg"},
    ],
    hard:[
      {id:76,  name:"Minimum Window Substring",     url:"https://leetcode.com/problems/minimum-window-substring/",            plat:"lc"},
      {id:32,  name:"Longest Valid Parentheses",    url:"https://leetcode.com/problems/longest-valid-parentheses/",           plat:"lc"},
    ]
  },
  "Linked List": {
    color:"#22c55e", light:"#14532d", desc:"Pointer manipulation — fast/slow pointers and reversals.",
    prereqs:["Arrays"], time:"1 week",
    easy:[
      {id:206, name:"Reverse Linked List",          url:"https://leetcode.com/problems/reverse-linked-list/",                 plat:"lc"},
      {id:21,  name:"Merge Two Sorted Lists",       url:"https://leetcode.com/problems/merge-two-sorted-lists/",              plat:"lc"},
      {id:141, name:"Linked List Cycle",            url:"https://leetcode.com/problems/linked-list-cycle/",                   plat:"lc"},
    ],
    medium:[
      {id:2,   name:"Add Two Numbers",              url:"https://leetcode.com/problems/add-two-numbers/",                     plat:"lc"},
      {id:19,  name:"Remove Nth Node From End",     url:"https://leetcode.com/problems/remove-nth-node-from-end-of-list/",    plat:"lc"},
      {id:"gfg2",name:"Detect & Remove Loop",       url:"https://www.geeksforgeeks.org/detect-and-remove-loop-in-a-linked-list/", plat:"gfg"},
    ],
    hard:[
      {id:25,  name:"Reverse Nodes in k-Group",     url:"https://leetcode.com/problems/reverse-nodes-in-k-group/",            plat:"lc"},
      {id:23,  name:"Merge k Sorted Lists",         url:"https://leetcode.com/problems/merge-k-sorted-lists/",                plat:"lc"},
    ]
  },
  "Stack/Queue": {
    color:"#22c55e", light:"#14532d", desc:"LIFO/FIFO patterns and monotonic stacks.",
    prereqs:["Arrays"], time:"1 week",
    easy:[
      {id:20,  name:"Valid Parentheses",            url:"https://leetcode.com/problems/valid-parentheses/",                   plat:"lc"},
      {id:232, name:"Implement Queue via Stacks",   url:"https://leetcode.com/problems/implement-queue-using-stacks/",        plat:"lc"},
    ],
    medium:[
      {id:155, name:"Min Stack",                    url:"https://leetcode.com/problems/min-stack/",                           plat:"lc"},
      {id:739, name:"Daily Temperatures",           url:"https://leetcode.com/problems/daily-temperatures/",                  plat:"lc"},
    ],
    hard:[
      {id:239, name:"Sliding Window Maximum",       url:"https://leetcode.com/problems/sliding-window-maximum/",              plat:"lc"},
    ]
  },
  "Binary Search": {
    color:"#f59e0b", light:"#451a03", desc:"O(log n) — search on answers, not just sorted arrays.",
    prereqs:["Arrays"], time:"1 week",
    easy:[
      {id:704, name:"Binary Search",                url:"https://leetcode.com/problems/binary-search/",                       plat:"lc"},
      {id:278, name:"First Bad Version",            url:"https://leetcode.com/problems/first-bad-version/",                   plat:"lc"},
    ],
    medium:[
      {id:33,  name:"Search Rotated Sorted Array",  url:"https://leetcode.com/problems/search-in-rotated-sorted-array/",      plat:"lc"},
      {id:153, name:"Find Min in Rotated Array",    url:"https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/",plat:"lc"},
      {id:"cf2",name:"Aggressive Cows (Binary Ans)",url:"https://codeforces.com/problemset/problem/1208/E",                   plat:"cf"},
    ],
    hard:[
      {id:4,   name:"Median of Two Sorted Arrays",  url:"https://leetcode.com/problems/median-of-two-sorted-arrays/",         plat:"lc"},
      {id:410, name:"Split Array Largest Sum",      url:"https://leetcode.com/problems/split-array-largest-sum/",             plat:"lc"},
    ]
  },
  Trees: {
    color:"#f97316", light:"#431407", desc:"BFS, DFS, BST operations — the gateway to Graphs.",
    prereqs:["Linked List","Binary Search"], time:"2 weeks",
    easy:[
      {id:104, name:"Max Depth of Binary Tree",     url:"https://leetcode.com/problems/maximum-depth-of-binary-tree/",        plat:"lc"},
      {id:226, name:"Invert Binary Tree",           url:"https://leetcode.com/problems/invert-binary-tree/",                  plat:"lc"},
      {id:100, name:"Same Tree",                    url:"https://leetcode.com/problems/same-tree/",                           plat:"lc"},
    ],
    medium:[
      {id:102, name:"Level Order Traversal",        url:"https://leetcode.com/problems/binary-tree-level-order-traversal/",   plat:"lc"},
      {id:235, name:"LCA of BST",                   url:"https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/", plat:"lc"},
      {id:98,  name:"Validate BST",                 url:"https://leetcode.com/problems/validate-binary-search-tree/",         plat:"lc"},
      {id:199, name:"Right Side View",              url:"https://leetcode.com/problems/binary-tree-right-side-view/",         plat:"lc"},
    ],
    hard:[
      {id:124, name:"Binary Tree Max Path Sum",     url:"https://leetcode.com/problems/binary-tree-maximum-path-sum/",        plat:"lc"},
      {id:297, name:"Serialize/Deserialize BT",     url:"https://leetcode.com/problems/serialize-and-deserialize-binary-tree/",plat:"lc"},
    ]
  },
  Graphs: {
    color:"#a855f7", light:"#3b0764", desc:"BFS, DFS, Dijkstra, Union-Find. Heavy in FAANG.",
    prereqs:["Trees","Stack/Queue"], time:"2–3 weeks",
    easy:[
      {id:733, name:"Flood Fill",                   url:"https://leetcode.com/problems/flood-fill/",                          plat:"lc"},
      {id:997, name:"Find the Town Judge",          url:"https://leetcode.com/problems/find-the-town-judge/",                 plat:"lc"},
    ],
    medium:[
      {id:200, name:"Number of Islands",            url:"https://leetcode.com/problems/number-of-islands/",                   plat:"lc"},
      {id:207, name:"Course Schedule (Topo Sort)",  url:"https://leetcode.com/problems/course-schedule/",                     plat:"lc"},
      {id:"cf3",name:"Dijkstra Shortest Path (CF)", url:"https://codeforces.com/contest/20/problem/C",                        plat:"cf"},
    ],
    hard:[
      {id:269, name:"Alien Dictionary",             url:"https://leetcode.com/problems/alien-dictionary/",                    plat:"lc"},
      {id:332, name:"Reconstruct Itinerary",        url:"https://leetcode.com/problems/reconstruct-itinerary/",               plat:"lc"},
      {id:"cf4",name:"ICPC Graph Problem (CF 543D)",url:"https://codeforces.com/contest/543/problem/D",                       plat:"cf"},
    ]
  },
  "Dynamic Programming": {
    color:"#a855f7", light:"#3b0764", desc:"The hardest pattern. Start with 1D, then 2D, then intervals.",
    prereqs:["Trees","Binary Search"], time:"3–4 weeks",
    easy:[
      {id:70,  name:"Climbing Stairs",              url:"https://leetcode.com/problems/climbing-stairs/",                     plat:"lc"},
      {id:746, name:"Min Cost Climbing Stairs",     url:"https://leetcode.com/problems/min-cost-climbing-stairs/",            plat:"lc"},
    ],
    medium:[
      {id:322, name:"Coin Change",                  url:"https://leetcode.com/problems/coin-change/",                         plat:"lc"},
      {id:1143,name:"Longest Common Subsequence",   url:"https://leetcode.com/problems/longest-common-subsequence/",          plat:"lc"},
      {id:300, name:"Longest Increasing Subsequence",url:"https://leetcode.com/problems/longest-increasing-subsequence/",     plat:"lc"},
      {id:"gfg3",name:"0/1 Knapsack (GFG)",         url:"https://www.geeksforgeeks.org/0-1-knapsack-problem-dp-10/",          plat:"gfg"},
    ],
    hard:[
      {id:72,  name:"Edit Distance",               url:"https://leetcode.com/problems/edit-distance/",                        plat:"lc"},
      {id:312, name:"Burst Balloons",               url:"https://leetcode.com/problems/burst-balloons/",                      plat:"lc"},
      {id:"cf5",name:"CF DP Div2 D (472D)",         url:"https://codeforces.com/contest/472/problem/D",                       plat:"cf"},
    ]
  }
};

const PLAT_COLORS = { lc:["#FEF3C7","#92400E"], cf:["#EDE9FE","#5B21B6"], gfg:["#D1FAE5","#065F46"], hr:["#FEE2E2","#991B1B"] };
const PLAT_NAMES  = { lc:"LeetCode", cf:"Codeforces", gfg:"GFG", hr:"HackerRank" };

const NODES = [
  { id:"Arrays",              x:300, y:30,  w:140, h:46, group:"blue" },
  { id:"Strings",             x:150, y:140, w:130, h:46, group:"blue" },
  { id:"Linked List",         x:30,  y:140, w:120, h:46, group:"green" },
  { id:"Stack/Queue",         x:580, y:140, w:120, h:46, group:"green" },
  { id:"Binary Search",       x:430, y:140, w:135, h:46, group:"amber" },
  { id:"Trees",               x:255, y:270, w:130, h:46, group:"orange" },
  { id:"Graphs",              x:150, y:400, w:120, h:46, group:"purple" },
  { id:"Dynamic Programming", x:350, y:400, w:185, h:46, group:"purple" },
];
const EDGES = [
  ["Arrays","Strings","solid"],["Arrays","Linked List","solid"],["Arrays","Binary Search","solid"],
  ["Arrays","Stack/Queue","dashed"],["Strings","Trees","solid"],["Linked List","Trees","solid"],
  ["Binary Search","Trees","solid"],["Stack/Queue","Graphs","dashed"],
  ["Trees","Graphs","solid"],["Trees","Dynamic Programming","solid"],
  ["Binary Search","Dynamic Programming","dashed"],
];
const GROUP_COLORS = {
  blue:"#3b82f6", green:"#22c55e", amber:"#f59e0b", orange:"#f97316", purple:"#a855f7"
};

export default function RoadmapPage({ onNav, username, onLogout, userLevel=1, userStreak=0 }) {
  const toast = useContext(ToastContext);
  const [active, setActive] = useState(null);
  const [tab, setTab]       = useState("easy");
  const [solved, setSolved] = useState(() => {
    try { return JSON.parse(localStorage.getItem("skillx_roadmap_solved")||"{}"); } catch { return {}; }
  });

  const saveSolved = (s) => {
    setSolved(s);
    try { localStorage.setItem("skillx_roadmap_solved", JSON.stringify(s)); } catch {}
  };

  const toggleSolved = (e, qid) => {
    e.stopPropagation();
    const s = { ...solved };
    s[qid] = !s[qid];
    if (!s[qid]) delete s[qid];
    saveSolved(s);
  };

  const totalSolved = (topicId) => {
    const d = ROADMAP_DATA[topicId];
    return [...d.easy, ...d.medium, ...d.hard].filter((q) => solved[q.id]).length;
  };

  const totalQ = (topicId) => {
    const d = ROADMAP_DATA[topicId];
    return d.easy.length + d.medium.length + d.hard.length;
  };

  const openData = active ? ROADMAP_DATA[active] : null;
  const panelOpen = !!active;

  return (
    <div className="app-shell page-enter">
      <Sidebar activePage="roadmap" onNav={onNav} username={username} onLogout={onLogout} level={userLevel} streak={userStreak} />
      <div className="main-content">
        <Topbar title="DSA Roadmap" subtitle="Interactive learning path · Click any node to explore" username={username} />
        <div className="roadmap-layout">
          {/* SVG Map */}
          <div className="roadmap-map-area">
            <svg width="760" height="500" viewBox="0 0 760 500" style={{ minWidth:760, display:"block", padding:20 }}>
              <defs>
                <marker id="arr-s" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M1 1.5L8.5 5L1 8.5" fill="none" stroke="context-stroke" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </marker>
                <marker id="arr-d" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M1 1.5L8.5 5L1 8.5" fill="none" stroke="context-stroke" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </marker>
              </defs>

              {/* Edges */}
              {EDGES.map(([from, to, type], i) => {
                const a = NODES.find((n)=>n.id===from);
                const b = NODES.find((n)=>n.id===to);
                if (!a||!b) return null;
                const x1 = a.x + a.w/2, y1 = a.y + a.h;
                const x2 = b.x + b.w/2, y2 = b.y;
                const mx = (x1+x2)/2;
                const path = `M${x1} ${y1} C${x1} ${y1+40} ${x2} ${y2-40} ${x2} ${y2}`;
                return (
                  <path key={i} d={path} fill="none"
                    stroke={type==="solid"?"#334155":"#1e293b"}
                    strokeWidth={type==="solid"?1.5:1.2}
                    strokeDasharray={type==="dashed"?"6 4":undefined}
                    markerEnd={`url(#arr-${type==="solid"?"s":"d"})`}
                  />
                );
              })}

              {/* Nodes */}
              {NODES.map((n) => {
                const d = ROADMAP_DATA[n.id];
                const ts = totalSolved(n.id);
                const total = totalQ(n.id);
                const pct = total ? ts/total : 0;
                const color = GROUP_COLORS[n.group];
                const isActive = active === n.id;
                return (
                  <g key={n.id} style={{ cursor:"pointer" }} onClick={() => setActive(active===n.id?null:n.id)}>
                    <rect x={n.x} y={n.y} width={n.w} height={n.h} rx="10"
                      fill={isActive?`${color}22`:`${color}12`}
                      stroke={color}
                      strokeWidth={isActive?2:1.5}
                      opacity={isActive?1:0.9}
                    />
                    {/* Progress fill */}
                    {pct > 0 && (
                      <rect x={n.x+3} y={n.y+n.h-5} width={Math.round((n.w-6)*pct)} height={3} rx={1.5} fill={color} opacity={0.7} />
                    )}
                    <text x={n.x+n.w/2} y={n.y+n.h/2-(pct>0?4:0)} textAnchor="middle" dominantBaseline="central"
                      fontSize={13} fontWeight={600} fill={color} fontFamily="DM Sans, sans-serif">
                      {n.id}
                    </text>
                    {pct > 0 && (
                      <text x={n.x+n.w/2} y={n.y+n.h/2+12} textAnchor="middle" dominantBaseline="central"
                        fontSize={9} fill={color} opacity={0.7} fontFamily="DM Mono, monospace">
                        {ts}/{total}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Legend */}
              <g>
                <rect x={20} y={440} width={340} height={44} rx={8} fill="#111118" stroke="#1e2030" strokeWidth={0.5} />
                <line x1={36} y1={457} x2={60} y2={457} stroke="#334155" strokeWidth={1.5} markerEnd="url(#arr-s)" />
                <text x={66} y={461} fontSize={10} fill="#64748b" fontFamily="DM Sans" dominantBaseline="central">Prerequisite</text>
                <line x1={36} y1={474} x2={60} y2={474} stroke="#1e293b" strokeWidth={1.2} strokeDasharray="5 3" markerEnd="url(#arr-d)" />
                <text x={66} y={478} fontSize={10} fill="#64748b" fontFamily="DM Sans" dominantBaseline="central">Helpful (optional order)</text>
              </g>
            </svg>
          </div>

          {/* Side panel */}
          <div className={`roadmap-panel${panelOpen?" open":""}`}>
            {active && openData && (
              <>
                <div style={{ padding:"14px 16px 12px", borderBottom:"1px solid var(--border)", flexShrink:0 }}>
                  <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:8 }}>
                    <div>
                      <div style={{ fontSize:16,fontWeight:600,color:"var(--text-primary)",marginBottom:3 }}>{active}</div>
                      <div style={{ fontSize:12,color:"var(--text-secondary)" }}>{openData.desc}</div>
                    </div>
                    <button onClick={() => setActive(null)} style={{ background:"none",border:"none",color:"var(--text-muted)",fontSize:18,cursor:"pointer",flexShrink:0 }}>×</button>
                  </div>
                  <div style={{ display:"flex",gap:8,marginTop:10,flexWrap:"wrap" }}>
                    <span style={{ fontSize:11,padding:"2px 8px",borderRadius:99,background:"var(--bg-overlay)",color:"var(--text-muted)",border:"1px solid var(--border)",fontFamily:"var(--mono)" }}>⏱ {openData.time}</span>
                    {openData.prereqs.map((p) => (
                      <span key={p} style={{ fontSize:11,padding:"2px 8px",borderRadius:99,background:"var(--bg-overlay)",color:"var(--text-muted)",border:"1px solid var(--border)" }}>needs: {p}</span>
                    ))}
                  </div>
                </div>

                {/* Tabs */}
                <div style={{ display:"flex",borderBottom:"1px solid var(--border)",flexShrink:0 }}>
                  {["easy","medium","hard"].map((t) => {
                    const count = openData[t].length;
                    const colors = {easy:"var(--easy)",medium:"var(--medium)",hard:"var(--hard)"};
                    return (
                      <button key={t} onClick={() => setTab(t)}
                        style={{ flex:1,padding:"9px 0",fontSize:12,fontWeight:tab===t?600:400,cursor:"pointer",
                          borderBottom:`2px solid ${tab===t?colors[t]:"transparent"}`,
                          color:tab===t?colors[t]:"var(--text-muted)",background:"none",border:"none",
                          borderBottom:`2px solid ${tab===t?colors[t]:"transparent"}`,transition:"all .15s"
                        }}>
                        {t.charAt(0).toUpperCase()+t.slice(1)} ({count})
                      </button>
                    );
                  })}
                </div>

                {/* Questions */}
                <div style={{ flex:1,overflowY:"auto",padding:"10px 12px" }}>
                  {openData[tab].map((q, i) => {
                    const [bg,fg] = PLAT_COLORS[q.plat]||PLAT_COLORS.lc;
                    return (
                      <div key={q.id} style={{ display:"flex",alignItems:"center",gap:8,padding:"8px 9px",marginBottom:5,borderRadius:8,border:"1px solid var(--border)",cursor:"pointer",background:"var(--bg-card)",transition:"background .1s" }}
                        onMouseEnter={(e)=>e.currentTarget.style.background="var(--bg-hover)"}
                        onMouseLeave={(e)=>e.currentTarget.style.background="var(--bg-card)"}
                      >
                        <div style={{ width:24,fontSize:10,color:"var(--text-muted)",fontFamily:"var(--mono)",flexShrink:0 }}>{i+1}</div>
                        <div style={{ flex:1,minWidth:0 }}>
                          <div style={{ fontSize:12,color:"var(--text-primary)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",cursor:"pointer" }}
                            onClick={() => window.open(q.url,"_blank")}>{q.name}</div>
                          <span style={{ fontSize:9,padding:"1px 5px",borderRadius:3,fontWeight:600,background:bg,color:fg,marginTop:2,display:"inline-block" }}>{PLAT_NAMES[q.plat]}</span>
                        </div>
                        <div onClick={(e) => toggleSolved(e, q.id)}
                          style={{ width:16,height:16,borderRadius:"50%",border:`1.5px solid ${solved[q.id]?"#22c55e":"var(--border-hover)"}`,background:solved[q.id]?"#22c55e":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,cursor:"pointer",transition:"all .15s" }}>
                          {solved[q.id] && <span style={{ color:"#000",fontSize:9,fontWeight:700,lineHeight:1 }}>✓</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Progress bar */}
                <div style={{ padding:"10px 12px",borderTop:"1px solid var(--border)",flexShrink:0 }}>
                  <div style={{ display:"flex",justifyContent:"space-between",fontSize:11,color:"var(--text-muted)",marginBottom:5 }}>
                    <span>{totalSolved(active)}/{totalQ(active)} solved</span>
                    <span>{Math.round((totalSolved(active)/totalQ(active))*100)}%</span>
                  </div>
                  <div style={{ height:3,background:"var(--bg-overlay)",borderRadius:2,overflow:"hidden" }}>
                    <div style={{ height:"100%",width:`${Math.round((totalSolved(active)/totalQ(active))*100)}%`,background:"var(--green)",borderRadius:2,transition:"width .3s" }} />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}