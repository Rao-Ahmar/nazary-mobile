import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, typography, spacing, radii, type Colors } from '../../theme';
import { bookingsApi } from '../../api/bookings';

export function SubmitPaymentProofScreen({ navigation, route }: any) {
  const { colors, shadows } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const bookingId = route?.params?.bookingId;
  const bookingAmount = route?.params?.amount;

  const [referenceNumber, setReferenceNumber] = useState('');
  const [amount, setAmount] = useState(bookingAmount?.toString() || '');
  const [methodUsed, setMethodUsed] = useState('');
  const [screenshot, setScreenshot] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setScreenshot(result.assets[0]);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission is required');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setScreenshot(result.assets[0]);
    }
  };

  const handleSubmit = async () => {
    if (!referenceNumber.trim()) {
      Alert.alert('Error', 'Please enter the reference/transaction number');
      return;
    }
    if (!amount.trim()) {
      Alert.alert('Error', 'Please enter the amount paid');
      return;
    }
    if (!methodUsed.trim()) {
      Alert.alert('Error', 'Please enter the payment method used');
      return;
    }
    if (!screenshot) {
      Alert.alert('Error', 'Please attach a screenshot of the payment');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('reference_number', referenceNumber.trim());
      formData.append('amount', amount.trim());
      formData.append('method_used', methodUsed.trim());

      const uri = screenshot.uri;
      const filename = uri.split('/').pop() || 'screenshot.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const fileType = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('screenshot', {
        uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
        name: filename,
        type: fileType,
      } as any);

      await bookingsApi.submitPaymentProof(bookingId, formData);
      Alert.alert('Success', 'Payment proof submitted! We will verify it shortly.', [
        { text: 'OK', onPress: () => navigation.popToTop() },
      ]);
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Could not submit payment proof';
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const methods = ['JazzCash', 'Easypaisa', 'Bank Transfer'];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.onSurface} />
        </Pressable>
        <Text style={styles.headerTitle}>Submit Payment Proof</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Screenshot */}
        <Text style={styles.fieldLabel}>Payment Screenshot</Text>
        {screenshot ? (
          <View style={styles.screenshotContainer}>
            <Image source={{ uri: screenshot.uri }} style={styles.screenshotImage} />
            <Pressable
              onPress={() => setScreenshot(null)}
              style={styles.removeScreenshotBtn}
            >
              <Ionicons name="close-circle" size={24} color={colors.error} />
            </Pressable>
          </View>
        ) : (
          <View style={styles.imagePickerRow}>
            <Pressable onPress={pickImage} style={[styles.imagePickerBtn, shadows.soft]}>
              <Ionicons name="images-outline" size={24} color={colors.primary} />
              <Text style={styles.imagePickerText}>Gallery</Text>
            </Pressable>
            <Pressable onPress={takePhoto} style={[styles.imagePickerBtn, shadows.soft]}>
              <Ionicons name="camera-outline" size={24} color={colors.primary} />
              <Text style={styles.imagePickerText}>Camera</Text>
            </Pressable>
          </View>
        )}

        {/* Reference Number */}
        <Text style={styles.fieldLabel}>Reference / Transaction Number</Text>
        <TextInput
          value={referenceNumber}
          onChangeText={setReferenceNumber}
          placeholder="e.g. TXN123456789"
          placeholderTextColor={colors.outlineVariant}
          style={styles.input}
        />

        {/* Amount */}
        <Text style={styles.fieldLabel}>Amount Paid (PKR)</Text>
        <TextInput
          value={amount}
          onChangeText={setAmount}
          placeholder="e.g. 45000"
          placeholderTextColor={colors.outlineVariant}
          keyboardType="numeric"
          style={styles.input}
        />

        {/* Method Used */}
        <Text style={styles.fieldLabel}>Payment Method</Text>
        <View style={styles.methodRow}>
          {methods.map((m) => (
            <Pressable
              key={m}
              onPress={() => setMethodUsed(m)}
              android_ripple={null}
              style={[
                styles.methodChip,
                methodUsed === m && { backgroundColor: colors.primaryTint, borderColor: colors.primary },
              ]}
            >
              <Text
                style={[
                  styles.methodChipText,
                  methodUsed === m && { color: colors.primary },
                ]}
              >
                {m}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable
          onPress={handleSubmit}
          disabled={submitting}
          style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="send-outline" size={18} color="#fff" />
              <Text style={styles.submitBtnText}>Submit Proof</Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.surface },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surfaceContainerLow,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontFamily: 'Manrope_400Regular',
      fontSize: 18,
      color: colors.onSurface,
    },
    scrollContent: {
      padding: spacing.xl,
      paddingBottom: 120,
    },
    fieldLabel: {
      fontFamily: 'Inter_400Regular',
      fontSize: 14,
      color: colors.onSurface,
      marginBottom: spacing.sm,
      marginTop: spacing.lg,
    },
    input: {
      backgroundColor: colors.surfaceContainerLowest,
      borderRadius: radii.lg,
      paddingHorizontal: spacing.lg,
      paddingVertical: 14,
      fontFamily: 'Inter_400Regular',
      fontSize: 15,
      color: colors.onSurface,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    imagePickerRow: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    imagePickerBtn: {
      flex: 1,
      backgroundColor: colors.surfaceContainerLowest,
      borderRadius: radii.xl,
      padding: spacing.xl,
      alignItems: 'center',
      gap: spacing.sm,
    },
    imagePickerText: {
      ...typography.bodySm,
      color: colors.primary,
    },
    screenshotContainer: {
      position: 'relative',
    },
    screenshotImage: {
      width: '100%',
      height: 200,
      borderRadius: radii.xl,
      resizeMode: 'contain',
      backgroundColor: colors.surfaceContainerLowest,
    },
    removeScreenshotBtn: {
      position: 'absolute',
      top: 8,
      right: 8,
    },
    methodRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      flexWrap: 'wrap',
    },
    methodChip: {
      paddingHorizontal: spacing.lg,
      paddingVertical: 10,
      borderRadius: radii.full,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      backgroundColor: colors.surfaceContainerLowest,
    },
    methodChipText: {
      fontFamily: 'Inter_400Regular',
      fontSize: 13,
      color: colors.onSurfaceVariant,
    },
    bottomBar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.lg,
      backgroundColor: colors.surface,
      borderTopWidth: 0.5,
      borderTopColor: colors.borderSubtle,
    },
    submitBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      backgroundColor: colors.primary,
      borderRadius: radii.xl,
      paddingVertical: 16,
    },
    submitBtnText: {
      fontFamily: 'Inter_400Regular',
      fontSize: 15,
      color: '#fff',
      letterSpacing: 0.3,
    },
  });
