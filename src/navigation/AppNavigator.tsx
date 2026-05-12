// REMOVED: messaging feature — Nazary v1
// Conversations and Chat screens removed from navigation
import React from 'react';
import { Keyboard } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../theme';
import { useAuthStore } from '../store';
import { LoadingScreen } from '../components/LoadingScreen';
import { AuthStack } from './AuthStack';
import { ProfileSetupStack } from './ProfileSetupStack';
import { TravelerTabs } from './TravelerTabs';
import { PlannerTabs } from './PlannerTabs';
import { TripDetailsScreen } from '../screens/TripDetailsScreen';
import { CreateTripRequestScreen } from '../screens/tripRequests/CreateTripRequestScreen';
import { MyTripRequestsScreen } from '../screens/tripRequests/MyTripRequestsScreen';
import { IncomingRequestsScreen } from '../screens/tripRequests/IncomingRequestsScreen';
import { TripRequestDetailScreen } from '../screens/tripRequests/TripRequestDetailScreen';
import { NotificationsScreen } from '../screens/notifications/NotificationsScreen';
import { AgencyDetailScreen } from '../screens/agencies/AgencyDetailScreen';
import { WriteReviewScreen } from '../screens/reviews/WriteReviewScreen';
import { PlacesScreen } from '../screens/places/PlacesScreen';
import { PlaceDetailScreen } from '../screens/places/PlaceDetailScreen';
// REMOVED: bike trips feature — Nazary v1
// import { BikeTripsScreen } from '../screens/bike/BikeTripsScreen';
// import { BikeTripDetailScreen } from '../screens/bike/BikeTripDetailScreen';
// import { BikeRidersScreen } from '../screens/bike/BikeRidersScreen';
// import { BikeProfileSetupScreen } from '../screens/bike/BikeProfileSetupScreen';
// import { PremiumPaywallScreen } from '../screens/bike/PremiumPaywallScreen';
import { ArrangeATripScreen } from '../screens/arrangements/ArrangeATripScreen';
import { MyArrangementsScreen } from '../screens/arrangements/MyArrangementsScreen';
import { CreateTripScreen } from '../screens/planner/CreateTripScreen';
import { BookingRequestsScreen } from '../screens/planner/BookingRequestsScreen';
import { EditPlannerProfileScreen } from '../screens/planner/EditPlannerProfileScreen';
import { CoupleRequestScreen } from '../screens/couples/CoupleRequestScreen';
import { CorporateTripRequestScreen } from '../screens/corporate/CorporateTripRequestScreen';
import { MyCorporateRequestsScreen } from '../screens/corporate/MyCorporateRequestsScreen';
import { RewardsScreen } from '../screens/rewards/RewardsScreen';
import { SettingsScreen } from '../screens/traveler/SettingsScreen';
import { AboutScreen } from '../screens/info/AboutScreen';
import { PaymentInfoScreen } from '../screens/traveler/PaymentInfoScreen';
import { SubmitPaymentProofScreen } from '../screens/traveler/SubmitPaymentProofScreen';
import type { RootStackParamList } from '../types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const slideOptions = { animation: 'slide_from_right' as const, gestureEnabled: true };

export function AppNavigator() {
  const { isAuthenticated, isLoading, role, profileCompleted } = useAuthStore();
  const { colors } = useTheme();

  if (isLoading) {
    return <LoadingScreen />;
  }

  const renderMainScreens = () => (
    <>
      <Stack.Screen name="TripDetails" component={TripDetailsScreen} options={slideOptions} />
      {/* REMOVED: messaging feature — Nazary v1 */}
      <Stack.Screen name="CreateTripRequest" component={CreateTripRequestScreen} options={slideOptions} />
      <Stack.Screen name="MyTripRequests" component={MyTripRequestsScreen} options={slideOptions} />
      <Stack.Screen name="IncomingRequests" component={IncomingRequestsScreen} options={slideOptions} />
      <Stack.Screen name="TripRequestDetail" component={TripRequestDetailScreen} options={slideOptions} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={slideOptions} />
      <Stack.Screen name="AgencyDetail" component={AgencyDetailScreen} options={slideOptions} />
      <Stack.Screen name="PlannerPublicProfile" component={AgencyDetailScreen} options={slideOptions} />
      <Stack.Screen name="WriteReview" component={WriteReviewScreen} options={slideOptions} />
      <Stack.Screen name="Places" component={PlacesScreen} options={slideOptions} />
      <Stack.Screen name="PlaceDetail" component={PlaceDetailScreen} options={slideOptions} />
      {/* REMOVED: bike trips feature — Nazary v1 */}
      {/* <Stack.Screen name="BikeTrips" component={BikeTripsScreen} options={slideOptions} /> */}
      {/* <Stack.Screen name="BikeTripDetail" component={BikeTripDetailScreen} options={slideOptions} /> */}
      {/* <Stack.Screen name="BikeRiders" component={BikeRidersScreen} options={slideOptions} /> */}
      {/* <Stack.Screen name="BikeProfileSetup" component={BikeProfileSetupScreen} options={slideOptions} /> */}
      {/* <Stack.Screen name="PremiumPaywall" component={PremiumPaywallScreen} options={{ animation: 'fade_from_bottom', gestureEnabled: true }} /> */}
      <Stack.Screen name="ArrangeATrip" component={ArrangeATripScreen} options={slideOptions} />
      <Stack.Screen name="MyArrangements" component={MyArrangementsScreen} options={slideOptions} />
      <Stack.Screen name="CreateTrip" component={CreateTripScreen} options={slideOptions} />
      <Stack.Screen name="BookingRequests" component={BookingRequestsScreen} options={slideOptions} />
      <Stack.Screen name="EditPlannerProfile" component={EditPlannerProfileScreen} options={slideOptions} />
      <Stack.Screen name="CoupleRequest" component={CoupleRequestScreen} options={slideOptions} />
      <Stack.Screen name="CorporateTripRequest" component={CorporateTripRequestScreen} options={slideOptions} />
      <Stack.Screen name="MyCorporateRequests" component={MyCorporateRequestsScreen} options={slideOptions} />
      <Stack.Screen name="Rewards" component={RewardsScreen} options={slideOptions} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={slideOptions} />
      <Stack.Screen name="AboutUs" component={AboutScreen} options={slideOptions} />
      <Stack.Screen name="PaymentInfo" component={PaymentInfoScreen} options={slideOptions} />
      <Stack.Screen name="SubmitPaymentProof" component={SubmitPaymentProofScreen} options={slideOptions} />
    </>
  );

  return (
    <NavigationContainer onStateChange={() => Keyboard.dismiss()}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'fade_from_bottom',
          contentStyle: { backgroundColor: colors.surface },
        }}
      >
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthStack} />
        ) : !profileCompleted ? (
          <Stack.Screen name="ProfileSetup" component={ProfileSetupStack} />
        ) : role === 'planner' ? (
          <>
            <Stack.Screen name="PlannerTabs" component={PlannerTabs} />
            {renderMainScreens()}
          </>
        ) : (
          <>
            <Stack.Screen name="TravelerTabs" component={TravelerTabs} />
            {renderMainScreens()}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
