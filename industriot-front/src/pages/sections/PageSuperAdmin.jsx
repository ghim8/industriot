import React, { useEffect, useState } from 'react';
import api from '../../api/axios';

export default function PageSuperAdmin() {
  const [entreprises, setEntreprises] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [showModal, setShowModal]     = useState(false);
  const [form, setForm] = useState({
    nom:'', slug:'', email_contact:'',
    admin_nom:'', admin_email:'', admin_mot_de_passe:''
  });
  const [error, setError] = useState('');
  const [emailGenere, setEmailGenere]           = useState('');
const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => { fetchEntreprises(); }, []);

  const fetchEntreprises = () => {
    api.get('/super-admin/entreprises').then(r => {
      setEntreprises(r.data);
      setLoading(false);
    });
  };

  const handleCreate = async () => {
    try {
        const res = await api.post('/super-admin/entreprises', {
            nom:                form.nom,
            slug:               form.slug,
            email_contact:      form.email_contact,
            admin_nom:          form.admin_nom,
            admin_mot_de_passe: form.admin_mot_de_passe,
        });

        // Afficher l'email généré
        setEmailGenere(res.data.email_genere);
        setShowSuccessModal(true);
        fetchEntreprises();
        setShowModal(false);

    } catch(e) {
        setError(e.response?.data?.message || 'Erreur');
    }
};

  const handleToggle = async (id) => {
    await api.post(`/super-admin/entreprises/${id}/toggle`);
    fetchEntreprises();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette entreprise et toutes ses données ?')) return;
    await api.delete(`/super-admin/entreprises/${id}`);
    fetchEntreprises();
  };

  if (loading) return <div style={S.loading}>Chargement...</div>;

  return (
    <div>
      <div style={S.header}>
        <div>
          <div style={S.headerTitle}>Gestion des entreprises</div>
          <div style={S.headerSub}>{entreprises.length} entreprise(s) enregistrée(s)</div>
        </div>
        <button style={S.btnPrimary} onClick={() => setShowModal(true)}>
          + Nouvelle entreprise
        </button>
      </div>

      {/* Métriques globales */}
      <div style={S.metricsRow}>
  <div style={S.mcard}>
    <div style={{...S.mcardBar, background:'#00d4aa'}}/>
    <div style={S.mcardLabel}>TOTAL ENTREPRISES</div>
    <div style={S.mcardVal}>{entreprises.length}</div>
  </div>
  <div style={S.mcard}>
    <div style={{...S.mcardBar, background:'#2ed573'}}/>
    <div style={S.mcardLabel}>ENTREPRISES ACTIVES</div>
    <div style={S.mcardVal}>{entreprises.filter(e => e.actif).length}</div>
  </div>
  <div style={S.mcard}>
    <div style={{...S.mcardBar, background:'#ff4757'}}/>
    <div style={S.mcardLabel}>ENTREPRISES INACTIVES</div>
    <div style={S.mcardVal}>{entreprises.filter(e => !e.actif).length}</div>
  </div>
</div>

      {/* Liste entreprises */}
      <div style={S.grid}>
        {entreprises.map(e => (
          <div key={e.id} style={S.card}>
            <div style={{...S.cardBar, background: e.actif ? '#2ed573' : '#ff4757'}}/>
            <div style={S.cardHead}>
              <div style={S.cardAvatar}>{e.nom.slice(0,2).toUpperCase()}</div>
              <div style={{flex:1}}>
                <div style={S.cardNom}>{e.nom}</div>
                <div style={S.cardSlug}>/{e.slug}</div>
              </div>
              <span style={{
                ...S.pill,
                background: e.actif ? 'rgba(46,213,115,0.15)' : 'rgba(255,71,87,0.15)',
                color:      e.actif ? '#2ed573' : '#ff4757',
              }}>
                {e.actif ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div style={S.cardInfo}>
              <div style={S.infoRow}>
                <span style={S.infoLabel}>Email</span>
                <span style={S.infoVal}>{e.email_contact}</span>
              </div>
              <div style={S.infoRow}>
                <span style={S.infoLabel}>Utilisateurs</span>
                <span style={S.infoVal}>{e.utilisateurs_count || 0}</span>
              </div>
              <div style={S.infoRow}>
                <span style={S.infoLabel}>Machines</span>
                <span style={S.infoVal}>{e.machines_count || 0}</span>
              </div>
            </div>

            <div style={S.cardFooter}>
              <button style={{
                ...S.btnToggle,
                background:  e.actif ? 'rgba(255,71,87,0.08)'  : 'rgba(46,213,115,0.08)',
                borderColor: e.actif ? 'rgba(255,71,87,0.20)'  : 'rgba(46,213,115,0.20)',
                color:       e.actif ? '#ff4757' : '#2ed573',
              }} onClick={() => handleToggle(e.id)}>
                {e.actif ? 'Désactiver' : 'Activer'}
              </button>
              <button style={S.btnDel} onClick={() => handleDelete(e.id)}>
                Supprimer
              </button>
            </div>
          </div>
        ))}
      </div>
{/* Modal succès */}
{showSuccessModal && (
    <div style={S.overlay}>
        <div style={{...S.modal, width:420, textAlign:'center'}}>
            <div style={{fontSize:40, marginBottom:12}}>✅</div>
            <div style={{fontSize:16, fontWeight:600, color:'#e8eaf0', marginBottom:8}}>
                Entreprise créée avec succès !
            </div>
            <div style={{fontSize:13, color:'#7a8394', marginBottom:20}}>
                Transmettez ces identifiants à l'administrateur :
            </div>
            <div style={{
                background:'rgba(0,212,170,0.06)',
                border:'1px solid rgba(0,212,170,0.20)',
                borderRadius:8, padding:'16px 18px',
                marginBottom:20, textAlign:'left',
            }}>
                <div style={{fontSize:11, color:'#7a8394', marginBottom:4}}>EMAIL</div>
                <div style={{fontSize:14, color:'#00d4aa', fontWeight:600, marginBottom:14}}>
                    {emailGenere}
                </div>
                <div style={{fontSize:11, color:'#7a8394', marginBottom:4}}>MOT DE PASSE TEMPORAIRE</div>
                <div style={{fontSize:14, color:'#f5a623', fontWeight:600}}>
                    {form.admin_mot_de_passe}
                </div>
            </div>
                        <button style={S.btnPrimary} onClick={() => {
                setShowSuccessModal(false);
                setForm({ nom:'', slug:'', email_contact:'', admin_nom:'', admin_mot_de_passe:'' });
            }}>
                Fermer
            </button>
        </div>
    </div>
)}
      {/* Modal création */}
      {showModal && (
        <div style={S.overlay}>
          <div style={{...S.modal, width:520}}>
            <div style={S.modalHead}>
              <span style={S.modalTitle}>Nouvelle entreprise</span>
              <button style={S.modalClose} onClick={() => setShowModal(false)}>✕</button>
            </div>
            {error && <div style={S.error}>{error}</div>}

            <div style={{borderBottom:'1px solid rgba(255,255,255,0.08)', marginBottom:16, paddingBottom:8}}>
              <label style={{...S.label, color:'#00d4aa'}}>INFORMATIONS ENTREPRISE</label>
            </div>
            <Field label="NOM DE L'ENTREPRISE">
              <input style={S.input} value={form.nom}
                onChange={e => setForm({...form, nom:e.target.value, slug:e.target.value.toLowerCase().replace(/\s+/g,'-')})}
                placeholder="Entreprise Alpha"/>
            </Field>
            <div style={S.grid2}>
              <Field label="SLUG (identifiant URL)">
                <input style={S.input} value={form.slug}
                  onChange={e => setForm({...form, slug:e.target.value})}
                  placeholder="entreprise-alpha"/>
              </Field>
              <Field label="EMAIL CONTACT">
                <input style={S.input} type="email" value={form.email_contact}
                  onChange={e => setForm({...form, email_contact:e.target.value})}
                  placeholder="contact@entreprise.com"/>
              </Field>
            </div>

            <div style={{borderBottom:'1px solid rgba(255,255,255,0.08)', marginBottom:16, marginTop:8, paddingBottom:8}}>
              <label style={{...S.label, color:'#f5a623'}}>ADMINISTRATEUR DE L'ENTREPRISE</label>
            </div>
            <Field label="NOM DE L'ADMIN">
              <input style={S.input} value={form.admin_nom}
                onChange={e => setForm({...form, admin_nom:e.target.value})}
                placeholder="Tarek Ben Ali"/>
            </Field>
            {/* Email généré — hors du grid2 */}
<div style={{
    padding:'10px 14px',
    background:'rgba(0,212,170,0.06)',
    border:'1px solid rgba(0,212,170,0.15)',
    borderRadius:8,
    fontSize:12,
    color:'#00d4aa',
    marginBottom:14,
}}>
    📧 Email généré automatiquement :&nbsp;
    <strong>
        {form.admin_nom
            ? `${form.admin_nom.split(' ')[0].toLowerCase()}@${form.slug || 'slug'}.local`
            : `prenom@${form.slug || 'slug'}.local`
        }
    </strong>
</div>

{/* Mot de passe seul */}
<Field label="MOT DE PASSE TEMPORAIRE">
    <input style={S.input} type="password" value={form.admin_mot_de_passe}
        onChange={e => setForm({...form, admin_mot_de_passe:e.target.value})}
        placeholder="••••••••"/>
</Field>
            
            <div style={S.modalFooter}>
              <button style={S.btnSecondary} onClick={() => setShowModal(false)}>Annuler</button>
              <button style={S.btnPrimary} onClick={handleCreate}>Créer l'entreprise</button>
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
  metricsRow:   { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:20 },
  mcard:        { background:'#161b22', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, padding:'16px 18px', position:'relative', overflow:'hidden' },
  mcardBar:     { position:'absolute', top:0, left:0, right:0, height:2 },
  mcardLabel:   { fontSize:11, color:'#4a5260', textTransform:'uppercase', marginBottom:10, fontWeight:500 },
  mcardVal:     { fontSize:28, fontWeight:700, color:'#e8eaf0' },
  grid:         { display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:16 },
  card:         { background:'#161b22', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, padding:'18px 20px', position:'relative', overflow:'hidden' },
  cardBar:      { position:'absolute', top:0, left:0, right:0, height:2 },
  cardHead:     { display:'flex', alignItems:'center', gap:12, marginBottom:14 },
  cardAvatar:   { width:40, height:40, borderRadius:10, background:'rgba(0,212,170,0.12)', border:'1px solid rgba(0,212,170,0.25)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:700, color:'#00d4aa', flexShrink:0 },
  cardNom:      { fontSize:14, fontWeight:600, color:'#e8eaf0', marginBottom:3 },
  cardSlug:     { fontSize:11, color:'#4a5260' },
  pill:         { display:'inline-flex', fontSize:10, padding:'3px 8px', borderRadius:4, flexShrink:0 },
  cardInfo:     { marginBottom:14 },
  infoRow:      { display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid rgba(255,255,255,0.04)', fontSize:12 },
  infoLabel:    { color:'#7a8394' },
  infoVal:      { color:'#e8eaf0', fontWeight:500 },
  cardFooter:   { display:'flex', gap:8 },
  btnToggle:    { flex:1, padding:'7px', border:'1px solid', borderRadius:6, fontSize:11, cursor:'pointer' },
  btnDel:       { padding:'7px 12px', background:'rgba(255,71,87,0.08)', border:'1px solid rgba(255,71,87,0.20)', borderRadius:6, color:'#ff4757', fontSize:11, cursor:'pointer' },
  btnPrimary:   { padding:'8px 16px', background:'#00d4aa', border:'none', borderRadius:7, color:'#0a0c0f', fontWeight:600, fontSize:13, cursor:'pointer' },
  btnSecondary: { padding:'8px 16px', background:'transparent', border:'1px solid rgba(255,255,255,0.12)', borderRadius:7, color:'#7a8394', fontSize:13, cursor:'pointer' },
  overlay:      { position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 },
  modal:        { background:'#161b22', border:'1px solid rgba(255,255,255,0.12)', borderRadius:12, padding:'28px 32px', maxWidth:'90vw', maxHeight:'90vh', overflowY:'auto' },
  modalHead:    { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 },
  modalTitle:   { fontSize:15, fontWeight:600, color:'#e8eaf0' },
  modalClose:   { background:'none', border:'none', color:'#7a8394', fontSize:16, cursor:'pointer' },
  modalFooter:  { display:'flex', justifyContent:'flex-end', gap:10, marginTop:20 },
  grid2:        { display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 },
  label:        { display:'block', fontSize:11, color:'#7a8394', letterSpacing:1, marginBottom:7 },
  input:        { width:'100%', padding:'10px 14px', background:'#1c2129', border:'1px solid rgba(255,255,255,0.12)', borderRadius:7, color:'#e8eaf0', fontSize:13, outline:'none', boxSizing:'border-box' },
  error:        { background:'rgba(255,71,87,0.1)', border:'1px solid rgba(255,71,87,0.3)', color:'#ff4757', padding:'10px 14px', borderRadius:7, fontSize:13, marginBottom:16 },
  infoBox:      { fontSize:12, color:'#00d4aa', background:'rgba(0,212,170,0.06)', border:'1px solid rgba(0,212,170,0.15)', borderRadius:7, padding:'10px 14px', marginBottom:16 },
};