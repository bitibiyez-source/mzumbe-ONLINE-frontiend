/* ============================================================
   MUSO 2026 — DATA LAYER
   All persistence is localStorage (frontend-only demo).
   Swap the functions in this file for real API calls when a
   backend is wired up — every other page only talks to DB.*
   ============================================================ */

const DB = (() => {
  const KEYS = {
    students: 'muso_students',
    admins: 'muso_admins',
    elections: 'muso_elections',
    positions: 'muso_positions',
    candidates: 'muso_candidates',
    votes: 'muso_votes',
    announcements: 'muso_announcements',
    session: 'muso_session',
    audit: 'muso_audit',
    seeded: 'muso_seeded_v1'
  };

  function get(key, fallback){
    try{
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : (fallback ?? []);
    }catch(e){ return fallback ?? []; }
  }
  function set(key, value){ localStorage.setItem(key, JSON.stringify(value)); }
  function uid(prefix){ return prefix + '-' + Math.random().toString(36).slice(2,8).toUpperCase(); }
  function nowISO(){ return new Date().toISOString(); }

  function logAudit(action, detail){
    const audit = get(KEYS.audit, []);
    audit.unshift({ id: uid('LOG'), action, detail, at: nowISO() });
    set(KEYS.audit, audit.slice(0, 300));
  }

  /* ---------------- SEED ---------------- */
  function seed(){
    if (localStorage.getItem(KEYS.seeded)) return;

    const admins = [
      { id:'ADM-0001', username:'admin', password:'admin123', fullName:'Returning Officer' }
    ];

    const students = [
      { id:'STU-0001', regNo:'T22-03-1102', fullName:'Asha Mwakipesile', email:'asha.mwakipesile@mzumbe.ac.tz', phone:'0712345678', gender:'Female', faculty:'Faculty of Law', department:'Public Law', course:'LLB', year:3, password:'student123', photo:'', status:'active' },
      { id:'STU-0002', regNo:'T21-01-0876', fullName:'Brian Komba', email:'brian.komba@mzumbe.ac.tz', phone:'0765432109', gender:'Male', faculty:'School of Business', department:'Marketing', course:'BBA', year:4, password:'student123', photo:'', status:'active' }
    ];

    const elections = [
      {
        id:'ELC-2026', title:'MUSO 2026 General Election',
        description:'Annual general election for the Mzumbe University Students Organisation executive committee.',
        startDate: new Date(Date.now() - 1000*60*60*24*1).toISOString(),
        endDate: new Date(Date.now() + 1000*60*60*24*4).toISOString(),
        status:'Active', type:'General Election'
      }
    ];

    const positions = [
      { id:'POS-01', electionId:'ELC-2026', title:'President', description:'Chief executive of MUSO.', numWinners:1, status:'Active' },
      { id:'POS-02', electionId:'ELC-2026', title:'Vice President', description:'Deputises for the President.', numWinners:1, status:'Active' },
      { id:'POS-03', electionId:'ELC-2026', title:'Secretary General', description:'Head of administration and records.', numWinners:1, status:'Active' },
      { id:'POS-04', electionId:'ELC-2026', title:'Treasurer', description:'Oversees MUSO finances.', numWinners:1, status:'Active' }
    ];

    const candidates = [
      { id:'CAN-01', positionId:'POS-01', name:'Faraja Mushi', regNo:'T20-02-0451', gender:'Male', department:'Computer Science', course:'BSc. CS', faculty:'School of Business', year:4, slogan:'Building a stronger student voice.', bio:'Outgoing class representative with three years of student leadership experience.', manifesto:'Improve hostel welfare, expand career fairs, and digitise MUSO services.', achievements:'Best Class Rep 2024; Organised the 2025 Career Week.', experience:'Class Representative (2023-2025), Sports Committee Member.', social:{ instagram:'', twitter:'' }, status:'Approved' },
      { id:'CAN-02', positionId:'POS-01', name:'Lillian Mtui', regNo:'T20-04-0298', gender:'Female', department:'Law', course:'LLB', faculty:'Faculty of Law', year:4, slogan:'Transparency. Action. Results.', bio:'Debate club president and student welfare advocate.', manifesto:'Push for transparent budget reporting and a 24-hour study space.', achievements:'Mzumbe Debate Champion 2025.', experience:'Debate Club President, Welfare Sub-committee.', social:{ instagram:'', twitter:'' }, status:'Approved' },
      { id:'CAN-03', positionId:'POS-02', name:'Erick Massawe', regNo:'T21-01-0876', gender:'Male', department:'Marketing', course:'BBA', faculty:'School of Business', year:3, slogan:'Every voice counts.', bio:'Active member of the entrepreneurship club.', manifesto:'Launch a peer mentorship programme and student business incubator.', achievements:'Founder, Mzumbe Hustlers Club.', experience:'Entrepreneurship Club Lead.', social:{}, status:'Approved' },
      { id:'CAN-04', positionId:'POS-02', name:'Grace Kileo', regNo:'T22-03-1102', gender:'Female', department:'Public Law', course:'LLB', faculty:'Faculty of Law', year:3, slogan:'Service before self.', bio:'Volunteer coordinator for community outreach programmes.', manifesto:'Strengthen gender welfare desks and expand counselling access.', achievements:'Best Volunteer Award 2024.', experience:'Outreach Coordinator, Peer Counsellor.', social:{}, status:'Approved' },
      { id:'CAN-05', positionId:'POS-03', name:'Daudi Shirima', regNo:'T20-05-0177', gender:'Male', department:'Education', course:'BEd', faculty:'School of Education', year:4, slogan:'Organised. Accountable. Reliable.', bio:'Former hall secretary with strong record-keeping background.', manifesto:'Digitise meeting minutes and improve communication channels.', achievements:'Hall Secretary 2024/25.', experience:'Hall Secretary, Academic Committee Member.', social:{}, status:'Approved' },
      { id:'CAN-06', positionId:'POS-04', name:'Neema Paschal', regNo:'T21-02-0933', gender:'Female', department:'Accounting', course:'BAF', faculty:'School of Business', year:3, slogan:'Every shilling accounted for.', bio:'Accounting student with experience managing club finances.', manifesto:'Publish quarterly financial statements and an open budget portal.', achievements:'Treasurer, Mzumbe Finance Club.', experience:'Club Treasurer for two years running.', social:{}, status:'Approved' }
    ];

    const announcements = [
      { id:'ANN-01', title:'Voting opens for MUSO 2026 General Election', content:'All registered students can now cast their vote for the MUSO 2026 executive committee. Voting closes in four days — make sure your voice is heard.', publishDate: nowISO(), status:'Published' },
      { id:'ANN-02', title:'Candidate manifestos now available', content:'Read each candidate\'s full manifesto and leadership experience on the Candidates page before you vote.', publishDate: nowISO(), status:'Published' }
    ];

    set(KEYS.admins, admins);
    set(KEYS.students, students);
    set(KEYS.elections, elections);
    set(KEYS.positions, positions);
    set(KEYS.candidates, candidates);
    set(KEYS.votes, []);
    set(KEYS.announcements, announcements);
    set(KEYS.audit, []);
    localStorage.setItem(KEYS.seeded, '1');
    logAudit('SEED', 'Initial demo dataset created.');
  }

  /* ---------------- Generic CRUD ---------------- */
  const api = { KEYS, uid, nowISO, logAudit };

  ['students','admins','elections','positions','candidates','votes','announcements'].forEach(name => {
    const key = KEYS[name];
    api[name] = {
      all: () => get(key, []),
      find: (id) => get(key, []).find(r => r.id === id) || null,
      save: (record) => {
        const list = get(key, []);
        const idx = list.findIndex(r => r.id === record.id);
        if (idx >= 0) list[idx] = record; else list.push(record);
        set(key, list);
        return record;
      },
      remove: (id) => {
        set(key, get(key, []).filter(r => r.id !== id));
      },
      replaceAll: (list) => set(key, list)
    };
  });

  api.session = {
    get: () => get(KEYS.session, null),
    set: (s) => set(KEYS.session, s),
    clear: () => localStorage.removeItem(KEYS.session)
  };

  api.seed = seed;
  return api;
})();

