const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{
  --pink:#E8738A;--pink-dim:rgba(232,115,138,0.12);--pink-border:rgba(232,115,138,0.28);
  --cream:#FDF6F0;--warm:#FFF9F5;--surface:#FFF2ED;
  --border:rgba(232,115,138,0.15);--border-md:rgba(232,115,138,0.25);
  --text:#2D1B1E;--text-muted:#9B7B82;--text-dim:#C4A8AE;
  --user-bubble:#C05070;--danger:#C05070;
  --font:-apple-system,BlinkMacSystemFont,'Segoe UI',Tahoma,sans-serif;
}
.dm{
  --cream:#0F0A0B;--warm:#160D0F;--surface:#1E1214;
  --border:rgba(232,115,138,0.10);--border-md:rgba(232,115,138,0.20);
  --text:#F5E8EA;--text-muted:#A07880;--text-dim:#6B4E54;
  --user-bubble:#9B3454;
}
html,body{height:100%;font-family:var(--font);color:var(--text);direction:rtl;}
::-webkit-scrollbar{width:5px;}
::-webkit-scrollbar-track{background:transparent;}
::-webkit-scrollbar-thumb{background:var(--border-md);border-radius:99px;}

.root{min-height:100vh;background:var(--cream);}
.layout{display:flex;height:100vh;overflow:hidden;}

/* ── Sidebar ── */
.sb{width:272px;flex-shrink:0;background:var(--warm);border-left:1px solid var(--border);display:flex;flex-direction:column;overflow:hidden;}
.sb-top{padding:22px 18px 14px;border-bottom:1px solid var(--border);}
.sb-logo{display:flex;align-items:center;gap:10px;font-size:17px;font-weight:700;margin-bottom:16px;color:var(--text);}
.new-btn{width:100%;padding:10px 0;background:var(--pink-dim);border:1px solid var(--pink-border);border-radius:10px;color:var(--pink);font-family:var(--font);font-size:14px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:7px;}
.new-btn:hover{background:rgba(232,115,138,0.2);}
.sb-scroll{flex:1;overflow-y:auto;padding:10px 0;}
.sb-grp{padding:10px 18px 4px;font-size:10px;letter-spacing:.07em;text-transform:uppercase;color:var(--text-dim);}
.sb-item{padding:9px 18px;cursor:pointer;display:flex;align-items:flex-start;gap:9px;border-right:2px solid transparent;}
.sb-item:hover{background:var(--surface);}
.sb-item.active{background:var(--surface);border-right-color:var(--pink);}
.sb-dot{color:var(--text-dim);font-size:11px;margin-top:3px;flex-shrink:0;}
.sb-body{flex:1;overflow:hidden;}
.sb-title{font-size:13px;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:2px;}
.sb-item.active .sb-title{color:var(--pink);}
.sb-prev{font-size:11px;color:var(--text-dim);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.sb-foot{padding:14px 16px;border-top:1px solid var(--border);}
.u-row{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:10px;cursor:pointer;margin-bottom:8px;}
.u-row:hover{background:var(--surface);}
.av{width:34px;height:34px;border-radius:50%;flex-shrink:0;background:var(--pink-dim);border:1.5px solid var(--pink-border);color:var(--pink);font-size:13px;font-weight:700;display:flex;align-items:center;justify-content:center;}
.u-name{font-size:13px;font-weight:600;color:var(--text);}
.u-role{font-size:11px;color:var(--text-muted);}
.sb-acts{display:flex;gap:7px;}
.act-btn{flex:1;padding:7px 0;background:transparent;border:1px solid var(--border);border-radius:8px;color:var(--text-muted);font-family:var(--font);font-size:12px;cursor:pointer;}
.act-btn:hover{border-color:var(--pink-border);color:var(--pink);}
.act-btn.out:hover{border-color:rgba(192,80,112,.4);color:var(--danger);}

/* ── Main ── */
.main{flex:1;display:flex;flex-direction:column;overflow:hidden;background:var(--cream);}
.topbar{padding:16px 28px;border-bottom:1px solid var(--border);background:var(--warm);display:flex;align-items:center;justify-content:space-between;flex-shrink:0;}
.t-title{font-size:17px;font-weight:700;color:var(--text);display:flex;align-items:center;gap:9px;}
.t-sub{font-size:12px;color:var(--text-muted);margin-top:2px;}
.pill{display:flex;align-items:center;gap:6px;background:var(--pink-dim);border:1px solid var(--pink-border);padding:5px 13px;border-radius:20px;font-size:12px;color:var(--pink);}
.dot{width:6px;height:6px;border-radius:50%;background:var(--pink);animation:pulse 2s infinite;}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}

