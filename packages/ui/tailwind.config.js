/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        geist: {
          background: "var(--geist-background)",
          foreground: "var(--geist-foreground)",
          text: "var(--geist-text)",
          "text-secondary": "var(--geist-text-secondary)",
          "text-muted": "var(--geist-text-muted)",
          border: "var(--geist-border)",
          surface: "var(--geist-surface)",
          "surface-secondary": "var(--geist-surface-secondary)",
          "surface-secondary-hover": "var(--geist-surface-secondary-hover)",
          focus: "var(--geist-focus)",
          link: "var(--geist-link)",
          error: "var(--geist-error)",
          "error-bg": "var(--geist-error-bg)",
          success: "var(--geist-success)",
          "badge-blue-bg": "var(--geist-badge-blue-bg)",
          "badge-blue-text": "var(--geist-badge-blue-text)",
        },
      },
      boxShadow: {
        "geist-border": "0 0 0 1px var(--geist-border-shadow)",
        "geist-border-hover": "0 0 0 1px var(--geist-border-shadow-hover)",
        "geist-card": "0 0 0 1px var(--geist-border-shadow), 0 2px 2px rgba(0,0,0,0.04), 0 8px 8px -8px rgba(0,0,0,0.04), inset 0 0 0 1px var(--geist-surface-secondary)",
        "geist-card-hover": "0 0 0 1px var(--geist-border-shadow-hover), 0 4px 4px rgba(0,0,0,0.04), 0 12px 12px -8px rgba(0,0,0,0.04), inset 0 0 0 1px var(--geist-surface-secondary)",
      },
      ringColor: {
        DEFAULT: "hsl(var(--ring))",
        "geist-focus": "var(--geist-focus)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
