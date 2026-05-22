// ===== Client View Logic =====
import { firebaseConfig } from './firebase-config.js';

let auth = null;
let db = null;
const fb = {};

const state = {
    user: null,
    currentView: 'my-dash',
    assignedWorkouts: [],
    workoutHistory: [],
    activeProgram: null
};

const dom = {
    splash: document.getElementById('splash'),
    app: document.getElementById('app'),
    signinPane: document.getElementById('signinPane'),
    invitePane: document.getElementById('invitePane'),
    clientViewTitle: document.getElementById('clientViewTitle'),
    clientGreeting: document.getElementById('clientGreeting'),
    navItems: document.querySelectorAll('.nav-item'),
    views: document.querySelectorAll('.view'),
    assignedList: document.getElementById('assignedWorkouts'),
    historyList: document.getElementById('historyList'),
    trackerName: document.getElementById('trackingWorkoutName'),
    exerciseLogs: document.getElementById('exerciseLogs'),
    btnFinish: document.getElementById('btnFinishWorkout'),
    btnSignOut: document.getElementById('btnClientSignOut'),
    identityLabel: document.getElementById('clientIdentity')
};

// ===== Initialization =====
async function init() {
    setupEventListeners();

    try {
        const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js');
        const authMod = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js');
        const fsMod = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
        const { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword } = authMod;
        const { getFirestore, collection, doc, onSnapshot, addDoc, setDoc, getDoc, serverTimestamp, query, where, orderBy } = fsMod;

        const app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
        Object.assign(fb, { collection, doc, onSnapshot, addDoc, setDoc, getDoc, serverTimestamp, query, where, orderBy });

        onAuthStateChanged(auth, (user) => {
            if (user) {
                state.user = user;
                dom.splash.classList.add('hide');
                dom.app.classList.remove('hide');
                dom.clientGreeting.textContent = `Ready for your session?`;
                if (dom.identityLabel) dom.identityLabel.textContent = user.email || '';
                subscribeAssignedWorkouts();
                subscribeWorkoutHistory();
            } else {
                dom.app.classList.add('hide');
                dom.splash.classList.remove('hide');
                state.assignedWorkouts = [];
                state.workoutHistory = [];
                if (dom.identityLabel) dom.identityLabel.textContent = '';
            }
        });

        // Sign out button
        if (dom.btnSignOut) {
            dom.btnSignOut.onclick = async () => {
                try {
                    const { signOut } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js');
                    await signOut(auth);
                    toast('Signed out');
                } catch (e) {
                    console.error(e);
                    toast('Sign out failed');
                }
            };
        }

        // Sign in (existing user)
        document.getElementById('btnClientSignIn').onclick = async () => {
            const email = document.getElementById('cliAuthEmail').value.trim();
            const password = document.getElementById('cliAuthPassword').value;
            if (!email || !password) { toast('Email and password required'); return; }
            try {
                await signInWithEmailAndPassword(auth, email, password);
            } catch (e) {
                toast(friendlyAuthError(e));
            }
        };

        // Claim invite (new user)
        document.getElementById('btnClaimInvite').onclick = async () => {
            const code = document.getElementById('cliInviteCode').value.trim().toUpperCase();
            const name = document.getElementById('cliSignupName').value.trim();
            const email = document.getElementById('cliSignupEmail').value.trim();
            const password = document.getElementById('cliSignupPassword').value;
            if (!code || code.length !== 6) { toast('Enter the 6-character code'); return; }
            if (!name || !email || !password) { toast('Fill in all fields'); return; }

            try {
                // 1. Look up the invite code (must exist and be unused)
                const codeRef = doc(db, 'inviteCodes', code);
                const codeSnap = await getDoc(codeRef);
                if (!codeSnap.exists()) { toast('Invite code not found'); return; }
                const codeData = codeSnap.data();
                if (codeData.used) { toast('This code has already been used'); return; }

                // 2. Create the auth account
                const cred = await createUserWithEmailAndPassword(auth, email, password);
                const clientUid = cred.user.uid;

                // 3. Link the client UID onto the trainer's roster entry
                await setDoc(
                    doc(db, 'users', codeData.trainerUid, 'clients', codeData.rosterId),
                    { clientUid, clientName: name, linkedAt: serverTimestamp() },
                    { merge: true }
                );

                // 4. Mark the code used
                await setDoc(codeRef, {
                    used: true,
                    clientUid,
                    claimedAt: serverTimestamp()
                }, { merge: true });

                toast(`Welcome, ${name}!`);
            } catch (e) {
                console.error(e);
                toast(friendlyAuthError(e));
            }
        };
    } catch (e) {
        console.error("Client Firebase init error", e);
        toast('Firebase failed to load');
    }
}

