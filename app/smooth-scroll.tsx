'use client'
import { useEffect } from 'react'
import Lenis from 'lenis'

/**
 * Smooth scroll con Lenis — SOLO en desktop.
 *
 * En mobile (touch devices):
 * - Ya teníamos syncTouch: false → Lenis no interceptaba el touch
 * - PERO seguía corriendo su rAF loop infinito + listeners de scroll
 * - Ese overhead constante no aportaba nada en mobile y trababa
 *   navegación entre secciones
 *
 * Solución: detectar pointer:coarse (touch primario) y NO inicializar
 * Lenis ahí. Mobile usa scroll nativo (es muy fluido en Android/iOS
 * modernos). Desktop sigue teniendo la inercia premium.
 */
export default function SmoothScroll() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    // Mobile / touch device → scroll nativo (sin Lenis)
    if (window.matchMedia('(pointer: coarse)').matches) return
    // Respeta usuarios con preferencia de menos movimiento
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      syncTouch: false,
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
