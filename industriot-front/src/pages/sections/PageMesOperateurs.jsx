import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

export default function PageMesOperateurs() {
  const { user } = useAuth();
  const [operateurs, setOperateurs] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [form, setForm] = useState({ nom:'', email:'', mot_de_passe:'', initiales:'' });
  const [error, setError] = useState('');

  useEffect(() => { fetchOperateurs(); }, []);

  const fetchOperateurs = () => {
    api.get(`/mes-operateurs?chef_id=${user.id}`).then(r => {
      setOperateurs(r.data);
      setLoading(false);
    });
  };

  const handleSubmit = async () => {
    setError('');
    try {
      await api.post('/utilisateurs', { ...form, role:'operateur', statut:'ACTIF' });
      setShowModal(false);
      setForm({ nom:'', email:'', mot_de_passe:'' });
      fetchOperateurs();
    } catch(e) {
      setError(e.response?.data?.message || 'Erreur');
    }
  };

  if (loading) return <div style={S.loading}>Chargement...</div>;

  return (
    <div>
      <div style={S.header}>
        <div>
          <div style={S.headerTitle}>Mes opérateurs</div>
          <div style={S.headerSub}>{operateurs.length} opérateur(s) sur vos machines</div>
        </div>
        <button style={S.btnPrimary} onClick={() => setShowModal(true)}>+ Ajouter opérateur</button>
      </div>

      {operateurs.length === 0 ? (
        <div style={S.emptyState}>Aucun opérateur affecté à vos machines</div>
      ) : (
        <div style={S.grid}>
          {operateurs.map(u => (
            <div key={u.id} style={S.card}>
              <div style={S.avatar}>{u.initiales}</div>
              <div style={S.nom}>{u.nom}</div>
              <div style={S.email}>{u.email}</div>
              <span style={{...S.pill, ...(u.statut==='ACTIF' ? S.pillOk : S.pillOff)}}>
                {u.statut}
              </span>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div style={S.overlay}>
          <div style={S.modal}>
            <div style={S.modalHead}>
              <span style={S.modalTitle}>Ajouter un opérateur</span>
              <button style={S.modalClose} onClick={() => setShowModal(false)}>✕</button>
            </div>
            {error && <div style={S.error}>{error}</div>}
            <div style={S.grid2}>
              <Field label="NOM COMPLET">
                <input style={S.input} value={form.nom} onChange={e => setForm({...form, nom:e.target.value})} placeholder="Tarek Ben Ali" />
              </Field>
              
            </div>
            <Field label="EMAIL">
              <input style={S.input} type="email" value={form.email} onChange={e => setForm({...form, email:e.target.value})} placeholder="t.benali@usine.local" />
            </Field>
            <Field label="MOT DE PASSE">
              <input style={S.input} type="password" value={form.mot_de_passe} onChange={e => setForm({...form, mot_de_passe:e.target.value})} placeholder="••••••••" />
            </Field>
            <div style={S.modalFooter}>
              <button style={S.btnSecondary} onClick={() => setShowModal(false)}>Annuler</button>
              <button style={S.btnPrimary} onClick={handleSubmit}>Créer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom:14 }}>
      <label style={S.label}>{label}</label>
      {children}
    </div>
  );
}

const S = {
  loading:     { color:'#7a8394', textAlign:'center', marginTop:40 },
  header:      { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 },
  headerTitle: { fontSize:15, fontWeight:600, color:'#e8eaf0' },
  headerSub:   { fontSize:12, color:'#7a8394', marginTop:4 },
  emptyState:  { color:'#4a5260', textAlign:'center', marginTop:60, fontSize:13 },
  grid:        { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 },
  card:        { background:'#161b22', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, padding:'24px 20px', textAlign:'center' },
  avatar:      { width:48, height:48, borderRadius:'50%', background:'rgba(245,166,35,0.15)', border:'1px solid rgba(245,166,35,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontFamily:'Segoe UI', color:'#f5a623', margin:'0 auto 12px' },
  nom:         { fontSize:14, fontWeight:600, color:'#e8eaf0', marginBottom:4 },
  email:       { fontSize:11, color:'#7a8394', fontFamily:'Segoe UI', marginBottom:12 },
  pill:        { display:'inline-flex', fontFamily:'Segoe UI', fontSize:10, padding:'3px 8px', borderRadius:4 },
  pillOk:      { background:'rgba(46,213,115,0.15)', color:'#2ed573' },
  pillOff:     { background:'rgba(255,71,87,0.15)',  color:'#ff4757' },
  btnPrimary:  { padding:'8px 16px', background:'#00d4aa', border:'none', borderRadius:7, color:'#0a0c0f', fontWeight:600, fontSize:13, cursor:'pointer' },
  btnSecondary:{ padding:'8px 16px', background:'transparent', border:'1px solid rgba(255,255,255,0.12)', borderRadius:7, color:'#7a8394', fontSize:13, cursor:'pointer' },
  overlay:     { position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 },
  modal:       { background:'#161b22', border:'1px solid rgba(255,255,255,0.12)', borderRadius:12, padding:'28px 32px', width:480, maxWidth:'90vw' },
  modalHead:   { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 },
  modalTitle:  { fontSize:15, fontWeight:600, color:'#e8eaf0' },
  modalClose:  { background:'none', border:'none', color:'#7a8394', fontSize:16, cursor:'pointer' },
  modalFooter: { display:'flex', justifyContent:'flex-end', gap:10, marginTop:24 },
  grid2:       { display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 },
  label:       { display:'block', fontSize:11, color:'#7a8394', letterSpacing:1, marginBottom:7, fontFamily:'Segoe UI' },
  input:       { width:'100%', padding:'10px 14px', background:'#1c2129', border:'1px solid rgba(255,255,255,0.12)', borderRadius:7, color:'#e8eaf0', fontSize:13, outline:'none', boxSizing:'border-box' },
  error:       { background:'rgba(255,71,87,0.1)', border:'1px solid rgba(255,71,87,0.3)', color:'#ff4757', padding:'10px 14px', borderRadius:7, fontSize:13, marginBottom:16 },
};