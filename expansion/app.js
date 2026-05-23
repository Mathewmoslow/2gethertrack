import { EXERCISE_DB } from './exerciseDB.js';
import { firebaseConfig } from './firebase-config.js';
import { getCuratedFor, AARON_CURATED } from './aaronCurated.js';

// ===== Module-scope Firebase handles (assigned during init) =====
let auth = null;
let db = null;
const fb = {}; // firestore function references (collection, doc, addDoc, etc.)

// ===== App State =====
const state = {
    user: null,
    currentView: 'dash',
    workoutCanvas: [],
    libraryFilters: {
        bodyPart: '',
        equipment: '',
        curatedOnly: false,
        search: ''
    },
    clients: [],
    expenses: [],
    programs: [],
    clientLogs: [],
    settings: { takeHome: 0, rates: [35, 45, 55, 65, 75], weeks: 4 },
    aceBank: [],
    userProgress: {},
    isTravelMode: false,    // legacy flag, kept for back-compat
    travelTier: 'full'      // 'full' | 'hotel' | 'room'
};

// ===== UI Elements =====
const dom = {
    splash: document.getElementById('splash'),
    app: document.getElementById('app'),
    viewTitle: document.getElementById('viewTitle'),
    viewSub: document.getElementById('viewSub'),
    trainerName: document.getElementById('trainerName'),
    navItems: document.querySelectorAll('.nav-item'),
    views: document.querySelectorAll('.view'),
    exerciseList: document.getElementById('exerciseList'),
    workoutCanvas: document.getElementById('workoutCanvas'),
    ledgerContent: document.getElementById('ledger-content'),
    aceContent: document.getElementById('ace-content'),
    settingsContent: document.getElementById('settings-content'),
    globalSearch: document.getElementById('globalSearch'),
    btnSignOut: document.getElementById('btnSignOut')
};

// ===== Initialization =====
async function init() {
    setupEventListeners();
    renderExerciseLibrary();
    
    // Initialize Firebase
    try {
        const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js');
        const authMod = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js');
        const fsMod = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
        const { getAuth, onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } = authMod;
        const { getFirestore, collection, doc, onSnapshot, addDoc, setDoc, deleteDoc, getDoc, serverTimestamp, query, where, getDocs } = fsMod;
        
        const app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
        Object.assign(fb, { collection, doc, onSnapshot, addDoc, setDoc, deleteDoc, getDoc, serverTimestamp, query, where, getDocs });

        onAuthStateChanged(auth, (user) => {
            if (user) {
                state.user = user;
                dom.trainerName.textContent = (user.displayName || user.email || 'Trainer').split(' ')[0];
                dom.splash.classList.add('hide');
                dom.app.classList.remove('hide');
                
                // Sync Ledger Data
                onSnapshot(collection(db, 'users', user.uid, 'clients'), (s) => {
                    state.clients = s.docs.map(d => ({ id: d.id, ...d.data() }));
                    renderDashboardStats();
                    populateClientDropdown();
                    if (state.currentView === 'ledger') renderLedger();
                });
                onSnapshot(collection(db, 'users', user.uid, 'expenses'), (s) => {
                    state.expenses = s.docs.map(d => ({ id: d.id, ...d.data() }));
                    renderDashboardStats();
                    if (state.currentView === 'ledger') renderLedger();
                });
                onSnapshot(doc(db, 'users', user.uid, 'settings', 'main'), (s) => {
                    if (s.exists()) Object.assign(state.settings, s.data());
                    renderDashboardStats();
                });
                // Programs created by this trainer
                onSnapshot(
                    fb.query(fb.collection(db, 'programs'), fb.where('trainerUid', '==', user.uid)),
                    (s) => {
                        state.programs = s.docs.map(d => ({ id: d.id, ...d.data() }));
                        renderDashboardStats();
                    },
                    (err) => console.error('programs listener', err)
                );
                // Logs from this trainer's clients
                onSnapshot(
                    fb.query(fb.collection(db, 'clientLogs'), fb.where('trainerUid', '==', user.uid)),
                    (s) => {
                        state.clientLogs = s.docs.map(d => ({ id: d.id, ...d.data() }));
                        renderDashboardStats();
                    },
                    (err) => console.error('clientLogs listener', err)
                );

                loadAceData();
            } else {
                dom.app.classList.add('hide');
                dom.splash.classList.remove('hide');
            }
        });

        // Auth Handlers
        document.getElementById('btnSignIn').onclick = async () => {
            const email = document.getElementById('authEmail').value.trim();
            const password = document.getElementById('authPassword').value;
            if (!email || !password) { toast('Email and password required'); return; }
            try {
                await signInWithEmailAndPassword(auth, email, password);
                document.getElementById('authPassword').value = '';
            } catch (e) {
                toast(friendlyAuthError(e));
            }
        };

        document.getElementById('btnCreateAccount').onclick = async () => {
            const email = document.getElementById('authEmail').value.trim();
            const password = document.getElementById('authPassword').value;
            if (!email || !password) { toast('Email and password required'); return; }
            if (password.length < 6) { toast('Password must be at least 6 characters'); return; }
            try {
                await createUserWithEmailAndPassword(auth, email, password);
                document.getElementById('authPassword').value = '';
                toast("Account created!");
            } catch (e) {
                toast(friendlyAuthError(e));
            }
        };

        document.getElementById('btnForgotPassword').onclick = async () => {
            const email = document.getElementById('authEmail').value.trim();
            if (!email) { toast('Type your email above first, then click Forgot password'); return; }
            try {
                await sendPasswordResetEmail(auth, email);
                toast(`Password reset email sent to ${email}`);
            } catch (e) {
                toast(friendlyAuthError(e));
            }
        };

    } catch (e) {
        console.error("Firebase init error", e);
    }
}

