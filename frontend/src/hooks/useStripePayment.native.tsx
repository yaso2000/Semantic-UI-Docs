import React from 'react';
import { StripeProvider, useStripe } from '@stripe/stripe-react-native';

// Native implementation - Stripe available
export function useStripePayment() {
  const stripe = useStripe();
  return {
    initPaymentSheet: stripe.initPaymentSheet,
    presentPaymentSheet: stripe.presentPaymentSheet,
    isAvailable: true,
  };
}

export function StripeWrapper({ children, publishableKey }: { children: React.ReactNode; publishableKey: string }) {
  return <StripeProvider publishableKey={publishableKey}>{children}</StripeProvider>;
}
