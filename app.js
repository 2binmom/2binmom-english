// ---------- storage ----------
const STORAGE_KEY = '2bme_data_v1';
const COLOR_PALETTE = ['#FF6B8B', '#A78BFA', '#FBBF24', '#34D399', '#38BDF8', '#FB7185', '#F472B6', '#F59E0B', '#60A5FA', '#4ADE80'];
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function uid() {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
}

function defaultActivities() {
  return [
    { id: uid(), name: '흘려듣기', emoji: '🎬', unit: '분', mode: 'input', fixedAmount: null, presets: [], enabled: true, color: '#FBBF24' },
    { id: uid(), name: '집중듣기', emoji: '🔊', unit: '분', mode: 'input', fixedAmount: null, presets: ['에픽'], enabled: true, color: '#A78BFA' },
    { id: uid(), name: '낭독하기', emoji: '🎙️', unit: '분', mode: 'input', fixedAmount: null, presets: [], enabled: true, color: '#E0567A' },
    { id: uid(), name: '필사', emoji: '✏️', unit: '줄', mode: 'input', fixedAmount: null, presets: [], enabled: true, color: '#34D399' },
    { id: uid(), name: '학습', emoji: '📖', unit: '장', mode: 'input', fixedAmount: null, presets: [], enabled: true, color: '#38BDF8' },
    { id: uid(), name: '화상영어', emoji: '📹', unit: '분', mode: 'checkbox', fixedAmount: 25, presets: [], enabled: true, color: '#FB7185' },
  ];
}

function loadData() {
  let raw;
  try { raw = JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch (e) { raw = null; }
  if (!raw) {
    raw = { children: [], activities: defaultActivities(), entries: {}, history: {}, activeChildId: null };
  }
  if (!raw.history) raw.history = {};
  if (!raw.activities) raw.activities = defaultActivities();
  if (!raw.entries) raw.entries = {};
  if (!raw.children) raw.children = [];
  raw.activities.forEach((a) => { if (!Array.isArray(a.presets)) a.presets = []; });
  return raw;
}

let DATA = loadData();

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DATA));
}

