import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import ConfirmModal from '../../components/ConfirmModal';
import CustomSelect from '../../components/CustomSelect';

export default function PageMachines({ mesures = {} }) {  const [machines, setMachines]   = useState([]);
  const { user } = useAuth();
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMachine, setEditMachine] = useState(null);
  const [form, setForm] = useState({ nom:'', localisation:'', topic_mqtt:'', description:'', statut:'EN SERVICE' });
  const [error, setError] = useState('');
// Remplace partout dans le fichier
const [confirmData, setConfirmData] = useState(null);  const [capteurSelects, setCapteurSelects] = useState([]);

  const TYPES_CAPTEURS = [
  { type:'temperature', label:'Température', unite:'°C' },
  { type:'humidite',    label:'Humidité',    unite:'%'  },
  { type:'courant',     label:'Courant',     unite:'A'  },
  { type:'vibration',   label:'Vibration',   unite:'g'  },
  { type:'gaz',         label:'Gaz',         unite:'ppm'},
  { type:'pression',    label:'Pression',    unite:'bar'},
];
const ICONS = {
  temperature: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00d4aa" strokeWidth="2"><polyline points="12 2 12 13"/><circle cx="12" cy="17" r="4"/></svg>,
  humidite:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00d4aa" strokeWidth="2"><path d="M12 2 C12 2 5 10 5 15a7 7 0 0 0 14 0C19 10 12 2 12 2z"/></svg>,
  courant:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00d4aa" strokeWidth="2"><polyline points="13 2 13 9 19 9 11 22 11 15 5 15 13 2"/></svg>,
  vibration:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00d4aa" strokeWidth="2"><path d="M2 12h4M18 12h4M6 6l2 2M16 16l2 2M6 18l2-2M16 8l2-2"/></svg>,
  gaz:         <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00d4aa" strokeWidth="2"><path d="M9 22c0 0-6-3-6-9a9 9 0 0 1 18 0c0 6-6 9-6 9"/><line x1="12" y1="13" x2="12" y2="22"/></svg>,
  pression:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00d4aa" strokeWidth="2"><circle cx="12" cy="12" r="9"/><polyline points="12 8 12 12 14 14"/></svg>,
};
  useEffect(() => { fetchMachines(); }, []);

  const fetchMachines = () => {
    api.get('/machines').then(r => { setMachines(r.data); setLoading(false); });
  };

   const openCreate = () => {
  setEditMachine(null);
  setForm({ nom:'', localisation:'', topic_mqtt:'', description:'', statut:'EN SERVICE' });
  setCapteurSelects(TYPES_CAPTEURS.map(t => ({ ...t, selected:false, seuil_min:'', seuil_max:'' })));
  setError('');
  setShowModal(true);
};

  const openEdit = (m) => {
    setEditMachine(m);
    setForm({ nom:m.nom, localisation:m.localisation, topic_mqtt:m.topic_mqtt, description:m.description, statut:m.statut });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async () => {
  setError('');
  try {
    if (editMachine) {
      await api.put(`/machines/${editMachine.id}`, form);
    } else {
      await api.post('/machines', {
        ...form,
        capteurs: capteurSelects.filter(c => c.selected).map(c => ({
          type:      c.type,
          unite:     c.unite,
          seuil_min: c.seuil_min || null,
          seuil_max: c.seuil_max || null,
        })),
      });
    }
    setShowModal(false);
    fetchMachines();
  } catch(e) {
    setError(e.response?.data?.message || 'Erreur');
  }
};

 const handleDelete = (machine) => {
  if (machine.est_statique) {
    alert('Cette machine est statique et ne peut pas être supprimée.');
    return;
  }
  setConfirmData({
    message: `Voulez-vous vraiment supprimer "${machine.nom}" ?`,
    onConfirm: async () => {
      await api.delete(`/machines/${machine.id}`);
      setConfirmData(null);
      fetchMachines();
    }
  });
};
  const [showAffModal, setShowAffModal] = useState(false);
const [affMachine, setAffMachine]     = useState(null);
const [affectations, setAffectations] = useState([]);
const [tousUtilisateurs, setTousUtilisateurs] = useState([]);
const [selectedUser, setSelectedUser] = useState('');

const openAffectations = async (machine) => {
  setAffMachine(machine);
  const [aff, users] = await Promise.all([
    api.get(`/machines/${machine.id}/affectations`),
    api.get('/utilisateurs'),
  ]);
  setAffectations(aff.data);
  setTousUtilisateurs(users.data.filter(u => u.role !== 'admin' && u.statut === 'ACTIF'));
  setSelectedUser('');
  setShowAffModal(true);
};

const handleAffecter = async () => {
  if (!selectedUser) return;
  try {
    await api.post(`/machines/${affMachine.id}/affecter`, {
      utilisateur_id: parseInt(selectedUser),
      affecte_par:    JSON.parse(localStorage.getItem('user'))?.id,
    });
    const aff = await api.get(`/machines/${affMachine.id}/affectations`);
    setAffectations(aff.data);
    setSelectedUser('');
  } catch(e) {
    alert(e.response?.data?.message || 'Erreur');
  }
};

const handleRetirerAff = async (utilisateurId) => {
  await api.post(`/machines/${affMachine.id}/retirer-affectation`, {
    utilisateur_id: utilisateurId,
  });
  const aff = await api.get(`/machines/${affMachine.id}/affectations`);
  setAffectations(aff.data);
};

  const statutStyle = {
    'EN SERVICE':  { background:'rgba(46,213,115,0.15)',  color:'#2ed573' },
    'ARRET':       { background:'rgba(255,71,87,0.15)',   color:'#ff4757' },
    'MAINTENANCE': { background:'rgba(245,166,35,0.15)',  color:'#f5a623' },
    'NOUVEAU':     { background:'rgba(0,153,255,0.15)',   color:'#0099ff' },
  };

  if (loading) return <div style={S.loading}>Chargement...</div>;

return (
  <div>
    {confirmData && <ConfirmModal message={confirmData.message} onConfirm={confirmData.onConfirm} onCancel={() => setConfirmData(null)} />}
      {/* Header */}
      <div style={S.header}>
        <div>
          <div style={S.headerTitle}>Machines industrielles</div>
          <div style={S.headerSub}>{machines.length} machine(s) enregistrée(s)</div>
        </div>
{user?.role === 'admin' && (
  <button style={S.btnPrimary} onClick={openCreate}>+ Nouvelle machine</button>
)}      </div>

      {/* Cards */}
      <div style={S.grid}>
        {machines.map(m => (
          <div key={m.id} style={S.card}>
            <div style={{...S.cardBar, background: m.statut==='EN SERVICE' ? '#2ed573' : m.statut==='MAINTENANCE' ? '#f5a623' : '#ff4757'}}/>
            
            <div style={S.cardHead}>
              <div>
                <div style={S.cardName}>{m.nom}</div>
                <div style={S.cardLoc}>{m.localisation}</div>
              </div>
              <span style={{...S.pill, ...statutStyle[m.statut]}}>{m.statut}</span>
            </div>

            {m.topic_mqtt && (
              <div style={S.cardMqtt}>
                <span style={S.cardMqttLabel}>MQTT</span>
                <span style={S.cardMqttVal}>{m.topic_mqtt}</span>
              </div>
            )}

            {m.description && (
  <div style={S.cardDesc}>{m.description}</div>
)}

{/* Valeurs MQTT live */}
{mesures[m.id] && (
  <div style={{
    display:'flex', flexWrap:'wrap', gap:6, marginBottom:10
  }}>
    {Object.entries(mesures[m.id]).map(([type, data]) => (
      <div key={type} style={{
        display:'flex', alignItems:'center', gap:5,
        padding:'4px 8px',
        background: data.hors_seuil ? 'rgba(255,71,87,0.10)' : 'rgba(0,212,170,0.06)',
        border: `1px solid ${data.hors_seuil ? 'rgba(255,71,87,0.25)' : 'rgba(0,212,170,0.15)'}`,
        borderRadius:5,
      }}>
        <span style={{ fontSize:9, fontFamily:'monospace', color:'#7a8394', textTransform:'uppercase' }}>
          {type}
        </span>
        <span style={{
          fontSize:12, fontFamily:'monospace', fontWeight:600,
          color: data.hors_seuil ? '#ff4757' : '#00d4aa'
        }}>
          {parseFloat(data.valeur).toFixed(1)}
          <span style={{ fontSize:9, color:'#7a8394', marginLeft:2 }}>{data.unite}</span>
        </span>
        {data.hors_seuil && (
          <span style={{ fontSize:9, color:'#ff4757' }}>⚠</span>
        )}
      </div>
    ))}
  </div>
)}

            <div style={S.cardFooter}>
              {m.est_statique ? (
                <span style={S.staticBadge}>🔒 Statique</span>
              ) : (
                <span style={S.staticBadge}></span>
              )}
              <div style={{display:'flex', gap:8}}>
  {user?.role !== 'operateur' && (
    <button style={S.btnEdit} onClick={() => openEdit(m)}>Modifier</button>
  )}
  {user?.role !== 'operateur' && !m.est_statique && (
    <button style={S.btnDel} onClick={() => handleDelete(m)}>Supprimer</button>
  )}
  {user?.role === 'admin' && (
    <button style={S.btnAff} onClick={() => openAffectations(m)}>Affectations</button>
  )}
</div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={S.overlay}>
          <div style={S.modal}>
            <div style={S.modalHead}>
              <span style={S.modalTitle}>{editMachine ? 'Modifier machine' : 'Nouvelle machine'}</span>
              <button style={S.modalClose} onClick={() => setShowModal(false)}>✕</button>
            </div>

            {error && <div style={S.error}>{error}</div>}

            <div style={S.grid2}>
              <Field label="NOM DE LA MACHINE">
                <input style={S.input} value={form.nom}
                  onChange={e => setForm({...form, nom:e.target.value})}
                  placeholder="Compresseur A1" />
              </Field>
              <Field label="STATUT">
                <CustomSelect
                  value={form.statut}
                  onChange={val => setForm({...form, statut: val})}
                  options={[
                    { value:'EN SERVICE',  label:'EN SERVICE'  },
                    { value:'ARRET',       label:'ARRÊT'        },
                    { value:'MAINTENANCE', label:'MAINTENANCE'  },
                    { value:'NOUVEAU',     label:'NOUVEAU'      },
                  ]}
                />
              </Field>
            </div>

            <Field label="LOCALISATION">
              <input style={S.input} value={form.localisation}
                onChange={e => setForm({...form, localisation:e.target.value})}
                placeholder="ZONE-A — Hall 1" />
            </Field>

            <Field label="TOPIC MQTT">
              <input style={S.input} value={form.topic_mqtt}
                onChange={e => setForm({...form, topic_mqtt:e.target.value})}
                placeholder="usine/comp_a1" />
            </Field>

            <Field label="DESCRIPTION">
              <input style={S.input} value={form.description}
                onChange={e => setForm({...form, description:e.target.value})}
                placeholder="Description de la machine" />
            </Field>
{!editMachine && (
  <div style={{ marginBottom: 14 }}>
    <label style={S.label}>CAPTEURS À INSTALLER</label>
    <div style={S.capteurGrid}>
      {capteurSelects.map((c, i) => (
        <div
          key={c.type}
          style={{ ...S.capteurCard, ...(c.selected ? S.capteurCardActive : {}) }}
          onClick={() => {
            const updated = [...capteurSelects];
            updated[i] = { ...updated[i], selected: !updated[i].selected };
            setCapteurSelects(updated);
          }}
        >
          <div style={S.capteurTop}>
            <div style={S.capteurIcon}>
              {ICONS[c.type]}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={S.capteurName}>{c.label}</div>
              <div style={S.capteurUnit}>{c.unite}</div>
            </div>
            <div style={{ ...S.capteurCheck, ...(c.selected ? S.capteurCheckActive : {}) }}>
              {c.selected && (
                <svg width="8" height="8" viewBox="0 0 10 10" fill="none" stroke="#0a0c0f" strokeWidth="2.5">
                  <polyline points="1.5 5 4 7.5 8.5 2" />
                </svg>
              )}
            </div>
          </div>

          {c.selected && (
            <div style={S.capteurThresholds} onClick={e => e.stopPropagation()}>
              <input
                style={S.thresholdInput}
                type="number"
                placeholder={`Min (${c.unite})`}
                value={c.seuil_min}
                onChange={e => {
                  const updated = [...capteurSelects];
                  updated[i] = { ...updated[i], seuil_min: e.target.value };
                  setCapteurSelects(updated);
                }}
              />
              <input
                style={S.thresholdInput}
                type="number"
                placeholder={`Max (${c.unite})`}
                value={c.seuil_max}
                onChange={e => {
                  const updated = [...capteurSelects];
                  updated[i] = { ...updated[i], seuil_max: e.target.value };
                  setCapteurSelects(updated);
                }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
)}
            <div style={S.modalFooter}>
              <button style={S.btnSecondary} onClick={() => setShowModal(false)}>Annuler</button>
              <button style={S.btnPrimary}   onClick={handleSubmit}>
                {editMachine ? 'Enregistrer' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}
      {showAffModal && (
  <div style={S.overlay}>
    <div style={S.modal}>
      <div style={S.modalHead}>
        <span style={S.modalTitle}>Affectations — {affMachine?.nom}</span>
        <button style={S.modalClose} onClick={() => setShowAffModal(false)}>✕</button>
      </div>

      {/* Affectations existantes */}
      <div style={{marginBottom:20}}>
        <label style={S.label}>PERSONNES AFFECTÉES</label>
        {affectations.length === 0 ? (
          <div style={{color:'#4a5260', fontSize:12, padding:'8px 0'}}>Aucune affectation</div>
        ) : (
          affectations.map(a => a.utilisateur && (
            <div key={a.id} style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
              <div>
                <span style={{fontSize:13, color:'#e8eaf0'}}>{a.utilisateur.nom}</span>
                <span style={{fontSize:11, color:'#7a8394', fontFamily:'Segoe UI', marginLeft:8}}>
                  {a.utilisateur.role}
                </span>
              </div>
              <button
                style={{padding:'4px 10px', background:'rgba(255,71,87,0.08)', border:'1px solid rgba(255,71,87,0.20)', borderRadius:6, color:'#ff4757', fontSize:11, cursor:'pointer'}}
                onClick={() => handleRetirerAff(a.utilisateur_id)}
              >
                Retirer
              </button>
            </div>
          ))
        )}
      </div>

      {/* Ajouter affectation */}
      <label style={S.label}>AFFECTER UN UTILISATEUR</label>
      <div style={{display:'flex', gap:10}}>
        <select style={{...S.input, flex:1}} value={selectedUser} onChange={e => setSelectedUser(e.target.value)}>
          <option value="">— Choisir —</option>
          {tousUtilisateurs
            .filter(u => !affectations.find(a => a.utilisateur_id === u.id))
            .map(u => (
              <option key={u.id} value={u.id}>{u.nom} ({u.role})</option>
            ))
          }
        </select>
        <button style={S.btnPrimary} onClick={handleAffecter}>Affecter</button>
      </div>

      <div style={{...S.modalFooter, marginTop:20}}>
        <button style={S.btnSecondary} onClick={() => setShowAffModal(false)}>Fermer</button>
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
  grid:        { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 },
  card:        { background:'#161b22', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, padding:'20px', position:'relative', overflow:'hidden' },
  cardBar:     { position:'absolute', top:0, left:0, right:0, height:2 },
  cardHead:    { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 },
  cardName:    { fontSize:15, fontWeight:600, color:'#e8eaf0', marginBottom:4 },
  cardLoc:     { fontSize:11, color:'#7a8394', fontFamily:'Segoe UI' },
  cardMqtt:    { display:'flex', alignItems:'center', gap:8, marginBottom:10, padding:'6px 10px', background:'rgba(0,212,170,0.05)', border:'1px solid rgba(0,212,170,0.10)', borderRadius:6 },
  cardMqttLabel:{ fontSize:9, fontFamily:'Segoe UI', color:'#00d4aa', letterSpacing:1 },
  cardMqttVal: { fontSize:11, fontFamily:'Segoe UI', color:'#7a8394' },
  cardDesc:    { fontSize:12, color:'#7a8394', marginBottom:14, lineHeight:1.5 },
  cardFooter:  { display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:14, paddingTop:14, borderTop:'1px solid rgba(255,255,255,0.05)' },
  staticBadge: { fontSize:10, fontFamily:'Segoe UI', color:'#4a5260' },
  pill:        { display:'inline-flex', fontFamily:'Segoe UI', fontSize:10, padding:'3px 8px', borderRadius:4, flexShrink:0 },
  btnPrimary:  { padding:'8px 16px', background:'#00d4aa', border:'none', borderRadius:7, color:'#0a0c0f', fontWeight:600, fontSize:13, cursor:'pointer' },
  btnSecondary:{ padding:'8px 16px', background:'transparent', border:'1px solid rgba(255,255,255,0.12)', borderRadius:7, color:'#7a8394', fontSize:13, cursor:'pointer' },
  btnEdit:     { padding:'5px 10px', background:'rgba(0,153,255,0.10)', border:'1px solid rgba(0,153,255,0.20)', borderRadius:6, color:'#0099ff', fontSize:11, cursor:'pointer' },
  btnDel:      { padding:'5px 10px', background:'rgba(255,71,87,0.08)', border:'1px solid rgba(255,71,87,0.20)', borderRadius:6, color:'#ff4757', fontSize:11, cursor:'pointer' },
  overlay:     { position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 },
  modal:       { background:'#161b22', border:'1px solid rgba(255,255,255,0.12)', borderRadius:12, padding:'28px 32px', width:500, maxWidth:'90vw' },
  modalHead:   { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 },
  modalTitle:  { fontSize:15, fontWeight:600, color:'#e8eaf0' },
  modalClose:  { background:'none', border:'none', color:'#7a8394', fontSize:16, cursor:'pointer' },
  modalFooter: { display:'flex', justifyContent:'flex-end', gap:10, marginTop:24 },
  grid2:       { display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 },
  label:       { display:'block', fontSize:11, color:'#7a8394', letterSpacing:1, marginBottom:7, fontFamily:'Segoe UI' },
  input:       { width:'100%', padding:'10px 14px', background:'#1c2129', border:'1px solid rgba(255,255,255,0.12)', borderRadius:7, color:'#e8eaf0', fontSize:13, outline:'none', boxSizing:'border-box' },
  error:       { background:'rgba(255,71,87,0.1)', border:'1px solid rgba(255,71,87,0.3)', color:'#ff4757', padding:'10px 14px', borderRadius:7, fontSize:13, marginBottom:16 },
  btnAff: { padding:'5px 10px', background:'rgba(168,85,247,0.10)', border:'1px solid rgba(168,85,247,0.20)', borderRadius:6, color:'#a855f7', fontSize:11, cursor:'pointer' },
  capteurGrid:       { display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 },
capteurCard:       { background:'#1c2129', border:'0.5px solid rgba(255,255,255,0.10)', borderRadius:8, padding:'10px 12px', cursor:'pointer', transition:'border-color 0.15s, background 0.15s' },
capteurCardActive: { border:'1.5px solid rgba(0,212,170,0.50)', background:'rgba(0,212,170,0.06)' },
capteurTop:        { display:'flex', alignItems:'center', gap:8 },
capteurIcon:       { width:28, height:28, borderRadius:6, background:'rgba(0,212,170,0.10)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
capteurName:       { fontSize:12, color:'#e8eaf0', fontWeight:500 },
capteurUnit:       { fontSize:10, color:'#7a8394', fontFamily:'Segoe UI' },
capteurCheck:      { width:16, height:16, borderRadius:4, border:'1.5px solid rgba(255,255,255,0.20)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all 0.15s' },
capteurCheckActive:{ background:'#00d4aa', borderColor:'#00d4aa' },
capteurThresholds: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginTop:8 },
thresholdInput:    { width:'100%', padding:'5px 8px', background:'#0e1117', border:'0.5px solid rgba(255,255,255,0.10)', borderRadius:5, color:'#e8eaf0', fontSize:11, fontFamily:'Segoe UI', outline:'none', boxSizing:'border-box' },
};