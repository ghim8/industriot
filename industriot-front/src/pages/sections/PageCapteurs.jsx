import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

const TYPE_CONFIG = {
  temperature: { label:'Température', color:'#f5a623', bg:'rgba(245,166,35,0.10)', border:'rgba(245,166,35,0.20)' },
  humidite:    { label:'Humidité',    color:'#0099ff', bg:'rgba(0,153,255,0.10)',  border:'rgba(0,153,255,0.20)'  },
  courant:     { label:'Courant',     color:'#00d4aa', bg:'rgba(0,212,170,0.10)',  border:'rgba(0,212,170,0.20)'  },
  vibration:   { label:'Vibration',   color:'#ff4757', bg:'rgba(255,71,87,0.10)',  border:'rgba(255,71,87,0.20)'  },
  gaz:         { label:'Gaz',         color:'#a855f7', bg:'rgba(168,85,247,0.10)', border:'rgba(168,85,247,0.20)' },
};

const TypeIcon = ({ type, size = 16, color }) => {
  const c = color || TYPE_CONFIG[type]?.color || '#7a8394';
  const icons = {
    temperature: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8">
        <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/>
      </svg>
    ),
    humidite: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8">
        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
      </svg>
    ),
    courant: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    ),
    vibration: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8">
        <polyline points="2 12 6 4 10 18 14 8 18 16 22 12"/>
      </svg>
    ),
    gaz: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8">
        <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>
      </svg>
    ),
  };
  return icons[type] || null;
};

