import { type Colors } from '../theme';

export type Category = {
  key: string;
  label: string;
  tag: string;
  icon: string;
};

export const CATEGORIES: Category[] = [
  { key: 'luxury', label: 'Luxury', tag: 'Luxury', icon: 'diamond-outline' },
  { key: 'party', label: 'Party', tag: 'Party', icon: 'musical-notes-outline' },
  { key: 'adventures', label: 'Adventures', tag: 'Adventures', icon: 'compass-outline' },
  { key: 'budget_friendly', label: 'Budget Friendly', tag: 'Budget Friendly', icon: 'wallet-outline' },
  { key: 'couple_trips', label: 'Couple Trips', tag: 'Couple Trips', icon: 'heart-outline' },
  { key: 'family_trips', label: 'Family Trips', tag: 'Family Trips', icon: 'people-outline' },
  { key: 'friends_trips', label: 'Friends Trips', tag: 'Friends Trips', icon: 'beer-outline' },
];

export const CATEGORIES_WITH_ALL: ({ key: string; label: string; tag: string; icon: string })[] = [
  { key: 'all', label: 'All', tag: '', icon: 'apps-outline' },
  ...CATEGORIES,
];

export const CATEGORY_TAGS: string[] = CATEGORIES.map((c) => c.tag);

export function getCategoryBadgeConfig(colors: Colors): Record<string, { bg: string; text: string }> {
  return {
    Luxury: { bg: colors.luxuryBg, text: colors.luxuryColor },
    Party: { bg: colors.partyBg, text: colors.partyColor },
    Adventures: { bg: colors.adventuresBg, text: colors.adventuresColor },
    'Budget Friendly': { bg: colors.budgetFriendlyBg, text: colors.budgetFriendlyColor },
    'Couple Trips': { bg: colors.coupleTripsBg, text: colors.coupleTripsColor },
    'Family Trips': { bg: colors.familyTripsBg, text: colors.familyTripsColor },
    'Friends Trips': { bg: colors.friendsTripsBg, text: colors.friendsTripsColor },
  };
}
