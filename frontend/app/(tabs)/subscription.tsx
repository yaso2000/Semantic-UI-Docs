import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Cairo_400Regular, Cairo_700Bold } from '@expo-google-fonts/cairo';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';
const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';

// Conditionally import Stripe only on native platforms
let StripeProvider: any = null;
let useStripe: any = null;

if (Platform.OS !== 'web') {
  try {
    const stripe = require('@stripe/stripe-react-native');
    StripeProvider = stripe.StripeProvider;
    useStripe = stripe.useStripe;
  } catch (e) {
    console.log('Stripe not available');
  }
}

interface Subscription {
  id: string;
  plan: string;
  status: string;
  start_date: string;
  end_date: string;
  amount: number;
}

const plans = [
  {
    id: 'monthly_basic',
    name: 'الاشتراك الشهري',
    price: 29.99,
    period: 'شهر',
    features: [
      'ظهور في قائمة المدربين',
      'استقبال حجوزات غير محدودة',
      'محادثة مع المتدربين',
      'لوحة تحكم كاملة',
    ],
  },
  {
    id: 'monthly_premium',
    name: 'الاشتراك المميز',
    price: 49.99,
    period: 'شهر',
    features: [
      'جميع مميزات الاشتراك الأساسي',
      'أولوية في الظهور',
      'شارة مدرب مميز',
      'تحليلات متقدمة',
      'دعم فني مخصص',
    ],
    popular: true,
  },
];

