// REMOVED: messaging feature — Nazary v1
// Messages tab replaced with Places tab
import React from 'react';
import { StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { TabBarIcon } from '../components/TabBarIcon';
import { HomeScreen } from '../screens/traveler/HomeScreen';
import { SearchScreen } from '../screens/traveler/SearchScreen';
import { MyTripsScreen } from '../screens/traveler/MyTripsScreen';
import { AgenciesListScreen } from '../screens/agencies/AgenciesListScreen';
import { ProfileScreen } from '../screens/traveler/ProfileScreen';
import type { TravelerTabParamList } from '../types';

const Tab = createBottomTabNavigator<TravelerTabParamList>();

export function TravelerTabs() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarHideOnKeyboard: true,
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
              shadowColor: isDark ? '#000000' : '#1a1c1d',
              shadowOffset: { width: 0, height: -8 },
              shadowOpacity: isDark ? 0.2 : 0.03,
              shadowRadius: 16,
            },
          }),
        },
        tabBarBackground: () =>
          Platform.OS === 'ios' ? (
            <BlurView intensity={60} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
          ) : null,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name={focused ? 'compass' : 'compass-outline'} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name={focused ? 'search' : 'search-outline'} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="MyTrips"
        component={MyTripsScreen}
        options={{
          title: 'My Trips',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name={focused ? 'map' : 'map-outline'} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Agencies"
        component={AgenciesListScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name={focused ? 'business' : 'business-outline'} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name={focused ? 'person' : 'person-outline'} focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
