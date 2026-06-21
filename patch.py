import sys

def patch():
    with open(r'C:\Kuliah\project_besar4\templates\dashboard.html', 'r', encoding='utf-8') as f:
        content = f.read()

    # Define exact target from dashboard.html
    target = """        c.innerHTML = projects.map(p => `
            <div class="pg-mini-item" style="padding:10px 12px; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center;">
                <div style="flex:1; min-width:0; display:flex; flex-direction:column; gap:2px; text-align:left;">
                    <span style="font-weight:600; font-size:0.85rem; color:var(--white); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${p.project_name}</span>
                    <span style="font-size:0.72rem; color:var(--muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${p.description || 'Tanpa deskripsi'}</span>
                </div>
                <div style="display:flex; align-items:center; gap:8px;">
                    <span class="pg-mini-item-type" style="background:rgba(99,102,241,0.15); color:#a5b4fc; padding:2px 6px; border-radius:4px; font-size:0.7rem;">${p.visibility}</span>
                    <button onclick="deleteProject(${p.id})" style="background:transparent; border:none; color:var(--red); cursor:pointer; font-size:0.85rem; padding:2px 4px;">🗑️</button>
                </div>
            </div>`).join('');"""

    replacement = """        c.innerHTML = projects.map(p => `
            <div class="pg-mini-item" onclick="window.loadIssues(${p.id}, '${p.project_name}')" style="cursor:pointer; padding:10px 12px; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center;">
                <div style="flex:1; min-width:0; display:flex; flex-direction:column; gap:2px; text-align:left;">
                    <span style="font-weight:600; font-size:0.85rem; color:var(--white); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${p.project_name}</span>
                    <span style="font-size:0.72rem; color:var(--muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${p.description || 'Tanpa deskripsi'}</span>
                </div>
                <div style="display:flex; align-items:center; gap:8px;">
                    <span class="pg-mini-item-type" style="background:rgba(99,102,241,0.15); color:#a5b4fc; padding:2px 6px; border-radius:4px; font-size:0.7rem;">${p.visibility || 'scrum'}</span>
                </div>
            </div>`).join('');"""

    content = content.replace(target, replacement)

    load_issues_script = """
    window.loadIssues = async function(projectId, projectName) {
        try {
            const res = await fetch('/api/projects/' + projectId + '/issues');
            const data = await res.json();
            const c = document.getElementById('g2-mini-list');
            document.getElementById('g2-queue-total').textContent = data.issues.length;
            
            if (data.issues.length === 0) {
                c.innerHTML = '<div class="pg-queue-empty"><span>📬</span><p>Tidak ada issue untuk project ini</p></div>';
                return;
            }
            
            c.innerHTML = data.issues.map(issue => `
                <div class="pg-mini-item" style="padding:10px 12px; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center;">
                    <div style="flex:1; min-width:0; display:flex; flex-direction:column; gap:2px; text-align:left;">
                        <a href="/issue/${issue.id}" style="font-weight:600; font-size:0.85rem; color:var(--purple); text-decoration:none; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${issue.key}: ${issue.title}</a>
                        <span style="font-size:0.72rem; color:var(--muted);">Realisasi: ${issue.realization}%</span>
                        <div style="width: 100%; height: 4px; background: var(--border); border-radius: 2px; margin-top: 4px; overflow:hidden;">
                            <div style="height: 100%; background: var(--green); width: ${issue.realization}%;"></div>
                        </div>
                    </div>
                </div>`).join('');
        } catch(e) { console.error(e); }
    };
</script>"""

    content = content.replace('</script>', load_issues_script, 1)

    with open(r'C:\Kuliah\project_besar4\templates\dashboard.html', 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == '__main__':
    patch()
