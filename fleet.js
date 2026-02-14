// fleet.js - Gestion de la flotte de chariots élévateurs

// Vérifier l'authentification
function checkAuth() {
    const session = localStorage.getItem('admin-session');
    if (!session) {
        window.location.href = 'login.html';
        return false;
    }

    const sessionData = JSON.parse(session);
    if (!sessionData.loggedIn) {
        window.location.href = 'login.html';
        return false;
    }

    // Afficher le nom de l'utilisateur
    document.getElementById('userName').textContent = sessionData.email.split('@')[0];
    return true;
}

// Initialiser les données demo si aucune donnée n'existe
function initDemoData() {
    const existing = localStorage.getItem('forklifts');
    if (!existing) {
        const demoForklifts = [
            {
                id: 'fork-001',
                name: 'ISUZU-V1',
                model: 'ISUZU V1',
                ip: '192.168.4.1',
                serial: 'SN-2024-001',
                description: 'Chariot principal entrepôt A',
                addedDate: new Date().toISOString(),
                lastSeen: new Date(Date.now() - 120000).toISOString(), // 2 min ago
                status: 'online',
                health: {
                    temp: 'ok',
                    oil: 'ok',
                    fuel: 72
                }
            },
            {
                id: 'fork-002',
                name: 'ISUZU-V2',
                model: 'ISUZU V2',
                ip: '192.168.4.2',
                serial: 'SN-2024-002',
                description: 'Chariot secondaire entrepôt B',
                addedDate: new Date().toISOString(),
                lastSeen: new Date(Date.now() - 300000).toISOString(), // 5 min ago
                status: 'online',
                health: {
                    temp: 'warning',
                    oil: 'ok',
                    fuel: 15
                }
            },
            {
                id: 'fork-003',
                name: 'ISUZU-V3',
                model: 'ISUZU V3',
                ip: '192.168.4.3',
                serial: 'SN-2024-003',
                description: 'Chariot réserve',
                addedDate: new Date().toISOString(),
                lastSeen: new Date(Date.now() - 10800000).toISOString(), // 3 hours ago
                status: 'offline',
                health: {
                    temp: null,
                    oil: null,
                    fuel: 0
                }
            }
        ];

        localStorage.setItem('forklifts', JSON.stringify(demoForklifts));
    }
}

// Récupérer tous les chariots
function getForklifts() {
    const data = localStorage.getItem('forklifts');
    return data ? JSON.parse(data) : [];
}

// Sauvegarder les chariots
function saveForklifts(forklifts) {
    localStorage.setItem('forklifts', JSON.stringify(forklifts));
}

// Générer ID unique
function generateId() {
    return 'fork-' + Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Calculer le temps écoulé
function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);

    if (seconds < 60) return `Il y a ${seconds}s`;
    if (seconds < 3600) return `Il y a ${Math.floor(seconds / 60)}min`;
    if (seconds < 86400) return `Il y a ${Math.floor(seconds / 3600)}h`;
    return `Il y a ${Math.floor(seconds / 86400)}j`;
}

// Afficher les statistiques
function updateStats() {
    const forklifts = getForklifts();
    const totalCount = forklifts.length;
    const onlineCount = forklifts.filter(f => f.status === 'online').length;
    const offlineCount = forklifts.filter(f => f.status === 'offline').length;
    const alertCount = forklifts.filter(f => {
        if (f.status === 'offline') return false;
        return f.health.temp === 'warning' || f.health.temp === 'danger' ||
            f.health.oil === 'warning' || f.health.oil === 'danger' ||
            f.health.fuel < 20;
    }).length;

    document.getElementById('totalCount').textContent = totalCount;
    document.getElementById('onlineCount').textContent = onlineCount;
    document.getElementById('offlineCount').textContent = offlineCount;
    document.getElementById('alertCount').textContent = alertCount;
}

