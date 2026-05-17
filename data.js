/* ═══════════════════════════════════════════════
   DATA LAYER — fuente única de verdad
═══════════════════════════════════════════════ */
const DATA = {
  team: [
    { id:'t1', name:'Ana García',  initials:'AG', color:'#1a5fe4' },
    { id:'t2', name:'Carlos Vega', initials:'CV', color:'#00a872' },
    { id:'t3', name:'María Liu',   initials:'ML', color:'#a78bfa' },
  ],
  epics: [
    { id:'e1', name:'Auth & Security', color:'#ff4b6e' },
    { id:'e2', name:'Dashboard UX',    color:'#f59e0b' },
    { id:'e3', name:'AI Integration',  color:'#00e5a0' },
  ],
  sprints: [
    {
      id:'sp1', name:'Sprint 1', status:'done',
      goal:'Establecer base de autenticación y CI/CD',
      start:'2026-04-14', end:'2026-04-27', capacity:34,
      committed:34, completed:30
    },
    {
      id:'sp2', name:'Sprint 2', status:'active',
      goal:'Implementar MFA y dashboard principal con métricas reales',
      start:'2026-04-28', end:'2026-05-11', capacity:42,
      committed:38, completed:0
    },
  ],
  activeSprint: 'sp2',
  items: [
    { id:'i1',  title:'Login con email y password',          desc:'Flujo básico de autenticación con JWT.',    type:'feature', priority:'critical', points:5,  status:'done',   sprintId:'sp1', epic:'e1', assignee:'t1', ac:'✅ Token válido 1h\n✅ Refresh token 7d\n✅ Rate limit 10 req/min' },
    { id:'i2',  title:'Configurar pipeline CI/CD',           desc:'GitHub Actions + deploy a staging.',        type:'tech',    priority:'high',     points:8,  status:'done',   sprintId:'sp1', epic:null,  assignee:'t2', ac:'✅ Tests pasan en < 3min\n✅ Deploy auto a staging' },
    { id:'i3',  title:'Implementar MFA con TOTP',            desc:'MFA SOC2-compliant para todos los usuarios.', type:'feature', priority:'critical', points:13, status:'inprogress', sprintId:'sp2', epic:'e1', assignee:'t1', ac:'✅ TOTP válido 5min\n✅ Máx 3 intentos\n✅ Audit log' },
    { id:'i4',  title:'Widget de métricas del sprint',       desc:'Card con burndown mini + pts restantes.',   type:'feature', priority:'high',     points:5,  status:'todo',   sprintId:'sp2', epic:'e2', assignee:'t3', ac:'✅ Se actualiza en tiempo real\n✅ Responsive mobile' },
    { id:'i5',  title:'Notificación login nuevo dispositivo',desc:'Email alert al detectar IP/UA desconocido.',type:'feature', priority:'high',     points:5,  status:'todo',   sprintId:'sp2', epic:'e1', assignee:'t2', ac:'✅ Email en < 30s\n✅ Link de revocación' },
    { id:'i6',  title:'Fix: sesión expirada sin feedback',   desc:'El usuario ve pantalla blanca en timeout.',  type:'bug',     priority:'critical', points:2,  status:'review', sprintId:'sp2', epic:'e1', assignee:'t1', ac:'✅ Muestra modal "Sesión expirada"\n✅ Redirige a login' },
    { id:'i7',  title:'Dark mode persistente',               desc:'Toggle dark/light que sobrevive reload.',   type:'feature', priority:'medium',   points:3,  status:'todo',   sprintId:'sp2', epic:'e2', assignee:'t3', ac:'✅ Guarda en localStorage\n✅ Sin FOUC' },
    { id:'i8',  title:'Integrar Alpaquitay como co-pilot',   desc:'Bridge VS Code → scrum board via WebView.',  type:'spike',   priority:'high',     points:8,  status:'todo',   sprintId:null,  epic:'e3', assignee:'t2', ac:'✅ Detección auto de extensión\n✅ Fallback mock\n✅ API documentada' },
    { id:'i9',  title:'Exportar sprint a SPEC.md',           desc:'Generar documento spec desde epic activo.', type:'feature', priority:'medium',   points:5,  status:'todo',   sprintId:null,  epic:'e3', assignee:null,  ac:'✅ Formato estándar SPEC\n✅ Descarga como .md' },
    { id:'i10', title:'Análisis de deuda técnica',           desc:'Spike: evaluar dependencias desactualizadas.',type:'spike',  priority:'low',      points:3,  status:'todo',   sprintId:null,  epic:null,  assignee:null,  ac:'' },
  ],
};

