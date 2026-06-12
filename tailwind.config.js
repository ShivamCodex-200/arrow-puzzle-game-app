/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        game: {
          bg: '#EDF3FA',
          navy: '#17243A',
          accent: '#FF5A3D',
          success: '#22C55E',
          secondary: '#64748B',
          danger: '#EF4444',
          warning: '#F59E0B',
          dot: '#D8DDE5',
          badgeBg: '#E9EEF5',
        },
      },
    },
  },
  plugins: [],
};
