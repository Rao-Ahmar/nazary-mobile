import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, typography, spacing, radii } from '../../theme';
import { type Colors } from '../../theme';
import { DatePickerModal } from '../../components/DatePickerModal';
import { tripsApi } from '../../api/trips';
import { itineraryPresetsApi } from '../../api/itineraryPresets';
import { ItineraryPreset } from '../../types/models';
import { useAlert } from '../../components/ThemedAlert';

const TAG_OPTIONS = ['Adventure', 'Cultural', 'Wellness', 'Photography', 'Bike', 'Family', 'Luxury', 'Budget'];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const TRIP_TYPE_OPTIONS: { label: string; value: string; premium: boolean }[] = [
  { label: 'Casual', value: 'casual', premium: false },
  { label: 'Family', value: 'family', premium: false },
  { label: 'Bike Trip', value: 'bike_trip', premium: true },
  { label: 'Couple Trip', value: 'couple_trip', premium: true },
];

interface ItineraryDay {
  day: string;
  title: string;
  desc: string;
}

export function CreateTripScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const editTripId = route?.params?.tripId;
  const alert = useAlert();

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [location, setLocation] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startDateObj, setStartDateObj] = useState<Date | null>(null);
  const [endDateObj, setEndDateObj] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [totalSeats, setTotalSeats] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedTripType, setSelectedTripType] = useState('casual');
  const [highlights, setHighlights] = useState('');

  // Images
  const [heroImage, setHeroImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [galleryImages, setGalleryImages] = useState<ImagePicker.ImagePickerAsset[]>([]);

  // Itinerary
  const [itineraryDays, setItineraryDays] = useState<ItineraryDay[]>([
    { day: '1', title: '', desc: '' },
  ]);

  // Presets
  const [presets, setPresets] = useState<ItineraryPreset[]>([]);
  const [showPresetPicker, setShowPresetPicker] = useState(false);
  const [saveAsPreset, setSaveAsPreset] = useState(false);
  const [presetName, setPresetName] = useState('');

  // Recurring
  const [recurringEnabled, setRecurringEnabled] = useState(false);
  const [recurringDay, setRecurringDay] = useState(5); // Friday
  const [recurringHour, setRecurringHour] = useState(22); // 10pm

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingTrip, setIsLoadingTrip] = useState(!!editTripId);
  // Track existing remote images (already uploaded)
  const [existingHeroImage, setExistingHeroImage] = useState<string | null>(null);
  const [existingGalleryImages, setExistingGalleryImages] = useState<string[]>([]);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, []);

  // Fetch itinerary presets
  useEffect(() => {
    const loadPresets = async () => {
      try {
        const res = await itineraryPresetsApi.getAll();
        const list = (res.data as any)?.data ?? res.data;
        if (Array.isArray(list)) setPresets(list);
      } catch {}
    };
    loadPresets();
  }, []);

  // Load existing trip data when editing
  useEffect(() => {
    if (!editTripId) return;
    const loadTrip = async () => {
      try {
        const response = await tripsApi.getById(editTripId);
        const t = (response.data as any)?.data ?? response.data;

        setTitle(t.title || '');
        setSubtitle(t.subtitle || '');
        setLocation(t.location || '');
        setPrice(t.price != null ? String(t.price) : '');
        setDuration(t.duration || '');
        setTotalSeats(t.totalSeats ?? t.total_seats ? String(t.totalSeats ?? t.total_seats) : '');
        setSelectedTags(t.tags || []);
        const tt = t.tripType || t.trip_type;
        if (tt) setSelectedTripType(tt);
        setHighlights((t.highlights || []).join('\n'));

        // Dates
        const sd = t.startDate || t.start_date;
        const ed = t.endDate || t.end_date;
        if (sd) {
          const sdDate = new Date(sd);
          const today = new Date(new Date().toDateString());
          if (sdDate < today) {
            alert.show({ title: 'Cannot Edit', message: 'This trip cannot be edited because its start date has passed.', type: 'error', buttons: [
              { text: 'OK', onPress: () => navigation.goBack() },
            ] });
            return;
          }
          setStartDate(sd);
          setStartDateObj(sdDate);
        }
        if (ed) {
          setEndDate(ed);
          setEndDateObj(new Date(ed));
        }

        // Recurring
        const re = t.recurringEnabled ?? t.recurring_enabled;
        if (re) setRecurringEnabled(true);
        const rr = t.recurringRule ?? t.recurring_rule;
        if (rr) {
          if (rr.day_of_week != null) setRecurringDay(rr.day_of_week);
          if (rr.hour != null) setRecurringHour(rr.hour);
        }

        // Itinerary
        const itin = t.itinerary || [];
        if (itin.length > 0) {
          setItineraryDays(itin.map((d: any) => ({
            day: String(d.day),
            title: d.title || '',
            desc: d.desc || '',
          })));
        }

        // Existing images (remote URLs, not local picks)
        const hero = t.heroImage || t.hero_image;
        if (hero) setExistingHeroImage(hero);
        const gallery = t.gallery || [];
        if (gallery.length > 0) setExistingGalleryImages(gallery);
      } catch {
        alert.show({ title: 'Error', message: 'Could not load trip data.', type: 'error' });
      } finally {
        setIsLoadingTrip(false);
      }
    };
    loadTrip();
  }, [editTripId]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  // Image pickers
  const pickHeroImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setHeroImage(result.assets[0]);
    }
  };

  const pickGalleryImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 10,
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) {
      setGalleryImages((prev) => [...prev, ...result.assets]);
    }
  };

  const removeGalleryImage = (index: number) => {
    setGalleryImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Itinerary helpers
  const addItineraryDay = () => {
    setItineraryDays((prev) => [
      ...prev,
      { day: String(prev.length + 1), title: '', desc: '' },
    ]);
  };

  const removeItineraryDay = (index: number) => {
    setItineraryDays((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      return updated.map((d, i) => ({ ...d, day: String(i + 1) }));
    });
  };

  const updateItineraryDay = (index: number, field: keyof ItineraryDay, value: string) => {
    setItineraryDays((prev) =>
      prev.map((d, i) => (i === index ? { ...d, [field]: value } : d)),
    );
  };

  const loadPreset = (preset: ItineraryPreset) => {
    setItineraryDays(
      preset.days.map((d) => ({
        day: String(d.day),
        title: d.title || '',
        desc: d.desc || '',
      })),
    );
    setShowPresetPicker(false);
  };

  const deletePreset = async (id: string) => {
    try {
      await itineraryPresetsApi.destroy(id);
      setPresets((prev) => prev.filter((p) => p.id !== id));
    } catch {
      alert.show({ title: 'Error', message: 'Could not delete preset.', type: 'error' });
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !location.trim() || !price || !startDate || !endDate || !totalSeats) {
      alert.show({ title: 'Missing Fields', message: 'Please fill in all required fields.', type: 'warning' });
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (startDateObj && startDateObj < today) {
      alert.show({ title: 'Invalid Date', message: 'Start date cannot be in the past.', type: 'warning' });
      return;
    }
    if (startDateObj && endDateObj && endDateObj <= startDateObj) {
      alert.show({ title: 'Invalid Date', message: 'End date must be after the start date.', type: 'warning' });
      return;
    }

    // Validate itinerary
    const validDays = itineraryDays.filter((d) => d.title.trim());
    if (validDays.length === 0) {
      alert.show({ title: 'Missing Itinerary', message: 'Please add at least one itinerary day.', type: 'warning' });
      return;
    }

    setIsSubmitting(true);
    try {
      const data: Record<string, unknown> = {
        title: title.trim(),
        subtitle: subtitle.trim() || undefined,
        description: validDays.map((d) => `Day ${d.day}: ${d.title}`).join('. '),
        location: location.trim(),
        price: parseFloat(price),
        currency: 'PKR',
        duration: duration.trim() || `${Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000)} days`,
        start_date: startDate,
        end_date: endDate,
        total_seats: parseInt(totalSeats, 10),
        trip_type: selectedTripType,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        highlights: highlights.trim() ? highlights.split('\n').filter(Boolean) : undefined,
        itinerary_days: validDays.map((d) => ({
          day: parseInt(d.day, 10),
          title: d.title.trim(),
          desc: d.desc.trim(),
        })),
        recurring_enabled: recurringEnabled,
        recurring_rule: recurringEnabled ? { day_of_week: recurringDay, hour: recurringHour } : undefined,
      };

      let tripResponse: any;
      if (editTripId) {
        tripResponse = await tripsApi.update(editTripId, data);
      } else {
        tripResponse = await tripsApi.create(data as any);
      }

      const createdTrip = (tripResponse.data as any)?.data ?? tripResponse.data;
      const tripId = createdTrip?.id || editTripId;

      // Upload hero image
      if (heroImage && tripId) {
        const heroFormData = new FormData();
        heroFormData.append('hero_image', {
          uri: heroImage.uri,
          type: heroImage.mimeType || 'image/jpeg',
          name: heroImage.fileName || 'hero.jpg',
        } as any);
        await tripsApi.uploadHeroImage(tripId, heroFormData);
      }

      // Upload gallery images
      if (galleryImages.length > 0 && tripId) {
        const galleryFormData = new FormData();
        galleryImages.forEach((img, i) => {
          galleryFormData.append('gallery[]', {
            uri: img.uri,
            type: img.mimeType || 'image/jpeg',
            name: img.fileName || `gallery_${i}.jpg`,
          } as any);
        });
        await tripsApi.uploadGallery(tripId, galleryFormData);
      }

      // Save itinerary as preset if requested
      if (saveAsPreset && presetName.trim()) {
        try {
          await itineraryPresetsApi.create({
            name: presetName.trim(),
            days: validDays.map((d) => ({
              day: parseInt(d.day, 10),
              title: d.title.trim(),
              desc: d.desc.trim(),
            })),
          });
        } catch (presetErr: any) {
          const presetMsg = presetErr?.response?.data?.error || 'Could not save preset';
          alert.show({ title: 'Preset Error', message: presetMsg, type: 'error' });
        }
      }

      alert.show({ title: 'Success', message: editTripId ? 'Trip updated successfully' : 'Trip created as draft. Publish it when ready!', type: 'success' });
      navigation.goBack();
    } catch (error: any) {
      const msg = error?.response?.data?.error || 'Something went wrong';
      if (msg.toLowerCase().includes('profile photo')) {
        alert.show({
          title: 'Profile Photo Required',
          message: 'You need to upload a profile photo before creating trips. Go to your profile to add one.',
          type: 'warning',
          buttons: [
            { text: 'Later', style: 'cancel' },
            { text: 'Go to Profile', onPress: () => navigation.navigate('EditPlannerProfile') },
          ],
        });
      } else {
        alert.show({ title: 'Error', message: msg, type: 'error' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={22} color={colors.onSurface} />
            </Pressable>
            <Text style={styles.headerTitle}>{editTripId ? 'Edit Trip' : 'Create Trip'}</Text>
            <View style={{ width: 44 }} />
          </View>

          {isLoadingTrip ? (
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={{ ...typography.bodyMd, color: colors.onSurfaceVariant, marginTop: spacing.lg }}>Loading trip data...</Text>
            </View>
          ) : (
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>

            {/* Hero Image */}
            <Text style={styles.label}>Hero Image</Text>
            <Pressable style={styles.heroImagePicker} onPress={pickHeroImage}>
              {heroImage ? (
                <Image source={{ uri: heroImage.uri }} style={styles.heroImagePreview} />
              ) : existingHeroImage ? (
                <Image source={{ uri: existingHeroImage }} style={styles.heroImagePreview} />
              ) : (
                <View style={styles.heroImagePlaceholder}>
                  <Ionicons name="camera-outline" size={28} color={colors.outlineVariant} />
                  <Text style={styles.imagePlaceholderText}>Tap to add cover photo</Text>
                </View>
              )}
            </Pressable>

            {/* Gallery */}
            <Text style={styles.label}>Gallery</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryPicker}>
              <Pressable style={styles.galleryAddButton} onPress={pickGalleryImages}>
                <Ionicons name="add" size={24} color={colors.primary} />
                <Text style={styles.galleryAddText}>Add</Text>
              </Pressable>
              {existingGalleryImages.map((uri, index) => (
                <View key={`existing-${index}`} style={styles.galleryThumbWrap}>
                  <Image source={{ uri }} style={styles.galleryThumb} />
                </View>
              ))}
              {galleryImages.map((img, index) => (
                <View key={`new-${index}`} style={styles.galleryThumbWrap}>
                  <Image source={{ uri: img.uri }} style={styles.galleryThumb} />
                  <Pressable style={styles.galleryRemove} onPress={() => removeGalleryImage(index)}>
                    <Ionicons name="close" size={12} color={colors.onPrimary} />
                  </Pressable>
                </View>
              ))}
            </ScrollView>

            {/* Title */}
            <Text style={styles.label}>Title *</Text>
            <TextInput style={styles.input} placeholder="e.g. Hunza Valley Expedition" placeholderTextColor={colors.outline} value={title} onChangeText={setTitle} />

            {/* Subtitle */}
            <Text style={styles.label}>Subtitle</Text>
            <TextInput style={styles.input} placeholder="A brief tagline" placeholderTextColor={colors.outline} value={subtitle} onChangeText={setSubtitle} />

            {/* Location */}
            <Text style={styles.label}>Location *</Text>
            <TextInput style={styles.input} placeholder="e.g. Hunza, Gilgit-Baltistan" placeholderTextColor={colors.outline} value={location} onChangeText={setLocation} />

            {/* Price & Seats */}
            <View style={styles.row}>
              <View style={styles.halfField}>
                <Text style={styles.label}>Price (PKR) *</Text>
                <TextInput style={styles.input} placeholder="25000" placeholderTextColor={colors.outline} value={price} onChangeText={setPrice} keyboardType="numeric" />
              </View>
              <View style={styles.halfField}>
                <Text style={styles.label}>Total Seats *</Text>
                <TextInput style={styles.input} placeholder="15" placeholderTextColor={colors.outline} value={totalSeats} onChangeText={setTotalSeats} keyboardType="numeric" />
              </View>
            </View>

            {/* Dates */}
            <View style={styles.row}>
              <View style={styles.halfField}>
                <Text style={styles.label}>Start Date *</Text>
                <Pressable style={styles.dateInput} onPress={() => setShowStartPicker(true)}>
                  <Ionicons name="calendar-outline" size={16} color={colors.onSurfaceVariant} />
                  <Text style={[styles.dateText, !startDate && { color: colors.outline }]}>
                    {startDate || 'Select date'}
                  </Text>
                </Pressable>
              </View>
              <View style={styles.halfField}>
                <Text style={styles.label}>End Date *</Text>
                <Pressable style={styles.dateInput} onPress={() => setShowEndPicker(true)}>
                  <Ionicons name="calendar-outline" size={16} color={colors.onSurfaceVariant} />
                  <Text style={[styles.dateText, !endDate && { color: colors.outline }]}>
                    {endDate || 'Select date'}
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Duration */}
            <Text style={styles.label}>Duration</Text>
            <TextInput style={styles.input} placeholder="e.g. 5 days (auto-calculated if empty)" placeholderTextColor={colors.outline} value={duration} onChangeText={setDuration} />

            {/* Trip Type */}
            <Text style={styles.label}>Trip Type</Text>
            <View style={styles.tagGrid}>
              {TRIP_TYPE_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.value}
                  onPress={() => setSelectedTripType(opt.value)}
                  style={[styles.tripTypeChip, selectedTripType === opt.value && styles.tripTypeChipSelected]}
                >
                  <Text style={[styles.tripTypeText, selectedTripType === opt.value && styles.tripTypeTextSelected]}>
                    {opt.label}
                  </Text>
                  {opt.premium && (
                    <View style={styles.premiumTag}>
                      <Text style={styles.premiumTagText}>Premium</Text>
                    </View>
                  )}
                </Pressable>
              ))}
            </View>

            {/* Tags */}
            <Text style={styles.label}>Tags</Text>
            <View style={styles.tagGrid}>
              {TAG_OPTIONS.map((tag) => (
                <Pressable
                  key={tag}
                  onPress={() => toggleTag(tag)}
                  style={[styles.tagChip, selectedTags.includes(tag) && styles.tagChipSelected]}
                >
                  <Text style={[styles.tagText, selectedTags.includes(tag) && styles.tagTextSelected]}>{tag}</Text>
                </Pressable>
              ))}
            </View>

            {/* Highlights */}
            <Text style={styles.label}>Highlights</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="One highlight per line..."
              placeholderTextColor={colors.outline}
              value={highlights}
              onChangeText={setHighlights}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            {/* Itinerary */}
            <View style={styles.itinerarySectionHeader}>
              <Text style={styles.label}>Itinerary *</Text>
              <Pressable onPress={addItineraryDay} style={styles.addDayButton}>
                <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
                <Text style={styles.addDayText}>Add Day</Text>
              </Pressable>
            </View>

            {/* Load from Preset */}
            {presets.length > 0 && (
              <View style={{ marginBottom: spacing.md }}>
                <Pressable
                  style={styles.presetLoadButton}
                  onPress={() => setShowPresetPicker(!showPresetPicker)}
                >
                  <Ionicons name="bookmark-outline" size={16} color={colors.primary} />
                  <Text style={styles.presetLoadText}>Load from Preset</Text>
                  <Ionicons
                    name={showPresetPicker ? 'chevron-up' : 'chevron-down'}
                    size={14}
                    color={colors.primary}
                  />
                </Pressable>

                {showPresetPicker && (
                  <View style={styles.presetDropdown}>
                    {presets.map((preset) => (
                      <View key={preset.id} style={styles.presetItem}>
                        <Pressable
                          style={styles.presetItemContent}
                          onPress={() => loadPreset(preset)}
                        >
                          <Text style={styles.presetItemName}>{preset.name}</Text>
                          <Text style={styles.presetItemMeta}>
                            {preset.days.length} {preset.days.length === 1 ? 'day' : 'days'}
                          </Text>
                        </Pressable>
                        <Pressable
                          onPress={() =>
                            alert.show({ title: 'Delete Preset', message: `Delete "${preset.name}"?`, type: 'warning', buttons: [
                              { text: 'Cancel', style: 'cancel' },
                              { text: 'Delete', style: 'destructive', onPress: () => deletePreset(preset.id) },
                            ] })
                          }
                          hitSlop={8}
                        >
                          <Ionicons name="trash-outline" size={16} color={colors.error} />
                        </Pressable>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            {itineraryDays.map((day, index) => (
              <View key={index} style={styles.itineraryCard}>
                <View style={styles.itineraryCardHeader}>
                  <View style={styles.dayBadge}>
                    <Text style={styles.dayBadgeText}>Day {day.day}</Text>
                  </View>
                  {itineraryDays.length > 1 && (
                    <Pressable onPress={() => removeItineraryDay(index)} hitSlop={8}>
                      <Ionicons name="trash-outline" size={16} color={colors.error} />
                    </Pressable>
                  )}
                </View>
                <TextInput
                  style={styles.itineraryInput}
                  placeholder="Title (e.g. Arrival in Hunza)"
                  placeholderTextColor={colors.outline}
                  value={day.title}
                  onChangeText={(v) => updateItineraryDay(index, 'title', v)}
                />
                <TextInput
                  style={[styles.itineraryInput, { marginTop: spacing.sm }]}
                  placeholder="Description (e.g. Welcome dinner & briefing)"
                  placeholderTextColor={colors.outline}
                  value={day.desc}
                  onChangeText={(v) => updateItineraryDay(index, 'desc', v)}
                />
              </View>
            ))}

            {/* Save as Preset */}
            <Pressable
              style={styles.presetCheckRow}
              onPress={() => setSaveAsPreset(!saveAsPreset)}
            >
              <Ionicons
                name={saveAsPreset ? 'checkbox' : 'square-outline'}
                size={20}
                color={saveAsPreset ? colors.primary : colors.outlineVariant}
              />
              <Text style={styles.presetCheckLabel}>Save itinerary as preset</Text>
            </Pressable>
            {saveAsPreset && (
              <TextInput
                style={[styles.input, { marginBottom: spacing.md }]}
                placeholder="Preset name (e.g. Hunza 5-Day Classic)"
                placeholderTextColor={colors.outline}
                value={presetName}
                onChangeText={setPresetName}
                maxLength={100}
              />
            )}

            {/* Recurring / Loop */}
            <Pressable
              style={styles.presetCheckRow}
              onPress={() => setRecurringEnabled(!recurringEnabled)}
            >
              <Ionicons
                name={recurringEnabled ? 'checkbox' : 'square-outline'}
                size={20}
                color={recurringEnabled ? colors.primary : colors.outlineVariant}
              />
              <Text style={styles.presetCheckLabel}>Repeat this trip on a loop</Text>
            </Pressable>
            {recurringEnabled && (
              <View style={styles.recurringConfig}>
                <Text style={styles.recurringHint}>
                  A new trip will auto-create every week on the selected day, 2 days before departure.
                </Text>
                <Text style={styles.filterLabel}>Day of Week</Text>
                <View style={styles.dayRow}>
                  {DAY_NAMES.map((name, i) => (
                    <Pressable
                      key={i}
                      style={[styles.dayChip, recurringDay === i && styles.dayChipActive]}
                      onPress={() => setRecurringDay(i)}
                    >
                      <Text style={[styles.dayChipText, recurringDay === i && styles.dayChipTextActive]}>{name}</Text>
                    </Pressable>
                  ))}
                </View>
                <Text style={[styles.filterLabel, { marginTop: spacing.md }]}>Departure Hour</Text>
                <View style={styles.hourRow}>
                  {[6, 8, 10, 12, 14, 16, 18, 20, 22].map((h) => (
                    <Pressable
                      key={h}
                      style={[styles.dayChip, recurringHour === h && styles.dayChipActive]}
                      onPress={() => setRecurringHour(h)}
                    >
                      <Text style={[styles.dayChipText, recurringHour === h && styles.dayChipTextActive]}>
                        {h > 12 ? `${h - 12}pm` : h === 12 ? '12pm' : `${h}am`}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* Submit */}
            <Pressable onPress={handleSubmit} disabled={isSubmitting}>
              <LinearGradient
                colors={[colors.primary, colors.primaryContainer]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.submitButton, isSubmitting && { opacity: 0.6 }]}
              >
                <Text style={styles.submitText}>
                  {isSubmitting ? 'Saving...' : editTripId ? 'Update Trip' : 'Create Trip'}
                </Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <DatePickerModal
        visible={showStartPicker}
        value={startDateObj || new Date()}
        minimumDate={new Date()}
        title="Start Date"
        onConfirm={(date) => {
          setStartDateObj(date);
          setStartDate(date.toISOString().split('T')[0]);
          if (endDateObj && date >= endDateObj) {
            setEndDateObj(null);
            setEndDate('');
          }
        }}
        onClose={() => setShowStartPicker(false)}
      />
      <DatePickerModal
        visible={showEndPicker}
        value={endDateObj || startDateObj || new Date()}
        minimumDate={startDateObj ? new Date(startDateObj.getTime() + 86400000) : new Date()}
        title="End Date"
        onConfirm={(date) => {
          setEndDateObj(date);
          setEndDate(date.toISOString().split('T')[0]);
        }}
        onClose={() => setShowEndPicker(false)}
      />
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
  textArea: { height: 100, paddingTop: spacing.md },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    height: 48,
  },
  dateText: {
    ...typography.bodyMd,
    color: colors.onSurface,
  },
  row: { flexDirection: 'row', gap: spacing.md },
  halfField: { flex: 1 },
  tagGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tagChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceContainerLow,
  },
  tagChipSelected: { backgroundColor: colors.primary },
  tagText: { fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.onSurfaceVariant },
  tagTextSelected: { color: colors.onPrimary },
  // Hero Image
  heroImagePicker: {
    borderRadius: radii.lg,
    overflow: 'hidden',
    backgroundColor: colors.surfaceContainerLow,
  },
  heroImagePreview: {
    width: '100%',
    height: 180,
    borderRadius: radii.lg,
  },
  heroImagePlaceholder: {
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  imagePlaceholderText: {
    ...typography.bodySm,
    color: colors.outlineVariant,
  },
  // Gallery
  galleryPicker: {
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  galleryAddButton: {
    width: 80,
    height: 80,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  galleryAddText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: colors.primary,
  },
  galleryThumbWrap: {
    position: 'relative',
  },
  galleryThumb: {
    width: 80,
    height: 80,
    borderRadius: radii.md,
  },
  galleryRemove: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.scrimHeavy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Itinerary
  itinerarySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addDayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingTop: spacing.lg,
  },
  addDayText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.primary,
  },
  itineraryCard: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radii.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  itineraryCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  dayBadge: {
    backgroundColor: colors.primaryTint,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  dayBadgeText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.primary,
  },
  itineraryInput: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    height: 40,
    ...typography.bodyMd,
    color: colors.onSurface,
  },
  // Presets
  presetLoadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
  },
  presetLoadText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.primary,
    flex: 1,
  },
  presetDropdown: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radii.md,
    padding: spacing.sm,
  },
  presetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  presetItemContent: {
    flex: 1,
  },
  presetItemName: {
    ...typography.bodyMd,
    color: colors.onSurface,
  },
  presetItemMeta: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  presetCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  presetCheckLabel: {
    ...typography.bodyMd,
    color: colors.onSurface,
  },
  // Recurring
  recurringConfig: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radii.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  recurringHint: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.md,
  },
  filterLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  dayRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  hourRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  dayChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceContainerLowest,
  },
  dayChipActive: {
    backgroundColor: colors.primary,
  },
  dayChipText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
  dayChipTextActive: {
    color: colors.onPrimary,
  },
  // Submit
  submitButton: {
    height: 56,
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing['2xl'],
  },
  submitText: { fontFamily: 'Inter_400Regular', fontSize: 16, color: colors.onPrimary, letterSpacing: 0.3 },
  // Trip Type
  tripTypeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceContainerLow,
    gap: 6,
  },
  tripTypeChipSelected: {
    backgroundColor: colors.primary,
  },
  tripTypeText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
  tripTypeTextSelected: {
    color: colors.onPrimary,
  },
  premiumTag: {
    backgroundColor: colors.bikeBg,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: radii.full,
  },
  premiumTagText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 9,
    color: colors.bikeColor,
    letterSpacing: 0.3,
  },
});
