import { useEffect, useState, useCallback, type RefObject } from 'react';
import { type View } from 'react-native';
import { useTourStore } from '../../store/tourStore';
import type { TourStep } from './TourOverlay';

interface StepDef {
  id: string;
  title: string;
  description: string;
  icon: TourStep['icon'];
}

export function useTourGuide(
  role: 'traveler' | 'planner',
  refs: (RefObject<View | null> | null)[],
  stepDefs: StepDef[],
) {
  const done = useTourStore((s) => (role === 'traveler' ? s.travelerDone : s.plannerDone));
  const completeTourAction = useTourStore((s) => s.completeTour);
  const [tourVisible, setTourVisible] = useState(false);

  useEffect(() => {
    if (done) return;
    const timer = setTimeout(() => {
      setTourVisible(true);
    }, 800);
    return () => clearTimeout(timer);
  }, [done]);

  const tourSteps: TourStep[] = stepDefs.map((def, i) => ({
    ...def,
    targetRef: refs[i] ?? null,
  }));

  const completeTour = useCallback(() => {
    setTourVisible(false);
    completeTourAction(role);
  }, [role, completeTourAction]);

  return { tourVisible, tourSteps, completeTour };
}