export default function PageCapteurs() {
  const { user } = useAuth();
  const [capteurs, setCapteurs]   = useState([]);
  const [machines, setMachines]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editCapteur, setEditCapteur] = useState(null);
  const [form, setForm] = useState({
    machine_id:'', type:'temperature', unite:'°C', seuil_min:'', seuil_max:''
  });
  const [error, setError] = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = () => {
    Promise.all([api.get('/capteurs'), api.get('/machines')])
      .then(([c, m]) => { setCapteurs(c.data); setMachines(m.data); setLoading(false); });
  };

  const openCreate = () => {
    setEditCapteur(null);
    setForm({ machine_id:'', type:'temperature', unite:'°C', seuil_min:'', seuil_max:'' });
    setError('');
    setShowModal(true);
  };

  const openEdit = (c) => {
    setEditCapteur(c);
    setForm({ machine_id:c.machine_id, type:c.type, unite:c.unite, seuil_min:c.seuil_min??'', seuil_max:c.seuil_max??'' });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async () => {
    setError('');
    try {
      if (editCapteur) {
        await api.put(`/capteurs/${editCapteur.id}`, form);
      } else {
        await api.post('/capteurs', form);
      }
      setShowModal(false);
      fetchData();
    } catch(e) {
      setError(e.response?.data?.message || 'Erreur');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce capteur ?')) return;
    await api.delete(`/capteurs/${id}`);
    fetchData();
  };

  const toggleActif = async (capteur) => {
    await api.put(`/capteurs/${capteur.id}`, { actif: capteur.actif ? 0 : 1 });
    fetchData();
  };

  const uniteDefaut = { temperature:'°C', humidite:'%', courant:'A', vibration:'g', gaz:'ppm' };

  const parMachine = capteurs.reduce((acc, c) => {
    const nom = c.machine?.nom || 'Sans machine';
    if (!acc[nom]) acc[nom] = [];
    acc[nom].push(c);
    return acc;
  }, {});

  const totalActifs = capteurs.filter(c => c.actif).length;

  if (loading) return <div style={S.loading}>Chargement...</div>;

  return (
    <div>
      {/* Header */}
      <div style={S.header}>
        <div>
          <div style={S.headerTitle}>Capteurs</div>
          <div style={S.headerSub}>{totalActifs} actif(s) sur {capteurs.length} capteur(s)</div>
        </div>
        {user?.role !== 'operateur' && (
          <button style={S.btnPrimary} onClick={openCreate}>+ Nouveau capteur</button>
        )}
      </div>

      {/* Métriques */}
      <div style={S.metricsRow}>
        {Object.entries(TYPE_CONFIG).map(([type, cfg]) => {
          const count = capteurs.filter(c => c.type === type).length;
          return (
            <div key={type} style={S.mcard}>
              <div style={{...S.mcardBar, background: cfg.color}}/>
              <div style={S.mcardTop}>
                <TypeIcon type={type} size={18} />
                <span style={{...S.mcardLabel}}>{cfg.label.toUpperCase()}</span>
              </div>
              <div style={{...S.mcardVal, color: cfg.color}}>{count}</div>
              <div style={S.mcardSub}>capteur{count > 1 ? 's' : ''}</div>
            </div>
          );
        })}
      </div>

      {/* Capteurs par machine */}
      {Object.entries(parMachine).map(([machineName, items]) => (
        <div key={machineName} style={S.card}>
          <div style={S.cardHead}>
            <div style={S.cardHeadLeft}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7a8394" strokeWidth="1.8">
                <rect x="2" y="7" width="20" height="14" rx="2"/>
                <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
              </svg>
              <span style={S.cardTitle}>{machineName}</span>
            </div>
            <span style={S.cardSub}>{items.length} capteur(s)</span>
          </div>

          <table style={S.tbl}>
            <thead>
              <tr>
                <th style={S.th}>Type</th>
                <th style={S.th}>Unité</th>
                <th style={S.th}>Seuil min</th>
                <th style={S.th}>Seuil max</th>
                <th style={S.th}>Statut</th>
                {user?.role !== 'operateur' && <th style={S.th}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {items.map(c => {
                const cfg = TYPE_CONFIG[c.type] || TYPE_CONFIG.temperature;
                return (
                  <tr key={c.id} style={{ opacity: c.actif ? 1 : 0.45 }}>
                    <td style={S.td}>
                      <div style={S.typeCell}>
                        <div style={{...S.typeIcon, background: cfg.bg, border:`1px solid ${cfg.border}`}}>
                          <TypeIcon type={c.type} size={13} />
                        </div>
                        <span style={{...S.typeLabel, color: cfg.color}}>{cfg.label}</span>
                      </div>
                    </td>
                    <td style={{...S.td, fontFamily:'Segoe UI', color:'#7a8394'}}>{c.unite}</td>
                    <td style={{...S.td, fontFamily:'Segoe UI'}}>
                      {c.seuil_min !== null ? (
                        <span style={S.seuilTag}>{c.seuil_min} {c.unite}</span>
                      ) : <span style={S.dash}>—</span>}
                    </td>
                    <td style={{...S.td, fontFamily:'Segoe UI'}}>
                      {c.seuil_max !== null ? (
                        <span style={S.seuilTag}>{c.seuil_max} {c.unite}</span>
                      ) : <span style={S.dash}>—</span>}
                    </td>
                    <td style={S.td}>
                      {user?.role !== 'operateur' ? (
                        <button
                          style={{...S.statusBtn,
                            background: c.actif ? 'rgba(46,213,115,0.10)' : 'rgba(255,71,87,0.08)',
                            border: `1px solid ${c.actif ? 'rgba(46,213,115,0.25)' : 'rgba(255,71,87,0.20)'}`,
                            color: c.actif ? '#2ed573' : '#ff4757',
                          }}
                          onClick={() => toggleActif(c)}
                        >
                          {c.actif ? 'Actif' : 'Inactif'}
                        </button>
                      ) : (
                        <span style={{...S.statusBtn,
                          background: c.actif ? 'rgba(46,213,115,0.10)' : 'rgba(255,71,87,0.08)',
                          color: c.actif ? '#2ed573' : '#ff4757',
                          border: 'none', cursor:'default'
                        }}>
                          {c.actif ? 'Actif' : 'Inactif'}
                        </span>
                      )}
                    </td>
                    {user?.role !== 'operateur' && (
                      <td style={S.td}>
                        <div style={{display:'flex', gap:8}}>
                          <button style={S.btnEdit} onClick={() => openEdit(c)}>Modifier</button>
                          <button style={S.btnDel}  onClick={() => handleDelete(c.id)}>Supprimer</button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}

      {/* Modal */}
      {showModal && (
        <div style={S.overlay}>
          <div style={S.modal}>
            <div style={S.modalHead}>
              <span style={S.modalTitle}>{editCapteur ? 'Modifier capteur' : 'Nouveau capteur'}</span>
              <button style={S.modalClose} onClick={() => setShowModal(false)}>✕</button>
            </div>
            {error && <div style={S.error}>{error}</div>}

            {!editCapteur && (
              <Field label="MACHINE">
                <select style={S.input} value={form.machine_id}
                  onChange={e => setForm({...form, machine_id: e.target.value})}>
                  <option value="">— Choisir une machine —</option>
                  {machines.map(m => (
                    <option key={m.id} value={m.id}>{m.nom}</option>
                  ))}
                </select>
              </Field>
            )}

            <Field label="TYPE DE CAPTEUR">
              <select style={S.input} value={form.type}
                onChange={e => setForm({...form, type: e.target.value, unite: uniteDefaut[e.target.value]})}>
                {Object.entries(TYPE_CONFIG).map(([type, cfg]) => (
                  <option key={type} value={type}>{cfg.label}</option>
                ))}
              </select>
            </Field>

            <Field label="UNITÉ DE MESURE">
              <input style={S.input} value={form.unite}
                onChange={e => setForm({...form, unite: e.target.value})}
                placeholder="°C, %, A, g, ppm..." />
            </Field>

            <div style={S.grid2}>
              <Field label="SEUIL MINIMUM">
                <input style={S.input} type="number" value={form.seuil_min}
                  onChange={e => setForm({...form, seuil_min: e.target.value})}
                  placeholder="0" />
              </Field>
              <Field label="SEUIL MAXIMUM">
                <input style={S.input} type="number" value={form.seuil_max}
                  onChange={e => setForm({...form, seuil_max: e.target.value})}
                  placeholder="100" />
              </Field>
            </div>

            <div style={S.modalFooter}>
              <button style={S.btnSecondary} onClick={() => setShowModal(false)}>Annuler</button>
              <button style={S.btnPrimary} onClick={handleSubmit}>
                {editCapteur ? 'Enregistrer' : 'Créer'}
              </button>
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
  loading:      { color:'#7a8394', textAlign:'center', marginTop:40 },
  header:       { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 },
  headerTitle:  { fontSize:15, fontWeight:600, color:'#e8eaf0' },
  headerSub:    { fontSize:12, color:'#7a8394', marginTop:4 },
  metricsRow:   { display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:14, marginBottom:20 },
  mcard:        { background:'#161b22', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, padding:'16px 18px', position:'relative', overflow:'hidden' },
  mcardBar:     { position:'absolute', top:0, left:0, right:0, height:2 },
  mcardTop:     { display:'flex', alignItems:'center', gap:8, marginBottom:10 },
  mcardLabel:   { fontFamily:'Segoe UI', fontSize:9, color:'#4a5260', letterSpacing:1.5, textTransform:'uppercase' },
  mcardVal:     { fontSize:24, fontWeight:600, fontFamily:'Segoe UI' },
  mcardSub:     { fontSize:11, color:'#4a5260', marginTop:2 },
  card:         { background:'#161b22', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, padding:'20px 22px', marginBottom:16 },
  cardHead:     { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, paddingBottom:12, borderBottom:'1px solid rgba(255,255,255,0.05)' },
  cardHeadLeft: { display:'flex', alignItems:'center', gap:8 },
  cardTitle:    { fontFamily:'Segoe UI', fontSize:11, color:'#7a8394', letterSpacing:1, textTransform:'uppercase' },
  cardSub:      { fontSize:11, color:'#4a5260', fontFamily:'Segoe UI' },
  tbl:          { width:'100%', borderCollapse:'collapse' },
  th:           { textAlign:'left', fontFamily:'Segoe UI', fontSize:10, color:'#4a5260', letterSpacing:1, textTransform:'uppercase', paddingBottom:10, borderBottom:'1px solid rgba(255,255,255,0.06)', paddingRight:16 },
  td:           { padding:'12px 16px 12px 0', borderBottom:'1px solid rgba(255,255,255,0.04)', color:'#e8eaf0', fontSize:13 },
  typeCell:     { display:'flex', alignItems:'center', gap:10 },
  typeIcon:     { width:28, height:28, borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
  typeLabel:    { fontSize:12, fontWeight:500 },
  seuilTag:     { fontFamily:'Segoe UI', fontSize:12, color:'#e8eaf0' },
  dash:         { color:'#4a5260', fontFamily:'Segoe UI' },
  statusBtn:    { fontSize:11, fontFamily:'Segoe UI', padding:'4px 10px', borderRadius:5, cursor:'pointer' },
  btnEdit:      { padding:'5px 10px', background:'rgba(0,153,255,0.10)', border:'1px solid rgba(0,153,255,0.20)', borderRadius:6, color:'#0099ff', fontSize:11, cursor:'pointer' },
  btnDel:       { padding:'5px 10px', background:'rgba(255,71,87,0.08)', border:'1px solid rgba(255,71,87,0.20)', borderRadius:6, color:'#ff4757', fontSize:11, cursor:'pointer' },
  btnPrimary:   { padding:'8px 16px', background:'#00d4aa', border:'none', borderRadius:7, color:'#0a0c0f', fontWeight:600, fontSize:13, cursor:'pointer' },
  btnSecondary: { padding:'8px 16px', background:'transparent', border:'1px solid rgba(255,255,255,0.12)', borderRadius:7, color:'#7a8394', fontSize:13, cursor:'pointer' },
  overlay:      { position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 },
  modal:        { background:'#161b22', border:'1px solid rgba(255,255,255,0.12)', borderRadius:12, padding:'28px 32px', width:460, maxWidth:'90vw' },
  modalHead:    { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 },
  modalTitle:   { fontSize:15, fontWeight:600, color:'#e8eaf0' },
  modalClose:   { background:'none', border:'none', color:'#7a8394', fontSize:16, cursor:'pointer' },
  modalFooter:  { display:'flex', justifyContent:'flex-end', gap:10, marginTop:24 },
  grid2:        { display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 },
  label:        { display:'block', fontSize:11, color:'#7a8394', letterSpacing:1, marginBottom:7, fontFamily:'Segoe UI' },
  input:        { width:'100%', padding:'10px 14px', background:'#1c2129', border:'1px solid rgba(255,255,255,0.12)', borderRadius:7, color:'#e8eaf0', fontSize:13, outline:'none', boxSizing:'border-box' },
  error:        { background:'rgba(255,71,87,0.1)', border:'1px solid rgba(255,71,87,0.3)', color:'#ff4757', padding:'10px 14px', borderRadius:7, fontSize:13, marginBottom:16 },
};