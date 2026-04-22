import React, { useState, useRef, useEffect } from 'react';

export default function CustomSelect({ value, onChange, options, placeholder = '— Choisir —' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const selected = options.find(o => String(o.value) === String(value));

  return (
    <div ref={ref} style={S.wrap}>
      <div style={{...S.trigger, ...(open ? S.triggerOpen : {})}} onClick={() => setOpen(!open)}>
        <span style={{color: selected ? '#e8eaf0' : '#4a5260'}}>
          {selected ? selected.label : placeholder}
        </span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7a8394" strokeWidth="2"
          style={{transform: open ? 'rotate(180deg)' : 'rotate(0)', transition:'transform 0.2s', flexShrink:0}}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>
      {open && (
        <div style={S.dropdown}>
          {options.map(opt => (
            <div
              key={opt.value}
              style={{
                ...S.option,
                ...(String(opt.value) === String(value) ? S.optionActive : {}),
              }}
              onClick={() => { onChange(opt.value); setOpen(false); }}
            >
              {opt.icon && <span style={{marginRight:8}}>{opt.icon}</span>}
              {opt.label}
              {String(opt.value) === String(value) && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00d4aa" strokeWidth="2" style={{marginLeft:'auto'}}>
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const S = {
  wrap:        { position:'relative', width:'100%' },
  trigger:     { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', background:'#1c2129', border:'1px solid rgba(255,255,255,0.12)', borderRadius:7, color:'#e8eaf0', fontSize:13, cursor:'pointer', userSelect:'none', transition:'border-color 0.15s' },
  triggerOpen: { borderColor:'rgba(0,212,170,0.40)', boxShadow:'0 0 0 2px rgba(0,212,170,0.08)' },
  dropdown:    { position:'absolute', top:'calc(100% + 4px)', left:0, right:0, background:'#1c2129', border:'1px solid rgba(255,255,255,0.12)', borderRadius:8, zIndex:500, overflow:'hidden', boxShadow:'0 8px 24px rgba(0,0,0,0.4)', maxHeight:220, overflowY:'auto' },
  option:      { display:'flex', alignItems:'center', padding:'10px 14px', color:'#7a8394', fontSize:13, cursor:'pointer', transition:'background 0.1s' },
  optionActive:{ background:'rgba(0,212,170,0.08)', color:'#00d4aa' },
};