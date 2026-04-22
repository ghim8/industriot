import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

export default function PageRelais() {
  const { user }  = useAuth();
  const [relais, setRelais]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [log, setLog]         = useState([]);

  useEffect(() => { fetchRelais(); }, []);

  const fetchRelais = () => {
    api.get('/relais').then(r => {
      setRelais(r.data);
      setLoading(false);
    });
  };

  const toggle = async (relai) => {
    const nouvelEtat = relai.etat === 1 ? 0 : 1;
    try {
      await api.put(`/relais/${relai.id}`, {
        etat:           nouvelEtat,
        utilisateur_id: user?.id,
      });

      // Met à jour localement
      setRelais(prev => prev.map(r =>
        r.id === relai.id ? { ...r, etat: nouvelEtat } : r
      ));

      // Ajoute au log
      const now = new Date().toTimeString().slice(0, 8);
      setLog(prev => [{
        time:  now,
        nom:   relai.nom,
        etat:  nouvelEtat === 1 ? 'ON' : 'OFF',
      }, ...prev].slice(0, 20));

    } catch(e) {
      alert('Erreur lors du changement d\'état');
    }
  };

  // Grouper par machine
  const parMachine = relais.reduce((acc, r) => {
    const machineName = r.machine?.nom || 'Sans machine';
    if (!acc[machineName]) acc[machineName] = [];
    acc[machineName].push(r);
    return acc;
  }, {});

  const totalOn  = relais.filter(r => r.etat === 1).length;
  const totalOff = relais.filter(r => r.etat === 0).length;

  if (loading) return <div style={S.loading}>Chargement...</div>;

  return (
    <div>
      {/* Métriques */}
      <div style={S.metricsRow}>
        <div style={S.mcard}>
          <div style={{...S.mcardBar, background:'#2ed573'}}/>
          <div style={S.mcardLabel}>RELAIS ACTIFS (ON)</div>
          <div style={S.mcardVal}>{totalOn}</div>
        </div>
        <div style={S.mcard}>
          <div style={{...S.mcardBar, background:'#ff4757'}}/>
          <div style={S.mcardLabel}>RELAIS INACTIFS (OFF)</div>
          <div style={S.mcardVal}>{totalOff}</div>
        </div>
        <div style={S.mcard}>
          <div style={{...S.mcardBar, background:'#0099ff'}}/>
          <div style={S.mcardLabel}>TOTAL RELAIS</div>
          <div style={S.mcardVal}>{relais.length}</div>
        </div>
      </div>

      <div style={S.grid2}>
        {/* Relais par machine */}
        <div>
          {Object.entries(parMachine).map(([machineName, items]) => (
            <div key={machineName} style={S.card}>
              <div style={S.cardHead}>
                <span style={S.cardTitle}>{machineName}</span>
                <span style={S.cardSub}>{items.length} relai(s)</span>
              </div>
              {items.map(relai => (
                <div key={relai.id} style={S.relaiRow}>
                  <div style={{flex:1}}>
                    <div style={S.relaiNom}>{relai.nom}</div>
                    <div style={S.relaiCanal}>{relai.canal}</div>
                  </div>
                  <div style={S.toggleGroup}>
                    <span style={{
                      ...S.etatLabel,
                      color: relai.etat === 1 ? '#2ed573' : '#ff4757'
                    }}>
                      {relai.etat === 1 ? 'ON' : 'OFF'}
                    </span>
                    <div
                      style={{
                        ...S.toggle,
                        background: relai.etat === 1 ? '#2ed573' : 'rgba(255,255,255,0.1)',
                        cursor: user?.role === 'operateur' ? 'not-allowed' : 'pointer',
                        opacity: user?.role === 'operateur' ? 0.5 : 1,
                      }}
                      onClick={() => user?.role !== 'operateur' && toggle(relai)}
                    >
                      <div style={{
                        ...S.toggleThumb,
                        transform: relai.etat === 1 ? 'translateX(20px)' : 'translateX(2px)',
                      }}/>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Journal */}
        <div style={S.card}>
          <div style={S.cardHead}>
            <span style={S.cardTitle}>JOURNAL DES ACTIONS</span>
          </div>
          {log.length === 0 ? (
            <div style={S.empty}>Aucune action effectuée</div>
          ) : (
            log.map((entry, i) => (
              <div key={i} style={S.logRow}>
                <span style={S.logTime}>{entry.time}</span>
                <span style={S.logNom}>{entry.nom}</span>
                <span style={{
                  ...S.logEtat,
                  color: entry.etat === 'ON' ? '#2ed573' : '#ff4757'
                }}>
                  → {entry.etat}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {user?.role === 'operateur' && (
        <div style={S.warning}>
          ⚠️ Vous n'avez pas les droits pour modifier les relais
        </div>
      )}
    </div>
  );
}

const S = {
  loading:     { color:'#7a8394', textAlign:'center', marginTop:40 },
  metricsRow:  { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:20 },
  mcard:       { background:'#161b22', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, padding:'18px 20px', position:'relative', overflow:'hidden' },
  mcardBar:    { position:'absolute', top:0, left:0, right:0, height:2 },
  mcardLabel:  { fontFamily:'Segoe UI', fontSize:10, color:'#4a5260', letterSpacing:1.5, textTransform:'uppercase', marginBottom:12 },
  mcardVal:    { fontSize:28, fontWeight:600, color:'#e8eaf0', fontFamily:'Segoe UI' },
  grid2:       { display:'grid', gridTemplateColumns:'2fr 1fr', gap:16 },
  card:        { background:'#161b22', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, padding:'20px 22px', marginBottom:16 },
  cardHead:    { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, paddingBottom:12, borderBottom:'1px solid rgba(255,255,255,0.05)' },
  cardTitle:   { fontFamily:'Segoe UI', fontSize:11, color:'#7a8394', letterSpacing:1, textTransform:'uppercase' },
  cardSub:     { fontSize:11, color:'#4a5260', fontFamily:'Segoe UI' },
  relaiRow:    { display:'flex', alignItems:'center', gap:12, padding:'12px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' },
  relaiNom:    { fontSize:13, color:'#e8eaf0', marginBottom:3 },
  relaiCanal:  { fontSize:11, color:'#7a8394', fontFamily:'Segoe UI' },
  toggleGroup: { display:'flex', alignItems:'center', gap:10, flexShrink:0 },
  etatLabel:   { fontFamily:'Segoe UI', fontSize:11, fontWeight:600, width:28 },
  toggle:      { width:44, height:24, borderRadius:12, position:'relative', transition:'background 0.2s', flexShrink:0 },
  toggleThumb: { position:'absolute', top:2, width:20, height:20, borderRadius:'50%', background:'white', transition:'transform 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.3)' },
  logRow:      { display:'flex', alignItems:'center', gap:10, padding:'7px 0', borderBottom:'1px solid rgba(255,255,255,0.04)', fontFamily:'Segoe UI', fontSize:12 },
  logTime:     { color:'#4a5260', flexShrink:0 },
  logNom:      { color:'#e8eaf0', flex:1, fontSize:11 },
  logEtat:     { fontWeight:600, flexShrink:0 },
  empty:       { color:'#4a5260', fontSize:12, textAlign:'center', padding:'20px 0' },
  warning:     { marginTop:16, padding:'10px 16px', background:'rgba(245,166,35,0.08)', border:'1px solid rgba(245,166,35,0.20)', borderRadius:8, color:'#f5a623', fontSize:12, fontFamily:'Segoe UI' },
};