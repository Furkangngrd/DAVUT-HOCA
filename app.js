/* ============================================
   GS NOTLARIM - Ana Uygulama Mantığı
   Firebase Firestore + Sürükle-Bırak + Demo Modu
   ============================================ */

// ===== Firebase Yapılandırması =====
// KULLANICI NOTU: Gerçek Firebase kullanmak için aşağıdaki yapılandırmayı doldurun
const firebaseConfig = {
    apiKey: "",
    authDomain: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: ""
};

// ===== Demo Modu =====
// Firebase yapılandırması yoksa demo veriler kullanılır
const DEMO_MODE = !firebaseConfig.apiKey;

// ===== Veri Yönetimi =====
class NoteApp {
    constructor() {
        this.notes = [];
        this.folders = [];
        this.currentFolder = 'all';
        this.editingNoteId = null;
        this.editingFolderId = null;
        this.searchQuery = '';
        this.isListView = false;
        this.draggedNoteId = null;

        this.init();
    }

    init() {
        this.loadFromStorage();
        this.bindEvents();
        this.render();
        this.updateStats();
        this.updateConnectionStatus();

        if (this.notes.length === 0 && this.folders.length === 0) {
            this.loadDemoData();
        }

        // Firebase başlat (eğer config varsa)
        if (!DEMO_MODE) {
            this.initFirebase();
        }

        // Sekmeler arası eş zamanlı senkronizasyon
        // Bir sekmede değişiklik yapıldığında diğer sekme otomatik güncellenir
        window.addEventListener('storage', (e) => {
            if (e.key === 'gs_notes' || e.key === 'gs_folders') {
                this.loadFromStorage();
                this.render();
                this.updateStats();
            }
            if (e.key === 'gs_theme') {
                document.body.setAttribute('data-theme', e.newValue === 'light' ? 'light' : '');
            }
        });
    }

    // ----- Firebase Entegrasyonu (Compat SDK) -----
    initFirebase() {
        try {
            if (typeof firebase === 'undefined') {
                console.warn('Firebase SDK yüklenmedi. Demo modda devam ediliyor.');
                return;
            }

            firebase.initializeApp(firebaseConfig);
            this.db = firebase.firestore();

            // Gerçek zamanlı dinleme - Notlar
            this.db.collection('notes').orderBy('updatedAt', 'desc').onSnapshot((snapshot) => {
                this.notes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                this.render();
                this.updateStats();
            });

            // Gerçek zamanlı dinleme - Klasörler
            this.db.collection('folders').orderBy('name').onSnapshot((snapshot) => {
                this.folders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                this.renderFolders();
                this.updateStats();
            });

            this.updateConnectionStatus(true);
            this.showToast('Firebase bağlantısı kuruldu!', 'success');

        } catch (error) {
            console.error('Firebase başlatılamadı:', error);
            this.showToast('Firebase bağlantısı kurulamadı. Demo modda çalışılıyor.', 'error');
        }
    }

    // ----- LocalStorage Yönetimi -----
    saveToStorage() {
        localStorage.setItem('gs_notes', JSON.stringify(this.notes));
        localStorage.setItem('gs_folders', JSON.stringify(this.folders));
    }

    loadFromStorage() {
        try {
            const notes = localStorage.getItem('gs_notes');
            const folders = localStorage.getItem('gs_folders');
            if (notes) this.notes = JSON.parse(notes);
            if (folders) this.folders = JSON.parse(folders);
        } catch (e) {
            console.error('Veri yüklenirken hata:', e);
        }
    }

    // ----- Varsayılan Klasörler -----
    loadDemoData() {
        this.folders = [
            { id: this.generateId(), name: 'Kişisel', icon: '🏠', createdAt: Date.now() },
            { id: this.generateId(), name: 'İş', icon: '💼', createdAt: Date.now() },
            { id: this.generateId(), name: 'Eğitim', icon: '📚', createdAt: Date.now() },
            { id: this.generateId(), name: 'Galatasaray', icon: '🦁', createdAt: Date.now() },
        ];

        this.notes = [];

        this.saveToStorage();
        this.render();
        this.updateStats();
    }

