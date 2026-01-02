import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFonts, Alexandria_400Regular, Alexandria_600SemiBold, Alexandria_700Bold } from '@expo-google-fonts/alexandria';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, FONTS } from '../../src/constants/theme';

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
        <ActivityIndicator size="large" color={COLORS.gold} />
      </View>
    );
  }

  // ============ واجهة الأدمن ============
  if (userRole === 'admin') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>الحجوزات الواردة</Text>
          <Text style={styles.headerSubtitle}>{allBookings.length} حجز</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {allBookings.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={60} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>لا توجد حجوزات حالياً</Text>
            </View>
          ) : (
            allBookings.map((booking) => (
              <View key={booking.id} style={styles.bookingCard}>
                <View style={styles.bookingHeader}>
                  <View style={[styles.statusBadge, 
                    booking.booking_status === 'confirmed' ? styles.statusConfirmed :
                    booking.booking_status === 'pending' ? styles.statusPending : styles.statusCompleted
                  ]}>
                    <Text style={styles.statusText}>
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
                    <Ionicons name="person" size={18} color={COLORS.gold} />
                    <Text style={styles.bookingLabel}>المتدرب:</Text>
                    <Text style={styles.bookingValue}>{booking.client_name || 'غير محدد'}</Text>
                  </View>
                  <View style={styles.bookingRow}>
                    <Ionicons name="pricetag" size={18} color={COLORS.gold} />
                    <Text style={styles.bookingLabel}>الباقة:</Text>
                    <Text style={styles.bookingValue}>{booking.package_name}</Text>
                  </View>
                  <View style={styles.bookingRow}>
                    <Ionicons name="time" size={18} color={COLORS.gold} />
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>احجز مع يازو</Text>
        <Text style={styles.headerSubtitle}>باقات التدريب الشخصي</Text>
        <View style={styles.hoursBox}>
          <Ionicons name="time" size={20} color={COLORS.gold} />
          <Text style={styles.hoursText}>{getTotalHours()} ساعة متبقية</Text>
        </View>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'packages' && styles.tabActive]}
          onPress={() => setActiveTab('packages')}
        >
          <Ionicons name="pricetag" size={20} color={activeTab === 'packages' ? COLORS.primary : COLORS.textMuted} />
          <Text style={[styles.tabText, activeTab === 'packages' && styles.tabTextActive]}>الباقات</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'bookings' && styles.tabActive]}
          onPress={() => setActiveTab('bookings')}
        >
          <Ionicons name="calendar" size={20} color={activeTab === 'bookings' ? COLORS.primary : COLORS.textMuted} />
          <Text style={[styles.tabText, activeTab === 'bookings' && styles.tabTextActive]}>حجوزاتي</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {activeTab === 'packages' ? (
          packages.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="pricetag-outline" size={60} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>لا توجد باقات متاحة</Text>
            </View>
          ) : (
            packages.map((pkg) => (
              <View key={pkg.id} style={styles.packageCard}>
                <View style={styles.packageHeader}>
                  <View style={styles.packageIconBox}>
                    <Ionicons name="diamond" size={24} color={COLORS.gold} />
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
                  >
                    <Text style={styles.bookButtonText}>احجز الآن</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )
        ) : (
          myBookings.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={60} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>لا توجد حجوزات</Text>
            </View>
          ) : (
            myBookings.map((booking) => (
              <View key={booking.id} style={styles.bookingCard}>
                <View style={styles.bookingHeader}>
                  <View style={[styles.statusBadge, 
                    booking.booking_status === 'confirmed' ? styles.statusConfirmed :
                    booking.booking_status === 'pending' ? styles.statusPending : styles.statusCompleted
                  ]}>
                    <Text style={styles.statusText}>
                      {booking.booking_status === 'confirmed' ? 'مؤكد' :
                       booking.booking_status === 'pending' ? 'في الانتظار' : 'مكتمل'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.bookingPackageName}>{booking.package_name}</Text>
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
    backgroundColor: COLORS.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },

  // Header
  header: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: COLORS.secondary,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    color: COLORS.gold,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.text,
  },
  hoursBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderRadius: 20,
    gap: 8,
  },
  hoursText: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    color: COLORS.gold,
  },

  // Tabs
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: COLORS.secondary,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  tabActive: {
    backgroundColor: COLORS.gold,
  },
  tabText: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    color: COLORS.textMuted,
  },
  tabTextActive: {
    color: COLORS.primary,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    marginTop: 16,
  },

  // Package Card
  packageCard: {
    backgroundColor: COLORS.secondary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  packageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  packageIconBox: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  packageInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  packageName: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },
  packageHours: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.gold,
    marginTop: 2,
  },
  packageDescription: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    textAlign: 'right',
    marginBottom: 16,
  },
  packageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  packagePrice: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    color: COLORS.gold,
  },
  bookButton: {
    backgroundColor: COLORS.gold,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  bookButtonText: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: COLORS.primary,
  },

  // Booking Card
  bookingCard: {
    backgroundColor: COLORS.secondary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusPending: {
    backgroundColor: 'rgba(255, 152, 0, 0.2)',
  },
  statusConfirmed: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  statusCompleted: {
    backgroundColor: 'rgba(33, 150, 243, 0.2)',
  },
  statusText: {
    fontSize: 12,
    fontFamily: FONTS.semiBold,
    color: COLORS.gold,
  },
  bookingDate: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
  },
  bookingInfo: {
    gap: 8,
  },
  bookingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  bookingLabel: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
  },
  bookingValue: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    color: COLORS.white,
  },
  bookingPackageName: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.white,
    textAlign: 'right',
  },
  bookingHours: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.gold,
    textAlign: 'right',
    marginTop: 4,
  },
});
