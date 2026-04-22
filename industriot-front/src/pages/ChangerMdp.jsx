import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function ChangerMdp() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm]     = useState({ nouveau:'', confirmer:'' });
  const [showNew, setShowNew] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError('');
    if (form.nouveau.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    if (form.nouveau !== form.confirmer) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    setLoading(true);
    try {
      await api.post('/changer-mdp', {
        user_id:     user.id,
        nouveau_mdp: form.nouveau,
      });
      // Met à jour le user en localStorage
      const updatedUser = { ...user, mdp_change: 1 };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      navigate('/');
      window.location.reload();
    } catch(e) {
      setError(e.response?.data?.message || 'Erreur');
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

        <div style={S.field}>
          <label style={S.label}>NOUVEAU MOT DE PASSE</label>
          <div style={S.inputWrap}>
            <input
              style={S.input}
              type={showNew ? 'text' : 'password'}
              value={form.nouveau}
              onChange={e => setForm({...form, nouveau: e.target.value})}
              placeholder="••••••••"
            />
            <button type="button" style={S.eyeBtn} onClick={() => setShowNew(!showNew)}>
  {showNew ? (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  )}
</button>
          </div>
        </div>

        <div style={S.field}>
          <label style={S.label}>CONFIRMER LE MOT DE PASSE</label>
          <div style={S.inputWrap}>
            <input
              style={S.input}
              type={showConf ? 'text' : 'password'}
              value={form.confirmer}
              onChange={e => setForm({...form, confirmer: e.target.value})}
              placeholder="••••••••"
            />
            <button type="button" style={S.eyeBtn} onClick={() => setShowConf(!showConf)}>
  {showConf ? (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  )}
</button>
          </div>
        </div>

        {/* Indicateur de force */}
        <div style={S.forceWrap}>
          {['Faible', 'Moyen', 'Fort'].map((label, i) => {
            const force = form.nouveau.length >= 10 ? 3 : form.nouveau.length >= 6 ? 2 : form.nouveau.length > 0 ? 1 : 0;
            return (
              <div key={i} style={{...S.forceBar, background: i < force ? ['#ff4757','#f5a623','#2ed573'][force-1] : 'rgba(255,255,255,0.08)'}}/>
            );
          })}
          <span style={S.forceLabel}>
            {form.nouveau.length === 0 ? '' : form.nouveau.length >= 10 ? 'Fort' : form.nouveau.length >= 6 ? 'Moyen' : 'Faible'}
          </span>
        </div>

        <button style={{...S.btn, opacity: loading ? 0.7 : 1}} onClick={handleSubmit} disabled={loading}>
          {loading ? 'Enregistrement...' : 'Définir mon mot de passe'}
        </button>

       
      </div>
    </div>
  );
}

const S = {
  bg:        { minHeight:'100vh', background:'#1c2129', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'sans-serif' },
  box:       { width:400, background:'#161b22', border:'1px solid rgba(255,255,255,0.12)', borderRadius:12, padding:'40px 36px' },
  logo:      { fontFamily:'monospace', fontSize:11, color:'#00d4aa', letterSpacing:3, marginBottom:8 },
  title:     { fontSize:20, fontWeight:600, color:'#e8eaf0', marginBottom:8 },
  sub:       { fontSize:12, color:'#7a8394', marginBottom:28, lineHeight:1.6 },
  field:     { marginBottom:16 },
  label:     { display:'block', fontSize:11, color:'#7a8394', letterSpacing:1, marginBottom:7, fontFamily:'monospace' },
  inputWrap: { position:'relative', display:'flex', alignItems:'center' },
  input:     { width:'100%', padding:'10px 40px 10px 14px', background:'#1c2129', border:'1px solid rgba(255,255,255,0.12)', borderRadius:7, color:'#e8eaf0', fontSize:13, outline:'none', boxSizing:'border-box' },
  eyeBtn:    { position:'absolute', right:10, background:'none', border:'none', cursor:'pointer', fontSize:16, padding:0 },
  forceWrap: { display:'flex', alignItems:'center', gap:6, marginBottom:20 },
  forceBar:  { flex:1, height:3, borderRadius:2, transition:'background 0.3s' },
  forceLabel:{ fontSize:11, fontFamily:'monospace', color:'#7a8394', width:40 },
  btn:       { width:'100%', padding:12, background:'#00d4aa', border:'none', borderRadius:7, color:'#0a0c0f', fontWeight:600, fontSize:14, cursor:'pointer', marginBottom:10 },
  btnLogout: { width:'100%', padding:10, background:'transparent', border:'1px solid rgba(255,71,87,0.25)', borderRadius:7, color:'#ff4757', fontSize:13, cursor:'pointer' },
  error:     { background:'rgba(255,71,87,0.1)', border:'1px solid rgba(255,71,87,0.3)', color:'#ff4757', padding:'10px 14px', borderRadius:7, fontSize:13, marginBottom:16 },
};