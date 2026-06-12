import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, StatusBar, Dimensions, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle, LinearGradient as SvgGradient, Stop, Defs } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { useDailyChallenge } from '../../hooks/useDailyChallenge';
import { ArrowCell } from '../../components/ArrowCell';
import { CELL_GAP, GRID_PADDING } from '../../constants/config';
import { COLORS } from '../../constants/theme';
import { useDailyChallengeStore } from '../../store/useDailyChallengeStore';
import { generateDailyChallenge } from '../../engine/dailyChallengeGenerator';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ── CUSTOM VECTOR TROPHY COMPONENT ───────────────────────────────────────────
const SvgTrophy = () => (
  <Svg width={140} height={140} viewBox="0 0 100 100">
    <Defs>
      <SvgGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FBBF24" />
        <Stop offset="50%" stopColor="#F59E0B" />
        <Stop offset="100%" stopColor="#D97706" />
      </SvgGradient>
      <SvgGradient id="silver" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#F1F5F9" />
        <Stop offset="100%" stopColor="#CBD5E1" />
      </SvgGradient>
    </Defs>
    {/* Base */}
    <Path d="M 30 85 L 70 85 L 65 75 L 35 75 Z" fill="url(#silver)" />
    <Path d="M 45 75 L 55 75 L 55 60 L 45 60 Z" fill="url(#gold)" />
    {/* Cup Body */}
    <Path d="M 25 25 C 25 52, 75 52, 75 25 Z" fill="url(#gold)" />
    <Path d="M 32 18 L 68 18 L 72 25 L 28 25 Z" fill="url(#gold)" />
    {/* Handles */}
    <Path d="M 26 28 C 12 28, 12 43, 26 43" stroke="url(#gold)" strokeWidth={4.5} fill="none" strokeLinecap="round" />
    <Path d="M 74 28 C 88 28, 88 43, 74 43" stroke="url(#gold)" strokeWidth={4.5} fill="none" strokeLinecap="round" />
    {/* Center Star detailing */}
    <Path d="M 50 28 L 52.5 33 L 58 33 L 53.5 36.5 L 55 42 L 50 38.5 L 45 42 L 46.5 36.5 L 42 33 L 47.5 33 Z" fill="#FFF" opacity={0.9} />
  </Svg>
);