function setupEventListeners() {
    dom.navItems.forEach(item => {
        item.addEventListener('click', () => switchView(item.dataset.view));
    });

    document.getElementById('btnShowInvite').onclick = () => {
        dom.signinPane.classList.add('hide');
        dom.invitePane.classList.remove('hide');
    };
    document.getElementById('btnBackToSignIn').onclick = () => {
        dom.invitePane.classList.add('hide');
        dom.signinPane.classList.remove('hide');
    };

    dom.btnFinish.onclick = saveWorkoutLog;
}

// ===== Assigned Workouts (real-time) =====
function subscribeAssignedWorkouts() {
    const q = fb.query(
        fb.collection(db, 'programs'),
        fb.where('clientUid', '==', state.user.uid)
    );
    fb.onSnapshot(q, (snap) => {
        state.assignedWorkouts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        renderAssignedWorkouts();
    }, (err) => {
        console.error('programs listener', err);
    });
}

function renderAssignedWorkouts() {
    if (state.assignedWorkouts.length === 0) {
        dom.assignedList.innerHTML = `
            <div class="workout-card card">
                <h3>No workouts yet</h3>
                <p style="color:var(--text-secondary); margin-top:0.5rem;">When your trainer assigns a program, it will show up here.</p>
            </div>`;
        return;
    }
    dom.assignedList.innerHTML = state.assignedWorkouts.map(w => `
        <div class="workout-card card" data-program-id="${w.id}">
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <div>
                    <h3 style="margin-bottom:5px;">${w.name}</h3>
                    <p style="font-size:0.85rem; opacity:0.7;">${w.exercises?.length || 0} exercises${w.travelMode && w.travelMode !== 'full' ? ' • ✈️ Travel' : ''}</p>
                </div>
                <span class="status-badge active">Assigned</span>
            </div>
            <button class="btn btn-primary" style="margin-top:1.5rem; width:100%;" data-start="${w.id}">Start Session</button>
        </div>
    `).join('');
    dom.assignedList.querySelectorAll('[data-start]').forEach(btn => {
        btn.onclick = () => startWorkout(btn.dataset.start);
    });
}

function startWorkout(programId) {
    const program = state.assignedWorkouts.find(w => w.id === programId);
    if (!program) return;
    state.activeProgram = program;
    switchView('tracker');
    dom.trackerName.textContent = program.name;
    renderTracker(program);
}

function renderTracker(program) {
    dom.exerciseLogs.innerHTML = program.exercises.map((ex, exIdx) => {
        const setCount = parseInt(ex.sets, 10) || 3;
        const setInputs = Array.from({ length: setCount }, (_, i) => `
            <div class="set-row">
                <span class="set-label">Set ${i + 1}</span>
                <input type="number" placeholder="Reps" data-ex="${exIdx}" data-set="${i}" data-field="reps" />
                <input type="number" placeholder="Weight" data-ex="${exIdx}" data-set="${i}" data-field="weight" step="0.5" />
            </div>
        `).join('');
        return `
            <div class="card" style="margin-bottom:1rem;">
                <strong>${ex.title}</strong>
                <p style="font-size:0.8rem; color:var(--text-secondary); margin:4px 0 10px;">
                    Target: ${ex.sets} × ${ex.reps}${ex.weight ? ` @ ${ex.weight}` : ''}${ex.rest ? ` • Rest ${ex.rest}` : ''}
                </p>
                ${ex.cues ? `<p style="font-size:0.78rem; color:var(--accent-orange); margin-bottom:10px; font-style:italic;">"${ex.cues}"</p>` : ''}
                ${setInputs}
            </div>
        `;
    }).join('');
}

