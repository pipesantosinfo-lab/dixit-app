import type { Metadata } from 'next'
import fs from 'node:fs'
import path from 'node:path'
import PodcastApp, { type Episodio } from './PodcastApp'
import './podcast.css'

export const metadata: Metadata = {
  title: 'Regálate un Ratico — Podcast de Pipe Santos',
  description: 'Reflexiones diarias a través de historias. Relatos cortos de Pipe Santos.',
  openGraph: {
    title: 'Regálate un Ratico — Podcast de Pipe Santos',
    description: 'Reflexiones diarias a través de historias.',
    images: ['/podcast/cover.jpg'],
  },
}

/* El catálogo se genera a partir del audio real (títulos, duraciones y la
   forma de onda de cada episodio) y vive junto a los MP3 en /public. */
function leerEpisodios(): Episodio[] {
  try {
    const f = path.join(process.cwd(), 'public', 'podcast', 'episodios.json')
    return JSON.parse(fs.readFileSync(f, 'utf8')) as Episodio[]
  } catch {
    return []
  }
}

export default function PodcastPage() {
  return <PodcastApp episodios={leerEpisodios()} />
}
