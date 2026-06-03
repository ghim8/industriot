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
import PageSuperAdmin from './sections/PageSuperAdmin';
import { useMqtt } from '../hooks/useMqtt';
import { useSessionTimeout } from '../hooks/useSessionTimeout';
import SessionExpiredModal from '../components/SessionExpiredModal';

// ── Icons ──────────────────────────────────────────────────────
const IconDash    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>;
const IconMachine = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></svg>;
const IconAlerte  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const IconRelais  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/></svg>;
const IconUsers   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const IconHistory = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const IconMenu    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>;
const IconClose   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;

// ── Sidebar ────────────────────────────────────────────────────
function Sidebar({ active, setActive, user, logout, alertCount, onClose, isMobile }) {
  const roleStyle = {
    admin:     { background:'rgba(0,212,170,0.10)',  color:'#00d4aa', border:'1px solid rgba(0,212,170,0.20)' },
    chef:      { background:'rgba(0,153,255,0.10)',  color:'#0099ff', border:'1px solid rgba(0,153,255,0.20)' },
    operateur: { background:'rgba(245,166,35,0.12)', color:'#f5a623', border:'1px solid rgba(245,166,35,0.25)' },
  };

  const navItems = user?.role === 'super_admin' ? [
    { id:'super-admin', label:'Entreprises', icon:<IconUsers /> },
  ] : [
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

  const handleNav = (id) => {
    setActive(id);
    if (isMobile && onClose) onClose();
  };

  return (
    <div style={S.sidebar}>
      {/* Brand */}
      <div style={S.sbBrand}>
        {isMobile && (
          <button onClick={onClose} style={{
            position:'absolute', top:16, right:16,
            background:'none', border:'none',
            color:'#7a8394', cursor:'pointer', padding:4,
          }}>
            <IconClose/>
          </button>
        )}
        <div style={S.sbLogo}>INDUSTRIOT</div>
        <div style={S.sbTitle}>Supervision IoT</div>
        {user?.entreprise?.nom && (
          <div style={{
            marginTop:8, fontSize:11, color:'#00d4aa',
            background:'rgba(0,212,170,0.08)',
            border:'1px solid rgba(0,212,170,0.15)',
            borderRadius:5, padding:'4px 8px', display:'inline-block',
          }}>
            🏢 {user.entreprise.nom}
          </div>
        )}
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
            onClick={() => handleNav(item.id)}
          >
            <span style={S.sbIcon}>{item.icon}</span>
            {item.label}
            {item.badge > 0 && <span style={S.sbBadge}>{item.badge}</span>}
          </div>
        ))}

        {(user?.role === 'admin' || user?.role === 'chef') && (
          <>
            <div style={{...S.sbSection, marginTop:8}}>ADMINISTRATION</div>
            {adminItems.map(item => (
              <div
                key={item.id}
                style={{...S.sbItem, ...(active===item.id ? S.sbItemActive : {})}}
                onClick={() => handleNav(item.id)}
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

// ── Topbar ─────────────────────────────────────────────────────
function Topbar({ title, alertCount, setActive, mqttConnected, user, onMenuClick, isMobile }) {
  const [time, setTime] = useState(new Date().toTimeString().slice(0,8));
  useEffect(() => {
    const t = setInterval(() => setTime(new Date().toTimeString().slice(0,8)), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{...S.topbar, padding: isMobile ? '0 12px' : '0 28px'}}>
      <div style={{display:'flex', alignItems:'center', gap:8}}>
        {/* Burger menu sur mobile */}
        {isMobile && (
          <button onClick={onMenuClick} style={{
            background:'none', border:'none',
            color:'#e8eaf0', cursor:'pointer',
            padding:'4px', display:'flex',
            alignItems:'center', marginRight:4,
          }}>
            <IconMenu/>
          </button>
        )}
        <span style={S.liveDot}/>
        {!isMobile && <span style={S.liveLabel}>LIVE</span>}
        <span style={{...S.pageTitle, fontSize: isMobile ? 13 : 15}}>
          {title}
        </span>
      </div>

      <div style={{display:'flex', alignItems:'center', gap: isMobile ? 6 : 12}}>
        {!isMobile && <span style={S.clock}>{time}</span>}

        {user?.role !== 'super_admin' && (
          <button style={S.notifBtn} onClick={() => setActive('alertes')}>
            🔔
            {alertCount > 0 && <span style={S.notifCount}>{alertCount}</span>}
          </button>
        )}

        {user?.role !== 'super_admin' && (
          <div style={{display:'flex', alignItems:'center', gap:4}}>
            <div style={{
              width:7, height:7, borderRadius:'50%',
              background: mqttConnected ? '#00d4aa' : '#ff4757',
              boxShadow: mqttConnected ? '0 0 6px #00d4aa' : 'none',
            }}/>
            {!isMobile && (
              <span style={{fontSize:10, color: mqttConnected ? '#00d4aa' : '#ff4757'}}>
                {mqttConnected ? 'MQTT LIVE' : 'MQTT OFF'}
              </span>
            )}
          </div>
        )}

        {!isMobile && user?.entreprise?.nom && (
          <div style={{
            fontSize:11, color:'#00d4aa',
            background:'rgba(0,212,170,0.08)',
            border:'1px solid rgba(0,212,170,0.20)',
            borderRadius:6, padding:'4px 10px',
          }}>
            🏢 {user.entreprise.nom}
          </div>
        )}
      </div>
    </div>
  );
}

// ── PAGE TITLES ────────────────────────────────────────────────
const PAGE_TITLES = {
  dashboard:       'Tableau de bord',
  machines:        'Machines',
  alertes:         'Alertes',
  relais:          'Relais & Actionneurs',
  historique:      'Historique des connexions',
  utilisateurs:    'Gestion des utilisateurs',
  chefs:           'Chefs de maintenance',
  operateurs:      'Opérateurs',
  'mes-operateurs':'Mes opérateurs',
  capteurs:        'Capteurs',
  mesures:         'Mesures temps réel',
  'super-admin':   'Entreprises',
};

// ── Dashboard principal ────────────────────────────────────────
export default function Dashboard() {
  const { user, logout } = useAuth();

  const [sessionExpired, setSessionExpired] = useState(false);
  const [sessionWarning, setSessionWarning] = useState(false);
  const [secondsLeft, setSecondsLeft]       = useState(60);

  const { resetTimer } = useSessionTimeout({
    role:      user?.role,
    onExpire:  () => { setSessionWarning(false); setSessionExpired(true); },
    onWarning: (secs) => { setSessionWarning(true); setSecondsLeft(secs); },
  });

  const { connected, mesures } = useMqtt();

  const [active, setActive]           = useState(user?.role === 'super_admin' ? 'super-admin' : 'dashboard');
  const [alertCount, setAlertCount]   = useState(0);
  const [selectedMachineId, setSelectedMachineId] = useState(null);

  // ── Mobile state ──
  const [isMobile, setIsMobile]       = useState(window.innerWidth < 768);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    api.get('/machines').catch(() => {});

    const fetchAlertCount = () => {
      api.get('/alertes').then(r => {
        setAlertCount(r.data.filter(a => !a.acquittee).length);
      }).catch(() => {});
    };

    fetchAlertCount();
    const interval = setInterval(fetchAlertCount, 5000);
    return () => clearInterval(interval);
  }, []);

  const renderPage = () => {
    switch(active) {
      case 'dashboard':      return <PageDashboard mqttMesures={mesures} setActive={setActive} setSelectedMachineId={setSelectedMachineId}/>;
      case 'machines':       return <PageMachines mesures={mesures}/>;
      case 'alertes':        return <PageAlertes/>;
      case 'relais':         return <PageRelais/>;
      case 'historique':     return <PageHistorique/>;
      case 'utilisateurs':   return <PageUtilisateurs/>;
      case 'super-admin':    return <PageSuperAdmin/>;
      case 'chefs':          return <PageChefs/>;
      case 'operateurs':     return <PageOperateurs/>;
      case 'mes-operateurs': return <PageMesOperateurs/>;
      case 'capteurs':       return <PageCapteurs/>;
      case 'mesures':        return <PageMesures mesures={mesures} defaultMachineId={selectedMachineId}/>;
      default:               return <PageDashboard mqttMesures={mesures} setActive={setActive} setSelectedMachineId={setSelectedMachineId}/>;
    }
  };

  return (
    <div style={S.app}>
      <SessionExpiredModal
        expired={sessionExpired}
        warning={sessionWarning}
        secondsLeft={secondsLeft}
        onExpire={() => { setSessionWarning(false); setSessionExpired(true); }}
        onContinue={() => { setSessionWarning(false); resetTimer(); }}
        onLogout={() => {
          setSessionExpired(false);
          setSessionWarning(false);
          localStorage.removeItem('lastActivity');
          localStorage.removeItem('activePage');
          logout();
        }}
      />

      {/* ── Sidebar desktop ── */}
      {!isMobile && (
        <Sidebar
          active={active}
          setActive={setActive}
          user={user}
          logout={logout}
          alertCount={alertCount}
          isMobile={false}
        />
      )}

      {/* ── Sidebar mobile (drawer) ── */}
      {isMobile && sidebarOpen && (
        <>
          {/* Overlay */}
          <div
            onClick={() => setSidebarOpen(false)}
            style={{
              position:'fixed', inset:0,
              background:'rgba(0,0,0,0.65)',
              zIndex:200,
            }}
          />
          {/* Drawer */}
          <div style={{
            ...S.sidebar,
            position:'fixed',
            top:0, left:0, bottom:0,
            zIndex:201,
            boxShadow:'6px 0 24px rgba(0,0,0,0.6)',
            animation:'slideIn 0.2s ease',
          }}>
            <Sidebar
              active={active}
              setActive={setActive}
              user={user}
              logout={logout}
              alertCount={alertCount}
              isMobile={true}
              onClose={() => setSidebarOpen(false)}
            />
          </div>
        </>
      )}

      {/* ── Main ── */}
      <div style={S.main}>
        <Topbar
          title={PAGE_TITLES[active]}
          alertCount={alertCount}
          setActive={setActive}
          mqttConnected={connected}
          user={user}
          isMobile={isMobile}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <div style={{
          ...S.content,
          padding: isMobile ? '14px 12px' : '24px 28px',
        }}>
          {renderPage()}
        </div>
      </div>

      {/* ── Animation CSS ── */}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(-100%); }
          to   { transform: translateX(0); }
        }
        * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
      `}</style>
    </div>
  );
}

// ── Styles ──────────────────────────────────────────────────────
const S = {
  app:             { display:'flex', height:'100vh', background:'#1c2129', fontFamily:"'IBM Plex Sans', sans-serif", color:'#e8eaf0', overflow:'hidden', WebkitOverflowScrolling:'touch' },
  sidebar:         { width:230, background:'#161b22', borderRight:'1px solid rgba(255,255,255,0.07)', display:'flex', flexDirection:'column', flexShrink:0, position:'relative' },
  sbBrand:         { padding:'22px 20px 18px', borderBottom:'1px solid rgba(255,255,255,0.07)', position:'relative' },
  sbLogo:          { fontFamily:'monospace', fontSize:10, color:'#00d4aa', letterSpacing:3, marginBottom:5 },
  sbTitle:         { fontSize:16, fontWeight:600, color:'#e8eaf0' },
  sbRole:          { display:'inline-block', marginTop:8, fontSize:10, fontFamily:'monospace', padding:'3px 8px', borderRadius:4, letterSpacing:0.5 },
  sbNav:           { flex:1, padding:'12px 0', overflowY:'auto' },
  sbSection:       { fontFamily:'monospace', fontSize:9, color:'#4a5260', letterSpacing:2, textTransform:'uppercase', padding:'14px 20px 6px' },
  sbItem:          { display:'flex', alignItems:'center', gap:10, padding:'10px 20px', color:'#7a8394', cursor:'pointer', borderLeft:'2px solid transparent', fontSize:13, transition:'all 0.15s' },
  sbItemActive:    { color:'#00d4aa', background:'rgba(0,212,170,0.06)', borderLeft:'2px solid #00d4aa' },
  sbIcon:          { width:15, height:15, display:'flex', alignItems:'center', flexShrink:0 },
  sbBadge:         { marginLeft:'auto', background:'#ff4757', color:'white', fontSize:9, padding:'1px 5px', borderRadius:10 },
  sbUserSection:   { padding:'16px', borderTop:'1px solid rgba(255,255,255,0.07)' },
  sbUserCard:      { display:'flex', alignItems:'center', gap:10, marginBottom:12 },
  sbUserAvatar:    { width:36, height:36, borderRadius:'50%', background:'rgba(0,212,170,0.12)', border:'1px solid rgba(0,212,170,0.25)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, color:'#00d4aa', flexShrink:0, fontWeight:700 },
  sbUserName:      { fontSize:13, fontWeight:600, color:'#e8eaf0', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' },
  sbUserEmail:     { fontSize:11, color:'#4a5260', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', marginTop:2 },
  sbUserRoleBadge: { display:'inline-block', marginTop:5, fontSize:9, color:'#00d4aa', background:'rgba(0,212,170,0.08)', border:'1px solid rgba(0,212,170,0.15)', borderRadius:3, padding:'2px 7px', letterSpacing:1 },
  sbLogout:        { width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'9px', background:'rgba(255,71,87,0.06)', border:'1px solid rgba(255,71,87,0.12)', borderRadius:8, color:'#ff4757', fontSize:12, cursor:'pointer', transition:'all 0.15s' },
  topbar:          { background:'#161b22', borderBottom:'1px solid rgba(255,255,255,0.07)', height:56, display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 },
  liveDot:         { width:7, height:7, borderRadius:'50%', background:'#2ed573', boxShadow:'0 0 6px #2ed573', display:'inline-block', flexShrink:0 },
  liveLabel:       { fontFamily:'monospace', fontSize:10, color:'#2ed573' },
  pageTitle:       { fontWeight:600, color:'#e8eaf0' },
  clock:           { fontFamily:'monospace', fontSize:12, color:'#7a8394' },
  notifBtn:        { position:'relative', background:'none', border:'1px solid rgba(255,255,255,0.12)', borderRadius:7, padding:'6px 8px', cursor:'pointer', fontSize:14 },
  notifCount:      { position:'absolute', top:-4, right:-4, background:'#ff4757', color:'white', fontSize:9, width:15, height:15, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center' },
  main:            { flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 },
  content:         { flex:1, overflowY:'auto', overflowX:'hidden' },
};