    // ----- Olay Bağlama -----
    bindEvents() {
        // Yeni Not
        document.getElementById('addNoteBtn').addEventListener('click', () => this.openNoteModal());

        // Yeni Klasör
        document.getElementById('addFolderBtn').addEventListener('click', () => this.openFolderModal());

        // Modal Kapat
        document.getElementById('closeModal').addEventListener('click', () => this.closeNoteModal());
        document.getElementById('closeFolderModal').addEventListener('click', () => this.closeFolderModal());
        document.getElementById('noteModal').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) this.closeNoteModal();
        });
        document.getElementById('folderModal').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) this.closeFolderModal();
        });

        // Kaydet
        document.getElementById('saveNoteBtn').addEventListener('click', () => this.saveNote());
        document.getElementById('saveFolderBtn').addEventListener('click', () => this.saveFolder());

        // Sil
        document.getElementById('deleteNoteBtn').addEventListener('click', () => this.deleteNote());
        document.getElementById('deleteFolderBtn').addEventListener('click', () => this.deleteFolder());

        // Arama
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.searchQuery = e.target.value.toLowerCase();
            this.render();
        });

        // Görünüm değiştir
        document.getElementById('viewToggle').addEventListener('click', () => {
            this.isListView = !this.isListView;
            this.render();
        });

        // Tema değiştir
        document.getElementById('themeToggle').addEventListener('click', () => {
            const body = document.body;
            const current = body.getAttribute('data-theme');
            body.setAttribute('data-theme', current === 'light' ? '' : 'light');
            localStorage.setItem('gs_theme', current === 'light' ? 'dark' : 'light');
        });

        // Kayıtlı tema
        const savedTheme = localStorage.getItem('gs_theme');
        if (savedTheme === 'light') {
            document.body.setAttribute('data-theme', 'light');
        }

        // Renk seçici
        document.getElementById('colorPicker').addEventListener('click', (e) => {
            const opt = e.target.closest('.color-opt');
            if (!opt) return;
            document.querySelectorAll('.color-opt').forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
        });

        // Öncelik seçici
        document.getElementById('priorityPicker').addEventListener('click', (e) => {
            const opt = e.target.closest('.priority-opt');
            if (!opt) return;
            document.querySelectorAll('.priority-opt').forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
        });

        // Klasör ikon seçici
        document.getElementById('folderIconPicker').addEventListener('click', (e) => {
            const opt = e.target.closest('.folder-icon-opt');
            if (!opt) return;
            document.querySelectorAll('.folder-icon-opt').forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
        });

        // Klavye kısayolları
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeNoteModal();
                this.closeFolderModal();
            }
            // Ctrl+N = Yeni Not
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                this.openNoteModal();
            }
        });
    }

    // ----- Render İşlemleri -----
    render() {
        this.renderNotes();
        this.renderFolders();
        this.updateFolderSelect();
    }

    renderNotes() {
        const grid = document.getElementById('notesGrid');
        const emptyState = document.getElementById('emptyState');

        let filteredNotes = this.getFilteredNotes();

        if (this.isListView) {
            grid.classList.add('list-view');
        } else {
            grid.classList.remove('list-view');
        }

        if (filteredNotes.length === 0) {
            grid.innerHTML = '';
            emptyState.style.display = 'flex';
            return;
        }

        emptyState.style.display = 'none';

        grid.innerHTML = filteredNotes.map(note => {
            const folder = this.folders.find(f => f.id === note.folderId);
            const dateStr = this.formatDate(note.updatedAt || note.createdAt);

            return `
                <div class="note-card" 
                     data-id="${note.id}" 
                     draggable="true"
                     style="--note-color: ${note.color || '#A90432'}"
                     onclick="app.openNoteModal('${note.id}')">
                    <div class="note-header">
                        <div class="note-title">${this.escapeHtml(note.title || 'Başlıksız Not')}</div>
                        <div class="note-priority ${note.priority || 'medium'}"></div>
                    </div>
                    <div class="note-preview">${this.escapeHtml(note.content || '')}</div>
                    <div class="note-footer">
                        <span class="note-date">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
                                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                            </svg>
                            ${dateStr}
                        </span>
                        ${folder ? `<span class="note-folder-tag">${folder.icon} ${this.escapeHtml(folder.name)}</span>` : ''}
                    </div>
                </div>
            `;
        }).join('');

        // Sürükle-Bırak olaylarını bağla
        this.bindDragEvents();
    }

    renderFolders() {
        const list = document.getElementById('folderList');

        const allFolderItem = `
            <div class="folder-item ${this.currentFolder === 'all' ? 'active' : ''}" 
                 data-folder="all"
                 onclick="app.selectFolder('all')">
                <span class="folder-emoji">📋</span>
                <span class="folder-name">Tüm Notlar</span>
                <span class="folder-count">${this.notes.length}</span>
            </div>
        `;

        const folderItems = this.folders.map(folder => {
            const noteCount = this.notes.filter(n => n.folderId === folder.id).length;
            return `
                <div class="folder-item ${this.currentFolder === folder.id ? 'active' : ''}" 
                     data-folder="${folder.id}"
                     onclick="app.selectFolder('${folder.id}')"
                     ondblclick="app.openFolderModal('${folder.id}')">
                    <span class="folder-emoji">${folder.icon}</span>
                    <span class="folder-name">${this.escapeHtml(folder.name)}</span>
                    <span class="folder-count">${noteCount}</span>
                </div>
            `;
        }).join('');

        list.innerHTML = allFolderItem + folderItems;

        // Klasörlere drop hedefi olaylarını bağla
        this.bindFolderDropEvents();
    }

    updateFolderSelect() {
        const select = document.getElementById('noteFolder');
        select.innerHTML = '<option value="">Klasör seçin...</option>' +
            this.folders.map(f => `<option value="${f.id}">${f.icon} ${this.escapeHtml(f.name)}</option>`).join('');
    }

    // ----- Sürükle & Bırak -----
    bindDragEvents() {
        const cards = document.querySelectorAll('.note-card');

        cards.forEach(card => {
            card.addEventListener('dragstart', (e) => {
                this.draggedNoteId = card.dataset.id;
                card.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', card.dataset.id);

                // Yarı saydam kopyasını göster
                setTimeout(() => card.style.opacity = '0.4', 0);
            });

            card.addEventListener('dragend', (e) => {
                card.classList.remove('dragging');
                card.style.opacity = '1';
                this.draggedNoteId = null;

                // Tüm drop hedeflerini temizle
                document.querySelectorAll('.drop-target').forEach(el => el.classList.remove('drop-target'));
            });
        });

        // Grid üzerinde yeniden sıralama
        const grid = document.getElementById('notesGrid');
        grid.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';

            const afterElement = this.getDragAfterElement(grid, e.clientY);
            const dragging = document.querySelector('.dragging');
            if (!dragging) return;

            if (afterElement == null) {
                grid.appendChild(dragging);
            } else {
                grid.insertBefore(dragging, afterElement);
            }
        });

        grid.addEventListener('drop', (e) => {
            e.preventDefault();
            // Yeni sıralamayı kaydet
            const cardElements = [...grid.querySelectorAll('.note-card')];
            cardElements.forEach((el, index) => {
                const note = this.notes.find(n => n.id === el.dataset.id);
                if (note) note.order = index;
            });

            this.notes.sort((a, b) => (a.order || 0) - (b.order || 0));
            this.saveToStorage();
        });
    }

    bindFolderDropEvents() {
        const folderItems = document.querySelectorAll('.folder-item');

        folderItems.forEach(item => {
            item.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                item.classList.add('drop-target');
            });

            item.addEventListener('dragleave', (e) => {
                item.classList.remove('drop-target');
            });

            item.addEventListener('drop', (e) => {
                e.preventDefault();
                item.classList.remove('drop-target');

                const noteId = e.dataTransfer.getData('text/plain');
                const folderId = item.dataset.folder;

                if (noteId && folderId) {
                    this.moveNoteToFolder(noteId, folderId === 'all' ? '' : folderId);
                }
            });
        });
    }

    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.note-card:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset, element: child };
            }
            return closest;
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    moveNoteToFolder(noteId, folderId) {
        const note = this.notes.find(n => n.id === noteId);
        if (!note) return;

        note.folderId = folderId;
        note.updatedAt = Date.now();

        if (!DEMO_MODE && this.db) {
            this.db.collection('notes').doc(noteId).update({ folderId, updatedAt: Date.now() });
        }

        this.saveToStorage();
        this.render();

        const folder = this.folders.find(f => f.id === folderId);
        const folderName = folder ? folder.name : 'Tüm Notlar';
        this.showToast(`Not "${folderName}" klasörüne taşındı`, 'success');
    }

    // ----- Not CRUD -----
    openNoteModal(noteId = null) {
        const modal = document.getElementById('noteModal');
        const titleEl = document.getElementById('modalTitle');
        const titleInput = document.getElementById('noteTitle');
        const contentInput = document.getElementById('noteContent');
        const folderSelect = document.getElementById('noteFolder');
        const deleteBtn = document.getElementById('deleteNoteBtn');

        this.updateFolderSelect();

        if (noteId) {
            const note = this.notes.find(n => n.id === noteId);
            if (!note) return;

            this.editingNoteId = noteId;
            titleEl.textContent = 'Notu Düzenle';
            titleInput.value = note.title || '';
            contentInput.value = note.content || '';
            folderSelect.value = note.folderId || '';
            deleteBtn.style.display = 'flex';

            // Renk seçimi
            document.querySelectorAll('.color-opt').forEach(o => {
                o.classList.toggle('active', o.dataset.color === note.color);
            });

            // Öncelik seçimi
            document.querySelectorAll('.priority-opt').forEach(o => {
                o.classList.toggle('active', o.dataset.priority === (note.priority || 'medium'));
            });
        } else {
            this.editingNoteId = null;
            titleEl.textContent = 'Yeni Not';
            titleInput.value = '';
            contentInput.value = '';
            folderSelect.value = this.currentFolder === 'all' ? '' : this.currentFolder;
            deleteBtn.style.display = 'none';

            // Varsayılanlar
            document.querySelectorAll('.color-opt').forEach((o, i) => o.classList.toggle('active', i === 0));
            document.querySelectorAll('.priority-opt').forEach(o => o.classList.toggle('active', o.dataset.priority === 'medium'));
        }

        modal.classList.add('active');
        setTimeout(() => titleInput.focus(), 300);
    }

    closeNoteModal() {
        document.getElementById('noteModal').classList.remove('active');
        this.editingNoteId = null;
    }

    async saveNote() {
        const title = document.getElementById('noteTitle').value.trim();
        const content = document.getElementById('noteContent').value.trim();
        const folderId = document.getElementById('noteFolder').value;
        const color = document.querySelector('.color-opt.active')?.dataset.color || '#A90432';
        const priority = document.querySelector('.priority-opt.active')?.dataset.priority || 'medium';

        if (!title && !content) {
            this.showToast('Lütfen bir başlık veya içerik girin.', 'error');
            return;
        }

        const noteData = {
            title: title || 'Başlıksız Not',
            content,
            color,
            priority,
            folderId,
            updatedAt: Date.now()
        };

        if (this.editingNoteId) {
            // Güncelle
            const note = this.notes.find(n => n.id === this.editingNoteId);
            if (note) {
                Object.assign(note, noteData);
            }

            if (!DEMO_MODE && this.db) {
                await this.db.collection('notes').doc(this.editingNoteId).update(noteData);
            }

            this.showToast('Not güncellendi ✏️', 'success');
        } else {
            // Yeni oluştur
            noteData.id = this.generateId();
            noteData.createdAt = Date.now();
            noteData.order = this.notes.length;
            this.notes.unshift(noteData);

            if (!DEMO_MODE && this.db) {
                await this.db.collection('notes').add(noteData);
            }

            this.showToast('Yeni not oluşturuldu 📝', 'success');
        }

        this.saveToStorage();
        this.closeNoteModal();
        this.render();
        this.updateStats();
    }

    async deleteNote() {
        if (!this.editingNoteId) return;

        if (!confirm('Bu notu silmek istediğinize emin misiniz?')) return;

        this.notes = this.notes.filter(n => n.id !== this.editingNoteId);

        if (!DEMO_MODE && this.db) {
            await this.db.collection('notes').doc(this.editingNoteId).delete();
        }

        this.saveToStorage();
        this.closeNoteModal();
        this.render();
        this.updateStats();
        this.showToast('Not silindi 🗑️', 'info');
    }

    // ----- Klasör CRUD -----
    openFolderModal(folderId = null) {
        const modal = document.getElementById('folderModal');
        const titleEl = document.getElementById('folderModalTitle');
        const nameInput = document.getElementById('folderName');
        const deleteBtn = document.getElementById('deleteFolderBtn');

        if (folderId) {
            const folder = this.folders.find(f => f.id === folderId);
            if (!folder) return;

            this.editingFolderId = folderId;
            titleEl.textContent = 'Klasörü Düzenle';
            nameInput.value = folder.name;
            deleteBtn.style.display = 'flex';

            document.querySelectorAll('.folder-icon-opt').forEach(o => {
                o.classList.toggle('active', o.dataset.icon === folder.icon);
            });
        } else {
            this.editingFolderId = null;
            titleEl.textContent = 'Yeni Klasör';
            nameInput.value = '';
            deleteBtn.style.display = 'none';

            document.querySelectorAll('.folder-icon-opt').forEach((o, i) => o.classList.toggle('active', i === 0));
        }

        modal.classList.add('active');
        setTimeout(() => nameInput.focus(), 300);
    }

    closeFolderModal() {
        document.getElementById('folderModal').classList.remove('active');
        this.editingFolderId = null;
    }

    async saveFolder() {
        const name = document.getElementById('folderName').value.trim();
        const icon = document.querySelector('.folder-icon-opt.active')?.dataset.icon || '📁';

        if (!name) {
            this.showToast('Lütfen bir klasör adı girin.', 'error');
            return;
        }

        const folderData = { name, icon };

        if (this.editingFolderId) {
            const folder = this.folders.find(f => f.id === this.editingFolderId);
            if (folder) Object.assign(folder, folderData);

            if (!DEMO_MODE && this.db) {
                await this.db.collection('folders').doc(this.editingFolderId).update(folderData);
            }

            this.showToast('Klasör güncellendi 📁', 'success');
        } else {
            folderData.id = this.generateId();
            folderData.createdAt = Date.now();
            this.folders.push(folderData);

            if (!DEMO_MODE && this.db) {
                await this.db.collection('folders').add(folderData);
            }

            this.showToast('Yeni klasör oluşturuldu 📁', 'success');
        }

        this.saveToStorage();
        this.closeFolderModal();
        this.render();
        this.updateStats();
    }

    async deleteFolder() {
        if (!this.editingFolderId) return;

        const notesInFolder = this.notes.filter(n => n.folderId === this.editingFolderId).length;
        const msg = notesInFolder > 0
            ? `Bu klasörde ${notesInFolder} not var. Klasörü silmek istediğinize emin misiniz? (Notlar "Tüm Notlar"a taşınacak)`
            : 'Bu klasörü silmek istediğinize emin misiniz?';

        if (!confirm(msg)) return;

        // Klasördeki notları serbest bırak
        this.notes.forEach(n => {
            if (n.folderId === this.editingFolderId) n.folderId = '';
        });

        this.folders = this.folders.filter(f => f.id !== this.editingFolderId);

        if (this.currentFolder === this.editingFolderId) {
            this.currentFolder = 'all';
        }

        if (!DEMO_MODE && this.db) {
            await this.db.collection('folders').doc(this.editingFolderId).delete();
        }

        this.saveToStorage();
        this.closeFolderModal();
        this.render();
        this.updateStats();
        this.showToast('Klasör silindi 🗑️', 'info');
    }

    // ----- Klasör Seçimi -----
    selectFolder(folderId) {
        this.currentFolder = folderId;

        // Breadcrumb güncelle
        const breadcrumb = document.getElementById('breadcrumb');
        if (folderId === 'all') {
            breadcrumb.innerHTML = '<span class="breadcrumb-item active" data-folder="all">Tüm Notlar</span>';
        } else {
            const folder = this.folders.find(f => f.id === folderId);
            breadcrumb.innerHTML = `
                <span class="breadcrumb-item" onclick="app.selectFolder('all')">Tüm Notlar</span>
                <span class="breadcrumb-sep">›</span>
                <span class="breadcrumb-item active">${folder ? folder.icon + ' ' + this.escapeHtml(folder.name) : ''}</span>
            `;
        }

        this.render();
    }

    // ----- Filtreleme -----
    getFilteredNotes() {
        let filtered = [...this.notes];

        // Klasör filtresi
        if (this.currentFolder !== 'all') {
            filtered = filtered.filter(n => n.folderId === this.currentFolder);
        }

        // Arama filtresi
        if (this.searchQuery) {
            filtered = filtered.filter(n =>
                (n.title || '').toLowerCase().includes(this.searchQuery) ||
                (n.content || '').toLowerCase().includes(this.searchQuery)
            );
        }

        // Sıralama: güncelleme tarihi (en yeni)
        filtered.sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));

        return filtered;
    }

    // ----- Yardımcı Fonksiyonlar -----
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }

    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    formatDate(timestamp) {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) return 'Az önce';
        if (diff < 3600000) return Math.floor(diff / 60000) + ' dk önce';
        if (diff < 86400000) return Math.floor(diff / 3600000) + ' saat önce';
        if (diff < 604800000) return Math.floor(diff / 86400000) + ' gün önce';

        return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
    }

    updateStats() {
        document.getElementById('noteCount').textContent = this.notes.length + ' not';
        document.getElementById('folderCount').textContent = this.folders.length + ' klasör';
    }

    updateConnectionStatus(connected = false) {
        const badge = document.getElementById('connectionStatus');
        const dot = badge.querySelector('.status-dot');
        const text = badge.querySelector('span:last-child');

        if (connected) {
            dot.classList.remove('offline');
            text.textContent = 'Bağlı';
        } else {
            dot.classList.add('offline');
            text.textContent = 'Demo Mod';
        }
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'toastOut 0.3s forwards';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// ===== Uygulamayı Başlat =====
const app = new NoteApp();
