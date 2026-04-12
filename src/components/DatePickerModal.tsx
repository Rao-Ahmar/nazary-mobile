import React, { useState, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, Modal } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { spacing, radii, useTheme, type Colors } from '../theme';

interface DatePickerModalProps {
  visible: boolean;
  value: Date;
  minimumDate?: Date;
  onConfirm: (date: Date) => void;
  onClose: () => void;
  title?: string;
}

export function DatePickerModal({ visible, value, minimumDate, onConfirm, onClose, title }: DatePickerModalProps) {
  const [tempDate, setTempDate] = useState(value);
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const handleChange = (_: any, date?: Date) => {
    if (date) setTempDate(date);
  };

  const handleDone = () => {
    onConfirm(tempDate);
    onClose();
  };

  // Reset tempDate when modal opens with a new value
  React.useEffect(() => {
    if (visible) setTempDate(value);
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          {title && <Text style={styles.title}>{title}</Text>}
          <View style={styles.pickerContainer}>
            <DateTimePicker
              value={tempDate}
              mode="date"
              display="spinner"
              minimumDate={minimumDate}
              onChange={handleChange}
              style={styles.picker}
              textColor={colors.onSurface}
              themeVariant={isDark ? 'dark' : 'light'}
            />
          </View>
          <Pressable style={styles.doneButton} onPress={handleDone}>
            <Text style={styles.doneText}>Done</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const makeStyles = (colors: Colors) => StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.scrim,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radii.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    width: '85%',
    maxWidth: 360,
    alignItems: 'center',
    shadowColor: colors.onSurface,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 17,
    color: colors.onSurface,
    marginBottom: spacing.md,
  },
  pickerContainer: {
    width: '100%',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  picker: {
    width: '100%',
    height: 200,
  },
  doneButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: radii.full,
    paddingHorizontal: 48,
    paddingVertical: 14,
  },
  doneText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: colors.onPrimary,
  },
});
