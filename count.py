import os

def count_loc(directory):
    total = 0
    extensions = {'.java', '.ts', '.html', '.css', '.py'}
    exclude_dirs = {'node_modules', '.git', 'venv', 'target', 'dist', '.angular'}
    
    for root, dirs, files in os.walk(directory):
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        for file in files:
            if any(file.endswith(ext) for ext in extensions):
                path = os.path.join(root, file)
                try:
                    with open(path, 'r', encoding='utf-8') as f:
                        total += sum(1 for line in f if line.strip())
                except:
                    pass
    return total

print("LOC:", count_loc('.'))
