import { Stack, useLocalSearchParams } from 'expo-router';

import { PaywallView } from '@/features/purchases/components/PaywallView';

export default function PaywallScreen() {
  const { openedFrom } = useLocalSearchParams<{ openedFrom?: string }>();

  return (
    <>
      <Stack.Screen options={{ headerShown: false, presentation: 'modal' }} />
      <PaywallView openedFrom={openedFrom} />
    </>
  );
}
