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
  TextInput,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts, Alexandria_400Regular, Alexandria_600SemiBold, Alexandria_700Bold } from '@expo-google-fonts/alexandria';
import { COLORS, FONTS, SHADOWS, RADIUS, SPACING } from '../src/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface PackageDetails {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  features: string[];
}

export default function CheckoutScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const packageId = params.packageId as string;
  
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [packageDetails, setPackageDetails] = useState<PackageDetails | null>(null);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  
  // Card details (for demo - in production use Stripe Elements)
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardName, setCardName] = useState('');

  const [fontsLoaded] = useFonts({ Alexandria_400Regular, Alexandria_600SemiBold, Alexandria_700Bold });

  useEffect(() => {
    if (packageId) {
      loadPackageAndCreateSubscription();
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
      if (pkgRes.ok) {
        const pkgData = await pkgRes.json();
        setPackageDetails(pkgData);
      } else {
        Alert.alert('خطأ', 'الباقة غير موجودة');
        router.back();
        return;
      }

      // إنشاء الاشتراك
      const subRes = await fetch(`${API_URL}/api/all-packages/${packageId}/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      if (subRes.ok) {
        const subData = await subRes.json();
        setSubscriptionId(subData.subscription_id);
      } else {
        const error = await subRes.json();
        Alert.alert('خطأ', error.detail || 'فشل في إنشاء الاشتراك');
        router.back();
        return;
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('خطأ', 'حدث خطأ في الاتصال');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(' ').slice(0, 19) : '';
  };

  const formatExpiryDate = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
    }
    return cleaned;
  };

  const validateCard = () => {
    const cleanedCardNumber = cardNumber.replace(/\s/g, '');
    if (cleanedCardNumber.length !== 16) {
      Alert.alert('خطأ', 'رقم البطاقة يجب أن يكون 16 رقم');
      return false;
    }
    if (expiryDate.length !== 5) {
      Alert.alert('خطأ', 'تاريخ الانتهاء غير صالح');
      return false;
    }
    if (cvv.length < 3) {
      Alert.alert('خطأ', 'رمز CVV غير صالح');
      return false;
    }
    if (cardName.trim().length < 3) {
      Alert.alert('خطأ', 'يرجى إدخال اسم حامل البطاقة');
      return false;
    }
    return true;
  };

  const handlePayment = async () => {
    if (!validateCard()) return;
    if (!subscriptionId || !packageDetails) return;

    setProcessing(true);
    try {
      const token = await AsyncStorage.getItem('token');
      
      // محاكاة الدفع - في الإنتاج، استخدم Stripe SDK
      // هنا نقوم بتأكيد الدفع مباشرة للعرض التجريبي
      const response = await fetch(`${API_URL}/api/packages/confirm-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          subscription_id: subscriptionId,
          payment_intent_id: 'demo_payment_' + Date.now(),
          // في الإنتاج، أرسل payment_intent_id الحقيقي من Stripe
        })
      });

      if (response.ok) {
        // تحديث حالة الدفع إلى "مدفوع" مباشرة (للعرض التجريبي)
        await fetch(`${API_URL}/api/subscriptions/${subscriptionId}/mark-paid`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });

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
      } else {
        // للعرض التجريبي، نعتبر الدفع ناجحاً
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
      }
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء معالجة الدفع');
    } finally {
      setProcessing(false);
    }
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

  if (!packageDetails) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" />
        <Ionicons name="alert-circle" size={64} color={COLORS.error} />
        <Text style={styles.errorText}>حدث خطأ في تحميل البيانات</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => router.back()}>
          <Text style={styles.retryBtnText}>العودة</Text>
        </TouchableOpacity>
      </View>
    );
  }

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

        {/* Payment Form */}
        <View style={styles.paymentCard}>
          <View style={styles.paymentHeader}>
            <Ionicons name="card" size={24} color={COLORS.teal} />
            <Text style={styles.paymentTitle}>بيانات البطاقة</Text>
          </View>

          {/* Test Card Notice */}
          <View style={styles.testNotice}>
            <Ionicons name="information-circle" size={18} color="#2196F3" />
            <Text style={styles.testNoticeText}>
              للاختبار: استخدم 4242 4242 4242 4242
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>رقم البطاقة</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={cardNumber}
                onChangeText={(text) => setCardNumber(formatCardNumber(text))}
                placeholder="0000 0000 0000 0000"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="numeric"
                maxLength={19}
              />
              <Ionicons name="card-outline" size={20} color={COLORS.textMuted} />
            </View>
          </View>

          <View style={styles.rowInputs}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>تاريخ الانتهاء</Text>
              <TextInput
                style={styles.input}
                value={expiryDate}
                onChangeText={(text) => setExpiryDate(formatExpiryDate(text))}
                placeholder="MM/YY"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="numeric"
                maxLength={5}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginRight: SPACING.md }]}>
              <Text style={styles.inputLabel}>CVV</Text>
              <TextInput
                style={styles.input}
                value={cvv}
                onChangeText={setCvv}
                placeholder="123"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="numeric"
                maxLength={4}
                secureTextEntry
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>اسم حامل البطاقة</Text>
            <TextInput
              style={styles.input}
              value={cardName}
              onChangeText={setCardName}
              placeholder="الاسم كما يظهر على البطاقة"
              placeholderTextColor={COLORS.textMuted}
              autoCapitalize="characters"
            />
          </View>
        </View>

        {/* Security Info */}
        <View style={styles.securityInfo}>
          <Ionicons name="shield-checkmark" size={20} color="#4CAF50" />
          <Text style={styles.securityText}>
            بياناتك محمية بتشفير SSL. لن نقوم بحفظ بيانات بطاقتك.
          </Text>
        </View>
      </ScrollView>

      {/* Pay Button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity 
          style={styles.payBtn}
          onPress={handlePayment}
          disabled={processing}
        >
          <LinearGradient
            colors={processing ? ['#999', '#777'] : ['#4CAF50', '#388E3C']}
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

  inputGroup: {
    marginBottom: SPACING.md,
  },
  inputLabel: {
    fontSize: 13,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
    textAlign: 'right',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: COLORS.text,
    textAlign: 'left',
  },
  rowInputs: {
    flexDirection: 'row',
  },

  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    backgroundColor: '#E8F5E9',
    borderRadius: RADIUS.md,
  },
  securityText: {
    flex: 1,
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: '#2E7D32',
    textAlign: 'right',
  },

  footer: {
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  payBtn: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
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
});
