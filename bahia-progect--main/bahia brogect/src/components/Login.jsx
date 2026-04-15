import { useState } from "react";
import BahiaLogo from "./BahiaLogo";
import PasswordInput from "./PasswordInput";
import { getInitials } from "../constants";
import { translations } from "../i18n";

export default function Login({ onLogin, dark, onToggleDark, lang, onToggleLang }) {
  const [mode,    setMode]    = useState("login");
  const [name,    setName]    = useState("");
  const [email,   setEmail]   = useState("");
  const [pass,    setPass]    = useState("");
  const [err,     setErr]     = useState("");
  const [loading, setLoading] = useState(false);

  const t = translations[lang];

  function reset() { setName(""); setEmail(""); setPass(""); setErr(""); }
  function switchMode(m) { setMode(m); reset(); }

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);

    try {
      if (mode === "login") {
        const res = await fetch("http://127.0.0.1:8000/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim(), password: pass }),
        });
        const data = await res.json();

        if (!res.ok) {
          setErr(data.detail || t.loginErr);
          return;
        }

        // ✅ Load name: prefer localStorage (set during signup), then backend name if it's not email-derived
        const emailKey    = data.user.email.trim().toLowerCase();
        const savedName   = localStorage.getItem("bahia_name_" + emailKey);
        const backendName = data.user.name || "";
        // Check if backend returned a real name (not the email prefix or full email)
        const emailPrefix = emailKey.split("@")[0];
        const isRealName  = backendName && backendName !== emailPrefix && backendName !== emailKey && !backendName.includes("@");
        const displayName = savedName || (isRealName ? backendName : "");

        // If we still have no name, use email prefix as last resort but save nothing
        const finalName   = displayName || emailPrefix;

        // Always persist whatever we resolved so future logins are consistent
        if (displayName) localStorage.setItem("bahia_name_" + emailKey, displayName);

        onLogin({
          token:    data.access_token,
          email:    data.user.email,
          id:       data.user.id,
          name:     finalName,
          initials: finalName[0].toUpperCase(),
          role:     t.role,
        });

      } else {
        if (!name.trim()) { setErr(t.nameMissing); return; }
        if (!email.trim()) { setErr(t.emailMissing || "أدخلي البريد الإلكتروني"); return; }
        if (!pass) { setErr(t.passMissing || "أدخلي كلمة المرور"); return; }

        const res = await fetch("http://127.0.0.1:8000/api/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim(), password: pass, name: name.trim() }),
        });
        const data = await res.json();

        if (!res.ok) {
          setErr(data.detail || t.signupErr);
          return;
        }

        // ✅ Save name locally so login screen can show it
        localStorage.setItem("bahia_name_" + email.trim().toLowerCase(), name.trim());

        setErr("");
        setMode("login");
        setErr(lang === "ar"
          ? "✅ تم إنشاء الحساب! تحقق من بريدك الإلكتروني ثم سجّل دخولك."
          : "✅ Account created! Check your email then log in.");
      }
    } catch {
      setErr(lang === "ar"
        ? "❌ تعذر الاتصال بالخادم."
        : "❌ Could not reach the server. Is FastAPI running?");
    } finally {
      setLoading(false);
    }
  }

  const isLogin = mode === "login";

  return (
    <div className="lw" dir={t.dir}>
      <div style={{ position: "absolute", top: 20, left: 30, right: 30, display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 10, flexWrap: "wrap", gap: "15px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          {/* ✅ Logo click → home */}
          <div
            className="ll-logo"
            style={{ marginBottom: 0, cursor: "pointer" }}
            onClick={() => window.location.href = '/'}
          >
            <BahiaLogo size={30} />{t.appName}
          </div>
          <button className="tbtn" onClick={() => window.location.href = '/'}>
            🏠 {lang === 'ar' ? 'الرئيسية' : 'Back to Home'}
          </button>
        </div>
        <div style={{ display:"flex", gap: 6 }}>
          <button className="tbtn" onClick={onToggleLang}>{lang === "ar" ? "EN" : "ع"}</button>
          <button className="tbtn" onClick={onToggleDark}>{dark ? "☀️" : "🌙"}</button>
        </div>
      </div>

      <div className="lcard" style={{ flexDirection: lang === "ar" ? "row" : "row-reverse", marginTop: "40px" }}>
        <div className="ll">
          <div>
            <div className="ll-h">{t.loginHeroine}<br /><span>{t.loginHeroineSpan}</span></div>
            <div className="ll-s">{t.loginHeroSub}</div>
          </div>
          <div className="ll-tags">
            {t.loginTags.map(tag => <span key={tag} className="ll-tag">{tag}</span>)}
          </div>
        </div>

        <div className="lr">
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24 }}>
            <div>
              <div className="lr-t">{isLogin ? t.loginWelcomeBack : t.loginWelcomeNew}</div>
              <div className="lr-s">{isLogin ? t.loginSub : t.loginSubNew}</div>
            </div>
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
                placeholder="example@email.com"
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
                placeholder="••••••••"
                autoComplete={isLogin ? "current-password" : "new-password"}
                className="fld-input"
              />
            </div>
            {err && <div className="lerr">{err}</div>}
            <button className="lbtn" type="submit" disabled={loading}>
              {loading ? "..." : (isLogin ? t.loginBtn : t.signupBtn)}
            </button>
          </form>

          <div className="lhint" style={{ marginTop:18 }}>
            {isLogin ? t.switchToSignup : t.switchToLogin}{" "}
            <span
              style={{ color:"var(--pink)", cursor:"pointer", fontWeight:600 }}
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