import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Animated, Easing, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, typography, spacing, radii } from '../../theme';
import { FormInput } from '../../components/FormInput';
import { useAuthStore } from '../../store';
import { authApi } from '../../api/auth';
import type { ProfileSetupStackParamList } from '../../types';

const PHONE_REGEX = /^(\+92[0-9]{10}|0[0-9]{10})$/;

type NavigationProp = NativeStackNavigationProp<ProfileSetupStackParamList, 'TravelerProfileSetup'>;

export function TravelerProfileSetupScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { setProfileCompleted, setUser } = useAuthStore();
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, []);

  // Listen for focus to detect return from OTP screen and complete profile
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', async () => {
      if (phoneVerified) {
        // OTP controller already updated phone + phone_verified on the backend
        // Refresh user data so avatar/phone are available in the store
        try {
          const res = await authApi.getCurrentUser();
          setUser({ ...res.data, profileCompleted: true });
        } catch {}
        setProfileCompleted(true);
      }
    });
    return unsubscribe;
  }, [navigation, phoneVerified]);

  const [isSaving, setIsSaving] = useState(false);
  const canComplete = phone.trim().length > 0;

  const handleComplete = () => {
    if (!PHONE_REGEX.test(phone.trim())) {
      setPhoneError('Enter a valid Pakistan phone number (e.g. +923001234567 or 03001234567)');
      return;
    }
    setPhoneError('');
    setPhoneVerified(true);
    navigation.navigate('OtpVerification', { phoneNumber: phone.trim() });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
          <Text style={styles.title}>Complete Profile</Text>
          <Text style={styles.subtitle}>Add your phone number to get started</Text>

          <View style={styles.iconContainer}>
            <Ionicons name="person-circle-outline" size={80} color={colors.primary} />
          </View>

          <FormInput label="Phone Number" icon="call-outline" value={phone} onChangeText={(text: string) => { setPhone(text); if (phoneError) setPhoneError(''); }} placeholder="+92 300 1234567" keyboardType="phone-pad" />
          {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}

          <View style={styles.tipCard}>
            <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
            <Text style={styles.tipText}>Your phone number helps planners reach you for trip coordination. You can add an avatar later from your profile.</Text>
          </View>
        </Animated.View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
        <Pressable onPress={handleComplete} disabled={!canComplete || isSaving} style={styles.button}>
          <LinearGradient
            colors={['#0058bc', '#0070eb']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.gradient, (!canComplete || isSaving) && { opacity: 0.5 }]}
          >
            <Text style={styles.buttonText}>{isSaving ? 'Saving...' : 'Get Started'}</Text>
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
  iconContainer: { alignItems: 'center', marginBottom: spacing['2xl'] },
  tipCard: { flexDirection: 'row', gap: spacing.md, backgroundColor: 'rgba(0,88,188,0.04)', borderRadius: radii.xl, padding: spacing.lg, marginTop: spacing.lg },
  tipText: { ...typography.bodySm, color: colors.onSurfaceVariant, flex: 1 },
  errorText: { ...typography.bodySm, color: colors.error, marginTop: spacing.xs },
  footer: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg },
  button: { width: '100%' },
  gradient: { height: 56, borderRadius: radii.xl, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontFamily: 'Inter_400Regular', fontSize: 15, color: '#fff' },
});
