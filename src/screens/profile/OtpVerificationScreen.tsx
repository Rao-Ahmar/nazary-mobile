import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, typography, spacing, radii } from '../../theme';
import { otpApi } from '../../api/otp';
import type { ProfileSetupStackParamList } from '../../types';

type OtpVerificationRouteProp = RouteProp<ProfileSetupStackParamList, 'OtpVerification'>;
type OtpVerificationNavProp = NativeStackNavigationProp<ProfileSetupStackParamList, 'OtpVerification'>;

const CODE_LENGTH = 6;
const RESEND_COOLDOWN = 60;

export function OtpVerificationScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<OtpVerificationNavProp>();
  const route = useRoute<OtpVerificationRouteProp>();
  const { phoneNumber } = route.params;

  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef<(TextInput | null)[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start countdown timer
  const startCountdown = useCallback(() => {
    setCountdown(RESEND_COOLDOWN);
    setCanResend(false);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // Send OTP on mount
  useEffect(() => {
    sendOtp();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const sendOtp = async () => {
    setIsSending(true);
    setError('');
    try {
      await otpApi.sendCode(phoneNumber);
      startCountdown();
    } catch {
      setError('Failed to send OTP. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleResend = () => {
    if (!canResend) return;
    setDigits(Array(CODE_LENGTH).fill(''));
    setError('');
    setSuccess(false);
    inputRefs.current[0]?.focus();
    sendOtp();
  };

  const verifyOtp = async (code: string) => {
    Keyboard.dismiss();
    setIsVerifying(true);
    setError('');
    try {
      const response = await otpApi.verify(phoneNumber, code);
      if (response.data.verified) {
        setSuccess(true);
        setTimeout(() => {
          navigation.goBack();
        }, 800);
      } else {
        setError('Invalid or expired OTP code.');
        setDigits(Array(CODE_LENGTH).fill(''));
        inputRefs.current[0]?.focus();
      }
    } catch {
      setError('Invalid or expired OTP code.');
      setDigits(Array(CODE_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDigitChange = (text: string, index: number) => {
    // Only accept numeric input
    const digit = text.replace(/[^0-9]/g, '');
    if (digit.length > 1) {
      // Handle paste: distribute digits across inputs
      const pastedDigits = digit.split('').slice(0, CODE_LENGTH);
      const newDigits = [...digits];
      pastedDigits.forEach((d, i) => {
        if (index + i < CODE_LENGTH) {
          newDigits[index + i] = d;
        }
      });
      setDigits(newDigits);
      const nextIndex = Math.min(index + pastedDigits.length, CODE_LENGTH - 1);
      inputRefs.current[nextIndex]?.focus();

      // Check if all digits are filled
      const fullCode = newDigits.join('');
      if (fullCode.length === CODE_LENGTH) {
        verifyOtp(fullCode);
      }
      return;
    }

    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);

    if (digit && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits are filled
    const fullCode = newDigits.join('');
    if (fullCode.length === CODE_LENGTH) {
      verifyOtp(fullCode);
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      const newDigits = [...digits];
      newDigits[index - 1] = '';
      setDigits(newDigits);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.onSurface} />
        </Pressable>
      </View>

      <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Ionicons
              name={success ? 'checkmark-circle' : 'shield-checkmark-outline'}
              size={48}
              color={success ? colors.success : colors.primary}
            />
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>Verify Phone Number</Text>
        <Text style={styles.subtitle}>
          Enter the 6-digit code sent to{'\n'}
          <Text style={styles.phoneText}>{phoneNumber}</Text>
        </Text>

        {/* OTP Input */}
        <View style={styles.otpContainer}>
          {digits.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => {
                inputRefs.current[index] = ref;
              }}
              style={[
                styles.otpInput,
                digit ? styles.otpInputFilled : null,
                error ? styles.otpInputError : null,
                success ? styles.otpInputSuccess : null,
              ]}
              value={digit}
              onChangeText={(text) => handleDigitChange(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={index === 0 ? CODE_LENGTH : 1}
              selectTextOnFocus
              editable={!isVerifying && !success}
              autoFocus={index === 0}
            />
          ))}
        </View>

        {/* Status Messages */}
        {isVerifying && (
          <View style={styles.statusRow}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.statusText}>Verifying...</Text>
          </View>
        )}
        {isSending && !isVerifying && (
          <View style={styles.statusRow}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.statusText}>Sending code...</Text>
          </View>
        )}
        {error ? (
          <View style={styles.errorRow}>
            <Ionicons name="alert-circle" size={16} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
        {success && (
          <View style={styles.successRow}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <Text style={styles.successText}>Phone number verified successfully!</Text>
          </View>
        )}

        {/* Resend */}
        <View style={styles.resendContainer}>
          {canResend ? (
            <Pressable onPress={handleResend} style={styles.resendButton}>
              <Ionicons name="refresh-outline" size={18} color={colors.primary} />
              <Text style={styles.resendActiveText}>Resend Code</Text>
            </Pressable>
          ) : (
            <Text style={styles.resendText}>
              Resend code in <Text style={styles.countdownText}>{formatCountdown(countdown)}</Text>
            </Text>
          )}
        </View>

        {/* Info */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
          <Text style={styles.infoText}>
            Check your phone for the verification code. The code expires in 5 minutes.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: radii.full,
    backgroundColor: 'rgba(0,88,188,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'Manrope_300Light',
    fontSize: 28,
    color: colors.onSurface,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing['2xl'],
  },
  phoneText: {
    fontFamily: 'Inter_400Regular',
    color: colors.onSurface,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceContainerLow,
    textAlign: 'center',
    fontSize: 22,
    fontFamily: 'Inter_400Regular',
    color: colors.onSurface,
  },
  otpInputFilled: {
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  otpInputError: {
    borderWidth: 1.5,
    borderColor: colors.error,
  },
  otpInputSuccess: {
    borderWidth: 1.5,
    borderColor: colors.success,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statusText: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  errorText: {
    ...typography.bodySm,
    color: colors.error,
  },
  successRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  successText: {
    ...typography.bodySm,
    color: colors.success,
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  resendActiveText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: colors.primary,
  },
  resendText: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
  },
  countdownText: {
    fontFamily: 'Inter_400Regular',
    color: colors.primary,
  },
  infoCard: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: 'rgba(0,88,188,0.04)',
    borderRadius: radii.xl,
    padding: spacing.lg,
  },
  infoText: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    flex: 1,
  },
});
