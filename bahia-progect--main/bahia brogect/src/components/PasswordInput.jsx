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
 */
export default function PasswordInput({
  value,
  onChange,
  placeholder = "••••••••",
  autoComplete = "current-password",
  className = "",
}) {
  const [show, setShow] = useState(false);

  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
      <input
        type={show ? "text" : "password"}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onChange={onChange}
        className={className}
        style={{
          width: "100%",
          paddingRight: "42px", /* make room for the eye icon */
        }}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide password" : "Show password"}
        style={{
          position: "absolute",
          right: "12px",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
          color: "var(--text-muted)",
          display: "flex",
          alignItems: "center",
        }}
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}