// ===== Logic: Business Ledger / Dashboard =====
function renderDashboardStats() {
    const weeks = state.settings.weeks || 4;
    const earn = state.clients.reduce((s, c) => s + ((c.rate || 0) * (c.frequency || 0) * weeks), 0);
    const cost = state.expenses.reduce((s, e) => s + (e.amount || 0), 0);
    const takeHome = state.settings.takeHome || 0;
    const req = cost + takeHome;
    const net = earn - req;

    // Revenue card
    setText('metricProjected', `$${Math.round(earn).toLocaleString()}`);
    setText('metricRequired', `$${Math.round(req).toLocaleString()}`);
    const netEl = document.getElementById('metricNet');
    if (netEl) {
        netEl.textContent = `$${Math.round(net).toLocaleString()}`;
        netEl.style.color = net >= 0 ? 'var(--accent-green)' : 'var(--accent-red)';
    }
    setText('metricProjectedSub', state.clients.length === 0
        ? 'No clients yet'
        : `${state.clients.length} client${state.clients.length === 1 ? '' : 's'} @ ${weeks}wk/mo`);
    setText('metricNetSub', net >= 0 ? 'On track' : `Need $${Math.round(-net).toLocaleString()} more`);

    // Goal bar (% of required covered by projected)
    const pct = req > 0 ? Math.min(100, Math.round((earn / req) * 100)) : 0;
    const fill = document.getElementById('goalBarFill');
    if (fill) {
        fill.style.width = `${pct}%`;
        fill.style.background = pct >= 100 ? 'var(--accent-green)' : 'var(--accent-orange)';
    }
    setText('goalCaption', req > 0
        ? `${pct}% of monthly target ($${Math.round(req).toLocaleString()})`
        : 'Set a take-home goal in Settings');

    // Clients card
    const linked = state.clients.filter(c => c.clientUid).length;
    const unlinked = state.clients.length - linked;
    setText('clientCount', state.clients.length);
    setText('clientBreakdown', `${linked} linked • ${unlinked} unlinked`);

    // Sessions this week
    const weekStart = startOfWeek(new Date());
    const logsThisWeek = state.clientLogs.filter(l => {
        const d = l.completedAt?.toDate ? l.completedAt.toDate() : null;
        return d && d >= weekStart;
    });
    const uniqueClientsThisWeek = new Set(logsThisWeek.map(l => l.clientUid)).size;
    setText('sessionCount', logsThisWeek.length);
    setText('sessionBreakdown', `across ${uniqueClientsThisWeek} client${uniqueClientsThisWeek === 1 ? '' : 's'}`);

    // Recent activity (last 5 logs)
    const recentEl = document.getElementById('recentActivity');
    if (recentEl) {
        const recent = [...state.clientLogs]
            .filter(l => l.completedAt?.toDate)
            .sort((a, b) => b.completedAt.toDate() - a.completedAt.toDate())
            .slice(0, 5);
        if (recent.length === 0) {
            recentEl.innerHTML = '<p class="mini-caption">No activity yet.</p>';
        } else {
            recentEl.innerHTML = recent.map(l => {
                const when = l.completedAt.toDate();
                const clientName = state.clients.find(c => c.clientUid === l.clientUid)?.name || 'Client';
                return `
                    <div class="recent-row" data-log-id="${l.id}" role="button">
                        <div>
                            <strong>${clientName}</strong>
                            <span class="recent-program">${l.programName}</span>
                        </div>
                        <span class="recent-time">${timeAgo(when)}</span>
                    </div>
                `;
            }).join('');
            recentEl.querySelectorAll('[data-log-id]').forEach(row => {
                row.onclick = () => showLogDetail(row.dataset.logId);
            });
        }
    }

    // Calendar
    renderActivityCalendar();
}

function renderActivityCalendar() {
    const grid = document.getElementById('calGrid');
    if (!grid) return;
    const now = new Date();
    const monthLabel = document.getElementById('calMonth');
    if (monthLabel) monthLabel.textContent = now.toLocaleString('default', { month: 'long', year: 'numeric' });

    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = now.getDate();

    // Build a set of YYYY-MM-DD strings with activity
    const activeDays = new Set();
    state.clientLogs.forEach(l => {
        const d = l.completedAt?.toDate ? l.completedAt.toDate() : null;
        if (d && d.getFullYear() === year && d.getMonth() === month) {
            activeDays.add(d.getDate());
        }
    });

    let html = ['S','M','T','W','T','F','S'].map(d => `<span class="cal-dow">${d}</span>`).join('');
    for (let i = 0; i < firstDay; i++) html += '<span class="cal-blank"></span>';
    for (let day = 1; day <= daysInMonth; day++) {
        const classes = ['cal-day'];
        if (day === today) classes.push('cal-today');
        if (activeDays.has(day)) classes.push('cal-active');
        html += `<span class="${classes.join(' ')}">${day}</span>`;
    }
    grid.innerHTML = html;
}

