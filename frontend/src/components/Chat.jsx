import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import BahiaLogo from "./BahiaLogo";
import { translations } from "../i18n";

/**
 * Helper function to detect if a given text contains Arabic characters.
 * @param {string} text - The input text to check.
 * @returns {boolean} True if Arabic, false otherwise.
 * 
 * دالة مساعدة لتحديد ما إذا كان النص المعطى يحتوي على أحرف عربية.
 * @param {string} text - النص المراد فحصه.
 * @returns {boolean} صحيح إذا كان عربياً، خلاف ذلك خطأ.
 */
function isArabic(text) {
  return typeof text === "string" && /[\u0600-\u06FF]/.test(text);
}

/**
 * Retrieves the first name of a user based on language preferences.
 * @param {object} user - The user object containing names/emails.
 * @param {string} lang - The active language code ('ar' or 'en').
 * @returns {string} The first name or first word of user identifier.
 * 
 * تسترجع الاسم الأول للمستخدم بناءً على اللغة المفضلة.
 * @param {object} user - كائن المستخدم المحتوي على الأسماء/البريد.
 * @param {string} lang - رمز اللغة النشطة ('ar' أو 'en').
 * @returns {string} الاسم الأول أو الكلمة الأولى من معرف المستخدم.
 */
function getFirstName(user, lang) {
  if (!user) return "";
  const raw = lang === "ar"
    ? (user.nameAr || user.name || user.email || "")
    : (user.nameEn || user.name || user.email || "");
  const str = typeof raw === "string" ? raw : String(raw ?? "");
  return str.split(" ")[0] || "";
}

/**
 * MascotIllustration Component - Renders a premium medical mascot animation (currently decorative).
 * مكون تمثيلي - يعرض رسوم متحركة للمساعد الطبي المبتكر (تزييني حالياً).
 */
function MascotIllustration() {
  return (
    <div className="mascot-wrapper">
      <div className="mascot-bg-pulse" />
      <svg width="130" height="130" viewBox="0 0 130 130" fill="none" className="floating-mascot">
        <ellipse cx="65" cy="118" rx="28" ry="5" fill="rgba(217, 108, 157, 0.12)" filter="blur(2.5px)" className="mascot-shadow" />
        <circle cx="65" cy="60" r="48" stroke="rgba(239, 163, 200, 0.15)" strokeWidth="1.5" strokeDasharray="3 6" />
        <circle cx="65" cy="60" r="40" stroke="rgba(217, 108, 157, 0.12)" strokeWidth="1" />
        
        {/* Floating Heart Decorations */}
        <path d="M12 42c-1-1-2.5-1-3.5 0s-1 2.5 0 3.5l3.5 3.5 3.5-3.5c1-1 1-2.5 0-3.5s-2.5-1-3.5 0z" fill="var(--pink-light)" opacity="0.3" transform="scale(0.8) translate(10, 10)" />
        <path d="M112 46c-1-1-2.5-1-3.5 0s-1 2.5 0 3.5l3.5 3.5 3.5-3.5c1-1 1-2.5 0-3.5s-2.5-1-3.5 0z" fill="var(--pink)" opacity="0.35" transform="scale(0.7) translate(30, 20)" />

        {/* Stethoscope around neck */}
        <path d="M46 72 C 46 92, 84 92, 84 72" stroke="var(--pink)" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
        <circle cx="65" cy="90" r="4.5" fill="var(--pink)" />
        
        {/* Mascot Main Body */}
        <rect x="36" y="38" width="58" height="48" rx="22" fill="url(#mascotBodyGrad)" stroke="var(--pink-border)" strokeWidth="1.5" />
        
        {/* Face Screen */}
        <rect x="42" y="44" width="46" height="28" rx="12" fill="#6B4B57" />
        
        {/* Eyes (Happy arcs) */}
        <path d="M50 58 Q 54 53 58 58" stroke="#EFA3C8" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <path d="M72 58 Q 76 53 80 58" stroke="#EFA3C8" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        
        {/* Glowing Cheeks */}
        <circle cx="48" cy="64" r="2.5" fill="#D96C9D" opacity="0.65" />
        <circle cx="82" cy="64" r="2.5" fill="#D96C9D" opacity="0.65" />
        
        {/* Ribbon Emblem on Chest */}
        <path d="M62 76c1.2-1.2 2.5-1.2 3.7 0c1.2 1.2.4 2.4-.4 3.7l-3 3" stroke="#FFF" strokeWidth="1.5" strokeLinecap="round" opacity="0.95" />
        <path d="M68 76c-1.2-1.2-2.5-1.2-3.7 0c-1.2 1.2-.4 2.4.4 3.7l3 3" stroke="#FFF" strokeWidth="1.5" strokeLinecap="round" opacity="0.95" />

        {/* Head Antenna */}
        <line x1="65" y1="38" x2="65" y2="30" stroke="var(--pink)" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="65" cy="28" r="3.5" fill="var(--pink)" />
        
        {/* Ears */}
        <rect x="29" y="52" width="7" height="16" rx="3.5" fill="#EFA3C8" />
        <rect x="94" y="52" width="7" height="16" rx="3.5" fill="#EFA3C8" />

        <defs>
          <linearGradient id="mascotBodyGrad" x1="36" y1="38" x2="94" y2="86" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFFFFF" />
            <stop offset="0.6" stopColor="#FFF8FA" />
            <stop offset="1" stopColor="#F9E8EE" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

/**
 * Retrieves the SVG icon based on the icon name for the feature card.
 * @param {string} iconName - Key representing the icon.
 * 
 * يسترجع أيقونة SVG المناسبة بناءً على اسم الأيقونة لبطاقات الميزات.
 * @param {string} iconName - المفتاح المعرف للأيقونة.
 */
function getCardIcon(iconName) {
  switch (iconName) {
    case "symptoms":
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--pink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
      );
    case "awareness":
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--pink)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2c3.3 0 6 2.7 6 6c0 2-2 4-3.5 5.5L12 16.5M6 16.5l4.5-4.5M12 2C8.7 2 6 4.7 6 8c0 2 2 4 3.5 5.5"/>
          <path d="M7 21c2-3 4-4.5 5-4.5s3 1.5 5 4.5"/>
        </svg>
      );
    case "support":
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--pink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
      );
    case "prevention":
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--pink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
      );
    default:
      return null;
  }
}

