import { useState, useRef, useEffect } from "react";
import { nowTime } from "./constants"; 
import { translations } from "./i18n";
import Login   from "./components/Login";
import Sidebar from "./components/Sidebar";
import Chat    from "./components/Chat";
import "./styles.css";

const LS = {
  get: (k, def) => { try { const v = localStorage.getItem(k); return v !== null ? JSON.parse(v) : def; } catch { return def; } },
  set: (k, v)   => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

export default function App() {
  const [dark,     setDark]     = useState(() => LS.get("cg_dark", false));
  const [lang,     setLang]     = useState(() => LS.get("cg_lang", "ar"));
  const [user,     setUser]     = useState(() => LS.get("cg_user", null));
  // Token stored separately so it survives a page refresh
  const [token,    setToken]    = useState(() => localStorage.getItem("bahia_token") || null);
  const [history,  setHistory]  = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [sbOpen,   setSbOpen]   = useState(true);

  const activeIdRef = useRef(activeId);
  const langRef     = useRef(lang);

  useEffect(() => { activeIdRef.current = activeId; }, [activeId]);
  useEffect(() => { langRef.current = lang; },         [lang]);

  useEffect(() => {
    if (user) {
      const h = LS.get("cg_hist_" + user.email, []);
      setHistory(h);
    }
  }, [user]);

  useEffect(() => { LS.set("cg_dark", dark); },  [dark]);
  useEffect(() => { LS.set("cg_lang", lang); },  [lang]);
  useEffect(() => { LS.set("cg_user", user); },  [user]);

  // Persist token to localStorage whenever it changes
  useEffect(() => {
    if (token) localStorage.setItem("bahia_token", token);
    else       localStorage.removeItem("bahia_token");
  }, [token]);

  // Restore chat history when user changes
  useEffect(() => {
    if (user) {
      const h = LS.get("cg_hist_" + user.email, []);
      setHistory(h);
    }
  }, [user]);

  const t = translations[lang];

  const toggleDark = () => setDark(d => !d);
  
  const toggleLang = () => {
    const next = lang === "ar" ? "en" : "ar";
    setLang(next);
    if (user) setUser(u => ({
      ...u,
      name: next === "ar" ? u.nameAr : u.nameEn,
      role: translations[next].role,
    }));
  };

  // handleLogin — called by Login.jsx after a successful Supabase auth
  function handleLogin(userData) {
    // userData = { token, email, id, name, initials, role }
    const { token: newToken, ...rest } = userData;
    setToken(newToken);
    setUser(rest);
    setMessages([]);
    setActiveId(null);
    setSbOpen(true);
  }

  // handleLogout — clears all auth state
  function handleLogout() {
    if (user) LS.set("cg_hist_" + user.email, history);
    localStorage.removeItem("bahia_token");
    setToken(null);
    setUser(null);
    setMessages([]);
    setActiveId(null);
    setHistory([]);
  }

  function loadConv(item) {
    setActiveId(item.id);
    const msgs = LS.get("cg_msgs_" + item.id, []);
    setMessages(msgs);
  }

  function newChat() {
    setActiveId(null);
    setMessages([]);
  }

  function handleSend(text) {
    const currentLang = langRef.current;
    const tr = translations[currentLang];
    const userMsg = { id: Date.now(), role: "user", text, time: nowTime(currentLang) };

    setMessages(prev => {
      const updated = [...prev, userMsg];
      if (activeIdRef.current) LS.set("cg_msgs_" + activeIdRef.current, updated);
      return updated;
    });

    setLoading(true);

    if (!activeIdRef.current) {
      const newId = Date.now();
      const item  = { id: newId, title: text, date: tr.historyToday, preview: text };
      activeIdRef.current = newId;
      setActiveId(newId);
      setHistory(prev => {
        const next = [item, ...prev];
        if (user) LS.set("cg_hist_" + user.email, next);
        return next;
      });
      LS.set("cg_msgs_" + newId, [userMsg]);
    }

    // ── Guard: must have a token before calling protected API ──
    const currentToken = token || localStorage.getItem("bahia_token");
    if (!currentToken) {
      // No token → force logout so the Login page appears
      handleLogout();
      return;
    }

    fetch("http://127.0.0.1:8000/api/chat", {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${currentToken}`,   // ← JWT injected here
      },
      body: JSON.stringify({ text, lang: currentLang })
    })
    .then(r => {
      // 401 means the token expired or was revoked → force logout
      if (r.status === 401) { handleLogout(); return null; }
      return r.json();
    })
    .then(data => {
      if (!data) return;  // was nulled by 401 handler above
      const aiMsg = { id: Date.now() + 1, role: "ai", text: data.reply || tr.aiPlaceholder, time: nowTime(currentLang) };
      setMessages(prev => {
        const final = [...prev, aiMsg];
        if (activeIdRef.current) LS.set("cg_msgs_" + activeIdRef.current, final);
        return final;
      });
    })
    .catch(() => {
      const aiMsg = { id: Date.now() + 1, role: "ai", text: currentLang === "ar" ? "تعذر الاتصال بالخادم. تأكد من تشغيل FastAPI." : "Failed to connect to the server. Ensure FastAPI is running.", time: nowTime(currentLang) };
      setMessages(prev => {
        const final = [...prev, aiMsg];
        if (activeIdRef.current) LS.set("cg_msgs_" + activeIdRef.current, final);
        return final;
      });
    })
    .finally(() => {
      setLoading(false);
    });
  }

  function handleDeleteMessage(msgId) {
    if (!msgId) return;
    setMessages(prev => {
      const final = prev.filter(m => m.id !== msgId);
      if (activeIdRef.current) LS.set("cg_msgs_" + activeIdRef.current, final);
      return final;
    });

    const currentToken = token || localStorage.getItem("bahia_token");
    fetch(`http://127.0.0.1:8000/api/messages/${msgId}`, {
      method: "DELETE",
      headers: currentToken ? { "Authorization": `Bearer ${currentToken}` } : {},
    }).catch(err => console.error("Delete failed silently:", err));
  }

  return (
    <div className={dark ? "dm" : ""} style={{ minHeight: "100vh", background: "var(--cream)" }} dir={t.dir}>
      {!user ? (
        <Login
          onLogin={handleLogin}
          dark={dark}
          onToggleDark={toggleDark}
          lang={lang}
          onToggleLang={toggleLang}
        />
      ) : (
        <div className={`layout ${sbOpen ? "sb-open" : "sb-closed"}`}>
          <div className={"sb-overlay" + (sbOpen ? " visible" : "")} onClick={() => setSbOpen(false)} />
          
          <Sidebar
            user={user}
            history={history}
            activeId={activeId}
            onSelect={loadConv}
            onNew={newChat}
            onLogout={handleLogout}
            dark={dark}
            onToggleDark={toggleDark}
            lang={lang}
            onToggleLang={toggleLang}
            open={sbOpen}
            onToggle={() => setSbOpen(!sbOpen)}
          />

          <div className="main">
            <Chat
              user={user}
              messages={messages}
              loading={loading}
              onSend={handleSend}
              onDeleteMessage={handleDeleteMessage}
              lang={lang}
              onToggleLang={toggleLang}
              dark={dark}
              onToggleDark={toggleDark}
              onToggleSidebar={() => setSbOpen(!sbOpen)}
            />
          </div>
        </div>
      )}
    </div>
  );
}