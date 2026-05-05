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
    return <div className="company-logo-fallback">{emoji || "🏢"}</div>;
  }

  return (
    <div className="company-logo">
      <img
        src={`https://logo.clearbit.com/${domain}`}
        alt={name}
        onError={() => setFailed(true)}
        style={{ width:22, height:22, objectFit:"contain" }}
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

  // 🔥 Load companies
  useEffect(() => {
    apiCall("/companies/","GET")
      .then((d) => {
        console.log("Companies:", d);
        setCompanies(d.companies || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // 🔥 Load questions
  const loadCompany = async (id) => {
    setSelected(id);
    setQLoading(true);
    setDiffFilter("");

    try {
      const d = await apiCall(`/companies/${id}/`, "GET");
      console.log("Questions:", d);

      setQuestions(d.questions || []);
      setCompanyInfo(d.company || null);

    } catch {
      toast("Could not load questions", "error");
    } finally {
      setQLoading(false);
    }
  };

  const filtered = companies.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredQ = questions.filter(
    (q) => !diffFilter || q.difficulty === diffFilter
  );

  return (
    <div className="app-shell page-enter">
      <Sidebar activePage="companies" onNav={onNav} username={username} onLogout={onLogout} level={userLevel} streak={userStreak} />

      <div className="main-content">
        <Topbar title="Company Questions" subtitle="Real interview questions · click to open on platform" username={username} />

        <div className="companies-layout">

          {/* LEFT SIDEBAR */}
          <div className="company-sidebar">
            <div className="company-search">
              <input
                className="input"
                placeholder="🔍 Search company…"
                value={search}
                onChange={(e)=>setSearch(e.target.value)}
              />
            </div>

            <div className="company-list">
              {loading ? (
                <div style={{ padding:20 }}>Loading…</div>
              ) : filtered.map((c) => (
                <div
                  key={c.id}
                  className={`company-item ${selected===c.id ? "active":""}`}
                  onClick={() => loadCompany(c.id)}
                >
                  <CompanyLogo
                    name={c.name}
                    domain={COMPANY_DOMAINS[c.id]}
                    emoji="🏢"
                  />

                  <div>
                    <div className="company-name">{c.name}</div>

                    {/* 🔥 FIXED */}
                    <div className="company-count">
                      Click to view
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div className="questions-panel">

            {!selected ? (
              <div style={{ textAlign:"center", marginTop:"100px" }}>
                <h3>Select a company</h3>
                <p>Click any company to see questions</p>
              </div>
            ) : (
              <>
                {/* HEADER */}
                {companyInfo && (
                  <div style={{ marginBottom:"10px" }}>
                    <h3>{companyInfo.full_name}</h3>
                  </div>
                )}

                {/* FILTER */}
                <select
                  value={diffFilter}
                  onChange={(e)=>setDiffFilter(e.target.value)}
                >
                  <option value="">All</option>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>

                {/* QUESTIONS */}
                <div className="questions-list">
                  {qLoading ? (
                    <div>Loading questions...</div>
                  ) : filteredQ.length === 0 ? (
                    <div>No questions found</div>
                  ) : (
                    filteredQ.map((q) => (
                      <div
                        key={q.id}
                        className="question-row"
                        onClick={() => {
                          if (!q.link) {
                            alert("Link not available");
                            return;
                          }
                          let url = q.link;
                          // 🔥 FIX: make sure it's full URL
                            if (!url.startsWith("http")) {
                              url = "https://leetcode.com" + url;
                            }
                            window.open(url, "_blank");
                          }}   // 🔥 FIXED
                        style={{ cursor:"pointer" }}
                      >
                        <span>{q.id}</span>
                        <span>{q.title}</span>
                        <DiffTag difficulty={q.difficulty} />
                      </div>
                    ))
                  )}
                </div>
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

export default CompaniesPage;