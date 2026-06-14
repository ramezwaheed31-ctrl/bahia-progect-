import { useState } from "react";
import BahiaLogo from "./BahiaLogo";
import PasswordInput from "./PasswordInput";
import { groupBy } from "../constants";
import { API_BASE_URL } from "../api";
import { translations } from "../i18n";

// ── Account Modal ──────────────────────────────────────────────────
// ── نافذة الملف الشخصي والتحكم بالحساب ──────────────────────────────
/**
 * AccountModal Component - Handles updating user details, name changes,
 * updating email addresses, and changing password via backend requests.
 *
 * مكون نافذة الملف الشخصي - يعالج تحديث بيانات المستخدم، وتغيير الاسم،
 * وتحديث البريد الإلكتروني، وتغيير كلمة المرور عبر طلبات مخصصة للخادم.
 */
function AccountModal({
  user,
  lang,
  onClose,
  onUpdateName,
  onUpdateEmail,
  token,
}) {
  const isAr = lang === "ar";
  const [tab, setTab] = useState("profile");
  const [editName, setEditName] = useState(false);
  const [nameVal, setNameVal] = useState(user.name || "");
  const [newEmailVal, setNewEmailVal] = useState("");
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmP, setConfirmP] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  /**
   * Saves updated name locally and updates application state.
   *
   * يحفظ الاسم المعدّل محلياً ويحدّث حالة التطبيق العامة.
   */
  function saveName() {
    if (!nameVal.trim()) return;
    localStorage.setItem(
      "bahia_name_" + user.email.toLowerCase(),
      nameVal.trim(),
    );
    onUpdateName?.(nameVal.trim());
    setEditName(false);
    setMsg(isAr ? "✅ تم تحديث الاسم" : "✅ Name updated");
    setTimeout(() => setMsg(""), 2500);
  }

  /**
   * Submits email change request to Fast API authentication backend.
   *
   * يرسل طلب تغيير البريد الإلكتروني إلى خادم المصادقة.
   */
  async function saveNewEmail() {
    setErr("");
    setMsg("");
    const trimmed = newEmailVal.trim();
    if (!trimmed) {
      setErr(isAr ? "يرجى إدخال البريد الجديد" : "Please enter new email");
      return;
    }
    if (trimmed === user.email) {
      setErr(isAr ? "البريد نفسه كالحالي" : "Same as current email");
      return;
    }
    if (
      !trimmed.toLowerCase().endsWith("@gmail.com") &&
      !trimmed.toLowerCase().endsWith("@yahoo.com")
    ) {
      setErr(
        isAr
          ? "يرجى استخدام بريد @gmail.com أو @yahoo.com فقط"
          : "Only @gmail.com or @yahoo.com addresses are allowed",
      );
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setErr(isAr ? "صيغة البريد غير صحيحة" : "Invalid email format");
      return;
    }
    setSaving(true);
    const tok = token || localStorage.getItem("bahia_token");
    if (!tok) {
      setErr(isAr ? "❌ انتهت الجلسة" : "❌ Session expired");
      setSaving(false);
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/change-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tok}`,
        },
        body: JSON.stringify({ new_email: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(
          data.detail || (isAr ? "فشل تغيير البريد" : "Failed to change email"),
        );
        return;
      }
      setMsg(
        isAr
          ? "✅ تم تغيير البريد الإلكتروني بنجاح"
          : "✅ Email changed successfully",
      );
      onUpdateEmail?.(trimmed);
      setNewEmailVal("");
    } catch {
      setErr(isAr ? "❌ تعذر الاتصال" : "❌ Server error");
    } finally {
      setSaving(false);
    }
  }

  /**
   * Submits password update request to Fast API authentication backend.
   *
   * يرسل طلب تحديث كلمة المرور إلى خادم المصادقة.
   */
  async function changePassword() {
    setErr("");
    setMsg("");
    if (!oldPass || !newPass || !confirmP) {
      setErr(isAr ? "يرجى ملء جميع الحقول" : "Fill all fields");
      return;
    }
    if (newPass !== confirmP) {
      setErr(isAr ? "كلمتا المرور غير متطابقتين" : "Passwords don't match");
      return;
    }
    if (newPass.length < 8) {
      setErr(
        isAr
          ? "❌ كلمة المرور يجب أن تكون 8 أحرف على الأقل."
          : "❌ Password must be at least 8 characters.",
      );
      return;
    }
    if (!/[a-zA-Z\u0600-\u06FF]/.test(newPass) || !/[0-9]/.test(newPass)) {
      setErr(
        isAr
          ? "❌ يجب أن تحتوي كلمة المرور على حروف وأرقام معاً."
          : "❌ Password must contain both letters and numbers.",
      );
      return;
    }
    if (newPass === oldPass) {
      setErr(
        isAr
          ? "كلمة المرور الجديدة مطابقة للقديمة"
          : "New password must differ",
      );
      return;
    }
    setSaving(true);
    const tok = token || localStorage.getItem("bahia_token");
    if (!tok) {
      setErr(isAr ? "❌ انتهت الجلسة" : "❌ Session expired");
      setSaving(false);
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tok}`,
        },
        body: JSON.stringify({ old_password: oldPass, new_password: newPass }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(
          data.detail ||
            (isAr ? "تأكد من كلمة المرور الحالية" : "Check current password"),
        );
        return;
      }
      setMsg(isAr ? "✅ تم تغيير كلمة المرور" : "✅ Password changed");
      setOldPass("");
      setNewPass("");
      setConfirmP("");
    } catch {
      setErr(isAr ? "❌ تعذر الاتصال" : "❌ Server error");
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = {
    width: "100%",
    padding: "9px 12px",
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    fontFamily: "var(--font)",
    fontSize: 13,
    color: "var(--text)",
    outline: "none",
    direction: "ltr",
    textAlign: "left",
    marginTop: 5,
  };

  const tabs = [
    ["profile", isAr ? "الملف الشخصي" : "Profile"],
    ["email", isAr ? "البريد الإلكتروني" : "Email"],
    ["password", isAr ? "كلمة المرور" : "Password"],
  ];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        zIndex: 500,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        className="account-modal-inner"
        style={{
          background: "var(--warm)",
          border: "1px solid var(--border)",
          borderRadius: 20,
          width: 400,
          maxWidth: "94vw",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 8px 40px rgba(0,0,0,0.22)",
        }}
        onClick={(e) => e.stopPropagation()}
        dir={isAr ? "rtl" : "ltr"}
      >
        {/* Header */}
        <div
          style={{
            padding: "28px 28px 0",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              width: 68,
              height: 68,
              borderRadius: "50%",
              background: "var(--pink-dim)",
              border: "2px solid var(--pink-border)",
              color: "var(--pink)",
              fontSize: 28,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {user.initials}
          </div>
          <div style={{ textAlign: "center" }}>
            <div
              style={{ fontWeight: 700, fontSize: 17, color: "var(--text)" }}
            >
              {user.name}
            </div>
            <div
              style={{
                fontSize: 12,
                color: "var(--text-muted)",
                marginTop: 3,
                direction: "ltr",
              }}
            >
              {user.email}
            </div>
          </div>
          {/* Tab bar */}
          <div
            style={{
              display: "flex",
              gap: 0,
              marginTop: 12,
              width: "100%",
              borderBottom: "1px solid var(--border)",
            }}
          >
            {tabs.map(([id, label]) => (
              <button
                key={id}
                onClick={() => {
                  setTab(id);
                  setErr("");
                  setMsg("");
                }}
                style={{
                  flex: 1,
                  padding: "9px 0",
                  background: "transparent",
                  border: "none",
                  borderBottom:
                    tab === id
                      ? "2px solid var(--pink)"
                      : "2px solid transparent",
                  color: tab === id ? "var(--pink)" : "var(--text-muted)",
                  fontWeight: tab === id ? 700 : 500,
                  fontSize: 13,
                  cursor: "pointer",
                  fontFamily: "var(--font)",
                  marginBottom: -1,
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div
          style={{
            padding: "20px 28px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {tab === "profile" && (
            <>
              {/* Name field */}
              <div>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--text-dim)",
                    marginBottom: 2,
                    textTransform: "uppercase",
                    letterSpacing: ".05em",
                  }}
                >
                  {isAr ? "الاسم" : "Name"}
                </div>
                {editName ? (
                  <div
                    style={{ display: "flex", gap: 6, alignItems: "center" }}
                  >
                    <input
                      value={nameVal}
                      onChange={(e) => setNameVal(e.target.value)}
                      style={{ ...inputStyle, flex: 1 }}
                    />
                    <button
                      onClick={saveName}
                      style={{
                        padding: "9px 14px",
                        background: "var(--pink)",
                        border: "none",
                        borderRadius: 8,
                        color: "#fff",
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: "pointer",
                        fontFamily: "var(--font)",
                      }}
                    >
                      {isAr ? "حفظ" : "Save"}
                    </button>
                    <button
                      onClick={() => {
                        setEditName(false);
                        setNameVal(user.name);
                      }}
                      style={{
                        padding: "9px 10px",
                        background: "transparent",
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                        color: "var(--text-muted)",
                        fontSize: 13,
                        cursor: "pointer",
                        fontFamily: "var(--font)",
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "9px 12px",
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                    }}
                  >
                    <span style={{ fontSize: 14, color: "var(--text)" }}>
                      {user.name}
                    </span>
                    <button
                      onClick={() => setEditName(true)}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "var(--pink)",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                        fontFamily: "var(--font)",
                      }}
                    >
                      {isAr ? "تعديل" : "Edit"}
                    </button>
                  </div>
                )}
              </div>

              {/* Role */}
              <div>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--text-dim)",
                    marginBottom: 2,
                    textTransform: "uppercase",
                    letterSpacing: ".05em",
                  }}
                >
                  {isAr ? "الدور" : "Role"}
                </div>
                <div
                  style={{
                    padding: "9px 12px",
                    background: "var(--pink-dim)",
                    border: "1px solid var(--pink-border)",
                    borderRadius: 8,
                    fontSize: 13,
                    color: "var(--pink)",
                    fontWeight: 600,
                  }}
                >
                  {user.role}
                </div>
              </div>
            </>
          )}

          {tab === "email" && (
            <>
              {/* Current email — read only */}
              <div>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--text-dim)",
                    marginBottom: 4,
                    textTransform: "uppercase",
                    letterSpacing: ".05em",
                  }}
                >
                  {isAr ? "البريد الحالي" : "Current Email"}
                </div>
                <div
                  style={{
                    padding: "9px 12px",
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 13,
                    color: "var(--text-muted)",
                    direction: "ltr",
                  }}
                >
                  {user.email}
                </div>
              </div>

              {/* New email input */}
              <div>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--text-dim)",
                    marginBottom: 4,
                    textTransform: "uppercase",
                    letterSpacing: ".05em",
                  }}
                >
                  {isAr ? "البريد الجديد" : "New Email"}
                </div>
                <input
                  type="email"
                  value={newEmailVal}
                  onChange={(e) => {
                    setNewEmailVal(e.target.value);
                    setErr("");
                    setMsg("");
                  }}
                  placeholder=""
                  style={{ ...inputStyle }}
                />
              </div>

              <button
                onClick={saveNewEmail}
                disabled={saving || !newEmailVal.trim()}
                style={{
                  width: "100%",
                  padding: "11px 0",
                  marginTop: 4,
                  background: "var(--pink)",
                  border: "none",
                  borderRadius: 10,
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 14,
                  cursor:
                    saving || !newEmailVal.trim() ? "not-allowed" : "pointer",
                  fontFamily: "var(--font)",
                  opacity: saving || !newEmailVal.trim() ? 0.6 : 1,
                  transition: "opacity .2s",
                }}
              >
                {saving
                  ? isAr
                    ? "جاري الحفظ..."
                    : "Saving..."
                  : isAr
                    ? "تغيير البريد الإلكتروني"
                    : "Change Email"}
              </button>
            </>
          )}

          {tab === "password" && (
            <>
              {[
                [
                  isAr ? "كلمة المرور الحالية" : "Current Password",
                  oldPass,
                  setOldPass,
                ],
                [
                  isAr ? "كلمة المرور الجديدة" : "New Password",
                  newPass,
                  setNewPass,
                ],
                [
                  isAr ? "تأكيد كلمة المرور" : "Confirm Password",
                  confirmP,
                  setConfirmP,
                ],
              ].map(([label, val, setter]) => (
                <div key={label}>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--text-dim)",
                      textTransform: "uppercase",
                      letterSpacing: ".05em",
                      marginBottom: 4,
                    }}
                  >
                    {label}
                  </div>
                  <PasswordInput
                    value={val}
                    onChange={(e) => setter(e.target.value)}
                    placeholder=""
                    autoComplete="off"
                    className=""
                    inputStyle={inputStyle}
                  />
                </div>
              ))}
              <button
                onClick={changePassword}
                disabled={saving}
                style={{
                  width: "100%",
                  padding: "11px 0",
                  marginTop: 4,
                  background: "var(--pink)",
                  border: "none",
                  borderRadius: 10,
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: "pointer",
                  fontFamily: "var(--font)",
                  opacity: saving ? 0.6 : 1,
                }}
              >
                {saving
                  ? isAr
                    ? "جاري الحفظ..."
                    : "Saving..."
                  : isAr
                    ? "تغيير كلمة المرور"
                    : "Change Password"}
              </button>
            </>
          )}

          {msg && (
            <div
              style={{ fontSize: 12, color: "#2a9d5c", textAlign: "center" }}
            >
              {msg}
            </div>
          )}
          {err && (
            <div
              style={{
                fontSize: 12,
                color: "var(--danger)",
                textAlign: "center",
              }}
            >
              {err}
            </div>
          )}

          <button
            onClick={onClose}
            style={{
              width: "100%",
              padding: "10px 0",
              background: "transparent",
              border: "1px solid var(--border)",
              borderRadius: 10,
              color: "var(--text-muted)",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              fontFamily: "var(--font)",
              marginTop: 4,
            }}
          >
            {isAr ? "إغلاق" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Sidebar ────────────────────────────────────────────────────────
// ── الشريط الجانبي ──────────────────────────────────────────────────
/**
 * Sidebar Component - Renders conversational history grouped by date,
 * allows user profile access, language selection, dark/light theme switching,
 * clearing message history, and launching new chat channels.
 *
 * مكون الشريط الجانبي - يعرض سجل المحادثات مجمعة حسب التاريخ،
 * ويسمح بالوصول إلى الملف الشخصي، واختيار اللغة، وتحويل المظهر،
 * ومسح سجل المحادثات بالكامل، وبدء قنوات دردشة جديدة.
 */
export default function Sidebar({
  user,
  history,
  activeId,
  onSelect,
  onNew,
  onLogout,
  dark,
  onToggleDark,
  lang,
  onToggleLang,
  open,
  onDeleteConv,
  onDeleteAllHistory,
  onUpdateName,
  onUpdateEmail,
  token,
}) {
  const t = translations[lang];
  const groups = groupBy(history, "date");
  const isAr = lang === "ar";

  const [showAccount, setShowAccount] = useState(false);
  const [confirmAll, setConfirmAll] = useState(false);

  /**
   * Triggers or confirms deletion of all conversational logs.
   *
   * يبدأ أو يؤكد حذف جميع سجلات المحادثة المخزنة.
   */
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
        {/* ── Chatbot Welcome Card ── */}
        {/* ── بطاقة الترحيب الجانبية ── */}
        <div className="sb-welcome-panel">
          <div className="sb-welcome-avatar" style={{ animation: "none" }}>
            <BahiaLogo size={36} />
          </div>
          <div className="sb-welcome-name">MammoGuide</div>
          <div className="sb-welcome-tagline">{t.sidebarTagline}</div>
        </div>

        {/* ── New Chat button ── */}
        {/* ── زر محادثة جديدة ── */}
        <div className="sb-top" style={{ paddingTop: 10, paddingBottom: 10 }}>
          <button className="new-btn" onClick={onNew}>
            {t.newChat}
          </button>
        </div>

        <div className="sb-separator" />

        {/* ── Chat history ── */}
        {/* ── سجل المحادثات السابقة ── */}
        <div className="sb-scroll">
          <div style={{ height: 6 }} />
          {Object.entries(groups).map(([date, items]) => (
            <div key={date}>
              <div className="sb-grp">{date}</div>
              {items.map((item) => (
                <div
                  key={item.id}
                  className={
                    "sb-item" + (activeId === item.id ? " active" : "")
                  }
                  onClick={() => onSelect(item)}
                >
                  <div className="sb-dot">◈</div>
                  <div className="sb-body">
                    <div className="sb-title">{item.title}</div>
                    <div className="sb-prev">{item.preview}</div>
                  </div>
                  <button
                    className="sb-del-btn"
                    title={isAr ? "حذف" : "Delete"}
                    style={
                      isAr
                        ? { left: 8, right: "auto" }
                        : { right: 8, left: "auto" }
                    }
                    onClick={(e) => {
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

          {history.length > 0 && (
            <div style={{ padding: "10px 18px" }}>
              <button
                onClick={handleDeleteAll}
                style={{
                  width: "100%",
                  padding: "8px 0",
                  background: confirmAll
                    ? "rgba(192,80,112,0.12)"
                    : "transparent",
                  border: "1px solid rgba(192,80,112,0.3)",
                  borderRadius: 8,
                  color: "var(--danger)",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "var(--font)",
                  transition: "0.2s",
                }}
              >
                🗑{" "}
                {confirmAll
                  ? isAr
                    ? "تأكيد الحذف؟"
                    : "Confirm?"
                  : isAr
                    ? "حذف كل السجل"
                    : "Clear All"}
              </button>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        {/* ── تذييل الشريط الجانبي (ملف المستخدم والتحكم) ── */}
        <div className="sb-foot">
          <div
            className="u-row"
            onClick={() => setShowAccount(true)}
            title={isAr ? "حسابي" : "Account"}
          >
            <div className="av">{user.initials}</div>
            <div>
              <div className="u-name">{user.name}</div>
              <div className="u-role">{user.role}</div>
            </div>
          </div>
          <div className="sb-acts">
            <button
              className="act-btn"
              onClick={onToggleLang}
              dir={isAr ? "ltr" : "rtl"}
              lang={isAr ? "en" : "ar"}
              style={{ minWidth: 44 }}
            >
              {lang === "ar" ? "EN" : "عربي"}
            </button>
            <button className="act-btn" onClick={onToggleDark}>
              {dark ? "☀️" : "🌙"}
            </button>
            <button className="act-btn out" onClick={onLogout}>
              {t.logout}
            </button>
          </div>
        </div>
      </div>

      {showAccount && (
        <AccountModal
          user={user}
          lang={lang}
          token={token}
          onUpdateName={onUpdateName}
          onUpdateEmail={onUpdateEmail}
          onClose={() => setShowAccount(false)}
        />
      )}
    </>
  );
}
