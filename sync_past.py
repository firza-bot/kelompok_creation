import sqlite3, os, json, time, shutil

# 1. Sync Orchestrations to JSON
# We connect to project_besar4 db
conn_pb = sqlite3.connect(r'C:\Kuliah\project_besar4\db.sqlite3')
cur_pb = conn_pb.cursor()
cur_pb.execute('SELECT uiux_issue_id, category, status, created_at FROM core_orchestrationphase ORDER BY created_at ASC')
phases = cur_pb.fetchall()

# group by issue_id
orch_map = {}
for p in phases:
    issue_id, cat, stat, dt = p
    if issue_id not in orch_map: orch_map[issue_id] = []
    # format date simply if needed, let's just keep original string
    dt_str = dt[:10] if dt else ''
    orch_map[issue_id].append({"category": cat, "status": stat, "created_at": dt_str})

conn_int = sqlite3.connect(r'C:\Kuliah\UIUX\Backend\intring_django.db')
cur_int = conn_int.cursor()

for issue_id, arr in orch_map.items():
    cur_int.execute('SELECT creation_status FROM core_issues WHERE id=?', (issue_id,))
    row = cur_int.fetchone()
    if row:
        c_stat = json.loads(row[0]) if row[0] else {}
        c_stat["orchestration"] = arr
        cur_int.execute('UPDATE core_issues SET creation_status=? WHERE id=?', (json.dumps(c_stat), issue_id))

# 2. Sync existing Evidence Files
cur_pb.execute('SELECT uiux_issue_id, evidence_file FROM core_issuecreationstatus WHERE evidence_file IS NOT NULL AND evidence_file != ""')
files = cur_pb.fetchall()
target_dir = r"C:\Kuliah\UIUX\Backend\media\evidence"
if not os.path.exists(target_dir): os.makedirs(target_dir)

for f in files:
    issue_id, file_path = f
    # project_besar4 media path: C:\Kuliah\project_besar4\media\
    src_path = os.path.join(r"C:\Kuliah\project_besar4\media", file_path.replace('/', '\\'))
    if os.path.exists(src_path):
        filename = os.path.basename(src_path)
        new_filename = f"{int(time.time())}_{filename}"
        dest_path = os.path.join(target_dir, new_filename)
        shutil.copy2(src_path, dest_path)
        # insert to core_attachments in intring
        # get reporter_id for issue
        cur_int.execute('SELECT reporter_id FROM core_issues WHERE id=?', (issue_id,))
        rep_row = cur_int.fetchone()
        reporter_id = rep_row[0] if rep_row else 1
        
        cur_int.execute('''
            INSERT INTO core_attachments (file, original_name, mimetype, size, created_at, user_id, issue_id)
            VALUES (?, ?, ?, ?, datetime('now'), ?, ?)
        ''', (f"evidence/{new_filename}", filename, "application/pdf", os.path.getsize(src_path), reporter_id, issue_id))

conn_pb.close()
conn_int.commit()
conn_int.close()
print("Done syncing past data!")
