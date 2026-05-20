/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        body: ['var(--font-body)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      colors: {
        void: '#030305',
        obsidian: '#0a0a0f',
        phantom: '#0f0f1a',
        'phantom-light': '#16162a',
        iris: '#7B68FF',
        'iris-glow': '#9d8fff',
        aurora: '#00FFD1',
        'aurora-dim': '#00ffca40',
        blush: '#FF6B9D',
        gold: '#FFD166',
        'glass-white': 'rgba(255,255,255,0.04)',
        'glass-border': 'rgba(255,255,255,0.08)',
      },
      backgroundImage: {
        'holographic': 'linear-gradient(135deg, #7B68FF, #00FFD1, #FF6B9D, #FFD166, #7B68FF)',
        'holo-subtle': 'linear-gradient(135deg, rgba(123,104,255,0.15), rgba(0,255,209,0.1), rgba(255,107,157,0.15))',
        'void-radial': 'radial-gradient(ellipse at center, #16162a 0%, #030305 70%)',
        'aurora-glow': 'radial-gradient(ellipse at top, rgba(0,255,209,0.15) 0%, transparent 60%)',
        'iris-glow': 'radial-gradient(ellipse at bottom, rgba(123,104,255,0.2) 0%, transparent 60%)',
      },
      animation: {
        'holo-shift': 'holoShift 6s ease infinite',
        'float': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
        'particle-drift': 'particleDrift 20s linear infinite',
        'scan': 'scan 3s ease-in-out infinite',
        'fade-up': 'fadeUp 0.8s ease forwards',
        'reveal': 'reveal 1.2s ease forwards',
        'grain': 'grain 8s steps(10) infinite',
      },
      keyframes: {
        holoShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.02)' },
        },
        particleDrift: {
          '0%': { transform: 'translateY(100vh) translateX(0)' },
          '100%': { transform: 'translateY(-100px) translateX(100px)' },
        },
        scan: {
          '0%': { transform: 'translateY(0%)', opacity: '0' },
          '10%': { opacity: '1' },
          '90%': { opacity: '1' },
          '100%': { transform: 'translateY(100%)', opacity: '0' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        reveal: {
          '0%': { opacity: '0', transform: 'translateY(50px) scale(0.97)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        grain: {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '10%': { transform: 'translate(-5%, -10%)' },
          '20%': { transform: 'translate(-15%, 5%)' },
          '30%': { transform: 'translate(7%, -25%)' },
          '40%': { transform: 'translate(-5%, 25%)' },
          '50%': { transform: 'translate(-15%, 10%)' },
          '60%': { transform: 'translate(15%, 0)' },
          '70%': { transform: 'translate(0, 15%)' },
          '80%': { transform: 'translate(3%, 35%)' },
          '90%': { transform: 'translate(-10%, 10%)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
