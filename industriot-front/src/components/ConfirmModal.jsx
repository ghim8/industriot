import React from 'react';

export default function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div style={S.overlay}>
      <div style={S.modal}>
        <div style={S.icon}>⚠</div>
        <div style={S.title}>Confirmation</div>
        <div style={S.message}>{message}</div>
        <div style={S.footer}>
          <button style={S.btnCancel} onClick={onCancel}>Annuler</button>
          <button style={S.btnConfirm} onClick={onConfirm}>Supprimer</button>
        </div>
      </div>
    </div>
  );
}

const S = {
  overlay:   { position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000 },
  modal:     { background:'#161b22', border:'1px solid rgba(255,71,87,0.25)', borderRadius:12, padding:'32px 36px', width:380, maxWidth:'90vw', textAlign:'center' },
  icon:      { fontSize:28, color:'#ff4757', marginBottom:12 },
  title:     { fontSize:16, fontWeight:600, color:'#e8eaf0', marginBottom:10 },
  message:   { fontSize:13, color:'#7a8394', marginBottom:28, lineHeight:1.6 },
  footer:    { display:'flex', gap:10, justifyContent:'center' },
  btnCancel: { padding:'8px 20px', background:'transparent', border:'1px solid rgba(255,255,255,0.12)', borderRadius:7, color:'#7a8394', fontSize:13, cursor:'pointer' },
  btnConfirm:{ padding:'8px 20px', background:'rgba(255,71,87,0.15)', border:'1px solid rgba(255,71,87,0.30)', borderRadius:7, color:'#ff4757', fontSize:13, cursor:'pointer', fontWeight:600 },
};