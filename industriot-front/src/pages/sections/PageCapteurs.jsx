import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

const TYPE_CONFIG = {
  temperature: { label:'Température', color:'#f5a623', bg:'rgba(245,166,35,0.10)', border:'rgba(245,166,35,0.20)' },
  humidite:    { label:'Humidité',    color:'#0099ff', bg:'rgba(0,153,255,0.10)',  border:'rgba(0,153,255,0.20)'  },
  courant:     { label:'Courant',     color:'#00d4aa', bg:'rgba(0,212,170,0.10)',  border:'rgba(0,212,170,0.20)'  },
  vibration:   { label:'Vibration',   color:'#ff4757', bg:'rgba(255,71,87,0.10)',  border:'rgba(255,71,87,0.20)'  },
  gaz:         { label:'Gaz',         color:'#a855f7', bg:'rgba(168,85,247,0.10)', border:'rgba(168,85,247,0.20)' },
  pression:    { label:'Pression',    color:'#2ed573', bg:'rgba(46,213,115,0.10)', border:'rgba(46,213,115,0.20)' },
};

const TypeIcon = ({ type, size=13 }) => {
  const color = TYPE_CONFIG[type]?.color || '#7a8394';
  const icons = {
    temperature: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg>,
    humidite:    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>,
    courant:     <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
    vibration:   <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8"><polyline points="2 12 6 4 10 18 14 8 18 16 22 12"/></svg>,
    gaz:         <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/></svg>,
    pression:    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>,
  };
  return icons[type] || null;
};

export default function PageCapteurs() {
  const { user } = useAuth();
  const [groupes, setGroupes]     = useState([]);
  const [machines, setMachines]   = useState([]);
  const [machineSelected, setMachineSelected] = useState('all');
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editCapteur, setEditCapteur] = useState(null);
  const [form, setForm] = useState({ machine_id:'', type:'temperature', unite:'°C', seuil_min:'', seuil_max:'' });
  const [error, setError] = useState('');
  const [showSeuilModal, setShowSeuilModal] = useState(false);
