/* ============================================================
   MUSO 2026 — SHARED APP BEHAVIOUR
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  // Mobile nav toggle
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle && links){
    toggle.addEventListener('click', () => links.classList.toggle('open'));
  }

  // Logout buttons
  document.querySelectorAll('[data-logout]').forEach(btn => {
    btn.addEventListener('click', () => {
      DB.session.clear();
      window.location.href = btn.dataset.logout === 'admin' ? 'admin-login.html' : 'index.html';
    });
  });

  // Generic modal open/close
  document.querySelectorAll('[data-modal-open]').forEach(btn => {
    btn.addEventListener('click', () => {
      const m = document.getElementById(btn.dataset.modalOpen);
      if (m) m.classList.add('open');
    });
  });
  document.querySelectorAll('[data-modal-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      const m = btn.closest('.modal-overlay');
      if (m) m.classList.remove('open');
    });
  });
  document.querySelectorAll('.modal-overlay').forEach(ov => {
    ov.addEventListener('click', (e) => { if (e.target === ov) ov.classList.remove('open'); });
  });

  // Populate nav identity widgets (name + initials) if present
  const student = typeof currentStudent === 'function' ? currentStudent() : null;
  const admin = typeof currentAdmin === 'function' ? currentAdmin() : null;
  document.querySelectorAll('[data-user-name]').forEach(el => {
    if (student) el.textContent = student.fullName;
    if (admin) el.textContent = admin.fullName;
  });
  document.querySelectorAll('[data-user-initials]').forEach(el => {
    if (student) el.textContent = initials(student.fullName);
    if (admin) el.textContent = initials(admin.fullName);
  });
});

/* ---------------- Countdown engine ----------------
   Usage: startCountdown(targetISO, containerEl)
*/
function startCountdown(targetISO, el){
  function tick(){
    const target = new Date(targetISO).getTime();
    const now = Date.now();
    let diff = Math.max(0, target - now);

    const d = Math.floor(diff / (1000*60*60*24));
    const h = Math.floor((diff / (1000*60*60)) % 24);
    const m = Math.floor((diff / (1000*60)) % 60);
    const s = Math.floor((diff / 1000) % 60);

    el.innerHTML = `
      <div class="seg"><div class="v">${String(d).padStart(2,'0')}</div><div class="l">Days</div></div>
      <div class="seg"><div class="v">${String(h).padStart(2,'0')}</div><div class="l">Hours</div></div>
      <div class="seg"><div class="v">${String(m).padStart(2,'0')}</div><div class="l">Mins</div></div>
      <div class="seg"><div class="v">${String(s).padStart(2,'0')}</div><div class="l">Secs</div></div>
    `;
    if (diff <= 0) clearInterval(timer);
  }
  tick();
  const timer = setInterval(tick, 1000);
  return timer;
}