// Créer une carte de chariot
function createForkliftCard(forklift) {
    const card = document.createElement('div');
    card.className = 'forklift-card';
    card.dataset.id = forklift.id;

    const tempIcon = forklift.health.temp === 'ok' ? '✅' : forklift.health.temp === 'warning' ? '⚠️' : forklift.health.temp === 'danger' ? '🚨' : '--';
    const oilIcon = forklift.health.oil === 'ok' ? '✅' : forklift.health.oil === 'warning' ? '⚠️' : forklift.health.oil === 'danger' ? '🚨' : '--';
    const fuelValue = forklift.health.fuel || '--';

    card.innerHTML = `
        <div class="forklift-header">
            <div>
                <div class="forklift-name">${forklift.name}</div>
                <div class="forklift-model">${forklift.model}</div>
            </div>
            <div class="status-badge ${forklift.status}">
                <div class="status-dot"></div>
                ${forklift.status === 'online' ? 'EN LIGNE' : 'HORS LIGNE'}
            </div>
        </div>
        
        <div class="forklift-stats">
            <div class="stat-item">
                <div class="stat-icon">🌡️</div>
                <div class="stat-value-small">${tempIcon}</div>
                <div class="stat-label-small">Temp</div>
            </div>
            <div class="stat-item">
                <div class="stat-icon">🛢️</div>
                <div class="stat-value-small">${oilIcon}</div>
                <div class="stat-label-small">Huile</div>
            </div>
            <div class="stat-item">
                <div class="stat-icon">⛽</div>
                <div class="stat-value-small">${fuelValue}%</div>
                <div class="stat-label-small">Carburant</div>
            </div>
        </div>
        
        <div class="last-seen">
            🕐 ${getTimeAgo(forklift.lastSeen)}
        </div>
        
        <div class="forklift-actions">
            <button class="btn-view" onclick="viewDashboard('${forklift.id}')">
                📊 Voir Dashboard
            </button>
            <button class="btn-delete" onclick="deleteForklift('${forklift.id}', event)">
                🗑️
            </button>
        </div>
    `;

    return card;
}