const [seuilCapteur, setSeuilCapteur]     = useState(null);
const [seuilForm, setSeuilForm]           = useState({ seuil_min:'', seuil_max:'' });
const [seuilLoading, setSeuilLoading]     = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = (machineId = 'all') => {
    const params = machineId !== 'all' ? `?machine_id=${machineId}` : '';
    Promise.all([
      api.get('/capteurs'),
      api.get('/machines'),
    ]).then(([c, m]) => {
      setGroupes(c.data);
      setMachines(m.data);
      setLoading(false);
    });
  };
  const openSeuilRapide = (c) => {
    setSeuilCapteur(c);
    setSeuilForm({
        seuil_min: c.seuil_min ?? '',
        seuil_max: c.seuil_max ?? '',
    });
    setShowSeuilModal(true);
};
const handleSeuilSubmit = async () => {
    setSeuilLoading(true);
    try {
        await api.put(`/capteurs/${seuilCapteur.id}`, {
            seuil_min: seuilForm.seuil_min !== '' ? parseFloat(seuilForm.seuil_min) : null,
            seuil_max: seuilForm.seuil_max !== '' ? parseFloat(seuilForm.seuil_max) : null,
        });
        setShowSeuilModal(false);
        fetchData(machineSelected);
    } catch(e) {
        alert(e.response?.data?.message || 'Erreur');
    } finally {
        setSeuilLoading(false);
    }
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
        await api.put(`/capteurs/${editCapteur.id}`, {
            seuil_min: form.seuil_min !== '' ? parseFloat(form.seuil_min) : null,
            seuil_max: form.seuil_max !== '' ? parseFloat(form.seuil_max) : null,
            unite:     form.unite,
            actif:     form.actif ?? 1,
        });
        setShowModal(false);
        fetchData(machineSelected);
        // Feedback visuel
        alert(`✅ Seuils mis à jour et envoyés à l'ESP32 via MQTT`);
    } catch(e) {
        setError(e.response?.data?.message || 'Erreur');
    }
};

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce capteur ?')) return;
    await api.delete(`/capteurs/${id}`);
    fetchData(machineSelected);
  };

  const toggleActif = async (capteur) => {
    await api.put(`/capteurs/${capteur.id}`, { actif: capteur.actif ? 0 : 1 });
    fetchData(machineSelected);
  };

  const totalCapteurs = groupes.reduce((acc, g) => acc + (g.capteurs?.length || 0), 0);
  const totalActifs   = groupes.reduce((acc, g) => acc + (g.capteurs?.filter(c => c.actif).length || 0), 0);

  if (loading) return <div style={S.loading}>Chargement...</div>;

  return (
    <div>
      {/* Header */}
      <div style={S.header}>
        <div>
          <div style={S.headerTitle}>Capteurs</div>
          <div style={S.headerSub}>{totalActifs} actif(s) sur {totalCapteurs} capteur(s)</div>
        </div>
        <div style={{display:'flex', gap:10, alignItems:'center'}}>
          {/* Filtre machine */}
          <select style={S.select} value={machineSelected}
            onChange={e => { setMachineSelected(e.target.value); fetchData(e.target.value); }}>
            <option value="all">Toutes les machines</option>
            {machines.map(m => <option key={m.id} value={m.id}>{m.nom}</option>)}
          </select>
        </div>
      </div>

      {/* Métriques par type */}
      <div style={S.metricsRow}>
        {Object.entries(TYPE_CONFIG).map(([type, cfg]) => {
          const count = groupes.reduce((acc, g) => acc + (g.capteurs?.filter(c => c.type === type).length || 0), 0);
          return (
            <div key={type} style={S.mcard}>
              <div style={{...S.mcardBar, background: cfg.color}}/>
              <div style={{display:'flex', alignItems:'center', gap:6, marginBottom:8}}>
                <TypeIcon type={type} size={14}/>
                <span style={S.mcardLabel}>{cfg.label}</span>
              </div>
              <div style={{...S.mcardVal, color: cfg.color}}>{count}</div>
            </div>
          );
        })}
      </div>

      {/* Groupes par actionneur */}
      {/* Groupes par machine → actionneur */}
{(() => {
  // Regrouper les groupes par machine
  const parMachine = groupes.reduce((acc, g) => {
    const machineName = g.capteurs?.[0]?.machine?.nom || 'Machine inconnue';
    const machineId   = g.capteurs?.[0]?.machine?.id  || 0;
    if (!acc[machineId]) acc[machineId] = { nom: machineName, groupes: [] };
    acc[machineId].groupes.push(g);
    return acc;
  }, {});

  return Object.entries(parMachine).map(([machineId, machine]) => (
    <div key={machineId} style={{ marginBottom:24 }}>
      {/* En-tête machine */}
      <div style={S.machineHeader}>
        <div style={S.machineHeaderLeft}>
          <div style={S.machineIcon}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00d4aa" strokeWidth="2">
              <rect x="2" y="7" width="20" height="14" rx="2"/>
              <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
            </svg>
          </div>
          <span style={S.machineName}>{machine.nom} </span>
          <span style={S.machineCount}>
            
          </span>
        </div>
      </div>

      {/* Actionneurs de cette machine */}
      {machine.groupes.map((groupe, gIdx) => (
        <div key={gIdx} style={{...S.groupCard, marginLeft:16, borderLeft:'2px solid rgba(0,212,170,0.15)'}}>
          <div style={S.groupHead}>
            <div style={S.groupLeft}>
              <div style={S.breadcrumb}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#00d4aa" strokeWidth="2">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3"/>
                </svg>
                <span style={S.breadActionneur}>
                  {groupe.actionneur ? groupe.actionneur.nom : 'Sans actionneur'}
                </span>
                {groupe.actionneur && (
                  <span style={S.actTypeBadge}>{groupe.actionneur.type}</span>
                )}
              </div>
            </div>
            <span style={S.groupCount}>{groupe.capteurs?.length || 0} capteur(s)</span>
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
              {(groupe.capteurs || []).map(c => {
                const cfg = TYPE_CONFIG[c.type] || { color:'#7a8394', label:c.type, bg:'rgba(255,255,255,0.05)', border:'rgba(255,255,255,0.10)' };
                return (
                  <tr key={c.id} style={{ opacity: c.actif ? 1 : 0.45 }}>
                    <td style={S.td}>
                      <div style={S.typeCell}>
                        <div style={{...S.typeIcon, background:cfg.bg, border:`1px solid ${cfg.border}`}}>
                          <TypeIcon type={c.type} size={13}/>
                        </div>
                        <span style={{...S.typeLabel, color:cfg.color}}>{cfg.label}</span>
                      </div>
                    </td>
                    <td style={{...S.td, color:'#7a8394', fontSize:12}}>{c.unite}</td>
                    <td style={S.td}>
                      {c.seuil_min !== null ? <span style={S.seuilTag}>{c.seuil_min} {c.unite}</span> : <span style={S.dash}>—</span>}
                    </td>
                    <td style={S.td}>
                      {c.seuil_max !== null ? <span style={S.seuilTag}>{c.seuil_max} {c.unite}</span> : <span style={S.dash}>—</span>}
                    </td>
                    <td style={S.td}>
                      {user?.role !== 'operateur' ? (
                        <button style={{...S.statusBtn,
                          background: c.actif ? 'rgba(46,213,115,0.10)' : 'rgba(255,71,87,0.08)',
                          border:`1px solid ${c.actif ? 'rgba(46,213,115,0.25)' : 'rgba(255,71,87,0.20)'}`,
                          color: c.actif ? '#2ed573' : '#ff4757',
                        }} onClick={() => toggleActif(c)}>
                          {c.actif ? 'Actif' : 'Inactif'}
                        </button>
                      ) : (
                        <span style={{fontSize:12, color: c.actif ? '#2ed573' : '#ff4757'}}>
                          {c.actif ? 'Actif' : 'Inactif'}
                        </span>
                      )}
                    </td>
                    {user?.role !== 'operateur' && (
                      <td style={S.td}>
                        <div style={{display:'flex', gap:6}}>
                          <button style={S.btnEdit} onClick={() => openEdit(c)}>Modifier</button>
                            {/* Bouton seuils rapide */}
            <button style={{
                ...S.btnEdit,
                background:'rgba(245,166,35,0.10)',
                borderColor:'rgba(245,166,35,0.20)',
                color:'#f5a623',
            }} onClick={() => openSeuilRapide(c)}>
                ⚠ Seuils
            </button>
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
    </div>
  ));
})()}

      {/* Modal modifier capteur */}
      {showSeuilModal && seuilCapteur && (
    <div style={S.overlay}>
        <div style={{...S.modal, width:360}}>
            <div style={S.modalHead}>
                <span style={S.modalTitle}>
                    ⚠ Seuils — {seuilCapteur.type}
                </span>
                <button style={S.modalClose} onClick={() => setShowSeuilModal(false)}>✕</button>
            </div>

            {/* Info MQTT */}
            <div style={{
                padding:'8px 12px',
                background:'rgba(245,166,35,0.06)',
                border:'1px solid rgba(245,166,35,0.20)',
                borderRadius:7, fontSize:11,
                color:'#f5a623', marginBottom:16,
            }}>
                📡 Les nouveaux seuils seront envoyés à l'ESP32 via MQTT
            </div>

            <div style={S.grid2}>
                <div style={{marginBottom:14}}>
                    <label style={S.label}>SEUIL MIN ({seuilCapteur.unite})</label>
                    <input style={S.input} type="number" step="0.1"
                        value={seuilForm.seuil_min}
                        onChange={e => setSeuilForm({...seuilForm, seuil_min: e.target.value})}
                        placeholder="0"/>
                </div>
                <div style={{marginBottom:14}}>
                    <label style={S.label}>SEUIL MAX ({seuilCapteur.unite})</label>
                    <input style={S.input} type="number" step="0.1"
                        value={seuilForm.seuil_max}
                        onChange={e => setSeuilForm({...seuilForm, seuil_max: e.target.value})}
                        placeholder="100"/>
                </div>
            </div>

            {/* Aperçu */}
            <div style={{
                padding:'8px 12px',
                background:'rgba(255,255,255,0.03)',
                borderRadius:6, fontSize:12,
                color:'#7a8394', marginBottom:16,
            }}>
                Valeur actuelle : <strong style={{color:'#e8eaf0'}}>
                    {seuilCapteur.seuil_min} → {seuilCapteur.seuil_max} {seuilCapteur.unite}
                </strong><br/>
                Nouvelle valeur : <strong style={{color:'#f5a623'}}>
                    {seuilForm.seuil_min || '—'} → {seuilForm.seuil_max || '—'} {seuilCapteur.unite}
                </strong>
            </div>

            <div style={S.modalFooter}>
                <button style={S.btnSecondary} onClick={() => setShowSeuilModal(false)}>
                    Annuler
                </button>
                <button style={{
                    ...S.btnPrimary,
                    background: seuilLoading ? '#4a5260' : '#f5a623',
                    color: '#0a0c0f',
                }} onClick={handleSeuilSubmit} disabled={seuilLoading}>
                    {seuilLoading ? 'Envoi...' : '📡 Appliquer et envoyer'}
                </button>
            </div>
        </div>
    </div>
)}
      {showModal && (
        <div style={S.overlay}>
          <div style={S.modal}>
            <div style={S.modalHead}>
              <span style={S.modalTitle}>Modifier capteur</span>
              <button style={S.modalClose} onClick={() => setShowModal(false)}>✕</button>
            </div>
            {error && <div style={S.error}>{error}</div>}
            <Field label="TYPE">
              <select style={S.input} value={form.type} onChange={e => setForm({...form, type:e.target.value})}>
                {Object.entries(TYPE_CONFIG).map(([t, cfg]) => (
                  <option key={t} value={t}>{cfg.label}</option>
                ))}
              </select>
            </Field>
            <Field label="UNITÉ">
              <input style={S.input} value={form.unite} onChange={e => setForm({...form, unite:e.target.value})}/>
            </Field>
            <div style={S.grid2}>
              <Field label="SEUIL MIN">
                <input style={S.input} type="number" value={form.seuil_min} onChange={e => setForm({...form, seuil_min:e.target.value})}/>
              </Field>
              <Field label="SEUIL MAX">
                <input style={S.input} type="number" value={form.seuil_max} onChange={e => setForm({...form, seuil_max:e.target.value})}/>
              </Field>
            </div>
            <div style={S.modalFooter}>
              <button style={S.btnSecondary} onClick={() => setShowModal(false)}>Annuler</button>
              <button style={S.btnPrimary} onClick={handleSubmit}>Enregistrer</button>
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
      <label style={{ display:'block', fontSize:11, color:'#7a8394', letterSpacing:1, marginBottom:7 }}>{label}</label>
      {children}
    </div>
  );
}

const S = {
  loading:       { color:'#7a8394', textAlign:'center', marginTop:40 },
  header:        { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 },
  headerTitle:   { fontSize:15, fontWeight:600, color:'#e8eaf0' },
  headerSub:     { fontSize:12, color:'#7a8394', marginTop:4 },
  select:        { padding:'7px 12px', background:'#1c2129', border:'1px solid rgba(255,255,255,0.12)', borderRadius:7, color:'#e8eaf0', fontSize:12, cursor:'pointer', outline:'none' },
  metricsRow:    { display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:10, marginBottom:20 },
  mcard:         { background:'#161b22', border:'1px solid rgba(255,255,255,0.07)', borderRadius:8, padding:'12px 14px', position:'relative', overflow:'hidden' },
  mcardBar:      { position:'absolute', top:0, left:0, right:0, height:2 },
  mcardLabel:    { fontSize:10, color:'#4a5260', textTransform:'uppercase', fontWeight:500 },
  mcardVal:      { fontSize:22, fontWeight:700 },
  groupCard:     { background:'#161b22', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, padding:'16px 20px', marginBottom:14 },
  groupHead:     { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14, paddingBottom:12, borderBottom:'1px solid rgba(255,255,255,0.05)' },
  groupLeft:     { display:'flex', alignItems:'center', gap:10 },
  breadcrumb:    { display:'flex', alignItems:'center', gap:6 },
  breadMachine:  { fontSize:12, color:'#7a8394' },
  breadSep:      { fontSize:14, color:'#4a5260' },
  breadActionneur:{ fontSize:13, fontWeight:600, color:'#e8eaf0' },
  actTypeBadge:  { fontSize:10, color:'#00d4aa', background:'rgba(0,212,170,0.08)', border:'1px solid rgba(0,212,170,0.18)', borderRadius:4, padding:'2px 7px', marginLeft:4 },
  groupCount:    { fontSize:11, color:'#4a5260' },
  tbl:           { width:'100%', borderCollapse:'collapse' },
  th:            { textAlign:'left', fontSize:10, color:'#4a5260', fontWeight:500, paddingBottom:8, borderBottom:'1px solid rgba(255,255,255,0.06)', textTransform:'uppercase', letterSpacing:0.5, paddingRight:12 },
  td:            { padding:'10px 12px 10px 0', borderBottom:'1px solid rgba(255,255,255,0.04)', color:'#e8eaf0', fontSize:13 },
  typeCell:      { display:'flex', alignItems:'center', gap:8 },
  typeIcon:      { width:26, height:26, borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
  typeLabel:     { fontSize:12, fontWeight:500 },
  seuilTag:      { fontSize:12, color:'#e8eaf0' },
  dash:          { color:'#4a5260' },
  statusBtn:     { fontSize:11, padding:'4px 10px', borderRadius:5, cursor:'pointer' },
  btnEdit:       { padding:'4px 10px', background:'rgba(0,153,255,0.10)', border:'1px solid rgba(0,153,255,0.20)', borderRadius:5, color:'#0099ff', fontSize:11, cursor:'pointer' },
  btnDel:        { padding:'4px 10px', background:'rgba(255,71,87,0.08)', border:'1px solid rgba(255,71,87,0.18)', borderRadius:5, color:'#ff4757', fontSize:11, cursor:'pointer' },
  empty:         { color:'#4a5260', textAlign:'center', padding:'40px 0', fontSize:13 },
  overlay:       { position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 },
  modal:         { background:'#161b22', border:'1px solid rgba(255,255,255,0.12)', borderRadius:12, padding:'28px 32px', width:400, maxWidth:'90vw' },
  modalHead:     { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 },
  modalTitle:    { fontSize:15, fontWeight:600, color:'#e8eaf0' },
  modalClose:    { background:'none', border:'none', color:'#7a8394', fontSize:16, cursor:'pointer' },
  modalFooter:   { display:'flex', justifyContent:'flex-end', gap:10, marginTop:20 },
  grid2:         { display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 },
  input:         { width:'100%', padding:'10px 14px', background:'#1c2129', border:'1px solid rgba(255,255,255,0.12)', borderRadius:7, color:'#e8eaf0', fontSize:13, outline:'none', boxSizing:'border-box' },
  error:         { background:'rgba(255,71,87,0.1)', border:'1px solid rgba(255,71,87,0.3)', color:'#ff4757', padding:'10px 14px', borderRadius:7, fontSize:13, marginBottom:16 },
  btnPrimary:    { padding:'8px 16px', background:'#00d4aa', border:'none', borderRadius:7, color:'#0a0c0f', fontWeight:600, fontSize:13, cursor:'pointer' },
  btnSecondary:  { padding:'8px 16px', background:'transparent', border:'1px solid rgba(255,255,255,0.12)', borderRadius:7, color:'#7a8394', fontSize:13, cursor:'pointer' },
};