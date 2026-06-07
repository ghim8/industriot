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

const COURBE_COLORS = [
  '#00d4aa', '#f5a623', '#0099ff', '#ff4757',
  '#a855f7', '#2ed573', '#ff6b35', '#00b4d8',
];

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
      <span style={{ fontSize:9, color:'#4a5260', letterSpacing:1, textTransform:'uppercase' }}>{label}</span>
      <span style={{ fontSize:12, color:'#e8eaf0', fontWeight:600 }}>{val}</span>
    </div>
  );
}

export default function PageMesures({ mesures = {}, defaultMachineId = null }) {
  const { user }   = useAuth();
  const [machines, setMachines]        = useState([]);
  const [selectedMachine, setSelected] = useState(null);
  const [grouped, setGrouped]          = useState({});
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
      // Sélectionner la machine passée en paramètre ou la première
      const target = defaultMachineId
        ? r.data.find(m => m.id === defaultMachineId)
        : r.data[0];
      if (target) selectMachine(target);
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
      setGrouped(r.data);
      setLastUpdate(new Date().toTimeString().slice(0,8));
      setLoading(false);
    });
  };

  const fetchMesuresSilent = (id) => {
    api.get(`/mesures?machine_id=${id}`).then(r => {
      setGrouped(r.data);
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
      const capteurs = res.data.flatMap(g => g.capteurs || [])
                              .filter(c => c.machine_id === selectedRef.current.id && c.actif);
      for (const capteur of capteurs) {
        const base = { temperature:65, humidite:55, courant:12, vibration:0.5, gaz:120, pression:3.5 }[capteur.type] || 50;
        const valeur = +(base + (Math.random() - 0.5) * 10).toFixed(3);
        await api.post('/mesures', { machine_id: selectedRef.current.id, capteur_id: capteur.id, valeur });
      }
      fetchMesuresSilent(selectedRef.current.id);
    }, 3000);
  };

  const stopLive    = () => { if (liveRef.current)    { clearInterval(liveRef.current);    liveRef.current    = null; } setLive(false); };
  const stopAutoRefresh = () => { if (refreshRef.current) { clearInterval(refreshRef.current); refreshRef.current = null; } };

  const totalTypes    = Object.keys(grouped).length;
  const totalCapteurs = Object.values(grouped).reduce((acc, items) => acc + items.length, 0);
  const horsSeuilCount = Object.values(grouped).reduce((acc, items) =>
    acc + items.filter(i => i.derniere?.hors_seuil).length, 0);

  return (
    <div>
      {/* Header */}
      <div style={S.header}>
        <div>
          <div style={S.headerTitle}>Mesures temps réel</div>
          <div style={S.headerSub}>
            {selectedMachine ? selectedMachine.nom : 'Sélectionne une machine'}
            {totalCapteurs > 0 && ` · ${totalCapteurs} capteur(s) · ${totalTypes} type(s)`}
          </div>
        </div>
        <div style={{display:'flex', alignItems:'center', gap:8}}>
          {lastUpdate && (
            <div style={S.updateTag}>
              <span style={{...S.updateDot, background: autoRefresh ? '#2ed573' : '#7a8394'}}/>
              <span style={S.updateTime}>màj {lastUpdate}</span>
            </div>
          )}
         
        </div>
      </div>

      {/* Sélecteur machine */}
      <div style={S.machineRow}>
        {machines.map(m => (
          <button key={m.id}
            style={{...S.machineBtn, ...(selectedMachine?.id === m.id ? S.machineBtnActive : {})}}
            onClick={() => selectMachine(m)}
          >
            <div style={{...S.machineDot, background: m.statut==='EN SERVICE' ? '#2ed573' : '#ff4757'}}/>
            <span>{m.nom}</span>
          </button>
        ))}
      </div>

      {/* Métriques */}
      {!loading && totalCapteurs > 0 && (
        <div style={S.metricsRow}>
          <div style={S.mcard}>
            <div style={{...S.mcardBar, background:'#0099ff'}}/>
            <div style={S.mcardLabel}>Types de capteurs</div>
            <div style={S.mcardVal}>{totalTypes}</div>
          </div>
          <div style={S.mcard}>
            <div style={{...S.mcardBar, background:'#00d4aa'}}/>
            <div style={S.mcardLabel}>Capteurs actifs</div>
            <div style={S.mcardVal}>{totalCapteurs}</div>
          </div>
          <div style={S.mcard}>
            <div style={{...S.mcardBar, background: horsSeuilCount > 0 ? '#ff4757' : '#2ed573'}}/>
            <div style={S.mcardLabel}>Hors seuil</div>
            <div style={{...S.mcardVal, color: horsSeuilCount > 0 ? '#ff4757' : '#2ed573'}}>{horsSeuilCount}</div>
          </div>
          <div style={S.mcard}>
            <div style={{...S.mcardBar, background:'#f5a623'}}/>
            <div style={S.mcardLabel}>Localisation</div>
            <div style={S.mcardValSm}>{selectedMachine?.localisation}</div>
          </div>
        </div>
      )}

      {loading && <div style={S.loading}>Chargement...</div>}

      

      {/* Graphiques groupés par type */}
      {!loading && Object.entries(grouped).map(([type, items]) => {
        const cfg    = TYPE_CONFIG[type] || { label: type, color:'#00d4aa', unit:'' };
        const labels = items[0]?.mesures?.map(m => new Date(m.horodatage).toTimeString().slice(0,8)) || [];

        const datasets = items.map((item, idx) => {
          const color = COURBE_COLORS[idx % COURBE_COLORS.length];
          const hors  = item.derniere?.hors_seuil;
          return {
            label:           item.actionneur?.nom || `Capteur ${item.capteur?.id}`,
            data:            item.mesures?.map(m => parseFloat(m.valeur)) || [],
            borderColor:     hors ? '#ff4757' : color,
            backgroundColor: (hors ? '#ff4757' : color) + '18',
            borderWidth:     1.8,
            pointRadius:     0,
            pointHoverRadius:4,
            tension:         0.4,
            fill:            false,
          };
        });

        // Stats globales du type
        const allValues = items.flatMap(i => i.mesures?.map(m => parseFloat(m.valeur)) || []);
        const min = allValues.length ? Math.min(...allValues).toFixed(2) : '—';
        const max = allValues.length ? Math.max(...allValues).toFixed(2) : '—';
        const horsItems = items.filter(i => i.derniere?.hors_seuil);

        return (
          <div key={type} style={{...S.chartCard, borderColor: horsItems.length > 0 ? 'rgba(255,71,87,0.25)' : 'rgba(255,255,255,0.07)'}}>
            {horsItems.length > 0 && <div style={S.alertBand}>⚠ HORS SEUIL — {horsItems.map(i => i.actionneur?.nom).join(', ')}</div>}

            {/* Header */}
            <div style={{...S.chartHead, marginTop: horsItems.length > 0 ? 16 : 0}}>
              <div style={{display:'flex', alignItems:'center', gap:12}}>
                <div style={{...S.chartIconWrap, background:`${cfg.color}15`, border:`1px solid ${cfg.color}30`}}>
                  <TypeIcon type={type} size={16}/>
                </div>
                <div>
                  <div style={S.chartTitle}>{cfg.label}</div>
                  <div style={S.chartSub}>{items.length} actionneur(s) · unité : {items[0]?.capteur?.unite || cfg.unit}</div>
                </div>
              </div>

              {/* Dernières valeurs par actionneur */}
              <div style={{display:'flex', gap:16, flexWrap:'wrap'}}>
                {items.map((item, idx) => {
                  const color    = COURBE_COLORS[idx % COURBE_COLORS.length];
                  const derniere = item.derniere ? parseFloat(item.derniere.valeur).toFixed(2) : '—';
                  const hors     = item.derniere?.hors_seuil;
                  return (
                    <div key={item.capteur?.id} style={{textAlign:'right'}}>
                      <div style={{fontSize:10, color:'#7a8394', marginBottom:2, display:'flex', alignItems:'center', gap:5, justifyContent:'flex-end'}}>
                        <span style={{width:8, height:8, borderRadius:'50%', background: hors ? '#ff4757' : color, display:'inline-block'}}/>
                        {item.actionneur?.nom || 'Sans actionneur'}
                      </div>
                      <div style={{fontSize:18, fontWeight:600, color: hors ? '#ff4757' : color}}>
                        {derniere} <span style={{fontSize:11, color:'#7a8394'}}>{item.capteur?.unite}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Stats */}
            <div style={S.statsRow}>
              <StatItem label="Min global" val={`${min} ${items[0]?.capteur?.unite || ''}`}/>
              <StatItem label="Max global" val={`${max} ${items[0]?.capteur?.unite || ''}`}/>
              <StatItem label="Points" val={labels.length}/>
              {items[0]?.capteur?.seuil_min !== null && <StatItem label="Seuil min" val={`${items[0]?.capteur?.seuil_min} ${items[0]?.capteur?.unite || ''}`}/>}
              {items[0]?.capteur?.seuil_max !== null && <StatItem label="Seuil max" val={`${items[0]?.capteur?.seuil_max} ${items[0]?.capteur?.unite || ''}`}/>}
            </div>

            {/* Légende couleurs */}
            <div style={S.legendRow}>
              {items.map((item, idx) => (
                <div key={idx} style={S.legendItem}>
                  <span style={{width:20, height:2, background: COURBE_COLORS[idx % COURBE_COLORS.length], display:'inline-block', borderRadius:1}}/>
                  <span style={{fontSize:11, color:'#7a8394'}}>{item.actionneur?.nom || 'Sans actionneur'}</span>
                </div>
              ))}
            </div>

            {/* Graphique */}
            <div style={{height:200}}>
              <Line data={{labels, datasets}} options={{
                responsive:true, maintainAspectRatio:false,
                interaction:{ mode:'index', intersect:false },
                plugins:{
                  legend:{ display:false },
                  tooltip:{
                    backgroundColor:'#1c2129',
                    borderColor:'rgba(255,255,255,0.1)',
                    borderWidth:1,
                    titleColor:'#e8eaf0',
                    bodyColor:'#7a8394',
                  },
                },
                scales:{
                  x:{ grid:{ color:'rgba(255,255,255,0.03)' }, ticks:{ color:'#4a5260', font:{ size:9 }, maxTicksLimit:8 } },
                  y:{ grid:{ color:'rgba(255,255,255,0.03)' }, ticks:{ color:'#4a5260', font:{ size:9 } } },
                },
              }}/>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const S = {
  header:          { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 },
  headerTitle:     { fontSize:15, fontWeight:600, color:'#e8eaf0' },
  headerSub:       { fontSize:12, color:'#7a8394', marginTop:4 },
  updateTag:       { display:'flex', alignItems:'center', gap:5, padding:'5px 10px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:6 },
  updateDot:       { width:6, height:6, borderRadius:'50%' },
  updateTime:      { fontSize:10, color:'#7a8394' },
  btnToggle:       { padding:'7px 12px', border:'1px solid', borderRadius:7, fontSize:11, cursor:'pointer' },
  btnLive:         { padding:'8px 14px', background:'rgba(46,213,115,0.10)', border:'1px solid rgba(46,213,115,0.25)', borderRadius:7, color:'#2ed573', fontSize:12, cursor:'pointer' },
  btnStop:         { padding:'8px 14px', background:'rgba(255,71,87,0.10)', border:'1px solid rgba(255,71,87,0.25)', borderRadius:7, color:'#ff4757', fontSize:12, cursor:'pointer' },
  machineRow:      { display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' },
  machineBtn:      { display:'flex', alignItems:'center', gap:7, padding:'8px 14px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, color:'#7a8394', fontSize:12, cursor:'pointer' },
  machineBtnActive:{ background:'rgba(0,212,170,0.08)', borderColor:'rgba(0,212,170,0.25)', color:'#00d4aa' },
  machineDot:      { width:6, height:6, borderRadius:'50%', flexShrink:0 },
  metricsRow:      { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20 },
  mcard:           { background:'#161b22', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, padding:'16px 18px', position:'relative', overflow:'hidden' },
  mcardBar:        { position:'absolute', top:0, left:0, right:0, height:2 },
  mcardLabel:      { fontSize:11, color:'#4a5260', textTransform:'uppercase', marginBottom:10, fontWeight:500 },
  mcardVal:        { fontSize:26, fontWeight:700, color:'#e8eaf0' },
  mcardValSm:      { fontSize:13, fontWeight:600, color:'#e8eaf0', marginTop:2 },
  loading:         { color:'#7a8394', textAlign:'center', marginTop:60 },
  emptyState:      { textAlign:'center', marginTop:60, color:'#7a8394' },
  chartCard:       { background:'#161b22', border:'1px solid', borderRadius:10, padding:'18px 20px', marginBottom:16, position:'relative', overflow:'hidden' },
  alertBand:       { position:'absolute', top:0, left:0, right:0, background:'rgba(255,71,87,0.12)', color:'#ff4757', fontSize:10, padding:'3px 0', textAlign:'center', letterSpacing:1 },
  chartHead:       { display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:12, flexWrap:'wrap', gap:10 },
  chartIconWrap:   { width:32, height:32, borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
  chartTitle:      { fontSize:13, fontWeight:600, color:'#e8eaf0' },
  chartSub:        { fontSize:10, color:'#7a8394', marginTop:2 },
  statsRow:        { display:'flex', gap:16, marginBottom:10, padding:'8px 12px', background:'rgba(255,255,255,0.02)', borderRadius:6, flexWrap:'wrap' },
  legendRow:       { display:'flex', gap:14, marginBottom:12, flexWrap:'wrap' },
  legendItem:      { display:'flex', alignItems:'center', gap:6 },
};