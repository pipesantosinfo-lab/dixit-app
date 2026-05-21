'use client'
import { useEffect, useRef, useState } from 'react'

interface Props {
  src: string
  className?: string
  style?: React.CSSProperties
  threshold?: number
}

/** Renderiza un PNG removiendo su fondo blanco via canvas */
export default function TransparentImg({ src, className = '', style, threshold = 220 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (typeof document === 'undefined') return
    const img = document.createElement('img') as HTMLImageElement
    img.onload = () => {
      const canvas = canvasRef.current
      if (!canvas) return
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.drawImage(img, 0, 0)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const d = imageData.data
      for (let i = 0; i < d.length; i += 4) {
        if (d[i] > threshold && d[i + 1] > threshold && d[i + 2] > threshold) d[i + 3] = 0
      }
      ctx.putImageData(imageData, 0, 0)
      setReady(true)
    }
    img.src = src
  }, [src, threshold])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ opacity: ready ? 1 : 0, transition: 'opacity 0.5s ease', display: 'block', ...style }}
    />
  )
}
