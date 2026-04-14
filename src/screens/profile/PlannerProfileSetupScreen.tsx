import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Animated, Easing, Image, ActivityIndicator, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme, typography, spacing, radii, type Colors } from '../../theme';
import { FormInput } from '../../components/FormInput';
import { useAuthStore } from '../../store';
import { profileApi } from '../../api/profile';
import { authApi } from '../../api/auth';
import { plannersApi } from '../../api/planners';
import { useAlert } from '../../components/ThemedAlert';
import { KeyboardAwareScroll } from '../../components/KeyboardAwareScroll';
import type { ProfileSetupStackParamList } from '../../types';

const PHONE_REGEX = /^0[0-9]{10}$/;

type NavigationProp = NativeStackNavigationProp<ProfileSetupStackParamList, 'PlannerProfileSetup'>;

export function PlannerProfileSetupScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const alert = useAlert();
  const { setProfileCompleted, setUser } = useAuthStore();
  const { colors, shadows } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [step, setStep] = useState(0);
  const [agencyName, setAgencyName] = useState('');
  const [tagline, setTagline] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [yearsExperience, setYearsExperience] = useState('');
  const [cnicNumber, setCnicNumber] = useState('');

  const handlePhoneChange = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, 11);
    setPhone(digits);
    if (phoneError) setPhoneError('');
  };

  const handleCnicChange = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, 13);
    let formatted = digits;
    if (digits.length > 5) {
      formatted = digits.slice(0, 5) + '-' + digits.slice(5);
    }
    if (digits.length > 12) {
      formatted = digits.slice(0, 5) + '-' + digits.slice(5, 12) + '-' + digits.slice(12);
    }
    setCnicNumber(formatted);
  };
  const [instagramUrl, setInstagramUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [tiktokUrl, setTiktokUrl] = useState('');
  const [twitterUrl, setTwitterUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [avatar, setAvatar] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [nameAvailable, setNameAvailable] = useState<boolean | null>(null);
  const [nameChecking, setNameChecking] = useState(false);
  const nameCheckTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced agency name availability check
  useEffect(() => {
    const trimmed = agencyName.trim();
    if (trimmed.length < 2) {
      setNameAvailable(null);
      setNameChecking(false);
      return;
    }
    setNameChecking(true);
    setNameAvailable(null);
    if (nameCheckTimer.current) clearTimeout(nameCheckTimer.current);
    nameCheckTimer.current = setTimeout(async () => {
      try {
        const res = await plannersApi.checkName(trimmed);
        const available = (res.data as any)?.available ?? res.data?.available;
        setNameAvailable(available);
      } catch {
        setNameAvailable(null);
      } finally {
        setNameChecking(false);
      }
    }, 500);
    return () => {
      if (nameCheckTimer.current) clearTimeout(nameCheckTimer.current);
    };
  }, [agencyName]);

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

  const canProceedStep0 = agencyName.trim() && tagline.trim() && phone.trim() && avatar !== null && nameAvailable === true;
  const canProceedStep1 = yearsExperience.trim();

  const [isSaving, setIsSaving] = useState(false);
  const [savedNazaryUrl, setSavedNazaryUrl] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);

  const saveProfile = async () => {
    setIsSaving(true);
    try {
      const data: Record<string, unknown> = {
        agency_name: agencyName.trim(),
        agency_tagline: tagline.trim(),
        phone: phone.trim(),
      };
      if (yearsExperience) data.years_experience = parseInt(yearsExperience, 10);
      const rawCnic = cnicNumber.replace(/-/g, '');
      if (rawCnic) data.cnic_number = rawCnic;
      if (instagramUrl.trim()) data.instagram_url = instagramUrl.trim();
      if (youtubeUrl.trim()) data.youtube_url = youtubeUrl.trim();
      if (tiktokUrl.trim()) data.tiktok_url = tiktokUrl.trim();
      if (twitterUrl.trim()) data.twitter_url = twitterUrl.trim();
      if (websiteUrl.trim()) data.website_url = websiteUrl.trim();

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

      // Refresh user data so avatar URL and nazary link are available
      const res = await authApi.getCurrentUser();
      const freshUser = res.data;
      const url = (freshUser as any).nazaryUrl ?? (freshUser as any).nazary_url ?? '';
      setSavedNazaryUrl(url);
      setUser({ ...freshUser, profileCompleted: true });
      setStep(2);
    } catch {
      alert.show({ title: 'Error', message: 'Could not save profile. Please try again.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleComplete = () => {
    setProfileCompleted(true);
  };

  const steps = ['Profile & Agency', 'Verification', 'Finish'];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <KeyboardAwareScroll contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Set Up Your Agency</Text>
        <Text style={styles.subtitle}>Let travelers know who you are</Text>

        <View style={styles.stepper}>
          {steps.map((s, i) => (
            <View key={s} style={styles.stepRow}>
              <View style={[styles.stepDot, i <= step && styles.stepDotActive]}>
                {i < step ? (
                  <Ionicons name="checkmark" size={12} color={colors.onPrimary} />
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
              {agencyName.trim().length >= 2 && (
                <View style={styles.nameStatus}>
                  {nameChecking ? (
                    <ActivityIndicator size="small" color={colors.onSurfaceVariant} />
                  ) : nameAvailable === true ? (
                    <>
                      <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                      <Text style={[styles.nameStatusText, { color: colors.success }]}>Name available</Text>
                    </>
                  ) : nameAvailable === false ? (
                    <>
                      <Ionicons name="close-circle" size={16} color={colors.error} />
                      <Text style={[styles.nameStatusText, { color: colors.error }]}>This agency name is already taken. Please use a different name.</Text>
                    </>
                  ) : null}
                </View>
              )}
              <FormInput label="Tagline" icon="megaphone-outline" value={tagline} onChangeText={setTagline} placeholder="e.g., Discover the undiscovered" />
              <FormInput label="Phone Number" icon="call-outline" value={phone} onChangeText={handlePhoneChange} placeholder="03001234567" keyboardType="number-pad" maxLength={11} />
              {phoneError ? <Text style={styles.phoneError}>{phoneError}</Text> : null}
            </View>
          )}
          {step === 1 && (
            <View>
              <FormInput label="Years of Experience" icon="calendar-outline" value={yearsExperience} onChangeText={setYearsExperience} placeholder="e.g., 5" keyboardType="numeric" />
              <FormInput label="CNIC Number (optional)" icon="card-outline" value={cnicNumber} onChangeText={handleCnicChange} placeholder="XXXXX-XXXXXXX-X" keyboardType="number-pad" maxLength={15} />
              <View style={[styles.infoCard, shadows.soft]}>
                <Ionicons name="shield-checkmark-outline" size={24} color={colors.primary} />
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <Text style={styles.infoTitle}>Verification</Text>
                  <Text style={styles.infoText}>Your CNIC helps build trust with travelers. It's stored securely and never shared publicly.</Text>
                </View>
              </View>

              <Text style={styles.socialHeader}>Social Media (optional)</Text>
              <FormInput label="Instagram" icon="logo-instagram" value={instagramUrl} onChangeText={setInstagramUrl} placeholder="https://instagram.com/your_page" autoCapitalize="none" />
              <FormInput label="YouTube" icon="logo-youtube" value={youtubeUrl} onChangeText={setYoutubeUrl} placeholder="https://youtube.com/@your_channel" autoCapitalize="none" />
              <FormInput label="TikTok" icon="logo-tiktok" value={tiktokUrl} onChangeText={setTiktokUrl} placeholder="https://tiktok.com/@your_page" autoCapitalize="none" />
              <FormInput label="Twitter / X" icon="logo-twitter" value={twitterUrl} onChangeText={setTwitterUrl} placeholder="https://x.com/your_handle" autoCapitalize="none" />
              <FormInput label="Website" icon="globe-outline" value={websiteUrl} onChangeText={setWebsiteUrl} placeholder="https://yourwebsite.com" autoCapitalize="none" />
            </View>
          )}
          {step === 2 && (
            <View style={styles.finishContainer}>
              <View style={[styles.successCircle]}>
                <Ionicons name="checkmark-circle" size={64} color={colors.success} />
              </View>
              <Text style={styles.finishTitle}>You're All Set!</Text>
              <Text style={styles.finishText}>Your agency profile is ready. Start creating trips and accepting custom requests from travelers.</Text>

              {savedNazaryUrl ? (
                <View style={[styles.nazaryLinkCard, shadows.soft]}>
                  <View style={styles.nazaryLinkHeader}>
                    <Ionicons name="link-outline" size={22} color={colors.primary} />
                    <Text style={styles.nazaryLinkTitle}>Your Nazary Link</Text>
                  </View>
                  <View style={styles.nazaryLinkUrlBox}>
                    <Text style={styles.nazaryLinkUrl} selectable>{savedNazaryUrl}</Text>
                  </View>
                  <View style={styles.nazaryLinkActions}>
                    <Pressable
                      style={[styles.nazaryLinkBtn, { backgroundColor: linkCopied ? colors.successLight : colors.primaryTint }]}
                      onPress={async () => {
                        await Clipboard.setStringAsync(savedNazaryUrl);
                        setLinkCopied(true);
                        setTimeout(() => setLinkCopied(false), 2000);
                      }}
                    >
                      <Ionicons name={linkCopied ? 'checkmark' : 'copy-outline'} size={16} color={linkCopied ? colors.success : colors.primary} />
                      <Text style={[styles.nazaryLinkBtnText, { color: linkCopied ? colors.success : colors.primary }]}>
                        {linkCopied ? 'Copied!' : 'Copy Link'}
                      </Text>
                    </Pressable>
                    <Pressable
                      style={[styles.nazaryLinkBtn, { backgroundColor: '#dcf8c6' }]}
                      onPress={() => {
                        const message = `Check out my agency on Nazary: ${savedNazaryUrl}`;
                        Linking.openURL(`whatsapp://send?text=${encodeURIComponent(message)}`).catch(() => {});
                      }}
                    >
                      <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
                      <Text style={[styles.nazaryLinkBtnText, { color: '#25D366' }]}>WhatsApp</Text>
                    </Pressable>
                  </View>
                  <View style={styles.nazaryLinkInstructions}>
                    <Ionicons name="information-circle-outline" size={18} color={colors.warning} />
                    <Text style={styles.nazaryLinkInstructionText}>
                      Add this link to your Instagram or TikTok bio to get verified on Nazary. Travelers check this to confirm your agency is legitimate.
                    </Text>
                  </View>
                </View>
              ) : null}
            </View>
          )}
        </Animated.View>
      </KeyboardAwareScroll>

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
                setPhoneError('Enter a valid 11-digit phone number (e.g. 03001234567)');
                return;
              }
              setPhoneError('');
              setPhoneVerified(true);
              navigation.navigate('OtpVerification', { phoneNumber: phone.trim() });
              return;
            }
            if (step === 1) {
              saveProfile();
              return;
            }
            handleComplete();
          }}
          disabled={(step === 0 ? !canProceedStep0 : step === 1 ? !canProceedStep1 : false) || isSaving}
          style={styles.nextButton}
        >
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
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

const makeStyles = (colors: Colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  scrollContent: { paddingHorizontal: spacing.xl, paddingTop: spacing['2xl'] },
  title: { fontFamily: 'Manrope_300Light', fontSize: 32, color: colors.onSurface, letterSpacing: -0.5 },
  subtitle: { ...typography.bodyMd, color: colors.onSurfaceVariant, marginTop: spacing.xs, marginBottom: spacing['2xl'] },
  stepper: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing['2xl'] },
  stepRow: { flexDirection: 'row', alignItems: 'center' },
  stepDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' },
  stepDotActive: { backgroundColor: colors.primary },
  stepNumber: { fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.onSurfaceVariant },
  stepNumberActive: { color: colors.onPrimary },
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
  nextText: { fontFamily: 'Inter_400Regular', fontSize: 15, color: colors.onPrimary },
  phoneError: { ...typography.bodySm, color: colors.error, marginTop: spacing.xs },
  avatarPicker: { alignSelf: 'center', marginBottom: spacing.sm },
  avatarImage: { width: 120, height: 120, borderRadius: 60 },
  avatarPlaceholder: { width: 120, height: 120, borderRadius: 60, backgroundColor: colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' },
  avatarLabel: { ...typography.bodySm, color: colors.onSurfaceVariant, textAlign: 'center', marginBottom: spacing.lg },
  socialHeader: { fontFamily: 'Manrope_400Regular', fontSize: 16, color: colors.onSurface, marginTop: spacing.xl, marginBottom: spacing.md },
  nameStatus: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: -spacing.sm, marginBottom: spacing.sm, paddingHorizontal: spacing.xs },
  nameStatusText: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  nazaryLinkCard: { backgroundColor: colors.surfaceContainerLowest, borderRadius: radii.xl, padding: spacing.lg, marginTop: spacing['2xl'], width: '100%' },
  nazaryLinkHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  nazaryLinkTitle: { fontFamily: 'Manrope_400Regular', fontSize: 16, color: colors.onSurface },
  nazaryLinkUrlBox: { backgroundColor: colors.surfaceContainerLow, borderRadius: radii.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, marginBottom: spacing.md },
  nazaryLinkUrl: { fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.primary },
  nazaryLinkActions: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  nazaryLinkBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radii.full },
  nazaryLinkBtnText: { fontFamily: 'Inter_400Regular', fontSize: 13 },
  nazaryLinkInstructions: { flexDirection: 'row', gap: spacing.sm, backgroundColor: colors.warningLight, borderRadius: radii.md, padding: spacing.md },
  nazaryLinkInstructionText: { fontFamily: 'Inter_300Light', fontSize: 12, color: colors.onSurfaceVariant, lineHeight: 18, flex: 1 },
});
