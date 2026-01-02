import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFonts, Cairo_400Regular, Cairo_700Bold } from '@expo-google-fonts/cairo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStripePayment, StripeWrapper } from '../../src/hooks/useStripePayment';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';
const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';

interface Package {
  id: string;
  name: string;
  hours: number;
  price: number;
  hourly_rate: number;
  description: string;
}

interface Coach {
  id: string;
  full_name: string;
  profile_image?: string;
}

function BookingContent() {
  const { packageId, coachId } = useLocalSearchParams();
  const [pkg, setPkg] = useState<Package | null>(null);
  const [coach, setCoach] = useState<Coach | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'cash'>('cash');
  const router = useRouter();
  
  const { initPaymentSheet, presentPaymentSheet, isAvailable: isStripeAvailable } = useStripePayment();

  const [fontsLoaded] = useFonts({ Cairo_400Regular, Cairo_700Bold });

  useEffect(() => {
    loadData();
    // Set default payment method based on platform
    if (isStripeAvailable) {
      setPaymentMethod('stripe');
    }
  }, [packageId, coachId, isStripeAvailable]);

  const loadData = async () => {
    try {
      // Load coach info
      const coachRes = await fetch(`${API_URL}/api/coaches/${coachId}`);
      if (coachRes.ok) {
        const coachData = await coachRes.json();
        setCoach(coachData);
      }

      // Load package info
      const packagesRes = await fetch(`${API_URL}/api/coaches/${coachId}/packages`);
      if (packagesRes.ok) {
        const packages = await packagesRes.json();
        const foundPkg = packages.find((p: Package) => p.id === packageId);
        if (foundPkg) {
          setPkg(foundPkg);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializePaymentSheet = async () => {
    if (!pkg || !coach || !initPaymentSheet) return null;
    
    try {
      const token = await AsyncStorage.getItem('token');
      const amountInCents = Math.round(pkg.price * 100);
      
      const response = await fetch(`${API_URL}/api/payments/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          package_id: pkg.id,
          coach_id: coach.id,
          amount: amountInCents
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to create payment intent');
      }

      const { paymentIntent, ephemeralKey, customer } = await response.json();

      const { error } = await initPaymentSheet({
        merchantDisplayName: 'اسأل يازو',
        customerId: customer,
        customerEphemeralKeySecret: ephemeralKey,
        paymentIntentClientSecret: paymentIntent,
        defaultBillingDetails: {
          name: '',
        },
        returnURL: 'askyazo://booking-complete',
      });

      if (error) {
        console.error('Error initializing payment sheet:', error);
        return null;
      }

      return paymentIntent;
    } catch (error) {
      console.error('Error setting up payment:', error);
      return null;
    }
  };

  const handleStripePayment = async () => {
    if (!pkg || !coach || !presentPaymentSheet) return;

    setProcessing(true);
    try {
      // Initialize payment sheet
      const paymentIntentSecret = await initializePaymentSheet();
      
      if (!paymentIntentSecret) {
        Alert.alert('خطأ', 'فشل في تهيئة نظام الدفع. يرجى المحاولة مرة أخرى.');
        setProcessing(false);
        return;
      }

      // Present the payment sheet
      const { error } = await presentPaymentSheet();

      if (error) {
        if (error.code === 'Canceled') {
          setProcessing(false);
          return;
        }
        Alert.alert('خطأ في الدفع', error.message);
        setProcessing(false);
        return;
      }

      // Payment succeeded - confirm booking
      const token = await AsyncStorage.getItem('token');
      const confirmResponse = await fetch(`${API_URL}/api/payments/confirm-booking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          payment_intent_id: paymentIntentSecret.split('_secret_')[0],
          package_id: pkg.id,
          coach_id: coach.id,
          notes: notes,
        })
      });

      if (confirmResponse.ok) {
        Alert.alert(
          'تم الدفع والحجز بنجاح! ✅',
          'تم إرسال طلب الحجز للمدرب وسيتم التواصل معك قريباً.',
          [
            { 
              text: 'عرض حجوزاتي', 
              onPress: () => router.replace('/(tabs)/bookings' as any)
            },
            {
              text: 'حسناً',
              onPress: () => router.back()
            }
          ]
        );
      } else {
        const error = await confirmResponse.json();
        Alert.alert('خطأ', error.detail || 'فشل في تأكيد الحجز');
      }
    } catch (error: any) {
      Alert.alert('خطأ', error.message || 'حدث خطأ في عملية الدفع');
    } finally {
      setProcessing(false);
    }
  };

  const handleCashPayment = async () => {
    if (!pkg || !coach) return;

    setProcessing(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/bookings/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          package_id: pkg.id,
          coach_id: coach.id,
          notes: notes,
          payment_method: 'cash'
        })
      });

      if (response.ok) {
        Alert.alert(
          'تم الحجز بنجاح! ✅',
          'تم إرسال طلب الحجز للمدرب. سيتم التواصل معك لترتيب الدفع والجلسات.',
          [
            { 
              text: 'عرض حجوزاتي', 
              onPress: () => router.replace('/(tabs)/bookings' as any)
            },
            {
              text: 'حسناً',
              onPress: () => router.back()
            }
          ]
        );
      } else {
        const error = await response.json();
        Alert.alert('خطأ', error.detail || 'فشل في إنشاء الحجز');
      }
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ في الاتصال');
    } finally {
      setProcessing(false);
    }
  };

  const handleBooking = () => {
    if (paymentMethod === 'stripe' && isStripeAvailable) {
      handleStripePayment();
    } else {
      handleCashPayment();
    }
  };

  const getLetterColor = (name: string): string => {
    const colors: { [key: string]: string } = {
      'ا': '#E91E63', 'أ': '#E91E63', 'م': '#00BCD4', 'ع': '#E91E63',
      'ب': '#9C27B0', 'ت': '#673AB7', 'ث': '#3F51B5', 'ج': '#2196F3',
    };
    const firstLetter = name?.trim().charAt(0) || '?';
    return colors[firstLetter] || '#FF9800';
  };

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF9800" />
      </View>
    );
  }

  if (!pkg || !coach) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorState}>
          <Ionicons name="alert-circle" size={64} color="#ccc" />
          <Text style={styles.errorText}>لم يتم العثور على الباقة</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>تأكيد الحجز</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* معلومات المدرب */}
        <View style={styles.coachCard}>
          <View style={[styles.coachAvatar, { backgroundColor: getLetterColor(coach.full_name) }]}>
            <Text style={styles.coachLetter}>
              {coach.full_name?.charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
          <View style={styles.coachInfo}>
            <Text style={styles.coachName}>{coach.full_name}</Text>
            <Text style={styles.coachLabel}>المدرب</Text>
          </View>
        </View>

        {/* تفاصيل الباقة */}
        <View style={styles.packageCard}>
          <View style={styles.packageHeader}>
            <Ionicons name="pricetag" size={24} color="#FF9800" />
            <Text style={styles.packageTitle}>{pkg.name}</Text>
          </View>
          
          <View style={styles.packageDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailValue}>{pkg.hours} ساعة</Text>
              <View style={styles.detailLabel}>
                <Text style={styles.detailLabelText}>عدد الساعات</Text>
                <Ionicons name="time" size={16} color="#666" />
              </View>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailValue}>${pkg.hourly_rate}</Text>
              <View style={styles.detailLabel}>
                <Text style={styles.detailLabelText}>سعر الساعة</Text>
                <Ionicons name="cash" size={16} color="#666" />
              </View>
            </View>
          </View>

          {pkg.description && (
            <Text style={styles.packageDesc}>{pkg.description}</Text>
          )}

          <View style={styles.totalSection}>
            <Text style={styles.totalLabel}>الإجمالي</Text>
            <Text style={styles.totalAmount}>${pkg.price}</Text>
          </View>
        </View>

        {/* اختيار طريقة الدفع */}
        <View style={styles.paymentMethodSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="card" size={20} color="#2196F3" />
            <Text style={styles.sectionTitle}>طريقة الدفع</Text>
          </View>
          
          {isStripeAvailable && (
            <TouchableOpacity
              style={[styles.paymentOption, paymentMethod === 'stripe' && styles.paymentOptionActive]}
              onPress={() => setPaymentMethod('stripe')}
            >
              <View style={styles.paymentOptionContent}>
                <View style={[styles.radioOuter, paymentMethod === 'stripe' && styles.radioOuterActive]}>
                  {paymentMethod === 'stripe' && <View style={styles.radioInner} />}
                </View>
                <View style={styles.paymentOptionInfo}>
                  <Text style={styles.paymentOptionTitle}>الدفع الإلكتروني</Text>
                  <Text style={styles.paymentOptionDesc}>بطاقة ائتمانية / Apple Pay / Google Pay</Text>
                </View>
              </View>
              <View style={styles.paymentIcons}>
                <Ionicons name="card" size={24} color="#1976D2" />
                <Ionicons name="logo-apple" size={24} color="#333" />
              </View>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.paymentOption, paymentMethod === 'cash' && styles.paymentOptionActive]}
            onPress={() => setPaymentMethod('cash')}
          >
            <View style={styles.paymentOptionContent}>
              <View style={[styles.radioOuter, paymentMethod === 'cash' && styles.radioOuterActive]}>
                {paymentMethod === 'cash' && <View style={styles.radioInner} />}
              </View>
              <View style={styles.paymentOptionInfo}>
                <Text style={styles.paymentOptionTitle}>الدفع عند الجلسة</Text>
                <Text style={styles.paymentOptionDesc}>تواصل مع المدرب لترتيب الدفع</Text>
              </View>
            </View>
            <Ionicons name="cash" size={24} color="#4CAF50" />
          </TouchableOpacity>

          {!isStripeAvailable && Platform.OS === 'web' && (
            <View style={styles.webNotice}>
              <Ionicons name="information-circle" size={18} color="#1976D2" />
              <Text style={styles.webNoticeText}>
                الدفع الإلكتروني متاح عبر التطبيق على الهاتف المحمول
              </Text>
            </View>
          )}
        </View>

        {/* ملاحظات */}
        <View style={styles.notesSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text" size={20} color="#4CAF50" />
            <Text style={styles.sectionTitle}>ملاحظات (اختياري)</Text>
          </View>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="أضف أي ملاحظات أو متطلبات خاصة..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* معلومات الدفع */}
        {paymentMethod === 'stripe' && isStripeAvailable ? (
          <View style={styles.paymentInfo}>
            <Ionicons name="shield-checkmark" size={20} color="#4CAF50" />
            <Text style={styles.paymentInfoText}>
              دفع آمن ومشفر عبر Stripe. سيتم خصم المبلغ فوراً وتأكيد الحجز.
            </Text>
          </View>
        ) : (
          <View style={styles.paymentInfo}>
            <Ionicons name="information-circle" size={20} color="#2196F3" />
            <Text style={styles.paymentInfoText}>
              سيتم التواصل معك من قبل المدرب لترتيب موعد الجلسات وطريقة الدفع
            </Text>
          </View>
        )}

        {/* زر التأكيد */}
        <TouchableOpacity
          style={[styles.confirmBtn, processing && styles.confirmBtnDisabled]}
          onPress={handleBooking}
          disabled={processing}
        >
          {processing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons 
                name={paymentMethod === 'stripe' && isStripeAvailable ? 'card' : 'checkmark-circle'} 
                size={24} 
                color="#fff" 
              />
              <Text style={styles.confirmBtnText}>
                {paymentMethod === 'stripe' && isStripeAvailable ? `ادفع $${pkg.price} الآن` : 'تأكيد الحجز'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* شعار الأمان */}
        {paymentMethod === 'stripe' && isStripeAvailable && (
          <View style={styles.securityBadge}>
            <Ionicons name="lock-closed" size={14} color="#999" />
            <Text style={styles.securityText}>معاملة آمنة ومشفرة بواسطة Stripe</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

export default function BookingScreen() {
  return (
    <StripeWrapper publishableKey={STRIPE_PUBLISHABLE_KEY}>
      <BookingContent />
    </StripeWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16, fontFamily: 'Cairo_400Regular', color: '#999', marginTop: 16 },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FF9800',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontFamily: 'Cairo_700Bold',
    color: '#fff',
    textAlign: 'right',
  },
  
  content: { padding: 16, paddingBottom: 40 },
  
  coachCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  coachAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
  coachLetter: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
  },
  coachInfo: { flex: 1 },
  coachName: {
    fontSize: 18,
    fontFamily: 'Cairo_700Bold',
    color: '#333',
    textAlign: 'right',
  },
  coachLabel: {
    fontSize: 13,
    fontFamily: 'Cairo_400Regular',
    color: '#666',
    textAlign: 'right',
  },
  
  packageCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  packageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  packageTitle: {
    fontSize: 20,
    fontFamily: 'Cairo_700Bold',
    color: '#333',
  },
  packageDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  detailLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabelText: {
    fontSize: 14,
    fontFamily: 'Cairo_400Regular',
    color: '#666',
  },
  detailValue: {
    fontSize: 16,
    fontFamily: 'Cairo_700Bold',
    color: '#333',
  },
  packageDesc: {
    fontSize: 14,
    fontFamily: 'Cairo_400Regular',
    color: '#666',
    textAlign: 'right',
    lineHeight: 22,
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    marginHorizontal: -20,
    marginBottom: -20,
    padding: 20,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontFamily: 'Cairo_700Bold',
    color: '#FF9800',
  },
  totalAmount: {
    fontSize: 28,
    fontFamily: 'Cairo_700Bold',
    color: '#FF9800',
  },
  
  paymentMethodSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Cairo_700Bold',
    color: '#333',
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  paymentOptionActive: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  paymentOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  radioOuterActive: {
    borderColor: '#2196F3',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2196F3',
  },
  paymentOptionInfo: {
    flex: 1,
  },
  paymentOptionTitle: {
    fontSize: 15,
    fontFamily: 'Cairo_700Bold',
    color: '#333',
    textAlign: 'right',
  },
  paymentOptionDesc: {
    fontSize: 12,
    fontFamily: 'Cairo_400Regular',
    color: '#666',
    textAlign: 'right',
  },
  paymentIcons: {
    flexDirection: 'row',
    gap: 8,
  },
  webNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 10,
    gap: 8,
    marginTop: 4,
  },
  webNoticeText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Cairo_400Regular',
    color: '#1976D2',
    textAlign: 'right',
  },
  
  notesSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  notesInput: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    fontFamily: 'Cairo_400Regular',
    color: '#333',
    textAlign: 'right',
    minHeight: 80,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    gap: 10,
  },
  paymentInfoText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Cairo_400Regular',
    color: '#2E7D32',
    textAlign: 'right',
    lineHeight: 22,
  },
  
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 14,
    padding: 18,
    gap: 10,
  },
  confirmBtnDisabled: {
    backgroundColor: '#ccc',
  },
  confirmBtnText: {
    fontSize: 18,
    fontFamily: 'Cairo_700Bold',
    color: '#fff',
  },
  
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
  },
  securityText: {
    fontSize: 12,
    fontFamily: 'Cairo_400Regular',
    color: '#999',
  },
});
