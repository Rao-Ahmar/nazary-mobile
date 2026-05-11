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

/**
 * Per-screen tour guide hook.
 *
 * @param screenKey  Unique key for this screen, e.g. 'traveler_home'
 * @param refs       One ref per step (null = no spotlight / welcome card)
 * @param stepDefs   Step definitions (id, title, description, icon)
 */
export function useTourGuide(
  screenKey: string,
  refs: (RefObject<View | null> | null)[],
  stepDefs: StepDef[],
) {
  const done = useTourStore((s) => s.isScreenDone(screenKey));
  const completeScreenAction = useTourStore((s) => s.completeScreen);
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
    completeScreenAction(screenKey);
  }, [screenKey, completeScreenAction]);

  return { tourVisible, tourSteps, completeTour };
}
