file_path = r"c:\Users\USER\Documents\E-Mariage\e-mariage\src\components\AdminDashboard.tsx"

with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()

for i in range(2535, 2565):
    print(f"{i}: {lines[i-1].rstrip()}")