// ---------- date helpers ----------
function todayLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function parseLocal(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}
function fmtLocal(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function addDays(dateStr, delta) {
  const d = parseLocal(dateStr);
  d.setDate(d.getDate() + delta);
  return fmtLocal(d);
}
function formatDayLabel(dateStr) {
  const d = parseLocal(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}(${WEEKDAYS[d.getDay()]})`;
}
function daysInMonth(year, month0) {
  return new Date(year, month0 + 1, 0).getDate();
}
function weekdayColor(weekday) {
  if (weekday === 6) return '#3B82F6';
  if (weekday === 0) return '#EF4444';
  return 'var(--pink-ink)';
}

// ---------- app state ----------
let state = {
  currentDate: todayLocal(),
  settingsOpen: false,
};

// ---------- render root ----------
const root = document.getElementById('app');

function render() {
  if (DATA.children.length === 0) {
    root.innerHTML = onboardingHTML();
    bindOnboarding();
    return;
  }
  if (!DATA.activeChildId || !DATA.children.find((c) => c.id === DATA.activeChildId)) {
    DATA.activeChildId = DATA.children[0].id;
    saveData();
  }
  root.innerHTML = mainHTML();
  bindMain();
}

// ---------- gender / avatar picker (shared by onboarding + settings) ----------
function genderPickerHTML(selected) {
  const sel = selected || '👦🏻';
  return `
    <div class="form-field">
      <label>캐릭터</label>
      <div class="gender-picker">
        <button type="button" class="gender-btn ${sel === '👦🏻' ? 'active' : ''}" data-gender="👦🏻">👦🏻</button>
        <button type="button" class="gender-btn ${sel === '👧🏻' ? 'active' : ''}" data-gender="👧🏻">👧🏻</button>
      </div>
    </div>
  `;
}
function bindGenderPicker(root, initial) {
  let selected = initial || '👦🏻';
  root.querySelectorAll('.gender-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      selected = btn.dataset.gender;
      root.querySelectorAll('.gender-btn').forEach((b) => b.classList.toggle('active', b === btn));
    });
  });
  return () => selected;
}

// ---------- onboarding ----------
function onboardingHTML() {
  return `
    <div class="onboard-screen">
      <img src="icons/icon-192.png" alt="">
      <h1>English Journal</h1>
      <p>우리 아이 엄마표영어 기록장이에요.<br>아이 이름을 알려주시면 바로 시작할 수 있어요.</p>
      <div class="form-card">
        <div class="form-field">
          <label>아이 이름</label>
          <input id="ob-name" type="text" placeholder="예: 경빈" maxlength="10">
        </div>
        ${genderPickerHTML()}
      </div>
      <button class="save-btn" id="ob-submit" style="margin-top:16px;">시작하기</button>
      ${footerHTML()}
    </div>
  `;
}
function bindOnboarding() {
  const input = document.getElementById('ob-name');
  const getGender = bindGenderPicker(document.querySelector('.onboard-screen'));
  const submit = () => {
    const name = input.value.trim();
    if (!name) { input.focus(); return; }
    const child = { id: uid(), name, avatar: getGender() };
    DATA.children.push(child);
    DATA.activeChildId = child.id;
    saveData();
    render();
  };
  document.getElementById('ob-submit').addEventListener('click', submit);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
  input.focus();
}

// ---------- footer ----------
function footerHTML() {
  return `
    <footer class="app-footer">
      ⚠️ 투빈맘(@2bin_mom)이 직접 개발한 앱입니다.<br>
      무단 복제·배포·상업적 이용 시 법적 조치될 수 있습니다.
    </footer>
  `;
}

// ---------- main screen ----------
function mainHTML() {
  return `
    <header class="app-header">
      <div class="brand">
        <img src="icons/icon-192.png" alt="">
        <h1>English Journal</h1>
      </div>
      <div style="display:flex;gap:8px;">
        <button class="icon-btn" id="share-open" aria-label="공유">📤</button>
        <button class="icon-btn" id="settings-open" aria-label="설정">⚙️</button>
      </div>
    </header>
    <main>
      <div id="install-banner-slot"></div>
      ${DATA.children.length > 1 ? childTabsHTML() : ''}
      ${dayFormHTML()}
      <hr class="section-divider">
      <p class="section-title">${state.currentDate.slice(0, 7).replace('-', '년 ')}월 활동 기록</p>
      <div id="charts-slot">${chartsHTML()}</div>
    </main>
    ${footerHTML()}
    ${settingsHTML()}
    <div id="toast"></div>
  `;
}

function childTabsHTML() {
  return `
    <div class="child-tabs">
      ${DATA.children.map((c) => `<button data-id="${c.id}" class="${c.id === DATA.activeChildId ? 'active' : ''}">${c.avatar || '🧒'} ${escapeHTML(c.name)}</button>`).join('')}
    </div>
  `;
}

function dayFormHTML() {
  const isToday = state.currentDate === todayLocal();
  const enabled = DATA.activities.filter((a) => a.enabled);
  const childEntries = (DATA.entries[DATA.activeChildId] && DATA.entries[DATA.activeChildId][state.currentDate]) || {};

  if (enabled.length === 0) {
    return `
      <div class="empty-state">
        <div class="big">📝</div>
        활성화된 활동이 없어요.<br>설정에서 활동을 켜주세요.
      </div>
    `;
  }

  return `
    <div class="day-nav">
      <button class="nav-arrow" id="day-prev">‹</button>
      <span class="day-label">${formatDayLabel(state.currentDate)}</span>
      ${isToday ? '<span class="today-badge">오늘</span>' : ''}
      <button class="nav-arrow" id="day-next">›</button>
    </div>
    <form id="day-form">
      ${enabled.map((a) => activityRowHTML(a, childEntries[a.id])).join('')}
      <button type="submit" class="save-btn">저장하기</button>
      <div class="save-toast" id="save-toast"></div>
    </form>
  `;
}

function activityRowHTML(a, existing) {
  const label = `<div class="activity-label"><span class="emoji">${a.emoji}</span><span>${escapeHTML(a.name)}</span></div>`;
  if (a.mode === 'checkbox') {
    const checked = !!(existing && existing.amount);
    return `
      <div class="activity-row" data-activity="${a.id}" data-mode="checkbox">
        ${label}
        <label class="checkbox-field">
          <input type="checkbox" ${checked ? 'checked' : ''}>
          <span>완료 (${a.fixedAmount}${a.unit})</span>
        </label>
      </div>
    `;
  }
  const listId = `hist-${a.id}`;
  const historyOpts = (DATA.history[a.id] || []).map((v) => `<option value="${escapeHTML(v)}">`).join('');
  const currentContent = existing ? existing.content || '' : '';
  const presetChips = (a.presets || []).length
    ? `<div class="preset-chips">${a.presets.map((p) => `<button type="button" class="preset-chip${p === currentContent ? ' active' : ''}" data-preset-for="${a.id}" data-preset-value="${escapeHTML(p)}">${escapeHTML(p)}</button>`).join('')}</div>`
    : '';
  return `
    <div class="activity-row" data-activity="${a.id}" data-mode="input">
      ${label}
      ${presetChips}
      <div class="field-row">
        <input class="field-input" type="text" list="${listId}" placeholder="내용 (선택)" value="${existing ? escapeHTML(existing.content || '') : ''}">
        <datalist id="${listId}">${historyOpts}</datalist>
        <div class="field-number-wrap">
          <input class="field-number" type="number" min="0" inputmode="numeric" placeholder="0" value="${existing && existing.amount ? existing.amount : ''}">
          <span class="unit">${a.unit}</span>
        </div>
      </div>
    </div>
  `;
}

function bindMain() {
  document.getElementById('settings-open').addEventListener('click', openSettings);
  document.getElementById('share-open').addEventListener('click', shareApp);

  document.querySelectorAll('.child-tabs button').forEach((btn) => {
    btn.addEventListener('click', () => {
      DATA.activeChildId = btn.dataset.id;
      saveData();
      render();
    });
  });

  const prevBtn = document.getElementById('day-prev');
  const nextBtn = document.getElementById('day-next');
  if (prevBtn) prevBtn.addEventListener('click', () => { state.currentDate = addDays(state.currentDate, -1); render(); });
  if (nextBtn) nextBtn.addEventListener('click', () => { state.currentDate = addDays(state.currentDate, 1); render(); });

  const form = document.getElementById('day-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      saveDayForm();
    });
    form.querySelectorAll('.preset-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        const row = chip.closest('.activity-row');
        const input = row.querySelector('.field-input');
        const isActive = chip.classList.contains('active');
        input.value = isActive ? '' : chip.dataset.presetValue;
        row.querySelectorAll('.preset-chip').forEach((c) => c.classList.remove('active'));
        if (!isActive) chip.classList.add('active');
        row.querySelector('.field-number').focus();
      });
    });
  }

  renderInstallBanner();
  bindSettings();
}

function saveDayForm() {
  const childId = DATA.activeChildId;
  const date = state.currentDate;
  if (!DATA.entries[childId]) DATA.entries[childId] = {};
  if (!DATA.entries[childId][date]) DATA.entries[childId][date] = {};
  const dayEntries = DATA.entries[childId][date];

  document.querySelectorAll('.activity-row').forEach((row) => {
    const activityId = row.dataset.activity;
    const mode = row.dataset.mode;
    if (mode === 'checkbox') {
      const checked = row.querySelector('input[type="checkbox"]').checked;
      const activity = DATA.activities.find((a) => a.id === activityId);
      if (checked) {
        dayEntries[activityId] = { content: '완료', amount: activity.fixedAmount };
      } else {
        delete dayEntries[activityId];
      }
    } else {
      const content = row.querySelector('.field-input').value.trim();
      const amountRaw = row.querySelector('.field-number').value;
      const amount = amountRaw === '' ? 0 : Number(amountRaw);
      if (amount > 0) {
        dayEntries[activityId] = { content, amount };
        if (content) {
          if (!DATA.history[activityId]) DATA.history[activityId] = [];
          const hist = DATA.history[activityId];
          const idx = hist.indexOf(content);
          if (idx !== -1) hist.splice(idx, 1);
          hist.unshift(content);
          DATA.history[activityId] = hist.slice(0, 15);
        }
      } else {
        delete dayEntries[activityId];
      }
    }
  });

  if (Object.keys(dayEntries).length === 0) delete DATA.entries[childId][date];
  saveData();

  const toast = document.getElementById('save-toast');
  toast.textContent = '저장했어요!';
  setTimeout(() => { if (toast) toast.textContent = ''; }, 1800);

  document.getElementById('charts-slot').innerHTML = chartsHTML();
}

// ---------- charts ----------
function chooseStep(max) {
  const rough = Math.max(max, 1) / 4;
  const mag = Math.pow(10, Math.floor(Math.log10(rough)));
  const norm = rough / mag;
  let step;
  if (norm <= 1) step = 1 * mag;
  else if (norm <= 2) step = 2 * mag;
  else if (norm <= 5) step = 5 * mag;
  else step = 10 * mag;
  return Math.max(1, Math.round(step));
}

function chartsHTML(monthPrefix) {
  monthPrefix = monthPrefix || state.currentDate.slice(0, 7);
  const enabled = DATA.activities.filter((a) => a.enabled);
  if (enabled.length === 0) return '';
  const [year, month] = monthPrefix.split('-').map(Number);
  const total = daysInMonth(year, month - 1);
  const childId = DATA.activeChildId;
  const monthEntries = (DATA.entries[childId] && Object.keys(DATA.entries[childId])
    .filter((d) => d.startsWith(monthPrefix))) || [];

  if (monthEntries.length === 0) {
    return `<p class="chart-empty">이 달에 기록된 활동이 아직 없어요</p>`;
  }

  // 시간(분) 활동은 하나로, 그 외(장/줄/회 등 개수 단위) 활동은 전부 하나로 묶어서 차트 2개만 보여줌
  const groups = {};
  enabled.forEach((a) => {
    const key = a.unit === '분' ? '분' : '기타';
    (groups[key] = groups[key] || []).push(a);
  });

  const blocks = Object.entries(groups).map(([key, activities]) => chartBlockHTML(activities, key === '분' ? '분' : '', total, year, month, monthEntries)).filter(Boolean);
  if (blocks.length === 0) {
    return `<p class="chart-empty">이 달에 기록된 활동이 아직 없어요</p>`;
  }
  return blocks.join('');
}

function chartBlockHTML(activities, axisUnit, total, year, month, monthEntries) {
  const childId = DATA.activeChildId;
  const byDay = new Map();
  for (const dateStr of monthEntries) {
    const dayEntries = DATA.entries[childId][dateStr];
    const day = Number(dateStr.slice(8, 10));
    const row = {};
    let any = false;
    activities.forEach((a) => {
      const v = dayEntries[a.id];
      if (v && v.amount) { row[a.id] = v.amount; any = true; }
    });
    if (any) byDay.set(day, row);
  }

  if (byDay.size === 0) return '';

  const max = Math.max(1, ...[...byDay.values()].map((row) => Object.values(row).reduce((s, v) => s + v, 0)));
  const step = chooseStep(max);
  const axisMax = Math.ceil(max / step) * step + step;
  const ticks = [];
  for (let t = step; t <= axisMax; t += step) ticks.push(t);

  const legend = activities.map((a) => `<span class="item"><span class="dot" style="background:${a.color}"></span>${escapeHTML(a.name)}</span>`).join('');

  const yaxis = `
    <div class="chart-yaxis">
      <div class="track">
        ${ticks.map((t) => `<span class="tick" style="bottom:${(t / axisMax) * 100}%">${t}${axisUnit}</span>`).join('')}
      </div>
      <div class="bottom-spacer"></div>
    </div>
  `;

  const weekdayOf = (day) => new Date(year, month - 1, day).getDay();
  const bars = Array.from({ length: total }, (_, i) => i + 1).map((day) => {
    const row = byDay.get(day);
    const dayTotal = row ? Object.values(row).reduce((s, v) => s + v, 0) : 0;
    const wd = weekdayOf(day);
    const color = weekdayColor(wd);
    let fill = '';
    if (row) {
      const segs = activities.filter((a) => row[a.id]).map((a) => `<div style="height:${(row[a.id] / dayTotal) * 100}%;background:${a.color};" title="${escapeHTML(a.name)} ${row[a.id]}${a.unit}"></div>`).join('');
      fill = `<div class="chart-fill" style="height:${(dayTotal / axisMax) * 100}%">${segs}</div>`;
    }
    return `
      <div class="chart-day">
        <div class="chart-track">${fill}</div>
        <span class="d" style="color:${color}">${day}</span>
        <span class="w" style="color:${color}">${WEEKDAYS[wd]}</span>
      </div>
    `;
  }).join('');

  return `
    <div class="chart-block">
      <div class="chart-legend">${legend}</div>
      <div class="chart-scroll">
        ${yaxis}
        <div class="chart-bars">${bars}</div>
      </div>
    </div>
  `;
}

// ---------- settings ----------
let pendingDeleteId = null;

function confirmRowHTML(label, onConfirmAttr, onCancelAttr) {
  return `
    <div class="list-item confirm-row">
      <span class="name">${escapeHTML(label)} 삭제할까요?</span>
      <button class="mini-btn cancel" ${onCancelAttr}>취소</button>
      <button class="mini-btn danger" ${onConfirmAttr}>삭제</button>
    </div>
  `;
}

function settingsHTML() {
  return `
    <div class="settings-screen" id="settings-screen">
      <div class="settings-header">
        <button class="icon-btn" id="settings-close">←</button>
        <h2>설정</h2>
      </div>
      <div class="settings-body">
        <div class="settings-group">
          <p class="group-title">아이 관리</p>
          <div class="child-list">
            ${DATA.children.map((c) => (
              pendingDeleteId === c.id
                ? confirmRowHTML(c.name, `data-confirm-del-child="${c.id}"`, `data-cancel-del="1"`)
                : `
              <div class="list-item">
                <span class="emoji">${c.avatar || '🧒'}</span>
                <span class="name">${escapeHTML(c.name)}</span>
                <button class="edit-btn" data-edit-child="${c.id}">✎</button>
                <button class="del-btn" data-del-child="${c.id}">✕</button>
              </div>
            `
            )).join('')}
          </div>
          <button class="add-btn" id="child-add-open">+ 아이 추가</button>
          <div id="child-form-slot"></div>
        </div>

        <div class="settings-group">
          <p class="group-title">활동 관리 &middot; 자주 하는 것만 켜두세요</p>
          <div class="activity-list">
            ${DATA.activities.map((a) => (
              pendingDeleteId === a.id
                ? confirmRowHTML(a.name, `data-confirm-del-activity="${a.id}"`, `data-cancel-del="1"`)
                : `
              <div class="list-item">
                <span class="emoji">${a.emoji}</span>
                <span class="name">${escapeHTML(a.name)}<br><span class="meta">${a.mode === 'checkbox' ? `완료체크 · ${a.fixedAmount}${a.unit}` : `직접입력 · ${a.unit}${a.presets && a.presets.length ? ` · ${a.presets.length}개 프리셋` : ''}`}</span></span>
                <button class="toggle ${a.enabled ? 'on' : ''}" data-toggle-activity="${a.id}"></button>
                <button class="edit-btn" data-edit-activity="${a.id}">✎</button>
                <button class="del-btn" data-del-activity="${a.id}">✕</button>
              </div>
            `
            )).join('')}
          </div>
          <button class="add-btn" id="activity-add-open">+ 나만의 활동 추가</button>
          <div id="activity-form-slot"></div>
        </div>

        <div class="settings-group">
          <p class="group-title">데이터</p>
          <div class="data-actions">
            <button id="data-save-jpg">저장하기</button>
          </div>
          <div id="save-jpg-form-slot"></div>
          <div style="height:8px"></div>
          <div class="data-actions">
            <button id="data-reset" class="danger">전체 초기화</button>
          </div>
        </div>

        <div class="settings-note">
          이 기록은 이 기기(브라우저)에만 저장돼요. "저장하기"로 원하는 달의 활동 기록 그래프를 사진(JPG)으로 저장할 수 있어요.
        </div>
      </div>
    </div>
  `;
}

function openSettings() {
  document.getElementById('settings-screen').classList.add('open');
}
function closeSettings() {
  document.getElementById('settings-screen').classList.remove('open');
}

function bindSettings() {
  document.getElementById('settings-close').addEventListener('click', closeSettings);

  document.querySelectorAll('[data-del-child]').forEach((btn) => {
    btn.addEventListener('click', () => {
      pendingDeleteId = btn.dataset.delChild;
      render();
      openSettings();
    });
  });
  document.querySelectorAll('[data-confirm-del-child]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.confirmDelChild;
      DATA.children = DATA.children.filter((c) => c.id !== id);
      delete DATA.entries[id];
      if (DATA.activeChildId === id) DATA.activeChildId = null;
      pendingDeleteId = null;
      saveData();
      render();
      openSettings();
    });
  });

  function openChildForm(editing) {
    const slot = document.getElementById('child-form-slot');
    slot.innerHTML = `
      <div class="form-card">
        <div class="form-field">
          <label>아이 이름</label>
          <input id="child-new-name" type="text" maxlength="10" placeholder="예: 성빈" value="${editing ? escapeHTML(editing.name) : ''}">
        </div>
        ${genderPickerHTML(editing ? editing.avatar : null)}
        <div class="form-actions">
          <button class="secondary" id="child-form-cancel">취소</button>
          <button class="primary" id="child-form-save">${editing ? '저장' : '추가'}</button>
        </div>
      </div>
    `;
    const nameInput = document.getElementById('child-new-name');
    const getGender = bindGenderPicker(slot, editing ? editing.avatar : null);
    nameInput.focus();
    document.getElementById('child-form-cancel').addEventListener('click', () => { slot.innerHTML = ''; });
    document.getElementById('child-form-save').addEventListener('click', () => {
      const name = nameInput.value.trim();
      if (!name) { nameInput.focus(); return; }
      if (editing) {
        Object.assign(editing, { name, avatar: getGender() });
      } else {
        DATA.children.push({ id: uid(), name, avatar: getGender() });
      }
      saveData();
      render();
      openSettings();
    });
  }

  document.getElementById('child-add-open').addEventListener('click', () => openChildForm());
  document.querySelectorAll('[data-edit-child]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const c = DATA.children.find((x) => x.id === btn.dataset.editChild);
      openChildForm(c);
      document.getElementById('child-form-slot').scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  });

  document.querySelectorAll('[data-toggle-activity]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.toggleActivity;
      const a = DATA.activities.find((x) => x.id === id);
      a.enabled = !a.enabled;
      saveData();
      render();
      openSettings();
    });
  });

  document.querySelectorAll('[data-del-activity]').forEach((btn) => {
    btn.addEventListener('click', () => {
      pendingDeleteId = btn.dataset.delActivity;
      render();
      openSettings();
    });
  });
  document.querySelectorAll('[data-confirm-del-activity]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.confirmDelActivity;
      DATA.activities = DATA.activities.filter((a) => a.id !== id);
      pendingDeleteId = null;
      saveData();
      render();
      openSettings();
    });
  });
  document.querySelectorAll('[data-cancel-del]').forEach((btn) => {
    btn.addEventListener('click', () => {
      pendingDeleteId = null;
      render();
      openSettings();
    });
  });

  document.getElementById('activity-add-open').addEventListener('click', () => {
    document.getElementById('activity-form-slot').innerHTML = activityFormHTML();
    bindActivityForm();
  });

  document.querySelectorAll('[data-edit-activity]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const a = DATA.activities.find((x) => x.id === btn.dataset.editActivity);
      document.getElementById('activity-form-slot').innerHTML = activityFormHTML(a);
      bindActivityForm(a);
      document.getElementById('activity-form-slot').scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  });

  document.getElementById('data-save-jpg').addEventListener('click', openSaveJpgForm);

  document.getElementById('data-reset').addEventListener('click', (e) => {
    confirmAction(e.currentTarget, '한번 더 누르면 전체 초기화돼요', () => {
      localStorage.removeItem(STORAGE_KEY);
      DATA = loadData();
      state.currentDate = todayLocal();
      render();
    });
  });
}

const UNIT_OPTIONS = ['분', '장', '줄', '회', '개'];
const EMOJI_CHOICES = ['🎬', '🔊', '🎙️', '✏️', '📖', '📹', '📚', '🧩', '🎨', '🎵', '👂', '📝', '🔤', '🖊️', '🎧', '📺', '🗣️', '🧠', '⏰', '🃏'];

function activityFormHTML(editing) {
  const a = editing || {};
  const unitOpts = UNIT_OPTIONS.map((u) => `<option value="${u}" ${a.unit === u ? 'selected' : ''}>${u}</option>`).join('');
  return `
    <div class="form-card" data-editing-id="${editing ? editing.id : ''}">
      <div class="form-field">
        <label>이모지</label>
        <input id="act-emoji" type="text" maxlength="4" value="${escapeHTML(a.emoji || '📝')}" style="width:70px;text-align:center;">
        <div class="emoji-picker" id="act-emoji-picker">
          ${EMOJI_CHOICES.map((e) => `<button type="button" class="emoji-pick-btn${e === a.emoji ? ' active' : ''}" data-emoji="${e}">${e}</button>`).join('')}
        </div>
      </div>
      <div class="form-field">
        <label>활동 이름</label>
        <input id="act-name" type="text" maxlength="10" placeholder="예: 파닉스 연습" value="${escapeHTML(a.name || '')}">
      </div>
      <div class="form-field">
        <label>단위</label>
        <select id="act-unit">${unitOpts}</select>
      </div>
      <div class="form-field">
        <label>기록 방식</label>
        <select id="act-mode">
          <option value="input" ${a.mode !== 'checkbox' ? 'selected' : ''}>직접 입력 (내용 + 숫자)</option>
          <option value="checkbox" ${a.mode === 'checkbox' ? 'selected' : ''}>완료 체크 (항상 같은 시간/횟수)</option>
        </select>
      </div>
      <div class="form-field ${a.mode === 'checkbox' ? '' : 'hidden'}" id="act-fixed-wrap">
        <label>완료 시 자동 기록되는 값</label>
        <input id="act-fixed" type="number" min="1" placeholder="예: 25" value="${a.fixedAmount || ''}">
      </div>
      <div class="form-field ${a.mode === 'checkbox' ? 'hidden' : ''}" id="act-presets-wrap">
        <label>자주 쓰는 값 (선택, 예: 에픽)</label>
        <div class="preset-edit-row">
          <input id="act-preset-input" type="text" placeholder="추가할 값 입력">
          <button type="button" class="mini-btn cancel" id="act-preset-add">추가</button>
        </div>
        <div class="preset-chips" id="act-preset-list"></div>
      </div>
      <div class="form-actions">
        <button class="secondary" id="act-form-cancel">취소</button>
        <button class="primary" id="act-form-save">${editing ? '저장' : '추가'}</button>
      </div>
    </div>
  `;
}

function bindActivityForm(editing) {
  const modeSel = document.getElementById('act-mode');
  const fixedWrap = document.getElementById('act-fixed-wrap');
  const presetsWrap = document.getElementById('act-presets-wrap');
  let presets = (editing && editing.presets) ? [...editing.presets] : [];

  const emojiInput = document.getElementById('act-emoji');
  document.querySelectorAll('.emoji-pick-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      emojiInput.value = btn.dataset.emoji;
      document.querySelectorAll('.emoji-pick-btn').forEach((b) => b.classList.toggle('active', b === btn));
    });
  });

  function renderPresetChips() {
    document.getElementById('act-preset-list').innerHTML = presets.map((p, i) => `
      <button type="button" class="preset-chip" data-remove-preset="${i}">${escapeHTML(p)} ✕</button>
    `).join('');
    document.querySelectorAll('[data-remove-preset]').forEach((btn) => {
      btn.addEventListener('click', () => {
        presets.splice(Number(btn.dataset.removePreset), 1);
        renderPresetChips();
      });
    });
  }
  renderPresetChips();

  modeSel.addEventListener('change', () => {
    const isCheckbox = modeSel.value === 'checkbox';
    fixedWrap.classList.toggle('hidden', !isCheckbox);
    presetsWrap.classList.toggle('hidden', isCheckbox);
  });

  const presetInput = document.getElementById('act-preset-input');
  document.getElementById('act-preset-add').addEventListener('click', () => {
    const v = presetInput.value.trim();
    if (!v || presets.includes(v)) { presetInput.value = ''; return; }
    presets.push(v);
    presetInput.value = '';
    renderPresetChips();
  });
  presetInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); document.getElementById('act-preset-add').click(); }
  });

  document.getElementById('act-form-cancel').addEventListener('click', () => { document.getElementById('activity-form-slot').innerHTML = ''; });
  document.getElementById('act-form-save').addEventListener('click', () => {
    const name = document.getElementById('act-name').value.trim();
    if (!name) { document.getElementById('act-name').focus(); return; }
    const emoji = document.getElementById('act-emoji').value.trim() || '📝';
    const unit = document.getElementById('act-unit').value;
    const mode = modeSel.value;
    const fixedAmount = mode === 'checkbox' ? Number(document.getElementById('act-fixed').value || 0) || 1 : null;
    if (editing) {
      Object.assign(editing, { name, emoji, unit, mode, fixedAmount, presets: mode === 'checkbox' ? [] : presets });
    } else {
      const color = COLOR_PALETTE[DATA.activities.length % COLOR_PALETTE.length];
      DATA.activities.push({ id: uid(), name, emoji, unit, mode, fixedAmount, presets: mode === 'checkbox' ? [] : presets, enabled: true, color });
    }
    saveData();
    render();
    openSettings();
  });
}

function confirmAction(btn, confirmText, onConfirm) {
  if (btn.dataset.confirming === '1') {
    onConfirm();
    return;
  }
  const original = btn.textContent;
  btn.dataset.confirming = '1';
  btn.textContent = confirmText;
  setTimeout(() => {
    if (btn.dataset.confirming === '1') {
      btn.dataset.confirming = '0';
      btn.textContent = original;
    }
  }, 2500);
}

// ---------- save chart as jpg ----------
function availableMonths() {
  const entries = DATA.entries[DATA.activeChildId] || {};
  const months = new Set(Object.keys(entries).map((d) => d.slice(0, 7)));
  return [...months].sort().reverse();
}

function formatMonthLabel(monthPrefix) {
  const [y, m] = monthPrefix.split('-');
  return `${y}년 ${Number(m)}월`;
}

function openSaveJpgForm() {
  const slot = document.getElementById('save-jpg-form-slot');
  const months = availableMonths();
  if (months.length === 0) {
    slot.innerHTML = `<p class="settings-note">아직 저장된 기록이 없어요.</p>`;
    return;
  }
  slot.innerHTML = `
    <div class="form-card">
      <div class="form-field">
        <label>저장할 달</label>
        <select id="jpg-month-select">
          ${months.map((m) => `<option value="${m}">${formatMonthLabel(m)}</option>`).join('')}
        </select>
      </div>
      <div class="form-actions">
        <button class="secondary" id="jpg-form-cancel">취소</button>
        <button class="primary" id="jpg-form-save">저장</button>
      </div>
    </div>
  `;
  document.getElementById('jpg-form-cancel').addEventListener('click', () => { slot.innerHTML = ''; });
  document.getElementById('jpg-form-save').addEventListener('click', (e) => {
    const month = document.getElementById('jpg-month-select').value;
    saveChartAsJpg(month, e.currentTarget);
  });
}

function saveChartAsJpg(monthPrefix, btn) {
  if (typeof html2canvas === 'undefined') {
    showToast('저장 기능을 불러오지 못했어요. 인터넷 연결을 확인해주세요');
    return;
  }
  const chartHTML = chartsHTML(monthPrefix);
  if (!chartHTML || chartHTML.includes('chart-empty')) {
    showToast('이 달은 기록이 없어요');
    return;
  }
  const child = DATA.children.find((c) => c.id === DATA.activeChildId);
  const original = btn.textContent;
  btn.textContent = '저장 중...';
  btn.disabled = true;

  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;left:-9999px;top:0;width:800px;background:#FFF8F6;padding:20px;';
  container.innerHTML = `
    <p style="font-family:'Jalnan',sans-serif;font-weight:normal;font-size:18px;color:#E0567A;margin:0 0 4px;">${child ? `${child.avatar || '🧒'} ${escapeHTML(child.name)}` : ''}</p>
    <p style="font-size:13px;color:rgba(58,42,51,0.5);margin:0 0 16px;">${formatMonthLabel(monthPrefix)} 활동 기록</p>
    ${chartHTML}
  `;
  // 캡처 시 가로 스크롤 대신 전체 달(최대 31일)이 잘리지 않고 다 보이게 강제로 펼침
  container.querySelectorAll('.chart-scroll, .chart-bars').forEach((el) => { el.style.overflow = 'visible'; el.style.width = 'max-content'; });
  document.body.appendChild(container);

  html2canvas(container, { backgroundColor: '#FFF8F6', scale: 2 }).then((canvas) => {
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${child ? child.name : 'english-journal'}-${monthPrefix}.jpg`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      document.body.removeChild(container);
      document.getElementById('save-jpg-form-slot').innerHTML = '';
      showToast('사진으로 저장했어요');
    }, 'image/jpeg', 0.92);
  }).catch(() => {
    document.body.removeChild(container);
    btn.textContent = original;
    btn.disabled = false;
    showToast('저장에 실패했어요');
  });
}

