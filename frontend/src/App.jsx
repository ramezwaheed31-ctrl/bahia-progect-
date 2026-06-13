import { useState, useRef, useEffect } from "react";
import { nowTime } from "./constants";
import { API_BASE_URL } from "./api";
import { translations } from "./i18n";
import Login, { SplashScreen } from "./components/Login";
import Sidebar from "./components/Sidebar";
import Chat    from "./components/Chat";
import "./styles.css";

/**
 * LS - LocalStorage helper for reading and writing JSON serializable values safely.
 * 
 * مساعد التخزين المحلي (LocalStorage) لقراءة وكتابة القيم المتسلسلة لـ JSON بشكل آمن.
 */
const LS = {
  get: (k, def) => { try { const v = localStorage.getItem(k); return v !== null ? JSON.parse(v) : def; } catch { return def; } },
  set: (k, v)   => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

/**
 * Main Application Component (App)
 * Controls user sessions, state management (theme, language, authentication, conversation history),
 * and handles dispatching messages to the FastAPI backend API via a streaming fetch.
 * 
 * المكون الرئيسي للتطبيق (App)
 * يتحكم بجلسات المستخدمين، وإدارة الحالة (المظهر، اللغة، المصادقة، سجل المحادثات)،
 * ويعالج إرسال الرسائل إلى خادم FastAPI عبر دفق استجابة النص مباشرة.
 */
export default function App() {
  const [dark,     setDark]     = useState(() => LS.get("cg_dark", false));
  const [lang,     setLang]     = useState(() => {
    const saved = LS.get("cg_lang", null);
    let initialLang = "ar";
    if (saved) {
      initialLang = saved;
    } else {
      // Auto-detect device language: default to Arabic if device is Arabic
      const deviceLang = (navigator.language || navigator.userLanguage || "ar").toLowerCase();
      initialLang = deviceLang.startsWith("ar") ? "ar" : "en";
    }
    if (typeof document !== "undefined") {
      const isAr = initialLang === "ar";
      document.dir = isAr ? "rtl" : "ltr";
      document.documentElement.dir = isAr ? "rtl" : "ltr";
      document.documentElement.lang = initialLang;
    }
    return initialLang;
  });
  const [user,     setUser]     = useState(() => LS.get("cg_user", null));
  const [token,    setToken]    = useState(() => localStorage.getItem("bahia_token") || null);
  const [history,  setHistory]  = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [sbOpen,   setSbOpen]   = useState(() => window.innerWidth > 768);
  const [loginKey, setLoginKey] = useState(0);   // bumped on logout → forces Login remount + fresh splash
  const [appSplash, setAppSplash] = useState(false); // Used for login transition
  // Gender persisted per user
  const [gender,   setGender]   = useState(() => LS.get("cg_gender", null));

  const activeIdRef = useRef(activeId);
  const langRef     = useRef(lang);
  const sendingRef  = useRef(false);

  useEffect(() => { activeIdRef.current = activeId; }, [activeId]);
  useEffect(() => { langRef.current = lang; },         [lang]);

  // Load conversation history and user gender specifics upon successful session verification
  // تحميل سجل المحادثات وتفاصيل جنس المستخدم عند التحقق من الجلسة بنجاح
  useEffect(() => {
    if (user) {
      const h = LS.get("cg_hist_" + user.email, []);
      setHistory(h);
      // Load gender per user and ensure role label matches
      const g = LS.get("cg_gender_" + user.email, null);
      setGender(g);
      setUser(u => {
        const correctRole = g === "male" ? translations[lang].roleMale : translations[lang].role;
        if (u.role !== correctRole) return { ...u, role: correctRole };
        return u;
      });
    }
  }, [user?.email, lang]); // safe dependencies to prevent infinite loop

  // Persist core user configuration states
  // حفظ قيم الإعدادات الرئيسية للمستخدم في المتصفح تلقائياً
  useEffect(() => { LS.set("cg_dark", dark); },  [dark]);
  useEffect(() => { 
    LS.set("cg_lang", lang); 
    if (typeof document !== "undefined") {
      const isAr = lang === "ar";
      document.dir = isAr ? "rtl" : "ltr";
      document.documentElement.dir = isAr ? "rtl" : "ltr";
      document.documentElement.lang = lang;
    }
  },  [lang]);
  useEffect(() => { LS.set("cg_user", user); },  [user]);

  // Token management lifecycle
  // دورة حياة إدارة الرمز المميز (Token) للمصادقة
  useEffect(() => {
    if (token) localStorage.setItem("bahia_token", token);
    else       localStorage.removeItem("bahia_token");
  }, [token]);

  const t = translations[lang];

  /**
   * Toggles interface dark / light mode.
   * 
   * يبدل واجهة التطبيق بين الوضعين الداكن والمضيء.
   */
  const toggleDark = () => setDark(d => !d);

  /**
   * Translates application keys and adjusts role titles according to active gender context.
   * 
   * يغير لغة التطبيق ويحدّث تسميات الأدوار وفقاً لجنس المستخدم الفعال.
   */
  const toggleLang = () => {
    const next = lang === "ar" ? "en" : "ar";
    setLang(next);
    if (user) setUser(u => ({
      ...u,
      // Only update role label; name stays the same across language switches
      role: translations[next][gender === "male" ? "roleMale" : "role"],
    }));
  };

  /**
   * Receives user data, updates local states, and triggers the post-auth screen splash.
   * @param {object} userData - Login success metadata.
   * 
   * يستقبل بيانات المستخدم المصدقة، ويحدّث الحالات المحلية، ويفعّل شاشة الترحيب.
   * @param {object} userData - بيانات نجاح تسجيل الدخول.
   */
  function handleLogin(userData) {
    const { token: newToken, ...rest } = userData;
    setToken(newToken);
    // Load saved gender and set the correct role label immediately
    const g = LS.get("cg_gender_" + rest.email, null);
    const tr = translations[lang];
    setUser({ ...rest, role: g === "male" ? tr.roleMale : tr.role });
    setMessages([]);
    setActiveId(null);
    setSbOpen(window.innerWidth > 768);
    setGender(g);
    setAppSplash(true); // Trigger the splash animation upon login
  }

  /**
   * Cleans user state, token data, history logs, and redirects to Login panel.
   * 
   * يمسح بيانات الجلسة، والرمز المميز، والتاريخ، ويعيد توجيه المستخدم لنموذج الدخول.
   */
  function handleLogout() {
    if (user) LS.set("cg_hist_" + user.email, history);
    localStorage.removeItem("bahia_token");
    setToken(null);
    setUser(null);
    setMessages([]);
    setActiveId(null);
    setHistory([]);
    setGender(null);
    setLoginKey(k => k + 1);   // force Login to remount so splash always shows
  }

  /**
   * Persists active user gender context and updates role labeling.
   * @param {string} g - Gender type ('female' or 'male').
   * 
   * يحفظ جنس المستخدم النشط ويحدّث المسميات اللفظية للأدوار.
   * @param {string} g - نوع الجنس ('female' أو 'male').
   */
  function handleSetGender(g) {
    setGender(g);
    LS.set("cg_gender", g);
    if (user) LS.set("cg_gender_" + user.email, g);
    // Update role label
    if (user) {
      const tr = translations[lang];
      setUser(u => ({
        ...u,
        role: g === "male" ? tr.roleMale : tr.role,
      }));
    }
  }

  /**
   * Retrieves messages for the targeted conversation history ID.
   * @param {object} item - Selected history entity.
   * 
   * يسترجع رسائل المحادثة المحددة من التخزين المحلي.
   * @param {object} item - كائن السجل المحدد.
   */
  function loadConv(item) {
    setActiveId(item.id);
    const msgs = LS.get("cg_msgs_" + item.id, []);
    setMessages(msgs);
    if (window.innerWidth <= 768) {
      setSbOpen(false);
    }
  }

  /**
   * Clears state for active chat viewport to start a new chat thread.
   * 
   * يفرغ نافذة المحادثة النشطة لبدء خيط محادثة جديد.
   */
  function newChat() {
    setActiveId(null);
    setMessages([]);
    setSbOpen(window.innerWidth > 768);
  }

  /**
   * Deletes a single conversation log and its associated messages.
   * @param {number} convId - ID of target conversation.
   * 
   * يحذف سجلاً فردياً للمحادثة والرسائل المرتبطة به.
   * @param {number} convId - المعرف الفريد للمحادثة المراد حذفها.
   */
  function handleDeleteConv(convId) {
    if (activeIdRef.current === convId) {
      setActiveId(null);
      activeIdRef.current = null;
      setMessages([]);
    }
    setHistory(prev => {
      const next = prev.filter(h => h.id !== convId);
      if (user) LS.set("cg_hist_" + user.email, next);
      return next;
    });
    localStorage.removeItem("cg_msgs_" + convId);
  }

  /**
   * Clears entire conversation history array and purges associated local logs.
   * 
   * يمسح كامل سجل المحادثات من الذاكرة ومن التخزين المحلي للمتصفح.
   */
  function handleDeleteAllHistory() {
    history.forEach(h => localStorage.removeItem("cg_msgs_" + h.id));
    setHistory([]);
    setActiveId(null);
    activeIdRef.current = null;
    setMessages([]);
    if (user) LS.set("cg_hist_" + user.email, []);
  }

  /**
   * Updates user name locally and updates UI shell header.
   * @param {string} newName - Target name input.
   * 
   * يحدّث اسم المستخدم محلياً ويعيد توجيه واجهة الترويسة للتحديث.
   * @param {string} newName - الاسم الجديد المدخل.
   */
  function handleUpdateName(newName) {
    setUser(u => {
      const updated = { ...u, name: newName, initials: newName[0].toUpperCase() };
      LS.set("cg_user", updated);
      return updated;
    });
  }

  /**
   * Updates user email in app state and localStorage after a successful change-email API call.
   * @param {string} newEmail - The confirmed new email address.
   */
  function handleUpdateEmail(newEmail) {
    setUser(u => {
      if (!u) return u;
      const updated = { ...u, email: newEmail };
      LS.set("cg_user", updated);
      return updated;
    });
  }

  /**
   * Handles user submission, triggers history generation, and manages stream reading from the Chat API.
   * @param {string} text - Prompt query text.
   * @param {object} imageFile - Attached image object.
   * 
   * يعالج إرسال المستخدم للاستفسار، وينشئ سجل المحادثة، ويدير تدفق استجابة نموذج الذكاء الاصطناعي.
   * @param {string} text - نص استفسار المستخدم.
   * @param {object} imageFile - كائن الصورة المرفقة.
   */
  function handleSend(text, imageFile = null) {
    if (loading || sendingRef.current) return; // Prevent double-clicks and concurrent messages
    
    sendingRef.current = true;
    setLoading(true);

    const currentLang = langRef.current;
    const tr = translations[currentLang];
    const title = text.trim() || (imageFile ? (currentLang === "ar" ? "صورة" : "Image") : "...");
    const userMsg = {
      id: Date.now(), role: "user", text,
      imagePreview: imageFile?.preview || null,
      time: nowTime(currentLang),
    };

    // Set user message state
    setMessages(prev => {
      const next = [...prev, userMsg];
      if (activeIdRef.current) LS.set("cg_msgs_" + activeIdRef.current, next);
      return next;
    });

    let activeChatId = activeIdRef.current;
    if (!activeChatId) {
      activeChatId = Date.now();
      activeIdRef.current = activeChatId;
      setActiveId(activeChatId);
      setHistory(prev => {
        const next = [{ id: activeChatId, title, date: tr.historyToday, preview: title }, ...prev];
        if (user) LS.set("cg_hist_" + user.email, next);
        return next;
      });
      LS.set("cg_msgs_" + activeChatId, [userMsg]);
    }

    const currentToken = token || localStorage.getItem("bahia_token");
    if (!currentToken) { 
      handleLogout(); 
      sendingRef.current = false;
      setLoading(false);
      return; 
    }

    const formData = new FormData();
    formData.append("prompt", text);
    formData.append("lang", currentLang);
    if (imageFile?.file) {
      formData.append("file", imageFile.file);
    }

    fetch(`${API_BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${currentToken}` },
      body: formData
    })
    .then(async (response) => {
      if (!response.ok) {
        if (response.status === 401) { handleLogout(); return; }
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.reply || `HTTP ${response.status}`);
      }

      // Add a placeholder AI message
      const aiMsgId = Date.now() + 1;
      const aiMsgPlaceholder = { id: aiMsgId, role: "ai", text: "", time: nowTime(currentLang) };
      
      setMessages(prev => {
        const next = [...prev, aiMsgPlaceholder];
        if (activeIdRef.current) LS.set("cg_msgs_" + activeIdRef.current, next);
        return next;
      });

      // Stream into that message
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;
        
        // Update the streamed text in the placeholder message
        setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, text: fullText } : m));
      }
      
      // Save final state to storage
      if (activeIdRef.current) {
        setMessages(prev => {
          const next = prev.map(m => m.id === aiMsgId ? { ...m, text: fullText } : m);
          LS.set("cg_msgs_" + activeIdRef.current, next);
          return next;
        });
      }
    })
    .catch((err) => {
      console.error("Chat Error:", err);
      const aiMsg = {
        id: Date.now() + 2, role: "ai",
        text: currentLang === "ar"
          ? "حدث خطأ أثناء الاتصال: " + err.message
          : "Connection error: " + err.message,
        time: nowTime(currentLang)
      };
      setMessages(prev => {
        const next = [...prev, aiMsg];
        if (activeIdRef.current) LS.set("cg_msgs_" + activeIdRef.current, next);
        return next;
      });
    })
    .finally(() => {
      sendingRef.current = false;
      setLoading(false);
    });
  }

  /**
   * Deletes a single message query from local log and dispatches deletion request to FastAPI server database.
   * @param {number} msgId - ID of message to delete.
   * 
   * يحذف رسالة استفسار فردية من السجل المحلي ويرسل طلب الحذف إلى قاعدة بيانات الخادم.
   * @param {number} msgId - المعرف الفريد للرسالة المراد حذفها.
   */
  function handleDeleteMessage(msgId) {
    if (!msgId) return;
    setMessages(prev => {
      const final = prev.filter(m => m.id !== msgId);
      if (activeIdRef.current) LS.set("cg_msgs_" + activeIdRef.current, final);
      return final;
    });
    const currentToken = token || localStorage.getItem("bahia_token");
    fetch(`${API_BASE_URL}/api/messages/${msgId}`, {
      method: "DELETE",
      headers: currentToken ? { "Authorization": `Bearer ${currentToken}` } : {},
    }).catch(err => console.error("Delete failed silently:", err));
  }

  return (
    <div className={dark ? "dm" : ""} style={{ minHeight: "100vh", background: "var(--cream)" }} dir={t.dir}>
      {!user ? (
        <Login
          key={loginKey}
          onLogin={handleLogin}
          dark={dark}
          onToggleDark={toggleDark}
          lang={lang}
          onToggleLang={toggleLang}
        />
      ) : (
        <div className={`layout ${sbOpen ? "sb-open" : "sb-closed"}`}>
          {/* Main App Splash Transition */}
          {appSplash && <SplashScreen onDone={() => setAppSplash(false)} lang={lang} />}

          {/* Overlay only on mobile */}
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
            onDeleteConv={handleDeleteConv}
            onDeleteAllHistory={handleDeleteAllHistory}
            onUpdateName={handleUpdateName}
            onUpdateEmail={handleUpdateEmail}
            token={token}
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
              gender={gender}
              onSetGender={handleSetGender}
              onNew={newChat}
            />
          </div>
        </div>
      )}
    </div>
  );
}