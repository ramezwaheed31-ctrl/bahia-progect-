import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

/**
 * PasswordInput — Reusable password field with show/hide toggle.
 *
 * Props:
 *   value        – controlled value
 *   onChange     – change handler
 *   placeholder  – placeholder text (default: "••••••••")
 *   autoComplete – autocomplete attribute (default: "current-password")
 *   className    – extra CSS class for the <input>
 *   inputStyle   – optional inline style object merged onto the <input>
 */
export default function PasswordInput({
  value,
  onChange,
  placeholder = "••••••••",
  autoComplete = "current-password",
  className = "",
  inputStyle = {},
}) {
  const [show, setShow] = useState(false);
  const isRTL =
    typeof document !== "undefined" &&
    (document.dir === "rtl" ||
      document.documentElement.dir === "rtl" ||
      document.documentElement.lang === "ar");

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        width: "100%",
      }}
    >
      <input
        type={show ? "text" : "password"}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onChange={onChange}
        className={className}
        style={{
          width: "100%",
          paddingRight: isRTL ? "16px" : "45px",
          paddingLeft: isRTL ? "45px" : "16px",
          ...inputStyle,
        }}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide password" : "Show password"}
        style={{
          position: "absolute",
          insetInlineEnd: "12px" /* works for both LTR and RTL */,
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
          color: "var(--text-muted)",
          display: "flex",
          alignItems: "center",
          zIndex: 1,
          flexShrink: 0,
        }}
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}
