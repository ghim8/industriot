import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { generateEmail } from '../../utils/generateEmail';
import EmailField from '../../components/EmailField';
import ConfirmModal from '../../components/ConfirmModal';
import { validateUsineEmail } from '../../utils/validateEmail';
import { useAuth } from '../../context/AuthContext';

export default function PageOperateurs() {
  const [operateurs, setOperateurs] = useState([]);
  const { user } = useAuth();
const slug = React.useMemo(() => 
    user?.entreprise?.slug || 'usine'
, [user?.entreprise?.slug]);
  const [chefs, setChefs]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [confirm, setConfirm]       = useState(null);
  const [form, setForm] = useState({ nom:'', email:'', mot_de_passe:'', chef_id:'' });
  const [error, setError] = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = () => {
    Promise.all([
      api.get('/operateurs'),
      api.get('/chefs'),
    ]).then(([opsRes, chefsRes]) => {
      setOperateurs(opsRes.data);
      setChefs(chefsRes.data);
      setLoading(false);
    });
  };

  const handleNomChange = (nom) => {
    setForm(f => ({ ...f, nom, email: generateEmail(nom, slug) }));
};

  const handleSubmit = async () => {
    setError('');
    
      const emailDomain = form.email.split('@')[1] ?? '';
    if (emailDomain !== `${slug}.local`) {
        setError(`L'email doit être au format @${slug}.local`);
        return;
    }
    const emailError = validateUsineEmail(form.email);
    if (emailError) { setError(emailError); return; }
    if (!form.chef_id) { setError('Veuillez sélectionner un chef'); return; }
    try {
      await api.post('/utilisateurs', {
        nom:          form.nom,
        email:        form.email,
        mot_de_passe: form.mot_de_passe,
        role:         'operateur',
        statut:       'ACTIF',
        chef_id:      parseInt(form.chef_id),
      });
      setShowModal(false);
      setForm({ nom:'', email:'', mot_de_passe:'', chef_id:'' });
      fetchData();
    } catch(e) {
      setError(e.response?.data?.message || 'Erreur');
    }
  };

  const handleDelete = (u) => {
    setConfirm({
      message: `Voulez-vous vraiment supprimer l'opérateur "${u.nom}" ?`,
      onConfirm: async () => {
        await api.delete(`/utilisateurs/${u.id}`);
        setConfirm(null);
        fetchData();
      }
    });
  };

  const statutStyle = {
    'ACTIF':   { background:'rgba(46,213,115,0.15)', color:'#2ed573' },
    'INACTIF': { background:'rgba(255,71,87,0.15)',  color:'#ff4757' },
  };

  // Trouver le nom du chef pour chaque opérateur
  const getNomChef = (op) => {
    if (!op.chef_id) return '—';
    const chef = chefs.find(c => c.id === op.chef_id);
    return chef ? chef.nom : '—';
  };

  if (loading) return <div style={S.loading}>Chargement...</div>;

  return (
    <div>
      {confirm && (
        <ConfirmModal
          message={confirm.message}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}

      <div style={S.header}>
        <div>
          <div style={S.headerTitle}>Opérateurs</div>
          <div style={S.headerSub}>{operateurs.length} opérateur(s)</div>
        </div>
        <button style={S.btnPrimary} onClick={() => {
          setForm({ nom:'', email:'', mot_de_passe:'', chef_id:'' });
          setError('');
          setShowModal(true);
        }}>
          + Nouvel opérateur
        </button>
      </div>

      <div style={S.card}>
        <table style={S.tbl}>
          <thead>
            <tr>
              <th style={S.th}>Opérateur</th>
              <th style={S.th}>Email</th>
              <th style={S.th}>Chef assigné</th>
              <th style={S.th}>Statut</th>
              <th style={S.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {operateurs.map(u => (
              <tr key={u.id}>
                <td style={S.td}>
                  <div style={S.userCell}>
                    <div style={S.avatar}>{u.initiales}</div>
                    {u.nom}
                  </div>
                </td>
                <td style={{ ...S.td, fontFamily:'monospace', fontSize:12, color:'#7a8394' }}>
                  {u.email}
                </td>
                <td style={S.td}>
                  {u.chef_id ? (
                    <div style={S.chefBadge}>
                      <div style={S.chefDot} />
                      {getNomChef(u)}
                    </div>
                  ) : (
                    <span style={{ color:'#4a5260', fontSize:12 }}>Non assigné</span>
                  )}
                </td>
                <td style={S.td}>
                  <span style={{ ...S.pill, ...statutStyle[u.statut] }}>{u.statut}</span>
                </td>
                <td style={S.td}>
                  <button style={S.btnDel} onClick={() => handleDelete(u)}>Supprimer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal création opérateur */}
      {showModal && (
        <div style={S.overlay}>
          <div style={S.modal}>
            <div style={S.modalHead}>
              <span style={S.modalTitle}>Nouvel opérateur</span>
              <button style={S.modalClose} onClick={() => setShowModal(false)}>✕</button>
            </div>
            {error && <div style={S.error}>{error}</div>}

            <Field label="NOM COMPLET">
              <input style={S.input} value={form.nom}
                onChange={e => handleNomChange(e.target.value)}
                placeholder="Tarek Ben Ali" />
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
              <input style={S.input} type="password" value={form.mot_de_passe}
                onChange={e => setForm({ ...form, mot_de_passe: e.target.value })}
                placeholder="••••••••" />
            </Field>

            {/* ✅ Champ chef */}
            <Field label="AFFECTER À UN CHEF">
              <select
                style={{ ...S.input, color: form.chef_id ? '#e8eaf0' : '#4a5260' }}
                value={form.chef_id}
                onChange={e => setForm({ ...form, chef_id: e.target.value })}
              >
                <option value="">— Choisir un chef —</option>
                {chefs.map(c => (
                  <option key={c.id} value={c.id}>{c.nom}</option>
                ))}
              </select>
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
  loading:      { color:'#7a8394', textAlign:'center', marginTop:40 },
  header:       { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 },
  headerTitle:  { fontSize:15, fontWeight:600, color:'#e8eaf0' },
  headerSub:    { fontSize:12, color:'#7a8394', marginTop:4 },
  card:         { background:'#161b22', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, padding:'20px 22px' },
  tbl:          { width:'100%', borderCollapse:'collapse' },
  th:           { textAlign:'left', fontSize:10, color:'#4a5260', letterSpacing:1, textTransform:'uppercase', paddingBottom:12, borderBottom:'1px solid rgba(255,255,255,0.07)' },
  td:           { padding:'12px 0', borderBottom:'1px solid rgba(255,255,255,0.05)', color:'#e8eaf0', fontSize:13 },
  userCell:     { display:'flex', alignItems:'center', gap:10 },
  avatar:       { width:32, height:32, borderRadius:'50%', background:'rgba(245,166,35,0.15)', border:'1px solid rgba(245,166,35,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:'#f5a623', flexShrink:0 },
  chefBadge:    { display:'flex', alignItems:'center', gap:6, fontSize:12, color:'#0099ff' },
  chefDot:      { width:6, height:6, borderRadius:'50%', background:'#0099ff', flexShrink:0 },
  pill:         { display:'inline-flex', fontSize:10, padding:'3px 8px', borderRadius:4 },
  btnPrimary:   { padding:'8px 16px', background:'#00d4aa', border:'none', borderRadius:7, color:'#0a0c0f', fontWeight:600, fontSize:13, cursor:'pointer' },
  btnSecondary: { padding:'8px 16px', background:'transparent', border:'1px solid rgba(255,255,255,0.12)', borderRadius:7, color:'#7a8394', fontSize:13, cursor:'pointer' },
  btnDel:       { padding:'5px 10px', background:'rgba(255,71,87,0.08)', border:'1px solid rgba(255,71,87,0.20)', borderRadius:6, color:'#ff4757', fontSize:11, cursor:'pointer' },
  overlay:      { position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 },
  modal:        { background:'#161b22', border:'1px solid rgba(255,255,255,0.12)', borderRadius:12, padding:'28px 32px', width:480, maxWidth:'90vw' },
  modalHead:    { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 },
  modalTitle:   { fontSize:15, fontWeight:600, color:'#e8eaf0' },
  modalClose:   { background:'none', border:'none', color:'#7a8394', fontSize:16, cursor:'pointer' },
  modalFooter:  { display:'flex', justifyContent:'flex-end', gap:10, marginTop:24 },
  label:        { display:'block', fontSize:11, color:'#7a8394', letterSpacing:1, marginBottom:7 },
  input:        { width:'100%', padding:'10px 14px', background:'#1c2129', border:'1px solid rgba(255,255,255,0.12)', borderRadius:7, color:'#e8eaf0', fontSize:13, outline:'none', boxSizing:'border-box' },
  error:        { background:'rgba(255,71,87,0.1)', border:'1px solid rgba(255,71,87,0.3)', color:'#ff4757', padding:'10px 14px', borderRadius:7, fontSize:13, marginBottom:16 },
  infoBox:      { fontSize:12, color:'#00d4aa', background:'rgba(0,212,170,0.06)', border:'1px solid rgba(0,212,170,0.15)', borderRadius:7, padding:'10px 14px', marginBottom:4 },
};