import React, { useMemo } from 'react';
import { View, Text, TextInput, StyleSheet, type ViewStyle, type TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { typography, spacing, radii, useTheme, type Colors } from '../theme';

interface FormInputProps extends TextInputProps {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  error?: string;
  style?: ViewStyle;
}

export function FormInput({ label, icon, error, style, ...rest }: FormInputProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputContainer, error ? styles.inputError : null]}>
        {icon && <Ionicons name={icon} size={18} color={colors.outline} style={styles.icon} />}
        <TextInput
          style={styles.input}
          placeholderTextColor={colors.outline}
          accessibilityLabel={label}
          accessibilityHint={error}
          {...rest}
        />
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const makeStyles = (colors: Colors) => StyleSheet.create({
  container: { marginBottom: spacing.lg },
  label: { fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.onSurfaceVariant, marginBottom: spacing.sm, letterSpacing: 0.3 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceContainerLow, borderRadius: radii.md, paddingHorizontal: spacing.lg, height: 50 },
  inputError: { borderWidth: 1, borderColor: colors.error },
  icon: { marginRight: spacing.md },
  input: { flex: 1, ...typography.bodyMd, color: colors.onSurface },
  errorText: { fontFamily: 'Inter_400Regular', fontSize: 11, color: colors.error, marginTop: spacing.xs },
});
