import sqlite3, json
conn = sqlite3.connect(r'C:\Kuliah\UIUX\Backend\intring_django.db')
cur = conn.cursor()
cur.execute('SELECT id, creation_status FROM core_issues')
rows = cur.fetchall()
for r in rows:
    if r[1] and r[1].startswith('"'):
        val = json.loads(r[1])
        cur.execute('UPDATE core_issues SET creation_status=? WHERE id=?', (val, r[0]))
conn.commit()
