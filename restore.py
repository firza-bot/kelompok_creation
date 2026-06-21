import json
import os

log_file = r'C:/Users/firzatullah/.gemini/antigravity-ide/brain/7a6ad2fd-c687-45be-93fc-9f9cb2cb37e2/.system_generated/logs/transcript.jsonl'
files_to_restore = {}

with open(log_file, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
            if data.get('type') == 'VIEW_FILE' and 'The following code has been modified' in data.get('content', ''):
                content = data['content']
                # Extract file path
                if '`file:///' in content:
                    file_url = content.split('`file:///')[1].split('`')[0]
                    file_path = file_url.replace('c:/Users/firzatullah/Documents/project_besar4/', '').replace('/', '\\')
                    
                    if 'ml_engine' in file_path:
                        # Extract code
                        code_part = content.split('<original_line>. Please note that any changes targeting the original code should remove the line number, colon, and leading space.\n')[1]
                        code_part = code_part.split('\nThe above content')[0]
                        
                        # Remove line numbers
                        clean_lines = []
                        for l in code_part.split('\n'):
                            if ': ' in l:
                                clean_lines.append(l.split(': ', 1)[1])
                            else:
                                clean_lines.append(l)
                                
                        files_to_restore[file_path] = '\n'.join(clean_lines)
        except Exception as e:
            print(f"Error on line: {e}")

for filepath, content in files_to_restore.items():
    content = content.replace("ensure_ascii=False", "ensure_ascii=True")
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
        print(f"Restored {filepath}")
