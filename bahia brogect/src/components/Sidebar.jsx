import BahiaLogo from "./BahiaLogo";
import { groupBy } from "../constants";
import { translations } from "../i18n";

export default function Sidebar({ user, history, activeId, onSelect, onNew, onLogout, dark, onToggleDark, lang, onToggleLang, open }) {
  const t = translations[lang];
  const groups = groupBy(history, "date");

  return (
    <div className={"sb" + (open ? "" : " hidden")} dir={t.dir}>
      <div className="sb-top">
        <div className="sb-logo">
          <BahiaLogo size={28} />
          {t.appName}
        </div>
        
        {/* Added Navigation Links Requested by user */}
        <button className="home-btn" onClick={() => window.location.href = '/'}>
          <span>🏠</span> {lang === 'ar' ? "الرئيسية" : "Home"}
        </button>
        <button className="new-btn" onClick={onNew}>{t.newChat}</button>
      </div>

      <div className="sb-scroll">
        {/* Placeholder Navigation Links */}
        <div className="sb-grp">{lang === 'ar' ? 'التنقل' : 'Navigation'}</div>
        <div className="sb-link">
          <span>📊</span> {lang === 'ar' ? 'لوحة القيادة' : 'Dashboard'}
        </div>
        <div className="sb-link">
          <span>⚙️</span> {lang === 'ar' ? 'الإعدادات' : 'Settings'}
        </div>

        <div style={{height: "15px"}}></div>

        {Object.entries(groups).map(([date, items]) => (
          <div key={date}>
            <div className="sb-grp">{date}</div>
            {items.map(item => (
              <div
                key={item.id}
                className={"sb-item" + (activeId === item.id ? " active" : "")}
                onClick={() => onSelect(item)}
              >
                <div className="sb-dot">◈</div>
                <div className="sb-body">
                  <div className="sb-title">{item.title}</div>
                  <div className="sb-prev">{item.preview}</div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="sb-foot">
        <div className="u-row">
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
  );
}