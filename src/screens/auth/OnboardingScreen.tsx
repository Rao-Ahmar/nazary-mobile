import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  Pressable,
  FlatList,
  ImageBackground,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme, typography, spacing, radii } from '../../theme';
import type { Colors } from '../../theme';
import type { AuthStackParamList } from '../../types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Onboarding'>;

const slides = [
  { id: '1', image: require('../../../assets/images/hunza-autumn.jpg') },
  { id: '2', image: require('../../../assets/images/fairy-meadows.jpg') },
  { id: '3', image: require('../../../assets/images/saif-ul-malook.jpg') },
  { id: '4', image: require('../../../assets/images/shangrila.jpg') },
  { id: '5', image: require('../../../assets/images/nanga-parbat.jpg') },
];

function PageDot({ active, dotStyle }: { active: boolean; dotStyle: any }) {
  const widthAnim = useRef(new Animated.Value(active ? 24 : 6)).current;
  const opacityAnim = useRef(new Animated.Value(active ? 1 : 0.3)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(widthAnim, {
        toValue: active ? 24 : 6,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(opacityAnim, {
        toValue: active ? 1 : 0.3,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start();
  }, [active]);

  return (
    <Animated.View style={[dotStyle, { width: widthAnim, opacity: opacityAnim }]} />
  );
}

export function OnboardingScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors, width, height), [colors, width, height]);
  const [activeSlide, setActiveSlide] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const userInteractedRef = useRef(false);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoTranslateY = useRef(new Animated.Value(20)).current;
  const buttonsOpacity = useRef(new Animated.Value(0)).current;
  const buttonsTranslateY = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    const easingFn = Easing.out(Easing.cubic);
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(logoOpacity, { toValue: 1, duration: 800, easing: easingFn, useNativeDriver: true }),
        Animated.timing(logoTranslateY, { toValue: 0, duration: 800, easing: easingFn, useNativeDriver: true }),
      ]).start();
    }, 300);
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(buttonsOpacity, { toValue: 1, duration: 800, easing: easingFn, useNativeDriver: true }),
        Animated.timing(buttonsTranslateY, { toValue: 0, duration: 800, easing: easingFn, useNativeDriver: true }),
      ]).start();
    }, 600);
  }, []);

  // Auto-scroll with pause on user interaction
  useEffect(() => {
    const interval = setInterval(() => {
      if (userInteractedRef.current) return;
      setActiveSlide((prev) => {
        const next = (prev + 1) % slides.length;
        flatListRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 4000);
    return () => {
      clearInterval(interval);
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    };
  }, []);

  const handleScrollBeginDrag = useCallback(() => {
    userInteractedRef.current = true;
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
  }, []);

  const handleScrollEndDrag = useCallback(() => {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      userInteractedRef.current = false;
    }, 6000);
  }, []);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveSlide(viewableItems[0].index ?? 0);
    }
  }).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  return (
    <View style={styles.container}>
      {/* Background Carousel */}
      <View style={styles.carouselContainer}>
        <FlatList
          ref={flatListRef}
          data={slides}
          renderItem={({ item }) => (
            <ImageBackground source={typeof item.image === 'string' ? { uri: item.image } : item.image} style={styles.slideImage} resizeMode="cover" />
          )}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          scrollEventThrottle={16}
          onScrollBeginDrag={handleScrollBeginDrag}
          onScrollEndDrag={handleScrollEndDrag}
        />
        <LinearGradient
          colors={['transparent', colors.onboardingFade, colors.surfaceFade, colors.surface]}
          style={styles.gradient}
          locations={[0, 0.35, 0.65, 1]}
        />
      </View>

      {/* Content */}
      <View style={[styles.content, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.dots}>
          {slides.map((_, index) => (
            <PageDot key={index} active={index === activeSlide} dotStyle={styles.dot} />
          ))}
        </View>

        <Animated.View
          style={[
            styles.logoContainer,
            { opacity: logoOpacity, transform: [{ translateY: logoTranslateY }] },
          ]}
        >
          <Text style={styles.logo}>nazary</Text>
          <Text style={styles.tagline}>
            Curating experiences for{'\n'}the modern wanderer
          </Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.buttonsContainer,
            { opacity: buttonsOpacity, transform: [{ translateY: buttonsTranslateY }] },
          ]}
        >
          <Pressable onPress={() => navigation.navigate('Signup')}>
            <LinearGradient
              colors={[colors.primary, colors.primaryContainer]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryButtonText}>Get Started</Text>
              <Ionicons name="arrow-forward" size={18} color={colors.onPrimary} />
            </LinearGradient>
          </Pressable>

          <Pressable style={styles.secondaryButton} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.secondaryButtonText}>I already have an account</Text>
          </Pressable>
        </Animated.View>

        <Animated.Text style={[styles.terms, { opacity: buttonsOpacity }]}>
          By continuing, you agree to our{' '}
          <Text style={styles.termsLink}>Terms</Text> &{' '}
          <Text style={styles.termsLink}>Privacy Policy</Text>
        </Animated.Text>
      </View>
    </View>
  );
}

const makeStyles = (colors: Colors, width: number, height: number) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  carouselContainer: { height: height * 0.52, position: 'relative' },
  slideImage: { width, height: height * 0.52 },
  gradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: height * 0.3 },
  content: { flex: 1, paddingHorizontal: spacing.xl },
  dots: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: spacing['2xl'] },
  dot: { height: 6, borderRadius: 3, backgroundColor: colors.primary },
  logoContainer: { alignItems: 'center', marginBottom: spacing['3xl'] },
  logo: { fontFamily: 'Manrope_300Light', fontSize: 42, letterSpacing: -1.5, color: colors.onSurface, marginBottom: spacing.md },
  tagline: { ...typography.bodyLg, color: colors.onSurfaceVariant, textAlign: 'center', lineHeight: 24 },
  buttonsContainer: { gap: spacing.md, marginBottom: spacing.xl },
  primaryButton: { height: 56, borderRadius: radii.xl, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryButtonText: { fontFamily: 'Inter_400Regular', fontSize: 16, color: colors.onPrimary, letterSpacing: 0.3 },
  secondaryButton: { height: 56, borderRadius: radii.xl, backgroundColor: colors.surfaceContainerLow, alignItems: 'center', justifyContent: 'center' },
  secondaryButtonText: { fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.onSurface },
  terms: { ...typography.bodySm, color: colors.outline, textAlign: 'center' },
  termsLink: { color: colors.primary },
});
