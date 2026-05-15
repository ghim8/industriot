import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

// ─── Validation du mot de passe ───────────────────────────────────────────────
const validerMdp = (mdp) => {
  const regles = [
    { id:'len',     ok: mdp.length >= 12,                       label:'12 caractères minimum'              },
    { id:'upper',   ok: /[A-Z]/.test(mdp),                      label:'Au moins 1 majuscule'               },
    { id:'lower',   ok: /[a-z]/.test(mdp),                      label:'Au moins 1 minuscule'               },
    { id:'chiffre', ok: /[0-9]/.test(mdp),                      label:'Au moins 1 chiffre'                 },
    { id:'special', ok: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(mdp), label:'Au moins 1 caractère spécial (!@#$...)' },
  ];
  return regles;
};

const forceScore = (mdp) => validerMdp(mdp).filter(r => r.ok).length;

const forceConfig = (score) => {
  if (score === 0) return { label:'',        color:'transparent' };
  if (score <= 2)  return { label:'Faible',  color:'#ff4757' };
  if (score <= 3)  return { label:'Moyen',   color:'#f5a623' };
  if (score <= 4)  return { label:'Bien',    color:'#0099ff' };
  return             { label:'Fort',    color:'#2ed573' };
};

export default function ChangerMdp() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm]       = useState({ nouveau:'', confirmer:'' });
  const [showNew, setShowNew] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState(false);

  const regles  = validerMdp(form.nouveau);
  const score   = forceScore(form.nouveau);
  const force   = forceConfig(score);
  const toutOk  = regles.every(r => r.ok);

  const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');

  if (!toutOk) {
    setError('Le mot de passe ne respecte pas les règles de sécurité');
    return;
  }
  if (form.nouveau !== form.confirmer) {
    setError('Les mots de passe ne correspondent pas');
    return;
  }

  setLoading(true);
  try {
    await api.post('/changer-mdp', {
      utilisateur_id: user.id,
      nouveau_mdp:    form.nouveau,
    });

    // Mettre à jour mdp_change dans le localStorage ET le contexte
const updatedUser = { ...user, mdp_change: 1 };
localStorage.setItem('user', JSON.stringify(updatedUser));

// Mettre à jour le contexte Auth
updateUser(updatedUser);

// Rediriger directement vers le dashboard
navigate('/');
  } catch(err) {
    setError(err.response?.data?.message || 'Erreur lors du changement');
  } finally {
    setLoading(false);
  }
};

  return (
    <div style={S.bg}>
      <div style={S.box}>
        <div style={S.logo}>INDUSTRIOT</div>
        <h1 style={S.title}>Changement de mot de passe</h1>
        <p style={S.sub}>
          Pour des raisons de sécurité, vous devez définir un nouveau mot de passe
          lors de votre première connexion.
        </p>

        {error && <div style={S.error}>{error}</div>}

        {/* Nouveau mot de passe */}
        <div style={S.field}>
          <label style={S.label}>NOUVEAU MOT DE PASSE</label>
          <div style={S.inputWrap}>
            <input
              style={S.input}
              type={showNew ? 'text' : 'password'}
              value={form.nouveau}
              onChange={e => { setForm({...form, nouveau: e.target.value}); setTouched(true); }}
              placeholder="••••••••••••"
            />
            <button type="button" style={S.eyeBtn} onClick={() => setShowNew(!showNew)}>
              <EyeIcon open={showNew} />
            </button>
          </div>
        </div>

        {/* Barre de force */}
        {form.nouveau.length > 0 && (
          <div style={S.forceWrap}>
            {[1,2,3,4,5].map(i => (
              <div key={i} style={{
                ...S.forceBar,
                background: i <= score ? force.color : 'rgba(255,255,255,0.08)',
                transition: 'background 0.3s',
              }}/>
            ))}
            <span style={{ ...S.forceLabel, color: force.color }}>{force.label}</span>
          </div>
        )}

        {/* Checklist des règles */}
        {(touched || form.nouveau.length > 0) && (
          <div style={S.reglesBox}>
            {regles.map(r => (
              <div key={r.id} style={S.regleRow}>
                <div style={{ ...S.regleDot, background: r.ok ? '#2ed573' : 'rgba(255,255,255,0.08)', border: r.ok ? '1px solid #2ed573' : '1px solid rgba(255,255,255,0.12)' }}>
                  {r.ok && (
                    <svg width="8" height="8" viewBox="0 0 10 10" fill="none" stroke="#0a0c0f" strokeWidth="2.5">
                      <polyline points="1.5 5 4 7.5 8.5 2"/>
                    </svg>
                  )}
                </div>
                <span style={{ ...S.regleLabel, color: r.ok ? '#2ed573' : '#4a5260' }}>{r.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Confirmer */}
        <div style={{ ...S.field, marginTop: 16 }}>
          <label style={S.label}>CONFIRMER LE MOT DE PASSE</label>
          <div style={S.inputWrap}>
            <input
              style={{
                ...S.input,
                borderColor: form.confirmer && form.confirmer !== form.nouveau
                  ? 'rgba(255,71,87,0.40)'
                  : form.confirmer && form.confirmer === form.nouveau
                    ? 'rgba(46,213,115,0.40)'
                    : 'rgba(255,255,255,0.12)',
              }}
              type={showConf ? 'text' : 'password'}
              value={form.confirmer}
              onChange={e => setForm({...form, confirmer: e.target.value})}
              placeholder="••••••••••••"
            />
            <button type="button" style={S.eyeBtn} onClick={() => setShowConf(!showConf)}>
              <EyeIcon open={showConf} />
            </button>
            {/* Icône confirmation */}
            {form.confirmer.length > 0 && (
              <div style={S.confIcon}>
                {form.confirmer === form.nouveau ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2ed573" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ff4757" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                )}
              </div>
            )}
          </div>
          {form.confirmer && form.confirmer !== form.nouveau && (
            <div style={S.matchError}>Les mots de passe ne correspondent pas</div>
          )}
        </div>

        <button
          style={{
            ...S.btn,
            opacity:    (!toutOk || form.nouveau !== form.confirmer || loading) ? 0.5 : 1,
            cursor:     (!toutOk || form.nouveau !== form.confirmer || loading) ? 'not-allowed' : 'pointer',
          }}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Enregistrement...' : 'Définir mon mot de passe'}
        </button>
      </div>
    </div>
  );
}

function EyeIcon({ open }) {
  return open ? (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#7a8394" strokeWidth="1.8">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#7a8394" strokeWidth="1.8">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

const S = {
  bg:         { minHeight:'100vh', background:'#0d1117', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Segoe UI', sans-serif" },
  box:        { width:420, background:'#161b22', border:'1px solid rgba(255,255,255,0.10)', borderRadius:14, padding:'40px 36px' },
  logo:       { fontFamily:'monospace', fontSize:11, color:'#00d4aa', letterSpacing:3, marginBottom:10 },
  title:      { fontSize:20, fontWeight:600, color:'#e8eaf0', marginBottom:8 },
  sub:        { fontSize:12, color:'#7a8394', marginBottom:24, lineHeight:1.7 },
  field:      { marginBottom:12 },
  label:      { display:'block', fontSize:10, color:'#4a5260', letterSpacing:1.5, marginBottom:7, fontFamily:'monospace' },
  inputWrap:  { position:'relative', display:'flex', alignItems:'center' },
  input:      { width:'100%', padding:'11px 40px 11px 14px', background:'#1c2129', border:'1px solid rgba(255,255,255,0.12)', borderRadius:8, color:'#e8eaf0', fontSize:13, outline:'none', boxSizing:'border-box', transition:'border-color 0.2s' },
  eyeBtn:     { position:'absolute', right:36, background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', padding:0 },
  confIcon:   { position:'absolute', right:12, display:'flex', alignItems:'center' },
  matchError: { fontSize:11, color:'#ff4757', marginTop:5 },

  // Barre de force
  forceWrap:  { display:'flex', alignItems:'center', gap:5, marginBottom:12 },
  forceBar:   { flex:1, height:3, borderRadius:2 },
  forceLabel: { fontSize:11, fontFamily:'monospace', width:42, textAlign:'right' },

  // Checklist
  reglesBox:  { background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:8, padding:'12px 14px', marginBottom:4, display:'flex', flexDirection:'column', gap:8 },
  regleRow:   { display:'flex', alignItems:'center', gap:10 },
  regleDot:   { width:16, height:16, borderRadius:4, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all 0.2s' },
  regleLabel: { fontSize:12, transition:'color 0.2s' },

  btn:        { width:'100%', marginTop:20, padding:13, background:'linear-gradient(135deg, #00d4aa, #00b894)', border:'none', borderRadius:8, color:'#0a0c0f', fontWeight:700, fontSize:14, transition:'opacity 0.2s' },
  error:      { background:'rgba(255,71,87,0.08)', border:'1px solid rgba(255,71,87,0.25)', color:'#ff4757', padding:'10px 14px', borderRadius:8, fontSize:12, marginBottom:18 },
};