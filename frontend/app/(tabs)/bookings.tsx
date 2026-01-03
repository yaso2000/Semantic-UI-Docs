import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFonts, Alexandria_400Regular, Alexandria_600SemiBold, Alexandria_700Bold } from '@expo-google-fonts/alexandria';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../src/constants/theme';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface Package {
  id: string;
  name: string;
  hours: number;
  price: number;
  description?: string;
}

interface Booking {
  id: string;
  package_name: string;
  hours_purchased: number;
  hours_used: number;
  booking_status: string;
  payment_status: string;
  created_at: string;
  client_name?: string;
  amount?: number;
}

export default function BookingsScreen() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'packages' | 'bookings'>('packages');
  const [userRole, setUserRole] = useState<string>('client');
  const router = useRouter();
  
  const [fontsLoaded] = useFonts({ Alexandria_400Regular, Alexandria_600SemiBold, Alexandria_700Bold });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userData = await AsyncStorage.getItem('user');
      const user = userData ? JSON.parse(userData) : null;
      const role = user?.role || 'client';
      setUserRole(role);
      
      if (role === 'client') {
        const packagesRes = await fetch(`${API_URL}/api/packages`);
        const packagesData = await packagesRes.json();
        setPackages(packagesData);
        
        if (token) {
          const bookingsRes = await fetch(`${API_URL}/api/bookings/my-bookings`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const bookingsData = await bookingsRes.json();
          setMyBookings(bookingsData);
        }
      } else {
        if (token) {
          const bookingsRes = await fetch(`${API_URL}/api/admin/bookings`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const bookingsData = await bookingsRes.json();
          setAllBookings(Array.isArray(bookingsData) ? bookingsData : []);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTotalHours = () => {
    return myBookings
      .filter(b => b.booking_status === 'confirmed' || b.payment_status === 'completed')
      .reduce((sum, b) => sum + ((b.hours_purchased || 0) - (b.hours_used || 0)), 0);
  };

  const handleBookPackage = (pkg: Package) => {
    router.push(`/booking/${pkg.id}` as any);
  };

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <ActivityIndicator size="large" color={COLORS.teal} />
      </View>
    );
  }

  // ============ واجهة الأدمن ============
  if (userRole === 'admin') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <View style={styles.header}>
          <Ionicons name="calendar" size={24} color={COLORS.teal} />
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>الحجوزات الواردة</Text>
            <Text style={styles.headerSubtitle}>{allBookings.length} حجز</Text>
          </View>
        </View>

        <ScrollView 
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {allBookings.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="calendar-outline" size={50} color={COLORS.teal} />
              </View>
              <Text style={styles.emptyTitle}>لا توجد حجوزات حالياً</Text>
              <Text style={styles.emptyText}>ستظهر الحجوزات الجديدة هنا</Text>
            </View>
          ) : (
            allBookings.map((booking) => (
              <View key={booking.id} style={styles.bookingCard}>
                <View style={styles.bookingHeader}>
                  <View style={[
                    styles.statusBadge, 
                    booking.booking_status === 'confirmed' ? styles.statusConfirmed :
                    booking.booking_status === 'pending' ? styles.statusPending : styles.statusCompleted
                  ]}>
                    <Text style={[
                      styles.statusText,
                      booking.booking_status === 'confirmed' ? { color: COLORS.success } :
                      booking.booking_status === 'pending' ? { color: COLORS.warning } : { color: COLORS.info }
                    ]}>
                      {booking.booking_status === 'confirmed' ? 'مؤكد' :
                       booking.booking_status === 'pending' ? 'في الانتظار' : 'مكتمل'}
                    </Text>
                  </View>
                  <Text style={styles.bookingDate}>
                    {new Date(booking.created_at).toLocaleDateString('ar-SA')}
                  </Text>
                </View>
                
                <View style={styles.bookingInfo}>
                  <View style={styles.bookingRow}>
                    <Ionicons name="person" size={16} color={COLORS.teal} />
                    <Text style={styles.bookingLabel}>المتدرب:</Text>
                    <Text style={styles.bookingValue}>{booking.client_name || 'غير محدد'}</Text>
                  </View>
                  <View style={styles.bookingRow}>
                    <Ionicons name="pricetag" size={16} color={COLORS.goldDark} />
                    <Text style={styles.bookingLabel}>الباقة:</Text>
                    <Text style={styles.bookingValue}>{booking.package_name}</Text>
                  </View>
                  <View style={styles.bookingRow}>
                    <Ionicons name="time" size={16} color={COLORS.sageDark} />
                    <Text style={styles.bookingLabel}>الساعات:</Text>
                    <Text style={styles.bookingValue}>
                      {booking.hours_used || 0} / {booking.hours_purchased} ساعة
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ============ واجهة المتدرب ============
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <View style={styles.clientHeader}>
        <View style={styles.clientHeaderTop}>
          <View style={styles.headerIcon}>
            <Ionicons name="leaf" size={28} color={COLORS.teal} />
          </View>
          <View>
            <Text style={styles.headerTitle}>احجز مع يازو</Text>
            <Text style={styles.headerSubtitle}>باقات التدريب الشخصي</Text>
          </View>
        </View>
        <View style={styles.hoursBox}>
          <Ionicons name="time" size={18} color={COLORS.teal} />
          <Text style={styles.hoursText}>{getTotalHours()} ساعة متبقية</Text>
        </View>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'packages' && styles.tabActive]}
          onPress={() => setActiveTab('packages')}
        >
          <Ionicons name="pricetag" size={18} color={activeTab === 'packages' ? COLORS.white : COLORS.textSecondary} />
          <Text style={[styles.tabText, activeTab === 'packages' && styles.tabTextActive]}>الباقات</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'bookings' && styles.tabActive]}
          onPress={() => setActiveTab('bookings')}
        >
          <Ionicons name="calendar" size={18} color={activeTab === 'bookings' ? COLORS.white : COLORS.textSecondary} />
          <Text style={[styles.tabText, activeTab === 'bookings' && styles.tabTextActive]}>حجوزاتي</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'packages' ? (
          packages.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="pricetag-outline" size={50} color={COLORS.teal} />
              </View>
              <Text style={styles.emptyTitle}>لا توجد باقات متاحة</Text>
            </View>
          ) : (
            packages.map((pkg) => (
              <View key={pkg.id} style={styles.packageCard}>
                <View style={styles.packageHeader}>
                  <View style={styles.packageIconBox}>
                    <Ionicons name="diamond" size={22} color={COLORS.white} />
                  </View>
                  <View style={styles.packageInfo}>
                    <Text style={styles.packageName}>{pkg.name}</Text>
                    <Text style={styles.packageHours}>{pkg.hours} ساعة تدريب</Text>
                  </View>
                </View>
                {pkg.description && (
                  <Text style={styles.packageDescription}>{pkg.description}</Text>
                )}
                <View style={styles.packageFooter}>
                  <Text style={styles.packagePrice}>${pkg.price}</Text>
                  <TouchableOpacity 
                    style={styles.bookButton}
                    onPress={() => handleBookPackage(pkg)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.bookButtonText}>احجز الآن</Text>
                    <Ionicons name="arrow-back" size={16} color={COLORS.white} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )
        ) : (
          myBookings.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="calendar-outline" size={50} color={COLORS.teal} />
              </View>
              <Text style={styles.emptyTitle}>لا توجد حجوزات</Text>
              <Text style={styles.emptyText}>احجز باقة لبدء رحلتك</Text>
            </View>
          ) : (
            myBookings.map((booking) => (
              <View key={booking.id} style={styles.myBookingCard}>
                <View style={styles.bookingHeader}>
                  <View style={[
                    styles.statusBadge, 
                    booking.booking_status === 'confirmed' ? styles.statusConfirmed :
                    booking.booking_status === 'pending' ? styles.statusPending : styles.statusCompleted
                  ]}>
                    <Text style={[
                      styles.statusText,
                      booking.booking_status === 'confirmed' ? { color: COLORS.success } :
                      booking.booking_status === 'pending' ? { color: COLORS.warning } : { color: COLORS.info }
                    ]}>
                      {booking.booking_status === 'confirmed' ? 'مؤكد' :
                       booking.booking_status === 'pending' ? 'في الانتظار' : 'مكتمل'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.bookingPackageName}>{booking.package_name}</Text>
                <View style={styles.hoursProgress}>
                  <View style={[
                    styles.hoursProgressBar,
                    { width: `${((booking.hours_purchased - booking.hours_used) / booking.hours_purchased) * 100}%` }
                  ]} />
                </View>
                <Text style={styles.bookingHours}>
                  {booking.hours_purchased - booking.hours_used} / {booking.hours_purchased} ساعة متبقية
                </Text>
              </View>
            ))
          )
        )}
      </ScrollView>
    </SafeAreaView>
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
  content: {
    padding: SPACING.md,
    paddingBottom: 100,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.sm,
    ...SHADOWS.sm,
  },
  headerText: {
    alignItems: 'flex-end',
  },
  clientHeader: {
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    borderRadius: RADIUS.xl,
    ...SHADOWS.md,
  },
  clientHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${COLORS.teal}10`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    textAlign: 'right',
  },
  headerSubtitle: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'right',
  },
  hoursBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: `${COLORS.teal}10`,
    borderRadius: RADIUS.full,
    gap: SPACING.xs,
  },
  hoursText: {
    fontSize: 13,
    fontFamily: FONTS.semiBold,
    color: COLORS.teal,
  },

  // Tabs
  tabs: {
    flexDirection: 'row',
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: 4,
    ...SHADOWS.sm,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.sm,
    gap: 6,
  },
  tabActive: {
    backgroundColor: COLORS.teal,
  },
  tabText: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.white,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    padding: SPACING['2xl'],
  },
  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: `${COLORS.teal}10`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginTop: 4,
  },

  // Package Card
  packageCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.md,
  },
  packageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  packageIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.teal,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.sm,
  },
  packageInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  packageName: {
    fontSize: 17,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  packageHours: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: COLORS.teal,
    marginTop: 2,
  },
  packageDescription: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'right',
    marginBottom: SPACING.md,
  },
  packageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  packagePrice: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    color: COLORS.goldDark,
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.teal,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    gap: 6,
  },
  bookButtonText: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },

  // Booking Card (Admin)
  bookingCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  statusPending: {
    backgroundColor: COLORS.warningLight,
  },
  statusConfirmed: {
    backgroundColor: COLORS.successLight,
  },
  statusCompleted: {
    backgroundColor: COLORS.infoLight,
  },
  statusText: {
    fontSize: 12,
    fontFamily: FONTS.semiBold,
  },
  bookingDate: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
  },
  bookingInfo: {
    gap: SPACING.xs,
  },
  bookingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
  },
  bookingLabel: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  bookingValue: {
    fontSize: 13,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
  },

  // My Booking Card
  myBookingCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  bookingPackageName: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    textAlign: 'right',
  },
  hoursProgress: {
    height: 6,
    backgroundColor: COLORS.beige,
    borderRadius: 3,
    marginTop: SPACING.sm,
    overflow: 'hidden',
  },
  hoursProgressBar: {
    height: '100%',
    backgroundColor: COLORS.teal,
    borderRadius: 3,
  },
  bookingHours: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'right',
    marginTop: SPACING.xs,
  },
});