/* ═══════════════════════════════════════════════
   STATE
═══════════════════════════════════════════════ */
let STATE = {};
function initState() {
  const saved = localStorage.getItem('scrumState');
  STATE = saved ? JSON.parse(saved) : JSON.parse(JSON.stringify(DATA));
}
function persist() { localStorage.setItem('scrumState', JSON.stringify(STATE)); }

/* ═══════════════════════════════════════════════
   ALPAQUITAY BRIDGE
═══════════════════════════════════════════════ */
const AQ = {
  connected: false,
  init() {
    if (window.__alpaquitay) {
      this.connected = true;
      window.__alpaquitay.on('message', (msg) => this._handle(msg));
    }
    this._updateBadge();
  },
  _updateBadge() {
    const dot = document.getElementById('aqDot');
    const lbl = document.getElementById('aqLabel');
    if (dot) dot.classList.toggle('on', this.connected);
    if (lbl) lbl.textContent = this.connected ? 'Alpaquitay ●' : 'Alpaquitay';
  },
  _handle(msg) { },
  send(type, payload) {
    if (this.connected && window.__alpaquitay) {
      window.__alpaquitay.send({ type, payload });
    }
  },
  async ask(prompt) {
    if (this.connected && window.__alpaquitay) {
      return await window.__alpaquitay.ask(prompt);
    }
    return this._mock(prompt);
  },
  _mock(prompt) {
    const responses = {
      estimate: `✦ Estimación sugerida: **5 puntos**\n\nJustificación:\n→ Complejidad media: lógica de negocio clara\n→ Sin dependencias externas bloqueantes\n→ Criterios de aceptación bien definidos\n→ Referencia: tareas similares completadas en 1.5 días`,
      refine: `✦ Historia refinada:\n\nComo desarrollador, quiero que el sistema valide automáticamente los criterios antes de mover una tarea a "Done", para garantizar calidad consistente.\n\nCriterios de aceptación:\n✅ Dado que una tarea está en "In Review"\n   Cuando el dev la mueve a "Done"\n   Entonces el sistema verifica que todos los ACs están marcados\n✅ Si hay ACs incompletos → bloquear movimiento con mensaje descriptivo\n✅ Log de validación disponible en el historial de la tarea`,
      health: `✦ Análisis de salud del sprint:\n\n📊 Estado: Sprint al 60% del tiempo\n→ 3 tareas bloqueadas en "Review" — revisar si hay dependencias\n→ MFA (13pts) lleva 5 días en progreso → posible riesgo de no completar\n→ Velocidad promedio del equipo: 30pts → sprint comprometido en 38pts (127%)\n\n🚨 Recomendaciones:\n1. Reducir scope: mover "Dark mode" al backlog (3pts)\n2. Ana García tiene 18pts asignados — redistribuir 1 tarea a Carlos\n3. Hacer un mini-retro sobre el bug de sesión expirada antes del sprint review`,
      spec: `✦ SPEC generada para el sprint activo:\n\n# SPEC: Sprint 2 — Auth & Dashboard\n\n## Contexto\nSprint de 14 días, capacidad 42pts, objetivo: MFA compliant y dashboard de métricas.\n\n## Entregables\n- MFA TOTP SOC2-compliant (13pts)\n- Widget métricas en tiempo real (5pts)\n- Notificación nuevo dispositivo (5pts)\n- Fix sesión expirada (2pts)\n\n## Criterios de salida del sprint\n✅ Pentesting sin bypass MFA\n✅ Cobertura tests >85%\n✅ Lighthouse performance >90\n✅ Zero P0 bugs en staging`,
      backlog: `✦ Análisis del backlog:\n\n10 historias totales · 24pts sin sprint asignado\n\n🔍 Recomendaciones de priorización:\n1. "Integrar Alpaquitay" (8pts) → candidata próximo sprint — high value, enabler de otras features\n2. "Exportar SPEC.md" (5pts) → habilita SDD completo, sugiero Sprint 3\n3. "Deuda técnica" (3pts) → agrupar con otras tareas técnicas en sprint dedicado\n\n⚠️ Riesgos detectados:\n→ i8 no tiene assignee → asignar antes de Sprint 3\n→ i9 depende de i8 completado`,
    };
    const key = Object.keys(responses).find(k => prompt.includes(k)) || 'health';
    return new Promise(res => setTimeout(() => res(responses[key] || responses.health), 900));
  }
};

