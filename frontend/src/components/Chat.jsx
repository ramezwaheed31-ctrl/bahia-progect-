import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import BahiaLogo from "./BahiaLogo";
import { translations } from "../i18n";

function isArabic(text) {
  return typeof text === "string" && /[\u0600-\u06FF]/.test(text);
}

function getFirstName(user, lang) {
  if (!user) return "";
  const raw =
    lang === "ar"
      ? user.nameAr || user.name || user.email || ""
      : user.nameEn || user.name || user.email || "";
  const str = typeof raw === "string" ? raw : String(raw ?? "");
  return str.split(" ")[0] || "";
}

function renderMessageText(text, isUser) {
  if (isUser) {
    return text ?? "";
  }

  if (!text) return null;

  const reportRegex = /\[DIAGNOSIS_REPORT\]([\s\S]*?)\[END_DIAGNOSIS_REPORT\]/;
  const match = text.match(reportRegex);

  if (match) {
    const reportContent = match[1];
    const cleanText = text.replace(reportRegex, "").trim();

    let cancerStatus = "No Cancer";
    let cancerConf = "0%";
    let malignancyStatus = "Benign";
    let malignancyConf = "0%";

    const lines = reportContent.split("\n");
    lines.forEach((line) => {
      if (line.includes("Cancer Status:")) {
        const parts = line.split("Cancer Status:")[1].trim().split("(");
        cancerStatus = parts[0].trim();
        if (parts[1]) cancerConf = parts[1].replace(")", "").trim();
      }
      if (line.includes("Malignancy Status:")) {
        const parts = line.split("Malignancy Status:")[1].trim().split("(");
        malignancyStatus = parts[0].trim();
        if (parts[1]) malignancyConf = parts[1].replace(")", "").trim();
      }
    });

    const isCancer =
      cancerStatus.toLowerCase().includes("cancer") &&
      !cancerStatus.toLowerCase().includes("no");
    const isMalignant = malignancyStatus.toLowerCase().includes("malignant");
    const isAr = isArabic(text);

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 14,
          width: "100%",
        }}
      >
        {/* Visual Report Card */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 16,
            padding: 16,
            boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
            display: "flex",
            flexDirection: "column",
            gap: 14,
            width: "100%",
            maxWidth: 480,
            margin: "8px 0",
            alignSelf: "stretch",
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              color: "var(--pink)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              borderBottom: "1px solid var(--border)",
              paddingBottom: 8,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span>🩻</span>
            <span>
              {isAr
                ? "تقرير تحليل المسح الطبي"
                : "Medical Scan Analysis Report"}
            </span>
          </div>

          {/* Classification 1: Cancer vs No Cancer */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}
              >
                {isAr ? "حالة الإصابة بالسرطان" : "Cancer Status"}
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "3px 9px",
                  borderRadius: 20,
                  background: isCancer
                    ? "rgba(239, 68, 68, 0.12)"
                    : "rgba(34, 197, 94, 0.12)",
                  color: isCancer ? "rgb(239, 68, 68)" : "rgb(34, 197, 94)",
                }}
              >
                {isAr
                  ? isCancer
                    ? "سرطان"
                    : "سليم (لا يوجد سرطان)"
                  : cancerStatus}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  flex: 1,
                  height: 8,
                  background: "var(--border)",
                  borderRadius: 4,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: cancerConf,
                    height: "100%",
                    background: isCancer
                      ? "linear-gradient(90deg, #f87171, #ef4444)"
                      : "linear-gradient(90deg, #4ade80, #22c55e)",
                    borderRadius: 4,
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  minWidth: 36,
                  textAlign: "right",
                }}
              >
                {cancerConf}
              </span>
            </div>
          </div>

          {/* Classification 2: Benign vs Malignant */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}
              >
                {isAr ? "تصنيف الورم" : "Tumor Classification"}
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "3px 9px",
                  borderRadius: 20,
                  background: isMalignant
                    ? "rgba(239, 68, 68, 0.12)"
                    : "rgba(34, 197, 94, 0.12)",
                  color: isMalignant ? "rgb(239, 68, 68)" : "rgb(34, 197, 94)",
                }}
              >
                {isAr
                  ? isMalignant
                    ? "خبيث (نشط)"
                    : "حميد (سليم)"
                  : malignancyStatus}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  flex: 1,
                  height: 8,
                  background: "var(--border)",
                  borderRadius: 4,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: malignancyConf,
                    height: "100%",
                    background: isMalignant
                      ? "linear-gradient(90deg, #f87171, #ef4444)"
                      : "linear-gradient(90deg, #4ade80, #22c55e)",
                    borderRadius: 4,
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  minWidth: 36,
                  textAlign: "right",
                }}
              >
                {malignancyConf}
              </span>
            </div>
          </div>
        </div>

        {/* Clinical Explanation */}
        {cleanText && (
          <div
            dir={isAr ? "rtl" : "ltr"}
            style={{ textAlign: isAr ? "right" : "left", lineHeight: 1.6 }}
          >
            <ReactMarkdown>{cleanText}</ReactMarkdown>
          </div>
        )}
      </div>
    );
  }

  return <ReactMarkdown>{text}</ReactMarkdown>;
}

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
  gender,
  onSetGender,
}) {
  const [input, setInput] = useState("");
  const [contextMenu, setContextMenu] = useState(null);
  const [renderError, setRenderError] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  const endRef = useRef(null);
  const fileRef = useRef(null);
  const taRef = useRef(null);

  const t = translations[lang] ?? translations["ar"];
  const isAr = lang === "ar";
  const isMale = gender === "male";

  const welcomeSub = isMale ? t.welcomeSubMale || t.welcomeSub : t.welcomeSub;
  const disclaimer = isMale ? t.disclaimerMale || t.disclaimer : t.disclaimer;
  const inputPlaceholder = isMale
    ? t.inputPlaceholderMale || t.inputPlaceholder
    : t.inputPlaceholder;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [contextMenu]);

  useEffect(() => {
    if (!taRef.current) return;
    taRef.current.style.height = "auto";
    taRef.current.style.height =
      Math.min(taRef.current.scrollHeight, 130) + "px";
  }, [input]);

  async function handleImagePick(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImageFile({
        file,
        preview: URL.createObjectURL(file),
        base64: reader.result.split(",")[1],
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
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
  const empty = safeMessages.length === 0 && !loading;
  const firstName = getFirstName(user, lang);

  if (renderError) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "var(--text)" }}>
        <h2>⚠️ خطأ</h2>
        <button
          onClick={() => setRenderError(null)}
          style={{ marginTop: 20, padding: "8px 20px", cursor: "pointer" }}
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  try {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          overflow: "hidden",
        }}
        dir={t.dir}
      >
        {/* ── Top bar ── */}
        <div className="topbar">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button className="hamburger-btn" onClick={onToggleSidebar}>
              ☰
            </button>
          </div>

          {/* ── Chatbot name — visible in center (hidden on welcome screen to avoid double-rendering) ── */}
          {!empty && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                position: "absolute",
                left: "50%",
                transform: "translateX(-50%)",
                pointerEvents: "none",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  fontFamily: "var(--font)",
                  fontWeight: 800,
                  fontSize: 16,
                  color: "var(--text)",
                  letterSpacing: "-0.2px",
                }}
              >
                <BahiaLogo size={26} />
                MammoGuide
              </div>
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Home icon only — no text */}
            <button
              className="tbtn"
              onClick={() => (window.location.href = "/")}
              title={isAr ? "الرئيسية" : "Home"}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                width: 36,
                height: 36,
                padding: 0,
              }}
            >
              🏠
            </button>
            {/* Language toggle: show full عربي / EN label */}
            <button
              className="tbtn"
              onClick={onToggleLang}
              style={{ minWidth: 44 }}
              dir={isAr ? "ltr" : "rtl"}
              lang={isAr ? "en" : "ar"}
            >
              {isAr ? "EN" : "عربي"}
            </button>
            <button className="tbtn" onClick={onToggleDark}>
              {dark ? "☀️" : "🌙"}
            </button>
          </div>
        </div>

        {/* ── Scrollable messages ── */}
        <div
          className="msgs"
          style={{
            flex: 1,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            alignItems: empty ? "center" : undefined,
            justifyContent: empty ? "flex-start" : undefined,
            padding: empty ? "12px 16px 8px" : "28px 28px 12px",
          }}
        >
          {empty ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                width: "100%",
                maxWidth: 680,
              }}
            >
              <div
                className="wlc-ico"
                style={{
                  marginBottom: 16,
                  width: 64,
                  height: 64,
                  background:
                    "linear-gradient(135deg, var(--pink-dim), rgba(232,115,138,0.2))",
                  border: "none",
                  boxShadow: "0 8px 24px rgba(232,115,138,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "50%",
                }}
              >
                <BahiaLogo size={36} />
              </div>
              <div
                className="wlc-title"
                style={{
                  marginTop: 8,
                  fontSize: 26,
                  fontWeight: 800,
                  marginBottom: 6,
                  color: "var(--text)",
                  letterSpacing: "-0.5px",
                }}
              >
                {t.welcomeTitle?.(firstName, gender) ?? `أهلاً، ${firstName}`}
              </div>
              <div
                className="wlc-sub"
                style={{
                  whiteSpace: "pre-line",
                  marginBottom: 20,
                  fontSize: 14,
                  lineHeight: 1.6,
                  color: "var(--text-muted)",
                  maxWidth: 400,
                  textAlign: "center",
                }}
              >
                {welcomeSub}
              </div>
            </div>
          ) : (
            <>
              {safeMessages.map((m, i) => {
                const hasText = m.text && m.text.trim();
                const hasImage = !!m.imagePreview;
                const isUser = m.role !== "ai";

                return (
                  <div
                    key={m.id ?? i}
                    className={"mrow " + (isUser ? "user" : "ai")}
                    onContextMenu={
                      isUser ? (e) => handleContextMenu(e, m) : undefined
                    }
                  >
                    <div className={"mav " + (isUser ? "me" : "ai")}>
                      {isUser ? (
                        (user?.initials ?? "?")
                      ) : (
                        <BahiaLogo size={20} />
                      )}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: isUser ? "flex-end" : "flex-start",
                        maxWidth: "82%",
                      }}
                    >
                      {hasImage && (
                        <img
                          src={m.imagePreview}
                          alt=""
                          style={{
                            display: "block",
                            maxWidth: hasText ? 220 : 260,
                            maxHeight: hasText ? 180 : 220,
                            borderRadius: hasText ? 10 : 14,
                            marginBottom: hasText ? 8 : 0,
                            objectFit: "cover",
                            ...(hasText
                              ? {}
                              : { border: "1.5px solid var(--border-md)" }),
                          }}
                        />
                      )}
                      {hasText && (
                        <div
                          className={"bub " + (isUser ? "user" : "ai")}
                          dir={isArabic(m.text) ? "rtl" : "ltr"}
                          style={{
                            textAlign: isArabic(m.text) ? "right" : "left",
                            maxWidth: "100%",
                          }}
                        >
                          {renderMessageText(m.text, isUser)}
                        </div>
                      )}
                      <div
                        className="bmeta"
                        style={{
                          textAlign: isUser ? "right" : "left",
                          width: "100%",
                        }}
                      >
                        {m.time ?? ""}
                      </div>
                    </div>
                  </div>
                );
              })}

              <div ref={endRef} />
            </>
          )}
        </div>

        {/* ── Input zone — always centered ── */}
        <div
          style={{
            padding: "12px 28px 20px",
            background: "var(--warm)",
            borderTop: "1px solid var(--border)",
            flexShrink: 0,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div style={{ width: "100%", maxWidth: 680 }}>
            {/* Disclaimer */}
            <div
              className="disc"
              style={{
                margin: "0 0 10px",
                borderRadius: 10,
                border: "1px solid var(--pink-border)",
              }}
            >
              {disclaimer}
            </div>

            {/* Image preview — clean card, no pink bg */}
            {imageFile && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 8,
                  padding: "8px 12px",
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                }}
              >
                <img
                  src={imageFile.preview}
                  alt=""
                  style={{
                    width: 52,
                    height: 52,
                    objectFit: "cover",
                    borderRadius: 8,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    flex: 1,
                    fontSize: 12,
                    color: "var(--text-muted)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {imageFile.file.name}
                </span>
                <button
                  onClick={() => setImageFile(null)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--danger)",
                    fontSize: 18,
                    cursor: "pointer",
                    padding: "0 4px",
                    lineHeight: 1,
                  }}
                >
                  ✕
                </button>
              </div>
            )}

            {/* Modern input row */}
            <div
              className="modern-input-box"
              style={{ flexDirection: isAr ? "row-reverse" : "row" }}
            >
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleImagePick}
              />

              {/* Arabic: attach btn on the right (start of RTL); English: attach btn after textarea */}
              {isAr && (
                <button
                  className="ibtn"
                  onClick={() => fileRef.current?.click()}
                  title="إرفاق صورة"
                  disabled={loading}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="3" ry="3" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </button>
              )}

              <textarea
                ref={taRef}
                className="ta"
                rows={1}
                placeholder={inputPlaceholder}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                dir={t.dir}
                style={{
                  direction: t.dir,
                  flex: 1,
                  minHeight: 44,
                  maxHeight: 130,
                  resize: "none",
                  border: "none",
                  background: "transparent",
                  outline: "none",
                  padding: "11px 8px",
                  fontSize: 14,
                  color: "var(--text)",
                  fontFamily: "var(--font)",
                  lineHeight: 1.6,
                  overflow: "hidden",
                }}
              />

              {/* English: attach btn on the right side, before send btn */}
              {!isAr && (
                <button
                  className="ibtn"
                  onClick={() => fileRef.current?.click()}
                  title="Attach image"
                  disabled={loading}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="3" ry="3" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </button>
              )}

              {/* Send btn — at end of text direction (after textarea) */}
              <button
                className="sbtn"
                onClick={() => send(input)}
                disabled={(!input.trim() && !imageFile) || loading}
              >
                {/* Arrow points right for LTR, left for RTL */}
                {isAr ? (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="19" y1="12" x2="5" y2="12" />
                    <polyline points="11 18 5 12 11 6" />
                  </svg>
                ) : (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="13 6 19 12 13 18" />
                  </svg>
                )}
              </button>
            </div>

            {/* Quick chips */}
            <div
              className="chips"
              style={{ marginTop: 10, justifyContent: "center" }}
            >
              {(t.quickChips ?? []).map((c) => (
                <button key={c} className="chip" onClick={() => send(c)}>
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>

        {contextMenu && (
          <div
            className="ctx-menu"
            style={{ top: contextMenu.mouseY, left: contextMenu.mouseX }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ctx-item" onClick={handleDeleteFromMenu}>
              🗑 {isAr ? "حذف الرسالة" : "Delete Message"}
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
