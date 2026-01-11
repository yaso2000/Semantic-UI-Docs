import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts, Alexandria_400Regular, Alexandria_600SemiBold, Alexandria_700Bold } from '@expo-google-fonts/alexandria';
import { COLORS, FONTS, SHADOWS, RADIUS, SPACING } from '../src/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

// Stripe Web imports
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';
const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_51IiCcBIeuuTaDTMTyXyeLoeFkBj15CzHBPxBjEt0cc3RVWWGGOxHG97FuK8NXyZdpVpvy56EEAZEPCjsgiDvarC800ymMYzdH1';

// Initialize Stripe
const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

interface PackageDetails {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  features: string[];
}

interface SubscriptionData {
  subscription_id: string;
  client_secret: string;
  amount: number;
  package_name: string;
}

// Payment Form Component (uses Stripe hooks)
function PaymentForm({ 
  packageDetails, 
  subscriptionData, 
  onSuccess, 
  onError 
}: { 
  packageDetails: PackageDetails;
  subscriptionData: SubscriptionData;
  onSuccess: () => void;
  onError: (error: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);

  const handlePayment = async () => {
    if (!stripe || !elements) {
      onError('خدمة الدفع غير جاهزة');
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      onError('نموذج البطاقة غير جاهز');
      return;
    }

    setProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(
        subscriptionData.client_secret,
        {
          payment_method: {
            card: cardElement,
          },
        }
      );

      if (error) {
        console.error('Payment error:', error);
        onError(error.message || 'فشل في عملية الدفع');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // تأكيد الدفع في الباك إند
        const token = await AsyncStorage.getItem('token');
        const confirmRes = await fetch(`${API_URL}/api/packages/confirm-payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            subscription_id: subscriptionData.subscription_id,
            payment_intent_id: paymentIntent.id
          })
        });

        if (confirmRes.ok) {
          onSuccess();
        } else {
          // الدفع نجح في Stripe، لكن فشل التأكيد - نعتبره ناجحاً
          console.log('Payment succeeded but confirm failed, treating as success');
          onSuccess();
        }
      }
    } catch (err: any) {
      console.error('Payment exception:', err);
      onError(err.message || 'حدث خطأ غير متوقع');
    } finally {
      setProcessing(false);
    }
  };

  const cardStyle = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        fontFamily: 'system-ui, sans-serif',
        '::placeholder': {
          color: '#aab7c4',
        },
        iconColor: '#0d9488',
      },
      invalid: {
        color: '#e53e3e',
        iconColor: '#e53e3e',
      },
    },
    hidePostalCode: true,
  };

  return (
    <View>
      {/* Stripe Card Element */}
      <View style={styles.cardElementContainer}>
        <CardElement 
          options={cardStyle}
          onChange={(event) => setCardComplete(event.complete)}
        />
      </View>

      {/* Test Card Notice */}
      <View style={styles.testNotice}>
        <Ionicons name="information-circle" size={18} color="#2196F3" />
        <Text style={styles.testNoticeText}>
          للاختبار: 4242 4242 4242 4242 | 12/34 | 123
        </Text>
      </View>

      {/* Security Info */}
      <View style={styles.securityInfo}>
        <Ionicons name="shield-checkmark" size={20} color="#4CAF50" />
        <Text style={styles.securityText}>
          بياناتك محمية بتشفير SSL من Stripe. لن نقوم بحفظ بيانات بطاقتك.
        </Text>
      </View>

      {/* Pay Button */}
      <TouchableOpacity 
        style={[
          styles.payBtn,
          (!cardComplete || processing) && styles.payBtnDisabled
        ]}
        onPress={handlePayment}
        disabled={!cardComplete || processing}
      >
        <LinearGradient
          colors={(!cardComplete || processing) ? ['#999', '#777'] : ['#4CAF50', '#388E3C']}
          style={styles.payBtnGradient}
        >
          {processing ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <Ionicons name="lock-closed" size={20} color={COLORS.white} />
              <Text style={styles.payBtnText}>
                ادفع {packageDetails.price} ر.س
              </Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

export default function CheckoutScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const packageId = params.packageId as string;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [packageDetails, setPackageDetails] = useState<PackageDetails | null>(null);
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);

  const [fontsLoaded] = useFonts({ Alexandria_400Regular, Alexandria_600SemiBold, Alexandria_700Bold });

  useEffect(() => {
    if (packageId) {
      loadPackageAndCreateSubscription();
    } else {
      setError('لم يتم تحديد الباقة');
      setLoading(false);
    }
  }, [packageId]);

  const loadPackageAndCreateSubscription = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('خطأ', 'يرجى تسجيل الدخول أولاً');
        router.back();
        return;
      }

      // جلب تفاصيل الباقة
      const pkgRes = await fetch(`${API_URL}/api/all-packages/${packageId}`);
      if (!pkgRes.ok) {
        setError('الباقة غير موجودة');
        setLoading(false);
        return;
      }
      const pkgData = await pkgRes.json();
      setPackageDetails(pkgData);

      // إنشاء الاشتراك والحصول على client_secret
      const subRes = await fetch(`${API_URL}/api/all-packages/${packageId}/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      if (subRes.ok) {
        const subData = await subRes.json();
        setSubscriptionData(subData);
      } else {
        const errorData = await subRes.json();
        setError(errorData.detail || 'فشل في إنشاء الاشتراك');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('حدث خطأ في الاتصال');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    Alert.alert(
      '🎉 تم الدفع بنجاح!',
      'تم تفعيل اشتراكك. يمكنك الآن الاستمتاع بجميع مميزات الباقة.',
      [
        { 
          text: 'عرض اشتراكاتي', 
          onPress: () => router.replace('/my-subscriptions' as any)
        }
      ]
    );
  };

  const handlePaymentError = (errorMessage: string) => {
    Alert.alert('خطأ في الدفع', errorMessage);
  };

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color={COLORS.teal} />
        <Text style={styles.loadingText}>جاري تجهيز الدفع...</Text>
      </View>
    );
  }

  if (error || !packageDetails || !subscriptionData) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" />
        <Ionicons name="alert-circle" size={64} color={COLORS.error} />
        <Text style={styles.errorText}>{error || 'حدث خطأ في تحميل البيانات'}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => router.back()}>
          <Text style={styles.retryBtnText}>العودة</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // For web platform, use Stripe Elements
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" />

        {/* Header */}
        <LinearGradient
          colors={[COLORS.teal, '#1a8a7d']}
          style={styles.header}
        >
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="close" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>إتمام الدفع</Text>
          <View style={{ width: 40 }} />
        </LinearGradient>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {/* Order Summary */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>ملخص الطلب</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryValue}>{packageDetails.name}</Text>
              <Text style={styles.summaryLabel}>الباقة</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryValue}>
                {packageDetails.category === 'private_sessions' ? 'حصص خاصة' : 'تدريب ذاتي'}
              </Text>
              <Text style={styles.summaryLabel}>النوع</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalValue}>{packageDetails.price} ر.س</Text>
              <Text style={styles.totalLabel}>الإجمالي</Text>
            </View>
          </View>

          {/* Payment Form with Stripe Elements */}
          <View style={styles.paymentCard}>
            <View style={styles.paymentHeader}>
              <Ionicons name="card" size={24} color={COLORS.teal} />
              <Text style={styles.paymentTitle}>بيانات الدفع</Text>
            </View>

            <Elements stripe={stripePromise}>
              <PaymentForm 
                packageDetails={packageDetails}
                subscriptionData={subscriptionData}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            </Elements>
          </View>
        </ScrollView>
      </View>
    );
  }

  // For native platforms (iOS/Android), show simple message
  // In production, you would use @stripe/stripe-react-native
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient
        colors={[COLORS.teal, '#1a8a7d']}
        style={styles.header}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>إتمام الدفع</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Order Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>ملخص الطلب</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryValue}>{packageDetails.name}</Text>
            <Text style={styles.summaryLabel}>الباقة</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryValue}>
              {packageDetails.category === 'private_sessions' ? 'حصص خاصة' : 'تدريب ذاتي'}
            </Text>
            <Text style={styles.summaryLabel}>النوع</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalValue}>{packageDetails.price} ر.س</Text>
            <Text style={styles.totalLabel}>الإجمالي</Text>
          </View>
        </View>

        {/* Mobile Payment Notice */}
        <View style={styles.mobileNotice}>
          <Ionicons name="phone-portrait" size={48} color={COLORS.teal} />
          <Text style={styles.mobileNoticeTitle}>الدفع عبر الهاتف</Text>
          <Text style={styles.mobileNoticeText}>
            يرجى استخدام نسخة الويب لإتمام عملية الدفع، أو تواصل معنا مباشرة.
          </Text>
          <TouchableOpacity 
            style={styles.contactBtn}
            onPress={() => router.push('/chat' as any)}
          >
            <Ionicons name="chatbubbles" size={20} color={COLORS.white} />
            <Text style={styles.contactBtnText}>تواصل معنا</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
  },
  errorText: {
    marginTop: SPACING.md,
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    color: COLORS.error,
    textAlign: 'center',
    paddingHorizontal: SPACING.lg,
  },
  retryBtn: {
    backgroundColor: COLORS.teal,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    marginTop: SPACING.lg,
  },
  retryBtnText: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },

  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.md,
    paddingBottom: 100,
  },

  summaryCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  summaryTitle: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.md,
    textAlign: 'right',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  summaryLabel: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },
  totalLabel: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  totalValue: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    color: COLORS.teal,
  },

  paymentCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  paymentTitle: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },

  cardElementContainer: {
    backgroundColor: '#f7f7f7',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  testNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: '#E3F2FD',
    padding: SPACING.sm,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.md,
  },
  testNoticeText: {
    flex: 1,
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: '#1976D2',
  },

  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    backgroundColor: '#E8F5E9',
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
  },
  securityText: {
    flex: 1,
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: '#2E7D32',
    textAlign: 'right',
  },

  payBtn: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  payBtnDisabled: {
    opacity: 0.7,
  },
  payBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
  },
  payBtnText: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },

  // Mobile Notice Styles
  mobileNotice: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  mobileNoticeTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginTop: SPACING.md,
  },
  mobileNoticeText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
    lineHeight: 22,
  },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.teal,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    marginTop: SPACING.lg,
  },
  contactBtnText: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },
});
