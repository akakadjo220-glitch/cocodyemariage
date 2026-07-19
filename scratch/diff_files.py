import difflib

file1 = r"c:\Users\USER\Documents\E-Mariage\e-mariage\src\components\AdminDashboard.tsx.bak"
file2 = r"c:\Users\USER\Documents\E-Mariage\e-mariage\src\components\AdminDashboard.tsx"

with open(file1, 'r', encoding='utf-8', errors='ignore') as f:
    lines1 = f.readlines()

with open(file2, 'r', encoding='utf-8', errors='ignore') as f:
    lines2 = f.readlines()

diff = difflib.unified_diff(lines1, lines2, fromfile='AdminDashboard.tsx.bak', tofile='AdminDashboard.tsx', n=3)
for line in diff:
    print(line, end='')
