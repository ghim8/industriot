import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import PageMachines from './sections/PageMachines';
import PageUtilisateurs from './sections/PageUtilisateurs';
import PageDashboard from './sections/PageDashboard';
import PageHistorique from './sections/PageHistorique';
import PageChefs from './sections/PageChefs';
import PageOperateurs from './sections/PageOperateurs';
import PageMesOperateurs from './sections/PageMesOperateurs';
import PageRelais from './sections/PageRelais';
import PageAlertes from './sections/PageAlertes';
import PageCapteurs from './sections/PageCapteurs';
import PageMesures from './sections/PageMesures';
import { useMqtt } from '../hooks/useMqtt';


// ── Icons SVG inline ──────────────────────────────────────────
const IconDash    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>;
const IconMachine = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></svg>;
const IconAlerte  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const IconRelais  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/></svg>;
const IconUsers   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const IconHistory = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const IconLogout  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;

// ── Sidebar ───────────────────────────────────────────────────
function Sidebar({ active, setActive, user, logout, alertCount }) {
  const roleStyle = {
    admin:    { background:'rgba(0,212,170,0.10)',  color:'#00d4aa', border:'1px solid rgba(0,212,170,0.20)' },
    chef:     { background:'rgba(0,153,255,0.10)',  color:'#0099ff', border:'1px solid rgba(0,153,255,0.20)' },
    operateur:{ background:'rgba(245,166,35,0.12)', color:'#f5a623', border:'1px solid rgba(245,166,35,0.25)' },
  };

  const navItems = [
  { id:'dashboard', label:'Tableau de bord', icon:<IconDash /> },
  { id:'machines',  label:'Machines',        icon:<IconMachine /> },
  { id:'alertes',   label:'Alertes',         icon:<IconAlerte />, badge: alertCount },
  { id:'relais',    label:'Relais',          icon:<IconRelais /> },
  { id:'capteurs',  label:'Capteurs',        icon:<IconRelais /> },
  { id:'mesures',   label:'Mesures',         icon:<IconDash /> },
  ...(user?.role !== 'operateur' ? [
    { id:'historique', label:'Connexions', icon:<IconHistory /> }
  ] : []),
];

  const adminItems = user?.role === 'admin' ? [
  { id:'chefs',        label:'Chefs maintenance', icon:<IconUsers /> },
  { id:'operateurs',   label:'Opérateurs',        icon:<IconUsers /> },
  { id:'utilisateurs', label:'Tous les comptes',  icon:<IconUsers /> },
] : user?.role === 'chef' ? [
  { id:'mes-operateurs', label:'Mes opérateurs', icon:<IconUsers /> },
] : [];
  return (
    <div style={S.sidebar}>
      {/* Brand */}
      <div style={S.sbBrand}>
        <div style={S.sbLogo}>INDUSTRIOT</div>
        <div style={S.sbTitle}>Supervision IoT</div>
        <span style={{...S.sbRole, ...roleStyle[user?.role]}}>
          {user?.role?.toUpperCase()}
        </span>
      </div>

      {/* Nav */}
      <nav style={S.sbNav}>
        <div style={S.sbSection}>SUPERVISION</div>
        {navItems.map(item => (
          <div
            key={item.id}
            style={{...S.sbItem, ...(active===item.id ? S.sbItemActive : {})}}
            onClick={() => setActive(item.id)}
          >
            <span style={S.sbIcon}>{item.icon}</span>
            {item.label}
            {item.badge > 0 && <span style={S.sbBadge}>{item.badge}</span>}
          </div>
        ))}

        {/* Section admin */}
        {(user?.role === 'admin' || user?.role === 'chef') && (
          <>
            <div style={{...S.sbSection, marginTop:8}}>ADMINISTRATION</div>
            {adminItems.map(item => (
              <div
                key={item.id}
                style={{...S.sbItem, ...(active===item.id ? S.sbItemActive : {})}}
                onClick={() => setActive(item.id)}
              >
                <span style={S.sbIcon}>{item.icon}</span>
                {item.label}
              </div>
            ))}
          </>
        )}
      </nav>

      {/* User */}
<div style={S.sbUserSection}>
  <div style={S.sbUserCard}>
    <div style={S.sbUserAvatar}>{user?.initiales}</div>
    <div style={{flex:1, minWidth:0}}>
      <div style={S.sbUserName}>{user?.nom}</div>
      <div style={S.sbUserEmail}>{user?.email}</div>
      <div style={S.sbUserRoleBadge}>{user?.role?.toUpperCase()}</div>
    </div>
  </div>
  <button style={S.sbLogout} onClick={logout}>
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
    Déconnexion
  </button>
</div>
    </div>
  );
}

