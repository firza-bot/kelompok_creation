import os, shutil, sqlite3
conn = sqlite3.connect(r'C:\Kuliah\UIUX\Backend\intring_django.db')
cur = conn.cursor()
cur.execute('SELECT file FROM core_attachments')
for r in cur.fetchall():
    filename = r[0]
    src = os.path.join(r"C:\Kuliah\UIUX\Backend\media", filename.replace('/', '\\'))
    dest = os.path.join(r"C:\Kuliah\project_besar4\media", filename.replace('/', '\\'))
    if os.path.exists(src) and not os.path.exists(dest):
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        shutil.copy2(src, dest)
print("Done syncing files to local media")
