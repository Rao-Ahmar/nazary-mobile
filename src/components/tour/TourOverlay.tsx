import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, spacing, radii, type Colors } from '../../theme';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  targetRef: React.RefObject<View | null> | null; // null = no spotlight (welcome card)
}

interface TourOverlayProps {
  steps: TourStep[];
  visible: boolean;
  onComplete: () => void;
}

interface TargetRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const PADDING = 8;
const CUTOUT_RADIUS = 12;
const SCREEN = Dimensions.get('window');

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function TourOverlay({ steps, visible, onComplete }: TourOverlayProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [currentStep, setCurrentStep] = useState(0);
  const [targetRects, setTargetRects] = useState<(TargetRect | null)[]>([]);
  const [ready, setReady] = useState(false);

  // --- Animations ---
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const tooltipOpacity = useRef(new Animated.Value(0)).current;
  const tooltipTranslateY = useRef(new Animated.Value(20)).current;

  // Animated cutout position for smooth transitions between steps
  const cutX = useRef(new Animated.Value(SCREEN.width / 2)).current;
  const cutY = useRef(new Animated.Value(SCREEN.height / 2)).current;
  const cutW = useRef(new Animated.Value(0)).current;
  const cutH = useRef(new Animated.Value(0)).current;

  // Pulse animation for spotlight border glow
  const pulseOpacity = useRef(new Animated.Value(0)).current;
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);

  // Derived animated values for scrim layout
  const rightScrimLeft = useMemo(() => Animated.add(cutX, cutW), [cutX, cutW]);
  const bottomScrimTop = useMemo(() => Animated.add(cutY, cutH), [cutY, cutH]);

  // Track whether current step has a spotlight (for border rendering)
  const [hasCutout, setHasCutout] = useState(false);

  /* ---- Pulse ---- */

  const startPulse = useCallback(() => {
    pulseLoop.current?.stop();
    pulseOpacity.setValue(0);
    pulseLoop.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseOpacity, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(pulseOpacity, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ]),
    );
    pulseLoop.current.start();
  }, [pulseOpacity]);

  const stopPulse = useCallback(() => {
    pulseLoop.current?.stop();
    pulseOpacity.setValue(0);
  }, [pulseOpacity]);

  /* ---- Cutout position ---- */

  const setCutoutPosition = useCallback(
    (rect: TargetRect | null, animated: boolean) => {
      const x = rect ? rect.x - PADDING : SCREEN.width / 2;
      const y = rect ? rect.y - PADDING : SCREEN.height / 2;
      const w = rect ? rect.width + PADDING * 2 : 0;
      const h = rect ? rect.height + PADDING * 2 : 0;

      setHasCutout(!!rect);

      if (animated) {
        const springConfig = { damping: 22, stiffness: 180, useNativeDriver: false };
        Animated.parallel([
          Animated.spring(cutX, { ...springConfig, toValue: x }),
          Animated.spring(cutY, { ...springConfig, toValue: y }),
          Animated.spring(cutW, { ...springConfig, toValue: w }),
          Animated.spring(cutH, { ...springConfig, toValue: h }),
        ]).start();
      } else {
        cutX.setValue(x);
        cutY.setValue(y);
        cutW.setValue(w);
        cutH.setValue(h);
      }
    },
    [cutX, cutY, cutW, cutH],
  );

  /* ---- Measure targets ---- */

  const measureAllTargets = useCallback((): Promise<(TargetRect | null)[]> => {
    const promises = steps.map((step) => {
      if (!step.targetRef?.current) return Promise.resolve(null);
      return new Promise<TargetRect | null>((resolve) => {
        step.targetRef!.current!.measureInWindow((x, y, width, height) => {
          if (width === 0 && height === 0) resolve(null);
          else resolve({ x, y, width, height });
        });
      });
    });
    return Promise.all(promises);
  }, [steps]);

  /* ---- Tooltip animations ---- */

  const animateTooltipIn = useCallback(() => {
    tooltipOpacity.setValue(0);
    tooltipTranslateY.setValue(20);
    Animated.parallel([
      Animated.timing(tooltipOpacity, {
        toValue: 1,
        duration: 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(tooltipTranslateY, {
        toValue: 0,
        damping: 18,
        stiffness: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, [tooltipOpacity, tooltipTranslateY]);

  const animateTooltipOut = useCallback(
    (): Promise<void> =>
      new Promise((resolve) => {
        Animated.timing(tooltipOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }).start(() => resolve());
      }),
    [tooltipOpacity],
  );

  /* ---- Lifecycle ---- */

  useEffect(() => {
    if (!visible) {
      setCurrentStep(0);
      setReady(false);
      backdropOpacity.setValue(0);
      tooltipOpacity.setValue(0);
      tooltipTranslateY.setValue(20);
      stopPulse();
      return;
    }

    const timer = setTimeout(() => {
      measureAllTargets().then((rects) => {
        setTargetRects(rects);
        setCutoutPosition(rects[0], false);
        setReady(true);

        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();

        animateTooltipIn();
        if (rects[0]) startPulse();
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [visible]);

  /* ---- Handlers ---- */

  const handleNext = useCallback(async () => {
    if (currentStep >= steps.length - 1) {
      // Last step — dismiss everything
      stopPulse();
      Animated.parallel([
        Animated.timing(backdropOpacity, { toValue: 0, duration: 250, useNativeDriver: true }),
        Animated.timing(tooltipOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start(() => onComplete());
      return;
    }

    // Transition to next step
    await animateTooltipOut();
    stopPulse();

    const rects = await measureAllTargets();
    setTargetRects(rects);

    const nextIdx = currentStep + 1;
    const nextRect = rects[nextIdx];

    // Animate cutout to new position (smooth spring)
    setCutoutPosition(nextRect, true);
    setCurrentStep(nextIdx);

    // Slight delay so cutout animation has started before tooltip appears
    setTimeout(() => {
      animateTooltipIn();
      if (nextRect) startPulse();
    }, 180);
  }, [
    currentStep,
    steps.length,
    animateTooltipOut,
    animateTooltipIn,
    measureAllTargets,
    onComplete,
    backdropOpacity,
    tooltipOpacity,
    setCutoutPosition,
    startPulse,
    stopPulse,
  ]);

  const handleSkip = useCallback(() => {
    stopPulse();
    Animated.parallel([
      Animated.timing(backdropOpacity, { toValue: 0, duration: 250, useNativeDriver: true }),
      Animated.timing(tooltipOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => onComplete());
  }, [onComplete, backdropOpacity, tooltipOpacity, stopPulse]);

  /* ---- Render ---- */

  if (!visible || !ready) return null;

  const step = steps[currentStep];
  const rect = targetRects[currentStep];
  const isLast = currentStep === steps.length - 1;

  // Tooltip position (based on static rect, not animated values)
  const cutoutForTooltip = rect
    ? { y: rect.y - PADDING, height: rect.height + PADDING * 2 }
    : null;

  const tooltipTop = cutoutForTooltip
    ? cutoutForTooltip.y + cutoutForTooltip.height + spacing.lg > SCREEN.height * 0.65
      ? cutoutForTooltip.y - 16
      : cutoutForTooltip.y + cutoutForTooltip.height + spacing.lg
    : SCREEN.height * 0.3;

  const tooltipAbove = cutoutForTooltip
    ? cutoutForTooltip.y + cutoutForTooltip.height + spacing.lg > SCREEN.height * 0.65
    : false;

  // Border pulse interpolation
  const borderColor = pulseOpacity.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.5)'],
  });

  return (
    <Modal transparent statusBarTranslucent visible animationType="none">
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: backdropOpacity }]}>
        {/* ---- Animated scrim pieces forming cutout ---- */}

        {/* Top scrim */}
        <Animated.View style={[styles.scrim, { top: 0, left: 0, right: 0, height: cutY }]} />

        {/* Left scrim */}
        <Animated.View
          style={[styles.scrim, { top: cutY, left: 0, width: cutX, height: cutH }]}
        />

        {/* Right scrim */}
        <Animated.View
          style={[styles.scrim, { top: cutY, left: rightScrimLeft, right: 0, height: cutH }]}
        />

        {/* Bottom scrim */}
        <Animated.View
          style={[styles.scrim, { top: bottomScrimTop, left: 0, right: 0, bottom: 0 }]}
        />

        {/* ---- Cutout border with pulse glow ---- */}
        {hasCutout && (
          <>
            {/* Solid border */}
            <Animated.View
              style={{
                position: 'absolute',
                top: cutY,
                left: cutX,
                width: cutW,
                height: cutH,
                borderRadius: CUTOUT_RADIUS,
                borderWidth: 2,
                borderColor: 'rgba(255,255,255,0.25)',
              }}
            />
            {/* Pulsing outer glow */}
            <Animated.View
              style={{
                position: 'absolute',
                top: cutY,
                left: cutX,
                width: cutW,
                height: cutH,
                borderRadius: CUTOUT_RADIUS,
                borderWidth: 3,
                borderColor,
              }}
            />
          </>
        )}

        {/* ---- Tooltip card ---- */}
        <Animated.View
          style={[
            styles.tooltip,
            {
              top: tooltipAbove ? undefined : tooltipTop,
              bottom: tooltipAbove
                ? SCREEN.height - (cutoutForTooltip?.y ?? 0) + spacing.lg
                : undefined,
              opacity: tooltipOpacity,
              transform: [{ translateY: tooltipTranslateY }],
            },
          ]}
        >
          {/* Icon circle */}
          <View style={styles.iconCircle}>
            <Ionicons name={step.icon} size={24} color={colors.primary} />
          </View>

          {/* Title */}
          <Text style={styles.title}>{step.title}</Text>

          {/* Description */}
          <Text style={styles.description}>{step.description}</Text>

          {/* Bottom row: dots + buttons */}
          <View style={styles.bottomRow}>
            {/* Step dots */}
            <View style={styles.dotsRow}>
              {steps.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    i === currentStep ? styles.dotActive : styles.dotInactive,
                  ]}
                />
              ))}
            </View>

            {/* Buttons */}
            <View style={styles.buttonsRow}>
              <Pressable onPress={handleSkip} hitSlop={8}>
                <Text style={styles.skipText}>Skip</Text>
              </Pressable>
              <Pressable style={styles.nextButton} onPress={handleNext}>
                <Text style={styles.nextButtonText}>{isLast ? 'Done' : 'Next'}</Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    scrim: {
      position: 'absolute',
      backgroundColor: colors.scrim,
    },
    tooltip: {
      position: 'absolute',
      left: spacing.xl,
      right: spacing.xl,
      backgroundColor: colors.surfaceContainerLowest,
      borderRadius: radii.xl,
      padding: spacing.xl,
      shadowColor: colors.onSurface,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 24,
      elevation: 10,
    },
    iconCircle: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.primaryTint,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
    },
    title: {
      fontFamily: 'Manrope_400Regular',
      fontSize: 18,
      color: colors.onSurface,
      marginBottom: spacing.xs,
    },
    description: {
      fontFamily: 'Inter_300Light',
      fontSize: 14,
      lineHeight: 20,
      color: colors.onSurfaceVariant,
      marginBottom: spacing.lg,
    },
    bottomRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    dotsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    dotActive: {
      backgroundColor: colors.primary,
    },
    dotInactive: {
      backgroundColor: colors.surfaceContainerHigh,
    },
    buttonsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.lg,
    },
    skipText: {
      fontFamily: 'Inter_400Regular',
      fontSize: 14,
      color: colors.outline,
    },
    nextButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.sm,
      borderRadius: radii.md,
    },
    nextButtonText: {
      fontFamily: 'Inter_400Regular',
      fontSize: 14,
      color: colors.onPrimary,
    },
  });
