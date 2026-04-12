import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../theme';
import { useAuthStore } from '../store';
import { PlannerProfileSetupScreen } from '../screens/profile/PlannerProfileSetupScreen';
import { TravelerProfileSetupScreen } from '../screens/profile/TravelerProfileSetupScreen';
import { OtpVerificationScreen } from '../screens/profile/OtpVerificationScreen';
import type { ProfileSetupStackParamList } from '../types';

const Stack = createNativeStackNavigator<ProfileSetupStackParamList>();

export function ProfileSetupStack() {
  const role = useAuthStore((s) => s.role);
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'fade_from_bottom',
        contentStyle: { backgroundColor: colors.surface },
      }}
    >
      {role === 'planner' ? (
        <>
          <Stack.Screen name="PlannerProfileSetup" component={PlannerProfileSetupScreen} />
          <Stack.Screen name="OtpVerification" component={OtpVerificationScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="TravelerProfileSetup" component={TravelerProfileSetupScreen} />
          <Stack.Screen name="OtpVerification" component={OtpVerificationScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
