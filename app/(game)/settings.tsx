import React from 'react';
import {
  View, Text, Pressable, Switch, ScrollView, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useProgressStore } from '../../store/useProgressStore';
import { COLORS } from '../../constants/theme';

interface RowProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  sub: string;
  value: boolean;
  onToggle: () => void;
  trackColor?: string;
}

const SettingRow: React.FC<RowProps> = ({ icon, label, sub, value, onToggle, trackColor = COLORS.accent }) => (
  <View className="flex-row items-center gap-3.5 bg-white rounded-[16px] p-3.5 mb-2.5 shadow shadow-[#1A2340]/10 elevation-3">
    <View 
      className="w-[38px] h-[38px] rounded-[10px] items-center justify-center" 
      style={{ backgroundColor: trackColor + '18' }}
    >
      <MaterialIcons name={icon} size={20} color={value ? trackColor : '#64748B'} />
    </View>
    <View className="flex-1">
      <Text className="text-[15px] font-bold text-game-navy mb-[1px]">{label}</Text>
      <Text className="text-[12px] text-game-secondary font-normal">{sub}</Text>
    </View>
    <Switch
      value={value}
      onValueChange={onToggle}
      trackColor={{ false: '#E2E8F0', true: trackColor }}
      thumbColor="#FFFFFF"
      ios_backgroundColor="#E2E8F0"
    />
  </View>
);

export default function SettingsScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { sounds, haptics, toggleSounds, toggleHaptics } = useSettingsStore();
  const { resetProgress } = useProgressStore();

  return (
    <LinearGradient
      colors={[COLORS.bgGradientStart, COLORS.bgGradientEnd]}
      className="flex-1"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom + 16 }}
    >
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <Pressable onPress={() => router.back()} className="w-10 h-10 rounded-full bg-white items-center justify-center" hitSlop={8}>
          <MaterialIcons name="arrow-back" size={22} color="#1F355E" />
        </Pressable>
        <Text className="text-[18px] font-black text-game-navy tracking-tight">Settings</Text>
        <View className="w-10" />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <Text className="text-[11px] font-bold text-game-secondary uppercase tracking-[1px] mb-2.5">Preferences</Text>

        <SettingRow
          icon="volume-up"
          label="Sound Effects"
          sub="Play audio cues on tap and win"
          value={sounds}
          onToggle={toggleSounds}
          trackColor="#1F355E"
        />

        <SettingRow
          icon="vibration"
          label="Haptic Feedback"
          sub="Vibrate on tap and escape"
          value={haptics}
          onToggle={toggleHaptics}
          trackColor="#8B5CF6"
        />

        <Text className="text-[11px] font-bold text-game-secondary uppercase tracking-[1px] mb-2.5 mt-6">Progress</Text>

        <Pressable
          onPress={() => { resetProgress(); router.replace('/(game)/home'); }}
          className="flex-row items-center gap-3.5 bg-white rounded-[16px] p-3.5 mb-2.5 border border-red-500/20 shadow shadow-[#1A2340]/10 elevation-3"
        >
          <View className="w-[38px] h-[38px] rounded-[10px] items-center justify-center bg-red-500/10">
            <MaterialIcons name="delete-outline" size={20} color="#EF4444" />
          </View>
          <View className="flex-1">
            <Text className="text-[15px] font-bold text-red-500 mb-[1px]">Reset All Progress</Text>
            <Text className="text-[12px] text-game-secondary font-normal">Clears completed levels and stars</Text>
          </View>
          <MaterialIcons name="chevron-right" size={18} color="#EF4444" />
        </Pressable>

        <Text className="text-center text-game-secondary text-[12px] font-medium mt-6">Arrow Puzzle · Infinite Levels</Text>
      </ScrollView>
    </LinearGradient>
  );
}
