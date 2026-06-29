#!/usr/bin/env python3
"""
Patch dashboard.html to add 'File dari Dataset' section.
Run inside kelompok_creation_web_1 container:
  docker exec kelompok_creation_web_1 python /app/patch_dataset_result.py
"""

DASHBOARD = '/app/templates/dashboard.html'

with open(DASHBOARD, 'r', encoding='utf-8') as f:
    content = f.read()

# ==========================================
# 1. INSERT CSS (before .g2-file-clear-btn:hover)
# ==========================================
css_anchor = '.g2-file-clear-btn:hover {'
css_insert = """/* === Dataset Result File Styles === */
                        .g2-dataset-result-container {
                            display: flex; flex-direction: column; gap: 6px; margin-top: 6px;
                            max-height: 220px; overflow-y: auto;
                        }
                        .g2-dataset-result-container::-webkit-scrollbar { width: 4px; }
                        .g2-dataset-result-container::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 4px; }
                        .g2-dataset-result-item {
                            display: flex; align-items: center; gap: 10px; padding: 10px 12px;
                            border-radius: 10px; background: rgba(255,255,255,0.04);
                            border: 1px solid rgba(255,255,255,0.08); transition: all 0.2s;
                        }
                        .g2-dataset-result-item:hover {
                            background: rgba(255,255,255,0.07); border-color: rgba(255,255,255,0.15);
                        }
                        .g2-dataset-result-item.ds-completed {
                            border-color: rgba(34,197,94,0.25); background: rgba(34,197,94,0.06);
                        }
                        .g2-dataset-result-item.ds-pending {
                            border-color: rgba(250,204,21,0.2); background: rgba(250,204,21,0.04);
                        }
                        .g2-dataset-result-item.ds-rejected {
                            border-color: rgba(239,68,68,0.2); background: rgba(239,68,68,0.04);
                        }
                        .g2-dataset-result-icon { font-size: 1.2rem; flex-shrink: 0; }
                        .g2-dataset-result-info { flex: 1; min-width: 0; }
                        .g2-dataset-result-title {
                            font-size: 0.75rem; font-weight: 600; color: rgba(255,255,255,0.85);
                            white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
                        }
                        .g2-dataset-result-status {
                            font-size: 0.62rem; color: rgba(255,255,255,0.4); margin-top: 2px;
                        }
                        .g2-dataset-dl-btn {
                            padding: 6px 12px; border-radius: 8px;
                            background: linear-gradient(135deg, rgba(34,197,94,0.2), rgba(16,185,129,0.2));
                            border: 1px solid rgba(34,197,94,0.3); color: #22c55e;
                            font-size: 0.68rem; font-weight: 600; cursor: pointer;
                            text-decoration: none; transition: all 0.2s; white-space: nowrap;
                            display: inline-flex; align-items: center; gap: 4px;
                        }
                        .g2-dataset-dl-btn:hover {
                            background: linear-gradient(135deg, rgba(34,197,94,0.35), rgba(16,185,129,0.35));
                            transform: translateY(-1px); box-shadow: 0 2px 8px rgba(34,197,94,0.2);
                        }
                        .g2-dataset-empty {
                            padding: 12px; border-radius: 10px; background: rgba(255,255,255,0.03);
                            border: 1px dashed rgba(255,255,255,0.1); color: rgba(255,255,255,0.3);
                            font-size: 0.7rem; text-align: center;
                        }
                        .g2-dataset-spinner {
                            width: 14px; height: 14px;
                            border: 2px solid rgba(255,255,255,0.1);
                            border-top: 2px solid rgba(139,92,246,0.6);
                            border-radius: 50%; animation: g2dsSpin 1s linear infinite;
                            display: inline-block;
                        }
                        @keyframes g2dsSpin { to { transform: rotate(360deg); } }

                        """

# ==========================================
# 2. INSERT HTML (before pg-inbox-mini)
# ==========================================
html_anchor = '<div class="pg-inbox-mini" id="g2-inbox-mini"'
html_insert = """<!-- File dari Dataset (Result) -->
                    <div class="g2-form-group" style="margin: 10px 0 0 0;">
                        <label class="g2-form-label" style="font-size:0.68rem; color:rgba(255,255,255,0.45);">📥 File dari Dataset</label>
                        <div id="g2-dataset-result-box" class="g2-dataset-result-container">
                            <div class="g2-dataset-empty" style="display:flex;align-items:center;justify-content:center;gap:6px;">
                                <span class="g2-dataset-spinner"></span> Memuat status request...
                            </div>
                        </div>
                    </div>

                    """

