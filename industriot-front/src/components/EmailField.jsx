import React, { useState } from 'react';
import api from '../api/axios';

export default function EmailField({ value, onChange, slug, style }) {
  const [checking, setChecking]   = useState(false);
  const [available, setAvailable] = useState(null);
  const domain = `@${slug}.local`;

  const handleChange = async (e) => {
    const raw = e.target.value;
    onChange(raw);
    setAvailable(null);

    // Vérifier uniquement la partie avant @
    const local = raw.split('@')[0];
    if (!local || local.length < 2) return;

    const fullEmail = `${local}${domain}`;
    setChecking(true);
    try {
      const res = await api.get(`/check-email?email=${fullEmail}`);
      setAvailable(res.data.available);
    } catch {
      setAvailable(null);
    } finally {
      setChecking(false);
    }
  };

  // Séparer partie locale et domaine
  const local  = value.split('@')[0] || '';
  const border = available === false
    ? 'rgba(255,71,87,0.50)'
    : available === true
      ? 'rgba(46,213,115,0.50)'
      : 'rgba(255,255,255,0.12)';

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:0 }}>
        {/* Partie locale — modifiable */}
        <input
          style={{
            ...style,
            flex: 1,
            borderRadius:'7px 0 0 7px',
            borderRight: 'none',
            borderColor: border,
          }}
          value={local}
          onChange={handleChange}
          placeholder="p.nom"
        />
        {/* Domaine — fixe */}
        <div style={{
          padding:'10px 12px',
          background:'rgba(0,212,170,0.06)',
          border:`1px solid ${border}`,
          borderLeft:'none',
          borderRadius:'0 7px 7px 0',
          color:'#00d4aa',
          fontSize:13,
          whiteSpace:'nowrap',
          userSelect:'none',
        }}>
          @{slug}.local
        </div>
      </div>

      {/* Indicateur disponibilité */}
      <div style={{ fontSize:11, marginTop:4, height:16 }}>
        {checking && <span style={{color:'#7a8394'}}>Vérification...</span>}
        {!checking && available === true  && <span style={{color:'#2ed573'}}>✓ Email disponible</span>}
        {!checking && available === false && <span style={{color:'#ff4757'}}>✗ Email déjà utilisé</span>}
      </div>
    </div>
  );
}