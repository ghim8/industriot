import React, { useState, useEffect } from 'react';
export default function SessionExpiredModal({ expired, warning, secondsLeft, onContinue, onLogout, onExpire }) {
  const [count, setCount] = useState(secondsLeft || 60);

 useEffect(() => {
    if (!warning) return;
    setCount(secondsLeft || 60);
    const interval = setInterval(() => {
      setCount(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0; // ← juste arrêter, le hook gère l'expiration
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
}, [warning, secondsLeft]);

  if (!expired && !warning) return null;

  // ── Session expirée ──
  if (expired) {
    return (
      <div style={S.overlay}>
        <div style={S.modal}>
          <div style={S.iconWrap}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ff4757" strokeWidth="1.8">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <div style={S.title}>Session expirée</div>
          <div style={S.message}>
            Votre session a expiré pour raison d'inactivité.<br/>
            Veuillez vous reconnecter pour continuer.
          </div>
          <button style={S.btnPrimary} onClick={onLogout}>
            🔐 Se reconnecter
          </button>
        </div>
      </div>
    );
}

  // ── Avertissement ──
  return (
    <div style={S.overlay}>
      <div style={{...S.modal, borderColor:'rgba(245,166,35,0.30)'}}>
        <div style={{...S.iconWrap, background:'rgba(245,166,35,0.10)'}}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f5a623" strokeWidth="1.8">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <div style={{...S.title, color:'#f5a623'}}>Session bientôt expirée</div>
        <div style={S.message}>
          Votre session expirera dans
          <span style={{color:'#f5a623', fontWeight:700, margin:'0 6px', fontSize:18}}>
            {count}s
          </span>
          en raison d'inactivité.
        </div>

        {/* Barre de progression */}
        <div style={S.progressBar}>
          <div style={{
            ...S.progressFill,
            width: `${(count / 60) * 100}%`,
            background: count > 20 ? '#f5a623' : '#ff4757',
            transition: 'width 1s linear, background 0.3s',
          }}/>
        </div>

        <div style={S.btnRow}>
          <button style={S.btnSecondary} onClick={onLogout}>
            Se déconnecter
          </button>
          <button style={{...S.btnPrimary, background:'#f5a623'}} onClick={onContinue}>
            Continuer la session
          </button>
        </div>
      </div>
    </div>
  );
}

const S = {
  overlay:     { position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, backdropFilter:'blur(4px)' },
  modal:       { background:'#161b22', border:'1px solid rgba(255,71,87,0.25)', borderRadius:14, padding:'36px 40px', width:420, maxWidth:'90vw', textAlign:'center' },
  iconWrap:    { width:64, height:64, borderRadius:'50%', background:'rgba(255,71,87,0.10)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' },
  title:       { fontSize:18, fontWeight:700, color:'#ff4757', marginBottom:12 },
  message:     { fontSize:13, color:'#7a8394', lineHeight:1.7, marginBottom:24 },
  progressBar: { height:4, background:'rgba(255,255,255,0.08)', borderRadius:2, marginBottom:24, overflow:'hidden' },
  progressFill:{ height:'100%', borderRadius:2 },
  btnRow:      { display:'flex', gap:10, justifyContent:'center' },
  btnPrimary:  { padding:'10px 20px', background:'#ff4757', border:'none', borderRadius:8, color:'white', fontWeight:600, fontSize:13, cursor:'pointer' },
  btnSecondary:{ padding:'10px 20px', background:'transparent', border:'1px solid rgba(255,255,255,0.15)', borderRadius:8, color:'#7a8394', fontSize:13, cursor:'pointer' },
};