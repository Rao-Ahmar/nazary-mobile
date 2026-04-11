import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Modal } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors, spacing, radii } from '../theme';

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
              textColor="#000000"
              themeVariant="light"
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

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: radii.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    width: '85%',
    maxWidth: 360,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 17,
    color: '#1a1a1a',
    marginBottom: spacing.md,
  },
  pickerContainer: {
    width: '100%',
    backgroundColor: '#f0f0f0',
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
    color: '#ffffff',
  },
});
