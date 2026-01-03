import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  
  ActivityIndicator,
  Alert,
  TextInput,
  StatusBar} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFonts, Alexandria_400Regular, Alexandria_600SemiBold, Alexandria_700Bold } from '@expo-google-fonts/alexandria';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, FONTS, SHADOWS, RADIUS, SPACING } from '../../src/constants/theme';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

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

export default function BookingScreen() {
  const insets = useSafeAreaInsets();
  const { packageId, coachId } = useLocalSearchParams();
  const [pkg, setPkg] = useState<Package | null>(null);
  const [coach, setCoach] = useState<Coach | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [notes, setNotes] = useState('');
  const router = useRouter();

  const [fontsLoaded] = useFonts({ 
    Alexandria_400Regular, 
    Alexandria_600SemiBold, 
    Alexandria_700Bold 
  });

  useEffect(() => {
    loadData();
  }, [packageId, coachId]);

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

  const handleBooking = async () => {
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

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <ActivityIndicator size="large" color={COLORS.teal} />
      </View>
    );
  }

  if (!pkg || !coach) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <View style={styles.errorState}>
          <Ionicons name="alert-circle" size={64} color={COLORS.border} />
          <Text style={styles.errorText}>لم يتم العثور على الباقة</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>العودة</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.teal} />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>تأكيد الحجز</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* معلومات المدرب */}
        <View style={styles.coachCard}>
          <View style={[styles.coachAvatar, { backgroundColor: COLORS.teal }]}>
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
            <Ionicons name="pricetag" size={24} color={COLORS.gold} />
            <Text style={styles.packageTitle}>{pkg.name}</Text>
          </View>
          
          <View style={styles.packageDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailValue}>{pkg.hours} ساعة</Text>
              <View style={styles.detailLabel}>
                <Text style={styles.detailLabelText}>عدد الساعات</Text>
                <Ionicons name="time" size={16} color={COLORS.textSecondary} />
              </View>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailValue}>${pkg.hourly_rate}</Text>
              <View style={styles.detailLabel}>
                <Text style={styles.detailLabelText}>سعر الساعة</Text>
                <Ionicons name="cash" size={16} color={COLORS.textSecondary} />
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

        {/* ملاحظات */}
        <View style={styles.notesSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text" size={20} color={COLORS.sage} />
            <Text style={styles.sectionTitle}>ملاحظات (اختياري)</Text>
          </View>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="أضف أي ملاحظات أو متطلبات خاصة..."
            placeholderTextColor={COLORS.textMuted}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* معلومات الدفع */}
        <View style={styles.paymentInfo}>
          <Ionicons name="information-circle" size={20} color={COLORS.info} />
          <Text style={styles.paymentInfoText}>
            سيتم التواصل معك من قبل المدرب لترتيب موعد الجلسات وطريقة الدفع
          </Text>
        </View>

        {/* زر التأكيد */}
        <TouchableOpacity
          style={[styles.confirmBtn, processing && styles.confirmBtnDisabled]}
          onPress={handleBooking}
          disabled={processing}
        >
          {processing ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={24} color={COLORS.white} />
              <Text style={styles.confirmBtnText}>تأكيد الحجز</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
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
    backgroundColor: COLORS.background},
  errorState: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    padding: SPACING.xl},
  errorText: { 
    fontSize: 16, 
    fontFamily: FONTS.regular, 
    color: COLORS.textSecondary, 
    marginTop: SPACING.md 
  },
  backBtn: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.teal,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md},
  backBtnText: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: COLORS.white},
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.teal},
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center'},
  headerTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: COLORS.white},
  
  content: { 
    padding: SPACING.md, 
    paddingBottom: 40 
  },
  
  coachCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.md},
  coachAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.md},
  coachLetter: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.white},
  coachInfo: { 
    flex: 1 
  },
  coachName: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    textAlign: 'right'},
  coachLabel: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'right'},
  
  packageCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.md},
  packageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    marginBottom: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border},
  packageTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: COLORS.text},
  packageDetails: {
    marginBottom: SPACING.md},
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10},
  detailLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8},
  detailLabelText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary},
  detailValue: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.text},
  packageDesc: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'right',
    lineHeight: 22,
    marginBottom: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border},
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: `${COLORS.gold}15`,
    marginHorizontal: -SPACING.lg,
    marginBottom: -SPACING.lg,
    padding: SPACING.lg,
    borderBottomLeftRadius: RADIUS.lg,
    borderBottomRightRadius: RADIUS.lg},
  totalLabel: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.gold},
  totalAmount: {
    fontSize: 28,
    fontFamily: FONTS.bold,
    color: COLORS.gold},
  
  notesSection: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.sm},
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    marginBottom: SPACING.md},
  sectionTitle: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.text},
  notesInput: {
    backgroundColor: COLORS.beige,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.text,
    textAlign: 'right',
    minHeight: 80,
    borderWidth: 1,
    borderColor: COLORS.border},
  
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.infoLight,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    gap: 10},
  paymentInfoText: {
    flex: 1,
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: COLORS.info,
    textAlign: 'right',
    lineHeight: 22},
  
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.success,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: 10,
    ...SHADOWS.md},
  confirmBtnDisabled: {
    backgroundColor: COLORS.border},
  confirmBtnText: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.white}});
