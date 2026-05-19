import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Animated,
  Easing,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, typography, spacing, radii, type Colors } from '../../theme';
import { useAuthStore } from '../../store';
import { profileApi } from '../../api/profile';
import { authApi } from '../../api/auth';
import { useAlert } from '../../components/ThemedAlert';
import { KeyboardAwareScroll } from '../../components/KeyboardAwareScroll';

const PHONE_REGEX = /^(\+92[0-9]{10}|0[0-9]{10})$/;

/** Read a field from user data handling both camelCase and snake_case */
const field = (obj: any, camel: string, snake: string) =>
  obj?.[camel] ?? obj?.[snake] ?? '';

export function EditPlannerProfileScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { user, setUser } = useAuthStore();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const alert = useAlert();

  const [isLoading, setIsLoading] = useState(true);
  const [agencyName, setAgencyName] = useState('');
  const [agencyTagline, setAgencyTagline] = useState('');
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [yearsExperience, setYearsExperience] = useState('');
  const [guild, setGuild] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Social links
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [tiktokUrl, setTiktokUrl] = useState('');
  const [twitterUrl, setTwitterUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');

  // Cover photo
  const [coverPhotoUri, setCoverPhotoUri] = useState<string | null>(null);
  const [newCoverPhoto, setNewCoverPhoto] = useState<ImagePicker.ImagePickerAsset | null>(null);

  // Avatar
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [newAvatar, setNewAvatar] = useState<ImagePicker.ImagePickerAsset | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Fetch fresh user data on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await authApi.getCurrentUser();
        const u = res.data as any;
        setUser({ ...u, profileCompleted: u.profileCompleted ?? u.profile_completed ?? true } as any);
        populateFields(u);
      } catch {
        // Fall back to store data
        populateFields(user);
      } finally {
        setIsLoading(false);
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
      }
    })();
  }, []);

  const populateFields = (u: any) => {
    setAgencyName(field(u, 'agencyName', 'agency_name'));
    setAgencyTagline(field(u, 'agencyTagline', 'agency_tagline'));
    setBio(u?.bio ?? '');
    setPhone(u?.phone ?? '');
    setGuild(u?.guild ?? '');
    const ye = field(u, 'yearsExperience', 'years_experience');
    setYearsExperience(ye ? String(ye) : '');
    setAvatarUri(u?.avatar ?? null);
    setCoverPhotoUri(field(u, 'coverPhoto', 'cover_photo') || null);
    setYoutubeUrl(field(u, 'youtubeUrl', 'youtube_url'));
    setInstagramUrl(field(u, 'instagramUrl', 'instagram_url'));
    setTiktokUrl(field(u, 'tiktokUrl', 'tiktok_url'));
    setTwitterUrl(field(u, 'twitterUrl', 'twitter_url'));
    setWebsiteUrl(field(u, 'websiteUrl', 'website_url'));
  };

  const pickCoverPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert.show({ title: 'Permission Required', message: 'Please allow photo access to upload images.', type: 'error' });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setNewCoverPhoto(result.assets[0]);
      setCoverPhotoUri(result.assets[0].uri);
    }
  };

  const pickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert.show({ title: 'Permission Required', message: 'Please allow photo access to upload images.', type: 'error' });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setNewAvatar(result.assets[0]);
      setAvatarUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (phone.trim() && !PHONE_REGEX.test(phone.trim())) {
      setPhoneError('Enter a valid Pakistan phone number (e.g. +923001234567 or 03001234567)');
      return;
    }
    setPhoneError('');
    setIsSubmitting(true);
    try {
      const data: Record<string, unknown> = {
        agency_name: agencyName.trim(),
        agency_tagline: agencyTagline.trim(),
        bio: bio.trim(),
        guild: guild.trim(),
        phone: phone.trim(),
      };
      if (yearsExperience) data.years_experience = parseInt(yearsExperience, 10);
      data.youtube_url = youtubeUrl.trim() || null;
      data.instagram_url = instagramUrl.trim() || null;
      data.tiktok_url = tiktokUrl.trim() || null;
      data.twitter_url = twitterUrl.trim() || null;
      data.website_url = websiteUrl.trim() || null;

      await profileApi.updateProfile(data as any);

      // Upload new cover photo if changed
      if (newCoverPhoto) {
        const coverFormData = new FormData();
        coverFormData.append('cover_photo', {
          uri: newCoverPhoto.uri,
          type: newCoverPhoto.mimeType || 'image/jpeg',
          name: newCoverPhoto.fileName || 'cover_photo.jpg',
        } as any);
        await profileApi.uploadCoverPhoto(coverFormData);
      }

      // Upload new avatar if changed
      if (newAvatar) {
        const formData = new FormData();
        formData.append('avatar', {
          uri: newAvatar.uri,
          type: newAvatar.mimeType || 'image/jpeg',
          name: newAvatar.fileName || 'avatar.jpg',
        } as any);
        await profileApi.uploadAvatar(formData);
      }

      // Refresh user from backend to get all updated fields + avatar URL
      const res = await authApi.getCurrentUser();
      const fresh = res.data as any;
      setUser({ ...fresh, profileCompleted: fresh.profileCompleted ?? fresh.profile_completed ?? true } as any);

      alert.show({ title: 'Saved', message: 'Profile updated successfully', type: 'success' });
      navigation.goBack();
    } catch (error: any) {
      const msg = error?.response?.data?.error || 'Could not update profile';
      alert.show({ title: 'Error', message: msg, type: 'error' });
    } finally {
      setIsSubmitting(false);
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
        <KeyboardAwareScroll
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={22} color={colors.onSurface} />
            </Pressable>
            <Text style={styles.headerTitle}>Edit Profile</Text>
            <View style={{ width: 44 }} />
          </View>

          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
            {/* Cover Photo */}
            <Pressable onPress={pickCoverPhoto} style={styles.coverPhotoSection} android_ripple={null}>
              {coverPhotoUri ? (
                <Image source={{ uri: coverPhotoUri }} style={styles.coverPhotoImage} />
              ) : (
                <View style={styles.coverPhotoPlaceholder}>
                  <Ionicons name="image-outline" size={32} color={colors.outlineVariant} />
                  <Text style={styles.coverPhotoHint}>Add cover photo</Text>
                </View>
              )}
              <View style={styles.coverPhotoEditBadge}>
                <Ionicons name="camera" size={14} color={colors.onPrimary} />
              </View>
            </Pressable>

            {/* Avatar */}
            <Pressable onPress={pickAvatar} style={styles.avatarSection} android_ripple={null}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={40} color={colors.outlineVariant} />
                </View>
              )}
              <View style={styles.avatarEditBadge}>
                <Ionicons name="camera" size={14} color={colors.onPrimary} />
              </View>
            </Pressable>
            <Text style={styles.avatarHint}>Tap to change photo</Text>

            <Text style={styles.label}>Agency Name</Text>
            <TextInput style={styles.input} placeholder="Your agency name" placeholderTextColor={colors.outline} value={agencyName} onChangeText={setAgencyName} />

            <Text style={styles.label}>Tagline</Text>
            <TextInput style={styles.input} placeholder="A short tagline" placeholderTextColor={colors.outline} value={agencyTagline} onChangeText={setAgencyTagline} />

            <Text style={styles.label}>Guild</Text>
            <TextInput style={styles.input} placeholder="e.g. Northern Explorers" placeholderTextColor={colors.outline} value={guild} onChangeText={setGuild} />

            <Text style={styles.label}>Phone</Text>
            <TextInput style={styles.input} placeholder="+92 300 1234567" placeholderTextColor={colors.outline} value={phone} onChangeText={(text) => { setPhone(text); if (phoneError) setPhoneError(''); }} keyboardType="phone-pad" />
            {phoneError ? <Text style={styles.phoneError}>{phoneError}</Text> : null}

            <Text style={styles.label}>Years of Experience</Text>
            <TextInput style={styles.input} placeholder="e.g. 5" placeholderTextColor={colors.outline} value={yearsExperience} onChangeText={setYearsExperience} keyboardType="numeric" />

            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Tell travelers about your agency..."
              placeholderTextColor={colors.outline}
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <Text style={styles.sectionLabel}>Social Links</Text>

            <Text style={styles.label}>YouTube</Text>
            <TextInput style={styles.input} placeholder="https://youtube.com/@yourchannel" placeholderTextColor={colors.outline} value={youtubeUrl} onChangeText={setYoutubeUrl} autoCapitalize="none" keyboardType="url" />

            <Text style={styles.label}>Instagram</Text>
            <TextInput style={styles.input} placeholder="https://instagram.com/yourprofile" placeholderTextColor={colors.outline} value={instagramUrl} onChangeText={setInstagramUrl} autoCapitalize="none" keyboardType="url" />

            <Text style={styles.label}>TikTok</Text>
            <TextInput style={styles.input} placeholder="https://tiktok.com/@yourprofile" placeholderTextColor={colors.outline} value={tiktokUrl} onChangeText={setTiktokUrl} autoCapitalize="none" keyboardType="url" />

            <Text style={styles.label}>Twitter / X</Text>
            <TextInput style={styles.input} placeholder="https://x.com/yourhandle" placeholderTextColor={colors.outline} value={twitterUrl} onChangeText={setTwitterUrl} autoCapitalize="none" keyboardType="url" />

            <Text style={styles.label}>Website</Text>
            <TextInput style={styles.input} placeholder="https://youragency.com" placeholderTextColor={colors.outline} value={websiteUrl} onChangeText={setWebsiteUrl} autoCapitalize="none" keyboardType="url" />

            <Pressable onPress={handleSave} disabled={isSubmitting}>
              <LinearGradient
                colors={[colors.primary, colors.primaryContainer]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.submitButton, isSubmitting && { opacity: 0.6 }]}
              >
                <Text style={styles.submitText}>{isSubmitting ? 'Saving...' : 'Save Profile'}</Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </KeyboardAwareScroll>
    </View>
  );
}