async function saveWorkoutLog() {
    if (!state.activeProgram || !state.user) return;
    const program = state.activeProgram;

    // Walk the tracker DOM and collect sets
    const loggedExercises = program.exercises.map((ex, exIdx) => {
        const setCount = parseInt(ex.sets, 10) || 3;
        const sets = [];
        for (let i = 0; i < setCount; i++) {
            const reps = dom.exerciseLogs.querySelector(`[data-ex="${exIdx}"][data-set="${i}"][data-field="reps"]`)?.value;
            const weight = dom.exerciseLogs.querySelector(`[data-ex="${exIdx}"][data-set="${i}"][data-field="weight"]`)?.value;
            sets.push({ reps: reps || null, weight: weight || null });
        }
        return { exerciseId: ex.exerciseId, title: ex.title, target: { sets: ex.sets, reps: ex.reps, weight: ex.weight }, sets };
    });

    try {
        await fb.addDoc(fb.collection(db, 'clientLogs'), {
            clientUid: state.user.uid,
            trainerUid: program.trainerUid,
            programId: program.id,
            programName: program.name,
            exercises: loggedExercises,
            completedAt: fb.serverTimestamp()
        });
        toast('Workout saved');
        state.activeProgram = null;
        switchView('my-dash');
    } catch (e) {
        console.error(e);
        toast('Save failed: ' + e.message);
    }
}

// ===== History =====
function subscribeWorkoutHistory() {
    const q = fb.query(
        fb.collection(db, 'clientLogs'),
        fb.where('clientUid', '==', state.user.uid),
        fb.orderBy('completedAt', 'desc')
    );
    fb.onSnapshot(q, (snap) => {
        state.workoutHistory = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        renderHistory();
    }, (err) => {
        console.error('history listener', err);
    });
}

function renderHistory() {
    if (!dom.historyList) return;
    if (state.workoutHistory.length === 0) {
        dom.historyList.innerHTML = `<div class="card"><p style="color:var(--text-secondary);">No sessions logged yet.</p></div>`;
        return;
    }
    dom.historyList.innerHTML = state.workoutHistory.map(log => {
        const date = log.completedAt?.toDate ? log.completedAt.toDate().toLocaleDateString() : 'Pending';
        const totalSets = log.exercises?.reduce((s, e) => s + e.sets.filter(set => set.reps).length, 0) || 0;
        return `
            <div class="card" style="margin-bottom:1rem;">
                <div style="display:flex; justify-content:space-between;">
                    <strong>${log.programName}</strong>
                    <span style="color:var(--text-secondary); font-size:0.85rem;">${date}</span>
                </div>
                <p style="color:var(--text-secondary); font-size:0.85rem; margin-top:5px;">${totalSets} sets logged across ${log.exercises?.length || 0} exercises</p>
            </div>
        `;
    }).join('');
}

function switchView(viewId) {
    state.currentView = viewId;
    dom.navItems.forEach(item => item.classList.toggle('active', item.dataset.view === viewId));
    dom.views.forEach(view => view.classList.toggle('active', view.id === `view-${viewId}`));
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
        'auth/user-not-found': 'No account with that email — use an invite code instead',
        'auth/wrong-password': 'Wrong password',
        'auth/too-many-requests': 'Too many attempts — wait a minute and try again',
        'auth/network-request-failed': 'Network error — check your connection',
        'auth/unauthorized-domain': 'This domain is not authorized in Firebase Auth settings'
    };
    return map[code] || e?.message || 'Authentication failed';
}

function toast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('active');
    setTimeout(() => t.classList.remove('active'), 3000);
}

init();
