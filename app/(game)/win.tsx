// app/(game)/win.tsx
// This screen is NOT used — win is handled by WinOverlay.tsx inline in play.tsx.
// Kept as empty module to avoid route errors.
import { Redirect } from 'expo-router';
export default function WinScreen() {
  return <Redirect href="/(game)/home" />;
}
