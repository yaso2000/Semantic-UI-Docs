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
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Alexandria_400Regular, Alexandria_600SemiBold, Alexandria_700Bold } from '@expo-google-fonts/alexandria';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, FONTS, SHADOWS, RADIUS, SPACING } from '../../src/constants/theme';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

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

export default function SubscriptionScreen() {
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const [fontsLoaded] = useFonts({ 
    Alexandria_400Regular, 
    Alexandria_600SemiBold, 
    Alexandria_700Bold 
  });

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

  const handleSubscribe = async (planId: string) => {
    setSelectedPlan(planId);
    const plan = plans.find(p => p.id === planId);
    
    Alert.alert(
      'تأكيد الاشتراك',
      `سيتم الاشتراك في خطة "${plan?.name}" بقيمة $${plan?.price}/${plan?.period}. هل تريد المتابعة؟`,
      [
        { text: 'إلغاء', style: 'cancel', onPress: () => setSelectedPlan(null) },
        {
          text: 'تواصل معنا',
          onPress: () => handleManualSubscription(planId)
        }
      ]
    );
  };

  const handleManualSubscription = async (planId: string) => {
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
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <ActivityIndicator size="large" color={COLORS.teal} />
      </View>
    );
  }

  const isActive = currentSubscription?.status === 'active';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.gold} />
      <ScrollView>
        <View style={styles.header}>
          <Ionicons name="card" size={40} color={COLORS.white} />
          <Text style={styles.headerTitle}>اشتراك المدرب</Text>
          <Text style={styles.headerSubtitle}>
            {isActive ? 'اشتراكك فعال' : 'اشترك للظهور في قائمة المدربين'}
          </Text>
        </View>

        {isActive && currentSubscription && (
          <View style={styles.currentPlan}>
            <View style={styles.currentPlanHeader}>
              <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
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

        <View style={styles.securityInfo}>
          <Ionicons name="shield-checkmark" size={20} color={COLORS.success} />
          <Text style={styles.securityText}>
            يمكنك الاشتراك عبر التواصل المباشر معنا
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
                    <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
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
                  <ActivityIndicator color={plan.popular ? COLORS.white : COLORS.gold} />
                ) : (
                  <View style={styles.subscribeBtnContent}>
                    <Ionicons 
                      name="mail" 
                      size={20} 
                      color={plan.popular ? COLORS.white : COLORS.gold} 
                    />
                    <Text style={[
                      styles.subscribeBtnText,
                      plan.popular && styles.subscribeBtnTextPopular
                    ]}>
                      {isActive ? 'مشترك حالياً' : 'طلب اشتراك'}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background 
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SPACING.xl,
    backgroundColor: COLORS.gold,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    color: COLORS.white,
    marginTop: SPACING.md,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  currentPlan: {
    backgroundColor: COLORS.successLight,
    margin: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.success,
  },
  currentPlanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  currentPlanTitle: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.success,
  },
  currentPlanDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  currentPlanName: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.text,
  },
  currentPlanExpiry: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  cancelBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: SPACING.sm,
  },
  cancelBtnText: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: COLORS.error,
    textDecorationLine: 'underline',
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.successLight,
    marginHorizontal: SPACING.md,
    marginBottom: 8,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    gap: 10,
  },
  securityText: {
    flex: 1,
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: COLORS.success,
    textAlign: 'right',
  },
  plansContainer: { 
    padding: SPACING.md 
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.md,
    textAlign: 'right',
  },
  planCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.border,
    ...SHADOWS.md,
  },
  planCardPopular: {
    borderColor: COLORS.gold,
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    right: 20,
    backgroundColor: COLORS.gold,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },
  planName: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'baseline',
    marginBottom: SPACING.md,
  },
  price: {
    fontSize: 36,
    fontFamily: FONTS.bold,
    color: COLORS.gold,
  },
  period: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  featuresContainer: { 
    marginBottom: SPACING.md 
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.text,
    flex: 1,
    textAlign: 'right',
  },
  subscribeBtn: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.gold,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
  },
  subscribeBtnPopular: {
    backgroundColor: COLORS.gold,
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
    fontFamily: FONTS.bold,
    color: COLORS.gold,
  },
  subscribeBtnTextPopular: {
    color: COLORS.white,
  },
});