function startOfWeek(d) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    x.setDate(x.getDate() - x.getDay());
    return x;
}

function timeAgo(d) {
    const diff = (Date.now() - d.getTime()) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return d.toLocaleDateString();
}

function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

function friendlyAuthError(e) {
    const code = e?.code || '';
    const map = {
        'auth/invalid-email': 'That email looks malformed',
        'auth/missing-password': 'Password required',
        'auth/weak-password': 'Password must be at least 6 characters',
        'auth/email-already-in-use': 'That email is already registered — try signing in instead',
        'auth/invalid-credential': 'Wrong email or password',
        'auth/invalid-login-credentials': 'Wrong email or password',
        'auth/user-not-found': 'No account with that email — create one instead',
        'auth/wrong-password': 'Wrong password',
        'auth/too-many-requests': 'Too many attempts — wait a minute and try again',
        'auth/network-request-failed': 'Network error — check your connection',
        'auth/unauthorized-domain': 'This domain is not authorized in Firebase Auth settings'
    };
    return map[code] || e?.message || 'Authentication failed';
}

function renderLedger() {
    const weeks = state.settings.weeks || 4;
    dom.ledgerContent.innerHTML = `
        <div class="ledger-grid">
            <div class="card">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                    <h3 style="margin:0;">Client Roster</h3>
                    <button class="btn btn-primary btn-mini" id="btnAddClient">+ Add Client</button>
                </div>
                <div class="ledger-table-wrap">
                    <table class="ledger-table">
                        <thead><tr><th>Name</th><th>Rate</th><th>Freq</th><th>Monthly</th><th>Client Link</th></tr></thead>
                        <tbody>
                            ${state.clients.map(c => `
                                <tr data-roster-id="${c.id}">
                                    <td>${c.name}</td>
                                    <td>$${c.rate}</td>
                                    <td>${c.frequency}x</td>
                                    <td>$${Math.round(c.rate * c.frequency * weeks)}</td>
                                    <td>
                                        ${c.clientUid
                                            ? `<span class="link-badge linked">Linked ✓</span>`
                                            : c.inviteCode
                                                ? `<button class="btn btn-ghost btn-mini" data-action="show-code" data-code="${c.inviteCode}">Code: ${c.inviteCode}</button>`
                                                : `<button class="btn btn-primary btn-mini" data-action="invite" data-roster-id="${c.id}" data-name="${c.name}">Invite</button>`}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="card">
                <h3>Revenue Matrix</h3>
                <div id="expansionMatrix"></div>
            </div>
            <div class="card" style="grid-column: 1 / -1;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                    <h3 style="margin:0;">Monthly Expenses</h3>
                    <button class="btn btn-primary btn-mini" id="btnAddExpense">+ Add Expense</button>
                </div>
                <div class="ledger-table-wrap">
                    <table class="ledger-table">
                        <thead><tr><th>Name</th><th>Amount</th><th></th></tr></thead>
                        <tbody>
                            ${state.expenses.length === 0
                                ? `<tr><td colspan="3" style="text-align:center; color:var(--text-secondary); padding:1.5rem;">No expenses added yet.</td></tr>`
                                : state.expenses.map(e => `
                                    <tr>
                                        <td>${e.name}</td>
                                        <td>$${(e.amount || 0).toLocaleString()}</td>
                                        <td><button class="btn btn-ghost btn-mini" data-delete-expense="${e.id}">Delete</button></td>
                                    </tr>
                                `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    renderMatrix();
    // Wire invite buttons (event delegation)
    dom.ledgerContent.querySelectorAll('[data-action="invite"]').forEach(btn => {
        btn.onclick = () => generateInvite(btn.dataset.rosterId, btn.dataset.name);
    });
    dom.ledgerContent.querySelectorAll('[data-action="show-code"]').forEach(btn => {
        btn.onclick = () => showShareModal(btn.dataset.code);
    });
    const addBtn = document.getElementById('btnAddClient');
    if (addBtn) addBtn.onclick = showAddClientModal;
    const addExpBtn = document.getElementById('btnAddExpense');
    if (addExpBtn) addExpBtn.onclick = showAddExpenseModal;
    dom.ledgerContent.querySelectorAll('[data-delete-expense]').forEach(btn => {
        btn.onclick = async () => {
            const id = btn.dataset.deleteExpense;
            try {
                await fb.deleteDoc(fb.doc(db, 'users', state.user.uid, 'expenses', id));
                toast('Expense removed');
            } catch (e) {
                toast('Delete failed: ' + e.message);
            }
        };
    });
}

function renderSettings() {
    if (!dom.settingsContent) return;
    const s = state.settings;
    dom.settingsContent.innerHTML = `
        <div class="settings-grid">
            <div class="card">
                <h3>Income Goal</h3>
                <p class="mini-caption" style="margin-bottom:1rem;">Sets the target on your Overview dashboard.</p>
                <label class="settings-label">Monthly take-home goal ($)</label>
                <input type="number" id="setTakeHome" class="form-input" value="${s.takeHome || 0}" min="0" />
                <label class="settings-label">Working weeks per month</label>
                <input type="number" id="setWeeks" class="form-input" value="${s.weeks || 4}" min="1" max="5" step="0.1" />
            </div>
            <div class="card">
                <h3>Session Rate Tiers</h3>
                <p class="mini-caption" style="margin-bottom:1rem;">Used to compute your Revenue Matrix. Comma-separated list of $ amounts.</p>
                <input type="text" id="setRates" class="form-input" value="${(s.rates || []).join(', ')}" placeholder="35, 45, 55, 65, 75" />
            </div>
            <div class="card">
                <h3>Account</h3>
                <p class="mini-caption">Signed in as <strong>${state.user?.email || '—'}</strong></p>
                <p class="mini-caption" style="margin-top:0.6rem; word-break:break-all;">UID: ${state.user?.uid || '—'}</p>
            </div>
        </div>
        <div style="margin-top:1.5rem; text-align:right;">
            <button class="btn btn-primary" id="btnSaveSettings">Save Settings</button>
        </div>
    `;
    document.getElementById('btnSaveSettings').onclick = saveSettings;
}

async function saveSettings() {
    if (!state.user) return;
    const takeHome = parseFloat(document.getElementById('setTakeHome').value) || 0;
    const weeks = parseFloat(document.getElementById('setWeeks').value) || 4;
    const rates = document.getElementById('setRates').value
        .split(',')
        .map(s => parseFloat(s.trim()))
        .filter(n => !isNaN(n) && n > 0)
        .sort((a, b) => a - b);
    try {
        await fb.setDoc(
            fb.doc(db, 'users', state.user.uid, 'settings', 'main'),
            { takeHome, weeks, rates },
            { merge: true }
        );
        toast('Settings saved');
    } catch (e) {
        console.error(e);
        toast('Save failed: ' + e.message);
    }
}

function showAddExpenseModal() {
    let modal = document.getElementById('addExpenseModal');
    if (modal) modal.remove();
    modal = document.createElement('div');
    modal.id = 'addExpenseModal';
    modal.className = 'modal-backdrop';
    modal.innerHTML = `
        <div class="modal-card" style="text-align:left;">
            <h3>Add Expense</h3>
            <p class="modal-sub">Monthly business costs (rent, insurance, software, etc.)</p>
            <div style="display:flex; flex-direction:column; gap:0.8rem; margin-bottom:1.5rem;">
                <input type="text" id="newExpenseName" placeholder="Expense name" class="form-input" />
                <input type="number" id="newExpenseAmount" placeholder="Amount ($)" class="form-input" min="0" step="0.01" />
            </div>
            <div class="modal-actions">
                <button class="btn btn-ghost" id="cancelAddExpense">Cancel</button>
                <button class="btn btn-primary" id="saveAddExpense">Add</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('cancelAddExpense').onclick = () => modal.remove();
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    document.getElementById('saveAddExpense').onclick = async () => {
        const name = document.getElementById('newExpenseName').value.trim();
        const amount = parseFloat(document.getElementById('newExpenseAmount').value) || 0;
        if (!name || !amount) { toast('Name and amount required'); return; }
        try {
            await fb.addDoc(fb.collection(db, 'users', state.user.uid, 'expenses'), {
                name, amount,
                createdAt: fb.serverTimestamp()
            });
            toast(`Added ${name}`);
            modal.remove();
        } catch (e) {
            console.error(e);
            toast('Failed: ' + e.message);
        }
    };
}

function showAddClientModal() {
    let modal = document.getElementById('addClientModal');
    if (modal) modal.remove();
    modal = document.createElement('div');
    modal.id = 'addClientModal';
    modal.className = 'modal-backdrop';
    modal.innerHTML = `
        <div class="modal-card" style="text-align:left;">
            <h3>Add Client</h3>
            <p class="modal-sub">Add a client to your roster. You can send them an invite code after.</p>
            <div style="display:flex; flex-direction:column; gap:0.8rem; margin-bottom:1.5rem;">
                <input type="text" id="newClientName" placeholder="Client name" class="form-input" />
                <div style="display:flex; gap:0.5rem;">
                    <input type="number" id="newClientRate" placeholder="Rate ($/session)" class="form-input" min="0" />
                    <input type="number" id="newClientFreq" placeholder="Sessions/wk" class="form-input" min="0" max="14" />
                </div>
            </div>
            <div class="modal-actions">
                <button class="btn btn-ghost" id="cancelAddClient">Cancel</button>
                <button class="btn btn-primary" id="saveAddClient">Add</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('cancelAddClient').onclick = () => modal.remove();
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    document.getElementById('saveAddClient').onclick = async () => {
        const name = document.getElementById('newClientName').value.trim();
        const rate = parseFloat(document.getElementById('newClientRate').value) || 0;
        const frequency = parseInt(document.getElementById('newClientFreq').value, 10) || 0;
        if (!name) { toast('Name required'); return; }
        try {
            await fb.addDoc(fb.collection(db, 'users', state.user.uid, 'clients'), {
                name, rate, frequency,
                createdAt: fb.serverTimestamp()
            });
            toast(`Added ${name}`);
            modal.remove();
        } catch (e) {
            console.error(e);
            toast('Failed: ' + e.message);
        }
    };
}

// ===== Invite Codes =====
function randomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // omit confusing 0/O/1/I
    let out = '';
    for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
    return out;
}

async function generateInvite(rosterId, name) {
    if (!state.user) { toast('Sign in first'); return; }
    const code = randomCode();
    try {
        // Create the invite code doc
        await fb.setDoc(fb.doc(db, 'inviteCodes', code), {
            trainerUid: state.user.uid,
            trainerName: state.user.displayName || state.user.email,
            rosterId,
            clientName: name,
            used: false,
            createdAt: fb.serverTimestamp()
        });
        // Stamp the code onto the roster entry so trainer sees it
        await fb.setDoc(
            fb.doc(db, 'users', state.user.uid, 'clients', rosterId),
            { inviteCode: code },
            { merge: true }
        );
        showShareModal(code);
    } catch (e) {
        console.error(e);
        toast('Could not generate invite: ' + e.message);
    }
}

function showLogDetail(logId) {
    const log = state.clientLogs.find(l => l.id === logId);
    if (!log) return;
    const clientName = state.clients.find(c => c.clientUid === log.clientUid)?.name || 'Client';
    const when = log.completedAt?.toDate ? log.completedAt.toDate().toLocaleString() : 'Pending sync';

    let modal = document.getElementById('logDetailModal');
    if (modal) modal.remove();
    modal = document.createElement('div');
    modal.id = 'logDetailModal';
    modal.className = 'modal-backdrop';

    const exerciseBlocks = (log.exercises || []).map(ex => {
        const setRows = (ex.sets || []).map((s, i) => {
            const logged = s.reps || s.weight;
            return `
                <tr class="${logged ? '' : 'set-skipped'}">
                    <td>Set ${i + 1}</td>
                    <td>${s.reps || '—'}</td>
                    <td>${s.weight ? s.weight + ' lbs' : '—'}</td>
                </tr>
            `;
        }).join('');
        return `
            <div class="log-exercise">
                <div class="log-ex-header">
                    <strong>${ex.title}</strong>
                    <span class="log-target">Target: ${ex.target?.sets || '?'} × ${ex.target?.reps || '?'}${ex.target?.weight ? ' @ ' + ex.target.weight : ''}</span>
                </div>
                <table class="log-sets-table">
                    <thead><tr><th>Set</th><th>Reps</th><th>Weight</th></tr></thead>
                    <tbody>${setRows}</tbody>
                </table>
            </div>
        `;
    }).join('');

    modal.innerHTML = `
        <div class="modal-card" style="text-align:left; max-width:560px; max-height:85vh; overflow-y:auto;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1rem;">
                <div>
                    <h3 style="margin-bottom:4px;">${log.programName}</h3>
                    <p class="modal-sub" style="margin:0;">${clientName} • ${when}</p>
                </div>
                <button class="btn btn-ghost btn-mini" id="closeLogDetail">×</button>
            </div>
            ${exerciseBlocks || '<p class="mini-caption">No exercises in this log.</p>'}
        </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('closeLogDetail').onclick = () => modal.remove();
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
}

function showShareModal(code) {
    let modal = document.getElementById('shareModal');
    if (modal) modal.remove();
    modal = document.createElement('div');
    modal.id = 'shareModal';
    modal.className = 'modal-backdrop';
    modal.innerHTML = `
        <div class="modal-card">
            <h3>Invite Code</h3>
            <p class="modal-sub">Send this code to your client. They'll use it once when they sign up.</p>
            <div class="code-display">${code}</div>
            <div class="modal-actions">
                <button class="btn btn-ghost" id="copyCode">Copy</button>
                <button class="btn btn-primary" id="shareCode">Share</button>
                <button class="btn btn-ghost" id="closeModal">Done</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    const shareText = `You've been invited to 2getherTrack. Use this code when you sign up: ${code}\n\nhttps://mathewmoslow.github.io/2gethertrack/expansion/client.html`;

    document.getElementById('copyCode').onclick = async () => {
        try {
            await navigator.clipboard.writeText(code);
            toast('Code copied');
        } catch { toast('Copy failed'); }
    };
    document.getElementById('shareCode').onclick = async () => {
        if (navigator.share) {
            try {
                await navigator.share({ title: '2getherTrack invite', text: shareText });
            } catch { /* user cancelled */ }
        } else {
            try {
                await navigator.clipboard.writeText(shareText);
                toast('Share link copied to clipboard');
            } catch { toast('Share unavailable'); }
        }
    };
    document.getElementById('closeModal').onclick = () => modal.remove();
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
}

function renderMatrix() {
    const earn = state.clients.reduce((s, c) => s + (c.rate * c.frequency * (state.settings.weeks || 4)), 0);
    const cost = state.expenses.reduce((s, e) => s + (e.amount || 0), 0);
    const req = cost + (state.settings.takeHome || 0);
    const gap = Math.max(0, req - earn);
    const rates = (state.settings.rates || [35,45,55,65,75]).sort((a,b)=>a-b);
    const weeks = state.settings.weeks || 4;

    let html = `<table class="matrix"><thead><tr><th>Sess/Wk</th>${rates.map(r => `<th>$${r}</th>`).join('')}</tr></thead><tbody>`;
    for (let f = 1; f <= 5; f++) {
        html += `<tr><td>${f}x</td>` + rates.map(r => {
            const val = Math.ceil(gap / (r * f * weeks)) || 0;
            return `<td class="${val === 0 ? 'zero' : 'need'}">${val}</td>`;
        }).join('') + '</tr>';
    }
    html += '</tbody></table>';
    const container = document.getElementById('expansionMatrix');
    if (container) container.innerHTML = html;
}

// ===== Logic: ACE Education =====
async function loadAceData() {
    try {
        const res = await fetch('../ace_questions_full.json');
        state.aceBank = await res.json();
    } catch (e) {
        console.error("ACE data failed", e);
    }
}

function renderAce() {
    dom.aceContent.classList.remove('hide');
    document.getElementById('quiz-engine').classList.add('hide');
    dom.aceContent.innerHTML = `
        <div class="ace-grid">
            ${state.aceBank.map((ch, i) => `
                <div class="chapter-pill" onclick="window.startExpansionQuiz(${i})">
                    <div class="chapter-info">
                        <h4>Ch ${ch.chapter}: ${ch.title}</h4>
                        <p>Practice Exam Questions</p>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// ===== Quiz Engine Logic =====
let currentQuiz = null;
let currentQIdx = 0;

window.startExpansionQuiz = (idx) => {
    currentQuiz = state.aceBank[idx];
    currentQIdx = 0;
    dom.aceContent.classList.add('hide');
    document.getElementById('quiz-engine').classList.remove('hide');
    showQuestion();
};

function showQuestion() {
    const q = currentQuiz.questions[currentQIdx];
    document.getElementById('quizChapter').textContent = `Chapter ${currentQuiz.chapter}`;
    document.getElementById('quizProgress').textContent = `Question ${currentQIdx + 1}/${currentQuiz.questions.length}`;
    document.getElementById('quizQuestion').textContent = q.q;
    
    const optionsEl = document.getElementById('quizOptions');
    optionsEl.innerHTML = q.options.map((opt, i) => `
        <button class="quiz-option" onclick="window.checkExpansionAnswer(${i})">${opt}</button>
    `).join('');
    
    document.getElementById('quizFeedback').classList.add('hide');
    document.getElementById('btnNext').classList.add('hide');
}

window.checkExpansionAnswer = (idx) => {
    const q = currentQuiz.questions[currentQIdx];
    const isCorrect = idx === q.correct;
    const options = document.querySelectorAll('.quiz-option');
    
    options.forEach((btn, i) => {
        btn.disabled = true;
        if (i === q.correct) btn.classList.add('correct');
        if (i === idx && !isCorrect) btn.classList.add('wrong');
    });
    
    const feedbackEl = document.getElementById('quizFeedback');
    feedbackEl.textContent = q.rationale;
    feedbackEl.className = isCorrect ? 'correct' : 'wrong';
    feedbackEl.classList.remove('hide');
    
    document.getElementById('btnNext').classList.remove('hide');
};

document.getElementById('btnNext').onclick = () => {
    currentQIdx++;
    if (currentQIdx < currentQuiz.questions.length) {
        showQuestion();
    } else {
        renderAce();
    }
};

document.getElementById('btnExit').onclick = () => {
    renderAce();
};

// ===== Logic: Program Builder & Vacation Tool =====
function setupEventListeners() {
    dom.navItems.forEach(item => {
        item.addEventListener('click', () => {
            switchView(item.dataset.view);
        });
    });

    // New builder filters
    const builderSearch = document.getElementById('builderSearch');
    if (builderSearch) {
        builderSearch.addEventListener('input', (e) => {
            state.libraryFilters.search = e.target.value;
            renderExerciseLibrary();
        });
    }
    renderBodyPartChips();
    renderTierPicker();
    const curatedChip = document.getElementById('curatedChip');
    if (curatedChip) {
        curatedChip.onclick = () => {
            state.libraryFilters.curatedOnly = !state.libraryFilters.curatedOnly;
            curatedChip.classList.toggle('active', state.libraryFilters.curatedOnly);
            renderExerciseLibrary();
        };
    }

    // Drag and Drop Logic
    dom.workoutCanvas.addEventListener('dragover', (e) => {
        e.preventDefault();
        dom.workoutCanvas.classList.add('drag-over');
    });

    dom.workoutCanvas.addEventListener('dragleave', () => {
        dom.workoutCanvas.classList.remove('drag-over');
    });

    dom.workoutCanvas.addEventListener('drop', (e) => {
        e.preventDefault();
        dom.workoutCanvas.classList.remove('drag-over');
        const exerciseId = e.dataTransfer.getData('text/plain');
        addExerciseToCanvas(exerciseId);
    });

    // Save Program → Firestore
    const saveBtn = document.getElementById('btnSaveProgram');
    if (saveBtn) saveBtn.onclick = saveProgram;

    // Global search — filters exercise library live; jumps user to builder view if not there
    if (dom.globalSearch) {
        dom.globalSearch.addEventListener('input', (e) => {
            state.libraryFilters.search = e.target.value;
            if (state.currentView !== 'builder' && e.target.value) {
                switchView('builder');
            }
            renderExerciseLibrary();
        });
    }

    // Sign out
    if (dom.btnSignOut) {
        dom.btnSignOut.onclick = async () => {
            try {
                const { signOut, getAuth } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js');
                await signOut(getAuth());
            } catch (e) {
                console.error(e);
            }
        };
    }

}

function renderTierPicker() {
    const tierRow = document.getElementById('tierRow');
    if (!tierRow) return;
    const tiers = [
        { id: 'full', label: 'Full Gym', icon: '🏋️' },
        { id: 'hotel', label: 'Hotel', icon: '🏨' },
        { id: 'room', label: 'Room Only', icon: '✈️' }
    ];
    tierRow.innerHTML = `<div class="tier-picker">${tiers.map(t => `
        <button class="tier-btn ${state.travelTier === t.id ? 'active' : ''}" data-tier="${t.id}">${t.icon} ${t.label}</button>
    `).join('')}</div>`;
    tierRow.querySelectorAll('.tier-btn').forEach(btn => {
        btn.onclick = () => {
            state.travelTier = btn.dataset.tier;
            state.isTravelMode = btn.dataset.tier !== 'full';
            tierRow.querySelectorAll('.tier-btn').forEach(b => b.classList.toggle('active', b.dataset.tier === btn.dataset.tier));
            renderExerciseLibrary();
        };
    });
}

function renderBodyPartChips() {
    const container = document.getElementById('bodypartChips');
    if (!container) return;
    const bodyParts = ['All', ...new Set(EXERCISE_DB.map(ex => ex.BodyPart))].filter(Boolean).sort((a, b) => {
        if (a === 'All') return -1;
        if (b === 'All') return 1;
        return a.localeCompare(b);
    });
    container.innerHTML = bodyParts.map(bp => {
        const active = (bp === 'All' && !state.libraryFilters.bodyPart) || bp === state.libraryFilters.bodyPart;
        return `<button class="bp-chip ${active ? 'active' : ''}" data-bp="${bp === 'All' ? '' : bp}">${bp}</button>`;
    }).join('');
    container.querySelectorAll('.bp-chip').forEach(btn => {
        btn.onclick = () => {
            state.libraryFilters.bodyPart = btn.dataset.bp;
            container.querySelectorAll('.bp-chip').forEach(b => b.classList.toggle('active', b === btn));
            renderExerciseLibrary();
        };
    });
}

function renderExerciseLibrary() {
    dom.exerciseList.innerHTML = '';

    const travelEquipMap = {
        room: ['Body Only', 'Bands', 'None'],
        hotel: ['Body Only', 'Bands', 'None', 'Dumbbell', 'Other']
    };

    const search = (state.libraryFilters.search || '').toLowerCase().trim();
    const filtered = EXERCISE_DB.filter(ex => {
        const matchBP = !state.libraryFilters.bodyPart || ex.BodyPart === state.libraryFilters.bodyPart;
        const matchEq = !state.libraryFilters.equipment || ex.Equipment === state.libraryFilters.equipment;
        const matchCurated = !state.libraryFilters.curatedOnly || !!getCuratedFor(ex.Title);
        const matchSearch = !search || ex.Title.toLowerCase().includes(search);

        if (state.travelTier && state.travelTier !== 'full') {
            const allowed = travelEquipMap[state.travelTier] || travelEquipMap.room;
            return matchBP && matchCurated && matchSearch && allowed.includes(ex.Equipment);
        }
        return matchBP && matchEq && matchCurated && matchSearch;
    });

    // Sort: curated picks first, then alphabetical
    filtered.sort((a, b) => {
        const ac = getCuratedFor(a.Title) ? 0 : 1;
        const bc = getCuratedFor(b.Title) ? 0 : 1;
        if (ac !== bc) return ac - bc;
        return a.Title.localeCompare(b.Title);
    });

    const limited = filtered.slice(0, 150);

    if (limited.length === 0) {
        dom.exerciseList.innerHTML = '<p class="mini-caption" style="padding:1rem; grid-column:1/-1;">No exercises match these filters. Try clearing them or switching equipment tier.</p>';
        return;
    }

    dom.exerciseList.innerHTML = '';
    limited.forEach(ex => {
        const curated = getCuratedFor(ex.Title);
        const el = document.createElement('div');
        el.className = 'exercise-card' + (curated ? ' curated' : '');
        el.draggable = true;
        el.dataset.id = ex.id;
        el.innerHTML = `
            <div class="ex-card-body">
                <span class="ex-name">${ex.Title}</span>
                <span class="ex-meta">${curated ? '★ Coach' : `${ex.BodyPart} • ${ex.Equipment}`}</span>
            </div>
            <button class="ex-add-btn" data-add="${ex.id}" title="Add to workout">+</button>
        `;
        el.addEventListener('dragstart', (e) => e.dataTransfer.setData('text/plain', ex.id));
        dom.exerciseList.appendChild(el);
    });

    dom.exerciseList.querySelectorAll('[data-add]').forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            addExerciseToCanvas(btn.dataset.add);
            // Scroll canvas into view so user sees the addition
            dom.workoutCanvas.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        };
    });
}

