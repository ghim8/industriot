import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import EmailField from '../../components/EmailField';
import api from '../../api/axios';

export default function PageMesOperateurs() {
  const { user } = useAuth();
  const slug = React.useMemo(() =>
    user?.entreprise?.slug || 'usine'
  , [user?.entreprise?.slug]);

  const [operateurs, setOperateurs]         = useState([]);
  const [loading, setLoading]               = useState(true);
  const [showModal, setShowModal]           = useState(false);
  const [showAffModal, setShowAffModal]     = useState(false);
  const [selectedOp, setSelectedOp]         = useState(null);
  const [actionneurs, setActionneurs]       = useState([]);
  const [affActionneurs, setAffActionneurs] = useState([]);
  const [form, setForm]   = useState({ nom:'', email:'', mot_de_passe:'' });
  const [error, setError] = useState('');

  useEffect(() => { fetchOperateurs(); }, []);

  const fetchOperateurs = () => {
    api.get('/mes-operateurs').then(r => {
      setOperateurs(r.data);
      setLoading(false);
    });
  };

  // ── Génération email automatique ──
  const handleNomChange = (nom) => {
    const parts = nom.trim().split(/\s+/).filter(p => p.length > 0);
    let emailLocal = '';

    if (parts.length >= 2) {
      const prenom     = parts[0]
                          .toLowerCase()
                          .normalize('NFD')
                          .replace(/[\u0300-\u036f]/g, '');
      const nomFamille = parts.slice(1).join('')
                          .toLowerCase()
                          .normalize('NFD')
                          .replace(/[\u0300-\u036f]/g, '');
      emailLocal = `${prenom[0]}.${nomFamille}`;
    } else if (parts.length === 1) {
      emailLocal = parts[0]
                    .toLowerCase()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '');
    }

    emailLocal = emailLocal.replace(/[^a-z0-9.]/g, '');

    setForm(f => ({
      ...f,
      nom,
      email: emailLocal ? `${emailLocal}@${slug}.local` : '',
    }));
  };

  // ── Soumission création opérateur ──
  const handleSubmit = async () => {
    setError('');
    if (!form.nom.trim())   { setError('Le nom est obligatoire');          return; }
    if (!form.email)        { setError("L'email est obligatoire");         return; }
    if (!form.mot_de_passe) { setError('Le mot de passe est obligatoire'); return; }
    const emailDomain = form.email.split('@')[1] ?? '';
    if (emailDomain !== `${slug}.local`) {
      setError(`L'email doit être au format @${slug}.local`);
      return;
    }
    try {
      await api.post('/utilisateurs', {
        nom:          form.nom,
        email:        form.email,
        mot_de_passe: form.mot_de_passe,
        role:         'operateur',
        statut:       'ACTIF',
        chef_id:      user.id,
      });
      setShowModal(false);
      setForm({ nom:'', email:'', mot_de_passe:'' });
      fetchOperateurs();
    } catch(e) {
      setError(e.response?.data?.message || 'Erreur');
    }
  };

  // ── Gestion affectation actionneurs ──
  const openAffModal = async (op) => {
    setSelectedOp(op);
    const [resAct, resAff] = await Promise.all([
      api.get(`/actionneurs?machine_id=all&chef_id=${user.id}`),
      api.get(`/actionneurs/par-operateur?operateur_id=${op.id}`),
    ]);
    setActionneurs(resAct.data || []);
    setAffActionneurs(resAff.data.map(a => a.id));
    setShowAffModal(true);
  };

  const toggleActionneur = async (actionneurId) => {
    const estAffecte = affActionneurs.includes(actionneurId);
    if (estAffecte) {
      await api.post(`/actionneurs/${actionneurId}/retirer-affectation`, {
        operateur_id: selectedOp.id,
      });
      setAffActionneurs(prev => prev.filter(id => id !== actionneurId));
    } else {
      await api.post(`/actionneurs/${actionneurId}/affecter`, {
        operateur_id: selectedOp.id,
        affecte_par:  user.id,
      });
      setAffActionneurs(prev => [...prev, actionneurId]);
    }
  };

  if (loading) return <div style={S.loading}>Chargement...</div>;

  return (
    <div>

      {/* ── Header ── */}
      <div style={S.header}>
        <div>
          <div style={S.headerTitle}>Mes opérateurs</div>
          <div style={S.headerSub}>{operateurs.length} opérateur(s) sur vos machines</div>
        </div>
        <button style={S.btnPrimary} onClick={() => {
          setForm({ nom:'', email:'', mot_de_passe:'' });
          setError('');
          setShowModal(true);
        }}>
          + Ajouter opérateur
        </button>
      </div>

      {/* ── Liste opérateurs ── */}
      {operateurs.length === 0 ? (
        <div style={S.empty}>Aucun opérateur affecté à vos machines</div>
      ) : (
        <div style={S.grid}>
          {operateurs.map(op => (
            <div key={op.id} style={S.card}>
              <div style={S.cardHead}>
                <div style={S.avatar}>{op.initiales}</div>
                <div style={{flex:1, minWidth:0}}>
                  <div style={S.nom}>{op.nom}</div>
                  <div style={S.email}>{op.email}</div>
                  {op.matricule && (
                    <div style={{fontFamily:'monospace', fontSize:11, color:'#00d4aa', letterSpacing:1, marginTop:2}}>
                      {op.matricule}
                    </div>
                  )}
                </div>
                <span style={{...S.pill, ...(op.statut==='ACTIF' ? S.pillOk : S.pillOff)}}>
                  {op.statut}
                </span>
              </div>
              <button style={S.btnAffecter} onClick={() => openAffModal(op)}>
                ⚙ Gérer les actionneurs
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ══════════════════════════════════════
          MODAL — Ajouter un opérateur
          ══════════════════════════════════════ */}
      {showModal && (
        <div style={S.overlay}>
          <div style={S.modal}>

            <div style={S.modalHead}>
              <span style={S.modalTitle}>Ajouter un opérateur</span>
              <button style={S.modalClose} onClick={() => setShowModal(false)}>✕</button>
            </div>

            {error && <div style={S.error}>{error}</div>}

            <Field label="NOM COMPLET">
              <input
                style={S.input}
                value={form.nom}
                onChange={e => handleNomChange(e.target.value)}
                placeholder="Rim Azaiz"
                autoComplete="off"
              />
            </Field>

            <Field label="EMAIL (généré automatiquement)">
              <EmailField
                value={form.email}
                onChange={(val) => {
                  const local = val.split('@')[0];
                  setForm(f => ({...f, email: `${local}@${slug}.local`}));
                }}
                slug={slug}
                style={S.input}
              />
            </Field>

            <Field label="MOT DE PASSE TEMPORAIRE">
              <input
                style={S.input}
                type="password"
                value={form.mot_de_passe}
                onChange={e => setForm(f => ({...f, mot_de_passe: e.target.value}))}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </Field>
            
            <div style={S.modalFooter}>
              <button style={S.btnSecondary} onClick={() => setShowModal(false)}>
                Annuler
              </button>
              <button style={S.btnPrimary} onClick={handleSubmit}>
                Créer
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          MODAL — Gérer les actionneurs
          ══════════════════════════════════════ */}
      {showAffModal && (
        <div style={S.overlay}>
          <div style={{...S.modal, width:520}}>

            <div style={S.modalHead}>
              <span style={S.modalTitle}>Actionneurs — {selectedOp?.nom}</span>
              <button style={S.modalClose} onClick={() => setShowAffModal(false)}>✕</button>
            </div>

            <div style={S.affSubtitle}>
              Sélectionnez les actionneurs que cet opérateur peut contrôler
            </div>

            {actionneurs.length === 0 ? (
              <div style={S.emptyAff}>Aucun actionneur disponible sur vos machines</div>
            ) : (() => {
              // Grouper par machine
              const parMachine = {};
              actionneurs.forEach(a => {
                const key   = a.machine_id;
                const label = a.machine?.nom || `Machine ${a.machine_id}`;
                if (!parMachine[key]) parMachine[key] = { label, actionneurs:[] };
                parMachine[key].actionneurs.push(a);
              });

              return Object.entries(parMachine).map(([machineId, groupe]) => (
                <div key={machineId} style={S.machineGroup}>

                  <div style={S.machineGroupHead}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#7a8394" strokeWidth="2">
                      <rect x="2" y="7" width="20" height="14" rx="2"/>
                      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
                    </svg>
                    <span style={S.machineGroupLabel}>{groupe.label}</span>
                    <span style={S.machineGroupCount}>{groupe.actionneurs.length} actionneur(s)</span>
                  </div>

                  <div style={S.actGrid}>
                    {groupe.actionneurs.map(a => {
                      const sel = affActionneurs.includes(a.id);
                      return (
                        <div
                          key={a.id}
                          style={{...S.actCard, ...(sel ? S.actCardActive : {})}}
                          onClick={() => toggleActionneur(a.id)}
                        >
                          <div style={S.actTop}>
                            <div style={{...S.actCheck, ...(sel ? S.actCheckActive : {})}}>
                              {sel && (
                                <svg width="8" height="8" viewBox="0 0 10 10" fill="none" stroke="#0a0c0f" strokeWidth="2.5">
                                  <polyline points="1.5 5 4 7.5 8.5 2"/>
                                </svg>
                              )}
                            </div>
                            <div style={{flex:1}}>
                              <div style={S.actNom}>{a.nom}</div>
                              <div style={S.actType}>{a.type}</div>
                            </div>
                            {a.relais && (
                              <span style={{...S.relaisTag, color: a.relais.etat ? '#2ed573' : '#7a8394'}}>
                                🔌 {a.relais.etat ? 'ON' : 'OFF'}
                              </span>
                            )}
                          </div>
                          {a.capteurs?.length > 0 && (
                            <div style={S.capsList}>
                              {a.capteurs.map(c => (
                                <span key={c.id} style={S.capChip}>{c.type}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                </div>
              ));
            })()}

            <div style={S.modalFooter}>
              <button style={S.btnPrimary} onClick={() => setShowAffModal(false)}>
                Fermer
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

// ── Composant Field local ──
function Field({ label, children }) {
  return (
    <div style={{ marginBottom:16 }}>
      <label style={S.label}>{label}</label>
      {children}
    </div>
  );
}

// ── Styles ──
const S = {
  loading:          { color:'#7a8394', textAlign:'center', marginTop:40 },
  header:           { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 },
  headerTitle:      { fontSize:15, fontWeight:600, color:'#e8eaf0' },
  headerSub:        { fontSize:12, color:'#7a8394', marginTop:4 },
  empty:            { color:'#4a5260', textAlign:'center', marginTop:60, fontSize:13 },
  grid:             { display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:14 },
  card:             { background:'#161b22', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, padding:'16px 18px' },
  cardHead:         { display:'flex', alignItems:'center', gap:10, marginBottom:12 },
  avatar:           { width:38, height:38, borderRadius:'50%', background:'rgba(245,166,35,0.15)', border:'1px solid rgba(245,166,35,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, color:'#f5a623', flexShrink:0, fontWeight:600 },
  nom:              { fontSize:13, fontWeight:600, color:'#e8eaf0', marginBottom:2 },
  email:            { fontSize:11, color:'#7a8394' },
  pill:             { display:'inline-flex', fontSize:10, padding:'3px 8px', borderRadius:4, flexShrink:0 },
  pillOk:           { background:'rgba(46,213,115,0.15)', color:'#2ed573' },
  pillOff:          { background:'rgba(255,71,87,0.15)', color:'#ff4757' },
  btnAffecter:      { width:'100%', padding:'8px', background:'rgba(0,212,170,0.08)', border:'1px solid rgba(0,212,170,0.18)', borderRadius:7, color:'#00d4aa', fontSize:12, cursor:'pointer' },
  btnPrimary:       { padding:'8px 16px', background:'#00d4aa', border:'none', borderRadius:7, color:'#0a0c0f', fontWeight:600, fontSize:13, cursor:'pointer' },
  btnSecondary:     { padding:'8px 16px', background:'transparent', border:'1px solid rgba(255,255,255,0.12)', borderRadius:7, color:'#7a8394', fontSize:13, cursor:'pointer' },
  overlay:          { position:'fixed', inset:0, background:'rgba(0,0,0,0.65)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 },
  modal:            { background:'#161b22', border:'1px solid rgba(255,255,255,0.12)', borderRadius:12, padding:'28px 32px', width:460, maxWidth:'90vw', maxHeight:'85vh', overflowY:'auto' },
  modalHead:        { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 },
  modalTitle:       { fontSize:15, fontWeight:600, color:'#e8eaf0' },
  modalClose:       { background:'none', border:'none', color:'#7a8394', fontSize:16, cursor:'pointer' },
  modalFooter:      { display:'flex', justifyContent:'flex-end', gap:10, marginTop:20 },
  label:            { display:'block', fontSize:11, color:'#7a8394', letterSpacing:1, marginBottom:7 },
  input:            { width:'100%', padding:'10px 14px', background:'#1c2129', border:'1px solid rgba(255,255,255,0.12)', borderRadius:7, color:'#e8eaf0', fontSize:13, outline:'none', boxSizing:'border-box' },
  error:            { background:'rgba(255,71,87,0.1)', border:'1px solid rgba(255,71,87,0.3)', color:'#ff4757', padding:'10px 14px', borderRadius:7, fontSize:13, marginBottom:16 },
  infoBox:          { fontSize:12, color:'#00d4aa', background:'rgba(0,212,170,0.06)', border:'1px solid rgba(0,212,170,0.15)', borderRadius:7, padding:'10px 14px', marginBottom:4 },
  affSubtitle:      { fontSize:12, color:'#7a8394', marginBottom:16 },
  emptyAff:         { color:'#4a5260', fontSize:12, textAlign:'center', padding:'20px 0' },
  actGrid:          { display:'flex', flexDirection:'column', gap:8, marginBottom:16 },
  actCard:          { background:'#1c2129', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, padding:'12px 14px', cursor:'pointer', transition:'all 0.15s' },
  actCardActive:    { border:'1.5px solid rgba(0,212,170,0.40)', background:'rgba(0,212,170,0.06)' },
  actTop:           { display:'flex', alignItems:'center', gap:10, marginBottom:6 },
  actCheck:         { width:16, height:16, borderRadius:4, border:'1.5px solid rgba(255,255,255,0.18)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
  actCheckActive:   { background:'#00d4aa', borderColor:'#00d4aa' },
  actNom:           { fontSize:13, fontWeight:600, color:'#e8eaf0', marginBottom:2 },
  actType:          { fontSize:11, color:'#7a8394' },
  relaisTag:        { fontSize:10, flexShrink:0 },
  capsList:         { display:'flex', gap:5, flexWrap:'wrap' },
  capChip:          { fontSize:10, color:'#7a8394', background:'rgba(255,255,255,0.05)', borderRadius:4, padding:'2px 7px' },
  machineGroup:     { marginBottom:16 },
  machineGroupHead: { display:'flex', alignItems:'center', gap:8, padding:'8px 10px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:7, marginBottom:8 },
  machineGroupLabel:{ fontSize:12, fontWeight:600, color:'#e8eaf0', flex:1 },
  machineGroupCount:{ fontSize:10, color:'#4a5260' },
};