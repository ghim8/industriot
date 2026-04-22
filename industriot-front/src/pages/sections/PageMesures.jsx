import React, { useEffect, useState, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, Tooltip, Filler, Legend
} from 'chart.js';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler, Legend);

const TYPE_CONFIG = {
  temperature: { label:'Température', color:'#f5a623', unit:'°C'  },
  humidite:    { label:'Humidité',    color:'#0099ff', unit:'%'   },
  courant:     { label:'Courant',     color:'#00d4aa', unit:'A'   },
  vibration:   { label:'Vibration',   color:'#ff4757', unit:'g'   },
  gaz:         { label:'Gaz',         color:'#a855f7', unit:'ppm' },
  pression:    { label:'Pression',    color:'#2ed573', unit:'bar' },
};

const TypeIcon = ({ type, size=16 }) => {
  const color = TYPE_CONFIG[type]?.color || '#7a8394';
  const icons = {
    temperature: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg>,
    humidite:    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>,
    courant:     <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
    vibration:   <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8"><polyline points="2 12 6 4 10 18 14 8 18 16 22 12"/></svg>,
    gaz:         <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/></svg>,
    pression:    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>,
  };
  return icons[type] || null;
};

function StatItem({ label, val }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
      <span style={{ fontFamily:'monospace', fontSize:9, color:'#4a5260', letterSpacing:1 }}>{label}</span>
      <span style={{ fontFamily:'monospace', fontSize:12, color:'#e8eaf0', fontWeight:600 }}>{val}</span>
    </div>
  );
}
// Récupère la valeur MQTT live si disponible
function getMqttValeur(machineId, type, fallback) {
  if (mesures[machineId]?.[type]) {
    return mesures[machineId][type].valeur;
  }
  return fallback;
}

