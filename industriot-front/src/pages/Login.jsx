import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const { login }  = useAuth();
  const navigate   = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate('/');
    } catch {
      setError('Email ou mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.page}>
      {/* Panneau gauche */}
      <div style={S.left}>
        <div style={S.leftInner}>
          {/* Nom principal */}
          <div style={S.brandName}>INDUSTRIOT</div>
          <div style={S.brandSub}>Supervision IoT Industrielle</div>

          {/* Séparateur */}
          <div style={S.sep}/>

          {/* Description */}
          <div style={S.desc}>
            Plateforme unifiée de monitoring, contrôle et analyse de vos équipements industriels en temps réel.
          </div>

          {/* Stats */}
          <div style={S.statsRow}>
            {[
              { val:'99.9%', label:'Disponibilité' },
              { val:'<1s',   label:'Latence'       },
              { val:'24/7',  label:'Monitoring'    },
            ].map(s => (
              <div key={s.label} style={S.statItem}>
                <div style={S.statVal}>{s.val}</div>
                <div style={S.statLabel}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Features */}
          <div style={S.features}>
            {[
              { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00d4aa" strokeWidth="1.8"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>, label:'Mesures temps réel' },
              { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00d4aa" strokeWidth="1.8"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>, label:'Alertes intelligentes' },
              { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00d4aa" strokeWidth="1.8"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/></svg>, label:'Contrôle des relais' },
              { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00d4aa" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>, label:'Gestion des équipes' },
            ].map(f => (
              <div key={f.label} style={S.featureItem}>
                <div style={S.featureIcon}>{f.icon}</div>
                <span style={S.featureLabel}>{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={S.divider}/>

      {/* Panneau droit */}
      <div style={S.right}>
        <div style={S.formWrap}>
          <div style={S.formHeader}>
            <div style={S.formLogoSmall}>INDUSTRIOT</div>
            <h2 style={S.formTitle}>Connexion</h2>
            <p style={S.formSub}>Accédez à votre espace de supervision</p>
          </div>

          {error && (
            <div style={S.errorBox}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ff4757" strokeWidth="2" style={{flexShrink:0}}>
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{width:'100%'}}>
            <div style={S.fieldWrap}>
              <label style={S.label}>ADRESSE EMAIL</label>
              <div style={S.inputGroup}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#4a5260" strokeWidth="1.8" style={S.inputSvg}>
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                <input
                  style={S.input}
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                                    required
                />
              </div>
            </div>

            <div style={S.fieldWrap}>
              <label style={S.label}>MOT DE PASSE</label>
              <div style={S.inputGroup}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#4a5260" strokeWidth="1.8" style={S.inputSvg}>
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <input
                  style={S.input}
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button type="button" style={S.eyeBtn} onClick={() => setShowPwd(!showPwd)}>
                  {showPwd ? (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7a8394" strokeWidth="1.8">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7a8394" strokeWidth="1.8">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              style={{...S.submitBtn, opacity: loading ? 0.75 : 1}}
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <span style={{display:'flex', alignItems:'center', justifyContent:'center', gap:10}}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                    style={{animation:'spin 0.8s linear infinite'}}>
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                  Connexion en cours...
                </span>
              ) : (
                <span style={{display:'flex', alignItems:'center', justifyContent:'center', gap:8}}>
                  Se connecter
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="5" y1="12" x2="19" y2="12"/>
                    <polyline points="12 5 19 12 12 19"/>
                  </svg>
                </span>
              )}
            </button>
          </form>

          <div style={S.formFooter}>
            <div style={S.footerLine}/>
            <span style={S.footerText}>Accès restreint · Personnel autorisé uniquement</span>
            <div style={S.footerLine}/>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
        input::placeholder { color:#3a4050; }
        input:focus { border-color:rgba(0,212,170,0.40) !important; box-shadow:0 0 0 3px rgba(0,212,170,0.06); outline:none; }
      `}</style>
    </div>
  );
}

const S = {
  page:        { minHeight:'100vh', display:'flex', background:'#0d1117', fontFamily:"'Segoe UI', sans-serif", overflow:'hidden' },

  // Gauche
  left:         { flex:1, background:'linear-gradient(160deg, #0a0d12 0%, #0d1117 50%, #111820 100%)', display:'flex', alignItems:'center', justifyContent:'center', borderRight:'1px solid rgba(0,212,170,0.08)', position:'relative' },
  leftInner:    { padding:'52px 56px', display:'flex', flexDirection:'column', maxWidth:480 },

  brandName:    { fontSize:52, fontWeight:800, color:'#e8eaf0', letterSpacing:8, fontFamily:'monospace', marginBottom:10, textAlign:'center' },
  brandSub:     { fontSize:13, color:'#00d4aa', fontFamily:'monospace', letterSpacing:3, textAlign:'center', marginBottom:36 },

  sep:          { width:60, height:2, background:'linear-gradient(90deg, transparent, #00d4aa, transparent)', margin:'0 auto 32px' },

  desc:         { fontSize:13, color:'#5a6270', lineHeight:1.8, marginBottom:36, textAlign:'center' },

  statsRow:     { display:'flex', gap:0, marginBottom:32, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:10, overflow:'hidden' },
  statItem:     { flex:1, padding:'16px 0', textAlign:'center', borderRight:'1px solid rgba(255,255,255,0.05)' },
  statVal:      { fontSize:20, fontWeight:700, color:'#00d4aa', fontFamily:'monospace', marginBottom:4 },
  statLabel:    { fontSize:10, color:'#4a5260', letterSpacing:1, textTransform:'uppercase' },

  features:     { display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 },
  featureItem:  { display:'flex', alignItems:'center', gap:10, padding:'10px 14px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:8 },
  featureIcon:  { width:26, height:26, borderRadius:6, background:'rgba(0,212,170,0.08)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
  featureLabel: { fontSize:12, color:'#7a8394' },

  divider:      { width:1, background:'linear-gradient(180deg, transparent, rgba(0,212,170,0.15), rgba(0,212,170,0.15), transparent)' },

  // Droite
  right: { width:560, background:'#0d1117', display:'flex', alignItems:'center', justifyContent:'flex-start', padding:'40px 60px' },
formWrap: { width:'100%', maxWidth:460, display:'flex', flexDirection:'column', alignItems:'center' },

  formHeader:   { width:'100%', marginBottom:32, textAlign:'center' },
  formLogoSmall:{ display:'none' },
  formTitle:    { fontSize:42, fontWeight:800, color:'#e8eaf0', letterSpacing:6, fontFamily:'monospace', marginBottom:10, textAlign:'center' },
  formSub:      { fontSize:13, color:'#00d4aa', fontFamily:'monospace', letterSpacing:2, textAlign:'center', marginBottom:0 },

  errorBox:     { width:'100%', display:'flex', alignItems:'center', gap:8, background:'rgba(255,71,87,0.07)', border:'1px solid rgba(255,71,87,0.20)', color:'#ff4757', padding:'10px 14px', borderRadius:8, fontSize:12, marginBottom:20, boxSizing:'border-box' },

  fieldWrap:    { width:'100%', marginBottom:18 },
  label:        { display:'block', fontSize:10, color:'#4a5260', letterSpacing:1.5, marginBottom:8, fontFamily:'monospace' },
  inputGroup:   { position:'relative', display:'flex', alignItems:'center' },
  inputSvg:     { position:'absolute', left:14, flexShrink:0, pointerEvents:'none' },
  input:        { width:'100%', padding:'12px 42px', background:'#161b22', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, color:'#e8eaf0', fontSize:13, outline:'none', boxSizing:'border-box', transition:'border-color 0.2s, box-shadow 0.2s' },
  eyeBtn:       { position:'absolute', right:14, background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', padding:0 },

  submitBtn:    { width:'100%', marginTop:8, padding:'13px', background:'linear-gradient(135deg, #00d4aa 0%, #00b894 100%)', border:'none', borderRadius:8, color:'#0a0c0f', fontWeight:700, fontSize:14, cursor:'pointer', transition:'opacity 0.2s', letterSpacing:0.3 },

  formFooter:   { display:'flex', alignItems:'center', gap:12, marginTop:28, width:'100%' },
  footerLine:   { flex:1, height:1, background:'rgba(255,255,255,0.06)' },
  footerText:   { fontSize:10, color:'#3a4050', fontFamily:'segeo UI', whiteSpace:'nowrap' },
};