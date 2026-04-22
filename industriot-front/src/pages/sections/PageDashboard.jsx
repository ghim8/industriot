import React, { useEffect, useState, useCallback, useRef } from 'react';
import api from '../../api/axios';

const TYPE_CONFIG = {
  temperature: { label:'Température', color:'#f5a623', unit:'°C'  },
  humidite:    { label:'Humidité',    color:'#0099ff', unit:'%'   },
  courant:     { label:'Courant',     color:'#00d4aa', unit:'A'   },
  vibration:   { label:'Vibration',   color:'#ff4757', unit:'g'   },
  gaz:         { label:'Gaz',         color:'#a855f7', unit:'ppm' },
  pression:    { label:'Pression',    color:'#2ed573', unit:'bar' },
};

const TypeIcon = ({ type, size=18 }) => {
  const color = TYPE_CONFIG[type]?.color || '#7a8394';
  const icons = {
    temperature: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg>,
    humidite:    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>,
    courant:     <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
    vibration:   <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8"><polyline points="2 12 6 4 10 18 14 8 18 16 22 12"/></svg>,
    gaz:         <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/></svg>,
    pression:    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>,
  };
  return icons[type] || <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8"><circle cx="12" cy="12" r="10"/></svg>;
};

export default function PageDashboard() {
  const [machines, setMachines]         = useState([]);
  const [alertes, setAlertes]           = useState([]);
  const [selectedMachine, setSelected]  = useState(null);
  const [mesures, setMesures]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [lastUpdate, setLastUpdate]     = useState(null);
  const refreshRef = useRef(null);
  const selectedRef = useRef(null);
  selectedRef.current = selectedMachine;

  useEffect(() => {
    Promise.all([api.get('/machines'), api.get('/alertes')])
      .then(([m, a]) => {
        setMachines(m.data);
        setAlertes(a.data);
        setLoading(false);
        if (m.data.length > 0) {
          setSelected(m.data[0]);
          fetchMesures(m.data[0].id);
        }
      });
    return () => { if (refreshRef.current) clearInterval(refreshRef.current); };
  }, []);

  useEffect(() => {
    if (refreshRef.current) clearInterval(refreshRef.current);
    if (!selectedMachine) return;
    refreshRef.current = setInterval(() => {
      if (selectedRef.current) fetchMesuresSilent(selectedRef.current.id);
    }, 8000);
    return () => { if (refreshRef.current) clearInterval(refreshRef.current); };
  }, [selectedMachine?.id]);

  const fetchMesures = (id) => {
    api.get(`/mesures?machine_id=${id}`).then(r => {
      setMesures(r.data);
      setLastUpdate(new Date().toTimeString().slice(0,8));
    });
  };

  const fetchMesuresSilent = (id) => {
    api.get(`/mesures?machine_id=${id}`).then(r => {
      setMesures(r.data);
      setLastUpdate(new Date().toTimeString().slice(0,8));
    });
  };

  const selectMachine = (m) => {
    setSelected(m);
    setMesures([]);
    fetchMesures(m.id);
  };

  if (loading) return <div style={S.loading}>Chargement...</div>;

  const enService    = machines.filter(m => m.statut === 'EN SERVICE').length;
  const alertesCrit  = alertes.filter(a => a.niveau === 'CRITIQUE' && !a.acquittee).length;
  const alertesWarn  = alertes.filter(a => a.niveau === 'WARNING'  && !a.acquittee).length;
  const alertesTotal = alertes.filter(a => !a.acquittee).length;

  return (
    <div>
      {/* Métriques */}
      <div style={S.metricsRow}>
        <MetricCard label="MACHINES ACTIVES"  value={enService}   unit={`/ ${machines.length}`} color="#2ed573" status="En ligne"      statusOk />
        <MetricCard label="ALERTES CRITIQUES" value={alertesCrit} color="#ff4757" status={alertesCrit > 0 ? 'Action requise' : 'Aucune'} statusOk={alertesCrit === 0} />
        <MetricCard label="ALERTES WARNING"   value={alertesWarn} color="#f5a623" status={alertesWarn > 0 ? 'À surveiller' : 'Aucun'}   statusOk={alertesWarn === 0} />
        <MetricCard label="TOTAL ALERTES"     value={alertesTotal} color="#0099ff" status="Non acquittées" statusOk={alertesTotal === 0} />
      </div>

      {/* Section mesures temps réel */}
      <div style={S.card}>
        <div style={S.cardHead}>
          <span style={S.cardTitle}>MESURES EN TEMPS RÉEL</span>
          <div style={{display:'flex', alignItems:'center', gap:10}}>
            {lastUpdate && (
              <div style={S.liveTag}>
                <span style={S.liveDot}/>
                <span style={S.liveTime}>màj {lastUpdate}</span>
              </div>
            )}
          </div>
        </div>

        {/* Sélecteur machine */}
        <div style={S.machineSelector}>
          {machines.map(m => (
            <button
              key={m.id}
              style={{...S.machineBtn, ...(selectedMachine?.id === m.id ? S.machineBtnActive : {})}}
              onClick={() => selectMachine(m)}
            >
              <span style={{...S.machineDot, background: m.statut==='EN SERVICE' ? '#2ed573' : '#ff4757'}}/>
              {m.nom}
            </button>
          ))}
        </div>

        {/* Cartes mesures */}
        {mesures.length === 0 ? (
          <div style={S.emptyMesures}>Aucune mesure disponible pour cette machine</div>
        ) : (
          <div style={S.mesuresGrid}>
            {mesures.map(item => {
              const cfg      = TYPE_CONFIG[item.capteur?.type] || { color:'#7a8394', label:'Inconnu', unit:'' };
              const derniere = item.derniere;
              const valeur   = derniere ? parseFloat(derniere.valeur).toFixed(4) : null;
              const horseSeuil = derniere?.hors_seuil;

              return (
                <div key={item.capteur?.id} style={{
                  ...S.mesureCard,
                  borderColor: horseSeuil ? 'rgba(255,71,87,0.35)' : `${cfg.color}25`,
                  background:  horseSeuil ? 'rgba(255,71,87,0.04)' : 'rgba(255,255,255,0.02)',
                }}>
                  {/* Icon + label */}
                  <div style={{...S.mesureTop, borderBottom:`1px solid ${cfg.color}15`}}>
                    <div style={{...S.mesureIconBox, background:`${cfg.color}12`, border:`1px solid ${cfg.color}25`}}>
                      <TypeIcon type={item.capteur?.type} size={18} />
                    </div>
                    <div style={{flex:1}}>
                      <div style={S.mesureLabel}>{cfg.label.toUpperCase()}</div>
                    </div>
                    {horseSeuil && (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ff4757" strokeWidth="2">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                      </svg>
                    )}
                  </div>

                  {/* Valeur */}
                  <div style={S.mesureValWrap}>
                    {valeur !== null ? (
                      <>
                        <span style={{...S.mesureVal, color: horseSeuil ? '#ff4757' : cfg.color}}>{valeur}</span>
                        <span style={S.mesureUnit}>{item.capteur?.unite}</span>
                      </>
                    ) : (
                      <span style={S.mesureNA}>N/A</span>
                    )}
                  </div>

                  {/* Seuils */}
                  {(item.capteur?.seuil_min !== null || item.capteur?.seuil_max !== null) && (
                    <div style={S.mesureSeuils}>
                      {item.capteur?.seuil_min !== null && (
                        <span style={S.seuilTag}>min {item.capteur.seuil_min}</span>
                      )}
                      {item.capteur?.seuil_max !== null && (
                        <span style={S.seuilTag}>max {item.capteur.seuil_max}</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Machines scrollable + Alertes */}
      <div style={S.grid2}>
        <div style={S.card}>
          <div style={S.cardHead}>
            <span style={S.cardTitle}>ÉTAT DES MACHINES</span>
            <span style={S.cardCount}>{machines.length} machine(s)</span>
          </div>
          <div style={S.scrollList}>
            {machines.map(m => (
              <div key={m.id} style={S.machineRow}>
                <div style={{...S.machineBar, background: m.statut==='EN SERVICE' ? '#2ed573' : m.statut==='MAINTENANCE' ? '#f5a623' : '#ff4757'}}/>
                <div style={{flex:1}}>
                  <div style={S.machineName}>{m.nom}</div>
                  <div style={S.machineLoc}>{m.localisation}</div>
                </div>
                <span style={{...S.badge, ...(m.statut==='EN SERVICE' ? S.badgeOk : S.badgeErr)}}>
                  {m.statut}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div style={S.card}>
          <div style={S.cardHead}>
            <span style={S.cardTitle}>ALERTES RÉCENTES</span>
            <span style={S.cardCount}>{alertesTotal} active(s)</span>
          </div>
          <div style={S.scrollList}>
            {alertes.slice(0, 10).map(a => (
              <div key={a.id} style={{...S.alertItem, opacity: a.acquittee ? 0.4 : 1}}>
                <div style={{
                  ...S.alertDot,
                  background: a.niveau==='CRITIQUE' ? '#ff4757' : a.niveau==='WARNING' ? '#f5a623' : '#2ed573',
                  boxShadow:  !a.acquittee && a.niveau==='CRITIQUE' ? '0 0 6px #ff4757' : 'none',
                }}/>
                <div style={{flex:1, minWidth:0}}>
                  <div style={S.alertMsg}>{a.message}</div>
                  <div style={S.alertMeta}>
                    <span style={{...S.pill, ...(a.niveau==='CRITIQUE' ? S.pillErr : a.niveau==='WARNING' ? S.pillWarn : S.pillInfo)}}>
                      {a.niveau}
                    </span>
                    <span style={S.alertTime}>{new Date(a.cree_le).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, unit, color, status, statusOk }) {
  return (
    <div style={S.mcard}>
      <div style={{...S.mcardBar, background: color}}/>
      <div style={S.mcardLabel}>{label}</div>
      <div style={S.mcardVal}>{value}{unit && <span style={S.mcardUnit}> {unit}</span>}</div>
      <div style={S.mcardStatus}>
        <span style={{...S.dot, background: statusOk ? '#2ed573' : color}}/>
        <span style={{color: statusOk ? '#2ed573' : color, fontSize:11}}>{status}</span>
      </div>
    </div>
  );
}

const S = {
  loading:         { color:'#7a8394', textAlign:'center', marginTop:40 },
  metricsRow:      { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20 },
  mcard:           { background:'#161b22', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, padding:'18px 20px', position:'relative', overflow:'hidden' },
  mcardBar:        { position:'absolute', top:0, left:0, right:0, height:2 },
  mcardLabel:      { fontFamily:'monospace', fontSize:10, color:'#4a5260', letterSpacing:1.5, textTransform:'uppercase', marginBottom:12 },
  mcardVal:        { fontSize:28, fontWeight:600, color:'#e8eaf0', fontFamily:'monospace' },
  mcardUnit:       { fontSize:13, color:'#7a8394' },
  mcardStatus:     { display:'flex', alignItems:'center', gap:5, marginTop:8 },
  dot:             { width:5, height:5, borderRadius:'50%', flexShrink:0 },
  card:            { background:'#161b22', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, padding:'20px 22px', marginBottom:16 },
  cardHead:        { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 },
  cardTitle:       { fontFamily:'monospace', fontSize:11, color:'#7a8394', letterSpacing:1, textTransform:'uppercase' },
  cardCount:       { fontSize:11, color:'#4a5260', fontFamily:'monospace' },
  liveTag:         { display:'flex', alignItems:'center', gap:6, padding:'4px 10px', background:'rgba(46,213,115,0.06)', border:'1px solid rgba(46,213,115,0.15)', borderRadius:20 },
  liveDot:         { width:6, height:6, borderRadius:'50%', background:'#2ed573', boxShadow:'0 0 6px #2ed573' },
  liveTime:        { fontSize:10, fontFamily:'monospace', color:'#2ed573' },
  machineSelector: { display:'flex', gap:8, flexWrap:'wrap', marginBottom:16 },
  machineBtn:      { display:'flex', alignItems:'center', gap:6, padding:'6px 14px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:20, color:'#7a8394', fontSize:12, cursor:'pointer', fontFamily:'monospace', transition:'all 0.15s' },
  machineBtnActive:{ background:'rgba(0,212,170,0.10)', borderColor:'rgba(0,212,170,0.30)', color:'#00d4aa' },
  machineDot:      { width:6, height:6, borderRadius:'50%', flexShrink:0, display:'inline-block' },
  emptyMesures:    { color:'#4a5260', fontSize:12, textAlign:'center', padding:'24px 0', fontFamily:'monospace' },
  mesuresGrid:     { display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:10 },
  mesureCard:      { border:'1px solid', borderRadius:8, overflow:'hidden', transition:'border-color 0.2s' },
  mesureTop:       { display:'flex', alignItems:'center', gap:8, padding:'10px 12px', marginBottom:0 },
  mesureIconBox:   { width:32, height:32, borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
  mesureLabel:     { fontFamily:'monospace', fontSize:9, color:'#4a5260', letterSpacing:1.5 },
  mesureValWrap:   { padding:'10px 12px 6px', display:'flex', alignItems:'baseline', gap:4 },
  mesureVal:       { fontSize:18, fontWeight:600, fontFamily:'monospace' },
  mesureUnit:      { fontSize:11, color:'#7a8394' },
  mesureNA:        { fontSize:16, fontWeight:600, fontFamily:'monospace', color:'#4a5260' },
  mesureSeuils:    { padding:'0 12px 8px', display:'flex', gap:4, flexWrap:'wrap' },
  seuilTag:        { fontSize:9, fontFamily:'monospace', color:'#4a5260', background:'rgba(255,255,255,0.04)', padding:'2px 5px', borderRadius:3 },
  grid2:           { display:'grid', gridTemplateColumns:'2fr 1fr', gap:16 },
  scrollList:      { maxHeight:260, overflowY:'auto', paddingRight:2,
    scrollbarWidth:'thin', scrollbarColor:'rgba(255,255,255,0.1) transparent' },
  machineRow:      { display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' },
  machineBar:      { width:2, height:32, borderRadius:1, flexShrink:0 },
  machineName:     { fontSize:13, color:'#e8eaf0', fontWeight:500, marginBottom:2 },
  machineLoc:      { fontSize:11, color:'#7a8394', fontFamily:'monospace' },
  badge:           { display:'inline-flex', fontFamily:'monospace', fontSize:10, padding:'3px 8px', borderRadius:4, flexShrink:0 },
  badgeOk:         { background:'rgba(46,213,115,0.15)', color:'#2ed573' },
  badgeErr:        { background:'rgba(255,71,87,0.15)',  color:'#ff4757' },
  alertItem:       { display:'flex', alignItems:'center', gap:10, padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' },
  alertDot:        { width:7, height:7, borderRadius:'50%', flexShrink:0 },
  alertMsg:        { fontSize:12, color:'#e8eaf0', marginBottom:5, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' },
  alertMeta:       { display:'flex', alignItems:'center', gap:8 },
  alertTime:       { fontSize:10, color:'#4a5260', fontFamily:'monospace' },
  pill:            { fontFamily:'monospace', fontSize:10, padding:'2px 6px', borderRadius:4 },
  pillErr:         { background:'rgba(255,71,87,0.15)',  color:'#ff4757' },
  pillWarn:        { background:'rgba(245,166,35,0.15)', color:'#f5a623' },
  pillInfo:        { background:'rgba(0,153,255,0.15)',  color:'#0099ff' },
};