import React from 'react';
import { View } from 'react-native';

// Native implementation - Stripe disabled to avoid SDK errors
// Payment will be handled manually

export function useStripePayment() {
  return {
    initPaymentSheet: async () => ({ error: { message: 'Manual payment only' } }),
    presentPaymentSheet: async () => ({ error: { message: 'Manual payment only' } }),
    isAvailable: false,
  };
}

export function StripeWrapper({ children, publishableKey }: { children: React.ReactNode; publishableKey: string }) {
  // Return children without Stripe wrapper
  return <>{children}</>;
}
