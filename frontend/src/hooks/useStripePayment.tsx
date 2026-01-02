import { Platform } from 'react-native';

// Export a hook that returns null functions on web
export function useStripePayment() {
  // On web, return null functions
  if (Platform.OS === 'web') {
    return {
      initPaymentSheet: null,
      presentPaymentSheet: null,
      isAvailable: false,
    };
  }

  // On native, try to use Stripe
  try {
    const { useStripe } = require('@stripe/stripe-react-native');
    const stripe = useStripe();
    return {
      initPaymentSheet: stripe.initPaymentSheet,
      presentPaymentSheet: stripe.presentPaymentSheet,
      isAvailable: true,
    };
  } catch (e) {
    return {
      initPaymentSheet: null,
      presentPaymentSheet: null,
      isAvailable: false,
    };
  }
}

// Export a wrapper component
export function StripeWrapper({ children, publishableKey }: { children: React.ReactNode; publishableKey: string }) {
  if (Platform.OS === 'web') {
    return <>{children}</>;
  }

  try {
    const { StripeProvider } = require('@stripe/stripe-react-native');
    return <StripeProvider publishableKey={publishableKey}>{children}</StripeProvider>;
  } catch (e) {
    return <>{children}</>;
  }
}
