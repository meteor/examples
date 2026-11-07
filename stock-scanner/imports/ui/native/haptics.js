import { Haptics, ImpactStyle } from '@capacitor/haptics';

export async function impactLight() {
  await Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
}