function SubscriptionContent() {
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  
  // Use Stripe hooks only on native
  const stripeHooks = Platform.OS !== 'web' && useStripe ? useStripe() : { initPaymentSheet: null, presentPaymentSheet: null };
  const { initPaymentSheet, presentPaymentSheet } = stripeHooks;

  const isStripeAvailable = Platform.OS !== 'web' && initPaymentSheet && presentPaymentSheet;

  const [fontsLoaded] = useFonts({ Cairo_400Regular, Cairo_700Bold });

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/coach/subscription`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCurrentSubscription(data);
      }
    } catch (error) {
      console.error('Error loading subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializePaymentSheet = async () => {
    if (!initPaymentSheet) return false;
    
    try {
      const token = await AsyncStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/api/subscriptions/create-setup-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to create setup intent');
      }

      const { setupIntent, ephemeralKey, customer } = await response.json();

      const { error } = await initPaymentSheet({
        merchantDisplayName: 'اسأل يازو',
        customerId: customer,
        customerEphemeralKeySecret: ephemeralKey,
        setupIntentClientSecret: setupIntent,
        returnURL: 'askyazo://subscription-complete',
      });

      if (error) {
        console.error('Error initializing payment sheet:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error setting up payment:', error);
      return false;
    }
  };

  const handleSubscribe = async (planId: string) => {
    setSelectedPlan(planId);
    const plan = plans.find(p => p.id === planId);
    
    Alert.alert(
      'تأكيد الاشتراك',
      `سيتم الاشتراك في خطة "${plan?.name}" بقيمة $${plan?.price}/${plan?.period}. هل تريد المتابعة؟`,
      [
        { text: 'إلغاء', style: 'cancel', onPress: () => setSelectedPlan(null) },
        {
          text: isStripeAvailable ? 'متابعة للدفع' : 'تواصل معنا',
          onPress: () => isStripeAvailable ? processPayment(planId) : handleManualSubscription(planId)
        }
      ]
    );
  };

  const handleManualSubscription = async (planId: string) => {
    // For web or when Stripe is not available
    setSubscribing(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/subscriptions/activate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ plan: planId })
      });

      if (response.ok) {
        Alert.alert(
          'تم طلب الاشتراك! 📧',
          'سيتم التواصل معك لترتيب الدفع وتفعيل اشتراكك.',
          [{ text: 'حسناً', onPress: () => loadSubscription() }]
        );
      } else {
        const error = await response.json();
        Alert.alert('خطأ', error.detail || 'فشل في طلب الاشتراك');
      }
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ في الاتصال');
    } finally {
      setSubscribing(false);
      setSelectedPlan(null);
    }
  };

  const processPayment = async (planId: string) => {
    if (!presentPaymentSheet) {
      handleManualSubscription(planId);
      return;
    }
    
    setSubscribing(true);
    try {
      // Initialize payment sheet
      const initialized = await initializePaymentSheet();
      
      if (!initialized) {
        Alert.alert('خطأ', 'فشل في تهيئة نظام الدفع. يرجى المحاولة مرة أخرى.');
        setSubscribing(false);
        setSelectedPlan(null);
        return;
      }

      // Present the payment sheet
      const { error } = await presentPaymentSheet();

      if (error) {
        if (error.code === 'Canceled') {
          setSubscribing(false);
          setSelectedPlan(null);
          return;
        }
        Alert.alert('خطأ في الدفع', error.message);
        setSubscribing(false);
        setSelectedPlan(null);
        return;
      }

      // Payment method added - activate subscription
      const token = await AsyncStorage.getItem('token');
      const activateResponse = await fetch(`${API_URL}/api/subscriptions/activate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ plan: planId })
      });

      if (activateResponse.ok) {
        Alert.alert(
          'تم الاشتراك بنجاح! 🎉',
          'مبروك! تم تفعيل اشتراكك وأصبحت الآن ظاهراً في قائمة المدربين.',
          [{ text: 'رائع', onPress: () => loadSubscription() }]
        );
      } else {
        const error = await activateResponse.json();
        Alert.alert('خطأ', error.detail || 'فشل في تفعيل الاشتراك');
      }
    } catch (error: any) {
      Alert.alert('خطأ', error.message || 'حدث خطأ في عملية الدفع');
    } finally {
      setSubscribing(false);
      setSelectedPlan(null);
    }
  };

  const handleCancelSubscription = () => {
    Alert.alert(
      'إلغاء الاشتراك',
      'هل أنت متأكد من إلغاء اشتراكك؟ ستفقد الوصول لجميع المميزات في نهاية فترة الفوترة الحالية.',
      [
        { text: 'لا، احتفظ باشتراكي', style: 'cancel' },
        {
          text: 'نعم، إلغاء',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              const response = await fetch(`${API_URL}/api/subscriptions/cancel`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
              });
              
              if (response.ok) {
                Alert.alert('تم', 'تم إلغاء اشتراكك. ستظل تتمتع بالمميزات حتى نهاية الفترة الحالية.');
                loadSubscription();
              }
            } catch (error) {
              Alert.alert('خطأ', 'فشل في إلغاء الاشتراك');
            }
          }
        }
      ]
    );
  };

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF9800" />
      </View>
    );
  }

  const isActive = currentSubscription?.status === 'active';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Ionicons name="card" size={40} color="#fff" />
          <Text style={styles.headerTitle}>اشتراك المدرب</Text>
          <Text style={styles.headerSubtitle}>
            {isActive ? 'اشتراكك فعال' : 'اشترك للظهور في قائمة المدربين'}
          </Text>
        </View>

        {isActive && currentSubscription && (
          <View style={styles.currentPlan}>
            <View style={styles.currentPlanHeader}>
              <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
              <Text style={styles.currentPlanTitle}>اشتراكك الحالي</Text>
            </View>
            <View style={styles.currentPlanDetails}>
              <Text style={styles.currentPlanName}>
                {currentSubscription.plan === 'monthly_premium' ? 'الاشتراك المميز' : 'الاشتراك الشهري'}
              </Text>
              <Text style={styles.currentPlanExpiry}>
                ينتهي في: {new Date(currentSubscription.end_date).toLocaleDateString('ar-SA')}
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.cancelBtn}
              onPress={handleCancelSubscription}
            >
              <Text style={styles.cancelBtnText}>إلغاء الاشتراك</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* معلومات الأمان */}
        <View style={styles.securityInfo}>
          <Ionicons name="shield-checkmark" size={20} color="#4CAF50" />
          <Text style={styles.securityText}>
            {isStripeAvailable 
              ? 'دفع آمن ومشفر عبر Stripe - لا نقوم بتخزين بيانات بطاقتك'
              : 'يمكنك الاشتراك عبر التطبيق على الهاتف أو التواصل معنا'
            }
          </Text>
        </View>

        <View style={styles.plansContainer}>
          <Text style={styles.sectionTitle}>خطط الاشتراك</Text>

          {plans.map((plan) => (
            <View
              key={plan.id}
              style={[
                styles.planCard,
                plan.popular && styles.planCardPopular
              ]}
            >
              {plan.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularText}>الأكثر شعبية</Text>
                </View>
              )}

              <Text style={styles.planName}>{plan.name}</Text>
              
              <View style={styles.priceContainer}>
                <Text style={styles.price}>${plan.price}</Text>
                <Text style={styles.period}>/{plan.period}</Text>
              </View>

              <View style={styles.featuresContainer}>
                {plan.features.map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={[
                  styles.subscribeBtn,
                  plan.popular && styles.subscribeBtnPopular,
                  (subscribing && selectedPlan === plan.id) && styles.subscribeBtnDisabled,
                  isActive && styles.subscribeBtnDisabled
                ]}
                onPress={() => handleSubscribe(plan.id)}
                disabled={subscribing || isActive}
              >
                {subscribing && selectedPlan === plan.id ? (
                  <ActivityIndicator color={plan.popular ? '#fff' : '#FF9800'} />
                ) : (
                  <View style={styles.subscribeBtnContent}>
                    <Ionicons 
                      name={isStripeAvailable ? "card" : "mail"} 
                      size={20} 
                      color={plan.popular ? '#fff' : '#FF9800'} 
                    />
                    <Text style={[
                      styles.subscribeBtnText,
                      plan.popular && styles.subscribeBtnTextPopular
                    ]}>
                      {isActive ? 'مشترك حالياً' : (isStripeAvailable ? 'اشترك الآن' : 'طلب اشتراك')}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* طرق الدفع المقبولة */}
        {isStripeAvailable && (
          <View style={styles.paymentMethods}>
            <Text style={styles.paymentMethodsTitle}>طرق الدفع المقبولة</Text>
            <View style={styles.paymentMethodsIcons}>
              <View style={styles.paymentIcon}>
                <Ionicons name="card" size={24} color="#1976D2" />
                <Text style={styles.paymentIconText}>Visa/MC</Text>
              </View>
              <View style={styles.paymentIcon}>
                <Ionicons name="logo-apple" size={24} color="#333" />
                <Text style={styles.paymentIconText}>Apple Pay</Text>
              </View>
              <View style={styles.paymentIcon}>
                <Ionicons name="logo-google" size={24} color="#EA4335" />
                <Text style={styles.paymentIconText}>Google Pay</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

export default function SubscriptionScreen() {
  // On web, don't wrap with StripeProvider
  if (Platform.OS === 'web' || !StripeProvider) {
    return <SubscriptionContent />;
  }

  return (
    <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
      <SubscriptionContent />
    </StripeProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    padding: 30,
    backgroundColor: '#FF9800',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Cairo_700Bold',
    color: '#fff',
    marginTop: 12,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Cairo_400Regular',
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  currentPlan: {
    backgroundColor: '#E8F5E9',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  currentPlanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  currentPlanTitle: {
    fontSize: 16,
    fontFamily: 'Cairo_700Bold',
    color: '#4CAF50',
  },
  currentPlanDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  currentPlanName: {
    fontSize: 14,
    fontFamily: 'Cairo_400Regular',
    color: '#333',
  },
  currentPlanExpiry: {
    fontSize: 14,
    fontFamily: 'Cairo_400Regular',
    color: '#666',
  },
  cancelBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  cancelBtnText: {
    fontSize: 13,
    fontFamily: 'Cairo_400Regular',
    color: '#F44336',
    textDecorationLine: 'underline',
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 10,
    gap: 10,
  },
  securityText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Cairo_400Regular',
    color: '#2E7D32',
    textAlign: 'right',
  },
  plansContainer: { padding: 16 },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Cairo_700Bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'right',
  },
  planCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  planCardPopular: {
    borderColor: '#FF9800',
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    right: 20,
    backgroundColor: '#FF9800',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    fontSize: 12,
    fontFamily: 'Cairo_700Bold',
    color: '#fff',
  },
  planName: {
    fontSize: 18,
    fontFamily: 'Cairo_700Bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  price: {
    fontSize: 36,
    fontFamily: 'Cairo_700Bold',
    color: '#FF9800',
  },
  period: {
    fontSize: 16,
    fontFamily: 'Cairo_400Regular',
    color: '#666',
  },
  featuresContainer: { marginBottom: 16 },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    fontFamily: 'Cairo_400Regular',
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  subscribeBtn: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#FF9800',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  subscribeBtnPopular: {
    backgroundColor: '#FF9800',
  },
  subscribeBtnDisabled: {
    opacity: 0.6,
  },
  subscribeBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subscribeBtnText: {
    fontSize: 16,
    fontFamily: 'Cairo_700Bold',
    color: '#FF9800',
  },
  subscribeBtnTextPopular: {
    color: '#fff',
  },
  paymentMethods: {
    padding: 16,
    alignItems: 'center',
  },
  paymentMethodsTitle: {
    fontSize: 14,
    fontFamily: 'Cairo_400Regular',
    color: '#666',
    marginBottom: 12,
  },
  paymentMethodsIcons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  paymentIcon: {
    alignItems: 'center',
    gap: 4,
  },
  paymentIconText: {
    fontSize: 11,
    fontFamily: 'Cairo_400Regular',
    color: '#999',
  },
});
