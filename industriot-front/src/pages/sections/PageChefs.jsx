import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { generateEmail } from '../../utils/generateEmail';
import { validateUsineEmail } from '../../utils/validateEmail';
import EmailField from '../../components/EmailField';
import { useAuth } from '../../context/AuthContext';

export default function PageChefs() {
  const [chefs, setChefs]               = useState([]);
  const { user } = useAuth();
  const slug = React.useMemo(() => 
    user?.entreprise?.slug || 'usine'
, [user?.entreprise?.slug]);
  const [machines, setMachines]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [showModal, setShowModal]       = useState(false);
  const [selectedChef, setSelectedChef] = useState(null);
  const [selectedMachine, setSelectedMachine] = useState('');
  const [showAddChef, setShowAddChef]   = useState(false);
  const [chefForm, setChefForm]         = useState({ nom:'', email:'', mot_de_passe:'' });
  const [chefError, setChefError]       = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = () => {
    Promise.all([api.get('/chefs'), api.get('/machines')])
      .then(([c, m]) => {
        setChefs(c.data);
        setMachines(m.data);
        setLoading(false);
      });
  };

  const handleAddChef = async () => {
    setChefError('');
    if (!chefForm.nom.trim()) { setChefError('Le nom est obligatoire'); return; }
    if (!chefForm.mot_de_passe) { setChefError('Le mot de passe est obligatoire'); return; }

    // Vérifier le domaine email
    const domain = chefForm.email.split('@')[1] ?? '';
    if (domain !== `${slug}.local`) {
        setChefError(`L'email doit être au format @${slug}.local`);
        return;
    }

    try {
        await api.post('/chefs', {
            nom:          chefForm.nom,
            email:        chefForm.email,
            mot_de_passe: chefForm.mot_de_passe,
        });
        setShowAddChef(false);
        setChefForm({ nom:'', email:'', mot_de_passe:'' });
        fetchData();
    } catch(e) {
        setChefError(e.response?.data?.message || 'Erreur');
    }
};

  const openModal = (chef) => {
    setSelectedChef(chef);
    setSelectedMachine('');
    setShowModal(true);
  };

  const handleAffecter = async () => {
    if (!selectedMachine) return;
    try {
      await api.post('/affectations', {
        utilisateur_id: selectedChef.id,
        machine_id:     parseInt(selectedMachine),
      });
      setShowModal(false);
      fetchData();
    } catch(e) {
      alert(e.response?.data?.message || 'Erreur');
    }
  };

  const handleRetirer = async (chefId, machineId) => {
    if (!window.confirm('Retirer cette affectation ?')) return;
    await api.delete(`/affectations/${chefId}/${machineId}`);
    fetchData();
  };

  if (loading) return <div style={S.loading}>Chargement...</div>;

  return (
    <div>
      {/* Header — une seule fois */}
      <div style={S.header}>
        <div>
          <div style={S.headerTitle}>Chefs de maintenance</div>
          <div style={S.headerSub}>{chefs.length} chef(s) actif(s)</div>
        </div>
        <button style={S.btnPrimary} onClick={() => { setChefForm({ nom:'', email:'', mot_de_passe:'' }); setChefError(''); setShowAddChef(true); }}>
          + Nouveau chef
        </button>
      </div>

      {/* Cards chefs */}
      <div style={S.grid}>
        {chefs.map(chef => (
          <div key={chef.id} style={S.card}>
            <div style={S.cardHead}>
              <div style={S.avatar}>{chef.initiales}</div>
              <div style={{flex:1}}>
                <div style={S.chefNom}>{chef.nom}</div>
                <div style={S.chefEmail}>{chef.email}</div>
              </div>
              <span style={S.roleBadge}>CHEF</span>
            </div>

            <div style={S.section}>
              <div style={S.sectionTitle}>MACHINES AFFECTÉES</div>
              {chef.machines.length === 0 ? (
                <div style={S.empty}>Aucune machine affectée</div>
              ) : (
                chef.machines.map(m => m && (
                  <div key={m.id} style={S.machineRow}>
                    <div style={{flex:1}}>
                      <div style={S.machineName}>{m.nom}</div>
                      <div style={S.machineLoc}>{m.localisation}</div>
                    </div>
                    <button style={S.btnRetirer} onClick={() => handleRetirer(chef.id, m.id)}>
                      Retirer
                    </button>
                  </div>
                ))
              )}
            </div>

            <button style={S.btnAffecter} onClick={() => openModal(chef)}>
              + Affecter une machine
            </button>
          </div>
        ))}
      </div>

      {/* Modal affectation machine */}
      {showModal && (
        <div style={S.overlay}>
          <div style={S.modal}>
            <div style={S.modalHead}>
              <span style={S.modalTitle}>Affecter une machine à {selectedChef?.nom}</span>
              <button style={S.modalClose} onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div style={{marginBottom:20}}>
              <label style={S.label}>MACHINE</label>
              <select style={S.input} value={selectedMachine} onChange={e => setSelectedMachine(e.target.value)}>
                <option value="">— Choisir une machine —</option>
                {machines
                  .filter(m => !selectedChef?.machines?.find(sm => sm?.id === m.id))
                  .map(m => <option key={m.id} value={m.id}>{m.nom} — {m.localisation}</option>)
                }
              </select>
            </div>
            <div style={S.modalFooter}>
              <button style={S.btnSecondary} onClick={() => setShowModal(false)}>Annuler</button>
              <button style={S.btnPrimary} onClick={handleAffecter}>Affecter</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal ajout chef */}
      {showAddChef && (
    <div style={S.overlay}>
        <div style={S.modal}>
            <div style={S.modalHead}>
                <span style={S.modalTitle}>Nouveau chef de maintenance</span>
                <button style={S.modalClose} onClick={() => setShowAddChef(false)}>✕</button>
            </div>
            {chefError && <div style={S.error}>{chefError}</div>}

            <Field label="NOM COMPLET">
                <input style={S.input} value={chefForm.nom}
                    onChange={e => setChefForm({
                        ...chefForm,
                        nom:   e.target.value,
                        email: generateEmail(e.target.value, slug)
                    })}
                    placeholder="Prénom Nom"/>
            </Field>

            <Field label="EMAIL">
  <EmailField
    value={form.email}
    onChange={(val) => {
      const local = val.split('@')[0];
      setForm({...form, email: `${local}@${slug}.local`});
    }}
    slug={slug}
    style={S.input}
  />
</Field>

            <Field label="MOT DE PASSE TEMPORAIRE">
                <input style={S.input} type="password" value={chefForm.mot_de_passe}
                    onChange={e => setChefForm({...chefForm, mot_de_passe: e.target.value})}
                    placeholder="••••••••"/>
            </Field>

            <div style={S.modalFooter}>
                <button style={S.btnSecondary} onClick={() => setShowAddChef(false)}>Annuler</button>
                <button style={S.btnPrimary} onClick={handleAddChef}>Créer</button>
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
  grid:         { display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:16 },
  card:         { background:'#161b22', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, padding:'20px' },
  cardHead:     { display:'flex', alignItems:'center', gap:12, marginBottom:20, paddingBottom:16, borderBottom:'1px solid rgba(255,255,255,0.06)' },
  avatar:       { width:40, height:40, borderRadius:'50%', background:'rgba(0,153,255,0.15)', border:'1px solid rgba(0,153,255,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontFamily:'monospace', color:'#0099ff', flexShrink:0 },
  chefNom:      { fontSize:14, fontWeight:600, color:'#e8eaf0', marginBottom:3 },
  chefEmail:    { fontSize:11, color:'#7a8394', fontFamily:'monospace' },
  roleBadge:    { fontSize:10, fontFamily:'monospace', padding:'3px 8px', borderRadius:4, background:'rgba(0,153,255,0.10)', color:'#0099ff', border:'1px solid rgba(0,153,255,0.20)' },
  section:      { marginBottom:16 },
  sectionTitle: { fontFamily:'monospace', fontSize:9, color:'#4a5260', letterSpacing:2, textTransform:'uppercase', marginBottom:10 },
  empty:        { fontSize:12, color:'#4a5260', fontStyle:'italic', padding:'8px 0' },
  machineRow:   { display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' },
  machineName:  { fontSize:13, color:'#e8eaf0', marginBottom:2 },
  machineLoc:   { fontSize:11, color:'#7a8394', fontFamily:'monospace' },
  btnRetirer:   { padding:'4px 10px', background:'rgba(255,71,87,0.08)', border:'1px solid rgba(255,71,87,0.20)', borderRadius:6, color:'#ff4757', fontSize:11, cursor:'pointer', flexShrink:0 },
  btnAffecter:  { width:'100%', padding:'8px', background:'rgba(0,153,255,0.08)', border:'1px solid rgba(0,153,255,0.20)', borderRadius:7, color:'#0099ff', fontSize:12, cursor:'pointer', marginTop:4 },
  btnPrimary:   { padding:'8px 16px', background:'#00d4aa', border:'none', borderRadius:7, color:'#0a0c0f', fontWeight:600, fontSize:13, cursor:'pointer' },
  btnSecondary: { padding:'8px 16px', background:'transparent', border:'1px solid rgba(255,255,255,0.12)', borderRadius:7, color:'#7a8394', fontSize:13, cursor:'pointer' },
  overlay:      { position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 },
  modal:        { background:'#161b22', border:'1px solid rgba(255,255,255,0.12)', borderRadius:12, padding:'28px 32px', width:440, maxWidth:'90vw' },
  modalHead:    { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 },
  modalTitle:   { fontSize:15, fontWeight:600, color:'#e8eaf0' },
  modalClose:   { background:'none', border:'none', color:'#7a8394', fontSize:16, cursor:'pointer' },
  modalFooter:  { display:'flex', justifyContent:'flex-end', gap:10, marginTop:24 },
  label:        { display:'block', fontSize:11, color:'#7a8394', letterSpacing:1, marginBottom:7, fontFamily:'monospace' },
  input:        { width:'100%', padding:'10px 14px', background:'#1c2129', border:'1px solid rgba(255,255,255,0.12)', borderRadius:7, color:'#e8eaf0', fontSize:13, outline:'none', boxSizing:'border-box' },
  error:        { background:'rgba(255,71,87,0.1)', border:'1px solid rgba(255,71,87,0.3)', color:'#ff4757', padding:'10px 14px', borderRadius:7, fontSize:13, marginBottom:16 },
};