function switchView(viewId) {
    state.currentView = viewId;
    dom.navItems.forEach(item => item.classList.toggle('active', item.dataset.view === viewId));
    dom.views.forEach(view => view.classList.toggle('active', view.id === `view-${viewId}`));

    const titles = { dash: 'Overview', ledger: 'Business Ledger', builder: 'Program Builder', ace: 'ACE Education', settings: 'Settings' };
    dom.viewTitle.textContent = titles[viewId];
    
    if (viewId === 'ledger') renderLedger();
    if (viewId === 'ace') renderAce();
    if (viewId === 'settings') renderSettings();
}

function addExerciseToCanvas(id) {
    const exercise = EXERCISE_DB.find(ex => ex.id === id);
    if (!exercise) return;
    const curated = getCuratedFor(exercise.Title);

    const sets = curated?.defaultSets || '3';
    const reps = curated?.defaultReps || '8-10';
    const weight = curated?.defaultWeight || '';
    const rest = '90s';
    const cues = curated?.cues || '';
    const rpe = curated?.defaultRPE || '';

    const el = document.createElement('div');
    el.className = 'card canvas-item' + (curated ? ' curated' : '');
    el.dataset.exerciseId = exercise.id;
    el.dataset.exerciseTitle = exercise.Title;
    el.innerHTML = `
        <div class="canvas-item-header">
            <strong>${exercise.Title}${curated ? ' <span class="curated-star" title="Aaron&#39;s curated programming">★</span>' : ''}</strong>
            <button class="remove-btn">×</button>
        </div>
        ${curated?.description ? `<p class="canvas-item-desc">${curated.description}</p>` : ''}
        <div class="canvas-item-grid">
            <label><span>Sets</span><input type="number" class="in-sets" min="1" value="${sets}"></label>
            <label><span>Reps</span><input type="text" class="in-reps" value="${reps}"></label>
            <label><span>Weight</span><input type="text" class="in-weight" value="${weight}" placeholder="—"></label>
            <label><span>Rest</span><input type="text" class="in-rest" value="${rest}"></label>
            <label><span>RPE</span><input type="text" class="in-rpe" value="${rpe}" placeholder="—"></label>
        </div>
        <label class="cue-label"><span>Coaching cue (optional)</span><input type="text" class="in-cues" placeholder="What should the client focus on?" value="${cues.replace(/"/g, '&quot;')}"></label>
    `;
    el.querySelector('.remove-btn').onclick = () => el.remove();
    const placeholder = dom.workoutCanvas.querySelector('.empty-canvas');
    if (placeholder) placeholder.remove();
    dom.workoutCanvas.appendChild(el);
}

