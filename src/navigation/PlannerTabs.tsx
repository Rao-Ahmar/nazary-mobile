// REMOVED: messaging feature — Nazary v1
// Messages tab removed, Requests tab remains
import React from 'react';
import { StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';
import { TabBarIcon } from '../components/TabBarIcon';
import { DashboardScreen } from '../screens/planner/DashboardScreen';
import { ManageTripsScreen } from '../screens/planner/ManageTripsScreen';
import { IncomingRequestsScreen } from '../screens/tripRequests/IncomingRequestsScreen';
import { PlannerProfileScreen } from '../screens/planner/PlannerProfileScreen';
import type { PlannerTabParamList } from '../types';

const Tab = createBottomTabNavigator<PlannerTabParamList>();

export function PlannerTabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.outline,
        tabBarLabelStyle: {
          fontFamily: 'Inter_400Regular',
          fontSize: 10,
          letterSpacing: 0.3,
          marginTop: -2,
        },
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: Platform.OS === 'ios' ? 'transparent' : colors.surfaceContainerLowest,
          borderTopWidth: 0,
          elevation: 0,
          height: 60 + insets.bottom,
          paddingTop: 8,
          ...Platform.select({
            ios: {
              shadowColor: '#1a1c1d',
              shadowOffset: { width: 0, height: -8 },
              shadowOpacity: 0.03,
              shadowRadius: 16,
            },
          }),
        },
        tabBarBackground: () =>
          Platform.OS === 'ios' ? (
            <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFill} />
          ) : null,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name={focused ? 'grid' : 'grid-outline'} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="ManageTrips"
        component={ManageTripsScreen}
        options={{
          title: 'Trips',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name={focused ? 'map' : 'map-outline'} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Requests"
        component={IncomingRequestsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name={focused ? 'document-text' : 'document-text-outline'} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={PlannerProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name={focused ? 'person' : 'person-outline'} focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
