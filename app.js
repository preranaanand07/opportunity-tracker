const API = '/api/opportunities';

let opportunities = [];
let activeFilter = 'all';
let tickHandle = null;

const $ = (sel) => document.querySelector(sel);

const heroBody = $('#heroBody');
const list = $('#list');
const modalBackdrop = $('#modalBackdrop');
const oppForm = $('#oppForm');
const modalTitle = $('#modalTitle');
const deleteBtn = $('#deleteBtn');

// ---------- data ----------

async function fetchOpportunities() {
  const res = await fetch(API);
  opportunities = await res.json();
  render();
}

async function saveOpportunity(payload, id) {
  const url = id ? `${API}/${id}` : API;
  const method = id ? 'PUT' : 'POST';
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('save failed');
  await fetchOpportunities();
}

async function deleteOpportunityApi(id) {
  await fetch(`${API}/${id}`, { method: 'DELETE' });
  await fetchOpportunities();
}

async function toggleDone(opp) {
  const status = opp.status === 'done' ? 'active' : 'done';
  await fetch(`${API}/${opp.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  await fetchOpportunities();
}

// ---------- time helpers ----------

function msRemaining(deadline) {
  return new Date(deadline).getTime() - Date.now();
}

function urgencyLevel(opp) {
  if (opp.status === 'done') return 'done';
  const ms = msRemaining(opp.deadline);
  if (ms <= 0) return 'urgent';
  const hours = ms / 3_600_000;
  if (hours <= 24) return 'urgent';
  if (hours <= 24 * 7) return 'warn';
  return 'ok';
}

function formatCountdown(ms) {
  if (ms <= 0) return 'Deadline passed';
  const totalMin = Math.floor(ms / 60000);
  const days = Math.floor(totalMin / 1440);
  const hours = Math.floor((totalMin % 1440) / 60);
  const mins = totalMin % 60;
  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${mins}m left`;
  return `${mins}m left`;
}

function splitUnits(ms) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  return {
    d: Math.floor(totalSec / 86400),
    h: Math.floor((totalSec % 86400) / 3600),
    m: Math.floor((totalSec % 3600) / 60),
    s: totalSec % 60,
  };
}

function pad(n) { return String(n).padStart(2, '0'); }

// ---------- rendering ----------

function render() {
  renderHero();
  renderList();
}

function renderHero() {
  const upcoming = opportunities
    .filter((o) => o.status !== 'done')
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))[0];

  if (!upcoming) {
    heroBody.innerHTML = `<div class="hero-empty">Nothing tracked yet. Log your first opportunity to start the clock.</div>`;
    return;
  }

  const ms = msRemaining(upcoming.deadline);
  const u = splitUnits(ms);
  const urgent = ms <= 24 * 3600 * 1000;

  heroBody.innerHTML = `
    <div class="hero-content">
      <div class="hero-info">
        <div class="hero-name">${escapeHtml(upcoming.name)}</div>
        <div class="hero-meta">
          <span class="hero-type-tag">${escapeHtml(upcoming.type)}</span>
          <span>Due ${formatDate(upcoming.deadline)}</span>
        </div>
      </div>
      <div class="flip-clock">
        ${flipUnit(u.d, 'days', urgent)}
        ${flipUnit(u.h, 'hrs', urgent)}
        ${flipUnit(u.m, 'min', urgent)}
        ${flipUnit(u.s, 'sec', urgent)}
      </div>
    </div>
  `;
}

function flipUnit(value, label, urgent) {
  return `
    <div class="flip-unit">
      <div class="flip-value ${urgent ? 'urgent' : ''}">${pad(value)}</div>
      <div class="flip-label">${label}</div>
    </div>
  `;
}