// ---------- share ----------
function shareApp() {
  const url = location.href.split('#')[0];
  const shareData = {
    title: 'English Journal — 엄마표영어 기록장',
    text: '우리 아이 엄마표영어 활동을 기록하는 나만의 기록장이에요. 폰에 설치해서 써보세요!',
    url,
  };
  if (navigator.share) {
    navigator.share(shareData).catch(() => {});
    return;
  }
  const textarea = document.createElement('textarea');
  textarea.value = url;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  try { document.execCommand('copy'); showToast('링크를 복사했어요!'); } catch (e) { showToast('복사에 실패했어요'); }
  document.body.removeChild(textarea);
}

// ---------- toast ----------
function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove('show'), 2200);
}

// ---------- install banner ----------
let deferredInstallPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  renderInstallBanner();
});
window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  localStorage.setItem('2bme_installed', '1');
  renderInstallBanner();
});

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}
function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function renderInstallBanner() {
  const slot = document.getElementById('install-banner-slot');
  if (!slot) return;
  if (isStandalone() || localStorage.getItem('2bme_banner_dismissed') === '1') {
    slot.innerHTML = '';
    return;
  }
  if (deferredInstallPrompt) {
    slot.innerHTML = `
      <div class="install-banner">
        <span class="txt">홈 화면에 추가해서 앱처럼 써보세요 📲</span>
        <button id="install-now">추가하기</button>
        <button class="close-x" id="install-dismiss">✕</button>
      </div>
    `;
    document.getElementById('install-now').addEventListener('click', async () => {
      deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;
      renderInstallBanner();
    });
    document.getElementById('install-dismiss').addEventListener('click', () => {
      localStorage.setItem('2bme_banner_dismissed', '1');
      renderInstallBanner();
    });
  } else if (isIOS()) {
    slot.innerHTML = `
      <div class="install-banner">
        <span class="txt">공유 버튼(<b>⬆️</b>)을 누른 뒤 "홈 화면에 추가"를 눌러보세요</span>
        <button class="close-x" id="install-dismiss">✕</button>
      </div>
    `;
    document.getElementById('install-dismiss').addEventListener('click', () => {
      localStorage.setItem('2bme_banner_dismissed', '1');
      renderInstallBanner();
    });
  } else {
    slot.innerHTML = '';
  }
}

// ---------- util ----------
function escapeHTML(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ---------- visit counter ----------
// 앱 안에는 표시 안 함(2bin님만 링크로 비공개 확인) - 개인정보 없이 방문 횟수만 조용히 집계
function trackVisit() {
  fetch('https://abacus.jasoncameron.dev/hit/2binmom-english-journal/visits').catch(() => {});
}

// ---------- service worker ----------
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}

// ---------- init ----------
render();
trackVisit();
