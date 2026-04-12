import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Animated, Easing, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme, type Colors } from '../../theme';
import { typography, spacing, radii } from '../../theme';
import { FormInput } from '../../components/FormInput';
import { CategoryChip } from '../../components/CategoryChip';
import { useBikeStore } from '../../store/bikeStore';

const experienceLevels = ['beginner', 'intermediate', 'advanced'] as const;

export function BikeProfileSetupScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { bikeProfile, setBikeProfile } = useBikeStore();
  const [bikeModel, setBikeModel] = useState(bikeProfile?.bikeModel || '');
  const [bikeCc, setBikeCc] = useState(bikeProfile?.bikeCc?.toString() || '');
  const [experienceLevel, setExperienceLevel] = useState(bikeProfile?.experienceLevel || 'beginner');
  const [bio, setBio] = useState(bikeProfile?.bio || '');
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, []);

  const canSubmit = bikeModel.trim() && bikeCc.trim();

  const handleSave = () => {
    setBikeProfile({
      id: bikeProfile?.id || Date.now().toString(),
      userId: 'dev-traveler',
      userName: 'Alex Traveler',
      bikeModel,
      bikeCc: parseInt(bikeCc, 10),
      experienceLevel,
      bio: bio || undefined,
    });
    Alert.alert('Profile Saved', 'Your bike profile has been updated!', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={colors.onSurface} />
        </Pressable>
        <Text style={styles.headerTitle}>Bike Profile</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
          <View style={styles.iconContainer}>
            <Ionicons name="bicycle" size={48} color={colors.primary} />
          </View>

          <FormInput label="Bike Model" icon="bicycle-outline" value={bikeModel} onChangeText={setBikeModel} placeholder="e.g., Honda CG 125" />
          <FormInput label="Engine CC" icon="speedometer-outline" value={bikeCc} onChangeText={setBikeCc} placeholder="e.g., 125" keyboardType="numeric" />

          <Text style={styles.levelLabel}>Experience Level</Text>
          <View style={styles.levelRow}>
            {experienceLevels.map((level) => (
              <CategoryChip
                key={level}
                label={level.charAt(0).toUpperCase() + level.slice(1)}
                selected={experienceLevel === level}
                onPress={() => setExperienceLevel(level)}
                style={{ flex: 1 }}
              />
            ))}
          </View>

          <FormInput label="Bio (optional)" icon="create-outline" value={bio} onChangeText={setBio} placeholder="Tell other riders about yourself..." multiline />
        </Animated.View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
        <Pressable onPress={handleSave} disabled={!canSubmit} style={styles.saveButton}>
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.gradient, !canSubmit && { opacity: 0.5 }]}
          >
            <Text style={styles.saveText}>Save Profile</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const makeStyles = (colors: Colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceContainerLow, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: 'Manrope_400Regular', fontSize: 18, color: colors.onSurface },
  scrollContent: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg },
  iconContainer: { alignItems: 'center', marginBottom: spacing['2xl'] },
  levelLabel: { fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.onSurfaceVariant, marginBottom: spacing.sm, letterSpacing: 0.3 },
  levelRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xl },
  footer: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg },
  saveButton: { width: '100%' },
  gradient: { height: 56, borderRadius: radii.xl, alignItems: 'center', justifyContent: 'center' },
  saveText: { fontFamily: 'Inter_400Regular', fontSize: 15, color: colors.onPrimary },
});
