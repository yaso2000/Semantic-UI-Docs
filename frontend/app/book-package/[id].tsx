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
  StatusBar
} from 'react-native';
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
  description: string;
}

export default function BookPackageScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  const [pkg, setPkg] = useState<Package | null>(null);
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
    loadPackage();
  }, [id]);

  const loadPackage = async () => {
    try {
      const response = await fetch(`${API_URL}/api/packages`);
      if (response.ok) {
        const packages = await response.json();
        const foundPkg = packages.find((p: Package) => p.id === id);
        if (foundPkg) {
          setPkg(foundPkg);
        } else {
          Alert.alert('خطأ', 'الباقة غير موجودة');
          router.back();
        }
      }
    } catch (error) {
      console.error('Error loading package:', error);
      Alert.alert('خطأ', 'حدث خطأ في تحميل الباقة');
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async () => {
    if (!pkg) return;

    setProcessing(true);
    try {
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        Alert.alert('تنبيه', 'يرجى تسجيل الدخول أولاً');
        router.push('/(auth)/login' as any);
        return;
      }

      const response = await fetch(`${API_URL}/api/bookings/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          package_id: pkg.id,
          notes: notes,
          payment_method: 'cash'
        })
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          'تم الحجز بنجاح! ✅',
          'سيتم مراجعة طلبك وتأكيده قريباً',
          [{ text: 'حسناً', onPress: () => router.replace('/(tabs)/bookings' as any) }]
        );
      } else {
        Alert.alert('خطأ', data.detail || 'حدث خطأ في الحجز');
      }
    } catch (error) {
      console.error('Booking error:', error);
      Alert.alert('خطأ', 'حدث خطأ في الاتصال');
    } finally {
      setProcessing(false);
    }
  };

  if (!fontsLoaded || loading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <ActivityIndicator size="large" color={COLORS.teal} />
      </View>
    );
  }

  if (!pkg) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <View style={styles.errorState}>
          <Ionicons name="alert-circle-outline" size={60} color={COLORS.textMuted} />
          <Text style={styles.errorText}>الباقة غير موجودة</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>العودة</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color={COLORS.teal} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>تأكيد الحجز</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Package Card */}
        <View style={styles.packageCard}>
          <View style={styles.packageIconBox}>
            <Ionicons name="diamond" size={32} color={COLORS.white} />
          </View>
          <Text style={styles.packageName}>{pkg.name}</Text>
          <Text style={styles.packageHours}>{pkg.hours} ساعة تدريب</Text>
          {pkg.description && (
            <Text style={styles.packageDescription}>{pkg.description}</Text>
          )}
        </View>

        {/* Price Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>ملخص الحجز</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryValue}>{pkg.name}</Text>
            <Text style={styles.summaryLabel}>الباقة</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryValue}>{pkg.hours} ساعة</Text>
            <Text style={styles.summaryLabel}>عدد الساعات</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.summaryRow}>
            <Text style={styles.totalPrice}>${pkg.price}</Text>
            <Text style={styles.totalLabel}>المجموع</Text>
          </View>
        </View>

        {/* Notes Input */}
        <View style={styles.notesSection}>
          <Text style={styles.notesLabel}>ملاحظات (اختياري)</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="أضف أي ملاحظات أو متطلبات خاصة..."
            placeholderTextColor={COLORS.textMuted}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color={COLORS.info} />
          <Text style={styles.infoText}>
            سيتم مراجعة طلبك من قبل المدرب وتأكيده. ستصلك إشعار عند تأكيد الحجز.
          </Text>
        </View>

        {/* Book Button */}
        <TouchableOpacity 
          style={[styles.bookButton, processing && styles.bookButtonDisabled]}
          onPress={handleBooking}
          disabled={processing}
        >
          {processing ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={22} color={COLORS.white} />
              <Text style={styles.bookButtonText}>تأكيد الحجز</Text>
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
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  errorText: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginTop: SPACING.md,
  },
  backButton: {
    marginTop: SPACING.lg,
    paddingVertical: 12,
    paddingHorizontal: 32,
    backgroundColor: COLORS.teal,
    borderRadius: RADIUS.lg,
  },
  backButtonText: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${COLORS.teal}10`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  content: {
    padding: SPACING.md,
    paddingBottom: 40,
  },
  packageCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.lg,
    ...SHADOWS.md,
  },
  packageIconBox: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.teal,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  packageName: {
    fontSize: 22,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginBottom: 4,
  },
  packageHours: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    color: COLORS.teal,
    marginBottom: SPACING.sm,
  },
  packageDescription: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  summaryCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
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
    paddingVertical: 8,
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
    marginVertical: SPACING.sm,
  },
  totalLabel: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  totalPrice: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    color: COLORS.teal,
  },
  notesSection: {
    marginBottom: SPACING.lg,
  },
  notesLabel: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'right',
  },
  notesInput: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.text,
    textAlign: 'right',
    minHeight: 100,
    ...SHADOWS.sm,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: `${COLORS.info}10`,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: COLORS.info,
    textAlign: 'right',
    lineHeight: 20,
  },
  bookButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.teal,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    ...SHADOWS.md,
  },
  bookButtonDisabled: {
    opacity: 0.7,
  },
  bookButtonText: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },
});
