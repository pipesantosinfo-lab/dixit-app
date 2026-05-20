# ✦ DIXIT Events
### Plataforma de venta de entradas para experiencias artísticas

> Dark luxury · Cyber ethereal · Holographic · Cinematic

---

## ¿Qué hace esto?

1. **Landing page cinematográfica** para tu evento
2. **Compra de entradas** con Stripe (tarjeta, PSE)
3. **QR único** generado automáticamente
4. **Email con diseño premium** + tu entrada
5. **WhatsApp automático** de confirmación
6. **Página de ticket digital** para mostrar en puerta
7. **Panel admin** para ver asistentes + validar QR

---

## Setup en 15 minutos

### 1. Clonar e instalar

```bash
git clone https://github.com/tu-usuario/dixit-events.git
cd dixit-events
npm install
```

### 2. Variables de entorno

```bash
cp .env.local.example .env.local
```

Edita `.env.local` con tus credenciales (instrucciones abajo).

### 3. Supabase

1. Ve a [supabase.com](https://supabase.com) → New Project
2. En **SQL Editor**, copia y corre el contenido de `supabase-schema.sql`
3. Copia estas variables de **Settings → API**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

### 4. Stripe

1. Ve a [stripe.com](https://stripe.com) → Dashboard
2. Copia `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` y `STRIPE_SECRET_KEY`
3. Para el webhook (después del deploy):
   - Stripe Dashboard → Webhooks → Add endpoint
   - URL: `https://tu-dominio.com/api/webhook`
   - Evento: `checkout.session.completed`
   - Copia el `Signing secret` → `STRIPE_WEBHOOK_SECRET`

### 5. Email (Gmail fácil)

1. En tu cuenta Gmail → Seguridad → Verificación en 2 pasos → **Contraseñas de aplicación**
2. Genera una contraseña para "Correo"
3. Llena `EMAIL_SMTP_*` con tu Gmail y esa contraseña

### 6. WhatsApp (Twilio)

1. Ve a [twilio.com](https://twilio.com) → Crea cuenta gratis
2. Activa el **WhatsApp Sandbox** en Messaging → Try it out
3. Copia `TWILIO_ACCOUNT_SID` y `TWILIO_AUTH_TOKEN`
4. El número sandbox es `whatsapp:+14155238886`
5. **Para producción**: pide número WhatsApp Business en Twilio (~$10/mes)

---

## Correr localmente

```bash
npm run dev
# → http://localhost:3000
```

Para probar el webhook de Stripe localmente:
```bash
# Instala Stripe CLI
stripe listen --forward-to localhost:3000/api/webhook
# Copia el webhook secret que te da y ponlo en .env.local
```

---

## Deploy en Vercel

```bash
# 1. Instala Vercel CLI
npm i -g vercel

# 2. Deploy
vercel

# 3. Agrega las variables de entorno
# Ve a vercel.com → tu proyecto → Settings → Environment Variables
# Agrega todas las de .env.local.example
```

**O vía GitHub:**
1. Push tu código a GitHub
2. Ve a [vercel.com](https://vercel.com) → New Project
3. Importa el repo
4. Agrega las env vars
5. Deploy ✓

---

## Conectar dominio

1. Vercel Dashboard → tu proyecto → Settings → Domains
2. Agrega `tuevento.com`
3. En tu proveedor de dominio (Namecheap, GoDaddy, etc.):
   - Agrega record CNAME: `www` → `cname.vercel-dns.com`
   - O A record: `@` → `76.76.21.21`
4. Espera 5-10 min y listo ✓

---

## Personalizar tu evento

Edita directamente en Supabase o modifica el SQL:

```sql
-- Cambiar nombre y detalles del evento
UPDATE events SET
  name = 'Tu Evento',
  tagline = 'Tu tagline épico',
  description = 'La historia de tu evento...',
  date = 'Sábado 15 de Marzo, 2025',
  location = 'Tu venue, Ciudad',
  cover_image = 'https://tu-imagen.com/cover.jpg'
WHERE slug = 'dixit-vol1';

-- Cambiar precios (en centavos: $50.000 COP = 5000000)
UPDATE ticket_tiers SET price = 15000000 WHERE name = 'General';
```

---

## Estructura del proyecto

```
dixit-events/
├── app/
│   ├── page.tsx                    # Redirect al evento activo
│   ├── event/[slug]/               # Landing del evento
│   ├── checkout-success/           # Confirmación de pago
│   ├── ticket/[ticketNumber]/      # Ticket digital con QR
│   ├── admin/                      # Panel de control
│   └── api/
│       ├── create-checkout-session/ # Crea sesión Stripe
│       ├── webhook/                 # Escucha pagos de Stripe
│       ├── validate-qr/            # Valida QR en puerta
│       └── admin/tickets/          # Lista asistentes
├── components/
│   ├── Particles.tsx               # Partículas animadas
│   ├── TierCard.tsx                # Tarjeta de tier
│   └── CheckoutModal.tsx           # Modal de compra
├── lib/
│   ├── supabase.ts                 # Cliente Supabase
│   ├── stripe.ts                   # Cliente Stripe
│   ├── email.ts                    # Envío de emails
│   ├── whatsapp.ts                 # Mensajes WhatsApp
│   ├── qr.ts                       # Generación QR
│   └── types.ts                    # TypeScript types
├── supabase-schema.sql             # Schema de la base de datos
└── .env.local.example              # Template de variables
```

---

## Panel Admin

Ve a `tudominio.com/admin` → ingresa tu `ADMIN_SECRET`.

- Ver todos los tickets vendidos
- Estadísticas en tiempo real
- **Validar QR**: pega el URL del QR o el ticket number y presiona Enter (también funciona con scanner de QR físico)

---

## Preguntas frecuentes

**¿Cómo agrego más eventos?**
Inserta un nuevo registro en la tabla `events` y sus tiers en `ticket_tiers`. El sistema redirige al primer evento activo.

**¿Puedo tener múltiples eventos activos?**
Sí. Comparte el URL directo: `tudominio.com/event/slug-del-evento`

**¿Cómo cancelo un ticket?**
En Supabase, cambia `status` a `cancelled` en la tabla `tickets`.

**¿Los precios en COP o USD?**
El campo `currency` en `ticket_tiers` acepta `cop`, `usd`, `eur`. Stripe maneja la conversión.

**¿WhatsApp no funciona en pruebas?**
El sandbox de Twilio requiere que el usuario primero envíe un mensaje al número. Para producción activa un número real.

---

## Stack

- **Next.js 14** — Framework
- **Tailwind CSS** — Estilos
- **Supabase** — Base de datos + Auth
- **Stripe** — Pagos
- **Twilio** — WhatsApp
- **Nodemailer** — Email
- **QRCode.js** — Generación QR
- **Vercel** — Deploy

---

*Hecho con amor para experiencias que importan ✦*
