import { useState, useRef, useEffect, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import BahiaLogo from "./BahiaLogo";
import { translations } from "../i18n";

function pickCards(pool) {
  if (!Array.isArray(pool) || pool.length === 0) return [];
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 4);
}

function isArabic(text) {
  return typeof text === "string" && /[\u0600-\u06FF]/.test(text);
}

function getFirstName(user, lang) {
  if (!user) return "";
  const raw =
    lang === "ar"
      ? (user.nameAr || user.name || user.email || "")
      : (user.nameEn || user.name || user.email || "");
  const str = typeof raw === "string" ? raw : String(raw ?? "");
  return str.split(" ")[0] || "";
}

export default function Chat({
  user, messages, loading, onSend, onDeleteMessage,
  lang, onToggleLang, dark, onToggleDark, onToggleSidebar,
}) {
  const [input,       setInput]       = useState("");
  const [contextMenu, setContextMenu] = useState(null);
  const [renderError, setRenderError] = useState(null);
  const [imageFile,   setImageFile]   = useState(null);   // { file, preview, base64 }
  const endRef    = useRef(null);
  const fileRef   = useRef(null);

  const t = translations[lang] ?? translations["ar"];

  const shownCards = useMemo(() => {
    try { return pickCards(t.welcomeCards); } catch { return []; }
  }, [lang]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [contextMenu]);

  async function handleImagePick(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Convert to base64
    const reader = new FileReader();
    reader.onload = () => {
      setImageFile({ file, preview: URL.createObjectURL(file), base64: reader.result.split(",")[1] });
    };
    reader.readAsDataURL(file);
    e.target.value = ""; // allow re-select same file
  }

  function send(text) {
    try {
      if ((!text?.trim() && !imageFile) || loading) return;
      onSend(text.trim(), imageFile);
      setInput("");
      setImageFile(null);
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

  const safeMessages = Array.isArray(messages) ? messages : [];
  const empty        = safeMessages.length === 0 && !loading;
  const firstName    = getFirstName(user, lang);

  if (renderError) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "var(--text)" }}>
        <h2>⚠️ Something went wrong</h2>
        <p style={{ color: "var(--text-muted)", marginTop: 10 }}>{renderError}</p>
        <button onClick={() => setRenderError(null)} style={{ marginTop: 20, padding: "8px 20px", cursor: "pointer" }}>
          Try Again
        </button>
      </div>
    );
  }

  try {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }} dir={t.dir}>
        {/* ── Top bar ── */}
        <div className="topbar">
          <div style={{ display: "flex", alignItems: "center" }}>
            {/* ✅ Click logo or title → home */}
            <div
              className="t-title"
              onClick={() => window.location.href = '/'}
              title={lang === "ar" ? "الرئيسية" : "Go to Home"}
            >
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
                    {m.imagePreview && (
                      <img src={m.imagePreview} alt="" style={{ display: "block", maxWidth: 220, maxHeight: 180, borderRadius: 10, marginBottom: m.text ? 8 : 0, objectFit: "cover" }} />
                    )}
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

        <div className="disc">{t.disclaimer}</div>

        <div className="izone">
          <div className="chips">
            {(t.quickChips ?? []).map((c) => (
              <button key={c} className="chip" onClick={() => send(c)}>{c}</button>
            ))}
          </div>
          {/* ✅ Image preview strip */}
          {imageFile && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, padding: "6px 10px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10 }}>
              <img src={imageFile.preview} alt="" style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 7, border: "1px solid var(--border)" }} />
              <div style={{ flex: 1, fontSize: 12, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{imageFile.file.name}</div>
              <button onClick={() => setImageFile(null)} style={{ background: "transparent", border: "none", color: "var(--danger)", fontSize: 16, cursor: "pointer", padding: "0 4px" }}>✕</button>
            </div>
          )}
          <div className="irow">
            {/* ✅ Image upload button */}
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImagePick} />
            <button
              className="ibtn"
              onClick={() => fileRef.current?.click()}
              title={lang === "ar" ? "إرفاق صورة" : "Attach image"}
              disabled={loading}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="3" ry="3"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
            </button>
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
              disabled={(!input.trim() && !imageFile) || loading}
            >
              ↑
            </button>
          </div>
        </div>

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
    console.error("Chat render error:", err);
    setRenderError(err.message ?? "Unknown render error");
    return null;
  }
}