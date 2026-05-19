// ======================= KONFIGURASI =======================
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyTYyuUAENJLK3p82_LCJ0SaVOpcnrrI6-elsQNi6jVvVTMs_gIEhNGezCrNdIXEvagWA/exec';
const daftarNama = ['Budi','Dinda','Andi','Amira','Ziha','Dila','Crisa','Faiz','Gilang','Hawari','Rio','Rafa','Satya','Nafila','Fira','Chabibah','Farel'];

// ======================= LOCALSTORAGE =======================
const STORAGE_KEY = 'tabungan_history_local';

function getLocalHistory() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    try {
        return JSON.parse(stored);
    } catch(e) { return []; }
}

function saveLocalHistory(history) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

function addTransactionToLocal(nama, nominal) {
    let history = getLocalHistory();
    const newEntry = {
        id: Date.now(),
        nama: nama,
        nominal: Number(nominal),
        timestamp: new Date().toISOString(),
        timeLabel: new Date().toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})
    };
    history.unshift(newEntry);
    if (history.length > 30) history.pop();
    saveLocalHistory(history);
    renderLocalHistory();
    updateTotalToday();
}

function updateTotalToday() {
    const history = getLocalHistory();
    const today = new Date().toLocaleDateString('id-ID');
    let totalHariIni = 0;
    history.forEach(item => {
        const itemDate = new Date(item.timestamp).toLocaleDateString('id-ID');
        if (itemDate === today) totalHariIni += item.nominal;
    });
    document.getElementById('totalTodayDisplay').innerHTML = `Rp ${totalHariIni.toLocaleString('id-ID')}`;
    return totalHariIni;
}

function renderLocalHistory() {
    const history = getLocalHistory();
    const container = document.getElementById('recentHistoryContainer');
    if (!history.length) {
        container.innerHTML = '<div style="text-align: center; color: #6c757d; padding: 20px;">📭 Belum ada setoran lokal</div>';
        return;
    }
    const latest = history.slice(0, 5);
    container.innerHTML = '';
    latest.forEach(item => {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.innerHTML = `
            <div>
                <div class="history-name">${escapeHtml(item.nama)}</div>
                <div class="history-time">${new Date(item.timestamp).toLocaleDateString('id-ID')} ${item.timeLabel || ''}</div>
            </div>
            <div class="history-nominal">Rp ${Number(item.nominal).toLocaleString('id-ID')}</div>
        `;
        container.appendChild(div);
    });
}

function resetLocalHistory() {
    if(confirm('Reset seluruh riwayat lokal? (Data di spreadsheet tetap aman)')) {
        localStorage.removeItem(STORAGE_KEY);
        renderLocalHistory();
        updateTotalToday();
        showToast('Riwayat lokal dibersihkan');
    }
}

function escapeHtml(str) {
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

function showToast(msg, icon = '✅') {
    let toast = document.createElement('div');
    toast.className = 'custom-toast';
    toast.innerHTML = `${icon} ${msg}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
}

// ======================= MODAL =======================
function openModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.style.display = 'flex';
    requestAnimationFrame(() => {
        requestAnimationFrame(() => modal.classList.add('active'));
    });
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.remove('active');
    setTimeout(() => {
        modal.style.display = 'none';
    }, 280);
}

// ======================= NAMA SELECTOR =======================
function populateNamaList() {
    const container = document.getElementById('daftarNamaList');
    container.innerHTML = '';
    daftarNama.forEach(nama => {
        const div = document.createElement('div');
        div.className = 'name-opt';
        div.innerText = nama;
        div.onclick = () => {
            selectNama(nama);
            closeModal('namaModal');
        };
        container.appendChild(div);
    });
}

function selectNama(nama) {
    document.getElementById('namaSiswa').value = nama;
    const displaySpan = document.getElementById('selectedNameText');
    displaySpan.innerText = nama;
    displaySpan.style.color = '#0f172a';
    displaySpan.style.fontWeight = '600';
}

// ======================= SUBMIT =======================
async function submitData() {
    const nama = document.getElementById('namaSiswa').value.trim();
    const nominalRaw = document.getElementById('nominalInput').value.trim();
    const btn = document.getElementById('submitBtn');
    
    if (!nama) {
        showToast('Silakan pilih nama terlebih dahulu!', '⚠️');
        return;
    }
    if (!nominalRaw || isNaN(Number(nominalRaw)) || Number(nominalRaw) <= 0) {
        showToast('Masukkan nominal tabungan yang valid (minimal 500)', '⚠️');
        return;
    }
    const nominal = Number(nominalRaw);
    
    addTransactionToLocal(nama, nominal);
    
    const originalHtml = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Mengirim...';
    btn.disabled = true;
    
    try {
        await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nama: nama, nominal: nominal })
        });
        openModal('successModal');
        document.getElementById('namaSiswa').value = '';
        document.getElementById('selectedNameText').innerHTML = '-- Pilih Nama --';
        document.getElementById('selectedNameText').style.color = '';
        document.getElementById('nominalInput').value = '';
    } catch (error) {
        console.error(error);
        showToast('Gagal mengirim data! Cek koneksi.', '❌');
        let history = getLocalHistory();
        if (history.length > 0 && history[0].nama === nama && history[0].nominal === nominal) {
            history.shift();
            saveLocalHistory(history);
            renderLocalHistory();
            updateTotalToday();
        }
    } finally {
        btn.innerHTML = originalHtml;
        btn.disabled = false;
    }
}

function closeSuccessAndRefresh() {
    closeModal('successModal');
    const iframe = document.getElementById('monitoringIframe');
    if (iframe) iframe.src = iframe.src;
    updateTotalToday();
    showToast('Data terbaru dimuat ✅', '🔄');
}

function refreshIframe() {
    const iframe = document.getElementById('monitoringIframe');
    iframe.src = iframe.src;
    showToast('Data terbaru dimuat ✅', '🔄');
}

// ======================= INIT =======================
document.addEventListener('DOMContentLoaded', () => {
    populateNamaList();
    renderLocalHistory();
    updateTotalToday();
    
    document.getElementById('namePickerBtn').addEventListener('click', () => openModal('namaModal'));
    document.getElementById('submitBtn').addEventListener('click', submitData);
    document.getElementById('refreshIframeBtn').addEventListener('click', refreshIframe);
    document.getElementById('clearHistoryBtn').addEventListener('click', resetLocalHistory);
    document.getElementById('closeSuccessBtn').addEventListener('click', closeSuccessAndRefresh);
    
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) closeModal(modal.id);
        });
    });
    
    document.getElementById('successModal')?.addEventListener('click', (e) => {
        if(e.target === document.getElementById('successModal')) closeSuccessAndRefresh();
    });
});
