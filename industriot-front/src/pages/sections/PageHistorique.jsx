import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import ConfirmModal from '../../components/ConfirmModal';

export default function PageHistorique() {
  const [connexions, setConnexions]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [filtre, setFiltre]           = useState('TOUS');
  const [selection, setSelection]     = useState([]);
  const [confirmData, setConfirmData] = useState(null);

  useEffect(() => { fetchConnexions(); }, []);

  const fetchConnexions = () => {
    api.get('/connexions').then(r => { setConnexions(r.data); setLoading(false); });
  };

  const supprimerUne = (c) => {
    setConfirmData({
      message: 'Supprimer cette entrée de connexion ?',
      onConfirm: async () => {
        await api.delete(`/connexions/${c.id}`);
        setConnexions(prev => prev.filter(x => x.id !== c.id));
        setConfirmData(null);
      }
    });
  };

  const supprimerSelection = () => {
    if (!selection.length) return;
    setConfirmData({
      message: `Supprimer ${selection.length} entrée(s) sélectionnée(s) ?`,
      onConfirm: async () => {
        await api.post('/connexions/supprimer-selection', { ids: selection });
        setConnexions(prev => prev.filter(c => !selection.includes(c.id)));
        setSelection([]);
        setConfirmData(null);
      }
    });
  };

  const toggleSel = (id) => setSelection(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const toutSel   = () => selection.length === filtrees.length ? setSelection([]) : setSelection(filtrees.map(c => c.id));

  const filtrees    = connexions.filter(c => filtre === 'TOUS' || c.statut === filtre);
  const totalSucces = connexions.filter(c => c.statut === 'SUCCÈS').length;
  const totalEchecs = connexions.filter(c => c.statut === 'ÉCHEC').length;

  if (loading) return <div style={S.loading}>Chargement...</div>;

  const toutCoche = selection.length === filtrees.length && filtrees.length > 0;

  return (
    <div>
      {confirmData && <ConfirmModal message={confirmData.message} onConfirm={confirmData.onConfirm} onCancel={() => setConfirmData(null)}/>}

      {/* Métriques */}
      <div style={S.metricsRow}>
        {[
          { label:'Connexions réussies', val:totalSucces,    color:'#2ed573' },
          { label:'Tentatives échouées', val:totalEchecs,    color:'#ff4757' },
          { label:'Total',               val:connexions.length, color:'#0099ff' },
          { label:"Taux d'échec",        val:`${connexions.length > 0 ? Math.round(totalEchecs/connexions.length*100) : 0}%`, color:'#f5a623' },
        ].map(m => (
          <div key={m.label} style={S.mcard}>
            <div style={{...S.mcardBar, background:m.color}}/>
            <div style={S.mcardLabel}>{m.label}</div>
            <div style={{...S.mcardVal, color:m.color}}>{m.val}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={S.toolbar}>
        <div style={S.filtres}>
          {[
            { key:'TOUS',   label:'Tous'      },
            { key:'SUCCÈS', label:'Réussies', dot:'#2ed573' },
            { key:'ÉCHEC',  label:'Échouées', dot:'#ff4757' },
          ].map(f => (
            <button key={f.key}
              style={{...S.filtreBtn, ...(filtre===f.key ? S.filtreBtnActive : {})}}
              onClick={() => setFiltre(f.key)}
            >
              {f.dot && <span style={{width:6, height:6, borderRadius:'50%', background:f.dot, display:'inline-block'}}/>}
              {f.label}
            </button>
          ))}
        </div>
        {selection.length > 0 && (
          <button style={S.btnRed} onClick={supprimerSelection}>
            <TrashIcon/> Supprimer ({selection.length})
          </button>
        )}
      </div>

      {/* Table */}
      <div style={S.tableWrap}>
        {filtrees.length === 0 ? (
          <div style={S.empty}>Aucune connexion trouvée</div>
        ) : (
          <table style={S.tbl}>
            <thead>
              <tr style={S.theadRow}>
                <th style={{...S.th, width:48}}>
                  <CustomCheckbox checked={toutCoche} onChange={toutSel}/>
                </th>
                <th style={S.th}>Horodatage</th>
                <th style={S.th}>Email</th>
                <th style={S.th}>Adresse IP</th>
                <th style={S.th}>Statut</th>
                <th style={{...S.th, width:48}}></th>
              </tr>
            </thead>
            <tbody>
              {filtrees.map((c, idx) => (
                <tr key={c.id} style={{
                  ...S.tr,
                  background: selection.includes(c.id)
                    ? 'rgba(0,212,170,0.04)'
                    : idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                }}>
                  <td style={S.td}>
                    <CustomCheckbox checked={selection.includes(c.id)} onChange={() => toggleSel(c.id)}/>
                  </td>
                  <td style={S.td}>
                    <div style={S.dateMain}>{new Date(c.horodatage).toLocaleDateString('fr-FR')}</div>
                    <div style={S.dateSub}>{new Date(c.horodatage).toLocaleTimeString('fr-FR')}</div>
                  </td>
                  <td style={S.td}>
                    <div style={S.emailText}>{c.email_tente}</div>
                  </td>
                  <td style={S.td}>
                    <span style={S.ipChip}>{c.ip || '—'}</span>
                  </td>
                  <td style={S.td}>
                    <span style={{
                      ...S.statusBadge,
                      background: c.statut==='SUCCÈS' ? 'rgba(46,213,115,0.10)'  : 'rgba(255,71,87,0.10)',
                      color:      c.statut==='SUCCÈS' ? '#2ed573' : '#ff4757',
                      border:     c.statut==='SUCCÈS' ? '1px solid rgba(46,213,115,0.22)' : '1px solid rgba(255,71,87,0.22)',
                    }}>
                      <span style={{width:5, height:5, borderRadius:'50%', background: c.statut==='SUCCÈS' ? '#2ed573' : '#ff4757', flexShrink:0,
                        boxShadow: `0 0 5px ${c.statut==='SUCCÈS' ? '#2ed573' : '#ff4757'}`
                      }}/>
                      {c.statut}
                    </span>
                  </td>
                  <td style={S.td}>
                    <button style={S.btnTrash} onClick={() => supprimerUne(c)} title="Supprimer">
                      <TrashIcon/>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer */}
      {filtrees.length > 0 && (
        <div style={S.footer}>
          {filtrees.length} entrée(s) · {selection.length > 0 && `${selection.length} sélectionnée(s)`}
        </div>
      )}
    </div>
  );
}

// ── Checkbox personnalisée ────────────────────────────────
function CustomCheckbox({ checked, onChange }) {
  return (
    <div onClick={onChange} style={{...S2.wrap, ...(checked ? S2.wrapChecked : {})}}>
      {checked && (
        <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="#0a0c0f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="1.5 5 4 7.5 8.5 2"/>
        </svg>
      )}
    </div>
  );
}

const S2 = {
  wrap:        { width:16, height:16, borderRadius:4, border:'1.5px solid rgba(255,255,255,0.18)', background:'transparent', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0, transition:'all 0.15s' },
  wrapChecked: { background:'#00d4aa', borderColor:'#00d4aa' },
};

const TrashIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6M9 6V4h6v2"/>
  </svg>
);

const S = {
  loading:         { color:'#7a8394', textAlign:'center', marginTop:40 },
  metricsRow:      { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20 },
  mcard:           { background:'#161b22', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, padding:'18px 20px', position:'relative', overflow:'hidden' },
  mcardBar:        { position:'absolute', top:0, left:0, right:0, height:2 },
  mcardLabel:      { fontSize:11, color:'#4a5260', letterSpacing:0.3, marginBottom:12, textTransform:'uppercase', fontWeight:500 },
  mcardVal:        { fontSize:28, fontWeight:700 },
  toolbar:         { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12, gap:8 },
  filtres:         { display:'flex', gap:6 },
  filtreBtn:       { display:'flex', alignItems:'center', gap:6, padding:'7px 16px', background:'transparent', border:'1px solid rgba(255,255,255,0.09)', borderRadius:20, color:'#7a8394', fontSize:12, cursor:'pointer', transition:'all 0.15s' },
  filtreBtnActive: { background:'rgba(0,212,170,0.10)', borderColor:'rgba(0,212,170,0.28)', color:'#00d4aa' },
  btnRed:          { display:'flex', alignItems:'center', gap:6, padding:'7px 14px', background:'rgba(255,71,87,0.08)', border:'1px solid rgba(255,71,87,0.20)', borderRadius:7, color:'#ff4757', fontSize:12, cursor:'pointer' },
  tableWrap:       { background:'#161b22', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, overflow:'hidden' },
  empty:           { padding:'48px 0', textAlign:'center', color:'#4a5260', fontSize:13 },
  tbl:             { width:'100%', borderCollapse:'collapse' },
  theadRow:        { background:'rgba(255,255,255,0.03)', borderBottom:'1px solid rgba(255,255,255,0.07)' },
  th:              { textAlign:'left', fontSize:10, color:'#4a5260', fontWeight:600, padding:'12px 16px', textTransform:'uppercase', letterSpacing:0.8 },
  tr:              { transition:'background 0.12s' },
  td:              { padding:'12px 16px', borderBottom:'1px solid rgba(255,255,255,0.04)', verticalAlign:'middle' },
  dateMain:        { fontSize:13, color:'#e8eaf0', fontWeight:500 },
  dateSub:         { fontSize:11, color:'#4a5260', marginTop:2 },
  emailText:       { fontSize:13, color:'#e8eaf0' },
  ipChip:          { fontSize:11, color:'#5a6270', background:'rgba(255,255,255,0.04)', padding:'3px 8px', borderRadius:4, display:'inline-block' },
  statusBadge:     { display:'inline-flex', alignItems:'center', gap:5, padding:'4px 10px', borderRadius:20, fontSize:11, fontWeight:500 },
  btnTrash:        { padding:'6px 7px', background:'rgba(255,71,87,0.07)', border:'1px solid rgba(255,71,87,0.16)', borderRadius:6, color:'#ff4757', cursor:'pointer', display:'flex', alignItems:'center' },
  footer:          { marginTop:10, fontSize:11, color:'#3a4050', textAlign:'right', padding:'0 4px' },
};