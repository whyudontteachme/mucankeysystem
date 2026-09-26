// ============================================================
// MUCAN HUB - USER KEY SYSTEM
// ============================================================

const API_URL = window.location.origin;
let currentUserId = null;
let currentHwid = null;
let currentKey = null;

function generateHwid() {
    const stored = localStorage.getItem('mucan_hwid');
    if (stored) return stored;
    
    const hwid = 'WEB-' + Math.random().toString(36).substring(2, 15) + 
                 Math.random().toString(36).substring(2, 15);
    localStorage.setItem('mucan_hwid', hwid);
    return hwid;
}

function getUserId() {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get('userId');
    if (fromUrl) {
        localStorage.setItem('mucan_user_id', fromUrl);
        return fromUrl;
    }
    let stored = localStorage.getItem('mucan_user_id');
    if (!stored) {
        stored = 'web-user-' + Math.random().toString(36).substring(2, 10);
        localStorage.setItem('mucan_user_id', stored);
    }
    return stored;
}

function showStatus(message, type = 'info') {
    const status = document.getElementById('status');
    status.textContent = message;
    status.className = 'status show ' + type;
}

function hideStatus() {
    document.getElementById('status').className = 'status';
}

function showStep(step) {
    ['step-1', 'step-2', 'step-3'].forEach(id => {
        document.getElementById(id).classList.add('hidden');
    });
    document.getElementById('step-' + step).classList.remove('hidden');
}

async function api(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: { 'Content-Type': 'application/json' },
    };
    if (body) options.body = JSON.stringify(body);
    
    const response = await fetch(API_URL + endpoint, options);
    return await response.json();
}

// Get key
document.getElementById('btn-get-key').addEventListener('click', async function() {
    const btn = this;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Loading...';
    
    try {
        const data = await api('/auth/verify', 'POST', {
            userId: currentUserId,
            hwid: currentHwid,
        });
        
        if (data.status === 'valid') {
            currentKey = data.key;
            showKeyStep();
        } else if (data.status === 'pending') {
            window.open(data.link, '_blank');
            showStatus('Selesaikan iklan, lalu klik "Cek Key"', 'info');
            showStep(2);
            btn.disabled = false;
            btn.innerHTML = '🎁 Dapatkan Key Sekarang';
        } else {
            showStatus(data.message || 'Error', 'error');
            btn.disabled = false;
            btn.innerHTML = '🎁 Dapatkan Key Sekarang';
        }
    } catch (err) {
        showStatus('Gagal konek ke server: ' + err.message, 'error');
        btn.disabled = false;
        btn.innerHTML = '🎁 Dapatkan Key Sekarang';
    }
});

// Check key
document.getElementById('btn-check-key').addEventListener('click', async function() {
    const btn = this;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Checking...';
    
    try {
        const data = await api('/auth/verify', 'POST', {
            userId: currentUserId,
            hwid: currentHwid,
        });
        
        if (data.status === 'valid') {
            currentKey = data.key;
            showKeyStep();
        } else if (data.status === 'pending') {
            showStatus('Key belum aktif. Selesaikan iklan dulu.', 'error');
        } else {
            showStatus(data.message || 'Error', 'error');
        }
    } catch (err) {
        showStatus('Error: ' + err.message, 'error');
    }
    
    btn.disabled = false;
    btn.innerHTML = '✅ Cek Key';
});

function showKeyStep() {
    document.getElementById('key-display').value = currentKey;
    showStep(3);
    showStatus('✅ Key kamu sudah aktif!', 'success');
}

document.getElementById('btn-copy').addEventListener('click', async function() {
    const input = document.getElementById('key-display');
    input.select();
    
    try {
        await navigator.clipboard.writeText(input.value);
        this.textContent = '✅';
        setTimeout(() => this.textContent = '📋', 2000);
        showStatus('Key tersalin ke clipboard!', 'success');
    } catch (err) {
        document.execCommand('copy');
        showStatus('Key tersalin!', 'success');
    }
});

document.addEventListener('DOMContentLoaded', () => {
    currentUserId = getUserId();
    currentHwid = generateHwid();
    console.log('[Mucan Hub] UserId:', currentUserId);
    console.log('[Mucan Hub] HWID:', currentHwid);
});