DB.seed();

/* ---------------- Shared helpers ---------------- */

function requireAuth(role){
  const s = DB.session.get();
  if (!s || s.role !== role){
    window.location.href = role === 'admin' ? 'admin-login.html' : 'login.html';
    return null;
  }
  return s;
}

function currentStudent(){
  const s = DB.session.get();
  if (!s || s.role !== 'student') return null;
  return DB.students.find(s.id);
}

function currentAdmin(){
  const s = DB.session.get();
  if (!s || s.role !== 'admin') return null;
  return DB.admins.find(s.id);
}

function initials(name){
  return (name || '?').split(' ').filter(Boolean).slice(0,2).map(p => p[0].toUpperCase()).join('');
}

function formatDate(iso){
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) +
         ' · ' + d.toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' });
}

function electionStatusBadge(status){
  const map = { Active:'badge-active', Upcoming:'badge-upcoming', Closed:'badge-closed', Completed:'badge-completed' };
  return map[status] || 'badge-closed';
}

function toast(message, type){
  let stack = document.querySelector('.toast-stack');
  if (!stack){
    stack = document.createElement('div');
    stack.className = 'toast-stack';
    document.body.appendChild(stack);
  }
  const el = document.createElement('div');
  el.className = 'toast ' + (type || 'success');
  el.textContent = message;
  stack.appendChild(el);
  setTimeout(() => el.remove(), 3600);
}

function escapeHtml(str){
  return (str || '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

function hasVotedFor(studentId, positionId){
  return DB.votes.all().some(v => v.studentId === studentId && v.positionId === positionId);
}

function votesForStudentElection(studentId, electionId){
  const posIds = DB.positions.all().filter(p => p.electionId === electionId).map(p => p.id);
  return DB.votes.all().filter(v => v.studentId === studentId && posIds.includes(v.positionId));
}
