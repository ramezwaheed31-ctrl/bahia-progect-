import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import BahiaLogo from "./BahiaLogo";
import { groupBy } from "../constants";
import { translations } from "../i18n";

// ── Account Modal ──────────────────────────────────────────────────
function AccountModal({ user, lang, onClose, onUpdateName, token }) {
  const isAr = lang === "ar";
  const [tab,        setTab]        = useState("profile"); // "profile" | "password"
  const [editName,   setEditName]   = useState(false);
  const [nameVal,    setNameVal]    = useState(user.name || "");
  const [oldPass,    setOldPass]    = useState("");
  const [newPass,    setNewPass]    = useState("");
  const [confirmP,   setConfirmP]   = useState("");
  const [msg,        setMsg]        = useState("");
  const [err,        setErr]        = useState("");
  const [saving,     setSaving]     = useState(false);
  const [showOld,    setShowOld]    = useState(false);
  const [showNew,    setShowNew]    = useState(false);
  const [showConf,   setShowConf]   = useState(false);

  function saveName() {
    if (!nameVal.trim()) return;
    // Save to localStorage
    localStorage.setItem("bahia_name_" + user.email.toLowerCase(), nameVal.trim());
    onUpdateName?.(nameVal.trim());
    setEditName(false);
    setMsg(isAr ? "✅ تم تحديث الاسم" : "✅ Name updated");
    setTimeout(() => setMsg(""), 2500);
  }

  async function changePassword() {
    setErr(""); setMsg("");
    if (!oldPass || !newPass || !confirmP) { setErr(isAr ? "يرجى ملء جميع الحقول" : "Fill all fields"); return; }
    if (newPass !== confirmP) { setErr(isAr ? "كلمتا المرور غير متطابقتين" : "Passwords don't match"); return; }
    if (newPass.length < 6)   { setErr(isAr ? "كلمة المرور قصيرة جداً (6 أحرف على الأقل)" : "Password too short (min 6 chars)"); return; }
    if (newPass === oldPass)   { setErr(isAr ? "كلمة المرور الجديدة مطابقة للقديمة" : "New password must differ from old"); return; }
    setSaving(true);
    const activeToken = token || localStorage.getItem("bahia_token");
    if (!activeToken) { setErr(isAr ? "❌ انتهت الجلسة، سجّل دخولك مجدداً" : "❌ Session expired, log in again"); setSaving(false); return; }
    try {
      const res = await fetch("http://127.0.0.1:8000/api/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${activeToken}` },
        body: JSON.stringify({ old_password: oldPass, new_password: newPass }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.detail || (isAr ? "فشل التغيير — تأكد من كلمة المرور الحالية" : "Failed — check your current password")); return; }
      setMsg(isAr ? "✅ تم تغيير كلمة المرور بنجاح" : "✅ Password changed successfully");
      setOldPass(""); setNewPass(""); setConfirmP("");
    } catch {
      setErr(isAr ? "❌ تعذر الاتصال بالخادم" : "❌ Server error — is FastAPI running?");
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = {
    width: "100%", padding: "9px 12px", background: "var(--surface)",
    border: "1px solid var(--border)", borderRadius: 8,
    fontFamily: "var(--font)", fontSize: 13, color: "var(--text)",
    outline: "none", direction: "ltr", textAlign: "left", marginTop: 5,
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={onClose}
    >
      <div
        style={{ background: "var(--warm)", border: "1px solid var(--border)", borderRadius: 20, width: 380, maxWidth: "92vw", boxShadow: "0 8px 40px rgba(0,0,0,0.22)", overflow: "hidden" }}
        onClick={e => e.stopPropagation()}
        dir={isAr ? "rtl" : "ltr"}
      >
        {/* ── Header ── */}
        <div style={{ padding: "28px 28px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <div style={{ width: 68, height: 68, borderRadius: "50%", background: "var(--pink-dim)", border: "2px solid var(--pink-border)", color: "var(--pink)", fontSize: 28, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {user.initials}
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontWeight: 700, fontSize: 17, color: "var(--text)" }}>{user.name}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3, direction: "ltr" }}>{user.email}</div>
          </div>
          {/* Tabs */}
          <div style={{ display: "flex", gap: 0, marginTop: 12, width: "100%", borderBottom: "1px solid var(--border)" }}>
            {[["profile", isAr ? "الملف الشخصي" : "Profile"], ["password", isAr ? "كلمة المرور" : "Password"]].map(([id, label]) => (
              <button key={id} onClick={() => { setTab(id); setErr(""); setMsg(""); }}
                style={{ flex: 1, padding: "9px 0", background: "transparent", border: "none", borderBottom: tab === id ? "2px solid var(--pink)" : "2px solid transparent", color: tab === id ? "var(--pink)" : "var(--text-muted)", fontWeight: tab === id ? 700 : 500, fontSize: 13, cursor: "pointer", fontFamily: "var(--font)", marginBottom: -1 }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Tab Content ── */}
        <div style={{ padding: "20px 28px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
          {tab === "profile" && (
            <>
              <div>
                <div style={{ fontSize: 11, color: "var(--text-dim)", marginBottom: 2, textTransform: "uppercase", letterSpacing: ".05em" }}>{isAr ? "الاسم" : "Name"}</div>
                {editName ? (
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <input value={nameVal} onChange={e => setNameVal(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
                    <button onClick={saveName} style={{ padding: "9px 14px", background: "var(--pink)", border: "none", borderRadius: 8, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "var(--font)" }}>
                      {isAr ? "حفظ" : "Save"}
                    </button>
                    <button onClick={() => { setEditName(false); setNameVal(user.name); }} style={{ padding: "9px 10px", background: "transparent", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-muted)", fontSize: 13, cursor: "pointer", fontFamily: "var(--font)" }}>✕</button>
                  </div>
                ) : (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 12px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8 }}>
                    <span style={{ fontSize: 14, color: "var(--text)" }}>{user.name}</span>
                    <button onClick={() => setEditName(true)} style={{ background: "transparent", border: "none", color: "var(--pink)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font)" }}>
                      {isAr ? "تعديل" : "Edit"}
                    </button>
                  </div>
                )}
              </div>
              <div>
                <div style={{ fontSize: 11, color: "var(--text-dim)", marginBottom: 2, textTransform: "uppercase", letterSpacing: ".05em" }}>{isAr ? "البريد الإلكتروني" : "Email"}</div>
                <div style={{ padding: "9px 12px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 14, color: "var(--text-muted)", direction: "ltr" }}>{user.email}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "var(--text-dim)", marginBottom: 2, textTransform: "uppercase", letterSpacing: ".05em" }}>{isAr ? "الدور" : "Role"}</div>
                <div style={{ padding: "9px 12px", background: "var(--pink-dim)", border: "1px solid var(--pink-border)", borderRadius: 8, fontSize: 13, color: "var(--pink)", fontWeight: 600 }}>{user.role}</div>
              </div>
            </>
          )}

          {tab === "password" && (
            <>
              {[
                [isAr ? "كلمة المرور الحالية" : "Current Password", oldPass, setOldPass, showOld, setShowOld],
                [isAr ? "كلمة المرور الجديدة" : "New Password",     newPass, setNewPass, showNew, setShowNew],
                [isAr ? "تأكيد كلمة المرور"   : "Confirm Password", confirmP, setConfirmP, showConf, setShowConf],
              ].map(([label, val, setter, show, setShow]) => (
                <div key={label}>
                  <div style={{ fontSize: 11, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 4 }}>{label}</div>
                  <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <input
                      type={show ? "text" : "password"}
                      value={val}
                      onChange={e => setter(e.target.value)}
                      style={{ ...inputStyle, paddingRight: 38 }}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShow(s => !s)}
                      style={{ position: "absolute", right: 10, background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", alignItems: "center", padding: 0 }}
                    >
                      {show ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              ))}
              <button onClick={changePassword} disabled={saving}
                style={{ width: "100%", padding: "11px 0", marginTop: 4, background: "var(--pink)", border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "var(--font)", opacity: saving ? 0.6 : 1 }}>
                {saving ? (isAr ? "جاري الحفظ..." : "Saving...") : (isAr ? "تغيير كلمة المرور" : "Change Password")}
              </button>
            </>
          )}

          {msg && <div style={{ fontSize: 12, color: "#2a9d5c", textAlign: "center" }}>{msg}</div>}
          {err && <div style={{ fontSize: 12, color: "var(--danger)", textAlign: "center" }}>{err}</div>}

          <button onClick={onClose} style={{ width: "100%", padding: "10px 0", background: "transparent", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text-muted)", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "var(--font)", marginTop: 4 }}>
            {isAr ? "إغلاق" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Dashboard View ─────────────────────────────────────────────────
function DashboardView({ history, lang, onClose }) {
  const isAr = lang === "ar";
  const total = history.length;
  const today = history.filter(h => h.date === (isAr ? "اليوم" : "Today")).length;

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
      zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center"
    }} onClick={onClose}>
      <div style={{
        background: "var(--warm)", border: "1px solid var(--border)",
        borderRadius: 18, padding: "36px 32px", width: 380, maxWidth: "90vw",
        boxShadow: "0 8px 32px rgba(0,0,0,0.18)"
      }} onClick={e => e.stopPropagation()} dir={isAr ? "rtl" : "ltr"}>
        <div style={{ fontWeight: 700, fontSize: 20, color: "var(--text)", marginBottom: 22, display: "flex", alignItems: "center", gap: 10 }}>
          📊 {isAr ? "لوحة القيادة" : "Dashboard"}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
          {[
            { label: isAr ? "إجمالي المحادثات" : "Total Chats", value: total, icon: "💬" },
            { label: isAr ? "محادثات اليوم" : "Today's Chats", value: today, icon: "📅" },
          ].map(card => (
            <div key={card.label} style={{
              background: "var(--surface)", border: "1px solid var(--border)",
              borderRadius: 12, padding: "18px 16px", textAlign: "center"
            }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{card.icon}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: "var(--pink)" }}>{card.value}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>{card.label}</div>
            </div>
          ))}
        </div>

        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
          <div style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 10 }}>
            {isAr ? "آخر المحادثات" : "Recent Chats"}
          </div>
          {history.slice(0, 3).map(h => (
            <div key={h.id} style={{
              padding: "8px 12px", borderRadius: 8, background: "var(--surface)",
              marginBottom: 6, fontSize: 13, color: "var(--text)",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
            }}>
              ◈ {h.title}
            </div>
          ))}
          {history.length === 0 && (
            <div style={{ fontSize: 13, color: "var(--text-dim)", textAlign: "center", padding: "12px 0" }}>
              {isAr ? "لا توجد محادثات بعد" : "No chats yet"}
            </div>
          )}
        </div>

        <button onClick={onClose} style={{
          marginTop: 20, width: "100%", padding: "10px 0",
          background: "var(--pink-dim)", border: "1px solid var(--pink-border)",
          borderRadius: 10, color: "var(--pink)", fontWeight: 600,
          fontSize: 14, cursor: "pointer", fontFamily: "var(--font)"
        }}>
          {isAr ? "إغلاق" : "Close"}
        </button>
      </div>
    </div>
  );
}

// ── Settings View ──────────────────────────────────────────────────
function SettingsView({ lang, dark, onToggleDark, onToggleLang, onClose }) {
  const isAr = lang === "ar";
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
      zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center"
    }} onClick={onClose}>
      <div style={{
        background: "var(--warm)", border: "1px solid var(--border)",
        borderRadius: 18, padding: "36px 32px", width: 360, maxWidth: "90vw",
        boxShadow: "0 8px 32px rgba(0,0,0,0.18)"
      }} onClick={e => e.stopPropagation()} dir={isAr ? "rtl" : "ltr"}>
        <div style={{ fontWeight: 700, fontSize: 20, color: "var(--text)", marginBottom: 24, display: "flex", alignItems: "center", gap: 10 }}>
          ⚙️ {isAr ? "الإعدادات" : "Settings"}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Dark Mode */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "14px 16px", background: "var(--surface)",
            border: "1px solid var(--border)", borderRadius: 12
          }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>
                {isAr ? "الوضع الليلي" : "Dark Mode"}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                {dark ? (isAr ? "مفعّل" : "Enabled") : (isAr ? "معطّل" : "Disabled")}
              </div>
            </div>
            <button
              onClick={onToggleDark}
              style={{
                padding: "7px 18px", borderRadius: 20,
                background: dark ? "var(--pink-dim)" : "var(--surface)",
                border: "1px solid var(--pink-border)",
                color: "var(--pink)", cursor: "pointer", fontWeight: 600,
                fontSize: 13, fontFamily: "var(--font)"
              }}
            >
              {dark ? "☀️" : "🌙"}
            </button>
          </div>

          {/* Language */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "14px 16px", background: "var(--surface)",
            border: "1px solid var(--border)", borderRadius: 12
          }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>
                {isAr ? "اللغة" : "Language"}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                {lang === "ar" ? "العربية" : "English"}
              </div>
            </div>
            <button
              onClick={onToggleLang}
              style={{
                padding: "7px 18px", borderRadius: 20,
                background: "var(--pink-dim)", border: "1px solid var(--pink-border)",
                color: "var(--pink)", cursor: "pointer", fontWeight: 600,
                fontSize: 13, fontFamily: "var(--font)"
              }}
            >
              {lang === "ar" ? "EN" : "ع"}
            </button>
          </div>
        </div>

        <button onClick={onClose} style={{
          marginTop: 24, width: "100%", padding: "10px 0",
          background: "var(--pink-dim)", border: "1px solid var(--pink-border)",
          borderRadius: 10, color: "var(--pink)", fontWeight: 600,
          fontSize: 14, cursor: "pointer", fontFamily: "var(--font)"
        }}>
          {isAr ? "إغلاق" : "Close"}
        </button>
      </div>
    </div>
  );
}

// ── Main Sidebar ───────────────────────────────────────────────────
export default function Sidebar({
  user, history, activeId, onSelect, onNew, onLogout,
  dark, onToggleDark, lang, onToggleLang, open,
  onDeleteConv, onDeleteAllHistory, onUpdateName, token,
}) {
  const t = translations[lang];
  const groups = groupBy(history, "date");
  const isAr = lang === "ar";

  const [showAccount,   setShowAccount]   = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showSettings,  setShowSettings]  = useState(false);
  const [confirmAll,    setConfirmAll]    = useState(false);

  function handleDeleteAll() {
    if (confirmAll) {
      onDeleteAllHistory?.();
      setConfirmAll(false);
    } else {
      setConfirmAll(true);
      setTimeout(() => setConfirmAll(false), 3000);
    }
  }

  return (
    <>
      <div className={"sb" + (open ? "" : " hidden")} dir={t.dir}>
        <div className="sb-top">
          {/* ✅ Logo click → home */}
          <div
            className="sb-logo"
            style={{ cursor: "pointer" }}
            onClick={() => window.location.href = '/'}
            title={isAr ? "الرئيسية" : "Go to Home"}
          >
            <BahiaLogo size={28} />
            {t.appName}
          </div>

          <button className="home-btn" onClick={() => window.location.href = '/'}>
            <span>🏠</span> {isAr ? "الرئيسية" : "Home"}
          </button>
          <button className="new-btn" onClick={onNew}>{t.newChat}</button>
        </div>

        <div className="sb-scroll">
          <div style={{ height: "8px" }} />

          {/* History with delete buttons */}
          {Object.entries(groups).map(([date, items]) => (
            <div key={date}>
              <div className="sb-grp">{date}</div>
              {items.map(item => (
                <div
                  key={item.id}
                  className={"sb-item" + (activeId === item.id ? " active" : "")}
                  style={{ position: "relative" }}
                  onClick={() => onSelect(item)}
                >
                  <div className="sb-dot">◈</div>
                  <div className="sb-body">
                    <div className="sb-title">{item.title}</div>
                    <div className="sb-prev">{item.preview}</div>
                  </div>
                  {/* ✅ Delete single conversation */}
                  <button
                    className="sb-del-btn"
                    title={isAr ? "حذف" : "Delete"}
                    onClick={e => {
                      e.stopPropagation();
                      onDeleteConv?.(item.id);
                    }}
                  >
                    🗑
                  </button>
                </div>
              ))}
            </div>
          ))}

          {/* ✅ Delete all history */}
          {history.length > 0 && (
            <div style={{ padding: "10px 18px" }}>
              <button
                onClick={handleDeleteAll}
                style={{
                  width: "100%", padding: "8px 0",
                  background: confirmAll ? "rgba(192,80,112,0.12)" : "transparent",
                  border: "1px solid rgba(192,80,112,0.3)",
                  borderRadius: 8, color: "var(--danger)",
                  fontSize: 12, fontWeight: 600, cursor: "pointer",
                  fontFamily: "var(--font)", transition: "0.2s"
                }}
              >
                🗑 {confirmAll
                  ? (isAr ? "تأكيد الحذف؟" : "Confirm delete?")
                  : (isAr ? "حذف كل السجل" : "Clear All History")}
              </button>
            </div>
          )}
        </div>

        <div className="sb-foot">
          {/* ✅ Account row — clickable */}
          <div className="u-row" onClick={() => setShowAccount(true)} title={isAr ? "حسابي" : "My Account"}>
            <div className="av">{user.initials}</div>
            <div>
              <div className="u-name">{user.name}</div>
              <div className="u-role">{user.role}</div>
            </div>
          </div>
          <div className="sb-acts">
            <button className="act-btn" onClick={onToggleLang}>{lang === "ar" ? "EN" : "ع"}</button>
            <button className="act-btn" onClick={onToggleDark}>{dark ? "☀️" : "🌙"}</button>
            <button className="act-btn out" onClick={onLogout}>{t.logout}</button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showAccount   && <AccountModal   user={user} lang={lang} token={token} onUpdateName={onUpdateName} onClose={() => setShowAccount(false)} />}
      {showDashboard && <DashboardView  history={history} lang={lang} onClose={() => setShowDashboard(false)} />}
      {showSettings  && <SettingsView   lang={lang} dark={dark} onToggleDark={onToggleDark} onToggleLang={onToggleLang} onClose={() => setShowSettings(false)} />}
    </>
  );
}