/* ── Messages ── */
.msgs{flex:1;overflow-y:auto;padding:28px 28px 12px;display:flex;flex-direction:column;gap:22px;}
.mrow{display:flex;gap:10px;align-items:flex-start;}
.mrow.user{flex-direction:row-reverse;}
.mav{width:30px;height:30px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;}
.mav.ai{background:var(--pink-dim);border:1.5px solid var(--pink-border);}
.mav.me{background:var(--pink-dim);border:1.5px solid var(--pink-border);color:var(--pink);}
.bub{max-width:62%;padding:12px 16px;border-radius:18px;font-size:14px;line-height:1.75;white-space:pre-line;}
.bub.ai{background:var(--warm);border:1px solid var(--border);border-top-right-radius:4px;color:var(--text);}
.bub.user{background:var(--user-bubble);color:#fff;border-top-left-radius:4px;}
.bmeta{font-size:10px;color:var(--text-dim);margin-top:4px;}
.mrow.user .bmeta{text-align:left;}
.tdots{display:flex;gap:4px;align-items:center;padding:2px 0;}
.tdots span{width:5px;height:5px;border-radius:50%;background:var(--pink);opacity:.5;animation:td 1.2s infinite;}
.tdots span:nth-child(2){animation-delay:.2s;}
.tdots span:nth-child(3){animation-delay:.4s;}
@keyframes td{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}

/* ── Welcome ── */
.wlc{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 28px;text-align:center;}
.wlc-ico{width:72px;height:72px;border-radius:50%;background:var(--pink-dim);border:1.5px solid var(--pink-border);display:flex;align-items:center;justify-content:center;margin-bottom:20px;}
.wlc-title{font-size:27px;font-weight:700;margin-bottom:10px;color:var(--text);}
.wlc-sub{font-size:14px;color:var(--text-muted);max-width:380px;line-height:1.8;margin-bottom:30px;}
.wgrid{display:grid;grid-template-columns:1fr 1fr;gap:10px;max-width:430px;width:100%;}
.wcard{padding:14px 16px;background:var(--warm);border:1px solid var(--border);border-radius:14px;text-align:right;cursor:pointer;}
.wcard:hover{border-color:var(--pink-border);background:var(--surface);}
.wc-ico{font-size:16px;margin-bottom:5px;}
.wc-lbl{font-size:10px;color:var(--text-dim);text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px;}
.wc-txt{font-size:13px;color:var(--text);line-height:1.5;}

/* ── Disclaimer ── */
.disc{margin:0 28px 8px;padding:9px 14px;border-right:2px solid var(--pink-border);background:var(--pink-dim);border-radius:0 6px 6px 0;font-size:12px;color:var(--text-muted);line-height:1.55;flex-shrink:0;}

/* ── Input zone ── */
.izone{padding:12px 28px 20px;background:var(--warm);border-top:1px solid var(--border);flex-shrink:0;}
.chips{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:11px;}
.chip{padding:5px 13px;background:transparent;border:1px solid var(--border);border-radius:20px;font-family:var(--font);font-size:12px;color:var(--text-muted);cursor:pointer;}
.chip:hover{border-color:var(--pink-border);color:var(--pink);background:var(--pink-dim);}
.irow{display:flex;gap:10px;align-items:flex-end;}
.ta{flex:1;min-height:44px;max-height:130px;background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:11px 15px;font-family:var(--font);font-size:14px;color:var(--text);resize:none;outline:none;line-height:1.6;direction:rtl;}
.ta::placeholder{color:var(--text-dim);}
.ta:focus{border-color:var(--pink-border);}
.sbtn{width:44px;height:44px;border-radius:12px;background:var(--pink-dim);border:1px solid var(--pink-border);color:var(--pink);font-size:19px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.sbtn:hover:not(:disabled){background:rgba(232,115,138,.22);}
.sbtn:disabled{opacity:.3;cursor:not-allowed;}

/* ── Login ── */
.lw{width:100%;height:100%;display:flex;align-items:center;justify-content:center;}
.lcard{display:flex;width:820px;min-height:490px;border-radius:24px;overflow:hidden;border:1px solid var(--border);}
.ll{flex:1.1;background:var(--warm);padding:48px 42px;display:flex;flex-direction:column;justify-content:space-between;border-left:1px solid var(--border);}
.ll-logo{font-size:18px;font-weight:700;display:flex;align-items:center;gap:10px;color:var(--text);}
.ll-h{font-size:32px;font-weight:700;line-height:1.25;margin-bottom:12px;color:var(--text);}
.ll-h span{color:var(--pink);}
.ll-s{font-size:14px;color:var(--text-muted);line-height:1.75;}
.ll-tags{display:flex;flex-wrap:wrap;gap:7px;}
.ll-tag{padding:4px 12px;border:1px solid var(--border);border-radius:20px;font-size:11px;color:var(--text-muted);}
.lr{flex:1;background:var(--surface);padding:48px 42px;display:flex;flex-direction:column;justify-content:center;}
.lr-t{font-size:25px;font-weight:700;margin-bottom:5px;color:var(--text);}
.lr-s{font-size:13px;color:var(--text-muted);margin-bottom:26px;}
.fld{margin-bottom:15px;}
.fld label{display:block;font-size:11px;color:var(--text-muted);letter-spacing:.06em;margin-bottom:6px;}
.fld input{width:100%;padding:11px 14px;background:var(--warm);border:1px solid var(--border);border-radius:9px;font-family:var(--font);font-size:14px;color:var(--text);outline:none;direction:ltr;text-align:left;}
.fld input::placeholder{color:var(--text-dim);}
.fld input:focus{border-color:var(--pink-border);}
.lbtn{width:100%;padding:12px;margin-top:4px;background:var(--pink);border:none;border-radius:10px;color:#fff;font-family:var(--font);font-size:15px;font-weight:700;cursor:pointer;}
.lbtn:hover{opacity:.9;}
.lerr{font-size:12px;color:var(--danger);margin-bottom:8px;}
.lhint{font-size:11px;color:var(--text-dim);text-align:center;margin-top:14px;}
.tbtn{padding:5px 12px;background:transparent;border:1px solid var(--border);border-radius:20px;color:var(--text-muted);font-family:var(--font);font-size:12px;cursor:pointer;}
.tbtn:hover{border-color:var(--pink-border);color:var(--pink);}
`;

export default CSS;
