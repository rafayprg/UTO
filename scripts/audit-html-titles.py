import os
import re
from collections import Counter

html_files = []
for root, dirs, files in os.walk('out'):
    for file in files:
        if file.endswith('.html'):
            html_files.append(os.path.join(root, file))

print(f"Total HTML files found in out: {len(html_files)}")

titles = {}
descriptions = {}

title_pattern = re.compile(r'<title[^>]*>(.*?)</title>', re.IGNORECASE | re.DOTALL)
desc_pattern = re.compile(r'<meta[^>]*name=["\']description["\'][^>]*content=["\'](.*?)["\']', re.IGNORECASE)

for path in html_files:
    try:
        with open(path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read(4096) # reading top of file for head tags
            t_match = title_pattern.search(content)
            d_match = desc_pattern.search(content)
            
            t = t_match.group(1).strip() if t_match else "MISSING"
            d = d_match.group(1).strip() if d_match else "MISSING"
            
            rel_path = os.path.relpath(path, 'out')
            titles[rel_path] = t
            descriptions[rel_path] = d
    except Exception as e:
        pass

title_counts = Counter(titles.values())
dup_titles = {t: c for t, c in title_counts.items() if c > 1 and t != "MISSING"}

print(f"Unique Titles: {len(title_counts)}")
print(f"Missing Titles: {title_counts.get('MISSING', 0)}")
print(f"Duplicate Title Groups: {len(dup_titles)}")
if dup_titles:
    print("Top Duplicate Titles:")
    for t, c in list(dup_titles.items())[:5]:
        print(f"  [{c}x]: {t[:80]}")
