# Nicodetta — Shop & Atelier

Schweizer Künstler-Shop mit QR-Rechnung statt Online-Zahlung.
Kein Stripe, kein Händleraccount — nur Nicos IBAN.

## Starten

```bash
npm install
npm run db:push      # Schema -> SQLite (nicodetta.db)
npm run seed         # Admin + 12 Bilder + 12 Kleidung
npm run dev          # http://localhost:3000
```

Admin: `/admin/login` · username `nicodetta` · passwort `nicodetta`

## Flow

1. Käufer scrollt Pinnwand, klickt Werk → Detail-Seite mit Bild, Beschreibung, Preis
2. Bestellformular ausfüllen → POST `/api/orders` → Werk auf `reserved`
3. QR-Rechnung-PDF generiert, E-Mail an Käufer (Stub: `tmp/emails/`)
4. Käufer scannt QR mit Banking-App, überweist
5. Nico checkt Banking, klickt im Admin "Als bezahlt markieren" → Bestätigung an Käufer
6. Nico druckt A6-Versandetikette als PDF, packt, schickt
7. Nico klickt "Als versendet markieren" (Sendungsnummer optional) → Tracking-Mail an Käufer

Reservation läuft nach 7 Tagen ab (Storno aktuell manuell via Admin).

## Stack

- **Next.js 16** (App Router, Turbopack) + React 19
- **Tailwind v4** — Swiss-Design-Tokens (schwarz/weiss, Inter Variable, keine border-radius)
- **Lenis** + **GSAP ScrollTrigger** — Pinnwand-Parallax
- **better-sqlite3 + Drizzle ORM** — eine Datei `nicodetta.db`, kein Server
- **swissqrbill + pdfkit** — QR-Rechnung nach Schweizer Norm
- **E-Mail-Stub** — schreibt nach `tmp/emails/`. Für Produktion `lib/email.ts` auf Resend/SMTP umstellen

## Konfiguration

`.env.local`:

```
ADMIN_PASSWORD=...           # nur beim ersten seed verwendet
CREDITOR_NAME=Nicodetta
CREDITOR_ADDRESS=...
CREDITOR_ZIP=...
CREDITOR_CITY=...
CREDITOR_IBAN=CH...          # QR-IBAN von Nicos Bank
```

## Wichtige Dateien

- `db/schema.ts` — Datenmodell
- `lib/orders.ts` — Bestelllogik
- `lib/qr-bill.ts` — PDF-Generierung
- `lib/email.ts` — E-Mail-Versand (austauschbar)
- `components/Pinboard.tsx` — Scroll-Galerie
- `app/admin/**` — Admin-UI
- `scripts/seed.ts` — Beispiel-Daten

## Noch offen für Produktion

- Echte IBAN von Nico ins `.env`
- Resend / SMTP statt Stub
- TWINT direkt im Checkout (Stripe, später)
- Cron für abgelaufene Reservationen
- Echte Werk-Fotos hochladen (jetzt: 4 Templates rotierend)
- Deployment (Vercel: `vercel deploy`)