# ==========================================
# 3. INSERT JS (before handleG2RequestBtn)
# ==========================================
js_anchor = 'async function handleG2RequestBtn()'
js_insert = """// ====== DATASET RESULT FILE POLLING ======
    let g2DatasetPollTimer = null;

    async function fetchDatasetResults() {
        const box = document.getElementById('g2-dataset-result-box');
        if (!box) return;
        try {
            const res = await fetch('/dataset/api/requests/');
            if (!res.ok) {
                box.innerHTML = '<div class="g2-dataset-empty">\\u26a0\\ufe0f Gagal memuat request</div>';
                return;
            }
            const data = await res.json();
            const list = Array.isArray(data) ? data : (data.results || []);
            renderDatasetResults(list, box);
        } catch (e) {
            console.error('Dataset poll error:', e);
            box.innerHTML = '<div class="g2-dataset-empty">\\u26a0\\ufe0f Tidak dapat terhubung ke server Dataset</div>';
        }
    }

    function renderDatasetResults(reqs, box) {
        if (!reqs.length) {
            box.innerHTML = '<div class="g2-dataset-empty">Belum ada request ke Tim Dataset</div>';
            return;
        }
        reqs.sort((a, b) => {
            if (a.status === 'COMPLETED' && b.status !== 'COMPLETED') return -1;
            if (a.status !== 'COMPLETED' && b.status === 'COMPLETED') return 1;
            return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        });
        let html = '';
        reqs.forEach(r => {
            let cls = 'ds-pending', ico = '\\ud83d\\udccb', stIco = '\\u23f3', stTxt = 'Menunggu';
            if (r.status === 'COMPLETED') { cls = 'ds-completed'; ico = '\\ud83d\\udce6'; stIco = '\\u2705'; stTxt = 'Selesai'; }
            else if (r.status === 'IN_PROGRESS') { stIco = '\\ud83d\\udd04'; stTxt = 'Diproses'; }
            else if (r.status === 'REJECTED') { cls = 'ds-rejected'; ico = '\\ud83d\\udeab'; stIco = '\\u274c'; stTxt = 'Ditolak'; }

            let dlBtn = '';
            if (r.status === 'COMPLETED' && r.result_file) {
                let url = r.result_file;
                if (url.startsWith('/media/')) url = '/dataset' + url;
                const fname = url.split('/').pop() || 'dataset_file';
                dlBtn = '<a href="' + url + '" target="_blank" download="' + fname + '" class="g2-dataset-dl-btn" onclick="event.stopPropagation()">\\ud83d\\udce5 Download</a>';
            } else if (r.status === 'COMPLETED') {
                dlBtn = '<span style="font-size:0.6rem;color:rgba(255,255,255,0.25);">File belum ada</span>';
            }

            const d = r.created_at ? new Date(r.created_at).toLocaleDateString('id-ID', {day:'numeric', month:'short', year:'numeric'}) : '';
            html += '<div class="g2-dataset-result-item ' + cls + '">'
                + '<span class="g2-dataset-result-icon">' + ico + '</span>'
                + '<div class="g2-dataset-result-info">'
                + '<div class="g2-dataset-result-title">' + (r.title || 'Untitled') + '</div>'
                + '<div class="g2-dataset-result-status">' + stIco + ' ' + stTxt + ' \\u00b7 ' + d + '</div>'
                + '</div>'
                + dlBtn
                + '</div>';
        });
        box.innerHTML = html;
    }

    function startDatasetPoll() {
        fetchDatasetResults();
        if (g2DatasetPollTimer) clearInterval(g2DatasetPollTimer);
        g2DatasetPollTimer = setInterval(fetchDatasetResults, 30000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startDatasetPoll);
    } else {
        startDatasetPoll();
    }

    """

# ==========================================
# 4. REFRESH after successful POST
# ==========================================
post_anchor = "showToast('\u2713 Request requirement berhasil dikirim ke Tim Dataset!', 'success');"
post_replace = "showToast('\u2713 Request requirement berhasil dikirim ke Tim Dataset!', 'success');\n                fetchDatasetResults();"

# ==========================================
# APPLY PATCHES
# ==========================================
ok = True

if css_anchor in content:
    content = content.replace(css_anchor, css_insert + css_anchor, 1)
    print('\u2705 CSS styles inserted')
else:
    print('\u274c CSS anchor not found: .g2-file-clear-btn:hover')
    ok = False

if html_anchor in content:
    content = content.replace(html_anchor, html_insert + html_anchor, 1)
    print('\u2705 HTML section inserted')
else:
    print('\u274c HTML anchor not found: pg-inbox-mini')
    ok = False

if js_anchor in content:
    content = content.replace(js_anchor, js_insert + js_anchor, 1)
    print('\u2705 JavaScript functions inserted')
else:
    print('\u274c JS anchor not found: handleG2RequestBtn')
    ok = False

if post_anchor in content:
    content = content.replace(post_anchor, post_replace, 1)
    print('\u2705 Post-request refresh added')
else:
    print('\u26a0\ufe0f Post-success toast anchor not found (non-critical)')

if ok:
    with open(DASHBOARD, 'w', encoding='utf-8') as f:
        f.write(content)
    print('\n\u2728 Dashboard patched successfully!')
    print('Refresh browser to see the new "File dari Dataset" section.')
else:
    print('\n\u274c Patch failed - some anchors not found. Dashboard not modified.')
