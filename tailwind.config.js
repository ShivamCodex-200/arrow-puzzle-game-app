/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        game: {
          bg: '#EEF2F6',
          navy: '#1F355E',
          accent: '#4CAF50',
          success: '#22C55E',
          secondary: '#64748B',
          danger: '#EF4444',
          warning: '#F59E0B',
          dot: '#C2C7D0',
        },
      },
    },
  },
  plugins: [],
};
