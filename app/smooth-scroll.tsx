'use client'
import { useEffect } from 'react'
import Lenis from 'lenis'

/**
 * Smooth scroll global con Lenis.
 * Convierte el scroll nativo (instantáneo, "duro") en uno inerciado.
 * - Activo en desktop + mobile
 * - Respeta prefers-reduced-motion (se apaga solo)
 * - Compatible con Framer Motion useScroll porque actualiza window.scrollY real
 */
export default function SmoothScroll() {
  useEffect(() => {
    // Respeta usuarios con preferencia de menos movimiento
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const lenis = new Lenis({
      duration: 1.1,                 // segundos para alcanzar el target
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // exp-out — natural
      smoothWheel: true,
      syncTouch: false,              // en mobile dejamos scroll nativo (más fluido para touch)
      wheelMultiplier: 1,
      touchMultiplier: 1.5,
    })

    let rafId: number
    const raf = (time: number) => {
      lenis.raf(time)
      rafId = requestAnimationFrame(raf)
    }
    rafId = requestAnimationFrame(raf)

    return () => {
      cancelAnimationFrame(rafId)
      lenis.destroy()
    }
  }, [])

  return null
}
