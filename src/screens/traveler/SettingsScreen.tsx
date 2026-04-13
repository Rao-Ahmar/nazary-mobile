import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TextInput,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, typography, spacing, radii } from '../../theme';
import { type Colors } from '../../theme';
import { useAuthStore } from '../../store';
import { profileApi } from '../../api/profile';
import { tripPreferencesApi, type TripPreference } from '../../api/tripPreferences';
import { CategoryChip } from '../../components/CategoryChip';
import { useAlert } from '../../components/ThemedAlert';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function SettingsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { user, setUser } = useAuthStore();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const alert = useAlert();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [preferredMonths, setPreferredMonths] = useState<number[]>([]);
  const [followedAgencyId, setFollowedAgencyId] = useState<string | null>(null);
  const [followedAgencyName, setFollowedAgencyName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load notifications setting from user
      const enabled = (user as any)?.notifications_enabled ?? (user as any)?.notificationsEnabled ?? true;
      setNotificationsEnabled(enabled);

      // Load trip preferences
      const res = await tripPreferencesApi.get();
      const resData = res.data as any;
      const pref: TripPreference | null = resData?.data ?? resData ?? null;
      if (pref && pref.id) {
        setBudgetMin(pref.budget_min ? String(pref.budget_min) : '');
        setBudgetMax(pref.budget_max ? String(pref.budget_max) : '');
        setPreferredMonths(pref.preferred_months ?? []);
        setFollowedAgencyId(pref.followed_agency_id);
        setFollowedAgencyName(pref.followed_agency_name);
      }
    } catch {
      // Preferences may not exist yet
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleNotifications = useCallback(async (value: boolean) => {
    setNotificationsEnabled(value);
    try {
      await profileApi.updateProfile({ notifications_enabled: value });
      if (user) {
        setUser({ ...user, notificationsEnabled: value } as any);
      }
    } catch {
      setNotificationsEnabled(!value);
      alert.show({ title: 'Error', message: 'Could not update notification setting', type: 'error' });
    }
  }, [user, setUser]);

  const toggleMonth = (month: number) => {
    setPreferredMonths((prev) =>
      prev.includes(month) ? prev.filter((m) => m !== month) : [...prev, month],
    );
  };

  const handleSavePreferences = async () => {
    setIsSaving(true);
    try {
      await tripPreferencesApi.upsert({
        budget_min: budgetMin ? parseFloat(budgetMin) : null,
        budget_max: budgetMax ? parseFloat(budgetMax) : null,
        preferred_months: preferredMonths,
        followed_agency_id: followedAgencyId,
      });
      alert.show({ title: 'Saved', message: 'Trip preferences updated', type: 'success' });
    } catch (error: any) {
      const msg = error?.response?.data?.error || 'Could not save preferences';
      alert.show({ title: 'Error', message: msg, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={colors.onSurface} />
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Notifications Toggle */}
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.toggleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.toggleLabel}>Push Notifications</Text>
            <Text style={styles.toggleDesc}>Receive alerts about new trips, reminders, and updates</Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={handleToggleNotifications}
            trackColor={{ false: colors.surfaceContainerHigh, true: colors.primary }}
            thumbColor={colors.onPrimary}
          />
        </View>

        {/* Trip Preferences */}
        <Text style={[styles.sectionTitle, { marginTop: spacing['2xl'] }]}>Trip Preferences</Text>
        <Text style={styles.sectionDesc}>Set your preferences to get notified about matching trips</Text>

        <Text style={styles.label}>Budget Range (PKR)</Text>
        <View style={styles.budgetRow}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Min"
            placeholderTextColor={colors.outline}
            value={budgetMin}
            onChangeText={setBudgetMin}
            keyboardType="numeric"
          />
          <Text style={styles.budgetDash}>-</Text>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Max"
            placeholderTextColor={colors.outline}
            value={budgetMax}
            onChangeText={setBudgetMax}
            keyboardType="numeric"
          />
        </View>

        <Text style={styles.label}>Preferred Months</Text>
        <View style={styles.monthsGrid}>
          {MONTHS.map((month, index) => (
            <CategoryChip
              key={month}
              label={month}
              selected={preferredMonths.includes(index + 1)}
              onPress={() => toggleMonth(index + 1)}
              style={styles.monthChip}
            />
          ))}
        </View>

        {followedAgencyName && (
          <View style={styles.followedAgency}>
            <Text style={styles.label}>Followed Agency</Text>
            <View style={styles.agencyBadge}>
              <Text style={styles.agencyName}>{followedAgencyName}</Text>
              <Pressable onPress={() => { setFollowedAgencyId(null); setFollowedAgencyName(null); }}>
                <Ionicons name="close-circle" size={20} color={colors.onSurfaceVariant} />
              </Pressable>
            </View>
          </View>
        )}

        <Pressable style={[styles.saveButton, isSaving && { opacity: 0.6 }]} onPress={handleSavePreferences} disabled={isSaving}>
          <Text style={styles.saveButtonText}>{isSaving ? 'Saving...' : 'Save Preferences'}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const makeStyles = (colors: Colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontFamily: 'Manrope_400Regular', fontSize: 18, color: colors.onSurface },
  scrollContent: { paddingHorizontal: spacing.xl },
  sectionTitle: { fontFamily: 'Manrope_400Regular', fontSize: 20, color: colors.onSurface, marginBottom: spacing.md },
  sectionDesc: { ...typography.bodySm, color: colors.onSurfaceVariant, marginBottom: spacing.lg },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radii.xl,
    padding: spacing.lg,
  },
  toggleLabel: { fontFamily: 'Inter_400Regular', fontSize: 15, color: colors.onSurface },
  toggleDesc: { ...typography.bodySm, color: colors.onSurfaceVariant, marginTop: 2 },
  label: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.onSurfaceVariant,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  },
  input: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    height: 48,
    ...typography.bodyMd,
    color: colors.onSurface,
  },
  budgetRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  budgetDash: { ...typography.bodyMd, color: colors.onSurfaceVariant },
  monthsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  monthChip: { marginBottom: 0 },
  followedAgency: { marginTop: spacing.sm },
  agencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  agencyName: { fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.onSurface, flex: 1 },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.xl,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing['2xl'],
  },
  saveButtonText: { fontFamily: 'Inter_400Regular', fontSize: 16, color: colors.onPrimary, letterSpacing: 0.3 },
});
