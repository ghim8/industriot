import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import ConfirmModal from '../../components/ConfirmModal';
import CustomSelect from '../../components/CustomSelect';

const TYPES_CAPTEURS = [
  { type: 'temperature', label: 'Température', unite: '°C'  },
  { type: 'humidite',    label: 'Humidité',    unite: '%'   },
  { type: 'courant',     label: 'Courant',     unite: 'A'   },
  { type: 'vibration',   label: 'Vibration',   unite: 'g'   },
  { type: 'gaz',         label: 'Gaz',         unite: 'ppm' },
  { type: 'pression',    label: 'Pression',    unite: 'bar' },
];

const TYPES_ACT = ['Moteur','Pompe','Vérin','Vanne','Compresseur','Ventilateur','Convoyeur','Autre'];

const ICONS = {
  temperature: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00d4aa" strokeWidth="2"><polyline points="12 2 12 13"/><circle cx="12" cy="17" r="4"/></svg>,
  humidite:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00d4aa" strokeWidth="2"><path d="M12 2 C12 2 5 10 5 15a7 7 0 0 0 14 0C19 10 12 2 12 2z"/></svg>,
  courant:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00d4aa" strokeWidth="2"><polyline points="13 2 13 9 19 9 11 22 11 15 5 15 13 2"/></svg>,
  vibration:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00d4aa" strokeWidth="2"><path d="M2 12h4M18 12h4M6 6l2 2M16 16l2 2M6 18l2-2M16 8l2-2"/></svg>,
  gaz:         <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00d4aa" strokeWidth="2"><path d="M9 22c0 0-6-3-6-9a9 9 0 0 1 18 0c0 6-6 9-6 9"/><line x1="12" y1="13" x2="12" y2="22"/></svg>,
  pression:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00d4aa" strokeWidth="2"><circle cx="12" cy="12" r="9"/><polyline points="12 8 12 12 14 14"/></svg>,
};

const STEPS = ['Informations', 'Actionneurs'];

