import { redirect } from 'next/navigation'
import { stripe } from '@/lib/stripe'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface Props {
  searchParams: { session_id?: string }
}

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const { session_id } = searchParams

  if (!session_id) redirect('/')

  // Fetch session from Stripe to get details
  let customerEmail = ''
  let customerName = ''
  try {
    const session = await stripe.checkout.sessions.retrieve(session_id)
    customerEmail = session.customer_email || ''
    customerName = (session.metadata?.buyerName) || ''
  } catch {
    // fallback
  }

  // Try to find the ticket
  const { data: ticket } = await supabase
    .from('tickets')
    .select('ticket_number')
    .eq('stripe_payment_id', session_id)
    .single()

  return (
    <main className="grain min-h-screen bg-void flex items-center justify-center px-6 relative">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(0,255,209,0.06) 0%, transparent 70%)' }}
        />
      </div>

      <div className="relative z-10 max-w-md w-full text-center">
        {/* Animated checkmark */}
        <div className="w-20 h-20 mx-auto mb-8 rounded-full flex items-center justify-center animate-pulse-glow"
          style={{
            background: 'rgba(0,255,209,0.1)',
            border: '1px solid rgba(0,255,209,0.3)',
            boxShadow: '0 0 40px rgba(0,255,209,0.2)',
          }}>
          <span className="text-aurora text-3xl">✓</span>
        </div>

        <p className="font-mono text-xs tracking-[0.4em] text-aurora/60 uppercase mb-3">
          Confirmado
        </p>

        <h1 className="font-display text-4xl font-light text-white mb-4">
          Tu entrada<br />
          <span className="italic text-white/50">está en camino</span>
        </h1>

        {customerName && (
          <p className="font-body text-white/60 mb-2">
            Hola, {customerName.split(' ')[0]} 👋
          </p>
        )}

        {customerEmail && (
          <div className="glass rounded-xl p-4 mb-8 text-left">
            <p className="font-mono text-xs text-white/30 tracking-widest uppercase mb-2">Enviado a</p>
            <p className="text-white/70 font-body">{customerEmail}</p>
          </div>
        )}

        <div className="space-y-3 mb-10 text-left">
          {[
            { icon: '✉️', label: 'Email con tu QR', detail: 'Revisa tu bandeja de entrada (y spam)' },
            { icon: '💬', label: 'WhatsApp', detail: 'Si ingresaste tu número' },
            { icon: '🎫', label: 'Entrada digital', detail: 'Con tu código QR único' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-4 glass rounded-xl p-4">
              <span className="text-2xl">{item.icon}</span>
              <div>
                <p className="text-white/80 font-body text-sm font-medium">{item.label}</p>
                <p className="text-white/30 font-body text-xs">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>

        {ticket?.ticket_number && (
          <Link
            href={`/ticket/${ticket.ticket_number}`}
            className="btn-primary inline-block mb-4"
          >
            <span>Ver mi entrada digital</span>
          </Link>
        )}

        <div className="line-holo my-6" />

        <p className="font-body text-white/20 text-sm">
          Nos vemos pronto ✦
        </p>
      </div>
    </main>
  )
}
