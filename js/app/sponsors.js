const SPONSORS = [
    "YMA",
];

function renderSponsors(filter) {
    const container = document.getElementById('sponsor-list');
    if (!container) return;

    const keyword = (filter || '').toLowerCase().trim();
    const filtered = keyword
        ? SPONSORS.filter(name => name.toLowerCase().includes(keyword))
        : SPONSORS;

    const countEl = document.getElementById('sponsor-count');
    if (countEl) countEl.textContent = SPONSORS.length + ' 人';

    const moreBtn = document.getElementById('sponsor-more-btn');
    if (moreBtn && !keyword) {
        moreBtn.style.display = SPONSORS.length > 10 ? '' : 'none';
    }

    if (filtered.length === 0) {
        container.innerHTML = '<span class="sponsor-empty">' + (keyword ? '未找到匹配的赞助者' : '暂无赞助者') + '</span>';
        return;
    }

    container.innerHTML = filtered.map(name => {
        return `<div class="sponsor-tag">
            <span class="sponsor-tag-name">${escapeHtml(name)}</span>
        </div>`;
    }).join('');
}

let sponsorExpanded = false;

function toggleShowMoreSponsors() {
    sponsorExpanded = !sponsorExpanded;
    const grid = document.getElementById('sponsor-list');
    const btn = document.getElementById('sponsor-more-btn');
    if (grid) grid.classList.toggle('expanded', sponsorExpanded);
    if (btn) {
        btn.classList.toggle('expanded', sponsorExpanded);
        btn.childNodes[0].textContent = sponsorExpanded ? '收起 ' : '展开更多 ';
    }
}

function filterSponsors(keyword) {
    const grid = document.getElementById('sponsor-list');
    const btn = document.getElementById('sponsor-more-btn');
    if (keyword && keyword.trim()) {
        if (grid) grid.classList.add('expanded');
        if (btn) btn.style.display = 'none';
    } else {
        if (grid) grid.classList.toggle('expanded', sponsorExpanded);
        if (btn) btn.style.display = '';
    }
    renderSponsors(keyword);
}

async function copyMachineId(btn) {
    try {
        const el = document.getElementById('machine-id-display');
        if (!el || !el.value || el.value === '正在获取...') {
            showToast('识别码获取中，请稍候', 'info');
            return;
        }
        if (window.electronAPI && window.electronAPI.clipboard) {
            await window.electronAPI.clipboard.writeText(el.value);
        } else {
            await navigator.clipboard.writeText(el.value);
        }
        const original = btn.textContent;
        btn.textContent = '已复制';
        btn.classList.add('btn-success');
        setTimeout(() => { btn.textContent = original; btn.classList.remove('btn-success'); }, 1500);
        showToast('识别码已复制到剪贴板', 'success');
    } catch (e) {
        showToast('复制失败', 'error');
    }
}

async function loadMachineId() {
    try {
        if (window.electronAPI && window.electronAPI.getMachineId) {
            const id = await window.electronAPI.getMachineId();
            const el = document.getElementById('machine-id-display');
            if (el && id) el.value = id;
        }
    } catch (e) {
        console.error('[MachineId] Failed:', e.message);
    }
}

async function submitActivationCode(btn) {
    const input = document.getElementById('activation-code-input');
    const statusEl = document.getElementById('activation-status');
    if (!input || !statusEl) return;
    const code = input.value.trim();
    if (!code) {
        statusEl.className = 'activation-status failed';
        statusEl.textContent = '请输入激活码';
        return;
    }
    btn.disabled = true;
    btn.textContent = '验证中...';
    statusEl.className = 'activation-status info';
    statusEl.textContent = '正在验证...';
    try {
        const result = await window.electronAPI.activateVerify(code);
        if (result.success) {
            statusEl.className = 'activation-status activated';
            statusEl.textContent = '✓ ' + result.message;
            input.value = '';
            updateActivationStatus();
        } else {
            statusEl.className = 'activation-status failed';
            statusEl.textContent = '✗ ' + result.message;
        }
    } catch (e) {
        statusEl.className = 'activation-status failed';
        statusEl.textContent = '✗ 验证失败';
    }
    btn.disabled = false;
    btn.textContent = '激活';
}

async function updateActivationStatus() {
    try {
        const status = await window.electronAPI.activateStatus();
        const statusEl = document.getElementById('activation-status');
        if (!statusEl) return;
        if (status.activated) {
            statusEl.className = 'activation-status activated';
            const typeLabel = status.type === 'permanent' ? '永久授权' : '单次授权';
            statusEl.textContent = '✓ 已激活 (' + typeLabel + ')';
            const input = document.getElementById('activation-code-input');
            const btn = document.getElementById('activate-btn');
            if (input) input.style.display = 'none';
            if (btn) btn.style.display = 'none';
        }
    } catch (e) {}
}