// Afficher tous les chariots
function displayForklifts(forkliftsToDisplay = null) {
    const forklifts = forkliftsToDisplay || getForklifts();
    const grid = document.getElementById('forkliftGrid');
    grid.innerHTML = '';

    if (forklifts.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-secondary);">
                <div style="font-size: 4rem; margin-bottom: 1rem;">📦</div>
                <h2>Aucun chariot dans la flotte</h2>
                <p>Cliquez sur "Ajouter un Chariot" pour commencer</p>
            </div>
        `;
        return;
    }

    forklifts.forEach(forklift => {
        grid.appendChild(createForkliftCard(forklift));
    });
}

// Filtrer les chariots
function filterForklifts() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const forklifts = getForklifts();

    const filtered = forklifts.filter(f =>
        f.name.toLowerCase().includes(searchTerm) ||
        f.model.toLowerCase().includes(searchTerm) ||
        f.description.toLowerCase().includes(searchTerm)
    );

    displayForklifts(filtered);
}

// Ouvrir le modal d'ajout
function openAddModal() {
    document.getElementById('addModal').classList.add('show');
}

// Fermer le modal d'ajout
function closeAddModal() {
    document.getElementById('addModal').classList.remove('show');
    document.getElementById('addForkliftForm').reset();
}

// Gérer la soumission du formulaire
document.getElementById('addForkliftForm').addEventListener('submit', (e) => {
    e.preventDefault();

    const newForklift = {
        id: generateId(),
        name: document.getElementById('forkliftName').value,
        model: document.getElementById('forkliftModel').value,
        ip: document.getElementById('forkliftIP').value,
        serial: document.getElementById('forkliftSerial').value || `SN-${Date.now()}`,
        description: document.getElementById('forkliftDescription').value || '',
        addedDate: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
        status: 'offline', // Par défaut offline jusqu'à connexion
        health: {
            temp: null,
            oil: null,
            fuel: 0
        }
    };

    const forklifts = getForklifts();
    forklifts.push(newForklift);
    saveForklifts(forklifts);

    closeAddModal();
    displayForklifts();
    updateStats();
});

// Supprimer un chariot
function deleteForklift(id, event) {
    event.stopPropagation();

    if (!confirm('Êtes-vous sûr de vouloir supprimer ce chariot ?')) {
        return;
    }

    const forklifts = getForklifts();
    const filtered = forklifts.filter(f => f.id !== id);
    saveForklifts(filtered);

    displayForklifts();
    updateStats();
}

// Voir le dashboard d'un chariot
function viewDashboard(id) {
    window.location.href = `dashboard.html?id=${id}`;
}

// Déconnexion
function logout() {
    if (confirm('Voulez-vous vraiment vous déconnecter ?')) {
        localStorage.removeItem('admin-session');
        window.location.href = 'login.html';
    }
}

// === SYSTÈME DE NOTIFICATIONS ===

// Générer des notifications basées sur l'état des chariots
function generateNotifications() {
    const forklifts = getForklifts();
    const notifications = [];

    forklifts.forEach(forklift => {
        if (forklift.status === 'offline') {
            notifications.push({
                id: `notif-${forklift.id}-offline`,
                type: 'danger',
                title: 'Chariot Hors Ligne',
                message: `Le chariot est hors ligne depuis ${getTimeAgo(forklift.lastSeen)}`,
                forklift: forklift.name,
                time: getTimeAgo(forklift.lastSeen),
                timestamp: forklift.lastSeen
            });
        } else {
            // Alertes de température
            if (forklift.health.temp === 'danger') {
                notifications.push({
                    id: `notif-${forklift.id}-temp-danger`,
                    type: 'danger',
                    title: '🚨 Surchauffe Critique',
                    message: 'Température moteur en zone critique ! Arrêt immédiat requis.',
                    forklift: forklift.name,
                    time: 'Maintenant',
                    timestamp: new Date().toISOString()
                });
            } else if (forklift.health.temp === 'warning') {
                notifications.push({
                    id: `notif-${forklift.id}-temp-warning`,
                    type: 'warning',
                    title: '⚠️ Température Élevée',
                    message: 'Température moteur au-dessus de la normale. Surveillance recommandée.',
                    forklift: forklift.name,
                    time: 'Il y a 5min',
                    timestamp: new Date(Date.now() - 300000).toISOString()
                });
            }

            // Alertes d'huile
            if (forklift.health.oil === 'danger') {
                notifications.push({
                    id: `notif-${forklift.id}-oil-danger`,
                    type: 'danger',
                    title: '🚨 Pression d\'Huile Critique',
                    message: 'Pression d\'huile trop basse ! Risque de dommages au moteur.',
                    forklift: forklift.name,
                    time: 'Maintenant',
                    timestamp: new Date().toISOString()
                });
            } else if (forklift.health.oil === 'warning') {
                notifications.push({
                    id: `notif-${forklift.id}-oil-warning`,
                    type: 'warning',
                    title: '⚠️ Pression d\'Huile Basse',
                    message: 'Pression d\'huile en dessous du niveau optimal.',
                    forklift: forklift.name,
                    time: 'Il y a 3min',
                    timestamp: new Date(Date.now() - 180000).toISOString()
                });
            }

            // Alertes de carburant
            if (forklift.health.fuel < 10) {
                notifications.push({
                    id: `notif-${forklift.id}-fuel-critical`,
                    type: 'danger',
                    title: '🚨 Carburant Critique',
                    message: `Niveau de carburant très bas : ${forklift.health.fuel}%. Ravitaillement urgent requis.`,
                    forklift: forklift.name,
                    time: 'Maintenant',
                    timestamp: new Date().toISOString()
                });
            } else if (forklift.health.fuel < 20) {
                notifications.push({
                    id: `notif-${forklift.id}-fuel-low`,
                    type: 'warning',
                    title: '⚠️ Carburant Faible',
                    message: `Niveau de carburant bas : ${forklift.health.fuel}%. Ravitaillement recommandé.`,
                    forklift: forklift.name,
                    time: 'Il y a 10min',
                    timestamp: new Date(Date.now() - 600000).toISOString()
                });
            }
        }
    });

    // Trier par timestamp (plus récent en premier)
    notifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return notifications;
}

// Afficher les notifications dans le panneau
function displayNotifications() {
    const notifications = generateNotifications();
    const notificationList = document.getElementById('notificationList');
    const badge = document.getElementById('notificationBadge');

    // Mettre à jour le badge
    if (notifications.length > 0) {
        badge.textContent = notifications.length;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }

    // Afficher les notifications
    if (notifications.length === 0) {
        notificationList.innerHTML = `
            <div class="notification-empty">
                <div class="notification-empty-icon">🔕</div>
                <p>Aucune notification</p>
            </div>
        `;
        return;
    }

    notificationList.innerHTML = notifications.map(notif => `
        <div class="notification-item ${notif.type}">
            <div class="notification-item-header">
                <div class="notification-item-title">${notif.title}</div>
                <div class="notification-item-time">${notif.time}</div>
            </div>
            <div class="notification-item-message">${notif.message}</div>
            <div class="notification-item-forklift">🚜 ${notif.forklift}</div>
        </div>
    `).join('');
}

// Ouvrir/fermer le panneau de notifications
function toggleNotificationPanel() {
    const panel = document.getElementById('notificationPanel');
    const overlay = document.getElementById('notificationOverlay');

    if (panel.classList.contains('open')) {
        closeNotificationPanel();
    } else {
        panel.classList.add('open');
        overlay.classList.add('show');
        displayNotifications();
    }
}

function closeNotificationPanel() {
    const panel = document.getElementById('notificationPanel');
    const overlay = document.getElementById('notificationOverlay');

    panel.classList.remove('open');
    overlay.classList.remove('show');
}

// Fermer le modal en cliquant à l'extérieur
document.getElementById('addModal').addEventListener('click', (e) => {
    if (e.target.id === 'addModal') {
        closeAddModal();
    }
});

// Initialisation au chargement de la page
window.addEventListener('DOMContentLoaded', () => {
    if (checkAuth()) {
        initDemoData();
        displayForklifts();
        updateStats();
        displayNotifications(); // Initialiser les notifications

        // Mettre à jour les temps et notifications toutes les 30 secondes
        setInterval(() => {
            displayForklifts();
            displayNotifications();
        }, 30000);
    }
});
