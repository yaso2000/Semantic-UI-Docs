import React from 'react';

// Web implementation - Stripe not available
export function useStripePayment() {
  return {
    initPaymentSheet: null,
    presentPaymentSheet: null,
    isAvailable: false,
  };
}

export function StripeWrapper({ children }: { children: React.ReactNode; publishableKey: string }) {
  return <>{children}</>;
}
