import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Share, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { useTheme, typography, spacing, radii, type Colors } from '../../theme';
import { rewardsApi } from '../../api';
import type { UserPointsInfo } from '../../types';

const MILESTONE_5 = 5;
const MILESTONE_10 = 10;

export function RewardsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [data, setData] = useState<UserPointsInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    rewardsApi
      .getMyPoints()
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const handleCopy = async () => {
    if (!data?.referralCode) return;
    await Clipboard.setStringAsync(data.referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (!data?.referralCode) return;
    Share.share({
      message: `Join me on Nazary! Use my code: ${data.referralCode}\nhttps://nazary.pk/refer/${data.referralCode}`,
    });
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
            <Ionicons name="arrow-back" size={24} color={colors.onSurface} />
          </Pressable>
          <Text style={styles.headerTitle}>Rewards & Referrals</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={[styles.center, { flex: 1 }]}>
          <Text style={styles.errorText}>Could not load rewards data.</Text>
        </View>
      </View>
    );
  }

  const progress5 = Math.min(data.completedTripsCount / MILESTONE_5, 1);
  const progress10 = Math.min(data.completedTripsCount / MILESTONE_10, 1);

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={colors.onSurface} />
        </Pressable>
        <Text style={styles.headerTitle}>Rewards & Referrals</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Points Counter */}
      <View style={styles.pointsCard}>
        <Ionicons name="star" size={32} color={colors.warning} />
        <Text style={styles.pointsNumber}>{data.points}</Text>
        <Text style={styles.pointsLabel}>Points</Text>
      </View>

      {/* Trip Milestone Tracker */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Trip Milestones</Text>
        <Text style={styles.tripsCount}>{data.completedTripsCount} trips completed</Text>

        {/* 5-trip milestone */}
        <View style={styles.milestoneRow}>
          <View style={styles.milestoneInfo}>
            <Ionicons
              name={data.completedTripsCount >= MILESTONE_5 ? 'checkmark-circle' : 'ellipse-outline'}
              size={20}
              color={data.completedTripsCount >= MILESTONE_5 ? colors.success : colors.outline}
            />
            <Text style={styles.milestoneText}>5 Trips — Surprise Gift</Text>
          </View>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progress5 * 100}%`, backgroundColor: colors.primary }]} />
        </View>

        {/* 10-trip milestone */}
        <View style={[styles.milestoneRow, { marginTop: spacing.lg }]}>
          <View style={styles.milestoneInfo}>
            <Ionicons
              name={data.freeTripEligible ? 'checkmark-circle' : 'ellipse-outline'}
              size={20}
              color={data.freeTripEligible ? colors.success : colors.outline}
            />
            <Text style={styles.milestoneText}>10 Trips — Free Trip Lucky Draw</Text>
          </View>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progress10 * 100}%`, backgroundColor: colors.primary }]} />
        </View>
        {data.freeTripEligible && data.freeTripPairName && (
          <Text style={styles.pairText}>Paired with {data.freeTripPairName}</Text>
        )}
        {!data.freeTripEligible && data.completedTripsCount >= MILESTONE_10 && (
          <Text style={styles.pairHint}>Refer a friend who also completes 10 trips to enter the lucky draw!</Text>
        )}
      </View>

      {/* Referral Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Refer Friends</Text>
        <Text style={styles.referralDesc}>
          Share your code and earn {150} bonus points when your friend completes their first trip!
        </Text>

        <View style={styles.codeRow}>
          <Text style={styles.codeText}>{data.referralCode}</Text>
          <Pressable onPress={handleCopy} style={styles.copyButton}>
            <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={18} color={colors.primary} />
            <Text style={styles.copyText}>{copied ? 'Copied' : 'Copy'}</Text>
          </Pressable>
        </View>

        <Pressable style={styles.shareButton} onPress={handleShare}>
          <Ionicons name="share-social-outline" size={20} color={colors.onPrimary} />
          <Text style={styles.shareText}>Share with Friends</Text>
        </Pressable>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{data.referralsCount}</Text>
            <Text style={styles.statLabel}>Friends Referred</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{data.referralBonusPoints}</Text>
            <Text style={styles.statLabel}>Bonus Points</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const makeStyles = (colors: Colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing['3xl'] },
  center: { alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: spacing.lg, marginBottom: spacing['2xl'] },
  headerTitle: { fontFamily: 'Manrope_400Regular', fontSize: 18, color: colors.onSurface },
  errorText: { ...typography.bodyMd, color: colors.onSurfaceVariant },

  // Points card
  pointsCard: { alignItems: 'center', backgroundColor: colors.surfaceContainerLow, borderRadius: radii['2xl'], paddingVertical: spacing['2xl'], marginBottom: spacing['2xl'] },
  pointsNumber: { fontFamily: 'Manrope_300Light', fontSize: 48, color: colors.onSurface, marginTop: spacing.sm },
  pointsLabel: { fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.onSurfaceVariant, marginTop: spacing.xs },

  // Milestones
  section: { backgroundColor: colors.surfaceContainerLow, borderRadius: radii['2xl'], padding: spacing.xl, marginBottom: spacing.lg },
  sectionTitle: { fontFamily: 'Manrope_400Regular', fontSize: 18, color: colors.onSurface, marginBottom: spacing.sm },
  tripsCount: { fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.onSurfaceVariant, marginBottom: spacing.xl },
  milestoneRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  milestoneInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  milestoneText: { fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.onSurface },
  progressBarBg: { height: 6, borderRadius: 3, backgroundColor: colors.surfaceContainerHigh, overflow: 'hidden' },
  progressBarFill: { height: 6, borderRadius: 3 },
  pairText: { fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.success, marginTop: spacing.sm },
  pairHint: { fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.onSurfaceVariant, marginTop: spacing.sm, lineHeight: 18 },

  // Referral
  referralDesc: { fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.onSurfaceVariant, lineHeight: 20, marginBottom: spacing.xl },
  codeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surfaceContainerHigh, borderRadius: radii.xl, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, marginBottom: spacing.md },
  codeText: { fontFamily: 'Manrope_400Regular', fontSize: 18, color: colors.onSurface, letterSpacing: 2 },
  copyButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  copyText: { fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.primary },
  shareButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, height: 48, borderRadius: radii.xl, backgroundColor: colors.primary, marginBottom: spacing.xl },
  shareText: { fontFamily: 'Inter_400Regular', fontSize: 15, color: colors.onPrimary },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statItem: { flex: 1, alignItems: 'center' },
  statNumber: { fontFamily: 'Manrope_400Regular', fontSize: 22, color: colors.onSurface },
  statLabel: { fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.onSurfaceVariant, marginTop: 2 },
  statDivider: { width: 1, height: 32, backgroundColor: colors.outlineVariant },
});
