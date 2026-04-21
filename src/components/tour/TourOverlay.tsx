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

  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const tooltipOpacity = useRef(new Animated.Value(0)).current;
  const tooltipTranslateY = useRef(new Animated.Value(20)).current;

  // Measure all target refs when visible becomes true
  useEffect(() => {
    if (!visible) {
      setCurrentStep(0);
      setReady(false);
      backdropOpacity.setValue(0);
      tooltipOpacity.setValue(0);
      tooltipTranslateY.setValue(20);
      return;
    }

    // Small delay to let the screen settle
    const timer = setTimeout(() => {
      measureAllTargets().then((rects) => {
        setTargetRects(rects);
        setReady(true);
        // Animate in
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
        animateTooltipIn();
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [visible]);

  const measureAllTargets = useCallback((): Promise<(TargetRect | null)[]> => {
    const promises = steps.map((step) => {
      if (!step.targetRef?.current) return Promise.resolve(null);
      return new Promise<TargetRect | null>((resolve) => {
        step.targetRef!.current!.measureInWindow((x, y, width, height) => {
          if (width === 0 && height === 0) {
            resolve(null);
          } else {
            resolve({ x, y, width, height });
          }
        });
      });
    });
    return Promise.all(promises);
  }, [steps]);

  const animateTooltipIn = useCallback(() => {
    tooltipOpacity.setValue(0);
    tooltipTranslateY.setValue(20);
    Animated.parallel([
      Animated.timing(tooltipOpacity, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(tooltipTranslateY, {
        toValue: 0,
        damping: 18,
        stiffness: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [tooltipOpacity, tooltipTranslateY]);

  const animateTooltipOut = useCallback((): Promise<void> => {
    return new Promise((resolve) => {
      Animated.timing(tooltipOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => resolve());
    });
  }, [tooltipOpacity]);

  const handleNext = useCallback(async () => {
    if (currentStep >= steps.length - 1) {
      // Last step — dismiss
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        onComplete();
      });
      return;
    }
    await animateTooltipOut();
    // Re-measure in case layout shifted
    const rects = await measureAllTargets();
    setTargetRects(rects);
    setCurrentStep((prev) => prev + 1);
    animateTooltipIn();
  }, [currentStep, steps.length, animateTooltipOut, animateTooltipIn, measureAllTargets, onComplete, backdropOpacity]);

  const handleSkip = useCallback(() => {
    Animated.timing(backdropOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onComplete();
    });
  }, [onComplete, backdropOpacity]);

  if (!visible || !ready) return null;

  const step = steps[currentStep];
  const rect = targetRects[currentStep];
  const isLast = currentStep === steps.length - 1;

  // Calculate cutout bounds (with padding)
  const cutout = rect
    ? {
        x: rect.x - PADDING,
        y: rect.y - PADDING,
        width: rect.width + PADDING * 2,
        height: rect.height + PADDING * 2,
      }
    : null;

  // Determine tooltip position: below cutout, or centered if no cutout
  const tooltipTop = cutout
    ? cutout.y + cutout.height + spacing.lg > SCREEN.height * 0.65
      ? cutout.y - 16 // Place above if cutout is low
      : cutout.y + cutout.height + spacing.lg
    : SCREEN.height * 0.3;

  const tooltipAbove = cutout
    ? cutout.y + cutout.height + spacing.lg > SCREEN.height * 0.65
    : false;

  return (
    <Modal transparent statusBarTranslucent visible animationType="none">
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: backdropOpacity }]}>
        {/* Scrim pieces forming cutout */}
        {cutout ? (
          <>
            {/* Top scrim */}
            <View style={[styles.scrim, { top: 0, left: 0, right: 0, height: cutout.y }]} />
            {/* Left scrim */}
            <View
              style={[
                styles.scrim,
                { top: cutout.y, left: 0, width: cutout.x, height: cutout.height },
              ]}
            />
            {/* Right scrim */}
            <View
              style={[
                styles.scrim,
                {
                  top: cutout.y,
                  left: cutout.x + cutout.width,
                  right: 0,
                  height: cutout.height,
                },
              ]}
            />
            {/* Bottom scrim */}
            <View
              style={[
                styles.scrim,
                { top: cutout.y + cutout.height, left: 0, right: 0, bottom: 0 },
              ]}
            />
            {/* Cutout border highlight */}
            <View
              style={[
                styles.cutoutBorder,
                {
                  top: cutout.y,
                  left: cutout.x,
                  width: cutout.width,
                  height: cutout.height,
                  borderRadius: CUTOUT_RADIUS,
                },
              ]}
            />
          </>
        ) : (
          // Full scrim for welcome step
          <View style={[styles.scrim, StyleSheet.absoluteFill]} />
        )}

        {/* Tooltip card */}
        <Animated.View
          style={[
            styles.tooltip,
            {
              top: tooltipAbove ? undefined : tooltipTop,
              bottom: tooltipAbove ? SCREEN.height - (cutout?.y ?? 0) + spacing.lg : undefined,
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
                    {
                      backgroundColor:
                        i === currentStep ? colors.primary : colors.surfaceContainerHigh,
                    },
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
    cutoutBorder: {
      position: 'absolute',
      borderWidth: 2,
      borderColor: 'rgba(255,255,255,0.25)',
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