// ── Topbar ────────────────────────────────────────────────────
function Topbar({ title, alertCount, setActive, mqttConnected }) {  const [time, setTime] = useState(new Date().toTimeString().slice(0,8));
  useEffect(() => {
    const t = setInterval(() => setTime(new Date().toTimeString().slice(0,8)), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={S.topbar}>
      <div style={{display:'flex', alignItems:'center', gap:12}}>
        <span style={S.liveDot}/>
        <span style={S.liveLabel}>LIVE</span>
        <span style={S.pageTitle}>{title}</span>
      </div>
      <div style={{display:'flex', alignItems:'center', gap:12}}>
        <span style={S.clock}>{time}</span>
        <button style={S.notifBtn} onClick={() => setActive('alertes')}>
          🔔
          {alertCount > 0 && <span style={S.notifCount}>{alertCount}</span>}
        </button>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
  <div style={{
    width:7, height:7, borderRadius:'50%',
    background: mqttConnected ? '#00d4aa' : '#ff4757',
    boxShadow:  mqttConnected ? '0 0 6px #00d4aa' : 'none',
  }}/>
  <span style={{ fontFamily:'Segoe UI', fontSize:10, color: mqttConnected ? '#00d4aa' : '#ff4757' }}>
    {mqttConnected ? 'MQTT LIVE' : 'MQTT OFF'}
  </span>
</div>
    </div>
  );
}

// ── Pages placeholder ─────────────────────────────────────────
const PAGE_TITLES = {
  dashboard:    'Tableau de bord',
  machines:     'Machines',
  alertes:      'Alertes',
  relais:       'Relais & Actionneurs',
  historique: 'Historique des connexions',
  utilisateurs: 'Gestion des utilisateurs',
  'chefs':          'Chefs de maintenance',
'operateurs':     'Opérateurs',
'mes-operateurs': 'Mes opérateurs',
capteurs: 'Capteurs',
mesures: 'Mesures temps réel',
};

// ── Dashboard principal ───────────────────────────────────────
export default function Dashboard() {
  const { user, logout } = useAuth();
  const { connected, mesures } = useMqtt();
  const [active, setActive]   = useState('dashboard');
  const [machines, setMachines] = useState([]);
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    api.get('/machines').then(r => setMachines(r.data));
    api.get('/alertes').then(r => {
      setAlertCount(r.data.filter(a => !a.acquittee).length);
    });
  }, []);

  const renderPage = () => {
    switch(active) {
      case 'dashboard':      return <PageDashboard mesures={mesures} />;
      case 'machines': return <PageMachines mesures={mesures} />;
      case 'alertes':        return <PageAlertes />;
      case 'relais':         return <PageRelais />;
      case 'historique':     return <PageHistorique />;
      case 'utilisateurs':   return <PageUtilisateurs />;
      case 'chefs':          return <PageChefs />;
      case 'operateurs':     return <PageOperateurs />;
      case 'mes-operateurs': return <PageMesOperateurs />;
      case 'capteurs':       return <PageCapteurs />;
      case 'mesures':        return <PageMesures mesures={mesures} />;
      default:               return <PageDashboard mesures={mesures} />;
    }
  };

  return (
    <div style={S.app}>
      <Sidebar
        active={active}
        setActive={setActive}
        user={user}
        logout={logout}
        alertCount={alertCount}
      />
      <div style={S.main}>
       <Topbar
          title={PAGE_TITLES[active]}
          alertCount={alertCount}
          setActive={setActive}
          mqttConnected={connected}
        />
        <div style={S.content}>
          {renderPage()}
        </div>
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────
const S = {
  app:          { display:'flex', height:'100vh', background:'#1c2129', fontFamily:"'IBM Plex Sans', sans-serif", color:'#e8eaf0', overflow:'hidden' },
  // Sidebar
  sidebar:      { width:230, background:'#161b22', borderRight:'1px solid rgba(255,255,255,0.07)', display:'flex', flexDirection:'column', flexShrink:0 },
  sbBrand:      { padding:'22px 20px 18px', borderBottom:'1px solid rgba(255,255,255,0.07)' },
  sbLogo:       { fontFamily:'Segoe UI', fontSize:10, color:'#00d4aa', letterSpacing:3, marginBottom:5 },
  sbTitle:      { fontSize:16, fontWeight:600, color:'#e8eaf0' },
  sbRole:       { display:'inline-block', marginTop:8, fontSize:10, fontFamily:'Segoe UI', padding:'3px 8px', borderRadius:4, letterSpacing:0.5 },
  sbNav:        { flex:1, padding:'12px 0', overflowY:'auto' },
  sbSection:    { fontFamily:'Segoe UI', fontSize:9, color:'#4a5260', letterSpacing:2, textTransform:'uppercase', padding:'14px 20px 6px' },
  sbItem:       { display:'flex', alignItems:'center', gap:10, padding:'9px 20px', color:'#7a8394', cursor:'pointer', borderLeft:'2px solid transparent', fontSize:13, transition:'all 0.15s' },
  sbItemActive: { color:'#00d4aa', background:'rgba(0,212,170,0.06)', borderLeft:'2px solid #00d4aa' },
  sbIcon:       { width:15, height:15, display:'flex', alignItems:'center', flexShrink:0 },
  sbBadge:      { marginLeft:'auto', background:'#ff4757', color:'white', fontSize:9, fontFamily:'Segoe UI', padding:'1px 5px', borderRadius:10 },
  sbUserSection:   { padding:'16px', borderTop:'1px solid rgba(255,255,255,0.07)' },
sbUserCard:      { display:'flex', alignItems:'center', gap:10, marginBottom:12 },
sbUserAvatar:    { width:36, height:36, borderRadius:'50%', background:'rgba(0,212,170,0.12)', border:'1px solid rgba(0,212,170,0.25)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, color:'#00d4aa', flexShrink:0, fontWeight:700 },
sbUserName:      { fontSize:13, fontWeight:600, color:'#e8eaf0', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' },
sbUserEmail:     { fontSize:11, color:'#4a5260', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', marginTop:2 },
sbUserRoleBadge: { display:'inline-block', marginTop:5, fontSize:9, color:'#00d4aa', background:'rgba(0,212,170,0.08)', border:'1px solid rgba(0,212,170,0.15)', borderRadius:3, padding:'2px 7px', letterSpacing:1 },
sbLogout:        { width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'9px', background:'rgba(255,71,87,0.06)', border:'1px solid rgba(255,71,87,0.12)', borderRadius:8, color:'#ff4757', fontSize:12, cursor:'pointer', transition:'all 0.15s' },
  topbar:       { background:'#161b22', borderBottom:'1px solid rgba(255,255,255,0.07)', padding:'0 28px', height:56, display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 },
  liveDot:      { width:7, height:7, borderRadius:'50%', background:'#2ed573', boxShadow:'0 0 6px #2ed573', display:'inline-block' },
  liveLabel:    { fontFamily:'Segoe UI', fontSize:10, color:'#2ed573' },
  pageTitle:    { fontSize:15, fontWeight:600, color:'#e8eaf0' },
  clock:        { fontFamily:'Segoe UI', fontSize:12, color:'#7a8394' },
  notifBtn:     { position:'relative', background:'none', border:'1px solid rgba(255,255,255,0.12)', borderRadius:7, padding:'6px 8px', cursor:'pointer', fontSize:14 },
  notifCount:   { position:'absolute', top:-4, right:-4, background:'#ff4757', color:'white', fontSize:9, fontFamily:'Segoe UI', width:15, height:15, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center' },
  // Content
  main:         { flex:1, display:'flex', flexDirection:'column', overflow:'hidden' },
  content:      { flex:1, overflowY:'auto', padding:'24px 28px' },
  placeholder:  { color:'#7a8394', fontSize:14, marginTop:40, textAlign:'center' },
  // Machines
  grid3:        { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 },
  mcard:        { background:'#161b22', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, padding:'18px 20px', position:'relative', overflow:'hidden' },
  mcardBar:     { position:'absolute', top:0, left:0, right:0, height:2 },
  mcardLabel:   { fontFamily:'Segoe UI', fontSize:10, color:'#4a5260', letterSpacing:1, marginBottom:8, textTransform:'uppercase' },
  mcardName:    { fontSize:15, fontWeight:600, color:'#e8eaf0', marginBottom:12 },
  badge:        { display:'inline-flex', fontFamily:'Segoe UI', fontSize:10, padding:'3px 8px', borderRadius:4 },
  badgeOk:      { background:'rgba(46,213,115,0.15)', color:'#2ed573' },
  badgeErr:     { background:'rgba(255,71,87,0.15)',  color:'#ff4757' },
};