const makeStyles = (colors: Colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  scrollContent: { paddingHorizontal: spacing.xl },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
    paddingTop: spacing.sm,
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
  coverPhotoSection: { marginBottom: spacing.xl, borderRadius: radii.lg, overflow: 'hidden' },
  coverPhotoImage: { width: '100%', height: 160, borderRadius: radii.lg },
  coverPhotoPlaceholder: {
    width: '100%',
    height: 160,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverPhotoHint: { ...typography.bodySm, color: colors.onSurfaceVariant, marginTop: spacing.xs },
  coverPhotoEditBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSection: { alignSelf: 'center', marginBottom: spacing.xs },
  avatarImage: { width: 100, height: 100, borderRadius: 50 },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.surface,
  },
  avatarHint: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
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
  textArea: { height: 120, paddingTop: spacing.md },
  sectionLabel: { fontFamily: 'Manrope_400Regular', fontSize: 18, color: colors.onSurface, marginTop: spacing['2xl'], marginBottom: spacing.xs },
  submitButton: {
    height: 56,
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing['2xl'],
  },
  submitText: { fontFamily: 'Inter_400Regular', fontSize: 16, color: colors.onPrimary, letterSpacing: 0.3 },
  phoneError: { fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.error, marginTop: spacing.xs },
});
