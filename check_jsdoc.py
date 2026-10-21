import os, re
client_src = "client/src"
pattern = re.compile(r'export\s+(const|function|default\s+function)\s+\w+')
jsdoc_end = re.compile(r'\*/')
missing = []
for root, dirs, files in os.walk(client_src):
    for file in files:
        if file.endswith(('.ts', '.tsx')):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
            for i, line in enumerate(lines):
                if pattern.search(line):
                    prev = lines[i-1].strip() if i > 0 else ''
                    if not jsdoc_end.search(prev):
                        missing.append(f"{path} line {i+1}: {line.strip()}")
if missing:
    print("MISSING JSDOC:")
    for m in missing: print(m)
else:
    print("ALL CLEAR — 0 missing JSDoc items")
