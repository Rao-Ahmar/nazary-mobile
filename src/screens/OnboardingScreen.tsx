import React, { useRef, useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TextInput,
  Pressable,
  FlatList,
  ImageBackground,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import Constants from 'expo-constants';
import { useTheme, typography, spacing, radii } from '../theme';
import type { Colors } from '../theme';
import { useAuthStore } from '../store';
import { useAlert } from '../components/ThemedAlert';

const { width, height } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    image: 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=800&q=80',
  },
  {
    id: '2',
    image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80',
  },
  {
    id: '3',
    image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80',
  },
];

function PageDot({ index, active }: { index: number; active: boolean }) {
  const { colors } = useTheme();
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
    <Animated.View
      style={[
        dotStyles.dot,
        { width: widthAnim, opacity: opacityAnim, backgroundColor: colors.gradientStart },
      ]}
    />
  );
}

const dotStyles = StyleSheet.create({
  dot: {
    height: 6,
    borderRadius: 3,
  },
});

export function OnboardingScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const alert = useAlert();
  const { googleLogin, isLoading } = useAuthStore();
  const [activeSlide, setActiveSlide] = useState(0);
  const [email, setEmail] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const [_googleRequest, googleResponse, promptGoogleAsync] = Google.useAuthRequest({
    webClientId: Constants.expoConfig?.extra?.googleWebClientId,
    redirectUri: makeRedirectUri({ scheme: 'nazary-mobile' }),
  });

  useEffect(() => {
    if (googleResponse?.type === 'success') {
      const idToken = googleResponse.authentication?.idToken;
      if (idToken) {
        googleLogin(idToken).catch((error: any) => {
          alert.show({ title: 'Google Sign-In Failed', message: error.message, type: 'error' });
        });
      }
    }
  }, [googleResponse]);

  // Entry animations
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoTranslateY = useRef(new Animated.Value(20)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const formTranslateY = useRef(new Animated.Value(40)).current;
  const socialOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const easingFn = Easing.out(Easing.cubic);

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 800,
          easing: easingFn,
          useNativeDriver: true,
        }),
        Animated.timing(logoTranslateY, {
          toValue: 0,
          duration: 800,
          easing: easingFn,
          useNativeDriver: true,
        }),
      ]).start();
    }, 300);

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(formOpacity, {
          toValue: 1,
          duration: 800,
          easing: easingFn,
          useNativeDriver: true,
        }),
        Animated.timing(formTranslateY, {
          toValue: 0,
          duration: 800,
          easing: easingFn,
          useNativeDriver: true,
        }),
      ]).start();
    }, 600);

    setTimeout(() => {
      Animated.timing(socialOpacity, {
        toValue: 1,
        duration: 800,
        easing: easingFn,
        useNativeDriver: true,
      }).start();
    }, 900);
  }, []);

  // Auto-scroll carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => {
        const next = (prev + 1) % slides.length;
        flatListRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleContinue = () => {
    navigation.navigate('MainTabs');
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveSlide(viewableItems[0].index ?? 0);
    }
  }).current;

  const viewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 50,
  }).current;

  const renderSlide = ({ item, index }: any) => (
    <ImageBackground
      source={typeof item.image === 'string' ? { uri: item.image } : item.image}
      style={[styles.slideImage]}
      resizeMode="cover"
    />
  );

  return (
    <View style={styles.container}>
      {/* Background Carousel */}
      <View style={styles.carouselContainer}>
        <FlatList
          ref={flatListRef}
          data={slides}
          renderItem={renderSlide}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          scrollEventThrottle={16}
        />
        <LinearGradient
          colors={['transparent', colors.onboardingFade, colors.surfaceFade, colors.surface]}
          style={styles.gradient}
          locations={[0, 0.35, 0.65, 1]}
        />
      </View>

      {/* Content */}
      <View style={[styles.content, { paddingBottom: insets.bottom + 20 }]}>
        {/* Page Dots */}
        <View style={styles.dots}>
          {slides.map((_, index) => (
            <PageDot key={index} index={index} active={index === activeSlide} />
          ))}
        </View>

        {/* Logo & Tagline */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: logoOpacity,
              transform: [{ translateY: logoTranslateY }],
            },
          ]}
        >
          <Text style={styles.logo}>nazary</Text>
          <Text style={styles.tagline}>
            Curating experiences for{'\n'}the modern wanderer
          </Text>
        </Animated.View>

        {/* Email Form */}
        <Animated.View
          style={[
            styles.formContainer,
            {
              opacity: formOpacity,
              transform: [{ translateY: formTranslateY }],
            },
          ]}
        >
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={18} color={colors.onSurfaceVariant} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor={colors.outline}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <Pressable onPress={handleContinue}>
            <LinearGradient
              colors={[colors.primary, colors.primaryContainer]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.continueButton}
            >
              <Text style={styles.continueText}>Continue</Text>
              <Ionicons name="arrow-forward" size={18} color={colors.onPrimary} />
            </LinearGradient>
          </Pressable>
        </Animated.View>

        {/* Divider */}
        <Animated.View style={[styles.dividerContainer, { opacity: socialOpacity }]}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or continue with</Text>
          <View style={styles.dividerLine} />
        </Animated.View>

        {/* Social Auth */}
        <Animated.View style={[styles.socialContainer, { opacity: socialOpacity }]}>
          <Pressable style={styles.socialButton} onPress={() => {}}>
            <Ionicons name="logo-apple" size={20} color={colors.onSurface} />
            <Text style={styles.socialText}>Apple</Text>
          </Pressable>
          <Pressable style={styles.socialButton} onPress={() => promptGoogleAsync()}>
            <Ionicons name="logo-google" size={20} color={colors.onSurface} />
            <Text style={styles.socialText}>Google</Text>
          </Pressable>
        </Animated.View>

        <Animated.Text style={[styles.terms, { opacity: socialOpacity }]}>
          By continuing, you agree to our{' '}
          <Text style={styles.termsLink}>Terms</Text> &{' '}
          <Text style={styles.termsLink}>Privacy Policy</Text>
        </Animated.Text>
      </View>
    </View>
  );
}

const makeStyles = (colors: Colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  carouselContainer: {
    height: height * 0.52,
    position: 'relative',
  },
  slideImage: {
    width,
    height: height * 0.52,
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.3,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: spacing['2xl'],
  },
  dot: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  logo: {
    fontFamily: 'Manrope_300Light',
    fontSize: 42,
    letterSpacing: -1.5,
    color: colors.onSurface,
    marginBottom: spacing.md,
  },
  tagline: {
    ...typography.bodyLg,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 24,
  },
  formContainer: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    height: 56,
  },
  inputIcon: {
    marginRight: spacing.md,
  },
  input: {
    flex: 1,
    ...typography.bodyLg,
    color: colors.onSurface,
  },
  continueButton: {
    height: 56,
    borderRadius: radii.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  continueText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: colors.onPrimary,
    letterSpacing: 0.3,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
    gap: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 0.5,
    backgroundColor: colors.outlineVariant,
  },
  dividerText: {
    ...typography.labelMd,
    color: colors.outline,
    textTransform: 'uppercase',
  },
  socialContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  socialButton: {
    flex: 1,
    height: 56,
    borderRadius: radii.xl,
    backgroundColor: colors.surfaceContainerLow,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  socialText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: colors.onSurface,
  },
  terms: {
    ...typography.bodySm,
    color: colors.outline,
    textAlign: 'center',
  },
  termsLink: {
    color: colors.primary,
  },
});
