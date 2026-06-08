import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef } from "react";
import { StatusBar, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GameGrid } from "../../components/GameGrid";
import { GameHeader } from "../../components/GameHeader";
import { HintButton } from "../../components/HintButton";
import { WinOverlay } from "../../components/WinOverlay";
import { GameOverOverlay } from "../../components/GameOverOverlay";
import { COLORS } from "../../constants/theme";
import { useGameStore } from "../../store/useGameStore";

export default function PlayScreen() {
  const params = useLocalSearchParams<{ level?: string }>();
  const { loadLevel, grid } = useGameStore();
  const insets = useSafeAreaInsets();
  const loadedRef = useRef<number | null>(null);

  useEffect(() => {
    // Parse level safely — fall back to 1 if param is missing or invalid
    const raw = Array.isArray(params.level) ? params.level[0] : params.level;
    const lvl = Math.max(1, parseInt(raw ?? "1", 10) || 1);

    if (loadedRef.current !== lvl) {
      loadedRef.current = lvl;
      loadLevel(lvl);
    }
  }, [params.level]);

  return (
    <LinearGradient
      colors={[COLORS.bgGradientStart, COLORS.bgGradientEnd]}
      style={styles.container}
    >
      <StatusBar barStyle="dark-content" />

      {/* Safe area padding manually so gradient fills full screen */}
      <View
        style={[
          styles.inner,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
      >
        {grid ? (
          <>
            <GameHeader />
            <GameGrid />
            <HintButton />
          </>
        ) : (
          // Loading placeholder (flash of empty screen is avoided by keeping gradient visible)
          <View style={styles.loading} />
        )}
      </View>

      {/* Win overlay sits above everything */}
      <WinOverlay />

      {/* Game Over overlay sits above everything */}
      <GameOverOverlay />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
  },
  loading: {
    flex: 1,
  },
});