const BackChevron = () => (
  <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
    <Path
      d="M15 18l-6-6 6-6"
      stroke="#3B82F6"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const RefreshIcon = () => (
  <Svg width={30} height={30} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l.73-2.62"
      stroke="#3B82F6"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const BulbIcon = () => (
  <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7z"
      fill="#FFB020"
      stroke="#D97706"
      strokeWidth={1.5}
    />
    <Path
      d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zM10 19h4v-1h-4v1z"
      fill="#94A3B8"
      stroke="#64748B"
      strokeWidth={1.5}
    />
  </Svg>
);

const RulerIcon = () => (
  <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
    <Path
      d="M5 19L19 5"
      stroke="#8B5CF6"
      strokeWidth={8}
      strokeLinecap="round"
    />
    <Path d="M7.5 14.5L9.5 16.5" stroke="#FFFFFF" strokeWidth={1.5} />
    <Path d="M10.5 11.5L12.5 13.5" stroke="#FFFFFF" strokeWidth={1.5} />
    <Path d="M13.5 8.5L15.5 10.5" stroke="#FFFFFF" strokeWidth={1.5} />
    <Path d="M16.5 5.5L18.5 7.5" stroke="#FFFFFF" strokeWidth={1.5} />
  </Svg>
);

// ── MAIN SCREEN ──────────────────────────────────────────────────────────────
export default function DailyChallengeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Screen Mode: 'calendar' | 'play'
  const [screenMode, setScreenMode] = useState<'calendar' | 'play'>('calendar');
  
  // Date states
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date(2026, 5, 11)); // Default to June 2026 for consistency with request
  const [selectedDateStr, setSelectedDateStr] = useState<string>('2026-06-11');

  const { completedDates, coins, streak } = useDailyChallengeStore();

  // Load standard gameplay logic hook for selected date
  const {
    grid,
    moves,
    lives,
    isWon,
    isGameOver,
    selectedArrowId,
    shakingArrowId,
    timeElapsed,
    tapArrow,
    removeArrowState,
    handleShakeDone,
    resetChallenge,
  } = useDailyChallenge(selectedDateStr);

  // Generate calendar grid dates
  const daysInMonth = useMemo(() => {
    return new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  }, [currentMonth]);

  const startDayOfWeek = useMemo(() => {
    return new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  }, [currentMonth]);

  const completionsInMonth = useMemo(() => {
    const monthPrefix = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
    return completedDates.filter(d => d.startsWith(monthPrefix)).length;
  }, [completedDates, currentMonth]);

  const navigateMonth = useCallback((direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const nextDate = new Date(prev);
      nextDate.setMonth(prev.getMonth() + (direction === 'prev' ? -1 : 1));
      return nextDate;
    });
  }, []);

  const formatDateString = useCallback((year: number, month: number, day: number) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${year}-${pad(month + 1)}-${pad(day)}`;
  }, []);

  // Determine today's date in local system parameters
  const todayDateStr = useMemo(() => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }, []);

  // Responsive Board calculations
  const { cellSize, boardWidth, boardHeight } = useMemo(() => {
    if (!grid) return { cellSize: 30, boardWidth: 0, boardHeight: 0 };
    
    // We want the total board width to fit within 94% of the screen width,
    // and total height within 60% of the screen height.
    const maxW = SCREEN_WIDTH * 0.94;
    const maxH = SCREEN_HEIGHT * 0.60;

    const maxCellWidth = (maxW - (CELL_GAP * (grid.cols - 1)) - (GRID_PADDING * 2)) / grid.cols;
    const maxCellHeight = (maxH - (CELL_GAP * (grid.rows - 1)) - (GRID_PADDING * 2)) / grid.rows;
    
    const size = Math.floor(Math.min(maxCellWidth, maxCellHeight));
    const finalSize = Math.max(8, size); // lower safety cap for very dense grids

    const w = finalSize * grid.cols + CELL_GAP * (grid.cols - 1) + GRID_PADDING * 2;
    const h = finalSize * grid.rows + CELL_GAP * (grid.rows - 1) + GRID_PADDING * 2;

    return { cellSize: finalSize, boardWidth: w, boardHeight: h };
  }, [grid]);

  // Static dots underneath arrows (visible in empty spaces)
  const dots = useMemo(() => {
    if (!grid) return [];
    const pts: { x: number; y: number }[] = [];
    for (let r = 0; r < grid.rows; r++) {
      for (let c = 0; c < grid.cols; c++) {
        const cx = c * (cellSize + CELL_GAP) + cellSize / 2 + GRID_PADDING;
        const cy = r * (cellSize + CELL_GAP) + cellSize / 2 + GRID_PADDING;
        pts.push({ x: cx, y: cy });
      }
    }
    return pts;
  }, [grid, cellSize]);

  // Memoize static background SVG dot grid to prevent redraws on gameplay interactions
  const dotGridSvg = useMemo(() => {
    if (!grid || dots.length === 0) return null;
    return (
      <Svg
        width={boardWidth}
        height={boardHeight}
        style={StyleSheet.absoluteFill}
      >
        {dots.map((dot, index) => (
          <Circle
            key={index}
            cx={dot.x}
            cy={dot.y}
            r={1.5}
            fill={COLORS.dot}
            opacity={0.8}
          />
        ))}
      </Svg>
    );
  }, [boardWidth, boardHeight, dots, grid]);

  const activeChallengeInfo = useMemo(() => {
    return generateDailyChallenge(selectedDateStr);
  }, [selectedDateStr]);

  const remainingCount = useMemo(() => {
    return grid ? grid.arrows.filter((a) => !a.isRemoved).length : 0;
  }, [grid]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // UI Modal animation variables
  const scaleVal = useSharedValue(0.6);
  useEffect(() => {
    if (isWon || isGameOver) {
      scaleVal.value = withSpring(1, { damping: 20, stiffness: 120, overshootClamping: true });
    } else {
      scaleVal.value = 0.6;
    }
  }, [isWon, isGameOver]);

  const modalStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleVal.value }],
  }));

  return (
    <GestureHandlerRootView className="flex-1 bg-white">
      <StatusBar barStyle="light-content" />

      {screenMode === 'calendar' ? (
        // ── CALENDAR VIEW (DAILY CHALLENGE HOME SCREEN) ──────────────────────
        <View className="flex-1 bg-white justify-between" style={{ paddingTop: insets.top }}>
          <View className="flex-1">
            {/* Blue Gradient Header with Trophy */}
            <LinearGradient
              colors={['#3B82F6', '#1D4ED8']}
              className="px-6 pb-6 pt-2 rounded-b-[36px] items-center relative shadow-md"
            >
              {/* Back Arrow */}
              <Pressable
                onPress={() => router.replace('/(game)/home')}
                className="absolute left-6 top-4 w-9 h-9 rounded-full bg-white/10 items-center justify-center"
                hitSlop={8}
              >
                <MaterialIcons name="chevron-left" size={24} color="#FFFFFF" />
              </Pressable>

              <Text className="text-[20px] font-black text-white uppercase tracking-wider mt-3">
                Daily Challenges
              </Text>

              <View className="mt-4">
                <SvgTrophy />
              </View>
            </LinearGradient>

            {/* Calendar Control Area */}
            <View className="px-6 mt-6">
              <View className="flex-row justify-between items-center mb-4">
                <View className="flex-row items-center gap-1.5">
                  <Pressable onPress={() => navigateMonth('prev')} className="p-1">
                    <MaterialIcons name="chevron-left" size={24} color="#64748B" />
                  </Pressable>
                  <Text className="text-[17px] font-black text-slate-800 tracking-tight">
                    {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </Text>
                  <Pressable onPress={() => navigateMonth('next')} className="p-1">
                    <MaterialIcons name="chevron-right" size={24} color="#64748B" />
                  </Pressable>
                </View>

                {/* Stars/Progress Badge */}
                <View className="flex-row items-center gap-1 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
                  <MaterialIcons name="stars" size={16} color="#F59E0B" />
                  <Text className="text-[12px] font-extrabold text-amber-600">
                    {completionsInMonth}/{daysInMonth}
                  </Text>
                </View>
              </View>

              {/* Streak Tracker */}
              {streak > 0 && (
                <View className="bg-orange-50 border border-orange-100 rounded-2xl p-3 flex-row items-center justify-between mb-4">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-[18px]">🔥</Text>
                    <View>
                      <Text className="text-[13px] font-extrabold text-orange-700">Daily Streak: {streak} Days!</Text>
                      <Text className="text-[10px] text-orange-600 font-semibold">Keep completing daily puzzles to maintain the streak.</Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Calendar Grid S M T W T F S */}
              <View className="flex-row justify-between mb-2">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                  <View key={idx} className="w-10 items-center">
                    <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{day}</Text>
                  </View>
                ))}
              </View>

              {/* Days List */}
              <View className="flex-row flex-wrap justify-start gap-y-2">
                {/* Blank slots for starting offset */}
                {Array.from({ length: startDayOfWeek }).map((_, idx) => (
                  <View key={`empty-${idx}`} className="w-[14.28%] aspect-square" />
                ))}

                {/* Actual day buttons */}
                {Array.from({ length: daysInMonth }).map((_, idx) => {
                  const day = idx + 1;
                  const dateString = formatDateString(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                  const isCompleted = completedDates.includes(dateString);
                  const isSelected = selectedDateStr === dateString;

                  // Check if this date is in the future
                  const checkDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                  const todayObj = new Date();
                  todayObj.setHours(0, 0, 0, 0);
                  const isFuture = checkDate.getTime() > todayObj.getTime();

                  const isToday = dateString === todayDateStr;

                  let cellClass = "bg-white border border-slate-100 rounded-full";
                  let textClass = "text-slate-700 font-extrabold";

                  if (isFuture) {
                    textClass = "text-slate-200 font-medium";
                    cellClass = "bg-transparent";
                  } else if (isCompleted) {
                    cellClass = "bg-blue-100 border border-blue-200 rounded-full";
                    textClass = "text-blue-600 font-black";
                  } else if (isToday) {
                    cellClass = "bg-white border-2 border-blue-500 rounded-full";
                    textClass = "text-blue-500 font-black";
                  } else {
                    textClass = "text-slate-400 font-bold"; // past uncompleted
                  }

                  if (isSelected) {
                    cellClass = "bg-blue-500 border-0 rounded-full shadow-sm";
                    textClass = "text-white font-black";
                  }

                  return (
                    <Pressable
                      key={day}
                      disabled={isFuture}
                      onPress={() => setSelectedDateStr(dateString)}
                      className="w-[14.28%] aspect-square items-center justify-center p-0.5"
                    >
                      <View className={`w-9 h-9 items-center justify-center relative ${cellClass}`}>
                        {isCompleted && !isSelected ? (
                          <MaterialIcons name="check-circle" size={14} color="#3B82F6" className="absolute -top-1 -right-1 z-10" />
                        ) : null}
                        <Text className={`text-[13px] ${textClass}`}>{day}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Bottom Action Card & Tabs */}
          <View className="px-6 pb-6 gap-5">
            <View className="bg-slate-50 border border-slate-100 rounded-[20px] p-4 flex-row items-center justify-between">
              <View>
                <Text className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Selected Challenge</Text>
                <Text className="text-[15px] font-black text-slate-800 mt-0.5">
                  {new Date(selectedDateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}
                </Text>
                <View className="flex-row items-center gap-1.5 mt-1">
                  <View className="bg-amber-100 px-2 py-0.5 rounded-md">
                    <Text className="text-[9px] font-black text-amber-700 uppercase">{activeChallengeInfo.difficulty}</Text>
                  </View>
                  <Text className="text-[11px] text-slate-500 font-semibold">🪙 {activeChallengeInfo.rewardCoins} Reward</Text>
                </View>
              </View>
              <Pressable
                onPress={() => setScreenMode('play')}
                className="bg-blue-500 rounded-[14px] px-6 py-3 shadow-md shadow-blue-500/20"
              >
                <Text className="text-white text-[14px] font-black uppercase tracking-wider">Play</Text>
              </Pressable>
            </View>

            {/* Bottom Tab Bar Mock */}
            <View className="flex-row justify-around items-center border-t border-slate-100 bg-white pt-3">
              <Pressable onPress={() => router.replace('/(game)/home')} className="items-center justify-center">
                <MaterialIcons name="home" size={24} color="#94A3B8" />
                <Text className="text-[10px] font-bold text-slate-400 mt-0.5">Main</Text>
              </Pressable>
              <Pressable className="items-center justify-center">
                <MaterialIcons name="calendar-today" size={24} color="#3B82F6" />
                <Text className="text-[10px] font-bold text-blue-500 mt-0.5">Daily</Text>
              </Pressable>
              <Pressable onPress={() => router.push('/(game)/settings')} className="items-center justify-center">
                <MaterialIcons name="person" size={24} color="#94A3B8" />
                <Text className="text-[10px] font-bold text-slate-400 mt-0.5">Me</Text>
              </Pressable>
            </View>
          </View>
        </View>
      ) : (
        // ── GAME PLAY VIEW (DAILY CHALLENGE SCREEN PLAYING) ──────────────────
        <View 
          className="flex-1 bg-game-bg"
          style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
        >
          {/* Header & HUD Group Wrapper with zIndex & Solid Background to prevent arrows from showing on top */}
          <View className="z-10 bg-game-bg pb-2">
            {/* Row 1: Back Button | Title | Settings/Refresh */}
            <View className="flex-row items-center justify-between px-4 h-11">
              <Pressable
                onPress={() => setScreenMode('calendar')}
                className="w-11 h-11 items-center justify-center"
                hitSlop={8}
              >
                <BackChevron />
              </Pressable>

              <Text className="text-[22px] font-bold text-game-navy text-center">
                {new Date(selectedDateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' })}
              </Text>

              <Pressable
                onPress={resetChallenge}
                className="w-11 h-11 items-center justify-center"
                hitSlop={8}
              >
                <RefreshIcon />
              </Pressable>
            </View>

            {/* Row 2: Move Counter & Remaining (Left) | Hearts (Center) | Difficulty Badge (Right) */}
            <View className="flex-row items-center justify-between px-4 mt-2">
              {/* Left Side: Combined Counters */}
              <View className="flex-row items-center gap-2">
                {/* Moves Pill */}
                <View className="bg-game-badgeBg rounded-[16px] px-3.5 py-2 flex-row items-center justify-center min-w-[56px]">
                  <Text className="text-[16px] font-bold text-game-navy mr-1">↗</Text>
                  <Text className="text-[13px] font-bold text-game-navy">{moves}</Text>
                </View>
                {/* Remaining Arrows Pill */}
                <View className="bg-game-badgeBg rounded-[16px] px-3.5 py-2 flex-row items-center justify-center min-w-[56px]">
                  <Text className="text-[16px] font-bold text-game-navy mr-1">↑</Text>
                  <Text className="text-[13px] font-bold text-game-navy">{remainingCount}</Text>
                </View>
              </View>

              {/* Center: Hearts */}
              <View className="flex-row items-center justify-center gap-3.5">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <View key={idx} className="shadow-sm shadow-black/12 elevation-3">
                    <Text className="text-[22px]">
                      {idx < lives ? "❤️" : "🖤"}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Right Side: Difficulty Badge */}
              <View className="bg-game-badgeBg rounded-[16px] px-4 py-2 flex-row items-center justify-center min-w-[80px]">
                <Text className="text-[14px] font-bold text-game-navy">
                  {activeChallengeInfo.difficulty === "easy" ? "Easy" : activeChallengeInfo.difficulty === "medium" ? "Normal" : activeChallengeInfo.difficulty === "hard" ? "Hard" : "Expert"}
                </Text>
              </View>
            </View>
          </View>

          {/* Responsive Centered Game Board Viewport */}
          <View className="flex-1 items-center justify-center overflow-visible">
            {grid && (
              <View 
                style={{ width: boardWidth, height: boardHeight, position: 'relative', overflow: 'visible' }}
              >
                {/* Layer 1: Background Dot Grid */}
                {dotGridSvg}

                {/* Layer 2: Vector Sliding Arrows */}
                {grid.arrows.map((arrow) => {
                  const handleTap = () => {
                    tapArrow(arrow.id);
                  };

                  return (
                    <ArrowCell
                      key={arrow.id}
                      arrow={arrow}
                      cellSize={cellSize}
                      cellGap={CELL_GAP}
                      padding={GRID_PADDING}
                      isHint={false}
                      isSelected={selectedArrowId === arrow.id}
                      onTap={handleTap}
                      onEscapeComplete={() => {
                        removeArrowState(arrow.id);
                      }}
                      triggerShake={shakingArrowId === arrow.id}
                      onShakeDone={() => handleShakeDone(arrow.id)}
                      svgWidth={boardWidth}
                      svgHeight={boardHeight}
                    />
                  );
                })}
              </View>
            )}
          </View>

          {/* Bottom Tools Row */}
          <View className="flex-row items-center justify-center pb-6 pt-3">
            {/* Tool 1: Hint Bulb */}
            <Pressable
              onPress={() => {}}
              className="w-[68px] h-[68px] rounded-full bg-white items-center justify-center shadow-lg shadow-black/12 elevation-4"
              style={({ pressed }) => pressed ? { transform: [{ scale: 0.95 }] } : undefined}
              hitSlop={8}
            >
              <View className="w-8 h-8 items-center justify-center">
                <BulbIcon />
              </View>
            </Pressable>
          </View>

          {/* LEVEL COMPLETE OVERLAY MODAL */}
          {isWon && (
            <View className="absolute inset-0 bg-slate-900/80 items-center justify-center px-7 z-50">
              <Animated.View
                style={modalStyle}
                className="w-full max-w-[340px] bg-white rounded-[32px] p-7 items-center gap-4 shadow-2xl border border-slate-100"
              >
                <View className="w-20 h-20 rounded-full bg-amber-50 items-center justify-center border border-amber-200 mb-1">
                  <MaterialIcons name="emoji-events" size={48} color="#F59E0B" />
                </View>

                <Text className="text-[22px] font-black text-slate-800 tracking-tight text-center">
                  Daily Challenge Clear!
                </Text>

                <Text className="text-[13px] text-slate-500 font-semibold text-center mt-[-8px]">
                  Solved in {formatTime(timeElapsed)} • {moves} moves
                </Text>

                {/* Rewards displays */}
                <View className="w-full bg-amber-50/50 border border-amber-100 rounded-2xl py-3 px-5 items-center">
                  <Text className="text-[10px] font-black text-amber-800 uppercase tracking-widest">Reward Claimed</Text>
                  <Text className="text-[24px] font-black text-amber-600 mt-1">🪙 +{activeChallengeInfo.rewardCoins}</Text>
                </View>

                <Pressable
                  onPress={() => setScreenMode('calendar')}
                  className="w-full bg-blue-500 rounded-[18px] py-[15px] items-center mt-2 shadow-lg shadow-blue-500/20"
                >
                  <Text className="text-white text-[15px] font-black tracking-wide uppercase">Claim & Exit</Text>
                </Pressable>
              </Animated.View>
            </View>
          )}

          {/* LEVEL FAILED OVERLAY MODAL */}
          {isGameOver && (
            <View className="absolute inset-0 bg-slate-900/80 items-center justify-center px-7 z-50">
              <Animated.View
                style={modalStyle}
                className="w-full max-w-[340px] bg-white rounded-[32px] p-7 items-center gap-4 shadow-2xl border border-slate-100"
              >
                <View className="w-20 h-20 rounded-full bg-rose-50 items-center justify-center border border-rose-200 mb-1">
                  <MaterialIcons name="heart-broken" size={48} color="#F43F5E" />
                </View>

                <Text className="text-[22px] font-black text-slate-800 tracking-tight text-center">
                  Challenge Failed!
                </Text>

                <Text className="text-[13px] text-slate-500 font-medium text-center">
                  You ran out of attempt lives. Try again to clear the daily puzzle!
                </Text>

                <Pressable
                  onPress={resetChallenge}
                  className="w-full bg-slate-800 rounded-[18px] py-[15px] items-center mt-2 shadow-lg"
                >
                  <Text className="text-white text-[15px] font-black tracking-wide uppercase">Try Again 🔄</Text>
                </Pressable>

                <Pressable
                  onPress={() => setScreenMode('calendar')}
                  className="w-full rounded-[18px] py-3.5 items-center border border-slate-200"
                >
                  <Text className="text-slate-500 text-[14px] font-bold">Back to Calendar</Text>
                </Pressable>
              </Animated.View>
            </View>
          )}
        </View>
      )}
    </GestureHandlerRootView>
  );
}
