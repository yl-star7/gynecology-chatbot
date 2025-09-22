import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Maternal Health Color System
      colors: {
        // Primary: Warm Coral/Rose Tones
        primary: {
          50: '#fef7f0',
          100: '#feeee0',
          200: '#fdd9c1',
          300: '#fbbf9a',
          400: '#f7a072',
          500: '#f28b5c',
          600: '#e16947',
          700: '#c54d34',
          800: '#9e3f2a',
          900: '#7f3521',
          foreground: '#ffffff',
        },
        
        // Secondary: Soft Lavender/Amethyst
        secondary: {
          50: '#faf8ff',
          100: '#f3eff7',
          200: '#e9dff0',
          300: '#d6c2e0',
          400: '#c39eca',
          500: '#a67fb5',
          600: '#8b5fa3',
          700: '#704a85',
          800: '#573a69',
          900: '#462d54',
          foreground: '#ffffff',
        },
        
        // Accent: Mint/Sage Green
        accent: {
          light: '#a7f3d0',
          DEFAULT: '#6ee7b7',
          dark: '#34d399',
          foreground: '#064e3b',
        },
        
        // Semantic Colors
        success: {
          light: '#86efac',
          DEFAULT: '#4ade80',
          dark: '#22c55e',
          foreground: '#ffffff',
        },
        warning: {
          light: '#fed7aa',
          DEFAULT: '#fb923c',
          dark: '#ea580c',
          foreground: '#ffffff',
        },
        info: {
          light: '#bfdbfe',
          DEFAULT: '#60a5fa',
          dark: '#3b82f6',
          foreground: '#ffffff',
        },
        error: {
          light: '#fca5a5',
          DEFAULT: '#ef4444',
          dark: '#dc2626',
          foreground: '#ffffff',
        },
        
        // Neutral: Warm Beige/Cream Tones
        neutral: {
          50: '#fefefe',
          100: '#fefdfb',
          200: '#faf7f2',
          300: '#f2ede4',
          400: '#e4dcc9',
          500: '#d1c5a7',
          600: '#b8a888',
          700: '#8d7f65',
          800: '#6b6149',
          900: '#4a4232',
          950: '#2d251b',
        },
        
        // Base colors for shadcn/ui compatibility
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
      },
      
      // Typography
      fontFamily: {
        sans: ['Pretendard', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      
      // Border Radius
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        xl: 'calc(var(--radius) + 4px)',
      },
      
      // Shadows with Maternal Colors
      boxShadow: {
        'maternal': '0 10px 25px -5px rgb(242 139 92 / 0.1), 0 4px 6px -4px rgb(242 139 92 / 0.1)',
        'secondary-maternal': '0 10px 25px -5px rgb(166 127 181 / 0.1), 0 4px 6px -4px rgb(166 127 181 / 0.1)',
        'accent-maternal': '0 10px 25px -5px rgb(110 231 183 / 0.1), 0 4px 6px -4px rgb(110 231 183 / 0.1)',
      },
      
      // Custom Animations
      animation: {
        'slide-in-right': 'slideInRight 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-in-left': 'slideInLeft 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        'fade-in': 'fadeIn 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        'scale-in': 'scaleIn 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        'gentle-pulse': 'gentlePulse 2s infinite',
        'gentle-bounce': 'gentleBounce 1s infinite',
      },
      
      // Custom Keyframes
      keyframes: {
        slideInRight: {
          'from': {
            opacity: '0',
            transform: 'translateX(30px)',
          },
          'to': {
            opacity: '1',
            transform: 'translateX(0)',
          },
        },
        slideInLeft: {
          'from': {
            opacity: '0',
            transform: 'translateX(-30px)',
          },
          'to': {
            opacity: '1',
            transform: 'translateX(0)',
          },
        },
        fadeIn: {
          'from': { opacity: '0' },
          'to': { opacity: '1' },
        },
        scaleIn: {
          'from': {
            opacity: '0',
            transform: 'scale(0.95)',
          },
          'to': {
            opacity: '1',
            transform: 'scale(1)',
          },
        },
        gentlePulse: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        gentleBounce: {
          '0%, 80%, 100%': { transform: 'translateY(0)' },
          '40%': { transform: 'translateY(-6px)' },
        },
      },
      
      // Spacing for mobile-first touch targets
      spacing: {
        '18': '4.5rem', // 72px - good for touch targets
        '22': '5.5rem', // 88px - extra large touch targets
      },
      
      // Screen sizes for maternal-friendly responsive design
      screens: {
        'xs': '375px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
      
      // Gradient stops for maternal themes
      backgroundImage: {
        'maternal-gradient': 'linear-gradient(135deg, var(--primary-50) 0%, var(--secondary-50) 100%)',
        'chat-gradient': 'linear-gradient(135deg, var(--neutral-50) 0%, var(--primary-50) 100%)',
        'primary-gradient': 'linear-gradient(135deg, var(--primary-500) 0%, var(--primary-400) 100%)',
        'secondary-gradient': 'linear-gradient(135deg, var(--secondary-500) 0%, var(--secondary-400) 100%)',
        'accent-gradient': 'linear-gradient(135deg, var(--accent-default) 0%, var(--accent-light) 100%)',
      },
    },
  },
  plugins: [
    // Custom plugin for maternal design utilities
    function({ addUtilities }: { addUtilities: any }) {
      const newUtilities = {
        // Safe area utilities for mobile
        '.pb-safe': {
          paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
        },
        '.pt-safe': {
          paddingTop: 'max(1rem, env(safe-area-inset-top))',
        },
        // Touch-friendly classes
        '.touch-target': {
          minWidth: '44px',
          minHeight: '44px',
        },
        // Focus visible for accessibility
        '.focus-visible:focus': {
          outline: '2px solid rgb(242 139 92)',
          outlineOffset: '2px',
          borderRadius: 'var(--radius)',
        },
      }
      addUtilities(newUtilities)
    },
  ],
}

export default config