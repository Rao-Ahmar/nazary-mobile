import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, typography, spacing, radii, type Colors } from '../../theme';
import { bookingsApi } from '../../api/bookings';

const WHATSAPP_NUMBER = '923001234567'; // Change to your actual WhatsApp number
const CONTACT_EMAIL = 'payments@nazary.pk'; // Change to your actual email

const METHOD_ICONS: Record<string, string> = {
  jazzcash: 'phone-portrait-outline',
  easypaisa: 'phone-portrait-outline',
  bank_transfer: 'business-outline',
};

const METHOD_LABELS: Record<string, string> = {
  jazzcash: 'JazzCash',
  easypaisa: 'Easypaisa',
  bank_transfer: 'Bank Transfer',
};

export function PaymentInfoScreen({ navigation, route }: any) {
  const { colors, shadows } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const bookingId = route?.params?.bookingId;

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);

  useEffect(() => {
    if (!bookingId) return;
    bookingsApi
      .getPaymentInfo(bookingId)
      .then((res) => {
        setBooking(res.data.booking);
        setAccounts(res.data.payment_accounts);
      })
      .catch(() => Alert.alert('Error', 'Could not load payment info'))
      .finally(() => setLoading(false));
  }, [bookingId]);

  const copyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert('Copied', 'Account number copied to clipboard');
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.onSurface} />
        </Pressable>
        <Text style={styles.headerTitle}>Payment Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Amount Card */}
        <View style={[styles.amountCard, shadows.soft]}>
          <Text style={styles.amountLabel}>Advance Booking Fee</Text>
          <Text style={styles.amountValue}>
            PKR {(booking?.amount ?? 0).toLocaleString()}
          </Text>
        </View>

        {/* Instructions */}
        <View style={styles.instructionCard}>
          <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
          <Text style={styles.instructionText}>
            Send the advance booking fee to any of the accounts below, then share the payment screenshot with us on WhatsApp or email.
          </Text>
        </View>

        {/* Payment Accounts */}
        <Text style={styles.sectionTitle}>Payment Methods</Text>
        {accounts.map((account) => (
          <View key={account.id} style={[styles.accountCard, shadows.soft]}>
            <View style={styles.accountHeader}>
              <View style={styles.accountIconWrap}>
                <Ionicons
                  name={(METHOD_ICONS[account.method_type] || 'card-outline') as any}
                  size={20}
                  color={colors.primary}
                />
              </View>
              <Text style={styles.accountMethodLabel}>
                {METHOD_LABELS[account.method_type] || account.method_type}
              </Text>
            </View>

            <View style={styles.accountRow}>
              <Text style={styles.accountFieldLabel}>Account Title</Text>
              <Text style={styles.accountFieldValue}>{account.account_title}</Text>
            </View>

            <View style={styles.accountRow}>
              <Text style={styles.accountFieldLabel}>Account Number</Text>
              <View style={styles.copyRow}>
                <Text style={styles.accountFieldValue}>{account.account_number}</Text>
                <Pressable
                  onPress={() => copyToClipboard(account.account_number)}
                  style={styles.copyBtn}
                >
                  <Ionicons name="copy-outline" size={16} color={colors.primary} />
                </Pressable>
              </View>
            </View>

            {account.bank_name && (
              <View style={styles.accountRow}>
                <Text style={styles.accountFieldLabel}>Bank</Text>
                <Text style={styles.accountFieldValue}>{account.bank_name}</Text>
              </View>
            )}
          </View>
        ))}

        {accounts.length === 0 && (
          <View style={styles.emptyCard}>
            <Ionicons name="alert-circle-outline" size={32} color={colors.outlineVariant} />
            <Text style={styles.emptyText}>No payment methods configured</Text>
          </View>
        )}

        {/* Share Screenshot Section */}
        <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>Share Payment Screenshot</Text>

        <Pressable
          onPress={() => Linking.openURL(`https://wa.me/${WHATSAPP_NUMBER}?text=Hi, I just paid the advance booking fee for my trip booking.`)}
          style={[styles.contactCard, shadows.soft]}
        >
          <View style={[styles.contactIconWrap, { backgroundColor: '#25D36620' }]}>
            <Ionicons name="logo-whatsapp" size={22} color="#25D366" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.contactLabel}>WhatsApp</Text>
            <Text style={styles.contactValue}>+{WHATSAPP_NUMBER}</Text>
          </View>
          <Ionicons name="open-outline" size={18} color={colors.onSurfaceVariant} />
        </Pressable>

        <Pressable
          onPress={() => Linking.openURL(`mailto:${CONTACT_EMAIL}?subject=Payment Screenshot - Booking&body=Hi, I have attached the payment screenshot for my booking.`)}
          style={[styles.contactCard, shadows.soft]}
        >
          <View style={[styles.contactIconWrap, { backgroundColor: colors.primaryTint }]}>
            <Ionicons name="mail-outline" size={22} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.contactLabel}>Email</Text>
            <Text style={styles.contactValue}>{CONTACT_EMAIL}</Text>
          </View>
          <Ionicons name="open-outline" size={18} color={colors.onSurfaceVariant} />
        </Pressable>

        <View style={{ height: insets.bottom + 20 }} />
      </ScrollView>
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
    },
    amountCard: {
      backgroundColor: colors.primaryTint,
      borderRadius: radii.xl,
      padding: spacing.xl,
      alignItems: 'center',
      marginBottom: spacing.xl,
    },
    amountLabel: {
      ...typography.bodySm,
      color: colors.primary,
      marginBottom: spacing.xs,
    },
    amountValue: {
      fontFamily: 'Manrope_400Regular',
      fontSize: 32,
      color: colors.primary,
    },
    instructionCard: {
      flexDirection: 'row',
      gap: spacing.sm,
      backgroundColor: colors.surfaceContainerLowest,
      borderRadius: radii.lg,
      padding: spacing.lg,
      marginBottom: spacing.xl,
    },
    instructionText: {
      ...typography.bodySm,
      color: colors.onSurfaceVariant,
      flex: 1,
      lineHeight: 20,
    },
    sectionTitle: {
      fontFamily: 'Manrope_400Regular',
      fontSize: 18,
      color: colors.onSurface,
      marginBottom: spacing.lg,
    },
    accountCard: {
      backgroundColor: colors.surfaceContainerLowest,
      borderRadius: radii.xl,
      padding: spacing.xl,
      marginBottom: spacing.md,
    },
    accountHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      marginBottom: spacing.lg,
    },
    accountIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primaryTint,
      alignItems: 'center',
      justifyContent: 'center',
    },
    accountMethodLabel: {
      fontFamily: 'Manrope_400Regular',
      fontSize: 16,
      color: colors.onSurface,
    },
    accountRow: {
      marginBottom: spacing.md,
    },
    accountFieldLabel: {
      ...typography.bodySm,
      color: colors.onSurfaceVariant,
      marginBottom: 2,
    },
    accountFieldValue: {
      fontFamily: 'Inter_400Regular',
      fontSize: 15,
      color: colors.onSurface,
    },
    copyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    copyBtn: {
      padding: spacing.sm,
    },
    emptyCard: {
      alignItems: 'center',
      padding: spacing.xl,
      gap: spacing.md,
    },
    emptyText: {
      ...typography.bodyMd,
      color: colors.onSurfaceVariant,
    },
    contactCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: colors.surfaceContainerLowest,
      borderRadius: radii.xl,
      padding: spacing.lg,
      marginBottom: spacing.md,
    },
    contactIconWrap: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
    contactLabel: {
      fontFamily: 'Manrope_400Regular',
      fontSize: 15,
      color: colors.onSurface,
    },
    contactValue: {
      ...typography.bodySm,
      color: colors.onSurfaceVariant,
      marginTop: 2,
    },
  });
