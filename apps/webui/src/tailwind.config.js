/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./App.tsx"
  ],
  theme: {
    extend: {
      fontFamily: {
        'heading': ['Instrument Serif', 'serif'],
        'body': ['Inter', 'sans-serif'],
        'mono-coords': ['SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'monospace'],
      },
      animation: {
        'text-glow': 'text-glow 3s ease-in-out infinite',
        'subtle-pulse': 'subtle-pulse 2s ease-in-out infinite',
        'data-refresh': 'data-refresh 1s ease-in-out',
        'signal-pulse': 'signal-pulse 2s ease-in-out infinite',
      },
      keyframes: {
        'text-glow': {
          '0%, 100%': {
            textShadow: '0 0 20px rgba(255,255,255,0.3)',
          },
          '50%': {
            textShadow: '0 0 30px rgba(255,255,255,0.5)',
          },
        },
        'subtle-pulse': {
          '0%, 100%': {
            opacity: '0.6',
          },
          '50%': {
            opacity: '1',
          },
        },
        'data-refresh': {
          '0%': {
            opacity: '1',
            transform: 'translateX(0)',
          },
          '50%': {
            opacity: '0.7',
            transform: 'translateX(2px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateX(0)',
          },
        },
        'signal-pulse': {
          '0%, 100%': {
            opacity: '0.4',
            boxShadow: '0 0 0 0 rgba(34, 197, 94, 0.7)',
          },
          '50%': {
            opacity: '1',
            boxShadow: '0 0 0 4px rgba(34, 197, 94, 0)',
          },
        },
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
}