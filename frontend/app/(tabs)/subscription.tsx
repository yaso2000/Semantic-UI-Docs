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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Cairo_400Regular, Cairo_700Bold } from '@expo-google-fonts/cairo';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
    id: 'monthly',
    name: 'الاشتراك الشهري',
    price: 49,
    period: 'شهر',
    features: [
      'ظهور في قائمة المدربين',
      'استقبال حجوزات غير محدودة',
      'محادثة مع المتدربين',
      'لوحة تحكم كاملة',
    ],
  },
  {
    id: 'yearly',
    name: 'الاشتراك السنوي',
    price: 399,
    period: 'سنة',
    originalPrice: 588,
    savings: 189,
    features: [
      'جميع مميزات الاشتراك الشهري',
      'توفير 32%',
      'أولوية في الظهور',
      'شارة مدرب مميز',
    ],
    popular: true,
  },
];

export default function SubscriptionScreen() {
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);

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

  const handleSubscribe = async (planId: string) => {
    Alert.alert(
      'تأكيد الاشتراك',
      'سيتم توجيهك لإتمام الدفع. هل تريد المتابعة؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'متابعة',
          onPress: async () => {
            setSubscribing(true);
            try {
              const token = await AsyncStorage.getItem('token');
              const response = await fetch(`${API_URL}/api/coach/subscribe`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ plan: planId })
              });
              
              if (response.ok) {
                Alert.alert('نجاح', 'تم تفعيل اشتراكك بنجاح!');
                loadSubscription();
              } else {
                Alert.alert('خطأ', 'فشل في إتمام الاشتراك');
              }
            } catch (error) {
              Alert.alert('خطأ', 'حدث خطأ في الاتصال');
            } finally {
              setSubscribing(false);
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
                {currentSubscription.plan === 'yearly' ? 'سنوي' : 'شهري'}
              </Text>
              <Text style={styles.currentPlanExpiry}>
                ينتهي في: {new Date(currentSubscription.end_date).toLocaleDateString('ar-SA')}
              </Text>
            </View>
          </View>
        )}

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
                  <Text style={styles.popularText}>الأكثر توفيراً</Text>
                </View>
              )}

              <Text style={styles.planName}>{plan.name}</Text>
              
              <View style={styles.priceContainer}>
                <Text style={styles.price}>${plan.price}</Text>
                <Text style={styles.period}>/{plan.period}</Text>
              </View>

              {plan.originalPrice && (
                <View style={styles.savingsContainer}>
                  <Text style={styles.originalPrice}>${plan.originalPrice}</Text>
                  <Text style={styles.savingsText}>وفر ${plan.savings}</Text>
                </View>
              )}

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
                  subscribing && styles.subscribeBtnDisabled
                ]}
                onPress={() => handleSubscribe(plan.id)}
                disabled={subscribing}
              >
                <Text style={[
                  styles.subscribeBtnText,
                  plan.popular && styles.subscribeBtnTextPopular
                ]}>
                  {subscribing ? 'جاري المعالجة...' : 'اشترك الآن'}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
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
    marginBottom: 8,
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
  savingsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  originalPrice: {
    fontSize: 14,
    fontFamily: 'Cairo_400Regular',
    color: '#999',
    textDecorationLine: 'line-through',
  },
  savingsText: {
    fontSize: 14,
    fontFamily: 'Cairo_700Bold',
    color: '#4CAF50',
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
  subscribeBtnText: {
    fontSize: 16,
    fontFamily: 'Cairo_700Bold',
    color: '#FF9800',
  },
  subscribeBtnTextPopular: {
    color: '#fff',
  },
});
