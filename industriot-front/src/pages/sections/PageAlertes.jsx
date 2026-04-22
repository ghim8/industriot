import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import ConfirmModal from '../../components/ConfirmModal';

export default function PageAlertes() {
  const { user }  = useAuth();
  const [alertes, setAlertes]               = useState([]);
  const [machines, setMachines]             = useState([]);
  const [loading, setLoading]               = useState(true);
  const [filtre, setFiltre]                 = useState('TOUS');
  const [machineFiltree, setMachineFiltree] = useState('TOUTES');
  const [selection, setSelection]           = useState([]);
  const [confirmData, setConfirmData]       = useState(null);

  useEffect(() => {
    Promise.all([api.get('/alertes'), api.get('/machines')]).then(([a, m]) => {
      setAlertes(a.data);
      setMachines(m.data);
      setLoading(false);
    });
  }, []);

  const acquitter = async (id) => {
    try {
      await api.post(`/alertes/${id}/acquitter`, { utilisateur_id: user?.id });
      setAlertes(prev => prev.map(a => a.id === id ? { ...a, acquittee: 1 } : a));
    } catch { alert('Erreur'); }
  };

  const acquitterTout = async () => {
    if (!window.confirm('Acquitter toutes les alertes actives ?')) return;
    const actives = alertes.filter(a => !a.acquittee);
    await Promise.all(actives.map(a => api.post(`/alertes/${a.id}/acquitter`, { utilisateur_id: user?.id })));
    setAlertes(prev => prev.map(a => ({ ...a, acquittee: 1 })));
  };

  const supprimerUne = (alerte) => {
    setConfirmData({
      message: `Supprimer définitivement cette alerte ?`,
      onConfirm: async () => {
        await api.delete(`/alertes/${alerte.id}`);
        setAlertes(prev => prev.filter(a => a.id !== alerte.id));
        setConfirmData(null);
      }
    });
  };

  const supprimerSelection = () => {
    if (selection.length === 0) return;
    setConfirmData({
      message: `Supprimer ${selection.length} alerte(s) ?`,
      onConfirm: async () => {
        await api.post('/alertes/supprimer-selection', { ids: selection });
        setAlertes(prev => prev.filter(a => !selection.includes(a.id)));
        setSelection([]);
        setConfirmData(null);
      }
    });
  };

  const toggleSelection = (id) => setSelection(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const toutSelectionner = () => selection.length === filtrees.length ? setSelection([]) : setSelection(filtrees.map(a => a.id));

  const filtrees = alertes.filter(a => {
    if (machineFiltree !== 'TOUTES' && a.machine_id !== parseInt(machineFiltree)) return false;
    if (filtre === 'ACTIVES')    return !a.acquittee;
    if (filtre === 'ACQUITTEES') return a.acquittee;
    if (filtre === 'CRITIQUE')   return a.niveau === 'CRITIQUE';
    if (filtre === 'WARNING')    return a.niveau === 'WARNING';
    return true;
  });

  const critique = alertes.filter(a => a.niveau === 'CRITIQUE' && !a.acquittee).length;
  const warning  = alertes.filter(a => a.niveau === 'WARNING'  && !a.acquittee).length;
  const actives  = alertes.filter(a => !a.acquittee).length;

  const niveauCfg = {
    CRITIQUE: { bg:'rgba(255,71,87,0.12)',  color:'#ff4757', dot:'#ff4757' },
    WARNING:  { bg:'rgba(245,166,35,0.12)', color:'#f5a623', dot:'#f5a623' },
    INFO:     { bg:'rgba(0,153,255,0.12)',  color:'#0099ff', dot:'#0099ff' },
  };
  function CustomCheckbox({ checked, onChange }) {
  return (
    <div onClick={onChange} style={{...CS.wrap, ...(checked ? CS.wrapChecked : {})}}>
      {checked && (
        <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="#0a0c0f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="1.5 5 4 7.5 8.5 2"/>
        </svg>
      )}
    </div>
  );
}

const CS = {
  wrap:        { width:16, height:16, borderRadius:4, border:'1.5px solid rgba(255,255,255,0.18)', background:'transparent', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0, transition:'all 0.15s' },
  wrapChecked: { background:'#00d4aa', borderColor:'#00d4aa' },
};

  if (loading) return <div style={S.loading}>Chargement...</div>;

  return (
    <div>
      {confirmData && <ConfirmModal message={confirmData.message} onConfirm={confirmData.onConfirm} onCancel={() => setConfirmData(null)}/>}

      {/* Métriques */}
      <div style={S.metricsRow}>
        {[
          { label:'Critiques actives', val:critique, color:'#ff4757', sub: critique > 0 ? 'Action requise' : 'Aucune', ok: critique===0 },
          { label:'Warnings actifs',   val:warning,  color:'#f5a623', sub: warning  > 0 ? 'À surveiller'   : 'Aucun',  ok: warning===0  },
          { label:'Non acquittées',    val:actives,  color:'#0099ff', sub:`sur ${alertes.length} total`,    ok: actives===0  },
          { label:'Acquittées',        val:alertes.length-actives, color:'#2ed573', sub:'Traitées', ok:true },
        ].map(m => (
          <div key={m.label} style={S.mcard}>
            <div style={{...S.mcardBar, background:m.color}}/>
            <div style={S.mcardLabel}>{m.label}</div>
            <div style={S.mcardVal}>{m.val}</div>
            <div style={S.mcardSub}>
              <span style={{...S.mcardDot, background: m.ok ? '#2ed573' : m.color}}/>
              <span style={{color: m.ok ? '#2ed573' : m.color, fontSize:11}}>{m.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Filtres machines */}
      <div style={S.machineRow}>
        {[{id:'TOUTES', nom:'Toutes les machines', statut:'EN SERVICE'}, ...machines].map(m => (
          <button
            key={m.id}
            style={{...S.machineBtn, ...(machineFiltree===String(m.id) ? S.machineBtnActive : {})}}
            onClick={() => setMachineFiltree(String(m.id))}
          >
            <span style={{...S.machineDot, background: m.id==='TOUTES' ? '#00d4aa' : m.statut==='EN SERVICE' ? '#2ed573' : '#ff4757'}}/>
            {m.nom}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div style={S.toolbar}>
        <div style={S.filtres}>
          {[
            { key:'TOUS',       label:'Tous'        },
            { key:'ACTIVES',    label:'Actives'     },
            { key:'CRITIQUE',   label:'Critique', dot:'#ff4757' },
            { key:'WARNING',    label:'Warning',  dot:'#f5a623' },
            { key:'ACQUITTEES', label:'Acquittées'  },
          ].map(f => (
            <button key={f.key} style={{...S.filtreBtn, ...(filtre===f.key ? S.filtreBtnActive : {})}} onClick={() => setFiltre(f.key)}>
              {f.dot && <span style={{width:6, height:6, borderRadius:'50%', background:f.dot, flexShrink:0, display:'inline-block'}}/>}
              {f.label}
            </button>
          ))}
        </div>
        <div style={{display:'flex', gap:8}}>
          {actives > 0 && user?.role !== 'operateur' && (
            <button style={S.btnGreen} onClick={acquitterTout}>✓ Acquitter tout ({actives})</button>
          )}
          {selection.length > 0 && (
            <button style={S.btnRed} onClick={supprimerSelection}>
              <TrashIcon/> Supprimer ({selection.length})
            </button>
          )}
        </div>
      </div>

      {/* Barre sélection */}
      <div style={S.selBar}>
        <label style={{display:'flex', alignItems:'center', gap:8, cursor:'pointer'}}>
          <CustomCheckbox checked={selection.length===filtrees.length && filtrees.length>0} onChange={toutSelectionner}/>
          <span style={S.selText}>{selection.length > 0 ? `${selection.length} sélectionnée(s)` : `${filtrees.length} alerte(s) affichée(s)`}</span>
        </label>
      </div>

      {/* Liste */}
      <div style={S.listWrap}>
        {filtrees.length === 0 ? (
          <div style={S.empty}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3a4050" strokeWidth="1.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <div style={{marginTop:10, color:'#4a5260', fontSize:13}}>Aucune alerte trouvée</div>
          </div>
        ) : filtrees.map(a => {
          const cfg = niveauCfg[a.niveau] || niveauCfg.INFO;
          return (
            <div key={a.id} style={{
              ...S.alertRow,
              opacity: a.acquittee ? 0.5 : 1,
              background: selection.includes(a.id) ? 'rgba(0,212,170,0.04)' : 'transparent',
              borderLeft: `3px solid ${a.acquittee ? 'rgba(255,255,255,0.06)' : cfg.dot}`,
            }}>
              <input type="checkbox" checked={selection.includes(a.id)} onChange={() => toggleSelection(a.id)}
                style={{accentColor:'#00d4aa', width:13, height:13, cursor:'pointer', flexShrink:0}}/>

              {/* Niveau badge */}
              <div style={{...S.niveauBadge, background:cfg.bg, color:cfg.color}}>
                <span style={{...S.niveauDot, background:cfg.dot, boxShadow: !a.acquittee ? `0 0 6px ${cfg.dot}` : 'none'}}/>
                {a.niveau}
              </div>

              {/* Contenu */}
              <div style={{flex:1, minWidth:0}}>
                <div style={S.alertMsg}>{a.message}</div>
                <div style={S.alertMeta}>
                  {a.valeur !== null && (
                    <span style={S.metaChip}>
                      Valeur <strong style={{color:'#e8eaf0'}}>{parseFloat(a.valeur).toFixed(2)}</strong>
                      {a.seuil && <> · Seuil <strong style={{color:'#e8eaf0'}}>{parseFloat(a.seuil).toFixed(2)}</strong></>}
                    </span>
                  )}
                  <span style={S.metaTime}>{new Date(a.cree_le).toLocaleString('fr-FR')}</span>
                </div>
              </div>

              {/* Actions */}
              <div style={{display:'flex', alignItems:'center', gap:6, flexShrink:0}}>
                {!a.acquittee && user?.role !== 'operateur' && (
                  <button style={S.btnAcquitter} onClick={() => acquitter(a.id)}>Acquitter</button>
                )}
                {a.acquittee && <span style={S.checkmark}>✓</span>}
                <button style={S.btnTrash} onClick={() => supprimerUne(a)} title="Supprimer">
                  <TrashIcon/>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

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
  mcardVal:        { fontSize:28, fontWeight:700, color:'#e8eaf0' },
  mcardSub:        { display:'flex', alignItems:'center', gap:5, marginTop:8 },
  mcardDot:        { width:5, height:5, borderRadius:'50%', flexShrink:0 },
  machineRow:      { display:'flex', gap:8, flexWrap:'wrap', marginBottom:16 },
  machineBtn:      { display:'flex', alignItems:'center', gap:7, padding:'7px 14px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:20, color:'#7a8394', fontSize:12, cursor:'pointer', whiteSpace:'nowrap', transition:'all 0.15s' },
  machineBtnActive:{ background:'rgba(0,212,170,0.10)', borderColor:'rgba(0,212,170,0.28)', color:'#00d4aa' },
  machineDot:      { width:6, height:6, borderRadius:'50%', flexShrink:0 },
  toolbar:         { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10, flexWrap:'wrap', gap:8 },
  filtres:         { display:'flex', gap:6, flexWrap:'wrap' },
  filtreBtn:       { display:'flex', alignItems:'center', gap:5, padding:'6px 14px', background:'transparent', border:'1px solid rgba(255,255,255,0.09)', borderRadius:6, color:'#7a8394', fontSize:12, cursor:'pointer', transition:'all 0.15s' },
  filtreBtnActive: { background:'rgba(0,212,170,0.10)', borderColor:'rgba(0,212,170,0.28)', color:'#00d4aa' },
  btnGreen:        { display:'flex', alignItems:'center', gap:6, padding:'7px 14px', background:'rgba(46,213,115,0.10)', border:'1px solid rgba(46,213,115,0.22)', borderRadius:7, color:'#2ed573', fontSize:12, cursor:'pointer' },
  btnRed:          { display:'flex', alignItems:'center', gap:6, padding:'7px 14px', background:'rgba(255,71,87,0.08)', border:'1px solid rgba(255,71,87,0.20)', borderRadius:7, color:'#ff4757', fontSize:12, cursor:'pointer' },
  selBar:          { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 14px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:8, marginBottom:12 },
  selText:         { fontSize:12, color:'#5a6270' },
  listWrap:        { background:'#161b22', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, overflow:'hidden' },
  empty:           { padding:'48px 0', textAlign:'center' },
  alertRow:        { display:'flex', alignItems:'center', gap:12, padding:'14px 18px', borderBottom:'1px solid rgba(255,255,255,0.05)', transition:'background 0.15s' },
  niveauBadge:     { display:'flex', alignItems:'center', gap:5, padding:'4px 10px', borderRadius:6, fontSize:11, fontWeight:600, flexShrink:0 },
  niveauDot:       { width:6, height:6, borderRadius:'50%', flexShrink:0 },
  alertMsg:        { fontSize:13, color:'#e8eaf0', fontWeight:500, marginBottom:5 },
  alertMeta:       { display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' },
  metaChip:        { fontSize:11, color:'#5a6270', background:'rgba(255,255,255,0.04)', padding:'2px 8px', borderRadius:4 },
  metaTime:        { fontSize:11, color:'#3a4050' },
  btnAcquitter:    { padding:'5px 12px', background:'rgba(0,212,170,0.08)', border:'1px solid rgba(0,212,170,0.22)', borderRadius:6, color:'#00d4aa', fontSize:11, cursor:'pointer' },
  checkmark:       { fontSize:14, color:'#2ed573' },
  btnTrash:        { padding:'5px 7px', background:'rgba(255,71,87,0.07)', border:'1px solid rgba(255,71,87,0.16)', borderRadius:6, color:'#ff4757', cursor:'pointer', display:'flex', alignItems:'center' },
};