function collectCanvasExercises() {
    const items = dom.workoutCanvas.querySelectorAll('.canvas-item');
    return Array.from(items).map(el => ({
        exerciseId: el.dataset.exerciseId,
        title: el.dataset.exerciseTitle,
        sets: el.querySelector('.in-sets')?.value || '',
        reps: el.querySelector('.in-reps')?.value || '',
        weight: el.querySelector('.in-weight')?.value || '',
        rest: el.querySelector('.in-rest')?.value || '',
        rpe: el.querySelector('.in-rpe')?.value || '',
        cues: el.querySelector('.in-cues')?.value || ''
    }));
}

function resetCanvas() {
    dom.workoutCanvas.innerHTML = '<div class="empty-canvas">Drag exercises here to start building</div>';
    document.getElementById('programName').value = '';
    document.getElementById('assignClient').value = '';
}

async function saveProgram() {
    if (!state.user) { toast('Sign in first'); return; }
    const name = document.getElementById('programName').value.trim();
    if (!name) { toast('Name your program first'); return; }
    const exercises = collectCanvasExercises();
    if (exercises.length === 0) { toast('Add at least one exercise'); return; }
    const rosterId = document.getElementById('assignClient').value || null;
    const rosterEntry = rosterId ? state.clients.find(c => c.id === rosterId) : null;
    const clientUid = rosterEntry?.clientUid || null;

    try {
        await fb.addDoc(fb.collection(db, 'programs'), {
            name,
            trainerUid: state.user.uid,
            rosterId,
            clientUid,
            clientName: rosterEntry?.name || null,
            exercises,
            travelMode: state.travelTier || (state.isTravelMode ? 'room' : 'full'),
            createdAt: fb.serverTimestamp(),
            updatedAt: fb.serverTimestamp()
        });
        toast(clientUid ? `Saved & assigned to ${rosterEntry.name}` : 'Saved as unassigned template');
        resetCanvas();
    } catch (e) {
        console.error(e);
        toast('Save failed: ' + e.message);
    }
}

function toast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('active');
    setTimeout(() => t.classList.remove('active'), 3000);
}

function populateClientDropdown() {
    const select = document.getElementById('assignClient');
    if (!select) return;
    const currentVal = select.value;
    select.innerHTML = '<option value="">Assign to Client...</option>';
    state.clients.forEach(c => {
        const label = c.clientUid ? `${c.name} ✓` : `${c.name} (no link)`;
        const opt = new Option(label, c.id);
        if (!c.clientUid) opt.disabled = true;
        select.add(opt);
    });
    select.value = currentVal;
}


// Start App
init();

