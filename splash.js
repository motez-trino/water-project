function boot(){ const enter=document.getElementById('enterBtn'); if(enter){ enter.addEventListener('click',()=>{ window.location.href='home.html' }) } document.addEventListener('keydown',e=>{ if(e.key==='Enter'){ window.location.href='home.html' } }) }
if(document.readyState==='complete'||document.readyState==='interactive'){ boot() } else { window.addEventListener('DOMContentLoaded', boot) }
