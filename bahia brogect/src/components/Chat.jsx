import { useState, useRef, useEffect, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import BahiaLogo from "./BahiaLogo";
import { translations } from "../i18n";

// ── Helpers ────────────────────────────────────────────────────────
function pickCards(pool) {
  if (!Array.isArray(pool) || pool.length === 0) return [];
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 4);
}

function isArabic(text) {
  return typeof text === "string" && /[\u0600-\u06FF]/.test(text);
}

/**
 * Safely extract first name from a user object.
 * Works whether the user came from Supabase (only email/name)
 * or from the old local-storage auth (nameAr / nameEn).
 */
function getFirstName(user, lang) {
  if (!user) return "";
  const raw =
    lang === "ar"
      ? (user.nameAr || user.name || user.email || "")
      : (user.nameEn || user.name || user.email || "");
  const str = typeof raw === "string" ? raw : String(raw ?? "");
  return str.split(" ")[0] || "";
}

// ── Component ──────────────────────────────────────────────────────
export default function Chat({
  user,
  messages,
  loading,
  onSend,
  onDeleteMessage,
  lang,
  onToggleLang,
  dark,
  onToggleDark,
  onToggleSidebar,
}) {
  const [input,       setInput]       = useState("");
  const [contextMenu, setContextMenu] = useState(null);
  const [renderError, setRenderError] = useState(null);
  const endRef = useRef(null);

  // Guard: if translations for this lang don't exist, fall back to "ar"
  const t = translations[lang] ?? translations["ar"];

  // Memoised card selection — recomputes only when lang changes
  const shownCards = useMemo(() => {
    try { return pickCards(t.welcomeCards); } catch { return []; }
  }, [lang]);           // ← only lang, NOT t, to avoid infinite loops

  // Auto-scroll to latest message
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Close context menu on outside click
  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [contextMenu]);

  // ── Handlers ──────────────────────────────────────────────────────
  function send(text) {
    try {
      if (!text?.trim() || loading) return;
      onSend(text.trim());
      setInput("");
    } catch (err) {
      console.error("send() error:", err);
    }
  }

  function handleContextMenu(e, msg) {
    e.preventDefault();
    setContextMenu({ mouseX: e.clientX, mouseY: e.clientY, msgId: msg.id });
  }

  function handleDeleteFromMenu() {
    if (contextMenu?.msgId) onDeleteMessage?.(contextMenu.msgId);
    setContextMenu(null);
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  // ── Derived values ────────────────────────────────────────────────
  const safeMessages = Array.isArray(messages) ? messages : [];
  const empty        = safeMessages.length === 0 && !loading;
  const firstName    = getFirstName(user, lang);

  // ── Error boundary fallback ───────────────────────────────────────
  if (renderError) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "var(--text)" }}>
        <h2>⚠️ Something went wrong</h2>
        <p style={{ color: "var(--text-muted)", marginTop: 10 }}>{renderError}</p>
        <button
          onClick={() => setRenderError(null)}
          style={{ marginTop: 20, padding: "8px 20px", cursor: "pointer" }}
        >
          Try Again
        </button>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────
  try {
    return (
      <div
        style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}
        dir={t.dir}
      >
        {/* ── Top bar ── */}
        <div className="topbar">
          <div style={{ display: "flex", alignItems: "center" }}>
            <div className="t-title">
              <BahiaLogo size={24} />
              {t.appName}
            </div>
            <button className="hamburger-btn" onClick={onToggleSidebar}>☰</button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button className="tbtn" onClick={onToggleLang}>{lang === "ar" ? "EN" : "ع"}</button>
            <button className="tbtn" onClick={onToggleDark}>{dark ? "☀️" : "🌙"}</button>
            <button className="tbtn" onClick={() => window.location.href = "/"}>
              🏠 {lang === "ar" ? "الرئيسية" : "Back to Home"}
            </button>
            <div className="pill"><div className="dot" /> {t.online}</div>
          </div>
        </div>

        {/* ── Welcome screen OR messages ── */}
        {empty ? (
          <div className="wlc" style={{ flex: 1, overflow: "auto" }}>
            <div className="wlc-ico"><BahiaLogo size={44} /></div>
            <div className="wlc-title">{t.welcomeTitle?.(firstName) ?? "مرحباً"}</div>
            <div className="wlc-sub" style={{ whiteSpace: "pre-line" }}>{t.welcomeSub}</div>
            <div className="wgrid">
              {shownCards.map((c) => (
                <div key={c.prompt} className="wcard" onClick={() => send(c.prompt)}>
                  <div className="wc-ico">{c.icon}</div>
                  <div className="wc-lbl">{c.label}</div>
                  <div className="wc-txt">{c.prompt}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="msgs" style={{ flex: 1, overflowY: "auto" }}>
            {safeMessages.map((m, i) => (
              <div
                key={m.id ?? i}
                className={"mrow " + (m.role ?? "user")}
                onContextMenu={m.role === "user" ? (e) => handleContextMenu(e, m) : undefined}
              >
                <div className={"mav " + (m.role === "ai" ? "ai" : "me")}>
                  {m.role === "ai" ? <BahiaLogo size={20} /> : (user?.initials ?? "?")}
                </div>
                <div>
                  <div
                    className={"bub " + (m.role ?? "user")}
                    dir={isArabic(m.text) ? "rtl" : "ltr"}
                    style={{ textAlign: isArabic(m.text) ? "right" : "left" }}
                  >
                    {m.role === "ai" ? (
                      <ReactMarkdown>{m.text ?? ""}</ReactMarkdown>
                    ) : (
                      m.text ?? ""
                    )}
                  </div>
                  <div className="bmeta">{m.time ?? ""}</div>
                </div>
              </div>
            ))}

            {/* Typing dots */}
            {loading && (
              <div className="mrow ai">
                <div className="mav ai"><BahiaLogo size={20} /></div>
                <div className="bub ai">
                  <div className="tdots"><span /><span /><span /></div>
                </div>
              </div>
            )}

            <div ref={endRef} />
          </div>
        )}

        {/* ── Disclaimer ── */}
        <div className="disc">{t.disclaimer}</div>

        {/* ── Input zone ── */}
        <div className="izone">
          <div className="chips">
            {(t.quickChips ?? []).map((c) => (
              <button key={c} className="chip" onClick={() => send(c)}>{c}</button>
            ))}
          </div>
          <div className="irow">
            <textarea
              className="ta"
              rows={1}
              placeholder={t.inputPlaceholder ?? ""}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              dir={t.dir}
              style={{ direction: t.dir }}
            />
            <button
              className="sbtn"
              onClick={() => send(input)}
              disabled={!input.trim() || loading}
            >
              ↑
            </button>
          </div>
        </div>

        {/* ── Context menu ── */}
        {contextMenu && (
          <div
            className="ctx-menu"
            style={{ top: contextMenu.mouseY, left: contextMenu.mouseX }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ctx-item" onClick={handleDeleteFromMenu}>
              🗑 {lang === "ar" ? "حذف الرسالة" : "Delete Message"}
            </div>
          </div>
        )}
      </div>
    );
  } catch (err) {
    // If render itself throws, show the fallback instead of white screen
    console.error("Chat render error:", err);
    setRenderError(err.message ?? "Unknown render error");
    return null;
  }
}