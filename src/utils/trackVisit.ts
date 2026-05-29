import { supabase } from './supabase';

const VISIT_TRACKED_KEY = 'ck_visit_tracked';

type DeviceType = 'mobile' | 'desktop' | 'unknown';

function hasTrackedVisit(): boolean {
  try {
    return sessionStorage.getItem(VISIT_TRACKED_KEY) !== null;
  } catch {
    return false;
  }
}

function markVisitTracked(): void {
  try {
    sessionStorage.setItem(VISIT_TRACKED_KEY, '1');
  } catch (err) {
    console.warn('Could not store visit tracking flag:', err);
  }
}

function getDeviceType(): DeviceType {
  try {
    const userAgent = navigator.userAgent || '';
    return /android|iphone|ipad|ipod|mobile|blackberry|iemobile|opera mini/i.test(userAgent)
      ? 'mobile'
      : 'desktop';
  } catch {
    return 'unknown';
  }
}

export async function trackVisit(): Promise<void> {
  if (hasTrackedVisit()) {
    return;
  }

  if (!supabase) {
    console.warn('Visit tracking skipped: Supabase client is not configured.');
    return;
  }

  const device_type = getDeviceType();

  try {
    const { error } = await supabase
      .from('site_visits')
      .insert({ page: 'home', device_type });

    if (error) {
      console.warn('Visit tracking failed:', error);
      return;
    }

    markVisitTracked();
  } catch (err) {
    console.warn('Visit tracking failed:', err);
  }
}