export default function PageMesures({ mesures = {} }) {  const { user }   = useAuth();
  const [machines, setMachines]        = useState([]);
  const [selectedMachine, setSelected] = useState(null);
  const [data, setData]                = useState([]);
  const [loading, setLoading]          = useState(false);
  const [live, setLive]                = useState(false);
  const [lastUpdate, setLastUpdate]    = useState(null);
  const [autoRefresh, setAutoRefresh]  = useState(true);
  const liveRef     = useRef(null);
  const refreshRef  = useRef(null);
  const selectedRef = useRef(null);
  selectedRef.current = selectedMachine;

  useEffect(() => {
    api.get('/machines').then(r => {
      setMachines(r.data);
      if (r.data.length > 0) selectMachine(r.data[0]);
    });
    return () => { stopLive(); stopAutoRefresh(); };
  }, []);

  useEffect(() => {
    stopAutoRefresh();
    if (autoRefresh && selectedMachine) {
      refreshRef.current = setInterval(() => {
        if (selectedRef.current) fetchMesuresSilent(selectedRef.current.id);
      }, 5000);
    }
    return () => stopAutoRefresh();
  }, [autoRefresh, selectedMachine?.id]);

  const fetchMesures = (id) => {
    setLoading(true);
    api.get(`/mesures?machine_id=${id}`).then(r => {
      setData(r.data);
      setLastUpdate(new Date().toTimeString().slice(0,8));
      setLoading(false);
    });
  };

  const fetchMesuresSilent = (id) => {
    api.get(`/mesures?machine_id=${id}`).then(r => {
      setData(r.data);
      setLastUpdate(new Date().toTimeString().slice(0,8));
    });
  };

  const selectMachine = (machine) => {
    setSelected(machine);
    stopLive();
    fetchMesures(machine.id);
  };

  const startLive = () => {
    setLive(true);
    liveRef.current = setInterval(async () => {
      if (!selectedRef.current) return;
      const res = await api.get('/capteurs');
      const capteurs = res.data.filter(c => c.machine_id === selectedRef.current.id && c.actif);
      for (const capteur of capteurs) {
        const base = { temperature:65, humidite:55, courant:12, vibration:0.5, gaz:120, pression:3.5 }[capteur.type] || 50;
        const valeur = +(base + (Math.random() - 0.5) * 10).toFixed(3);
        await api.post('/mesures', { machine_id: selectedRef.current.id, capteur_id: capteur.id, valeur });
      }
      fetchMesuresSilent(selectedRef.current.id);
    }, 3000);
  };

  const stopLive = () => {
    if (liveRef.current) { clearInterval(liveRef.current); liveRef.current = null; }
    setLive(false);
  };

  const stopAutoRefresh = () => {
    if (refreshRef.current) { clearInterval(refreshRef.current); refreshRef.current = null; }
  };

  const totalCapteurs  = data.length;
  const horsSeuilCount = data.filter(d => d.derniere?.hors_seuil).length;

  // Séparer temp+hum des autres
  const tempItem = data.find(d => d.capteur?.type === 'temperature');
  const humItem  = data.find(d => d.capteur?.type === 'humidite');
  const others   = data.filter(d => d.capteur?.type !== 'temperature' && d.capteur?.type !== 'humidite' && d.mesures?.length > 0);

  const hasTempHum = (tempItem?.mesures?.length > 0) || (humItem?.mesures?.length > 0);

  return (
    <div>
      {/* Header */}
      <div style={S.header}>
        <div>
          <div style={S.headerTitle}>Mesures temps réel</div>
          <div style={S.headerSub}>
            {selectedMachine ? selectedMachine.nom : 'Sélectionne une machine'}
            {totalCapteurs > 0 && ` · ${totalCapteurs} capteur(s)`}
          </div>
        </div>
        <div style={{display:'flex', alignItems:'center', gap:8}}>
          {lastUpdate && (
            <div style={S.updateTag}>
              <span style={{...S.updateDot, background: autoRefresh ? '#2ed573' : '#7a8394'}}/>
              <span style={S.updateTime}>màj {lastUpdate}</span>
            </div>
          )}
          {Object.keys(mesures).length > 0 && (
  <div style={{
    display:'flex', alignItems:'center', gap:6,
    padding:'5px 10px',
    background:'rgba(0,212,170,0.08)',
    border:'1px solid rgba(0,212,170,0.20)',
    borderRadius:6
  }}>
    <div style={{
      width:6, height:6, borderRadius:'50%',
      background:'#00d4aa',
      boxShadow:'0 0 6px #00d4aa',
      animation:'pulse 2s infinite'
    }}/>
    <span style={{ fontSize:10, fontFamily:'monospace', color:'#00d4aa' }}>
      MQTT LIVE
    </span>
  </div>
)}
          <button
            style={{...S.btnToggle,
              background:   autoRefresh ? 'rgba(46,213,115,0.10)' : 'rgba(255,255,255,0.05)',
              borderColor:  autoRefresh ? 'rgba(46,213,115,0.25)' : 'rgba(255,255,255,0.10)',
              color:        autoRefresh ? '#2ed573' : '#7a8394',
            }}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? '⟳ Auto ON' : '⟳ Auto OFF'}
          </button>
          {!live ? (
            <button style={S.btnLive} onClick={startLive} disabled={!selectedMachine}>▶ Simuler live</button>
          ) : (
            <button style={S.btnStop} onClick={stopLive}>■ Arrêter</button>
          )}
        </div>
      </div>

      {/* Sélecteur machine */}
      <div style={S.machineRow}>
        {machines.map(m => (
          <button
            key={m.id}
            style={{...S.machineBtn, ...(selectedMachine?.id === m.id ? S.machineBtnActive : {})}}
            onClick={() => selectMachine(m)}
          >
            <div style={{...S.machineDot, background: m.statut==='EN SERVICE' ? '#2ed573' : '#ff4757'}}/>
            <span>{m.nom}</span>
          </button>
        ))}
      </div>

      {/* Métriques */}
      {!loading && data.length > 0 && (
        <div style={S.metricsRow}>
          <div style={S.mcard}>
            <div style={{...S.mcardBar, background:'#0099ff'}}/>
            <div style={S.mcardLabel}>CAPTEURS ACTIFS</div>
            <div style={S.mcardVal}>{totalCapteurs}</div>
          </div>
          <div style={S.mcard}>
            <div style={{...S.mcardBar, background: horsSeuilCount > 0 ? '#ff4757' : '#2ed573'}}/>
            <div style={S.mcardLabel}>HORS SEUIL</div>
            <div style={{...S.mcardVal, color: horsSeuilCount > 0 ? '#ff4757' : '#2ed573'}}>{horsSeuilCount}</div>
          </div>
          <div style={S.mcard}>
            <div style={{...S.mcardBar, background:'#f5a623'}}/>
            <div style={S.mcardLabel}>LOCALISATION</div>
            <div style={S.mcardValSm}>{selectedMachine?.localisation}</div>
          </div>
          <div style={S.mcard}>
            <div style={{...S.mcardBar, background:'#00d4aa'}}/>
            <div style={S.mcardLabel}>STATUT</div>
            <div style={{...S.mcardValSm, color:'#2ed573'}}>{selectedMachine?.statut}</div>
          </div>
        </div>
      )}

      {loading && <div style={S.loading}>Chargement...</div>}

      {!loading && data.length === 0 && (
        <div style={S.emptyState}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#4a5260" strokeWidth="1.5">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
          <div style={{marginTop:12, fontSize:14, color:'#7a8394'}}>Aucune mesure disponible</div>
          <div style={{marginTop:6, fontSize:12, color:'#4a5260'}}>Lance la simulation pour générer des données</div>
          <button style={{...S.btnLive, marginTop:16}} onClick={startLive}>▶ Démarrer la simulation</button>
        </div>
      )}

      {/* Graphique Température + Humidité — pleine largeur */}
      {!loading && hasTempHum && (() => {
        const labels = (tempItem?.mesures || humItem?.mesures || [])
          .map(m => new Date(m.horodatage).toTimeString().slice(0,8));
        const datasets = [];
        if (tempItem?.mesures?.length) datasets.push({
          label:'Température (°C)', data: tempItem.mesures.map(m => parseFloat(m.valeur)),
          borderColor:'#f5a623', backgroundColor:'#f5a62312',
          borderWidth:1.5, pointRadius:0, tension:0.4, fill:true, yAxisID:'y',
        });
        if (humItem?.mesures?.length) datasets.push({
          label:'Humidité (%)', data: humItem.mesures.map(m => parseFloat(m.valeur)),
          borderColor:'#0099ff', backgroundColor:'#0099ff12',
          borderWidth:1.5, pointRadius:0, tension:0.4, fill:true, yAxisID:'y1',
        });
        const tempVal = tempItem?.derniere ? parseFloat(tempItem.derniere.valeur).toFixed(2) : null;
        const humVal  = humItem?.derniere  ? parseFloat(humItem.derniere.valeur).toFixed(2)  : null;

        return (
          <div style={S.chartCardFull}>
            <div style={S.chartHead}>
              <div style={{display:'flex', alignItems:'center', gap:12}}>
                <div style={{display:'flex', gap:8}}>
                  {tempItem && <div style={{...S.chartIconWrap, background:'#f5a62315', border:'1px solid #f5a62330'}}><TypeIcon type="temperature" size={16}/></div>}
                  {humItem  && <div style={{...S.chartIconWrap, background:'#0099ff15', border:'1px solid #0099ff30'}}><TypeIcon type="humidite"    size={16}/></div>}
                </div>
                <div>
                  <div style={S.chartTitle}>Température & Humidité</div>
                  <div style={S.chartSub}>Graphique combiné · {labels.length} points</div>
                </div>
              </div>
              <div style={{display:'flex', gap:20}}>
                {tempVal && (
                  <div style={{textAlign:'right'}}>
                    <div style={{fontSize:11, fontFamily:'monospace', color:'#7a8394'}}>Température</div>
                    <div style={{fontSize:20, fontWeight:600, fontFamily:'monospace', color: tempItem?.derniere?.hors_seuil ? '#ff4757' : '#f5a623'}}>
                      {tempVal} <span style={{fontSize:11, color:'#7a8394'}}>°C</span>
                    </div>
                  </div>
                )}
                {humVal && (
                  <div style={{textAlign:'right'}}>
                    <div style={{fontSize:11, fontFamily:'monospace', color:'#7a8394'}}>Humidité</div>
                    <div style={{fontSize:20, fontWeight:600, fontFamily:'monospace', color: humItem?.derniere?.hors_seuil ? '#ff4757' : '#0099ff'}}>
                      {humVal} <span style={{fontSize:11, color:'#7a8394'}}>%</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div style={{height:220}}>
              <Line data={{labels, datasets}} options={{
                responsive:true, maintainAspectRatio:false,
                interaction:{ mode:'index', intersect:false },
                plugins:{
                  legend:{ display:true, labels:{ color:'#7a8394', font:{ family:'monospace', size:10 }, boxWidth:12 } },
                  tooltip:{ backgroundColor:'#1c2129', borderColor:'rgba(255,255,255,0.1)', borderWidth:1, titleColor:'#e8eaf0', bodyColor:'#7a8394' },
                },
                scales:{
                  x:  { grid:{ color:'rgba(255,255,255,0.03)' }, ticks:{ color:'#4a5260', font:{ family:'monospace', size:9 }, maxTicksLimit:8 } },
                  y:  { grid:{ color:'rgba(255,255,255,0.03)' }, ticks:{ color:'#f5a623', font:{ family:'monospace', size:9 } }, position:'left'  },
                  y1: { grid:{ display:false },                  ticks:{ color:'#0099ff', font:{ family:'monospace', size:9 } }, position:'right' },
                },
              }}/>
            </div>
          </div>
        );
      })()}

      {/* Autres graphiques — 2 par ligne */}
      {!loading && others.length > 0 && (
        <div style={S.chartsGrid2}>
          {others.map(item => {
            const cfg    = TYPE_CONFIG[item.capteur.type] || { color:'#00d4aa', label: item.capteur.type };
            const labels = item.mesures.map(m => new Date(m.horodatage).toTimeString().slice(0,8));
            const values = item.mesures.map(m => parseFloat(m.valeur));
            const mqttVal = mesures[selectedMachine?.id]?.[item.capteur.type]?.valeur;
            const derniereVal = mqttVal 
              ? parseFloat(mqttVal).toFixed(3)
              : item.derniere 
                ? parseFloat(item.derniere.valeur).toFixed(3) 
                : '—';
            const hors = mesures[selectedMachine?.id]?.[item.capteur.type]?.hors_seuil 
              ?? item.derniere?.hors_seuil;
            const min    = Math.min(...values);
            const max    = Math.max(...values);
            const avg    = (values.reduce((a,b) => a+b, 0) / values.length).toFixed(2);

            return (
              <div key={item.capteur.id} style={{
                ...S.chartCard,
                borderColor: hors ? 'rgba(255,71,87,0.25)' : 'rgba(255,255,255,0.07)',
              }}>
                {hors && <div style={S.alertBand}>⚠ HORS SEUIL</div>}
                <div style={{...S.chartHead, marginTop: hors ? 16 : 0}}>
                  <div style={{display:'flex', alignItems:'center', gap:10}}>
                    <div style={{...S.chartIconWrap, background:`${cfg.color}15`, border:`1px solid ${cfg.color}30`}}>
                      <TypeIcon type={item.capteur.type} size={16}/>
                    </div>
                    <div>
                      <div style={S.chartTitle}>{cfg.label}</div>
                      <div style={S.chartSub}>{item.capteur.unite} · {labels.length} points</div>
                    </div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{...S.chartVal, color: hors ? '#ff4757' : cfg.color}}>
                      {derniereVal}<span style={S.chartUnit}> {item.capteur.unite}</span>
                    </div>
                    <div style={{fontSize:10, fontFamily:'monospace', color: hors ? '#ff4757' : '#2ed573'}}>
                      {hors ? '● Hors seuil' : '● Normal'}
                    </div>
                  </div>
                </div>
                <div style={S.statsRow}>
                  <StatItem label="MIN" val={min.toFixed(2)}/>
                  <StatItem label="MOY" val={avg}/>
                  <StatItem label="MAX" val={max.toFixed(2)}/>
                  {item.capteur.seuil_min !== null && <StatItem label="SEUIL MIN" val={item.capteur.seuil_min}/>}
                  {item.capteur.seuil_max !== null && <StatItem label="SEUIL MAX" val={item.capteur.seuil_max}/>}
                </div>
                <div style={{height:160}}>
                  <Line data={{
                    labels,
                    datasets:[{
                      label: cfg.label,
                      data: values,
                      borderColor: hors ? '#ff4757' : cfg.color,
                      backgroundColor: (hors ? '#ff4757' : cfg.color) + '12',
                      borderWidth:1.5, pointRadius:0, tension:0.4, fill:true, yAxisID:'y',
                    }]
                  }} options={{
                    responsive:true, maintainAspectRatio:false,
                    plugins:{
                      legend:{ display:false },
                      tooltip:{ backgroundColor:'#1c2129', borderColor:'rgba(255,255,255,0.1)', borderWidth:1, titleColor:'#e8eaf0', bodyColor:'#7a8394' },
                    },
                    scales:{
                      x:{ grid:{ color:'rgba(255,255,255,0.03)' }, ticks:{ color:'#4a5260', font:{ family:'monospace', size:9 }, maxTicksLimit:6 } },
                      y:{ grid:{ color:'rgba(255,255,255,0.03)' }, ticks:{ color:'#4a5260', font:{ family:'monospace', size:9 } } },
                    },
                  }}/>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const S = {
  header:          { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 },
  headerTitle:     { fontSize:15, fontWeight:600, color:'#e8eaf0' },
  headerSub:       { fontSize:12, color:'#7a8394', marginTop:4 },
  updateTag:       { display:'flex', alignItems:'center', gap:5, padding:'5px 10px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:6 },
  updateDot:       { width:6, height:6, borderRadius:'50%' },
  updateTime:      { fontSize:10, fontFamily:'monospace', color:'#7a8394' },
  btnToggle:       { padding:'7px 12px', border:'1px solid', borderRadius:7, fontSize:11, cursor:'pointer', fontFamily:'monospace' },
  btnLive:         { padding:'8px 14px', background:'rgba(46,213,115,0.10)', border:'1px solid rgba(46,213,115,0.25)', borderRadius:7, color:'#2ed573', fontSize:12, cursor:'pointer', fontFamily:'monospace' },
  btnStop:         { padding:'8px 14px', background:'rgba(255,71,87,0.10)', border:'1px solid rgba(255,71,87,0.25)', borderRadius:7, color:'#ff4757', fontSize:12, cursor:'pointer', fontFamily:'monospace' },
  machineRow:      { display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' },
  machineBtn:      { display:'flex', alignItems:'center', gap:7, padding:'8px 14px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, color:'#7a8394', fontSize:12, cursor:'pointer', fontFamily:'monospace' },
  machineBtnActive:{ background:'rgba(0,212,170,0.08)', borderColor:'rgba(0,212,170,0.25)', color:'#00d4aa' },
  machineDot:      { width:6, height:6, borderRadius:'50%', flexShrink:0 },
  metricsRow:      { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20 },
  mcard:           { background:'#161b22', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, padding:'16px 18px', position:'relative', overflow:'hidden' },
  mcardBar:        { position:'absolute', top:0, left:0, right:0, height:2 },
  mcardLabel:      { fontFamily:'monospace', fontSize:9, color:'#4a5260', letterSpacing:1.5, textTransform:'uppercase', marginBottom:10 },
  mcardVal:        { fontSize:26, fontWeight:600, color:'#e8eaf0', fontFamily:'monospace' },
  mcardValSm:      { fontSize:13, fontWeight:600, color:'#e8eaf0', fontFamily:'monospace', marginTop:2 },
  loading:         { color:'#7a8394', textAlign:'center', marginTop:60 },
  emptyState:      { textAlign:'center', marginTop:60, color:'#7a8394' },
  chartCardFull:   { background:'#161b22', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, padding:'18px 20px', marginBottom:16 },
  chartsGrid2:     { display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:16, marginBottom:16 },
  chartCard:       { background:'#161b22', border:'1px solid', borderRadius:10, padding:'18px 20px', position:'relative', overflow:'hidden' },
  alertBand:       { position:'absolute', top:0, left:0, right:0, background:'rgba(255,71,87,0.12)', color:'#ff4757', fontSize:10, fontFamily:'monospace', padding:'3px 0', textAlign:'center', letterSpacing:1 },
  chartHead:       { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 },
  chartIconWrap:   { width:32, height:32, borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
  chartTitle:      { fontSize:13, fontWeight:600, color:'#e8eaf0' },
  chartSub:        { fontSize:10, color:'#7a8394', fontFamily:'monospace', marginTop:2 },
  chartVal:        { fontSize:20, fontWeight:600, fontFamily:'monospace' },
  chartUnit:       { fontSize:11, color:'#7a8394' },
  statsRow:        { display:'flex', gap:16, marginBottom:12, padding:'8px 12px', background:'rgba(255,255,255,0.02)', borderRadius:6 },
};