/**
 * Retrieves the SVG icon for a quick suggested question chip by index.
 * @param {number} index - Index of the chip.
 * 
 * يسترجع أيقونة SVG المناسبة لبطاقة الاقتراحات السريعة بناءً على مؤشر البطاقة.
 * @param {number} index - مؤشر البطاقة.
 */
function getChipIcon(index) {
  switch (index) {
    case 0:
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginInlineEnd: 6 }}>
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
      );
    case 1:
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginInlineEnd: 6 }}>
          <path d="M4.5 16.5L16.5 4.5M10.5 4.5l9 9M13.5 7.5L16.5 10.5M7.5 13.5L10.5 16.5"/>
        </svg>
      );
    case 2:
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginInlineEnd: 6 }}>
          <path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/>
        </svg>
      );
    case 3:
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginInlineEnd: 6 }}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
      );
    default:
      return null;
  }
}

/**
 * Chat Component - Renders the main chat viewport, handles messages, file uploads, 
 * message deletion via context menus, feature cards, and includes an image lightbox.
 * 
 * مكون المحادثة - يعرض نافذة المحادثة الرئيسية، ويعالج الرسائل، ورفع الملفات، 
 * وحذف الرسائل من القوائم المنبثقة، وبطاقات الميزات التفاعلية، ويحتوي على عارض صور مكبّر.
 */
