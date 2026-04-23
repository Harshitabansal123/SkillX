import React, { useState, useRef, useEffect, useContext } from "react";

const SUGGESTIONS = [
  "How do I solve Two Sum?",
  "Explain dynamic programming",
  "What's the best way to practice graphs?",
  "Give me a study plan for FAANG",
  "What topics should I focus on first?",
];

export default function AIAssistant({ currentPage, currentProblem }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi! I'm your SkillX AI tutor. I can help you understand DSA concepts, explain approaches, review your code, or build a custom study plan. What would you like to work on?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const systemPrompt = `You are SkillX AI, an expert DSA and coding interview tutor built into the SkillX platform. You help developers prepare for technical interviews at top companies.

Current context:
- User is on the "${currentPage}" page
${currentProblem ? `- Currently looking at: ${currentProblem}` : ""}

Your personality: encouraging, clear, precise. You explain with examples. When explaining algorithms, you break them into steps. You give time/space complexity for every solution you mention. Keep responses concise but complete — never more than 3 paragraphs unless asked for a full walkthrough. Use markdown formatting: **bold** for key terms, \`code\` for inline code, numbered lists for steps.`;

  const send = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput("");

    const newMessages = [...messages, { role: "user", content: msg }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: systemPrompt,
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      const reply = data.content?.[0]?.text || "Sorry, I couldn't get a response. Please try again.";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Connection error. Make sure the backend is running and you're connected." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const formatMessage = (text) => {
    // Simple markdown-like rendering
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/`(.*?)`/g, '<code style="background:#1a1a2e;padding:1px 5px;border-radius:3px;font-family:DM Mono,monospace;font-size:11px;color:#c4b5fd">$1</code>')
      .replace(/\n/g, "<br/>");
  };

  return (
    <div className="ai-assistant">
      {open && (
        <div className="ai-chat-window">
          {/* Header */}
          <div className="ai-chat-header">
            <div className="ai-avatar">🤖</div>
            <div>
              <div className="ai-name">SkillX AI</div>
              <div className="ai-status">
                <div className="live-dot" />
                Online · Powered by Claude
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{ marginLeft: "auto", background: "none", border: "none", color: "var(--text-muted)", fontSize: 18, cursor: "pointer", padding: "2px 6px" }}
            >
              ×
            </button>
          </div>

          {/* Messages */}
          <div className="ai-messages">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`ai-msg ${m.role === "assistant" ? "ai" : "user"}`}
                dangerouslySetInnerHTML={
                  m.role === "assistant" ? { __html: formatMessage(m.content) } : undefined
                }
              >
                {m.role === "user" ? m.content : undefined}
              </div>
            ))}
            {loading && (
              <div className="ai-msg ai">
                <div className="ai-typing">
                  <div className="ai-dot" />
                  <div className="ai-dot" />
                  <div className="ai-dot" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions (only when 1 message) */}
          {messages.length === 1 && (
            <div className="ai-suggestions">
              {SUGGESTIONS.map((s) => (
                <button key={s} className="ai-suggest-btn" onClick={() => send(s)}>
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="ai-input-row">
            <input
              ref={inputRef}
              className="ai-input"
              placeholder="Ask anything about DSA..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
            />
            <button className="ai-send" onClick={() => send()} disabled={loading}>
              ↑
            </button>
          </div>
        </div>
      )}

      <button className="ai-fab" onClick={() => setOpen((o) => !o)}>
        {open ? "✕" : "🤖"}
      </button>
      <div className="ai-fab-label">AI Tutor</div>
    </div>
  );
}