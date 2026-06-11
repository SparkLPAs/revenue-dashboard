import type { Config } from "tailwindcss";
const config: Config = {
  darkMode: "class",
  content: ["./src/pages/**/*.{js,ts,jsx,tsx,mdx}","./src/components/**/*.{js,ts,jsx,tsx,mdx}","./src/app/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: { extend: { colors: { background: "#080c10", card: "#0d1117", border: "#1c2128", accent: "#6EE7B7", "accent-digital": "#67E8F9", "text-primary": "#e6edf3", "text-muted": "#8b949e" }, fontFamily: { mono: ["ui-monospace","SFMono-Regular","Menlo","Monaco","Consolas","Liberation Mono","Courier New","monospace"] } } },
  plugins: [],
};
export default config;
