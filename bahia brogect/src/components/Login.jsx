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
        // ── Call FastAPI /api/login ──────────────────────────────
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

        // data = { access_token, refresh_token, user: { id, email } }
        onLogin({
          token:    data.access_token,
          email:    data.user.email,
          id:       data.user.id,
          name:     data.user.email.split("@")[0],
          initials: data.user.email[0].toUpperCase(),
          role:     t.role,
        });

      } else {
        // ── Validate form ────────────────────────────────────────
        if (!name.trim()) { setErr(t.nameMissing); return; }
        if (!email.trim()) { setErr(t.emailMissing || "أدخلي البريد الإلكتروني"); return; }
        if (!pass) { setErr(t.passMissing || "أدخلي كلمة المرور"); return; }

        // ── Call FastAPI /api/signup ─────────────────────────────
        const res = await fetch("http://127.0.0.1:8000/api/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim(), password: pass }),
        });
        const data = await res.json();

        if (!res.ok) {
          setErr(data.detail || t.signupErr);
          return;
        }

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
      {/* New Top Header Element */}
      <div style={{ position: "absolute", top: 20, left: 30, right: 30, display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 10, flexWrap: "wrap", gap: "15px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <div className="ll-logo" style={{ marginBottom: 0 }}><BahiaLogo size={30} />{t.appName}</div>
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
        {/* Left panel — branding */}
        <div className="ll">
          <div>
            <div className="ll-h">{t.loginHeroine}<br /><span>{t.loginHeroineSpan}</span></div>
            <div className="ll-s">{t.loginHeroSub}</div>
          </div>
          <div className="ll-tags">
            {t.loginTags.map(tag => <span key={tag} className="ll-tag">{tag}</span>)}
          </div>
        </div>

        {/* Right panel — form */}
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
            <button className="lbtn" type="submit">
              {isLogin ? t.loginBtn : t.signupBtn}
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