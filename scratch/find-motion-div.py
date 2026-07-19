file_path = r"c:\Users\USER\Documents\E-Mariage\e-mariage\src\components\AdminDashboard.tsx"

with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()

for i, line in enumerate(lines, 1):
    if '<motion.div' in line or '</motion.div>' in line:
        print(f"Line {i}: {line.strip()}")
