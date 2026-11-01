# Nika Honey — Seed Demo Real Image Sources

`python manage.py seed_demo` downloads these public Pexels images, validates them with Pillow, converts them to local JPEG files, and stores them under Django `MEDIA_ROOT`.

The seed command does **not** hotlink these images from the public storefront after seeding; ProductImage/MediaAsset records point to the local Django media files.

Source pages are provided for traceability:

- https://www.pexels.com/photo/kitchenware-for-honey-18751139/
- https://www.pexels.com/photo/honey-in-a-jar-10819687/
- https://www.pexels.com/photo/close-up-shot-of-clear-jar-with-honey-8500508/
- https://www.pexels.com/photo/clear-glass-jar-with-honey-8140790/
- https://www.pexels.com/photo/honey-jar-with-label-on-wooden-surface-7990484/
- https://www.pexels.com/photo/honey-jar-with-honeycomb-design-label-and-honey-dipper-30666803/
- https://www.pexels.com/photo/honey-in-a-jar-on-a-table-18581552/
- https://www.pexels.com/photo/honey-in-jars-on-shelves-12370134/
- https://www.pexels.com/photo/artisanal-honey-jars-with-honeycomb-outdoors-35042437/
- https://www.pexels.com/photo/artisanal-honey-jars-with-honeycomb-outdoors-35042436/
- https://www.pexels.com/photo/honey-in-a-jar-on-a-table-18581553/
- https://www.pexels.com/photo/honey-bees-on-a-honeycomb-6872488/

Pexels marks the referenced photo/video source pages as free to use. Review the current Pexels license/terms before using the demo assets in a commercial launch if branding or exclusivity matters.
