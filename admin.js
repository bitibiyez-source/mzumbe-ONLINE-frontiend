/* ============================================================
   MUSO 2026 — ADMIN DASHBOARD LOGIC
   ============================================================ */

const adminSession = requireAuth('admin');
let deleteTarget = null; // { type, id }

if (adminSession){

  /* ---------------- Tabs ---------------- */
  function switchTab(name){
    document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === name));
    document.querySelectorAll('[data-panel]').forEach(p => p.style.display = (p.dataset.panel === name ? '' : 'none'));
    renderAll();
  }
  window.switchTab = switchTab;
  document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => switchTab(t.dataset.tab)));

  function renderAll(){
    renderOverview();
    renderElections();
    renderPositions();
    renderCandidates();
    renderStudents(document.getElementById('student-search').value);
    renderAnnouncements();
    renderAudit();
  }

  /* ---------------- Overview ---------------- */
  function renderOverview(){
    const students = DB.students.all();
    const candidates = DB.candidates.all();
    const positions = DB.positions.all();
    const votes = DB.votes.all();
    const elections = DB.elections.all();
    const turnout = students.length ? Math.round((new Set(votes.map(v=>v.studentId)).size/students.length)*100) : 0;

    document.getElementById('overview-tiles').innerHTML = `
      <div class="stat glass"><div class="num">${students.length}</div><div class="lbl">Total students</div></div>
      <div class="stat glass"><div class="num">${candidates.length}</div><div class="lbl">Total candidates</div></div>
      <div class="stat glass"><div class="num">${positions.length}</div><div class="lbl">Total positions</div></div>
      <div class="stat glass"><div class="num">${votes.length}</div><div class="lbl">Total votes cast</div></div>
      <div class="stat glass"><div class="num">${turnout}%</div><div class="lbl">Voter turnout</div></div>
      <div class="stat glass"><div class="num">${elections.filter(e=>e.status==='Active').length}</div><div class="lbl">Active elections</div></div>
      <div class="stat glass"><div class="num">${elections.filter(e=>e.status==='Completed').length}</div><div class="lbl">Completed elections</div></div>
      <div class="stat glass"><div class="num">${DB.announcements.all().filter(a=>a.status==='Published').length}</div><div class="lbl">Published announcements</div></div>
    `;
  }

  /* ---------------- Elections ---------------- */
  function renderElections(){
    const rows = DB.elections.all().map(e => `
      <tr>
        <td class="tag-mono">${e.id}</td>
        <td>${escapeHtml(e.title)}</td>
        <td>${e.type}</td>
        <td>${formatDate(e.startDate)}</td>
        <td>${formatDate(e.endDate)}</td>
        <td><span class="badge ${electionStatusBadge(e.status)}">${e.status}</span></td>
        <td class="row-actions">
          <button class="btn btn-ghost btn-sm" onclick="openElectionForm('${e.id}')">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="confirmDelete('elections','${e.id}')">Delete</button>
        </td>
      </tr>
    `).join('');
    document.getElementById('elections-table').innerHTML = `
      <thead><tr><th>ID</th><th>Title</th><th>Type</th><th>Start</th><th>End</th><th>Status</th><th></th></tr></thead>
      <tbody>${rows || `<tr><td colspan="7" class="empty-state">No elections yet.</td></tr>`}</tbody>
    `;
  }

  function openElectionForm(id){
    const record = id ? DB.elections.find(id) : null;
    document.getElementById('form-modal-title').textContent = id ? 'Edit election' : 'Add election';
    document.getElementById('form-modal-body').innerHTML = `
      <div class="field"><label>Title</label><input id="f-title" value="${record ? escapeHtml(record.title) : ''}"></div>
      <div class="field"><label>Description</label><textarea id="f-desc" rows="3">${record ? escapeHtml(record.description) : ''}</textarea></div>
      <div class="field-row">
        <div class="field"><label>Start date</label><input type="date" id="f-start" value="${record ? record.startDate.slice(0,10) : ''}"></div>
        <div class="field"><label>End date</label><input type="date" id="f-end" value="${record ? record.endDate.slice(0,10) : ''}"></div>
      </div>
      <div class="field-row">
        <div class="field"><label>Type</label><input id="f-type" value="${record ? escapeHtml(record.type) : 'General Election'}"></div>
        <div class="field"><label>Status</label>
          <select id="f-status">
            ${['Upcoming','Active','Closed','Completed'].map(s => `<option ${record && record.status===s?'selected':''}>${s}</option>`).join('')}
          </select>
        </div>
      </div>
    `;
    document.getElementById('form-modal-save').onclick = () => {
      const rec = record || { id: DB.uid('ELC') };
      rec.title = document.getElementById('f-title').value.trim();
      rec.description = document.getElementById('f-desc').value.trim();
      rec.startDate = new Date(document.getElementById('f-start').value).toISOString();
      rec.endDate = new Date(document.getElementById('f-end').value).toISOString();
      rec.type = document.getElementById('f-type').value.trim();
      rec.status = document.getElementById('f-status').value;
      DB.elections.save(rec);
      DB.logAudit('ELECTION_SAVE', `Election "${rec.title}" saved.`);
      document.getElementById('form-modal').classList.remove('open');
      renderAll();
      toast('Election saved.', 'success');
    };
    document.getElementById('form-modal').classList.add('open');
  }
  window.openElectionForm = openElectionForm;

  /* ---------------- Positions ---------------- */
  function renderPositions(){
    const rows = DB.positions.all().map(p => {
      const election = DB.elections.find(p.electionId);
      return `
      <tr>
        <td class="tag-mono">${p.id}</td>
        <td>${escapeHtml(p.title)}</td>
        <td>${election ? escapeHtml(election.title) : '—'}</td>
        <td>${p.numWinners}</td>
        <td><span class="badge ${p.status==='Active'?'badge-active':'badge-closed'}">${p.status}</span></td>
        <td class="row-actions">
          <button class="btn btn-ghost btn-sm" onclick="openPositionForm('${p.id}')">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="confirmDelete('positions','${p.id}')">Delete</button>
        </td>
      </tr>
    `;
    }).join('');
    document.getElementById('positions-table').innerHTML = `
      <thead><tr><th>ID</th><th>Title</th><th>Election</th><th>Winners</th><th>Status</th><th></th></tr></thead>
      <tbody>${rows || `<tr><td colspan="6" class="empty-state">No positions yet.</td></tr>`}</tbody>
    `;
  }

  function openPositionForm(id){
    const record = id ? DB.positions.find(id) : null;
    const elections = DB.elections.all();
    document.getElementById('form-modal-title').textContent = id ? 'Edit position' : 'Add position';
    document.getElementById('form-modal-body').innerHTML = `
      <div class="field"><label>Election</label>
        <select id="f-election">${elections.map(e => `<option value="${e.id}" ${record && record.electionId===e.id?'selected':''}>${escapeHtml(e.title)}</option>`).join('')}</select>
      </div>
      <div class="field"><label>Position title</label><input id="f-title" value="${record ? escapeHtml(record.title) : ''}" placeholder="e.g. President"></div>
      <div class="field"><label>Description</label><textarea id="f-desc" rows="2">${record ? escapeHtml(record.description) : ''}</textarea></div>
      <div class="field-row">
        <div class="field"><label>Number of winners</label><input type="number" id="f-winners" min="1" value="${record ? record.numWinners : 1}"></div>
        <div class="field"><label>Status</label>
          <select id="f-status"><option ${record && record.status==='Active'?'selected':''}>Active</option><option ${record && record.status==='Inactive'?'selected':''}>Inactive</option></select>
        </div>
      </div>
    `;
    document.getElementById('form-modal-save').onclick = () => {
      const rec = record || { id: DB.uid('POS') };
      rec.electionId = document.getElementById('f-election').value;
      rec.title = document.getElementById('f-title').value.trim();
      rec.description = document.getElementById('f-desc').value.trim();
      rec.numWinners = Number(document.getElementById('f-winners').value) || 1;
      rec.status = document.getElementById('f-status').value;
      DB.positions.save(rec);
      DB.logAudit('POSITION_SAVE', `Position "${rec.title}" saved.`);
      document.getElementById('form-modal').classList.remove('open');
      renderAll();
      toast('Position saved.', 'success');
    };
    document.getElementById('form-modal').classList.add('open');
  }
  window.openPositionForm = openPositionForm;

  /* ---------------- Candidates ---------------- */
  function renderCandidates(){
    const rows = DB.candidates.all().map(c => {
      const pos = DB.positions.find(c.positionId);
      return `
      <tr>
        <td class="tag-mono">${c.id}</td>
        <td>${escapeHtml(c.name)}</td>
        <td class="tag-mono">${escapeHtml(c.regNo)}</td>
        <td>${pos ? escapeHtml(pos.title) : '—'}</td>
        <td>${escapeHtml(c.department)}</td>
        <td><span class="badge ${c.status==='Approved'?'badge-active':c.status==='Rejected'?'badge-danger':'badge-upcoming'}">${c.status}</span></td>
        <td class="row-actions">
          <button class="btn btn-ghost btn-sm" onclick="openCandidateForm('${c.id}')">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="confirmDelete('candidates','${c.id}')">Delete</button>
        </td>
      </tr>
    `;
    }).join('');
    document.getElementById('candidates-table').innerHTML = `
      <thead><tr><th>ID</th><th>Name</th><th>Reg. No.</th><th>Position</th><th>Department</th><th>Status</th><th></th></tr></thead>
      <tbody>${rows || `<tr><td colspan="7" class="empty-state">No candidates yet.</td></tr>`}</tbody>
    `;
  }

  function openCandidateForm(id){
    const record = id ? DB.candidates.find(id) : null;
    const positions = DB.positions.all();
    document.getElementById('form-modal-title').textContent = id ? 'Edit candidate' : 'Add candidate';
    document.getElementById('form-modal-body').innerHTML = `
      <div class="field-row">
        <div class="field"><label>Full name</label><input id="f-name" value="${record ? escapeHtml(record.name) : ''}"></div>
        <div class="field"><label>Registration number</label><input id="f-reg" value="${record ? escapeHtml(record.regNo) : ''}"></div>
      </div>
      <div class="field"><label>Position contested</label>
        <select id="f-position">${positions.map(p => `<option value="${p.id}" ${record && record.positionId===p.id?'selected':''}>${escapeHtml(p.title)}</option>`).join('')}</select>
      </div>
      <div class="field-row">
        <div class="field"><label>Gender</label><select id="f-gender"><option ${record&&record.gender==='Female'?'selected':''}>Female</option><option ${record&&record.gender==='Male'?'selected':''}>Male</option></select></div>
        <div class="field"><label>Year of study</label><input type="number" id="f-year" min="1" max="6" value="${record ? record.year : 1}"></div>
      </div>
      <div class="field-row">
        <div class="field"><label>Department</label><input id="f-dept" value="${record ? escapeHtml(record.department) : ''}"></div>
        <div class="field"><label>Faculty</label><input id="f-faculty" value="${record ? escapeHtml(record.faculty) : ''}"></div>
      </div>
      <div class="field"><label>Course</label><input id="f-course" value="${record ? escapeHtml(record.course) : ''}"></div>
      <div class="field"><label>Campaign slogan</label><input id="f-slogan" value="${record ? escapeHtml(record.slogan) : ''}"></div>
      <div class="field"><label>Biography</label><textarea id="f-bio" rows="2">${record ? escapeHtml(record.bio) : ''}</textarea></div>
      <div class="field"><label>Manifesto</label><textarea id="f-manifesto" rows="2">${record ? escapeHtml(record.manifesto) : ''}</textarea></div>
      <div class="field"><label>Leadership experience</label><textarea id="f-experience" rows="2">${record ? escapeHtml(record.experience) : ''}</textarea></div>
      <div class="field"><label>Achievements</label><textarea id="f-achievements" rows="2">${record ? escapeHtml(record.achievements) : ''}</textarea></div>
      <div class="field"><label>Status</label>
        <select id="f-status">${['Pending','Approved','Rejected'].map(s => `<option ${record && record.status===s?'selected':''}>${s}</option>`).join('')}</select>
      </div>
    `;
    document.getElementById('form-modal-save').onclick = () => {
      const rec = record || { id: DB.uid('CAN'), social:{} };
      rec.name = document.getElementById('f-name').value.trim();
      rec.regNo = document.getElementById('f-reg').value.trim();
      rec.positionId = document.getElementById('f-position').value;
      rec.gender = document.getElementById('f-gender').value;
      rec.year = Number(document.getElementById('f-year').value);
      rec.department = document.getElementById('f-dept').value.trim();
      rec.faculty = document.getElementById('f-faculty').value.trim();
      rec.course = document.getElementById('f-course').value.trim();
      rec.slogan = document.getElementById('f-slogan').value.trim();
      rec.bio = document.getElementById('f-bio').value.trim();
      rec.manifesto = document.getElementById('f-manifesto').value.trim();
      rec.experience = document.getElementById('f-experience').value.trim();
      rec.achievements = document.getElementById('f-achievements').value.trim();
      rec.status = document.getElementById('f-status').value;
      DB.candidates.save(rec);
      DB.logAudit('CANDIDATE_SAVE', `Candidate "${rec.name}" saved.`);
      document.getElementById('form-modal').classList.remove('open');
      renderAll();
      toast('Candidate saved.', 'success');
    };
    document.getElementById('form-modal').classList.add('open');
  }
  window.openCandidateForm = openCandidateForm;

  /* ---------------- Students ---------------- */
  function renderStudents(filter){
    filter = (filter || '').toLowerCase();
    let list = DB.students.all();
    if (filter) list = list.filter(s => s.fullName.toLowerCase().includes(filter) || s.regNo.toLowerCase().includes(filter));

    const rows = list.map(s => `
      <tr>
        <td class="tag-mono">${s.regNo}</td>
        <td>${escapeHtml(s.fullName)}</td>
        <td>${escapeHtml(s.email)}</td>
        <td>${escapeHtml(s.department)}</td>
        <td>Year ${s.year}</td>
        <td><span class="badge ${s.status==='active'?'badge-active':'badge-danger'}">${s.status}</span></td>
        <td class="row-actions">
          <button class="btn btn-ghost btn-sm" onclick="toggleStudentStatus('${s.id}')">${s.status==='active'?'Deactivate':'Activate'}</button>
          <button class="btn btn-danger btn-sm" onclick="confirmDelete('students','${s.id}')">Delete</button>
        </td>
      </tr>
    `).join('');
    document.getElementById('students-table').innerHTML = `
      <thead><tr><th>Reg. No.</th><th>Name</th><th>Email</th><th>Department</th><th>Year</th><th>Status</th><th></th></tr></thead>
      <tbody>${rows || `<tr><td colspan="7" class="empty-state">No students found.</td></tr>`}</tbody>
    `;
  }
  document.getElementById('student-search').addEventListener('input', (e) => renderStudents(e.target.value));

  function toggleStudentStatus(id){
    const s = DB.students.find(id);
    s.status = s.status === 'active' ? 'inactive' : 'active';
    DB.students.save(s);
    DB.logAudit('STUDENT_STATUS', `Student ${s.regNo} set to ${s.status}.`);
    renderAll();
    toast(`Student account ${s.status === 'active' ? 'activated' : 'deactivated'}.`, 'success');
  }
  window.toggleStudentStatus = toggleStudentStatus;

  /* ---------------- Announcements ---------------- */
  function renderAnnouncements(){
    const rows = DB.announcements.all().map(a => `
      <tr>
        <td>${escapeHtml(a.title)}</td>
        <td>${formatDate(a.publishDate)}</td>
        <td><span class="badge ${a.status==='Published'?'badge-active':'badge-closed'}">${a.status}</span></td>
        <td class="row-actions">
          <button class="btn btn-ghost btn-sm" onclick="openAnnouncementForm('${a.id}')">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="confirmDelete('announcements','${a.id}')">Delete</button>
        </td>
      </tr>
    `).join('');
    document.getElementById('announcements-table').innerHTML = `
      <thead><tr><th>Title</th><th>Published</th><th>Status</th><th></th></tr></thead>
      <tbody>${rows || `<tr><td colspan="4" class="empty-state">No announcements yet.</td></tr>`}</tbody>
    `;
  }

  function openAnnouncementForm(id){
    const record = id ? DB.announcements.find(id) : null;
    document.getElementById('form-modal-title').textContent = id ? 'Edit announcement' : 'New announcement';
    document.getElementById('form-modal-body').innerHTML = `
      <div class="field"><label>Title</label><input id="f-title" value="${record ? escapeHtml(record.title) : ''}"></div>
      <div class="field"><label>Content</label><textarea id="f-content" rows="4">${record ? escapeHtml(record.content) : ''}</textarea></div>
      <div class="field"><label>Status</label>
        <select id="f-status"><option ${record && record.status==='Published'?'selected':''}>Published</option><option ${record && record.status==='Draft'?'selected':''}>Draft</option></select>
      </div>
    `;
    document.getElementById('form-modal-save').onclick = () => {
      const rec = record || { id: DB.uid('ANN'), publishDate: DB.nowISO() };
      rec.title = document.getElementById('f-title').value.trim();
      rec.content = document.getElementById('f-content').value.trim();
      rec.status = document.getElementById('f-status').value;
      DB.announcements.save(rec);
      DB.logAudit('ANNOUNCEMENT_SAVE', `Announcement "${rec.title}" saved.`);
      document.getElementById('form-modal').classList.remove('open');
      renderAll();
      toast('Announcement saved.', 'success');
    };
    document.getElementById('form-modal').classList.add('open');
  }
  window.openAnnouncementForm = openAnnouncementForm;

  /* ---------------- Audit log ---------------- */
  function renderAudit(){
    const rows = DB.KEYS ? JSON.parse(localStorage.getItem(DB.KEYS.audit) || '[]') : [];
    document.getElementById('audit-table').innerHTML = `
      <thead><tr><th>Time</th><th>Action</th><th>Detail</th></tr></thead>
      <tbody>${rows.map(r => `<tr><td class="tag-mono">${formatDate(r.at)}</td><td><span class="badge badge-upcoming">${r.action}</span></td><td>${escapeHtml(r.detail)}</td></tr>`).join('') || `<tr><td colspan="3" class="empty-state">No activity recorded yet.</td></tr>`}</tbody>
    `;
  }

  /* ---------------- Delete confirmation ---------------- */
  function confirmDelete(type, id){
    deleteTarget = { type, id };
    document.getElementById('delete-modal').classList.add('open');
  }
  window.confirmDelete = confirmDelete;

  document.getElementById('delete-confirm-btn').addEventListener('click', () => {
    if (!deleteTarget) return;
    DB[deleteTarget.type].remove(deleteTarget.id);
    DB.logAudit('DELETE', `Deleted ${deleteTarget.type} record ${deleteTarget.id}.`);
    document.getElementById('delete-modal').classList.remove('open');
    deleteTarget = null;
    renderAll();
    toast('Record deleted.', 'success');
  });

  renderAll();
}
