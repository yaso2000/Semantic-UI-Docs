import React from 'react';
import { View } from 'react-native';

// Native implementation - Stripe might not be fully available
// Using a safe fallback approach

let StripeModule: any = null;
let isStripeAvailable = false;

try {
  // Try to import Stripe dynamically
  StripeModule = require('@stripe/stripe-react-native');
  isStripeAvailable = true;
} catch (error) {
  console.log('Stripe native module not available:', error);
  isStripeAvailable = false;
}

export function useStripePayment() {
  if (!isStripeAvailable || !StripeModule) {
    return {
      initPaymentSheet: async () => ({ error: { message: 'Stripe not available' } }),
      presentPaymentSheet: async () => ({ error: { message: 'Stripe not available' } }),
      isAvailable: false,
    };
  }

  try {
    const stripe = StripeModule.useStripe();
    return {
      initPaymentSheet: stripe.initPaymentSheet,
      presentPaymentSheet: stripe.presentPaymentSheet,
      isAvailable: true,
    };
  } catch (error) {
    return {
      initPaymentSheet: async () => ({ error: { message: 'Stripe hook error' } }),
      presentPaymentSheet: async () => ({ error: { message: 'Stripe hook error' } }),
      isAvailable: false,
    };
  }
}

export function StripeWrapper({ children, publishableKey }: { children: React.ReactNode; publishableKey: string }) {
  if (!isStripeAvailable || !StripeModule || !StripeModule.StripeProvider) {
    // Return children without Stripe wrapper if not available
    return <View style={{ flex: 1 }}>{children}</View>;
  }

  const { StripeProvider } = StripeModule;
  return <StripeProvider publishableKey={publishableKey}>{children}</StripeProvider>;
}
