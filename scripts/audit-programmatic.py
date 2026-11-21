import re
from collections import Counter

with open('src/lib/programmatic-tools.ts', 'r', encoding='utf-8') as f:
    text = f.read()

slugs = re.findall(r'slug:\s*["\']([^"\']+)["\']', text)
titles = re.findall(r'title:\s*["\']([^"\']+)["\']', text)

print(f"Programmatic Tools - Total Slugs: {len(slugs)}, Unique Slugs: {len(set(slugs))}")
slug_dupes = [k for k, v in Counter(slugs).items() if v > 1]
print(f"Duplicate Slugs: {len(slug_dupes)}")

title_dupes = [k for k, v in Counter(titles).items() if v > 1]
print(f"Duplicate Titles: {len(title_dupes)}")
