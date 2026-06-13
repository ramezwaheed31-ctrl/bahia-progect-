import { useState, useEffect } from "react";
import BahiaLogo from "./BahiaLogo";
import PasswordInput from "./PasswordInput";
import { API_BASE_URL } from "../api";
import { translations } from "../i18n";

// ── Splash screen shown first ─────────────────────────────────────
// ── شاشة الترحيب والتحميل الأولية ─────────────────────────────────────
/**
 * SplashScreen Component - Shows a 3.5s loading animation with branding and app tagline.
 * 
 * مكون شاشة التحميل - يعرض واجهة التحميل لمدة 3.5 ثانية مع الشعار والعبارة الترويجية للتطبيق.
 */
export function SplashScreen({ onDone, lang }) {
  const t = translations[lang] ?? translations["ar"];
  useEffect(() => {
    const timer = setTimeout(onDone, 3500);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div className="splash-overlay">
      <div className="splash-logo-wrap">
        <div className="splash-logo-ring" />
        <div className="splash-logo-inner">
          <BahiaLogo size={52} />
        </div>
      </div>
      <div className="splash-name">MammoGuide</div>
      <div className="splash-tagline">{t.tagline}</div>
    </div>
  );
}

/**
 * Login Component - Renders the unified login/signup form, performs input validation,
 * handles submission to FastAPI authentication routes, and transitions back to the main app layout.
 * Uses strictly gender-neutral language at this stage since user gender is not yet determined.
 * 
 * مكون تسجيل الدخول - يعرض نموذج الدخول والتسجيل الموحد، ويتحقق من صحة المدخلات،
 * ويعالج الإرسال إلى مسارات المصادقة بالخلفية، وينتقل للواجهة الرئيسية.
 * يستخدم لغة محايدة تماماً للجنسين في هذه المرحلة لعدم تحديد جنس المستخدم بعد.
 */
export default function Login({ onLogin, dark, onToggleDark, lang, onToggleLang }) {
  const [splash, setSplash] = useState(true);
  const [visible, setVisible] = useState(false);   // form fade-in
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [gender, setGender] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const t = translations[lang];
  const isAr = lang === "ar";

  /**
   * Transition callback when SplashScreen timer completes.
   * 
   * دالة الانتقال بعد انتهاء وقت شاشة التحميل.
   */
  function handleSplashDone() {
    setSplash(false);
    // Slight delay so DOM mounts before transition
    setTimeout(() => setVisible(true), 60);
  }

  /**
   * Resets all input fields and clear errors.
   * 
   * تعيد تهيئة جميع حقول الإدخال وتفرغ الأخطاء.
   */
  function reset() { setName(""); setEmail(""); setPass(""); setErr(""); setGender(null); }

  /**
   * Switches form between Login and Signup modes.
   * @param {string} m - Target mode ('login' or 'signup').
   * 
   * تبدل النموذج بين وضعي تسجيل الدخول وإنشاء الحساب.
   * @param {string} m - الوضع المستهدف ('login' أو 'signup').
   */
  function switchMode(m) { setMode(m); reset(); }

  /**
   * Performs client-side validations and dispatches authentication payload to the API server.
   * @param {object} e - Submit event.
   * 
   * يقوم بالتحقق من المدخلات برمجياً ويرسل بيانات المصادقة إلى خادم الويب.
   * @param {object} e - حدث إرسال النموذج.
   */
  async function submit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);

    try {
      const emailTypos = ["gmial.com", "gamil.com", "gmaill.com", "gnail.com", "gmal.com", "gmai.com", "yaho.com", "yahooo.com", "yhoo.com"];
      const emailVal = email.trim().toLowerCase();

      // Basic email domain constraint (Gmail & Yahoo)
      // قيود أساسية لنطاق البريد الإلكتروني (Gmail و Yahoo)
      if (!emailVal.endsWith("@gmail.com") && !emailVal.endsWith("@yahoo.com")) {
        if (emailTypos.some(typo => emailVal.endsWith("@" + typo))) {
          setErr(isAr
            ? "⚠️ يبدو أن هناك خطأ إملائي في البريد (مثلاً: gmail.com أو yahoo.com)"
            : "⚠️ Possible email typo detected (e.g., gmail.com or yahoo.com)");
        } else {
          setErr(isAr ? "عنوان بريد إلكتروني غير صالح (يجب أن ينتهي بـ @gmail.com أو @yahoo.com)" : "Invalid email address (must end with @gmail.com or @yahoo.com)");
        }
        return;
      }

      // Password checks (min length 8, contains letters and numbers)
      // فحوصات كلمة المرور (الطول لا يقل عن 8، ويحتوي على حروف وأرقام)
      if (pass.length < 8) {
        setErr(isAr ? "❌ كلمة المرور يجب أن تكون 8 أحرف على الأقل." : "❌ Password must be at least 8 characters.");
        return;
      }
      if (!/[a-zA-Z\u0600-\u06FF]/.test(pass) || !/[0-9]/.test(pass)) {
        setErr(isAr ? "❌ يجب أن تحتوي كلمة المرور على حروف وأرقام معاً." : "❌ Password must contain both letters and numbers.");
        return;
      }

      if (mode === "login") {
        // Send request to FastAPI login route
        // إرسال الطلب إلى مسار تسجيل الدخول بالخلفية
        const res = await fetch(`${API_BASE_URL}/api/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim(), password: pass }),
        });
        const data = await res.json();
        if (!res.ok) {
          setErr(res.status === 401 ? t.loginErr : (data.detail || t.loginErr));
          return;
        }

        const emailKey = data.user.email.trim().toLowerCase();
        const serverName = (data.user.full_name || "").trim();
        const savedName = (localStorage.getItem("bahia_name_" + emailKey) || "").trim();
        const finalName = serverName || savedName;

        if (!finalName) {
          setErr(isAr
            ? "⚠️ لم يتم العثور على اسم. يرجى التواصل مع الدعم."
            : "⚠️ No name found. Please contact support.");
          return;
        }
        if (serverName) localStorage.setItem("bahia_name_" + emailKey, serverName);

        // Propagate login event with token and user details to parent state
        // نقل حدث تسجيل الدخول مع الرمز التعريفي وبيانات المستخدم إلى حالة الأب
        onLogin({
          token: data.access_token,
          email: data.user.email,
          id: data.user.id,
          name: finalName,
          initials: finalName[0].toUpperCase(),
          role: t.role,
        });

      } else {
        // Validation for Signup fields
        // التحقق من صحة حقول إنشاء الحساب
        if (!name.trim()) { setErr(t.nameMissing); return; }
        if (!email.trim()) { setErr(t.emailMissing || "يُرجى إدخال البريد الإلكتروني"); return; }
        const emailTypos = ["gmial.com", "gamil.com", "gmaill.com", "gnail.com", "gmal.com", "gmai.com", "yaho.com", "yahooo.com", "yhoo.com"];
        const emailVal = email.trim().toLowerCase();

        if (!emailVal.endsWith("@gmail.com") && !emailVal.endsWith("@yahoo.com")) {
          if (emailTypos.some(typo => emailVal.endsWith("@" + typo))) {
            setErr(isAr
              ? "⚠️ يبدو أن هناك خطأ إملائي في البريد (مثلاً: gmail.com أو yahoo.com)"
              : "⚠️ Possible email typo detected (e.g., gmail.com or yahoo.com)");
          } else {
            setErr(isAr ? "عنوان بريد إلكتروني غير صالح (يجب أن ينتهي بـ @gmail.com أو @yahoo.com)" : "Invalid email address (must end with @gmail.com or @yahoo.com)");
          }
          return;
        }
        if (!pass) { setErr(t.passMissing || (isAr ? "يُرجى إدخال كلمة المرور" : "Please enter your password")); return; }
        if (pass.length < 8) { setErr(isAr ? "❌ كلمة المرور يجب أن تكون 8 أحرف على الأقل." : "❌ Password must be at least 8 characters."); return; }
        if (!/[a-zA-Z\u0600-\u06FF]/.test(pass) || !/[0-9]/.test(pass)) { setErr(isAr ? "❌ يجب أن تحتوي كلمة المرور على حروف وأرقام معاً." : "❌ Password must contain both letters and numbers."); return; }
        if (!gender) { setErr(isAr ? "يُرجى اختيار الجنس" : "Please select your gender"); return; }

        // Send request to FastAPI signup route
        // إرسال الطلب إلى مسار التسجيل بالخلفية
        const res = await fetch(`${API_BASE_URL}/api/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim(), password: pass, name: name.trim() }),
        });
        const data = await res.json();
        if (!res.ok) { setErr(data.detail || t.signupErr); return; }

        // Store gender and name details in localStorage locally
        // حفظ بيانات الاسم والجنس في التخزين المحلي للمتصفح
        localStorage.setItem("bahia_name_" + email.trim().toLowerCase(), name.trim());
        localStorage.setItem("cg_gender_" + email.trim().toLowerCase(), JSON.stringify(gender));
        setMode("login");
        setErr(isAr
          ? "✅ تم إنشاء الحساب! يُرجى التحقق من البريد الإلكتروني ثم تسجيل الدخول."
          : "✅ Account created! Please check your email then log in.");
      }
    } catch {
      setErr(isAr ? "❌ تعذر الاتصال بالخادم." : "❌ Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }

  const isLogin = mode === "login";

  if (splash) return <SplashScreen onDone={handleSplashDone} lang={lang} />;

  return (
    <div className={"lw login-fadein" + (visible ? " login-fadein--in" : "")} dir={t.dir}>
      <div className="login-dots" />
      <div className="login-blob login-blob-1" />
      <div className="login-blob login-blob-2" />
      <div className="login-blob login-blob-3" />

      {/* Top nav — lang + dark */}
      <div style={{
        position: "absolute", top: 20, left: 30, right: 30,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        zIndex: 20, flexWrap: "wrap", gap: 12,
      }}>
        {/* Logo icon only — no text, acts as home button */}
        <div
          className="ll-logo"
          style={{ marginBottom: 0, cursor: "pointer" }}
          onClick={() => window.location.href = "/"}
          title={isAr ? "الرئيسية" : "Home"}
        >
          <BahiaLogo size={28} />
        </div>
        {/* Controls */}
        <div style={{ display: "flex", gap: 6 }}>
          <button
            className="tbtn"
            onClick={onToggleLang}
            dir={isAr ? "ltr" : "rtl"}
            lang={isAr ? "en" : "ar"}
            style={{ minWidth: 44 }}
          >{isAr ? "EN" : "عربي"}</button>
          <button className="tbtn" onClick={onToggleDark}>{dark ? "☀️" : "🌙"}</button>
        </div>
      </div>

      {/* Main card */}
      <div className="lcard" style={{ flexDirection: isAr ? "row" : "row-reverse", marginTop: 40 }}>

        {/* ── Hero panel ── */}
        <div className="ll" style={{ justifyContent: "flex-start", padding: "40px 36px" }}>
          {/* Brand logo + name at top of hero */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <BahiaLogo size={36} />
            <span style={{ fontSize: 19, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.3px" }}>MammoGuide</span>
          </div>
          {/* Dynamic tagline (AI assistant) */}
          <div style={{ fontSize: 13, color: "var(--pink)", fontWeight: 600, marginBottom: 40, letterSpacing: "0.01em" }}>
            {t.tagline}
          </div>

          {/* Main heading ("Your companion") */}
          <div className="ll-hero" style={{ marginTop: 10 }}>
            <div className="ll-h" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>{t.loginHeroine}</div>
              <div>
                <span>{t.loginHeroineSpan}</span>
              </div>
            </div>
            <div className="ll-s">{t.loginHeroSub}</div>
          </div>

        </div>

        {/* ── Form panel ── */}
        <div className="lr">
          <div style={{ marginBottom: 16, marginTop: isLogin ? 0 : "100px" }}>
            <div className="lr-t">{isLogin ? t.loginWelcomeBack : t.loginWelcomeNew}</div>
            <div className="lr-s">{isLogin ? t.loginSub : t.loginSubNew}</div>
          </div>

          <form onSubmit={submit}>
            {!isLogin && (
              <div className="fld">
                <label>{t.nameLabel}</label>
                <input
                  type="text"
                  placeholder={t.namePlaceholder}
                  value={name}
                  autoComplete="name"
                  onChange={e => { setName(e.target.value); setErr(""); }}
                />
              </div>
            )}

            <div className="fld">
              <label>{t.emailLabel}</label>
              <input
                type="email"
                placeholder={t.emailPlaceholder || ""}
                value={email}
                autoComplete={isLogin ? "email" : "new-email"}
                onChange={e => { setEmail(e.target.value); setErr(""); }}
              />
            </div>

            <div className="fld">
              <label>{t.passLabel}</label>
              <PasswordInput
                value={pass}
                onChange={e => { setPass(e.target.value); setErr(""); }}
                placeholder={isLogin ? "" : (isAr ? "يُرجى إدخال كلمة مرور قوية" : "Enter a strong password")}
                autoComplete={isLogin ? "current-password" : "new-password"}
                className="fld-input"
              />
              {!isLogin && (
                <div style={{
                  fontSize: 11, color: "var(--text-muted)", marginTop: 5,
                  display: "flex", alignItems: "center", gap: 5, opacity: 0.8,
                }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0 }}>
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {t.passHint || (isAr ? "٨ أحرف على الأقل، تشمل حروفاً وأرقاماً" : "At least 8 characters with letters and numbers")}
                </div>
              )}
            </div>

            {/* Gender — only on signup */}
            {!isLogin && (
              <div className="fld">
                <label>{isAr ? "الجنس" : "Gender"}</label>
                <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                  {[
                    { val: "female", icon: "👩", ar: "أنثى", en: "Female" },
                    { val: "male", icon: "👨", ar: "ذكر", en: "Male" },
                  ].map(opt => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => { setGender(opt.val); setErr(""); }}
                      style={{
                        flex: 1, padding: "10px 8px",
                        border: `1.5px solid ${gender === opt.val ? "var(--pink)" : "var(--border)"}`,
                        borderRadius: 12,
                        background: gender === opt.val ? "var(--pink-dim)" : "var(--surface)",
                        color: gender === opt.val ? "var(--pink)" : "var(--text-muted)",
                        fontFamily: "var(--font)", fontSize: 13, fontWeight: 700,
                        cursor: "pointer", transition: ".18s",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      }}
                    >
                      <span style={{ fontSize: 18 }}>{opt.icon}</span>
                      {isAr ? opt.ar : opt.en}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {err && <div className="lerr">{err}</div>}

            <button className="lbtn" type="submit" disabled={loading}>
              {loading ? "..." : (isLogin ? t.loginBtn : t.signupBtn)}
            </button>
          </form>

          <div className="lhint" style={{ marginTop: 20 }}>
            {isLogin ? t.switchToSignup : t.switchToLogin}{" "}
            <span
              style={{ color: "var(--pink)", cursor: "pointer", fontWeight: 700 }}
              onClick={() => switchMode(isLogin ? "signup" : "login")}
            >
              {isLogin ? t.switchToSignupLink : t.switchToLoginLink}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}