// Web-specific implementation - always return unavailable
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