/* ═══════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════ */
function getActiveSprint() {
  return STATE.sprints.find(s => s.id === STATE.activeSprint);
}
function getSprintItems(sprintId) {
  return STATE.items.filter(i => i.sprintId === sprintId);
}
function getTeamMember(id) { return STATE.team.find(t => t.id === id); }
function getEpic(id) { return STATE.epics.find(e => e.id === id); }
function typeTag(t) {
  const map = { feature:'tag-feature Feature', bug:'tag-bug Bug', tech:'tag-tech Tech', spike:'tag-spike Spike', epic:'tag-epic Epic' };
  const [cls, label] = (map[t]||'tag-feature Feature').split(' ');
  return `<span class="tag ${cls}">${label}</span>`;
}
function priorityDot(p) {
  const cls = {critical:'p-c',high:'p-h',medium:'p-m',low:'p-l'}[p]||'p-m';
  return `<span class="pdot ${cls}" title="${p}"></span>`;
}
function avatarEl(memberId) {
  const m = getTeamMember(memberId);
  if (!m) return '';
  return `<div class="avatar" style="background:${m.color}20;color:${m.color}">${m.initials}</div>`;
}
function uid() { return 'i' + Date.now() + Math.random().toString(36).slice(2,6); }

/* ═══════════════════════════════════════════════
   TOAST
═══════════════════════════════════════════════ */
function toast(msg, type='ok') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${type==='ok'?'✓':'✕'}</span>${msg}`;
  document.getElementById('toasts').appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

/* ═══════════════════════════════════════════════
   RENDER: BOARD
═══════════════════════════════════════════════ */
const COLUMNS = [
  { id:'backlog',    label:'Backlog',     filter: i => !i.sprintId },
  { id:'todo',       label:'Por Hacer',   filter: i => i.sprintId === STATE.activeSprint && i.status==='todo' },
  { id:'inprogress', label:'En Progreso', filter: i => i.sprintId === STATE.activeSprint && i.status==='inprogress' },
  { id:'review',     label:'En Review',   filter: i => i.sprintId === STATE.activeSprint && i.status==='review' },
  { id:'done',       label:'Completado',  filter: i => i.sprintId === STATE.activeSprint && i.status==='done' },
];

function renderBoard() {
  const sprint = getActiveSprint();
  if (!sprint) return;
  document.getElementById('sprintName').textContent = sprint.name;
  document.getElementById('sprintGoal').textContent = sprint.goal;

  const spItems = getSprintItems(sprint.id);
  const pts = {
    total: spItems.reduce((a,i) => a+i.points, 0),
    done: spItems.filter(i=>i.status==='done').reduce((a,i)=>a+i.points,0),
    remaining: spItems.filter(i=>i.status!=='done').reduce((a,i)=>a+i.points,0),
    tasks: spItems.length
  };
  document.getElementById('sprintStats').innerHTML = [
    { val: pts.total, lbl:'Pts Sprint' },
    { val: pts.done, lbl:'Completados' },
    { val: pts.remaining, lbl:'Restantes' },
    { val: pts.tasks, lbl:'Historias' },
  ].map(s => `<div class="s-stat"><div class="val">${s.val}</div><div class="lbl">${s.lbl}</div></div>`).join('');

  document.getElementById('board').innerHTML = COLUMNS.map(col => {
    const items = STATE.items.filter(col.filter);
    return `
      <div class="col" id="col-${col.id}" ondrop="onDrop(event,'${col.id}')" ondragover="onDragOver(event)">
        <div class="col-hd">
          <span class="col-title">${col.label}</span>
          <span class="col-badge">${items.length}</span>
        </div>
        <div class="col-add">
          <button onclick="openModal('task',null,'${col.id}')">+ añadir</button>
        </div>
        <div class="col-body" id="colbody-${col.id}">
          ${items.length ? items.map(renderTaskCard).join('') : `<div class="empty"><div class="eicon">◻</div><p>Sin tareas</p></div>`}
        </div>
      </div>`;
  }).join('');
}

function renderTaskCard(item) {
  const m = getTeamMember(item.assignee);
  const epic = getEpic(item.epic);
  return `
    <div class="task" id="task-${item.id}" draggable="true"
      ondragstart="onDragStart(event,'${item.id}')"
      ondragend="onDragEnd(event)">
      <div class="task-top">
        <div style="display:flex;gap:4px;flex-wrap:wrap;align-items:center">
          ${priorityDot(item.priority)}
          ${typeTag(item.type)}
          ${epic ? `<span class="tag" style="background:${epic.color}22;color:${epic.color}">${epic.name}</span>` : ''}
        </div>
        <span class="task-pts">${item.points}pt</span>
      </div>
      <div class="task-title">${item.title}</div>
      ${item.desc ? `<div class="task-desc">${item.desc}</div>` : ''}
      <div class="task-foot">
        <div class="assignee-chip">
          ${m ? `${avatarEl(item.assignee)}<span>${m.name.split(' ')[0]}</span>` : '<span style="color:var(--muted)">Sin asignar</span>'}
        </div>
        <div class="task-actions">
          <button class="t-btn ai" onclick="aqTaskAnalysis('${item.id}')" title="Analizar con AI">✦</button>
          <button class="t-btn" onclick="openModal('task','${item.id}')" title="Editar">✎</button>
          <button class="t-btn del" onclick="deleteTask('${item.id}')" title="Eliminar">✕</button>
        </div>
      </div>
    </div>`;
}

/* ═══════════════════════════════════════════════
   RENDER: BACKLOG
═══════════════════════════════════════════════ */
function renderBacklog() {
  document.getElementById('backlogHead').innerHTML =
    ['Prioridad','Historia','Tipo','Puntos','Epic','Asignado','Sprint',''].map(h=>`<th>${h}</th>`).join('');
  const rows = STATE.items
    .sort((a,b) => ['critical','high','medium','low'].indexOf(a.priority) - ['critical','high','medium','low'].indexOf(b.priority))
    .map(item => {
      const m = getTeamMember(item.assignee);
      const ep = getEpic(item.epic);
      const sp = STATE.sprints.find(s=>s.id===item.sprintId);
      return `<tr class="${item.sprintId?'in-sprint':''}">
        <td>${priorityDot(item.priority)} <span style="font-size:10px;color:var(--muted-lt)">${item.priority}</span></td>
        <td style="max-width:280px"><div style="font-weight:600;font-size:12px">${item.title}</div>
          ${item.desc?`<div style="font-size:11px;color:var(--muted);margin-top:2px">${item.desc.slice(0,80)}${item.desc.length>80?'…':''}</div>`:''}
        </td>
        <td>${typeTag(item.type)}</td>
        <td><span style="font-family:var(--mono);color:var(--signal)">${item.points}</span></td>
        <td>${ep?`<span class="tag" style="background:${ep.color}22;color:${ep.color}">${ep.name}</span>`:'-'}</td>
        <td>${m?`<div class="assignee-chip">${avatarEl(item.assignee)}<span>${m.name.split(' ')[0]}</span></div>`:'<span style="color:var(--muted)">—</span>'}</td>
        <td>${sp?`<span class="bdg bdg-g">${sp.name}</span>`:`<span class="bdg bdg-gray">backlog</span>`}</td>
        <td><div style="display:flex;gap:4px">
          <button class="t-btn ai" onclick="aqTaskAnalysis('${item.id}')">✦</button>
          <button class="t-btn" onclick="openModal('task','${item.id}')">✎</button>
          <button class="t-btn del" onclick="deleteTask('${item.id}')">✕</button>
        </div></td>
      </tr>`;
    });
  document.getElementById('backlogBody').innerHTML = rows.join('');
}

/* ═══════════════════════════════════════════════
   RENDER: MÉTRICAS
═══════════════════════════════════════════════ */
let burndownChart = null;
function renderMetricas() {
  renderBurndown();
  renderVelocity();
}

function renderBurndown() {
  const sprint = getActiveSprint();
  if (!sprint) return;
  const items = getSprintItems(sprint.id);
  const total = items.reduce((a,i) => a+i.points, 0);
  const doneCount = items.filter(i=>i.status==='done').length;
  const days = 14;
  const labels = Array.from({length:days}, (_,i) => `D${i+1}`);
  const ideal = Array.from({length:days}, (_,i) => Math.round(total - (total/days)*(i+1)));
  const actual = Array(days).fill(null);
  const currentDay = Math.min(days-1, Math.floor(doneCount * (days/Math.max(items.length,1))));
  const remaining = items.filter(i=>i.status!=='done').reduce((a,i)=>a+i.points,0);
  actual[0] = total;
  if (currentDay > 0) actual[currentDay] = remaining;

  const ctx = document.getElementById('burndownCanvas').getContext('2d');
  if (burndownChart) burndownChart.destroy();
  burndownChart = new Chart(ctx, {
    type:'line',
    data: {
      labels,
      datasets: [
        { label:'Restantes', data:actual, borderColor:'#ff4b6e', backgroundColor:'rgba(255,75,110,.1)', fill:true, tension:.3, pointRadius:3, spanGaps:true },
        { label:'Ideal',     data:ideal,  borderColor:'rgba(0,229,160,.5)', borderDash:[4,4], fill:false, pointRadius:0 }
      ]
    },
    options: {
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{ labels:{ color:'#9ca3af', font:{ size:11 } } } },
      scales:{
        y:{ beginAtZero:true, grid:{ color:'rgba(255,255,255,.06)' }, ticks:{ color:'#9ca3af', font:{size:10} } },
        x:{ grid:{ color:'rgba(255,255,255,.04)' }, ticks:{ color:'#9ca3af', font:{size:10} } }
      }
    }
  });
}

function renderVelocity() {
  const maxPts = Math.max(...STATE.sprints.map(s => s.committed || 0), 1);
  document.getElementById('velBars').innerHTML = STATE.sprints.map(sp => {
    const cmt = Math.round((sp.committed/maxPts)*100);
    const cpl = Math.round((sp.completed/maxPts)*100);
    return `<div class="vel-group">
      <div class="vel-bar-row">
        <div class="vel-bar vb-cmt" style="height:${cmt}px" title="${sp.committed}pts comprometidos"></div>
        <div class="vel-bar vb-cpl" style="height:${cpl}px" title="${sp.completed}pts completados"></div>
      </div>
      <div class="vel-lbl">${sp.name.replace('Sprint ','S')}</div>
    </div>`;
  }).join('');
}

/* ═══════════════════════════════════════════════
   RENDER: PLANNING
═══════════════════════════════════════════════ */
function renderPlanning() {
  const sprint = getActiveSprint();
  const used = sprint ? getSprintItems(sprint.id).reduce((a,i)=>a+i.points,0) : 0;
  const capacity = sprint?.capacity || 40;
  const pct = Math.min(Math.round((used/capacity)*100), 100);

  document.getElementById('teamCapacity').innerHTML = `
    <div style="margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px">
        <span>Sprint actual</span>
        <span style="font-family:var(--mono);color:${used>capacity?'var(--accent)':'var(--signal)'}">${used}/${capacity} pts</span>
      </div>
      <div class="cap-bar"><div class="cap-fill${used>capacity?' over':''}" style="width:${pct}%"></div></div>
    </div>
    ${STATE.team.map(m => {
      const assigned = STATE.items.filter(i=>i.assignee===m.id&&i.sprintId===STATE.activeSprint).reduce((a,i)=>a+i.points,0);
      const maxLoad = 20;
      const mpct = Math.min(Math.round((assigned/maxLoad)*100),100);
      return `<div style="margin-bottom:10px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:3px">
          ${avatarEl(m.id)}<span style="font-size:12px">${m.name}</span>
          <span style="margin-left:auto;font-family:var(--mono);font-size:11px;color:${assigned>maxLoad?'var(--accent)':'var(--muted-lt)'}">${assigned}pts</span>
        </div>
        <div class="cap-bar"><div class="cap-fill${assigned>maxLoad?' over':''}" style="width:${mpct}%"></div></div>
      </div>`;
    }).join('')}
  `;

  const candidates = STATE.items.filter(i => !i.sprintId)
    .sort((a,b) => ['critical','high','medium','low'].indexOf(a.priority) - ['critical','high','medium','low'].indexOf(b.priority));

  document.getElementById('candidateItems').innerHTML = candidates.length ? candidates.map(item => `
    <div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--border)">
      ${priorityDot(item.priority)}
      <div style="flex:1;font-size:12px;font-weight:600">${item.title}</div>
      <span style="font-family:var(--mono);font-size:11px;color:var(--signal)">${item.points}pt</span>
      <button class="btn btn-sm btn-o" onclick="addToSprint('${item.id}')">→ Sprint</button>
    </div>`).join('') :
    `<div class="empty"><div class="eicon">✓</div><p>Backlog vacío — todo está en un sprint</p></div>`;
}

function addToSprint(itemId) {
  const item = STATE.items.find(i => i.id === itemId);
  if (item) { item.sprintId = STATE.activeSprint; item.status = 'todo'; }
  persist();
  rerenderCurrent();
  toast(`"${item.title.slice(0,30)}..." añadida al sprint`);
}

/* ═══════════════════════════════════════════════
   RENDER: ALPAQUITAY PAGE
═══════════════════════════════════════════════ */
function renderAlpaquitayPage() {
  document.getElementById('aqStatus').innerHTML = `
    <div class="aq-badge" style="cursor:default">
      <div class="aq-dot ${AQ.connected?'on':''}"></div>
      <span>${AQ.connected ? 'Conectado a VS Code' : 'Modo simulación'}</span>
    </div>`;

  const panels = [
    { icon:'✦', title:'Analizar sprint actual', desc:'Obtiene recomendaciones de salud del sprint, detecta riesgos de no entrega y sugiere redistribución de carga.', action:'aqSprintHealth()', label:'Analizar sprint' },
    { icon:'📋', title:'Refinar backlog', desc:'Prioriza automáticamente el backlog según valor de negocio, dependencias técnicas y velocidad histórica del equipo.', action:'aqAnalyzeBacklog()', label:'Analizar backlog' },
    { icon:'📄', title:'Generar SPEC del sprint', desc:'Exporta el sprint activo como documento SPEC.md estructurado, listo para ser versionado en Git junto al código.', action:'aqGenerateSpec()', label:'Generar SPEC' },
    { icon:'⚡', title:'Estimar historia', desc:'Selecciona una historia del backlog y recibe estimación en Fibonacci con justificación basada en complejidad y referencias históricas.', action:"openModal('task',null,'backlog')", label:'Abrir historia' },
  ];

  document.getElementById('aqPanels').innerHTML = panels.map(p => `
    <div class="ai-panel">
      <div class="ai-panel-title">${p.icon} ${p.title}</div>
      <p style="font-size:12px;color:var(--muted-lt);margin-bottom:14px">${p.desc}</p>
      <button class="btn btn-ai btn-sm" onclick="${p.action}">${p.label}</button>
    </div>`).join('');
}

/* ═══════════════════════════════════════════════
   ALPAQUITAY ACTIONS
═══════════════════════════════════════════════ */
async function aqSprintHealth() {
  const msgEl = document.getElementById('aiSprintMsg');
  if (msgEl) { msgEl.textContent = '⏳ Analizando sprint...'; msgEl.style.opacity='.5'; }
  const sprint = getActiveSprint();
  const items = getSprintItems(sprint?.id || '');
  const result = await AQ.ask(`health sprint "${sprint?.name}" items:${items.length} done:${items.filter(i=>i.status==='done').length}`);
  if (msgEl) { msgEl.textContent = result; msgEl.style.opacity='1'; }
}

async function aqAnalyzeBacklog() {
  const backlog = STATE.items.filter(i=>!i.sprintId);
  const result = await AQ.ask(`backlog analysis ${backlog.length} items`);
  const msgEl = document.getElementById('aiSprintMsg');
  if (msgEl) msgEl.textContent = result;
  toast('Análisis de backlog completado');
}

async function aqGenerateSpec() {
  const sprint = getActiveSprint();
  const result = await AQ.ask(`spec sprint "${sprint?.name}"`);
  const msgEl = document.getElementById('aiSprintMsg');
  if (msgEl) msgEl.textContent = result;

  const blob = new Blob([result.replace(/✦|📊|🚨|⚠️/g,'').trim()], { type:'text/markdown' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `SPEC-${sprint?.name.replace(/\s+/g,'-')}.md`;
  a.click();
  toast('SPEC generada y descargada');
}

async function aqTaskAnalysis(itemId) {
  const item = STATE.items.find(i=>i.id===itemId);
  if (!item) return;
  const result = await AQ.ask(`refine "${item.title}" ${item.points}pts ${item.type}`);
  const msgEl = document.getElementById('aiSprintMsg');
  if (msgEl) msgEl.textContent = result;
  toast(`Análisis de "${item.title.slice(0,25)}..." completado`);
}

async function aqEstimate() {
  const title = document.getElementById('tTitle').value;
  if (!title) { toast('Escribe el título primero', 'err'); return; }
  const result = await AQ.ask(`estimate "${title}"`);
  const match = result.match(/\*\*(\d+) puntos\*\*/);
  if (match) document.getElementById('tPoints').value = match[1];
  toast('Estimación sugerida: ' + (match?match[1]+'pts':'ver resultado'));
}

async function aqRefineTask() {
  const title = document.getElementById('tTitle').value;
  if (!title) { toast('Escribe el título primero', 'err'); return; }
  const result = await AQ.ask(`refine "${title}"`);
  const acEl = document.getElementById('tAC');
  if (acEl && result.includes('✅')) {
    acEl.value = result.split('\n').filter(l=>l.includes('✅')||l.includes('Dado')||l.includes('Cuando')||l.includes('Entonces')).join('\n');
  }
  toast('Historia refinada por Alpaquitay');
}

/* ═══════════════════════════════════════════════
   MODAL: TASK
═══════════════════════════════════════════════ */
let editingTaskId = null;
let defaultColumn = 'todo';

function openModal(type, id=null, col='todo') {
  if (type === 'task') {
    editingTaskId = id;
    defaultColumn = col;
    document.getElementById('taskModalTitle').textContent = id ? 'Editar Historia' : 'Nueva Historia';

    document.getElementById('tAssignee').innerHTML =
      `<option value="">Sin asignar</option>` +
      STATE.team.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
    document.getElementById('tEpic').innerHTML =
      `<option value="">Sin epic</option>` +
      STATE.epics.map(e => `<option value="${e.id}">${e.name}</option>`).join('');

    if (id) {
      const item = STATE.items.find(i=>i.id===id);
      if (item) {
        document.getElementById('tType').value = item.type;
        document.getElementById('tPriority').value = item.priority;
        document.getElementById('tTitle').value = item.title;
        document.getElementById('tDesc').value = item.desc;
        document.getElementById('tPoints').value = item.points;
        document.getElementById('tAssignee').value = item.assignee||'';
        document.getElementById('tEpic').value = item.epic||'';
        document.getElementById('tAC').value = item.ac||'';
      }
    } else {
      ['tTitle','tDesc','tAC'].forEach(id => document.getElementById(id).value = '');
      document.getElementById('tType').value = 'feature';
      document.getElementById('tPriority').value = 'medium';
      document.getElementById('tPoints').value = '5';
      document.getElementById('tAssignee').value = '';
      document.getElementById('tEpic').value = '';
    }
    document.getElementById('taskOverlay').classList.add('open');
  } else if (type === 'sprint') {
    const today = new Date().toISOString().split('T')[0];
    const end = new Date(Date.now() + 14*86400000).toISOString().split('T')[0];
    document.getElementById('sStart').value = today;
    document.getElementById('sEnd').value = end;
    document.getElementById('sName').value = `Sprint ${STATE.sprints.length + 1}`;
    document.getElementById('sGoal').value = '';
    document.getElementById('sprintOverlay').classList.add('open');
  }
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

function saveTask() {
  const title = document.getElementById('tTitle').value.trim();
  if (!title) { toast('El título es obligatorio', 'err'); return; }

  const statusMap = { backlog:null, todo:'todo', inprogress:'inprogress', review:'review', done:'done' };
  const col = defaultColumn;

  if (editingTaskId) {
    const item = STATE.items.find(i=>i.id===editingTaskId);
    if (item) {
      item.type = document.getElementById('tType').value;
      item.priority = document.getElementById('tPriority').value;
      item.title = title;
      item.desc = document.getElementById('tDesc').value;
      item.points = parseInt(document.getElementById('tPoints').value);
      item.assignee = document.getElementById('tAssignee').value || null;
      item.epic = document.getElementById('tEpic').value || null;
      item.ac = document.getElementById('tAC').value;
    }
  } else {
    const newItem = {
      id: uid(),
      type: document.getElementById('tType').value,
      priority: document.getElementById('tPriority').value,
      title,
      desc: document.getElementById('tDesc').value,
      points: parseInt(document.getElementById('tPoints').value),
      status: col === 'backlog' ? 'todo' : (col || 'todo'),
      sprintId: col === 'backlog' ? null : STATE.activeSprint,
      assignee: document.getElementById('tAssignee').value || null,
      epic: document.getElementById('tEpic').value || null,
      ac: document.getElementById('tAC').value,
    };
    STATE.items.push(newItem);
  }

  persist();
  closeModal('taskOverlay');
  rerenderCurrent();
  toast(editingTaskId ? 'Historia actualizada' : 'Historia creada');
}

function deleteTask(id) {
  STATE.items = STATE.items.filter(i => i.id !== id);
  persist();
  rerenderCurrent();
  toast('Historia eliminada');
}

function saveSprint() {
  const name = document.getElementById('sName').value.trim();
  if (!name) { toast('Nombre requerido', 'err'); return; }

  const newSprint = {
    id: 'sp' + Date.now(),
    name,
    goal: document.getElementById('sGoal').value,
    start: document.getElementById('sStart').value,
    end: document.getElementById('sEnd').value,
    capacity: parseInt(document.getElementById('sCapacity').value) || 40,
    status: 'active',
    committed: 0,
    completed: 0,
  };
  STATE.sprints.forEach(s => { if (s.status === 'active') s.status = 'done'; });
  STATE.sprints.push(newSprint);
  STATE.activeSprint = newSprint.id;
  persist();
  closeModal('sprintOverlay');
  rerenderCurrent();
  toast(`${name} activado`);
}

/* ═══════════════════════════════════════════════
   DRAG & DROP
═══════════════════════════════════════════════ */
let draggingId = null;
function onDragStart(ev, id) {
  draggingId = id;
  ev.dataTransfer.effectAllowed = 'move';
  document.getElementById('task-'+id)?.classList.add('dragging');
}
function onDragEnd(ev) {
  document.querySelectorAll('.task.dragging').forEach(el => el.classList.remove('dragging'));
  document.querySelectorAll('.col-body.dov').forEach(el => el.classList.remove('dov'));
}
function onDragOver(ev) {
  ev.preventDefault();
  ev.dataTransfer.dropEffect = 'move';
  const col = ev.target.closest('.col');
  if (col) col.querySelector('.col-body')?.classList.add('dov');
}
function onDrop(ev, colId) {
  ev.preventDefault();
  if (!draggingId) return;
  const item = STATE.items.find(i => i.id === draggingId);
  if (!item) return;

  const statusMap = { backlog:null, todo:'todo', inprogress:'inprogress', review:'review', done:'done' };
  if (colId === 'backlog') {
    item.sprintId = null;
    item.status = 'todo';
  } else {
    item.sprintId = STATE.activeSprint;
    item.status = statusMap[colId] || 'todo';
  }

  if (colId === 'done') {
    const sprint = getActiveSprint();
    if (sprint) sprint.completed = (sprint.completed||0) + item.points;
  }

  persist();
  rerenderCurrent();
  draggingId = null;
}

/* ═══════════════════════════════════════════════
   RERENDER HELPER
═══════════════════════════════════════════════ */
function rerenderCurrent() {
  const path = window.location.pathname;
  if (path.includes('/backlog')) renderBacklog();
  else if (path.includes('/metricas')) { renderBurndown(); renderVelocity(); }
  else if (path.includes('/planning')) renderPlanning();
  else if (path.includes('/alpaquitay')) renderAlpaquitayPage();
  else renderBoard();
}
