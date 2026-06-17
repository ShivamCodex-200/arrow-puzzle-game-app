/**
 * app/(game)/play.tsx
 *
 * KEY FIX: Level generation runs AFTER the screen renders
 * using InteractionManager so the JS thread is never blocked
 * during navigation (which caused the ANR crash).
 */

import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  StatusBar,
  View,
  Text,
  InteractionManager,
  ActivityIndicator,
} from "react-native";
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
  const router = useRouter();

  const loadedLevelRef = useRef<number | null>(null);
  const taskRef = useRef<ReturnType<typeof InteractionManager.runAfterInteractions> | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const startLoadLevel = useCallback((lvl: number) => {
    if (loadedLevelRef.current === lvl) return;
    loadedLevelRef.current = lvl;

    setIsLoading(true);
    setLoadError(null);

    // Cancel any pending task
    taskRef.current?.cancel();
    if (timerRef.current) clearTimeout(timerRef.current);

    // Wait for navigation animation to finish, THEN generate level
    taskRef.current = InteractionManager.runAfterInteractions(() => {
      timerRef.current = setTimeout(() => {
        try {
          loadLevel(lvl);
          setIsLoading(false);
        } catch (e: any) {
          console.error("Level generation failed:", e);
          setLoadError("Failed to load level. Tap to retry.");
          setIsLoading(false);
        }
      }, 100); // 100ms breathing room for UI to render
    });
  }, [loadLevel]);

  useEffect(() => {
    const raw = Array.isArray(params.level) ? params.level[0] : params.level;
    const lvl = Math.max(1, parseInt(raw ?? "1", 10) || 1);
    startLoadLevel(lvl);

    return () => {
      taskRef.current?.cancel();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [params.level, startLoadLevel]);

  const handleRetry = useCallback(() => {
    loadedLevelRef.current = null; // reset so it reloads
    const raw = Array.isArray(params.level) ? params.level[0] : params.level;
    const lvl = Math.max(1, parseInt(raw ?? "1", 10) || 1);
    startLoadLevel(lvl);
  }, [params.level, startLoadLevel]);

  return (
    <LinearGradient
      colors={[COLORS.bgGradientStart, COLORS.bgGradientEnd]}
      style={{ flex: 1 }}
    >
      <StatusBar barStyle="dark-content" />

      <View
        style={{
          flex: 1,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        }}
      >
        {isLoading ? (
          // Loading state — shown while level generates
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 16 }}>
            <ActivityIndicator size="large" color={COLORS.accent} />
            <Text style={{ color: COLORS.textSecondary, fontSize: 14, fontWeight: "600" }}>
              Generating level...
            </Text>
          </View>
        ) : loadError ? (
          // Error state
          <View
            style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 16, paddingHorizontal: 32 }}
          >
            <Text style={{ color: COLORS.danger, fontSize: 16, textAlign: "center" }}>
              {loadError}
            </Text>
            <Text
              onPress={handleRetry}
              style={{
                color: COLORS.accent,
                fontSize: 14,
                fontWeight: "700",
                padding: 12,
              }}
            >
              Tap to retry
            </Text>
          </View>
        ) : grid ? (
          // Game screen
          <>
            <GameHeader />
            <GameGrid />
            <HintButton />
          </>
        ) : null}
      </View>

      <WinOverlay />
      <GameOverOverlay />
    </LinearGradient>
  );
}
