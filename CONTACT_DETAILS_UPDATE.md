# Nika Honey contact details update

`python manage.py seed_demo` now reapplies the canonical phone, address, and social URLs on every run. This intentionally overwrites those fields if they were changed in Django Admin.

- Phone: `09365522762`
- Address: `استان گلستان، شهرستان کلاله، روستای یاساقلق`
- Instagram: `https://www.instagram.com/Nika_honey1/`
- Rubika: `https://rubika.ir/Nika_honey1` (now supported by the SiteContent API and admin panel)
- Telegram: `https://t.me/Nika_honey1`
- WhatsApp: `https://wa.me/989365522762` (uses the provided phone number; `@Nika_honey1` is not used as the WhatsApp destination)

After updating the project, from the backend directory run:

```bash
python manage.py seed_demo
```

Note: current backend schema supports Instagram, Telegram, and WhatsApp only. Rubika is wired into the public content API, contact page, footer, and admin content form.
