import React from 'react';
import { Platform } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scrollview';

interface KeyboardAwareScrollProps {
  children: React.ReactNode;
  contentContainerStyle?: any;
  style?: any;
  showsVerticalScrollIndicator?: boolean;
  keyboardShouldPersistTaps?: 'always' | 'never' | 'handled';
  extraScrollHeight?: number;
  horizontal?: boolean;
  showsHorizontalScrollIndicator?: boolean;
}

/**
 * Drop-in ScrollView replacement that auto-scrolls to the focused TextInput
 * when the keyboard opens. Works on both iOS and Android.
 */
export function KeyboardAwareScroll({
  children,
  extraScrollHeight = 40,
  keyboardShouldPersistTaps = 'handled',
  showsVerticalScrollIndicator = false,
  ...rest
}: KeyboardAwareScrollProps) {
  return (
    <KeyboardAwareScrollView
      enableOnAndroid
      extraScrollHeight={extraScrollHeight}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      {...rest}
    >
      {children}
    </KeyboardAwareScrollView>
  );
}
