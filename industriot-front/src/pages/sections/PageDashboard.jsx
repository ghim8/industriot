import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
export default function PageDashboard({ mqttMesures = {}, setActive, setSelectedMachineId }) {
  const [machines, setMachines] = useState([]);
  const [alertes, setAlertes]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const { user } = useAuth();

useEffect(() => {
    Promise.all([
      api.get(`/machines?user_id=${user?.id}`),
      api.get('/alertes')
    ]).then(([m, a]) => {
        setMachines(m.data);
        setAlertes(a.data);
        setLoading(false);
    });
}, []);

  if (loading) return <div style={S.loading}>Chargement...</div>;

  const enService    = machines.filter(m => m.statut === 'EN SERVICE').length;
  const alertesCrit  = alertes.filter(a => a.niveau === 'CRITIQUE' && !a.acquittee).length;
  const alertesWarn  = alertes.filter(a => a.niveau === 'WARNING'  && !a.acquittee).length;
  const alertesTotal = alertes.filter(a => !a.acquittee).length;

  return (
    <div>
      {/* Métriques */}
      <div style={S.metricsRow}>
        <MetricCard label="MACHINES ACTIVES"  value={enService}    unit={`/ ${machines.length}`} color="#2ed573" status="En ligne"                                        statusOk />
        <MetricCard label="ALERTES CRITIQUES" value={alertesCrit}  color="#ff4757" status={alertesCrit > 0 ? 'Action requise' : 'Aucune'} statusOk={alertesCrit === 0} />
        <MetricCard label="ALERTES WARNING"   value={alertesWarn}  color="#f5a623" status={alertesWarn  > 0 ? 'À surveiller'  : 'Aucun'}  statusOk={alertesWarn  === 0} />
        <MetricCard label="TOTAL ALERTES"     value={alertesTotal} color="#0099ff" status="Non acquittées"                                 statusOk={alertesTotal === 0} />
      </div>

      {/* Cartes machines cliquables */}
      <div style={S.card}>
        <div style={S.cardHead}>
          <span style={S.cardTitle}>MACHINES — CLIQUER POUR LES MESURES</span>
          <span style={S.cardCount}>{machines.length} machine(s)</span>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
          {machines.map(m => {
            const mqttData = mqttMesures[m.id];
            return (
              <div
                key={m.id}
                style={{
                  background:'#1c2129',
                  border:'1px solid rgba(255,255,255,0.07)',
                  borderRadius:8, padding:'14px 16px',
                  cursor:'pointer', transition:'border-color 0.2s',
                }}
                onClick={() => {
                setSelectedMachineId(m.id);
                setActive('mesures');
                }}
              >
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600, color:'#e8eaf0', marginBottom:2 }}>{m.nom}</div>
                    <div style={{ fontSize:10, color:'#7a8394' }}>{m.localisation}</div>
                  </div>
                  <span style={{
                    fontSize:9, padding:'2px 7px', borderRadius:4,
                    background: m.statut==='EN SERVICE' ? 'rgba(46,213,115,0.15)' : 'rgba(255,71,87,0.15)',
                    color:      m.statut==='EN SERVICE' ? '#2ed573' : '#ff4757',
                  }}>{m.statut}</span>
                </div>

                {mqttData ? (
                  <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                    {Object.entries(mqttData).map(([type, data]) => (
                      <div key={type} style={{
                        display:'flex', alignItems:'center', gap:4, padding:'3px 7px',
                        background: data.hors_seuil ? 'rgba(255,71,87,0.10)' : 'rgba(0,212,170,0.06)',
                        border: `1px solid ${data.hors_seuil ? 'rgba(255,71,87,0.25)' : 'rgba(0,212,170,0.15)'}`,
                        borderRadius:4,
                      }}>
                        <span style={{ fontSize:9, color:'#7a8394', textTransform:'uppercase' }}>{type}</span>
                        <span style={{ fontSize:11, fontWeight:600, fontFamily:'monospace', color: data.hors_seuil ? '#ff4757' : '#00d4aa' }}>
                          {parseFloat(data.valeur).toFixed(1)}{data.unite}
                        </span>
                        {data.hors_seuil && <span style={{ fontSize:9, color:'#ff4757' }}>⚠</span>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize:11, color:'#4a5260' }}>Aucune donnée live</div>
                )}

                <div style={{ marginTop:10, fontSize:10, color:'#00d4aa', textAlign:'right' }}>
                  Voir mesures →
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Machines + Alertes */}
      <div style={S.grid2}>
       

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
  loading:      { color:'#7a8394', textAlign:'center', marginTop:40 },
  metricsRow:   { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20 },
  mcard:        { background:'#161b22', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, padding:'18px 20px', position:'relative', overflow:'hidden' },
  mcardBar:     { position:'absolute', top:0, left:0, right:0, height:2 },
  mcardLabel:   { fontFamily:'monospace', fontSize:10, color:'#4a5260', letterSpacing:1.5, textTransform:'uppercase', marginBottom:12 },
  mcardVal:     { fontSize:28, fontWeight:600, color:'#e8eaf0', fontFamily:'monospace' },
  mcardUnit:    { fontSize:13, color:'#7a8394' },
  mcardStatus:  { display:'flex', alignItems:'center', gap:5, marginTop:8 },
  dot:          { width:5, height:5, borderRadius:'50%', flexShrink:0 },
  card:         { background:'#161b22', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, padding:'20px 22px', marginBottom:16 },
  cardHead:     { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 },
  cardTitle:    { fontFamily:'monospace', fontSize:11, color:'#7a8394', letterSpacing:1, textTransform:'uppercase' },
  cardCount:    { fontSize:11, color:'#4a5260', fontFamily:'monospace' },
  grid2:        { display:'grid', gridTemplateColumns:'2fr 1fr', gap:16 },
  scrollList:   { maxHeight:260, overflowY:'auto', paddingRight:2, scrollbarWidth:'thin', scrollbarColor:'rgba(255,255,255,0.1) transparent' },
  machineRow:   { display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' },
  machineBar:   { width:2, height:32, borderRadius:1, flexShrink:0 },
  machineName:  { fontSize:13, color:'#e8eaf0', fontWeight:500, marginBottom:2 },
  machineLoc:   { fontSize:11, color:'#7a8394', fontFamily:'monospace' },
  badge:        { display:'inline-flex', fontFamily:'monospace', fontSize:10, padding:'3px 8px', borderRadius:4, flexShrink:0 },
  badgeOk:      { background:'rgba(46,213,115,0.15)', color:'#2ed573' },
  badgeErr:     { background:'rgba(255,71,87,0.15)',  color:'#ff4757' },
  alertItem:    { display:'flex', alignItems:'center', gap:10, padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' },
  alertDot:     { width:7, height:7, borderRadius:'50%', flexShrink:0 },
  alertMsg:     { fontSize:12, color:'#e8eaf0', marginBottom:5, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' },
  alertMeta:    { display:'flex', alignItems:'center', gap:8 },
  alertTime:    { fontSize:10, color:'#4a5260', fontFamily:'monospace' },
  pill:         { fontFamily:'monospace', fontSize:10, padding:'2px 6px', borderRadius:4 },
  pillErr:      { background:'rgba(255,71,87,0.15)',  color:'#ff4757' },
  pillWarn:     { background:'rgba(245,166,35,0.15)', color:'#f5a623' },
  pillInfo:     { background:'rgba(0,153,255,0.15)',  color:'#0099ff' },
};