export default function PageMachines({ mesures = {} }) {
  const { user } = useAuth();
  const [machines, setMachines]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [confirmData, setConfirmData] = useState(null);

  const [showModal, setShowModal]         = useState(false);
  const [editMachine, setEditMachine]     = useState(null);
  const [step, setStep]                   = useState(0);
  const [form, setForm]                   = useState({ nom:'', localisation:'', topic_mqtt:'', description:'', statut:'EN SERVICE' });
  const [actionneursList, setActionneursList] = useState([]);
  const [error, setError]                 = useState('');

  const [showAffModal, setShowAffModal]         = useState(false);
  const [affMachine, setAffMachine]             = useState(null);
  const [affectations, setAffectations]         = useState([]);
  const [tousUtilisateurs, setTousUtilisateurs] = useState([]);
  const [selectedUser, setSelectedUser]         = useState('');
  const [affOnglet, setAffOnglet]               = useState('chef');
  const [chefAffecte, setChefAffecte]           = useState(null);

  const [showActModal, setShowActModal] = useState(false);
  const [actMachine, setActMachine]     = useState(null);
  const [actionneurs, setActionneurs]   = useState([]);
  const [actLoading, setActLoading]     = useState(false);
  const [editAct, setEditAct]           = useState(null);
  const [actForm, setActForm]           = useState({ nom:'', type:'', description:'' });
  const [actCapteurs, setActCapteurs]   = useState(
    TYPES_CAPTEURS.map(t => ({ ...t, selected:false, seuil_min:'', seuil_max:'' }))
  );
  const [actError, setActError] = useState('');

  useEffect(() => { fetchMachines(); }, []);

  const fetchMachines = () => {
    api.get(`/machines?user_id=${user?.id}`).then(r => { setMachines(r.data); setLoading(false); });
  };

  const openCreate = () => {
    setEditMachine(null);
    setForm({ nom:'', localisation:'', topic_mqtt:'', description:'', statut:'EN SERVICE' });
    setActionneursList([]);
    setStep(0);
    setError('');
    setShowModal(true);
  };

  const openEdit = (m) => {
    setEditMachine(m);
    setForm({ nom:m.nom, localisation:m.localisation, topic_mqtt:m.topic_mqtt, description:m.description, statut:m.statut });
    setActionneursList([]);
    setStep(0);
    setError('');
    setShowModal(true);
  };

  const handleNextStep = () => {
    if (!form.nom.trim()) { setError('Le nom est obligatoire'); return; }
    setError('');
    setStep(1);
  };

  const handleSubmit = async () => {
    setError('');
    try {
      if (editMachine) {
        await api.put(`/machines/${editMachine.id}`, form);
      } else {
        await api.post('/machines', {
          ...form,
          actionneurs: actionneursList.map(a => ({
            nom: a.nom, type: a.type, description: a.description, capteurs: a.capteurs,
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
    if (machine.est_statique) { alert('Cette machine est statique et ne peut pas être supprimée.'); return; }
    setConfirmData({
      message: `Voulez-vous vraiment supprimer "${machine.nom}" ?`,
      onConfirm: async () => {
        await api.delete(`/machines/${machine.id}`);
        setConfirmData(null);
        fetchMachines();
      }
    });
  };

  const openAffectations = async (machine) => {
  setAffMachine(machine);
  // Chef → onglet opérateurs directement
  setAffOnglet(user?.role === 'chef' ? 'operateur' : 'chef');
  setChefAffecte(null);
  setAffectations([]);
  document.body.style.overflow = 'hidden';

  const [aff, users] = await Promise.all([
    api.get(`/machines/${machine.id}/affectations`),
    api.get('/utilisateurs'),
  ]);

  setAffectations(aff.data);
  setTousUtilisateurs(users.data.filter(u => u.role !== 'admin' && u.statut === 'ACTIF'));
  setSelectedUser('');

  const chef = user?.role === 'chef'
    ? user  // Le chef connecté EST le chef
    : aff.data.find(a => a.utilisateur?.role === 'chef')?.utilisateur || null;

  setChefAffecte(chef);
  setShowAffModal(true);
};

  const closeAffModal = () => setShowAffModal(false);

  const handleAffecter = async () => {
    if (!selectedUser) return;
    try {
      await api.post(`/machines/${affMachine.id}/affecter`, {
        utilisateur_id: parseInt(selectedUser),
        affecte_par: JSON.parse(localStorage.getItem('user'))?.id,
      });
      const aff = await api.get(`/machines/${affMachine.id}/affectations`);
      setAffectations(aff.data);
      const chef = aff.data.find(a => a.utilisateur?.role === 'chef');
      setChefAffecte(chef?.utilisateur || null);
      setSelectedUser('');
    } catch(e) { alert(e.response?.data?.message || 'Erreur'); }
  };

  const handleRetirerAff = async (utilisateurId) => {
    await api.post(`/machines/${affMachine.id}/retirer-affectation`, { utilisateur_id: utilisateurId });
    const aff = await api.get(`/machines/${affMachine.id}/affectations`);
    setAffectations(aff.data);
    const chef = aff.data.find(a => a.utilisateur?.role === 'chef');
    setChefAffecte(chef?.utilisateur || null);
  };

  const openActModal = async (machine) => {
    setActMachine(machine);
    setActError('');
    setEditAct(null);
    setActForm({ nom:'', type:'', description:'' });
    setActCapteurs(TYPES_CAPTEURS.map(t => ({ ...t, selected:false, seuil_min:'', seuil_max:'' })));
    setActLoading(true);
    setShowActModal(true);
    const res = await api.get(`/actionneurs?machine_id=${machine.id}`);
    setActionneurs(res.data);
    setActLoading(false);
  };

  const startEditAct = (a) => {
    setEditAct(a);
    setActForm({ nom: a.nom, type: a.type, description: a.description || '' });
    setActCapteurs(TYPES_CAPTEURS.map(t => {
      const existing = a.capteurs?.find(c => c.type === t.type);
      return { ...t, selected: !!existing, seuil_min: existing?.seuil_min ?? '', seuil_max: existing?.seuil_max ?? '' };
    }));
    setActError('');
  };

  const cancelEditAct = () => {
    setEditAct(null);
    setActForm({ nom:'', type:'', description:'' });
    setActCapteurs(TYPES_CAPTEURS.map(t => ({ ...t, selected:false, seuil_min:'', seuil_max:'' })));
    setActError('');
  };

  const handleAddActPost = async () => {
    setActError('');
    if (!actForm.nom.trim() || !actForm.type) { setActError('Le nom et le type sont obligatoires'); return; }
    const capteurs = actCapteurs.filter(c => c.selected)
      .map(c => ({ type:c.type, unite:c.unite, seuil_min:c.seuil_min||null, seuil_max:c.seuil_max||null }));
    try {
      await api.post('/actionneurs', { machine_id: actMachine.id, nom: actForm.nom, type: actForm.type, description: actForm.description, capteurs });
      const res = await api.get(`/actionneurs?machine_id=${actMachine.id}`);
      setActionneurs(res.data);
      setActForm({ nom:'', type:'', description:'' });
      setActCapteurs(TYPES_CAPTEURS.map(t => ({ ...t, selected:false, seuil_min:'', seuil_max:'' })));
    } catch(e) { setActError(e.response?.data?.message || 'Erreur'); }
  };

  const handleSaveEditAct = async () => {
    setActError('');
    if (!actForm.nom.trim() || !actForm.type) { setActError('Le nom et le type sont obligatoires'); return; }
    const capteurs = actCapteurs.filter(c => c.selected)
      .map(c => ({ type:c.type, unite:c.unite, seuil_min:c.seuil_min||null, seuil_max:c.seuil_max||null }));
    try {
      await api.put(`/actionneurs/${editAct.id}`, { nom: actForm.nom, type: actForm.type, description: actForm.description, capteurs });
      const res = await api.get(`/actionneurs?machine_id=${actMachine.id}`);
      setActionneurs(res.data);
      cancelEditAct();
    } catch(e) { setActError(e.response?.data?.message || 'Erreur'); }
  };

  const handleDeleteAct = async (id) => {
    if (!window.confirm('Supprimer cet actionneur et son relais ?')) return;
    await api.delete(`/actionneurs/${id}`);
    const res = await api.get(`/actionneurs?machine_id=${actMachine.id}`);
    setActionneurs(res.data);
    if (editAct?.id === id) cancelEditAct();
  };

  const toggleActCapteur = (i) => {
    setActCapteurs(prev => { const u=[...prev]; u[i]={...u[i],selected:!u[i].selected}; return u; });
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
      {confirmData && (
        <ConfirmModal message={confirmData.message} onConfirm={confirmData.onConfirm} onCancel={() => setConfirmData(null)} />
      )}

      {/* Header */}
<div style={S.header}>
  <div>
    <div style={S.headerTitle}>Machines industrielles</div>
    <div style={S.headerSub}>{machines.length} machine(s) enregistrée(s)</div>
  </div>
  {user?.role === 'admin' && (
    <button style={S.btnPrimary} onClick={openCreate}>+ Nouvelle machine</button>
  )}
</div>

      {/* Cards */}
      <div style={S.grid}>
        {machines.map(m => (
          <div key={m.id} style={S.card}>
            <div style={{ ...S.cardBar, background: m.statut === 'EN SERVICE' ? '#2ed573' : m.statut === 'MAINTENANCE' ? '#f5a623' : '#ff4757' }} />
            <div style={S.cardHead}>
              <div>
                <div style={S.cardName}>{m.nom}</div>
                <div style={S.cardLoc}>{m.localisation}</div>
              </div>
              <span style={{ ...S.pill, ...statutStyle[m.statut] }}>{m.statut}</span>
            </div>
            {m.topic_mqtt && (
              <div style={S.cardMqtt}>
                <span style={S.cardMqttLabel}>MQTT</span>
                <span style={S.cardMqttVal}>{m.topic_mqtt}</span>
              </div>
            )}
            {m.description && <div style={S.cardDesc}>{m.description}</div>}
            {mesures[m.id] && (
              <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:10 }}>
                {Object.entries(mesures[m.id]).map(([type, data]) => (
                  <div key={type} style={{
                    display:'flex', alignItems:'center', gap:5, padding:'4px 8px',
                    background: data.hors_seuil ? 'rgba(255,71,87,0.10)' : 'rgba(0,212,170,0.06)',
                    border: `1px solid ${data.hors_seuil ? 'rgba(255,71,87,0.25)' : 'rgba(0,212,170,0.15)'}`,
                    borderRadius:5,
                  }}>
                    <span style={{ fontSize:9, color:'#7a8394', textTransform:'uppercase' }}>{type}</span>
                    <span style={{ fontSize:12, fontWeight:600, color: data.hors_seuil ? '#ff4757' : '#00d4aa' }}>
                      {parseFloat(data.valeur).toFixed(1)}
                      <span style={{ fontSize:9, color:'#7a8394', marginLeft:2 }}>{data.unite}</span>
                    </span>
                    {data.hors_seuil && <span style={{ fontSize:9, color:'#ff4757' }}>⚠</span>}
                  </div>
                ))}
              </div>
            )}
            <div style={S.cardFooter}>
  {m.est_statique ? <span style={S.staticBadge}>🔒 Statique</span> : <span />}
  <div style={{ display:'flex', gap:8 }}>
    {user?.role !== 'operateur' && (
      <button style={S.btnEdit} onClick={() => openEdit(m)}>Modifier</button>
    )}
    {user?.role !== 'operateur' && !m.est_statique && (
      <button style={S.btnDel} onClick={() => handleDelete(m)}>Supprimer</button>
    )}
    {(user?.role === 'admin' || user?.role === 'chef') && (
      <button style={S.btnAff} onClick={() => openAffectations(m)}>Affectations</button>
    )}
    {user?.role !== 'operateur' && (
      <button style={S.btnAct} onClick={() => openActModal(m)}>⚙ Actionneurs</button>
    )}
  </div>
</div>
          </div>
        ))}
      </div>

      {/* ══ Modal Création / Édition ══ */}
      {showModal && (
        <div style={S.overlay}>
          <div style={{ ...S.modal, width: editMachine ? 500 : 640, maxHeight:'90vh', overflowY:'auto' }}>
            <div style={S.modalHead}>
              <div>
                <span style={S.modalTitle}>{editMachine ? 'Modifier machine' : 'Nouvelle machine'}</span>
                {!editMachine && (
                  <div style={S.stepBar}>
                    {STEPS.map((s, i) => (
                      <div key={i} style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <div style={{ ...S.stepDot, ...(i <= step ? S.stepDotActive : {}) }}>
                          {i < step ? '✓' : i + 1}
                        </div>
                        <span style={{ ...S.stepLabel, ...(i === step ? S.stepLabelActive : {}) }}>{s}</span>
                        {i < STEPS.length - 1 && <div style={{ ...S.stepLine, ...(i < step ? S.stepLineActive : {}) }} />}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button style={S.modalClose} onClick={() => setShowModal(false)}>✕</button>
            </div>
            {error && <div style={S.error}>{error}</div>}
            {step === 0 && (
              <div>
                <div style={S.grid2}>
                  <Field label="NOM DE LA MACHINE">
                    <input style={S.input} value={form.nom}
                      onChange={e => setForm({ ...form, nom: e.target.value })}
                      placeholder="Compresseur A1" />
                  </Field>
                  <Field label="STATUT">
                    <CustomSelect value={form.statut}
                      onChange={val => setForm({ ...form, statut: val })}
                      options={[
                        { value:'EN SERVICE',  label:'EN SERVICE'  },
                        { value:'ARRET',       label:'ARRÊT'       },
                        { value:'MAINTENANCE', label:'MAINTENANCE' },
                        { value:'NOUVEAU',     label:'NOUVEAU'     },
                      ]}
                    />
                  </Field>
                </div>
                <Field label="LOCALISATION">
                  <input style={S.input} value={form.localisation}
                    onChange={e => setForm({ ...form, localisation: e.target.value })}
                    placeholder="ZONE-A — Hall 1" />
                </Field>
                <Field label="TOPIC MQTT">
                  <input style={S.input} value={form.topic_mqtt}
                    onChange={e => setForm({ ...form, topic_mqtt: e.target.value })}
                    placeholder="usine/comp_a1" />
                </Field>
                <Field label="DESCRIPTION">
                  <input style={S.input} value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    placeholder="Description de la machine" />
                </Field>
                <div style={S.modalFooter}>
                  <button style={S.btnSecondary} onClick={() => setShowModal(false)}>Annuler</button>
                  {editMachine ? (
                    <button style={S.btnPrimary} onClick={handleSubmit}>Enregistrer</button>
                  ) : (
                    <button style={S.btnPrimary} onClick={handleNextStep}>Suivant — Actionneurs →</button>
                  )}
                </div>
              </div>
            )}
            {step === 1 && !editMachine && (
              <StepActionneurs
                actionneursList={actionneursList}
                setActionneursList={setActionneursList}
                onBack={() => { setStep(0); setError(''); }}
                onSubmit={handleSubmit}
                error={error}
              />
            )}
          </div>
        </div>
      )}

      {/* ══ Modal Affectations — 2 onglets ══ */}
      {showAffModal && (
        <div style={S.overlay}>
          {/* ✅ Modal avec position relative pour contenir AffectationActionneurs */}
          <div style={{
            ...S.modal,
            width: 580,
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',  // ← clé du fix
            overflow: 'hidden',    // ← empêche le débordement
          }}>
            <div style={S.modalHead}>
              <span style={S.modalTitle}>Affectations — {affMachine?.nom}</span>
              <button style={S.modalClose} onClick={closeAffModal}>✕</button>
            </div>

            {/* Onglets */}
            <div style={SAff.tabs}>
  {user?.role === 'admin' && (
    <button
      style={{ ...SAff.tab, ...(affOnglet === 'chef' ? SAff.tabActive : {}) }}
      onClick={() => setAffOnglet('chef')}
    >
      👤 Chef de maintenance
    </button>
  )}
  <button
    style={{ ...SAff.tab, ...(affOnglet === 'operateur' ? SAff.tabActive : {}) }}
    onClick={() => setAffOnglet('operateur')}
  >
    ⚙ Actionneurs → Opérateurs
  </button>
</div>

            {/* ✅ Conteneur scrollable pour le contenu des onglets */}
            <div style={{ flex:1, overflowY:'auto', paddingRight:4,maxHeight: '60vh' }}>

              {/* ── Onglet Chef ── */}
              {affOnglet === 'chef' && (
                <div>
                  <div style={{ marginBottom:20 }}>
                    <label style={S.label}>CHEFS AFFECTÉS</label>
                    {affectations.filter(a => a.utilisateur?.role === 'chef').length === 0 ? (
                      <div style={{ color:'#4a5260', fontSize:12, padding:'8px 0' }}>Aucun chef affecté</div>
                    ) : affectations.filter(a => a.utilisateur?.role === 'chef').map(a => a.utilisateur && (
                      <div key={a.id} style={SAff.userRow}>
                        <div style={SAff.userAvatar}>
                          {a.utilisateur.initiales || a.utilisateur.nom?.slice(0,2).toUpperCase()}
                        </div>
                        <div style={{ flex:1 }}>
                          <div style={SAff.userName}>{a.utilisateur.nom}</div>
                          <div style={SAff.userEmail}>{a.utilisateur.email}</div>
                        </div>
                        <button style={S.btnDel} onClick={() => handleRetirerAff(a.utilisateur_id)}>
                          Retirer
                        </button>
                      </div>
                    ))}
                  </div>
                  <label style={S.label}>AFFECTER UN CHEF</label>
                  <div style={{ display:'flex', gap:10 }}>
                    <select style={{ ...S.input, flex:1 }} value={selectedUser} onChange={e => setSelectedUser(e.target.value)}>
                      <option value="">— Choisir un chef —</option>
                      {tousUtilisateurs
                        .filter(u => u.role === 'chef' && !affectations.find(a => a.utilisateur_id === u.id))
                        .map(u => <option key={u.id} value={u.id}>{u.nom}</option>)
                      }
                    </select>
                    <button style={S.btnPrimary} onClick={handleAffecter}>Affecter</button>
                  </div>
                </div>
              )}

              {/* ── Onglet Opérateurs ── ✅ contenu dans le div scrollable */}
              {affOnglet === 'operateur' && (
                <AffectationActionneurs
                  machine={affMachine}
                  chefAffecte={chefAffecte}
                />
              )}

            </div>

            {/* Footer fixe en bas du modal */}
            <div style={{
              borderTop: '1px solid rgba(255,255,255,0.07)',
              paddingTop: 16,
              marginTop: 12,
              display: 'flex',
              justifyContent: 'flex-end',
            }}>
              <button style={S.btnSecondary} onClick={closeAffModal}>Fermer</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ Modal Actionneurs ══ */}
      {showActModal && (
        <div style={S.overlay}>
          <div style={{ ...S.modal, width:680, maxHeight:'90vh', overflowY:'auto' }}>
            <div style={S.modalHead}>
              <span style={S.modalTitle}>⚙ Actionneurs — {actMachine?.nom}</span>
              <button style={S.modalClose} onClick={() => { setShowActModal(false); cancelEditAct(); }}>✕</button>
            </div>
            {actLoading ? (
              <div style={{ color:'#7a8394', textAlign:'center', padding:24 }}>Chargement...</div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
                <div>
                  <label style={S.label}>ACTIONNEURS ({actionneurs.length})</label>
                  {actionneurs.length === 0 && (
                    <div style={{ color:'#4a5260', fontSize:12, padding:'8px 0' }}>Aucun actionneur</div>
                  )}
                  {actionneurs.map(a => (
                    <div key={a.id} style={{ ...SA.actRow, ...(editAct?.id === a.id ? SA.actRowActive : {}) }}>
                      <div style={SA.actIcon}>⚙</div>
                      <div style={{ flex:1 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                          <span style={SA.actNom}>{a.nom}</span>
                          <span style={SA.actTypePill}>{a.type}</span>
                        </div>
                        {a.relais && <div style={SA.relaisTag}>🔌 Relais · {a.relais.etat ? 'ON' : 'OFF'}</div>}
                        {a.capteurs?.length > 0 && (
                          <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginTop:4 }}>
                            {a.capteurs.map((c, ci) => (
                              <span key={ci} style={SA.capChip}>
                                {ICONS[c.type]}
                                <span style={{ marginLeft:3 }}>{c.type}</span>
                                {c.seuil_max && <span style={{ color:'#4a5260', marginLeft:3 }}>≤{c.seuil_max}{c.unite}</span>}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                        <button style={S.btnEdit} onClick={() => startEditAct(a)}>✏</button>
                        <button style={S.btnDel}  onClick={() => handleDeleteAct(a.id)}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>
                <div>
                  <label style={{ ...S.label, color: editAct ? '#f5a623' : '#00d4aa' }}>
                    {editAct ? `✏ MODIFIER — ${editAct.nom}` : '+ NOUVEL ACTIONNEUR'}
                  </label>
                  {actError && <div style={S.error}>{actError}</div>}
                  <Field label="NOM">
                    <input style={S.input} value={actForm.nom}
                      onChange={e => setActForm({ ...actForm, nom: e.target.value })}
                      placeholder="Moteur principal" />
                  </Field>
                  <Field label="TYPE">
                    <select style={S.input} value={actForm.type}
                      onChange={e => setActForm({ ...actForm, type: e.target.value })}>
                      <option value="">— Choisir —</option>
                      {TYPES_ACT.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </Field>
                  <Field label="DESCRIPTION">
                    <input style={S.input} value={actForm.description}
                      onChange={e => setActForm({ ...actForm, description: e.target.value })}
                      placeholder="Optionnel" />
                  </Field>
                  <Field label="CAPTEURS ASSOCIÉS">
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                      {actCapteurs.map((c, i) => (
                        <div key={c.type}
                          style={{ ...S.capteurCard, ...(c.selected ? S.capteurCardActive : {}), padding:'8px 10px' }}
                          onClick={() => toggleActCapteur(i)}
                        >
                          <div style={S.capteurTop}>
                            <div style={S.capteurIcon}>{ICONS[c.type]}</div>
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={S.capteurName}>{c.label}</div>
                              <div style={S.capteurUnit}>{c.unite}</div>
                            </div>
                            <div style={{ ...S.capteurCheck, ...(c.selected ? S.capteurCheckActive : {}) }}>
                              {c.selected && <svg width="8" height="8" viewBox="0 0 10 10" fill="none" stroke="#0a0c0f" strokeWidth="2.5"><polyline points="1.5 5 4 7.5 8.5 2"/></svg>}
                            </div>
                          </div>
                          {c.selected && (
                            <div style={S.capteurThresholds} onClick={e => e.stopPropagation()}>
                              <input style={S.thresholdInput} type="number" placeholder="Min" value={c.seuil_min}
                                onChange={e => { const u=[...actCapteurs]; u[i]={...u[i],seuil_min:e.target.value}; setActCapteurs(u); }} />
                              <input style={S.thresholdInput} type="number" placeholder="Max" value={c.seuil_max}
                                onChange={e => { const u=[...actCapteurs]; u[i]={...u[i],seuil_max:e.target.value}; setActCapteurs(u); }} />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </Field>
                  <div style={SA.relaisInfo}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#00d4aa" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <span>Un relais ON/OFF est créé automatiquement</span>
                  </div>
                  <div style={{ display:'flex', gap:8 }}>
                    {editAct ? (
                      <>
                        <button style={{ ...S.btnSecondary, flex:1 }} onClick={cancelEditAct}>Annuler</button>
                        <button style={{ ...S.btnPrimary, flex:2, background:'#f5a623' }} onClick={handleSaveEditAct}>
                          Enregistrer les modifications
                        </button>
                      </>
                    ) : (
                      <button style={{ ...S.btnPrimary, width:'100%' }} onClick={handleAddActPost}>
                        + Ajouter l'actionneur
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
            <div style={{ ...S.modalFooter, borderTop:'1px solid rgba(255,255,255,0.07)', paddingTop:16, marginTop:20 }}>
              <button style={S.btnSecondary} onClick={() => { setShowActModal(false); cancelEditAct(); }}>Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── AffectationActionneurs ───────────────────────────────────────────────────

function AffectationActionneurs({ machine, chefAffecte }) {
  const [actionneurs, setActionneurs] = useState([]);
  const [operateurs, setOperateurs]   = useState([]);
  const [affActOp, setAffActOp]       = useState({});
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    if (!machine) return;
    loadData();
  }, [machine, chefAffecte?.id]);

  const loadData = async () => {
  setLoading(true);
  const actRes = await api.get(`/actionneurs?machine_id=${machine.id}`);
  setActionneurs(actRes.data);

  // Charger les opérateurs du chef
  if (chefAffecte) {
    const opRes = await api.get(`/mes-operateurs?chef_id=${chefAffecte.id}`);
    setOperateurs(opRes.data);
  } else {
    setOperateurs([]);
  }

  // Charger les affectations existantes pour chaque actionneur
  const affAct = {};
  for (const act of actRes.data) {
    try {
      const res = await api.get(`/actionneurs/par-operateur?actionneur_id=${act.id}`);
      // res.data = liste des opérateurs affectés à cet actionneur
      affAct[act.id] = Array.isArray(res.data) ? res.data.map(op => op.id) : [];
    } catch(e) {
      affAct[act.id] = [];
    }
  }
  setAffActOp(affAct);
  setLoading(false);
};

  const toggleAff = async (actionneurId, operateurId) => {
    const estAff = (affActOp[actionneurId] || []).includes(operateurId);
    if (estAff) {
      await api.post(`/actionneurs/${actionneurId}/retirer-affectation`, { operateur_id: operateurId });
      setAffActOp(prev => ({ ...prev, [actionneurId]: prev[actionneurId].filter(id => id !== operateurId) }));
    } else {
      await api.post(`/actionneurs/${actionneurId}/affecter`, {
        operateur_id: operateurId,
        affecte_par: JSON.parse(localStorage.getItem('user'))?.id,
      });
      setAffActOp(prev => ({ ...prev, [actionneurId]: [...(prev[actionneurId] || []), operateurId] }));
    }
  };

  if (loading) return <div style={{ color:'#7a8394', textAlign:'center', padding:20 }}>Chargement...</div>;

  if (!chefAffecte) return (
    <div style={SA.infoBox}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f5a623" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <span>Affectez d'abord un chef à cette machine pour voir ses opérateurs.</span>
    </div>
  );

  if (actionneurs.length === 0) return (
    <div style={{ color:'#4a5260', fontSize:12, textAlign:'center', padding:20 }}>
      Aucun actionneur sur cette machine
    </div>
  );

  return (
  <div style={{ maxHeight: '100%',overflowY: 'auto'}}>
      <div style={SA.chefBadge}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#00d4aa" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
        <span>Opérateurs du chef <strong style={{color:'#e8eaf0'}}>{chefAffecte.nom}</strong></span>
      </div>

      {operateurs.length === 0 && (
        <div style={{ color:'#4a5260', fontSize:12, marginBottom:12 }}>
          Ce chef n'a pas encore d'opérateurs.
        </div>
      )}

      {actionneurs.map(act => (
        <div key={act.id} style={SA.actBlock}>
          <div style={SA.actBlockHead}>
            <div style={SA.actBlockIcon}>⚙</div>
            <div>
              <div style={SA.actBlockNom}>{act.nom}</div>
              <div style={SA.actBlockType}>{act.type}</div>
            </div>
          </div>
          {operateurs.length === 0 ? (
            <div style={{ fontSize:11, color:'#4a5260' }}>Aucun opérateur disponible</div>
          ) : (
            <div style={SA.opList}>
              {operateurs.map(op => {
                const estAff = (affActOp[act.id] || []).includes(op.id);
                return (
                  <div key={op.id} style={{
                    ...SA.opRow,
                    background: estAff ? 'rgba(0,212,170,0.06)' : 'transparent',
                    border: estAff ? '1px solid rgba(0,212,170,0.15)' : '1px solid transparent',
                    borderRadius: 6,
                  }}>
                    <div style={SA.opAvatar}>{op.initiales}</div>
                    <div style={{flex:1}}>
                      <div style={SA.opNom}>{op.nom}</div>
                      <div style={{fontSize:10, color:'#4a5260'}}>{op.email}</div>
                    </div>
                    {estAff && <span style={{fontSize:10, color:'#00d4aa', marginRight:8}}>✓ Affecté</span>}
                    <button
                      style={{
                        ...SA.btnToggleAff,
                        background:  estAff ? 'rgba(255,71,87,0.08)'  : 'rgba(0,212,170,0.08)',
                        borderColor: estAff ? 'rgba(255,71,87,0.20)'  : 'rgba(0,212,170,0.20)',
                        color:       estAff ? '#ff4757' : '#00d4aa',
                      }}
                      onClick={() => toggleAff(act.id, op.id)}
                    >
                      {estAff ? 'Retirer' : 'Affecter'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── StepActionneurs ──────────────────────────────────────────────────────────

function StepActionneurs({ actionneursList, setActionneursList, onBack, onSubmit, error }) {
  const [form, setForm] = useState({ nom:'', type:'', description:'' });
  const [capteurSelects, setCapteurSelects] = useState(
    TYPES_CAPTEURS.map(t => ({ ...t, selected:false, seuil_min:'', seuil_max:'' }))
  );
  const [localError, setLocalError] = useState('');

  const handleAdd = () => {
    setLocalError('');
    if (!form.nom.trim() || !form.type) { setLocalError('Le nom et le type sont obligatoires'); return; }
    const nomCapture         = form.nom;
    const typeCapture        = form.type;
    const descriptionCapture = form.description;
    const capteursCapture    = capteurSelects
      .filter(c => c.selected)
      .map(c => ({ type:c.type, unite:c.unite, seuil_min:c.seuil_min||null, seuil_max:c.seuil_max||null }));
    setActionneursList(prev => [...prev, { nom:nomCapture, type:typeCapture, description:descriptionCapture, capteurs:capteursCapture }]);
    setForm({ nom:'', type:'', description:'' });
    setCapteurSelects(TYPES_CAPTEURS.map(t => ({ ...t, selected:false, seuil_min:'', seuil_max:'' })));
  };

  const handleRemove = (idx) => setActionneursList(prev => prev.filter((_, i) => i !== idx));
  const toggleCapteur = (i) => {
    setCapteurSelects(prev => { const u=[...prev]; u[i]={...u[i],selected:!u[i].selected}; return u; });
  };

  return (
    <div>
      {actionneursList.length > 0 && (
        <div style={{ marginBottom:20 }}>
          <label style={S.label}>ACTIONNEURS AJOUTÉS ({actionneursList.length})</label>
          {actionneursList.map((a, idx) => (
            <div key={idx} style={SA.actRow}>
              <div style={SA.actIcon}>⚙</div>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={SA.actNom}>{a.nom}</span>
                  <span style={SA.actTypePill}>{a.type}</span>
                </div>
                {a.capteurs.length > 0 ? (
                  <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginTop:5 }}>
                    {a.capteurs.map((c, ci) => (
                      <span key={ci} style={SA.capChip}>
                        {ICONS[c.type]}<span style={{ marginLeft:4 }}>{c.type}</span>
                        {c.seuil_max && <span style={{ color:'#4a5260', marginLeft:3 }}>≤{c.seuil_max}{c.unite}</span>}
                      </span>
                    ))}
                  </div>
                ) : <span style={{ fontSize:11, color:'#4a5260' }}>Aucun capteur</span>}
              </div>
              <button style={S.btnDel} onClick={() => handleRemove(idx)}>✕</button>
            </div>
          ))}
        </div>
      )}
      <div style={{ borderTop:'1px solid rgba(255,255,255,0.07)', paddingTop:16, marginBottom:14 }}>
        <label style={{ ...S.label, color:'#00d4aa' }}>+ NOUVEL ACTIONNEUR</label>
      </div>
      {localError && <div style={S.error}>{localError}</div>}
      <div style={S.grid2}>
        <Field label="NOM">
          <input style={S.input} value={form.nom} onChange={e => setForm({ ...form, nom:e.target.value })} placeholder="Moteur principal" />
        </Field>
        <Field label="TYPE">
          <select style={S.input} value={form.type} onChange={e => setForm({ ...form, type:e.target.value })}>
            <option value="">— Choisir —</option>
            {TYPES_ACT.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
      </div>
      <Field label="DESCRIPTION (optionnel)">
        <input style={S.input} value={form.description} onChange={e => setForm({ ...form, description:e.target.value })} placeholder="Optionnel" />
      </Field>
      <Field label="CAPTEURS ASSOCIÉS">
        <div style={S.capteurGrid}>
          {capteurSelects.map((c, i) => (
            <div key={c.type} style={{ ...S.capteurCard, ...(c.selected ? S.capteurCardActive : {}) }} onClick={() => toggleCapteur(i)}>
              <div style={S.capteurTop}>
                <div style={S.capteurIcon}>{ICONS[c.type]}</div>
                <div style={{ flex:1 }}><div style={S.capteurName}>{c.label}</div><div style={S.capteurUnit}>{c.unite}</div></div>
                <div style={{ ...S.capteurCheck, ...(c.selected ? S.capteurCheckActive : {}) }}>
                  {c.selected && <svg width="8" height="8" viewBox="0 0 10 10" fill="none" stroke="#0a0c0f" strokeWidth="2.5"><polyline points="1.5 5 4 7.5 8.5 2"/></svg>}
                </div>
              </div>
              {c.selected && (
                <div style={S.capteurThresholds} onClick={e => e.stopPropagation()}>
                  <input style={S.thresholdInput} type="number" placeholder={`Min (${c.unite})`} value={c.seuil_min}
                    onChange={e => { const u=[...capteurSelects]; u[i]={...u[i],seuil_min:e.target.value}; setCapteurSelects(u); }} />
                  <input style={S.thresholdInput} type="number" placeholder={`Max (${c.unite})`} value={c.seuil_max}
                    onChange={e => { const u=[...capteurSelects]; u[i]={...u[i],seuil_max:e.target.value}; setCapteurSelects(u); }} />
                </div>
              )}
            </div>
          ))}
        </div>
      </Field>
      <div style={SA.relaisInfo}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00d4aa" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span>Un relais ON/OFF sera créé automatiquement pour chaque actionneur</span>
      </div>
      <button style={{ ...S.btnSecondary, borderColor:'rgba(0,212,170,0.30)', color:'#00d4aa', width:'100%', marginBottom:20 }} onClick={handleAdd}>
        + Ajouter cet actionneur
      </button>
      <div style={{ ...S.modalFooter, borderTop:'1px solid rgba(255,255,255,0.07)', paddingTop:16 }}>
        <button style={S.btnSecondary} onClick={onBack}>← Retour</button>
        <button style={S.btnPrimary} onClick={onSubmit}>
          Créer la machine {actionneursList.length > 0 ? `(${actionneursList.length} actionneur${actionneursList.length > 1 ? 's':''})` : 'sans actionneur'}
        </button>
      </div>
      {error && <div style={{ ...S.error, marginTop:12 }}>{error}</div>}
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
  loading:          { color:'#7a8394', textAlign:'center', marginTop:40 },
  header:           { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 },
  headerTitle:      { fontSize:15, fontWeight:600, color:'#e8eaf0' },
  headerSub:        { fontSize:12, color:'#7a8394', marginTop:4 },
  grid:             { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 },
  card:             { background:'#161b22', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, padding:'20px', position:'relative', overflow:'hidden' },
  cardBar:          { position:'absolute', top:0, left:0, right:0, height:2 },
  cardHead:         { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 },
  cardName:         { fontSize:15, fontWeight:600, color:'#e8eaf0', marginBottom:4 },
  cardLoc:          { fontSize:11, color:'#7a8394' },
  cardMqtt:         { display:'flex', alignItems:'center', gap:8, marginBottom:10, padding:'6px 10px', background:'rgba(0,212,170,0.05)', border:'1px solid rgba(0,212,170,0.10)', borderRadius:6 },
  cardMqttLabel:    { fontSize:9, color:'#00d4aa', letterSpacing:1 },
  cardMqttVal:      { fontSize:11, color:'#7a8394' },
  cardDesc:         { fontSize:12, color:'#7a8394', marginBottom:14, lineHeight:1.5 },
  cardFooter:       { display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:14, paddingTop:14, borderTop:'1px solid rgba(255,255,255,0.05)' },
  staticBadge:      { fontSize:10, color:'#4a5260' },
  pill:             { display:'inline-flex', fontSize:10, padding:'3px 8px', borderRadius:4, flexShrink:0 },
  btnPrimary:       { padding:'8px 16px', background:'#00d4aa', border:'none', borderRadius:7, color:'#0a0c0f', fontWeight:600, fontSize:13, cursor:'pointer' },
  btnSecondary:     { padding:'8px 16px', background:'transparent', border:'1px solid rgba(255,255,255,0.12)', borderRadius:7, color:'#7a8394', fontSize:13, cursor:'pointer' },
  btnEdit:          { padding:'5px 10px', background:'rgba(0,153,255,0.10)', border:'1px solid rgba(0,153,255,0.20)', borderRadius:6, color:'#0099ff', fontSize:11, cursor:'pointer' },
  btnDel:           { padding:'5px 10px', background:'rgba(255,71,87,0.08)', border:'1px solid rgba(255,71,87,0.20)', borderRadius:6, color:'#ff4757', fontSize:11, cursor:'pointer' },
  btnAff:           { padding:'5px 10px', background:'rgba(168,85,247,0.10)', border:'1px solid rgba(168,85,247,0.20)', borderRadius:6, color:'#a855f7', fontSize:11, cursor:'pointer' },
  btnAct:           { padding:'5px 10px', background:'rgba(46,213,115,0.10)', border:'1px solid rgba(46,213,115,0.20)', borderRadius:6, color:'#2ed573', fontSize:11, cursor:'pointer' },
  overlay:          { position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 },
  modal:            { background:'#161b22', border:'1px solid rgba(255,255,255,0.12)', borderRadius:12, padding:'28px 32px', maxWidth:'90vw', overflow: 'hidden' },  modalHead:        { display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24 },
  modalTitle:       { fontSize:15, fontWeight:600, color:'#e8eaf0', marginBottom:12 },
  modalClose:       { background:'none', border:'none', color:'#7a8394', fontSize:16, cursor:'pointer', marginTop:2 },
  modalFooter:      { display:'flex', justifyContent:'flex-end', gap:10, marginTop:24 },
  grid2:            { display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 },
  label:            { display:'block', fontSize:11, color:'#7a8394', letterSpacing:1, marginBottom:7 },
  input:            { width:'100%', padding:'10px 14px', background:'#1c2129', border:'1px solid rgba(255,255,255,0.12)', borderRadius:7, color:'#e8eaf0', fontSize:13, outline:'none', boxSizing:'border-box' },
  error:            { background:'rgba(255,71,87,0.1)', border:'1px solid rgba(255,71,87,0.3)', color:'#ff4757', padding:'10px 14px', borderRadius:7, fontSize:13, marginBottom:16 },
  stepBar:          { display:'flex', alignItems:'center', gap:6 },
  stepDot:          { width:22, height:22, borderRadius:'50%', background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.15)', color:'#4a5260', fontSize:11, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
  stepDotActive:    { background:'#00d4aa', borderColor:'#00d4aa', color:'#0a0c0f', fontWeight:700 },
  stepLabel:        { fontSize:12, color:'#4a5260' },
  stepLabelActive:  { color:'#e8eaf0', fontWeight:500 },
  stepLine:         { width:28, height:1, background:'rgba(255,255,255,0.08)' },
  stepLineActive:   { background:'#00d4aa' },
  capteurGrid:          { display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 },
  capteurCard:          { background:'#1c2129', border:'0.5px solid rgba(255,255,255,0.10)', borderRadius:8, padding:'10px 12px', cursor:'pointer' },
  capteurCardActive:    { border:'1.5px solid rgba(0,212,170,0.50)', background:'rgba(0,212,170,0.06)' },
  capteurTop:           { display:'flex', alignItems:'center', gap:8 },
  capteurIcon:          { width:28, height:28, borderRadius:6, background:'rgba(0,212,170,0.10)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
  capteurName:          { fontSize:12, color:'#e8eaf0', fontWeight:500 },
  capteurUnit:          { fontSize:10, color:'#7a8394' },
  capteurCheck:         { width:16, height:16, borderRadius:4, border:'1.5px solid rgba(255,255,255,0.20)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
  capteurCheckActive:   { background:'#00d4aa', borderColor:'#00d4aa' },
  capteurThresholds:    { display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginTop:8 },
  thresholdInput:       { width:'100%', padding:'5px 8px', background:'#0e1117', border:'0.5px solid rgba(255,255,255,0.10)', borderRadius:5, color:'#e8eaf0', fontSize:11, outline:'none', boxSizing:'border-box' },
};

const SA = {
  actRow:       { display:'flex', alignItems:'flex-start', gap:12, padding:'10px 12px', background:'rgba(255,255,255,0.02)', borderRadius:8, marginBottom:8, border:'1px solid rgba(255,255,255,0.05)', cursor:'default' },
  actRowActive: { border:'1px solid rgba(245,166,35,0.35)', background:'rgba(245,166,35,0.04)' },
  actIcon:      { width:32, height:32, borderRadius:8, background:'rgba(46,213,115,0.10)', border:'1px solid rgba(46,213,115,0.20)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 },
  actNom:       { fontSize:13, fontWeight:600, color:'#e8eaf0' },
  actTypePill:  { fontSize:10, color:'#7a8394', background:'rgba(255,255,255,0.06)', borderRadius:4, padding:'2px 7px' },
  relaisTag:    { fontSize:10, color:'#00d4aa', background:'rgba(0,212,170,0.08)', border:'1px solid rgba(0,212,170,0.15)', borderRadius:4, padding:'2px 8px', display:'inline-block', marginBottom:4 },
  capChip:      { display:'inline-flex', alignItems:'center', fontSize:11, color:'#7a8394', background:'rgba(0,212,170,0.07)', border:'1px solid rgba(0,212,170,0.15)', borderRadius:4, padding:'2px 7px' },
  relaisInfo:   { display:'flex', alignItems:'center', gap:8, padding:'10px 14px', background:'rgba(0,212,170,0.06)', border:'1px solid rgba(0,212,170,0.15)', borderRadius:7, fontSize:12, color:'#00d4aa', marginBottom:16 },
  actBlock:     { background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:8, padding:'12px 14px', marginBottom:10 , overflow: 'hidden' },
  actBlockHead: { display:'flex', alignItems:'center', gap:10, marginBottom:10 },
  actBlockIcon: { width:30, height:30, borderRadius:7, background:'rgba(0,212,170,0.10)', border:'1px solid rgba(0,212,170,0.20)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0 },
  actBlockNom:  { fontSize:13, fontWeight:600, color:'#e8eaf0' },
  actBlockType: { fontSize:11, color:'#7a8394' },
  opList:       { display:'flex', flexDirection:'column', gap:6 },
  opRow:        { display:'flex', alignItems:'center', gap:10, padding:'7px 10px', transition:'background 0.15s' },
  opAvatar:     { width:26, height:26, borderRadius:'50%', background:'rgba(245,166,35,0.15)', border:'1px solid rgba(245,166,35,0.25)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:'#f5a623', flexShrink:0, fontWeight:600 },
  opNom:        { fontSize:12, color:'#e8eaf0', fontWeight:500 },
  btnToggleAff: { fontSize:11, padding:'4px 12px', border:'1px solid', borderRadius:5, cursor:'pointer', flexShrink:0 },
  chefBadge:    { display:'flex', alignItems:'center', gap:7, fontSize:12, color:'#00d4aa', background:'rgba(0,212,170,0.06)', border:'1px solid rgba(0,212,170,0.15)', borderRadius:6, padding:'7px 12px', marginBottom:14 },
  infoBox:      { display:'flex', alignItems:'center', gap:8, fontSize:12, color:'#f5a623', background:'rgba(245,166,35,0.06)', border:'1px solid rgba(245,166,35,0.20)', borderRadius:7, padding:'12px 14px' },
};

const SAff = {
  tabs:       { display:'flex', gap:4, marginBottom:20, background:'rgba(255,255,255,0.03)', padding:4, borderRadius:8 },
  tab:        { flex:1, padding:'8px 12px', background:'transparent', border:'none', borderRadius:6, color:'#7a8394', fontSize:12, cursor:'pointer', textAlign:'center' },
  tabActive:  { background:'rgba(0,212,170,0.12)', color:'#00d4aa', fontWeight:600 },
  userRow:    { display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' },
  userAvatar: { width:34, height:34, borderRadius:'50%', background:'rgba(0,153,255,0.15)', border:'1px solid rgba(0,153,255,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, color:'#0099ff', flexShrink:0 },
  userName:   { fontSize:13, color:'#e8eaf0', fontWeight:500 },
  userEmail:  { fontSize:11, color:'#7a8394' },
};