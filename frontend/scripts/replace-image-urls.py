import os

MAP = {
    "https://images.pexels.com/photos/8805426/pexels-photo-8805426.jpeg?auto=compress&cs=tinysrgb&w=900": "/images/about-photo.jpg",
    "https://images.pexels.com/photos/1638280/pexels-photo-1638280.jpeg?auto=compress&cs=tinysrgb&w=700": "/images/blog/spot-fake-honey.jpg",
    "https://images.pexels.com/photos/7728087/pexels-photo-7728087.jpeg?auto=compress&cs=tinysrgb&w=700": "/images/blog/storage-tips.jpg",
    "https://images.pexels.com/photos/33272/honey-bees-insect-macro.jpg?auto=compress&cs=tinysrgb&w=700": "/images/blog/crystallization.jpg",
    "https://images.pexels.com/photos/6551047/pexels-photo-6551047.jpeg?auto=compress&cs=tinysrgb&w=700": "/images/blog/cooking-with-honey.jpg",
    "https://images.pexels.com/photos/162979/hexagon-bee-honeycomb-comb-162979.jpeg?auto=compress&cs=tinysrgb&w=700": "/images/blog/honey-types.jpg",
    "https://images.pexels.com/photos/1123259/pexels-photo-1123259.jpeg?auto=compress&cs=tinysrgb&w=700": "/images/blog/honey-cinnamon.jpg",
}

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
exts = (".js",)
changed = 0
for base, dirs, files in os.walk(ROOT):
    if "node_modules" in base or os.path.basename(base) == "scripts":
        continue
    for f in files:
        if not f.endswith(exts):
            continue
        path = os.path.join(base, f)
        with open(path, "r", encoding="utf-8") as fh:
            content = fh.read()
        orig = content
        for url, local in MAP.items():
            content = content.replace(url, local)
        if content != orig:
            with open(path, "w", encoding="utf-8") as fh:
                fh.write(content)
            changed += 1
            print("updated:", os.path.relpath(path, ROOT))
print("total files changed:", changed)
