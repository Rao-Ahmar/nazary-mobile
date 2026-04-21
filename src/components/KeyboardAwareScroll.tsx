import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';

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
  style,
  contentContainerStyle,
  ...rest
}: KeyboardAwareScrollProps) {
  return (
    <KeyboardAvoidingView
      style={[{ flex: 1 }, style]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={extraScrollHeight}
    >
      <ScrollView
        contentContainerStyle={contentContainerStyle}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        {...rest}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
