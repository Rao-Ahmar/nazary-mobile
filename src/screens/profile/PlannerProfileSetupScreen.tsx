import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Animated, Easing, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, typography, spacing, radii, shadows } from '../../theme';
import { FormInput } from '../../components/FormInput';
import { useAuthStore } from '../../store';
import { profileApi } from '../../api/profile';
import { authApi } from '../../api/auth';
import type { ProfileSetupStackParamList } from '../../types';

const PHONE_REGEX = /^(\+92[0-9]{10}|0[0-9]{10})$/;

type NavigationProp = NativeStackNavigationProp<ProfileSetupStackParamList, 'PlannerProfileSetup'>;

export function PlannerProfileSetupScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { setProfileCompleted, setUser } = useAuthStore();
  const [step, setStep] = useState(0);
  const [agencyName, setAgencyName] = useState('');
  const [tagline, setTagline] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [yearsExperience, setYearsExperience] = useState('');
  const [cnicNumber, setCnicNumber] = useState('');
  const [avatar, setAvatar] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [phoneVerified, setPhoneVerified] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [step]);

  // Listen for focus to detect return from OTP screen
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (phoneVerified && step === 0) {
        setStep(1);
      }
    });
    return unsubscribe;
  }, [navigation, phoneVerified, step]);

  const fadeStyle = {
    opacity: fadeAnim,
    transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
  };

  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setAvatar(result.assets[0]);
    }
  };

  const canProceedStep0 = agencyName.trim() && tagline.trim() && phone.trim() && avatar !== null;
  const canProceedStep1 = yearsExperience.trim();

  const [isSaving, setIsSaving] = useState(false);

  const handleComplete = async () => {
    setIsSaving(true);
    try {
      const data: Record<string, unknown> = {
        agency_name: agencyName.trim(),
        agency_tagline: tagline.trim(),
        phone: phone.trim(),
      };
      if (yearsExperience) data.years_experience = parseInt(yearsExperience, 10);
      if (cnicNumber.trim()) data.cnic_number = cnicNumber.trim();

      await profileApi.updateProfile(data as any);

      if (avatar) {
        const formData = new FormData();
        formData.append('avatar', {
          uri: avatar.uri,
          type: avatar.mimeType || 'image/jpeg',
          name: avatar.fileName || 'avatar.jpg',
        } as any);
        await profileApi.uploadAvatar(formData);
      }

      // Refresh user data so avatar URL is available in the store
      const res = await authApi.getCurrentUser();
      const freshUser = res.data;
      setUser({ ...freshUser, profileCompleted: true });
      setProfileCompleted(true);
    } catch {
      Alert.alert('Error', 'Could not save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const steps = ['Profile & Agency', 'Verification', 'Finish'];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Set Up Your Agency</Text>
        <Text style={styles.subtitle}>Let travelers know who you are</Text>

        <View style={styles.stepper}>
          {steps.map((s, i) => (
            <View key={s} style={styles.stepRow}>
              <View style={[styles.stepDot, i <= step && styles.stepDotActive]}>
                {i < step ? (
                  <Ionicons name="checkmark" size={12} color="#fff" />
                ) : (
                  <Text style={[styles.stepNumber, i <= step && styles.stepNumberActive]}>{i + 1}</Text>
                )}
              </View>
              <Text style={[styles.stepLabel, i <= step && styles.stepLabelActive]}>{s}</Text>
              {i < steps.length - 1 && <View style={[styles.stepLine, i < step && styles.stepLineActive]} />}
            </View>
          ))}
        </View>

        <Animated.View style={fadeStyle}>
          {step === 0 && (
            <View>
              <Pressable onPress={pickAvatar} style={styles.avatarPicker}>
                {avatar ? (
                  <Image source={{ uri: avatar.uri }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Ionicons name="camera-outline" size={32} color={colors.outlineVariant} />
                  </View>
                )}
              </Pressable>
              <Text style={styles.avatarLabel}>Upload Photo *</Text>

              <FormInput label="Agency Name" icon="business-outline" value={agencyName} onChangeText={setAgencyName} placeholder="e.g., Khan Adventures" />
              <FormInput label="Tagline" icon="megaphone-outline" value={tagline} onChangeText={setTagline} placeholder="e.g., Discover the undiscovered" />
              <FormInput label="Phone Number" icon="call-outline" value={phone} onChangeText={(text: string) => { setPhone(text); if (phoneError) setPhoneError(''); }} placeholder="+92 300 1234567" keyboardType="phone-pad" />
              {phoneError ? <Text style={styles.phoneError}>{phoneError}</Text> : null}
            </View>
          )}
          {step === 1 && (
            <View>
              <FormInput label="Years of Experience" icon="calendar-outline" value={yearsExperience} onChangeText={setYearsExperience} placeholder="e.g., 5" keyboardType="numeric" />
              <FormInput label="CNIC Number (optional)" icon="card-outline" value={cnicNumber} onChangeText={setCnicNumber} placeholder="xxxxx-xxxxxxx-x" />
              <View style={[styles.infoCard, shadows.soft]}>
                <Ionicons name="shield-checkmark-outline" size={24} color={colors.primary} />
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <Text style={styles.infoTitle}>Verification</Text>
                  <Text style={styles.infoText}>Your CNIC helps build trust with travelers. It's stored securely and never shared publicly.</Text>
                </View>
              </View>
            </View>
          )}
          {step === 2 && (
            <View style={styles.finishContainer}>
              <View style={[styles.successCircle]}>
                <Ionicons name="checkmark-circle" size={64} color={colors.success} />
              </View>
              <Text style={styles.finishTitle}>You're All Set!</Text>
              <Text style={styles.finishText}>Your agency profile is ready. Start creating trips and accepting custom requests from travelers.</Text>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
        {step > 0 && step < 2 && (
          <Pressable onPress={() => setStep(step - 1)} style={styles.backButton}>
            <Text style={styles.backText}>Back</Text>
          </Pressable>
        )}
        <Pressable
          onPress={() => {
            if (step === 0) {
              if (!PHONE_REGEX.test(phone.trim())) {
                setPhoneError('Enter a valid Pakistan phone number (e.g. +923001234567 or 03001234567)');
                return;
              }
              setPhoneError('');
              setPhoneVerified(true);
              navigation.navigate('OtpVerification', { phoneNumber: phone.trim() });
              return;
            }
            if (step < 2) setStep(step + 1);
            else handleComplete();
          }}
          disabled={(step === 0 ? !canProceedStep0 : step === 1 ? !canProceedStep1 : false) || isSaving}
          style={styles.nextButton}
        >
          <LinearGradient
            colors={['#0058bc', '#0070eb']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.gradient, ((step === 0 && !canProceedStep0) || (step === 1 && !canProceedStep1)) && { opacity: 0.5 }]}
          >
            <Text style={styles.nextText}>{isSaving ? 'Saving...' : step === 2 ? 'Get Started' : 'Continue'}</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  scrollContent: { paddingHorizontal: spacing.xl, paddingTop: spacing['2xl'] },
  title: { fontFamily: 'Manrope_300Light', fontSize: 32, color: colors.onSurface, letterSpacing: -0.5 },
  subtitle: { ...typography.bodyMd, color: colors.onSurfaceVariant, marginTop: spacing.xs, marginBottom: spacing['2xl'] },
  stepper: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing['2xl'] },
  stepRow: { flexDirection: 'row', alignItems: 'center' },
  stepDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' },
  stepDotActive: { backgroundColor: colors.primary },
  stepNumber: { fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.onSurfaceVariant },
  stepNumberActive: { color: '#fff' },
  stepLabel: { fontFamily: 'Inter_400Regular', fontSize: 11, color: colors.onSurfaceVariant, marginLeft: spacing.xs },
  stepLabelActive: { color: colors.primary },
  stepLine: { width: 20, height: 2, backgroundColor: colors.surfaceContainerHigh, marginHorizontal: spacing.xs },
  stepLineActive: { backgroundColor: colors.primary },
  infoCard: { flexDirection: 'row', backgroundColor: colors.surfaceContainerLowest, borderRadius: radii.xl, padding: spacing.lg, marginTop: spacing.lg },
  infoTitle: { fontFamily: 'Manrope_400Regular', fontSize: 14, color: colors.onSurface, marginBottom: 4 },
  infoText: { ...typography.bodySm, color: colors.onSurfaceVariant },
  finishContainer: { alignItems: 'center', paddingTop: spacing['3xl'] },
  successCircle: { marginBottom: spacing.xl },
  finishTitle: { fontFamily: 'Manrope_400Regular', fontSize: 24, color: colors.onSurface, marginBottom: spacing.md },
  finishText: { ...typography.bodyMd, color: colors.onSurfaceVariant, textAlign: 'center', paddingHorizontal: spacing.xl },
  footer: { flexDirection: 'row', paddingHorizontal: spacing.xl, paddingTop: spacing.lg, gap: spacing.md },
  backButton: { height: 56, borderRadius: radii.xl, backgroundColor: colors.surfaceContainerLow, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  backText: { fontFamily: 'Inter_400Regular', fontSize: 15, color: colors.onSurface },
  nextButton: { flex: 1 },
  gradient: { height: 56, borderRadius: radii.xl, alignItems: 'center', justifyContent: 'center' },
  nextText: { fontFamily: 'Inter_400Regular', fontSize: 15, color: '#fff' },
  phoneError: { ...typography.bodySm, color: colors.error, marginTop: spacing.xs },
  avatarPicker: { alignSelf: 'center', marginBottom: spacing.sm },
  avatarImage: { width: 120, height: 120, borderRadius: 60 },
  avatarPlaceholder: { width: 120, height: 120, borderRadius: 60, backgroundColor: colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' },
  avatarLabel: { ...typography.bodySm, color: colors.onSurfaceVariant, textAlign: 'center', marginBottom: spacing.lg },
});
