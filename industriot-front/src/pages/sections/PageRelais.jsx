import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

export default function PageRelais() {
  const { user } = useAuth();
  const [relais, setRelais]             = useState([]);
  const [journal, setJournal]           = useState([]);
  const [confirmVider, setConfirmVider] = useState(false);
  const [loading, setLoading]           = useState(true);
  const [filtreEtat, setFiltreEtat]     = useState('TOUS');
  const [filtreMachine, setFiltreMachine] = useState('TOUTES');
  const [filtreUser, setFiltreUser]     = useState('TOUS');
  const [machines, setMachines]         = useState([]);
  const [users, setUsers]               = useState([]);
  const [showFiltres, setShowFiltres]   = useState(false);
  const [filtreDate, setFiltreDate]     = useState('');

  useEffect(() => {
    fetchRelais();
    fetchJournal();
  }, []);

  const fetchRelais = () => {
    api.get('/relais').then(r => {
      setRelais(r.data);
      setLoading(false);
    });
  };

  const fetchJournal = useCallback(() => {
    api.get('/relais/journal').then(r => {
      setJournal(r.data);
      const ms = [...new Map(r.data.filter(j => j.machine_nom)
        .map(j => [j.machine_nom, j.machine_nom])).values()];
      const us = [...new Map(r.data.filter(j => j.utilisateur_nom)
        .map(j => [j.utilisateur_nom, j.utilisateur_nom])).values()];
      setMachines(ms);
      setUsers(us);
    });
  }, []);

  const toggle = async (relai) => {
    const nouvelEtat = relai.etat === 1 ? 0 : 1;
    setRelais(prev => prev.map(r =>
      r.id === relai.id ? { ...r, etat: nouvelEtat } : r
    ));
    try {
      await api.put(`/relais/${relai.id}`, {
        etat: nouvelEtat,
        utilisateur_id: user?.id,
      });
      fetchJournal();
    } catch(e) {
      setRelais(prev => prev.map(r =>
        r.id === relai.id ? { ...r, etat: relai.etat } : r
      ));
      alert('Erreur — action annulée');
    }
  };

  const viderJournal = async () => {
    const ids = journal.map(j => j.id);
    if (!ids.length) return;
    try {
      await api.post('/journal-relais/supprimer-selection', { ids });
      setJournal([]);
      setConfirmVider(false);
    } catch(e) {
      alert('Erreur lors de la suppression');
    }
  };

  const journalFiltre = journal.filter(j => {
    if (filtreEtat !== 'TOUS' && (j.nouvel_etat ? 'ON' : 'OFF') !== filtreEtat) return false;
    if (filtreMachine !== 'TOUTES' && j.machine_nom !== filtreMachine) return false;
    if (filtreUser !== 'TOUS' && j.utilisateur_nom !== filtreUser) return false;
    if (filtreDate) {
      const dateAction = new Date(j.horodatage).toISOString().slice(0,10);
      if (dateAction !== filtreDate) return false;
    }
    return true;
  });

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
      {/* ── Modal confirmation vider ── */}
      {confirmVider && (
        <div style={S.overlay}>
          <div style={S.confirmModal}>
            <div style={S.confirmIcon}>🗑</div>
            <div style={S.confirmTitle}>Vider l'historique ?</div>
            <div style={S.confirmSub}>
              Cette action supprimera définitivement les{' '}
              <strong style={{color:'#e8eaf0'}}>{journal.length}</strong> entrée(s) du journal.
            </div>
            <div style={S.confirmBtns}>
              <button style={S.btnAnnuler} onClick={() => setConfirmVider(false)}>
                Annuler
              </button>
              <button style={S.btnConfirmer} onClick={viderJournal}>
                Confirmer la suppression
              </button>
            </div>
          </div>
        </div>
      )}

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
        <div style={S.mcard}>
          <div style={{...S.mcardBar, background:'#f5a623'}}/>
          <div style={S.mcardLabel}>ACTIONS TOTALES</div>
          <div style={S.mcardVal}>{journal.length}</div>
        </div>
      </div>

      <div style={S.grid2}>
        {/* Relais groupés par machine */}
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
                    {relai.actionneur?.nom && (
                      <div style={S.relaiActionneur}>
                        <span>{relai.actionneur.nom}</span>
                        <span style={S.relaiActTypePill}>{relai.actionneur.type}</span>
                      </div>
                    )}
                    {relai.canal && <div style={S.relaiCanal}>{relai.canal}</div>}
                  </div>
                  <div style={S.toggleGroup}>
                    <span style={{...S.etatLabel, color: relai.etat === 1 ? '#2ed573' : '#ff4757'}}>
                      {relai.etat === 1 ? 'ON' : 'OFF'}
                    </span>
                    <div
                      style={{...S.toggle, background: relai.etat === 1 ? '#2ed573' : 'rgba(255,255,255,0.1)'}}
                      onClick={() => toggle(relai)}
                    >
                      <div style={{...S.toggleThumb, transform: relai.etat === 1 ? 'translateX(20px)' : 'translateX(2px)'}}/>
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
            <div style={{display:'flex', gap:6}}>
              <button style={S.btnRefresh} onClick={fetchJournal}>↺</button>
              <button style={{...S.btnRefresh, color:'#ff4757', borderColor:'rgba(255,71,87,0.18)', background:'rgba(255,71,87,0.08)'}}
                onClick={() => setConfirmVider(true)}>
                🗑 Vider
              </button>
              <button style={{...S.btnRefresh, color:'#f5a623', borderColor:'rgba(245,166,35,0.18)', background:'rgba(245,166,35,0.08)'}}
                onClick={() => setShowFiltres(!showFiltres)}>
                ⚙ Filtres {(filtreEtat !== 'TOUS' || filtreMachine !== 'TOUTES' || filtreUser !== 'TOUS' || filtreDate) ? '●' : ''}
              </button>
            </div>
          </div>

          {showFiltres && (
            <div style={S.filtrePopup}>
              <div style={S.filtrePopupHead}>
                <span style={{fontSize:12, fontWeight:600, color:'#e8eaf0'}}>Filtres</span>
                <button style={S.filtreClose} onClick={() => setShowFiltres(false)}>✕</button>
              </div>
              <Field label="ÉTAT">
                <select style={S.select} value={filtreEtat} onChange={e => setFiltreEtat(e.target.value)}>
                  <option value="TOUS">Tous</option>
                  <option value="ON">ON</option>
                  <option value="OFF">OFF</option>
                </select>
              </Field>
              <Field label="MACHINE">
                <select style={S.select} value={filtreMachine} onChange={e => setFiltreMachine(e.target.value)}>
                  <option value="TOUTES">Toutes</option>
                  {machines.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </Field>
              {user?.role !== 'operateur' && (
                <Field label="UTILISATEUR">
                  <select style={S.select} value={filtreUser} onChange={e => setFiltreUser(e.target.value)}>
                    <option value="TOUS">Tous</option>
                    {users.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </Field>
              )}
              <Field label="DATE">
                <input style={S.select} type="date" value={filtreDate}
                  onChange={e => setFiltreDate(e.target.value)}/>
              </Field>
              <button style={{...S.btnRefresh, width:'100%', justifyContent:'center', marginTop:8}}
                onClick={() => { setFiltreEtat('TOUS'); setFiltreMachine('TOUTES'); setFiltreUser('TOUS'); setFiltreDate(''); }}>
                Réinitialiser
              </button>
            </div>
          )}

          <div style={S.compteur}>
            {journalFiltre.length} action(s) · {journal.length} total
          </div>

          <div style={S.logScroll}>
            {journalFiltre.length === 0 ? (
              <div style={S.empty}>Aucune action trouvée</div>
            ) : (
              journalFiltre.map((entry, i) => (
                <div key={entry.id || i} style={S.logRow}>
                  <div style={S.logAvatar}>{entry.utilisateur_initiales || 'SY'}</div>
                  <div style={{flex:1, minWidth:0}}>
                    <div style={S.logUser}>
                      <span style={S.logUserNom}>{entry.utilisateur_nom}</span>
                      <span style={S.logTime}>{new Date(entry.horodatage).toLocaleString('fr-FR')}</span>
                    </div>
                    <div style={S.logMachine}>
                      {entry.machine_nom}
                      {entry.actionneur_nom && <span style={S.logActTag}>⚙ {entry.actionneur_nom}</span>}
                    </div>
                    <div style={S.logRelais}>
                      <span style={S.logNom}>{entry.relais_nom}</span>
                      <span style={{...S.logEtatPetit, color:'#4a5260'}}>{entry.ancien_etat ? 'ON' : 'OFF'}</span>
                      <span style={{color:'#4a5260', fontSize:10}}>→</span>
                      <span style={{...S.logEtatPetit, color: entry.nouvel_etat ? '#2ed573' : '#ff4757'}}>
                        {entry.nouvel_etat ? 'ON' : 'OFF'}
                      </span>
                    </div>
                  </div>
                  <span style={{
                    ...S.logEtat,
                    color:       entry.nouvel_etat ? '#2ed573' : '#ff4757',
                    background:  entry.nouvel_etat ? 'rgba(46,213,115,0.10)' : 'rgba(255,71,87,0.10)',
                    borderColor: entry.nouvel_etat ? 'rgba(46,213,115,0.25)' : 'rgba(255,71,87,0.25)',
                  }}>
                    {entry.nouvel_etat ? 'ON' : 'OFF'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom:10 }}>
      <label style={{ display:'block', fontSize:10, color:'#4a5260', letterSpacing:1, marginBottom:5 }}>{label}</label>
      {children}
    </div>
  );
}

const S = {
  loading:          { color:'#7a8394', textAlign:'center', marginTop:40 },
  metricsRow:       { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20 },
  mcard:            { background:'#161b22', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, padding:'18px 20px', position:'relative', overflow:'hidden' },
  mcardBar:         { position:'absolute', top:0, left:0, right:0, height:2 },
  mcardLabel:       { fontSize:10, color:'#4a5260', letterSpacing:1.5, textTransform:'uppercase', marginBottom:12 },
  mcardVal:         { fontSize:28, fontWeight:600, color:'#e8eaf0' },
  grid2:            { display:'grid', gridTemplateColumns:window.innerWidth < 768 ? '1fr' : '2fr 1fr',gap:16 },
  card:             { background:'#161b22', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, padding:'20px 22px', marginBottom:16 },
  cardHead:         { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, paddingBottom:12, borderBottom:'1px solid rgba(255,255,255,0.05)' },
  cardTitle:        { fontSize:11, color:'#7a8394', letterSpacing:1, textTransform:'uppercase' },
  cardSub:          { fontSize:11, color:'#4a5260' },
  relaiRow:         { display:'flex', alignItems:'center', gap:12, padding:'12px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' },
  relaiNom:         { fontSize:13, color:'#e8eaf0', marginBottom:3, fontWeight:500 },
  relaiActionneur:  { display:'flex', alignItems:'center', gap:5, fontSize:11, color:'#7a8394', marginBottom:2 },
  relaiActTypePill: { fontSize:9, color:'#4a5260', background:'rgba(255,255,255,0.05)', borderRadius:3, padding:'1px 5px' },
  relaiCanal:       { fontSize:11, color:'#4a5260' },
  toggleGroup:      { display:'flex', alignItems:'center', gap:10, flexShrink:0 },
  etatLabel:        { fontSize:11, fontWeight:600, width:28 },
  toggle:           { width:44, height:24, borderRadius:12, position:'relative', transition:'background 0.2s', flexShrink:0, cursor:'pointer' },
  toggleThumb:      { position:'absolute', top:2, width:20, height:20, borderRadius:'50%', background:'white', transition:'transform 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.3)' },
  select:           { padding:'5px 8px', background:'#1c2129', border:'1px solid rgba(255,255,255,0.10)', borderRadius:6, color:'#e8eaf0', fontSize:11, cursor:'pointer', outline:'none', flex:1 },
  compteur:         { fontSize:11, color:'#4a5260', marginBottom:10 },
  logRow:           { display:'flex', alignItems:'flex-start', gap:8, padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' },
  logAvatar:        { width:28, height:28, borderRadius:'50%', background:'rgba(0,212,170,0.12)', border:'1px solid rgba(0,212,170,0.20)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:'#00d4aa', flexShrink:0, fontWeight:700 },
  logUser:          { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:3 },
  logUserNom:       { fontSize:12, fontWeight:600, color:'#e8eaf0' },
  logTime:          { fontSize:10, color:'#4a5260' },
  logMachine:       { display:'flex', alignItems:'center', gap:4, fontSize:10, color:'#4a5260', marginBottom:3 },
  logActTag:        { fontSize:10, color:'#7a8394', background:'rgba(255,255,255,0.05)', borderRadius:4, padding:'1px 6px', marginLeft:4 },
  logRelais:        { display:'flex', alignItems:'center', gap:5 },
  logNom:           { fontSize:11, color:'#e8eaf0', fontWeight:500 },
  logEtatPetit:     { fontSize:10, fontWeight:600 },
  logEtat:          { fontSize:10, fontWeight:700, flexShrink:0, padding:'2px 8px', borderRadius:4, border:'1px solid', letterSpacing:0.5 },
  btnRefresh:       { fontSize:10, color:'#00d4aa', background:'rgba(0,212,170,0.08)', border:'1px solid rgba(0,212,170,0.18)', borderRadius:5, padding:'4px 10px', cursor:'pointer' },
  empty:            { color:'#4a5260', fontSize:12, textAlign:'center', padding:'20px 0' },
  logScroll:        { maxHeight:420, overflowY:'auto', paddingRight:4 },
  filtrePopup:      { position:'relative', background:'#1c2129', border:'1px solid rgba(255,255,255,0.12)', borderRadius:10, padding:'14px 16px', marginBottom:12, zIndex:10 },
  filtrePopupHead:  { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 },
  filtreClose:      { background:'none', border:'none', color:'#7a8394', fontSize:14, cursor:'pointer' },
  overlay:          { position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 },
  confirmModal:     { background:'#161b22', border:'1px solid rgba(255,255,255,0.12)', borderRadius:12, padding:'32px', width:380, maxWidth:'90vw', textAlign:'center' },
  confirmIcon:      { fontSize:36, marginBottom:14 },
  confirmTitle:     { fontSize:16, fontWeight:600, color:'#e8eaf0', marginBottom:8 },
  confirmSub:       { fontSize:13, color:'#7a8394', lineHeight:1.6, marginBottom:24 },
  confirmBtns:      { display:'flex', gap:10, justifyContent:'center' },
  btnAnnuler:       { padding:'9px 20px', background:'transparent', border:'1px solid rgba(255,255,255,0.12)', borderRadius:7, color:'#7a8394', fontSize:13, cursor:'pointer' },
  btnConfirmer:     { padding:'9px 20px', background:'rgba(255,71,87,0.15)', border:'1px solid rgba(255,71,87,0.30)', borderRadius:7, color:'#ff4757', fontSize:13, fontWeight:600, cursor:'pointer' },
};