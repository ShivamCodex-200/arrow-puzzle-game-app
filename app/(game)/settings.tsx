import React from 'react';
import {
  View, Text, Pressable, Switch, ScrollView, StyleSheet, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useProgressStore } from '../../store/useProgressStore';
import { COLORS, SHADOWS } from '../../constants/theme';

interface RowProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  sub: string;
  value: boolean;
  onToggle: () => void;
  trackColor?: string;
}

const SettingRow: React.FC<RowProps> = ({ icon, label, sub, value, onToggle, trackColor = COLORS.accent }) => (
  <View style={[styles.row, SHADOWS.card]}>
    <View style={[styles.rowIcon, { backgroundColor: trackColor + '18' }]}>
      <MaterialIcons name={icon} size={20} color={value ? trackColor : COLORS.textSecondary} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowSub}>{sub}</Text>
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
      style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + 16 }]}
    >
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <MaterialIcons name="arrow-back" size={22} color={COLORS.text} />
        </Pressable>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>Preferences</Text>

        <SettingRow
          icon="volume-up"
          label="Sound Effects"
          sub="Play audio cues on tap and win"
          value={sounds}
          onToggle={toggleSounds}
          trackColor={COLORS.accent}
        />

        <SettingRow
          icon="vibration"
          label="Haptic Feedback"
          sub="Vibrate on tap and escape"
          value={haptics}
          onToggle={toggleHaptics}
          trackColor="#8B5CF6"
        />

        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Progress</Text>

        <Pressable
          onPress={() => { resetProgress(); router.replace('/(game)/home'); }}
          style={[styles.dangerRow, SHADOWS.card]}
        >
          <View style={[styles.rowIcon, { backgroundColor: COLORS.danger + '15' }]}>
            <MaterialIcons name="delete-outline" size={20} color={COLORS.danger} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.rowLabel, { color: COLORS.danger }]}>Reset All Progress</Text>
            <Text style={styles.rowSub}>Clears completed levels and stars</Text>
          </View>
          <MaterialIcons name="chevron-right" size={18} color={COLORS.danger} />
        </Pressable>

        <Text style={styles.footer}>Arrow Puzzle · Infinite Levels</Text>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.cardBg, alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 18, fontWeight: '800', color: COLORS.text, letterSpacing: -0.3 },
  scroll: { paddingHorizontal: 20, paddingBottom: 32 },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: COLORS.textSecondary,
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10,
  },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: COLORS.cardBg, borderRadius: 16,
    padding: 14, marginBottom: 10,
  },
  rowIcon: {
    width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
  },
  rowLabel: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 1 },
  rowSub:   { fontSize: 12, color: COLORS.textSecondary, fontWeight: '400' },
  dangerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: COLORS.danger + '25',
  },
  footer: {
    textAlign: 'center', color: COLORS.textSecondary, fontSize: 12,
    fontWeight: '500', marginTop: 24,
  },
});
