import { create } from 'zustand';
import type { BikeProfile, BikeRider, Trip } from '../types';

const mockBikeTrips: Trip[] = [
  {
    id: 'bike-1',
    title: 'Karakoram Highway Ride',
    subtitle: 'The Ultimate Motorcycle Adventure',
    description: 'Ride the legendary Karakoram Highway from Islamabad to Khunjerab Pass.',
    location: 'Karakoram Highway, Pakistan',
    heroImage: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&q=80',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80',
    ],
    price: 1800,
    currency: 'PKR',
    duration: '10 days',
    dates: 'Jul 15 - 24',
    totalSeats: 8,
    seatsLeft: 5,
    status: 'active',
    tags: ['Bike', 'Adventure', 'Mountain'],
    rating: 4.8,
    reviewCount: 12,
    host: { id: '2', name: 'Fatima Khan', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80', guild: 'Northern Explorers', rating: 4.9 },
    highlights: ['Ride the highest paved road in the world', 'Cross Khunjerab Pass at 4,693m', 'Camp by Attabad Lake'],
    itinerary: [
      { day: '1', title: 'Islamabad Departure', desc: 'Gear check, briefing, ride to Abbottabad' },
      { day: '2', title: 'Mansehra to Chilas', desc: 'Enter the Karakoram range' },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'bike-2',
    title: 'Deosai Plateau Expedition',
    subtitle: 'Ride the Roof of the World',
    description: 'Cross the second highest plateau in the world on your motorcycle.',
    location: 'Deosai National Park, Pakistan',
    heroImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
    gallery: [],
    price: 1200,
    currency: 'PKR',
    duration: '5 days',
    dates: 'Aug 1 - 5',
    totalSeats: 6,
    seatsLeft: 4,
    status: 'active',
    tags: ['Bike', 'Adventure', 'Wildlife'],
    rating: 4.7,
    reviewCount: 8,
    host: { id: '1', name: 'Alex Romanov', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80', guild: 'Nazary Private Guild', rating: 4.9 },
    highlights: ['Traverse Deosai Plains at 4,114m', 'Spot Himalayan brown bears', 'Camp under starlit skies'],
    itinerary: [
      { day: '1', title: 'Skardu Base Camp', desc: 'Arrival and bike checks' },
      { day: '2', title: 'Enter Deosai', desc: 'Ride across the plateau' },
    ],
    createdAt: new Date().toISOString(),
  },
];

const mockRiders: BikeRider[] = [
  {
    id: '1',
    userId: 'dev-traveler',
    userName: 'Alex Traveler',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
    bikeModel: 'Honda CG 125',
    bikeCc: 125,
    experienceLevel: 'intermediate',
    bio: 'Weekend rider exploring Pakistan\'s highways.',
  },
  {
    id: '2',
    userId: '3',
    userName: 'Ahmed Raza',
    userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80',
    bikeModel: 'Suzuki GS 150',
    bikeCc: 150,
    experienceLevel: 'beginner',
    bio: 'New to bike touring, excited to join group rides!',
  },
];

interface BikeState {
  bikeTrips: Trip[];
  bikeRiders: BikeRider[];
  bikeProfile: BikeProfile | null;
  isPremiumUnlocked: boolean;
  isLoading: boolean;

  fetchBikeTrips: () => Promise<void>;
  fetchRiders: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  setPremium: (value: boolean) => void;
  setBikeProfile: (profile: BikeProfile) => void;
}

export const useBikeStore = create<BikeState>((set) => ({
  bikeTrips: mockBikeTrips,
  bikeRiders: mockRiders,
  bikeProfile: null,
  isPremiumUnlocked: true, // Dev bypass
  isLoading: false,

  fetchBikeTrips: async () => {
    set({ isLoading: true });
    await new Promise((r) => setTimeout(r, 300));
    set({ isLoading: false });
  },

  fetchRiders: async () => {
    set({ isLoading: true });
    await new Promise((r) => setTimeout(r, 300));
    set({ isLoading: false });
  },

  fetchProfile: async () => {
    set({ isLoading: true });
    await new Promise((r) => setTimeout(r, 300));
    set({ isLoading: false });
  },

  setPremium: (value) => set({ isPremiumUnlocked: value }),
  setBikeProfile: (profile) => set({ bikeProfile: profile }),
}));
