# Nika Honey — Seed Demo Images

`python manage.py seed_demo` **downloads all product photos and posters once and stores them inside the project**.
After that the storefront never hotlinks Pexels — every image is served from your own files.

## Where the files go

| What | Location |
|---|---|
| Download cache (re-runs reuse it, no re-download) | `backend/products/seed_images/downloaded/<key>.jpg` |
| Product photos used by the storefront | `frontend/public/images/products/<slug>.jpg` and `<slug>-detail.jpg` |
| Posters / banners / blog covers used by the storefront | `frontend/public/images/posters/<key>.jpg` |
| Django media (API + admin) | `ProductImage` / `MediaAsset` rows under `MEDIA_ROOT` |

Slugs: `citrus`, `sunflower`, `dark`, `forest`, `khareshtor`, `blossom`, `mix`.
Poster keys: `media-hero`, `media-about`, `media-blog`, `media-bee` (also the intro-video poster), `media-contact`,
`media-festival`, `blog-spot-fake-honey`, `blog-storage-tips`, `blog-crystallization`, `blog-cooking-with-honey`,
`blog-honey-types`, `blog-honey-cinnamon`.

## Commands

```bash
python manage.py seed_demo             # download (first time) + seed; later runs reuse the cache
python manage.py seed_demo --refresh   # re-download everything and replace the seeded images
python manage.py seed_demo --offline   # never touch the network (cache / bundled fallbacks only)
python manage.py seed_demo --strict    # fail instead of falling back if a download does not work
```

## Changing a photo

* Edit the URL list in `PRODUCT_PHOTO_SOURCES` / `POSTER_SOURCES` at the top of
  `backend/products/management/commands/seed_demo.py` (the first URL that downloads wins, the rest are fallbacks), then run `seed_demo --refresh`.
* Or drop your own JPEG in `backend/products/seed_images/downloaded/` using the same file name
  (e.g. `product-citrus-primary.jpg`, `product-citrus-detail.jpg`, `media-hero.jpg`) and run `seed_demo`:
  files already in that folder are used as-is (no download) and copied to `frontend/public/images`.

The second (close-up) image of every product is generated from its main photo as a zoomed crop, unless
`product-<slug>-detail.jpg` already exists in the cache folder.

If a download fails, the command prints a warning and uses the bundled fallback (illustrations in
`backend/products/seed_images/`, gradient posters in `frontend/public/images/posters/`) so the site never shows broken images.
