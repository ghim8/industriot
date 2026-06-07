import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { generateEmail } from '../../utils/generateEmail';
import ConfirmModal from '../../components/ConfirmModal';
import { validateUsineEmail } from '../../utils/validateEmail';
import EmailField from '../../components/EmailField';
import { useAuth } from '../../context/AuthContext';
export default function PageUtilisateurs() {
  const [users, setUsers]         = useState([]);
  const { user } = useAuth();
const slug = React.useMemo(() => 
    user?.entreprise?.slug || 'usine'
, [user?.entreprise?.slug]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser]   = useState(null);
  const [confirm, setConfirm]     = useState(null);
  const [form, setForm] = useState({ nom:'', email:'', mot_de_passe:'', role:'operateur' });
  const [error, setError] = useState('');

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = () => {
    api.get('/utilisateurs').then(r => { setUsers(r.data); setLoading(false); });
  };

  const openCreate = () => {
    setEditUser(null);
    setForm({ nom:'', email:'', mot_de_passe:'', role:'operateur' });
    setError('');
    setShowModal(true);
  };

  const openEdit = (u) => {
    setEditUser(u);
    setForm({ nom:u.nom, email:u.email, mot_de_passe:'', role:u.role });
    setError('');
    setShowModal(true);
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

  const emailError = validateUsineEmail(form.email,slug);
  if (emailError) { setError(emailError); return; }

  try {
    if (editUser) {
      const data = { ...form };
      if (!data.mot_de_passe) delete data.mot_de_passe;
      await api.put(`/utilisateurs/${editUser.id}`, data);
    } else {
      await api.post('/utilisateurs', form);
    }
    setShowModal(false);
    fetchUsers();
  } catch(e) {
    setError(e.response?.data?.message || 'Erreur lors de la sauvegarde');
  }
};

 const handleDelete = (u) => {
    setConfirm({
      message: `Voulez-vous vraiment supprimer l'utilisateur "${u.nom}" ?`,
      onConfirm: async () => {
        await api.delete(`/utilisateurs/${u.id}`);  // ✅ avec l'ID
        setConfirm(null);
        fetchUsers();
      }
    });
  };

  const roleStyle = {
    admin:     { background:'rgba(0,212,170,0.10)',  color:'#00d4aa', border:'1px solid rgba(0,212,170,0.20)' },
    chef:      { background:'rgba(0,153,255,0.10)',  color:'#0099ff', border:'1px solid rgba(0,153,255,0.20)' },
    operateur: { background:'rgba(245,166,35,0.12)', color:'#f5a623', border:'1px solid rgba(245,166,35,0.25)' },
  };

  if (loading) return <div style={S.loading}>Chargement...</div>;

  return (
    <div>
      {confirm && <ConfirmModal message={confirm.message} onConfirm={confirm.onConfirm} onCancel={() => setConfirm(null)} />}

      <div style={S.header}>
        <div>
          <div style={S.headerTitle}>Gestion des utilisateurs</div>
          <div style={S.headerSub}>{users.length} utilisateur(s)</div>
        </div>
        <button style={S.btnPrimary} onClick={openCreate}>+ Nouvel utilisateur</button>
      </div>

      <div style={S.card}>
        <table style={S.tbl}>
          <thead>
            <tr>
              <th style={S.th}>Utilisateur</th>
              <th style={S.th}>Email</th>
              <th style={S.th}>Rôle</th>
              <th style={S.th}>Statut</th>
              <th style={S.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td style={S.td}>
                  <div style={S.userCell}>
                    <div style={S.avatar}>{u.initiales}</div>
                    <span>{u.nom}</span>
                  </div>
                </td>
                <td style={{...S.td, fontFamily:'Segoe UI', fontSize:12, color:'#7a8394'}}>{u.email}</td>
                <td style={S.td}>
                  <span style={{...S.pill, ...roleStyle[u.role]}}>{u.role.toUpperCase()}</span>
                </td>
                <td style={S.td}>
                  <span style={{...S.pill, ...(u.statut==='ACTIF' ? S.pillOk : S.pillOff)}}>
                    {u.statut}
                  </span>
                </td>
                <td style={S.td}>
                  <div style={{display:'flex', gap:8}}>
                    <button style={S.btnEdit} onClick={() => openEdit(u)}>Modifier</button>
                    <button style={S.btnDel}  onClick={() => handleDelete(u)}>Supprimer</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={S.overlay}>
          <div style={S.modal}>
            <div style={S.modalHead}>
              <span style={S.modalTitle}>{editUser ? 'Modifier utilisateur' : 'Nouvel utilisateur'}</span>
              <button style={S.modalClose} onClick={() => setShowModal(false)}>✕</button>
            </div>
            {error && <div style={S.error}>{error}</div>}

            <Field label="NOM COMPLET">
              <input style={S.input} value={form.nom}
                onChange={e => handleNomChange(e.target.value)}
                placeholder="" />
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

            <Field label={editUser ? 'NOUVEAU MOT DE PASSE (laisser vide = inchangé)' : 'MOT DE PASSE'}>
              <input style={S.input} type="password" value={form.mot_de_passe}
                onChange={e => setForm({...form, mot_de_passe:e.target.value})}
                placeholder="••••••••" />
            </Field>

            <Field label="RÔLE">
              <select style={S.input} value={form.role}
                onChange={e => setForm({...form, role:e.target.value})}>
                <option value="operateur">Opérateur</option>
                <option value="chef">Chef de maintenance</option>
                <option value="admin">Administrateur</option>
              </select>
            </Field>

            <div style={S.modalFooter}>
              <button style={S.btnSecondary} onClick={() => setShowModal(false)}>Annuler</button>
              <button style={S.btnPrimary} onClick={handleSubmit}>
                {editUser ? 'Enregistrer' : 'Créer'}
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
  loading:     { color:'#7a8394', textAlign:'center', marginTop:40 },
  header:      { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 },
  headerTitle: { fontSize:15, fontWeight:600, color:'#e8eaf0' },
  headerSub:   { fontSize:12, color:'#7a8394', marginTop:4 },
  card:        { background:'#161b22', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, padding:'20px 22px' },
  tbl:         { width:'100%', borderCollapse:'collapse' },
  th:          { textAlign:'left', fontFamily:'Segoe UI', fontSize:10, color:'#4a5260', letterSpacing:1, textTransform:'uppercase', paddingBottom:12, borderBottom:'1px solid rgba(255,255,255,0.07)' },
  td:          { padding:'12px 0', borderBottom:'1px solid rgba(255,255,255,0.05)', color:'#e8eaf0', fontSize:13 },
  userCell:    { display:'flex', alignItems:'center', gap:10 },
  avatar:      { width:32, height:32, borderRadius:'50%', background:'rgba(0,212,170,0.15)', border:'1px solid rgba(0,212,170,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontFamily:'Segoe UI', color:'#00d4aa', flexShrink:0 },
  pill:        { display:'inline-flex', fontFamily:'Segoe UI', fontSize:10, padding:'3px 8px', borderRadius:4 },
  pillOk:      { background:'rgba(46,213,115,0.15)', color:'#2ed573' },
  pillOff:     { background:'rgba(255,71,87,0.15)',  color:'#ff4757' },
  btnPrimary:  { padding:'8px 16px', background:'#00d4aa', border:'none', borderRadius:7, color:'#0a0c0f', fontWeight:600, fontSize:13, cursor:'pointer' },
  btnSecondary:{ padding:'8px 16px', background:'transparent', border:'1px solid rgba(255,255,255,0.12)', borderRadius:7, color:'#7a8394', fontSize:13, cursor:'pointer' },
  btnEdit:     { padding:'5px 10px', background:'rgba(0,153,255,0.10)', border:'1px solid rgba(0,153,255,0.20)', borderRadius:6, color:'#0099ff', fontSize:11, cursor:'pointer' },
  btnDel:      { padding:'5px 10px', background:'rgba(255,71,87,0.08)', border:'1px solid rgba(255,71,87,0.20)', borderRadius:6, color:'#ff4757', fontSize:11, cursor:'pointer' },
  overlay:     { position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 },
  modal:       { background:'#161b22', border:'1px solid rgba(255,255,255,0.12)', borderRadius:12, padding:'28px 32px', width:480, maxWidth:'90vw' },
  modalHead:   { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 },
  modalTitle:  { fontSize:15, fontWeight:600, color:'#e8eaf0' },
  modalClose:  { background:'none', border:'none', color:'#7a8394', fontSize:16, cursor:'pointer' },
  modalFooter: { display:'flex', justifyContent:'flex-end', gap:10, marginTop:24 },
  label:       { display:'block', fontSize:11, color:'#7a8394', letterSpacing:1, marginBottom:7, fontFamily:'Segoe UI' },
  input:       { width:'100%', padding:'10px 14px', background:'#1c2129', border:'1px solid rgba(255,255,255,0.12)', borderRadius:7, color:'#e8eaf0', fontSize:13, outline:'none', boxSizing:'border-box' },
  error:       { background:'rgba(255,71,87,0.1)', border:'1px solid rgba(255,71,87,0.3)', color:'#ff4757', padding:'10px 14px', borderRadius:7, fontSize:13, marginBottom:16 },
};