export default function Chat({
  user, messages, loading, onSend, onDeleteMessage,
  lang, onToggleLang, dark, onToggleDark, onToggleSidebar,
  gender, onSetGender, onNew,
}) {
  const [input,       setInput]       = useState("");
  const [contextMenu, setContextMenu] = useState(null);
  const [renderError, setRenderError] = useState(null);
  const [imageFile,   setImageFile]   = useState(null);
  const [lightboxImg, setLightboxImg] = useState(null); // Lightbox state for clicked images

  const endRef  = useRef(null);
  const fileRef = useRef(null);
  const taRef   = useRef(null);
  const msgsRef = useRef(null);

  const t      = translations[lang] ?? translations["ar"];
  const isAr   = lang === "ar";
  const isMale = gender === "male";

  const disclaimer       = isMale ? (t.disclaimerMale       || t.disclaimer)       : t.disclaimer;
  const inputPlaceholder = isMale ? (t.inputPlaceholderMale || t.inputPlaceholder) : t.inputPlaceholder;

  // Auto scroll to bottom when messages or loading state changes
  // تمرير تلقائي للأسفل عند تغير الرسائل أو حالة التحميل
  useEffect(() => {
    if (msgsRef.current) {
      msgsRef.current.scrollTo({
        top: msgsRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [messages, loading]);

  // Click outside to close context menu
  // النقر في الخارج لإغلاق قائمة الخيارات المنبثقة للرسائل
  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [contextMenu]);

  // Auto scale height of textarea based on line input
  // ملاءمة ارتفاع حقل الإدخال تلقائياً مع حجم النص المكتوب
  useEffect(() => {
    if (!taRef.current) return;
    taRef.current.style.height = "auto";
    taRef.current.style.height = Math.min(taRef.current.scrollHeight, 130) + "px";
  }, [input]);

  // Clear local input, file attachment, context menu, and lightbox preview when starting a new chat
  // تفريغ النص، والمرفق، والقائمة المنبثقة، ومعاينة الصورة عند بدء محادثة جديدة
  useEffect(() => {
    if (messages.length === 0) {
      setInput("");
      setImageFile(null);
      setContextMenu(null);
      setLightboxImg(null);
    }
  }, [messages]);

  /**
   * Reads an uploaded image file, generates a local URL for preview, and parses base64.
   * @param {object} e - Input change event.
   * 
   * يقرأ الصورة المرفقة، وينشئ رابطاً محلياً للمعاينة، ويستخلص تشفير base64.
   * @param {object} e - حدث تغيير حقل الإدخال.
   */
  async function handleImagePick(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImageFile({ file, preview: URL.createObjectURL(file), base64: reader.result.split(",")[1] });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  /**
   * Dispatches text and attachments to the parent message stream trigger.
   * @param {string} text - Input message query.
   * 
   * يرسل النص والمرفقات إلى دالة معالجة الرسائل الرئيسية.
   * @param {string} text - استفسار المستخدم.
   */
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

  /**
   * Opens custom context menu on right clicking user messages.
   * @param {object} e - ContextMenu event.
   * @param {object} msg - Target message model.
   * 
   * يفتح قائمة الخيارات عند النقر بزر الفأرة الأيمن على رسائل المستخدم.
   * @param {object} e - حدث القائمة المنبثقة.
   * @param {object} msg - كائن الرسالة المستهدفة.
   */
  function handleContextMenu(e, msg) {
    e.preventDefault();
    setContextMenu({ mouseX: e.clientX, mouseY: e.clientY, msgId: msg.id });
  }

  /**
   * Dispatches target deletion request via context menu selection.
   * 
   * يرسل طلب حذف الرسالة المحددة من القائمة المنبثقة.
   */
  function handleDeleteFromMenu() {
    if (contextMenu?.msgId) onDeleteMessage?.(contextMenu.msgId);
    setContextMenu(null);
  }

  /**
   * Catches Enter key to submit queries, ignoring it if Shift key is pressed.
   * @param {object} e - KeyDown event.
   * 
   * يلتقط زر Enter لإرسال النص، متجاهلاً الإرسال إذا كان زر Shift مضغوطاً.
   * @param {object} e - حدث الضغط على الأزرار.
   */
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
        <h2>⚠️ خطأ</h2>
        <button onClick={() => setRenderError(null)} style={{ marginTop: 20, padding: "8px 20px", cursor: "pointer" }}>إعادة المحاولة</button>
      </div>
    );
  }

  try {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }} dir={t.dir}>

        {/* ── Top bar ── */}
        {/* ── الشريط العلوي ── */}
        <div className="topbar">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button className="hamburger-btn" onClick={onToggleSidebar}>☰</button>
            {!empty && (
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                fontFamily: "var(--font)",
                fontWeight: 800,
                fontSize: 16,
                color: "var(--text)",
                letterSpacing: "-0.2px",
              }}>
                <BahiaLogo size={24} />
                MammoGuide
              </div>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              className="tbtn"
              onClick={() => { if (onNew) onNew(); else window.location.href = "/"; }}
              title={isAr ? "الرئيسية" : "Home"}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, width: 36, height: 36, padding: 0 }}
            >🏠</button>
            <button
              className="tbtn"
              onClick={onToggleLang}
              style={{ minWidth: 44 }}
              dir={isAr ? "ltr" : "rtl"}
              lang={isAr ? "en" : "ar"}
            >
              {isAr ? "EN" : "عربي"}
            </button>
            <button className="tbtn" onClick={onToggleDark}>{dark ? "☀️" : "🌙"}</button>
          </div>
        </div>

        {/* ── Scrollable messages ── */}
        {/* ── حاوية الرسائل القابلة للتمرير ── */}
        <div
          ref={msgsRef}
          className={`msgs ${empty ? "empty" : ""}`}
          style={{
            flex: 1,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            alignItems: empty ? "center" : undefined,
            justifyContent: empty ? "flex-start" : undefined,
          }}
        >
          {empty ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", maxWidth: 680, position: "relative" }}>
              {/* Background decorative patterns */}
              {/* نقوش وخلفيات تزيينية عائمة */}
              <div className="hero-bg-patterns">
                {/* Floating Heart */}
                <svg width="40" height="40" viewBox="0 0 24 24" className="pattern-svg svg-heart-1">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="var(--pink-light)" opacity="0.20" />
                </svg>
                {/* Floating Stethoscope outline */}
                <svg width="50" height="50" viewBox="0 0 24 24" className="pattern-svg svg-steth-1" stroke="var(--pink)" strokeWidth="1" fill="none" opacity="0.15">
                  <path d="M4.5 2C4.5 2 3 5 3 8C3 13 7 17 12 17C17 17 21 13 21 8C21 5 19.5 2 19.5 2"/>
                  <path d="M12 17V22M12 22H9M12 22H15"/>
                  <circle cx="12" cy="8" r="3"/>
                </svg>
                {/* Floating Pink Ribbon outline */}
                <svg width="60" height="60" viewBox="0 0 24 24" className="pattern-svg svg-ribbon-1" stroke="var(--pink)" strokeWidth="1" fill="none" opacity="0.18">
                  <path d="M17.657 16.657L13.414 12.414A4 4 0 1 0 10.586 12.414L6.343 16.657M12 2C15.314 2 18 4.686 18 8C18 10 16 12 14.5 13.5"/>
                </svg>
                {/* Floating Medical Cross */}
                <svg width="35" height="35" viewBox="0 0 24 24" className="pattern-svg svg-cross-1" fill="var(--pink-light)" opacity="0.18">
                  <path d="M19 10.5h-5.5V5h-3v5.5H5v3h5.5V19h3v-5.5H19z" />
                </svg>
              </div>

              {/* Logo Illustration */}
              {/* رسم الشعار والرمز التعريفي */}
              <div className="mascot-wrapper" style={{ animation: "none" }}>
                <BahiaLogo size={60} />
              </div>

              {/* Welcoming headline */}
              {/* عنوان الترحيب للمستخدم */}
              <div className="wlc-title">
                {t.welcomeTitle?.(firstName, gender) ?? `أهلاً، ${firstName}`}
              </div>

              {/* Short description - gender-aware logic fixed */}
              {/* وصف ترحيبي مبسط - تم إصلاح منطق مراعاة الجنس */}
              <div className="wlc-sub" style={{ whiteSpace: "pre-line", textAlign: "center" }}>
                {isMale ? (t.welcomeSubMale ?? t.welcomeSub) : t.welcomeSub}
              </div>

              {/* Grid of 4 feature cards - gender-aware translations */}
              {/* شبكة من 4 بطاقات ميزات - مع مراعاة الجنس */}
              <div className="feature-grid">
                {(isMale ? (t.featureCardsMale ?? t.featureCards) : t.featureCards ?? []).map((card, idx) => (
                  <div key={idx} className="feature-card" onClick={() => send(card.query)}>
                    <div className="feature-icon">
                      {getCardIcon(card.icon)}
                    </div>
                    <div className="feature-label">{card.label}</div>
                    <div className="feature-title">{card.title}</div>
                    <div className="feature-desc">{card.desc}</div>
                  </div>
                ))}
              </div>

              {/* Suggested Question Chips with icons */}
              {/* بطاقات الاقتراحات السريعة */}
              <div className="chips" style={{ marginTop: 24, width: "100%" }}>
                {(t.quickChips ?? []).map((c, idx) => (
                  <button key={c} className="chip" onClick={() => send(c)}>
                    {getChipIcon(idx)}
                    {c}
                  </button>
                ))}
              </div>

            </div>
          ) : (
            <>
              {/* Rendering list of messages */}
              {/* عرض قائمة الرسائل المتبادلة */}
              {safeMessages.map((m, i) => {
                const hasText  = m.text && m.text.trim();
                const hasImage = !!m.imagePreview;
                const isUser   = m.role !== "ai";

                return (
                  <div
                    key={m.id ?? i}
                    className={"mrow " + (isUser ? "user" : "ai")}
                    onContextMenu={isUser ? (e) => handleContextMenu(e, m) : undefined}
                  >
                    <div className={"mav " + (isUser ? "me" : "ai")}>
                      {isUser ? (user?.initials ?? "?") : <BahiaLogo size={20} />}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: isUser ? "flex-end" : "flex-start", maxWidth: "82%" }}>
                      {hasImage && (
                        <img
                          src={m.imagePreview}
                          alt=""
                          onClick={() => setLightboxImg(m.imagePreview)}
                          style={{
                            display: "block",
                            maxWidth: hasText ? 220 : 260,
                            maxHeight: hasText ? 180 : 220,
                            borderRadius: hasText ? 10 : 14,
                            marginBottom: hasText ? 8 : 0,
                            objectFit: "cover",
                            cursor: "pointer",
                            transition: "transform 0.2s",
                            ...(hasText ? {} : { border: "1.5px solid var(--border-md)" })
                          }}
                          className="clickable-chat-img"
                        />
                      )}
                      {hasText && (
                        <div
                          className={"bub " + (isUser ? "user" : "ai")}
                          dir={isArabic(m.text) ? "rtl" : "ltr"}
                          style={{ textAlign: isArabic(m.text) ? "right" : "left", maxWidth: "100%" }}
                        >
                          {isUser
                            ? (m.text ?? "")
                            : <ReactMarkdown>{m.text ?? ""}</ReactMarkdown>
                          }
                        </div>
                      )}
                      <div className="bmeta" style={{ textAlign: isUser ? "right" : "left", width: "100%" }}>{m.time ?? ""}</div>
                    </div>
                  </div>
                );
              })}

              {loading && (
                <div className="mrow ai">
                  <div className="mav ai">
                    <BahiaLogo size={20} />
                  </div>
                  <div className="tdots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              )}

              <div ref={endRef} />
            </>
          )}
        </div>

        {/* ── Input zone — always fixed at bottom ── */}
        {/* ── منطقة الإدخال — ثابتة دائماً في الأسفل ── */}
        <div className="input-zone">
          <div style={{ width: "100%", maxWidth: 680 }}>
            {/* Disclaimer card with shield icon - always fixed at bottom */}
            {/* بطاقة إخلاء المسؤولية الطبية - ثابتة دائماً في الأسفل */}
            <div className="disc" style={{ marginBottom: 8 }}>
              <div className="disc-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--pink)" strokeWidth="2.5">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <div style={{ flex: 1 }}>{disclaimer}</div>
            </div>

            {/* Image upload preview - styled for absolute alignment */}
            {/* معاينة الصورة المرفقة قبل الإرسال - متناسقة مع حقل الكتابة */}
            {imageFile && (
              <div className="image-preview-area">
                <img 
                  src={imageFile.preview} 
                  alt="" 
                  onClick={() => setLightboxImg(imageFile.preview)}
                  style={{ width: 52, height: 52, objectFit: "cover", borderRadius: 8, flexShrink: 0, cursor: "pointer" }} 
                />
                <span style={{ flex: 1, fontSize: 12, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {imageFile.file.name}
                </span>
                <button onClick={() => setImageFile(null)} style={{ background: "transparent", border: "none", color: "var(--danger)", fontSize: 18, cursor: "pointer", padding: "0 4px", lineHeight: 1 }}>✕</button>
              </div>
            )}

            {/* Redesigned input box with attachments */}
            {/* صندوق الإدخال التفاعلي مع خيارات المرفقات */}
            <div className="modern-input-box" style={{ flexDirection: isAr ? "row-reverse" : "row" }}>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImagePick} />

              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                {/* Image upload icon */}
                {/* زر إرفاق صورة */}
                <button className="ibtn" onClick={() => fileRef.current?.click()} title={isAr ? "إرفاق صورة" : "Attach image"} disabled={loading}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </button>
              </div>

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

              <button
                className="sbtn"
                onClick={() => send(input)}
                disabled={(!input.trim() && !imageFile) || loading}
              >
                {/* Arrow points right for LTR, left for RTL */}
                {isAr ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="19" y1="12" x2="5" y2="12"/>
                    <polyline points="11 18 5 12 11 6"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"/>
                    <polyline points="13 6 19 12 13 18"/>
                  </svg>
                )}
              </button>
            </div>

            {/* Privacy and security footer */}
            {/* تذييل الحفاظ على الخصوصية والأمان */}
            <div className="privacy-footer">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
              <span>{t.privacyNote}</span>
            </div>
          </div>
        </div>

        {/* ── Context Menu for Message deletion ── */}
        {/* ── القائمة المنبثقة لحذف الرسائل ── */}
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

        {/* ── Fullscreen Lightbox Overlay for Image Previews ── */}
        {/* ── نافذة عارض الصور المكبرة بكامل الشاشة ── */}
        {lightboxImg && (
          <div className="lightbox-overlay" onClick={() => setLightboxImg(null)}>
            <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
              <button className="lightbox-close" onClick={() => setLightboxImg(null)}>✕</button>
              <img src={lightboxImg} alt="Enlarged preview" className="lightbox-img" />
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