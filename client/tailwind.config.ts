import type { Config } from 'tailwindcss'
import tailwindAnimate from 'tailwindcss-animate'

export default {
    darkMode: ["class"],
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
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
                // Custom "Neural Glass" Colors
                midnight: {
                    900: "#0f172a", // Main Background
                    800: "#1e293b", // Secondary Background
                    700: "#334155", // Card Background (Glass)
                },
                neon: {
                    violet: "#8b5cf6",
                    teal: "#14b8a6",
                    blue: "#3b82f6",
                }
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
            keyframes: {
                "accordion-down": {
                    from: { height: "0" },
                    to: { height: "var(--radix-accordion-content-height)" },
                },
                "accordion-up": {
                    from: { height: "var(--radix-accordion-content-height)" },
                    to: { height: "0" },
                },
                "float": {
                    "0%, 100%": { transform: "translateY(0)" },
                    "50%": { transform: "translateY(-10px)" },
                },
                "glow": {
                    "0%, 100%": { boxShadow: "0 0 10px rgba(139, 92, 246, 0.5)" },
                    "50%": { boxShadow: "0 0 20px rgba(139, 92, 246, 0.8), 0 0 10px rgba(20, 184, 166, 0.6)" },
                },
                "tilt": {
                    "0%, 100%": { transform: "rotate3d(0, 0, 0, 0deg)" },
                    "25%": { transform: "rotate3d(1, 1, 0, 2deg)" },
                    "75%": { transform: "rotate3d(-1, 1, 0, 2deg)" },
                }
            },
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
                "float": "float 6s ease-in-out infinite",
                "glow": "glow 3s ease-in-out infinite",
            },
            // 3D Utilities
            backgroundImage: {
                'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
                'glass-shine': 'linear-gradient(45deg, transparent 40%, rgba(255, 255, 255, 0.2) 45%, rgba(255, 255, 255, 0.5) 50%, rgba(255, 255, 255, 0.2) 55%, transparent 60%)',
            }
        },
    },
    plugins: [tailwindAnimate],
} satisfies Config