function renderList() {
  const filtered = opportunities.filter(
    (o) => activeFilter === 'all' || o.type === activeFilter
  );

  if (!filtered.length) {
    list.innerHTML = `<div class="empty-state">No opportunities here yet. Click “+ Log opportunity” to add one.</div>`;
    return;
  }

  list.innerHTML = filtered
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .map((opp) => {
      const level = urgencyLevel(opp);
      const ms = msRemaining(opp.deadline);
      const countdownText = opp.status === 'done' ? 'Done' : formatCountdown(ms);
      return `
        <div class="card urgency-${level}" data-id="${opp.id}">
          <div class="card-done-check ${opp.status === 'done' ? 'checked' : ''}" data-action="toggle" data-id="${opp.id}">
            ${opp.status === 'done' ? '✓' : ''}
          </div>
          <div class="card-main" data-action="edit" data-id="${opp.id}">
            <div class="card-name">${escapeHtml(opp.name)}</div>
            <div class="card-sub">
              <span class="card-tag">${escapeHtml(opp.type)}</span>
              <span>${formatDate(opp.deadline)}</span>
              ${opp.notes ? `<span>· ${escapeHtml(truncate(opp.notes, 40))}</span>` : ''}
            </div>
          </div>
          <div class="card-countdown ${level}">${countdownText}</div>
        </div>
      `;
    })
    .join('');
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

function truncate(str, n) {
  return str.length > n ? str.slice(0, n) + '…' : str;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

// ---------- modal ----------

function openModal(opp = null) {
  oppForm.reset();
  $('#oppId').value = opp?.id || '';
  modalTitle.textContent = opp ? 'Edit opportunity' : 'Log an opportunity';
  deleteBtn.style.display = opp ? 'inline-block' : 'none';

  if (opp) {
    $('#oppName').value = opp.name;
    $('#oppType').value = opp.type;
    $('#oppDeadline').value = toLocalInputValue(opp.deadline);
    $('#oppNotes').value = opp.notes || '';
    document.querySelectorAll('#remindChips input').forEach((cb) => {
      cb.checked = opp.remindBefore?.includes(Number(cb.value)) ?? true;
    });
  } else {
    const in3days = new Date(Date.now() + 3 * 86400000);
    $('#oppDeadline').value = toLocalInputValue(in3days.toISOString());
  }

  modalBackdrop.classList.add('open');
}

function closeModal() {
  modalBackdrop.classList.remove('open');
}

function toLocalInputValue(iso) {
  const d = new Date(iso);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

// ---------- events ----------

$('#openAddBtn').addEventListener('click', () => openModal());
$('#closeModalBtn').addEventListener('click', closeModal);
$('#cancelBtn').addEventListener('click', closeModal);
modalBackdrop.addEventListener('click', (e) => {
  if (e.target === modalBackdrop) closeModal();
});

oppForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = $('#oppId').value || null;
  const remindBefore = Array.from(document.querySelectorAll('#remindChips input:checked'))
    .map((cb) => Number(cb.value));

  const payload = {
    name: $('#oppName').value,
    type: $('#oppType').value,
    deadline: new Date($('#oppDeadline').value).toISOString(),
    notes: $('#oppNotes').value,
    remindBefore,
  };

  try {
    await saveOpportunity(payload, id);
    closeModal();
  } catch {
    alert('Could not save. Please try again.');
  }
});

deleteBtn.addEventListener('click', async () => {
  const id = $('#oppId').value;
  if (!id) return;
  if (confirm('Delete this opportunity? This can\'t be undone.')) {
    await deleteOpportunityApi(id);
    closeModal();
  }
});

list.addEventListener('click', (e) => {
  const target = e.target.closest('[data-action]');
  if (!target) return;
  const id = target.dataset.id;
  const opp = opportunities.find((o) => o.id === id);
  if (!opp) return;

  if (target.dataset.action === 'toggle') {
    e.stopPropagation();
    toggleDone(opp);
  } else if (target.dataset.action === 'edit') {
    openModal(opp);
  }
});

document.querySelectorAll('.chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.chip').forEach((c) => c.classList.remove('active'));
    chip.classList.add('active');
    activeFilter = chip.dataset.filter;
    renderList();
  });
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

// ---------- boot ----------

fetchOpportunities();
tickHandle = setInterval(render, 1000);
