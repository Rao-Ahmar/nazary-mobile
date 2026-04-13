import React, { createContext, useContext, useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, Modal, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, spacing, radii, type Colors } from '../theme';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type AlertType = 'info' | 'success' | 'error' | 'warning';

interface AlertButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

interface AlertOptions {
  title: string;
  message?: string;
  type?: AlertType;
  buttons?: AlertButton[];
}

interface AlertContextValue {
  show: (options: AlertOptions) => void;
}

/* ------------------------------------------------------------------ */
/*  Context                                                            */
/* ------------------------------------------------------------------ */

const AlertContext = createContext<AlertContextValue | null>(null);

export function useAlert(): AlertContextValue {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error('useAlert must be used within AlertProvider');
  return ctx;
}

/* ------------------------------------------------------------------ */
/*  Icon config                                                        */
/* ------------------------------------------------------------------ */

const ICON_MAP: Record<AlertType, { name: keyof typeof Ionicons.glyphMap; colorKey: (c: Colors) => string; bgKey: (c: Colors) => string }> = {
  success: { name: 'checkmark-circle', colorKey: (c) => c.success, bgKey: (c) => c.successLight },
  error:   { name: 'alert-circle',     colorKey: (c) => c.error,   bgKey: (c) => c.errorContainer },
  warning: { name: 'warning',          colorKey: (c) => c.warning, bgKey: (c) => c.warningLight },
  info:    { name: 'information-circle', colorKey: (c) => c.primary, bgKey: (c) => c.primaryTint },
};

/* ------------------------------------------------------------------ */
/*  Provider                                                           */
/* ------------------------------------------------------------------ */

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [visible, setVisible] = useState(false);
  const [options, setOptions] = useState<AlertOptions | null>(null);

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const show = useCallback((opts: AlertOptions) => {
    setOptions(opts);
    setVisible(true);
  }, []);

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0.85);
      opacityAnim.setValue(0);
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, damping: 18, stiffness: 300, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 200, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const dismiss = useCallback(() => {
    Animated.parallel([
      Animated.timing(scaleAnim, { toValue: 0.9, duration: 150, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      setVisible(false);
      setOptions(null);
    });
  }, []);

  const handleButton = useCallback((btn?: AlertButton) => {
    dismiss();
    // Small delay so modal closes before callback runs (e.g. navigation)
    if (btn?.onPress) {
      setTimeout(btn.onPress, 200);
    }
  }, [dismiss]);

  const type = options?.type ?? 'info';
  const iconCfg = ICON_MAP[type];
  const buttons = options?.buttons;
  const hasButtons = buttons && buttons.length > 0;

  return (
    <AlertContext.Provider value={{ show }}>
      {children}
      <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
        <Pressable style={styles.backdrop} onPress={() => handleButton()}>
          <Animated.View
            style={[
              styles.card,
              { opacity: opacityAnim, transform: [{ scale: scaleAnim }] },
            ]}
          >
            <Pressable onPress={(e) => e.stopPropagation()}>
              {/* Icon */}
              <View style={[styles.iconCircle, { backgroundColor: iconCfg.bgKey(colors) }]}>
                <Ionicons name={iconCfg.name} size={28} color={iconCfg.colorKey(colors)} />
              </View>

              {/* Title */}
              <Text style={styles.title}>{options?.title ?? ''}</Text>

              {/* Message */}
              {options?.message ? (
                <Text style={styles.message}>{options.message}</Text>
              ) : null}

              {/* Buttons */}
              <View style={styles.buttonRow}>
                {hasButtons ? (
                  buttons.map((btn, i) => {
                    const isCancel = btn.style === 'cancel';
                    const isDestructive = btn.style === 'destructive';

                    return (
                      <Pressable
                        key={i}
                        style={[
                          styles.button,
                          buttons.length === 1 && styles.buttonFull,
                          isCancel && styles.buttonCancel,
                          isDestructive && styles.buttonDestructive,
                          !isCancel && !isDestructive && styles.buttonPrimary,
                        ]}
                        onPress={() => handleButton(btn)}
                      >
                        <Text
                          style={[
                            styles.buttonText,
                            isCancel && { color: colors.onSurfaceVariant },
                            isDestructive && { color: colors.onError },
                            !isCancel && !isDestructive && { color: colors.onPrimary },
                          ]}
                        >
                          {btn.text}
                        </Text>
                      </Pressable>
                    );
                  })
                ) : (
                  <Pressable
                    style={[styles.button, styles.buttonFull, styles.buttonPrimary]}
                    onPress={() => handleButton()}
                  >
                    <Text style={[styles.buttonText, { color: colors.onPrimary }]}>OK</Text>
                  </Pressable>
                )}
              </View>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>
    </AlertContext.Provider>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: colors.scrim,
      justifyContent: 'center',
      alignItems: 'center',
    },
    card: {
      backgroundColor: colors.surfaceContainerLowest,
      borderRadius: radii.xl,
      paddingTop: spacing.xl,
      paddingBottom: spacing.lg,
      paddingHorizontal: spacing.xl,
      width: '85%',
      maxWidth: 340,
      alignItems: 'center',
      shadowColor: colors.onSurface,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 24,
      elevation: 10,
    },
    iconCircle: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.lg,
    },
    title: {
      fontFamily: 'Manrope_400Regular',
      fontSize: 18,
      color: colors.onSurface,
      textAlign: 'center',
      marginBottom: spacing.sm,
    },
    message: {
      fontFamily: 'Inter_300Light',
      fontSize: 14,
      lineHeight: 20,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
      marginBottom: spacing.lg,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: spacing.md,
      marginTop: spacing.md,
      width: '100%',
    },
    button: {
      flex: 1,
      height: 44,
      borderRadius: radii.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonFull: {
      flex: 1,
    },
    buttonPrimary: {
      backgroundColor: colors.primary,
    },
    buttonCancel: {
      backgroundColor: colors.surfaceContainerHigh,
    },
    buttonDestructive: {
      backgroundColor: colors.error,
    },
    buttonText: {
      fontFamily: 'Inter_400Regular',
      fontSize: 14,
      letterSpacing: 0.2,
    },
  });
