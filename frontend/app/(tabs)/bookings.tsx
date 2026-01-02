import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Cairo_400Regular, Cairo_700Bold } from '@expo-google-fonts/cairo';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface Package {
  id: string;
  name: string;
  hours: number;
  price: number;
  description: string;
}

interface Booking {
  id: string;
  coach_id: string;
  coach_name: string;
  package_name: string;
  hours_purchased: number;
  hours_used: number;
  amount: number;
  payment_status: string;
  booking_status: string;
  notes: string;
  created_at: string;
}

export default function BookingsScreen() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'packages' | 'bookings'>('packages');
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [showModal, setShowModal] = useState(false);
  
  const [fontsLoaded] = useFonts({ Cairo_400Regular, Cairo_700Bold });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      
      // Load packages
      const packagesRes = await fetch(`${API_URL}/api/packages`);
      const packagesData = await packagesRes.json();
      setPackages(packagesData);
      
      // Load my bookings
      if (token) {
        const bookingsRes = await fetch(`${API_URL}/api/bookings/my-bookings`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const bookingsData = await bookingsRes.json();
        setMyBookings(bookingsData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookPackage = async (pkg: Package) => {
    setSelectedPackage(pkg);
    setShowModal(true);
  };

  const confirmBooking = async () => {
    if (!selectedPackage) return;
    
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/bookings/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          package_id: selectedPackage.id,
          payment_method: 'stripe'
        })
      });
      
      if (response.ok) {
        Alert.alert('نجاح', 'تم حجز الباقة بنجاح! سيتم التواصل معك لتأكيد الدفع.');
        setShowModal(false);
        loadData();
        setActiveTab('bookings');
      } else {
        Alert.alert('خطأ', 'فشل في إنشاء الحجز');
      }
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ في الاتصال');
    }
  };

  const getTotalHours = () => {
    return myBookings
      .filter(b => b.payment_status === 'completed')
      .reduce((sum, b) => sum + (b.hours_purchased - b.hours_used), 0);
  };

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>الحجوزات والباقات</Text>
        <View style={styles.hoursBox}>
          <Ionicons name="time" size={20} color="#4CAF50" />
          <Text style={styles.hoursText}>{getTotalHours()} ساعة متبقية</Text>
        </View>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'packages' && styles.tabActive]}
          onPress={() => setActiveTab('packages')}
        >
          <Ionicons name="pricetag" size={20} color={activeTab === 'packages' ? '#fff' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'packages' && styles.tabTextActive]}>الباقات</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'bookings' && styles.tabActive]}
          onPress={() => setActiveTab('bookings')}
        >
          <Ionicons name="calendar" size={20} color={activeTab === 'bookings' ? '#fff' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'bookings' && styles.tabTextActive]}>حجوزاتي</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {activeTab === 'packages' ? (
          <>
            <Text style={styles.sectionTitle}>باقات التدريب المتاحة</Text>
            {packages.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="pricetag-outline" size={60} color="#ccc" />
                <Text style={styles.emptyText}>لا توجد باقات متاحة حالياً</Text>
              </View>
            ) : (
              packages.map((pkg) => (
                <View key={pkg.id} style={styles.packageCard}>
                  <View style={styles.packageHeader}>
                    <View style={styles.packageIcon}>
                      <Ionicons name="fitness" size={28} color="#fff" />
                    </View>
                    <View style={styles.packageInfo}>
                      <Text style={styles.packageName}>{pkg.name}</Text>
                      <Text style={styles.packageHours}>{pkg.hours} ساعة تدريبية</Text>
                    </View>
                    <View style={styles.packagePrice}>
                      <Text style={styles.priceAmount}>${pkg.price}</Text>
                    </View>
                  </View>
                  <Text style={styles.packageDescription}>{pkg.description}</Text>
                  <View style={styles.packageFeatures}>
                    <View style={styles.featureItem}>
                      <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                      <Text style={styles.featureText}>جلسات فردية</Text>
                    </View>
                    <View style={styles.featureItem}>
                      <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                      <Text style={styles.featureText}>دعم عبر المحادثة</Text>
                    </View>
                    <View style={styles.featureItem}>
                      <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                      <Text style={styles.featureText}>متابعة التقدم</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.bookButton}
                    onPress={() => handleBookPackage(pkg)}
                  >
                    <Text style={styles.bookButtonText}>احجز الآن</Text>
                    <Ionicons name="arrow-back" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </>
        ) : (
          <>
            <Text style={styles.sectionTitle}>حجوزاتي</Text>
            {myBookings.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={60} color="#ccc" />
                <Text style={styles.emptyText}>لا توجد حجوزات بعد</Text>
                <TouchableOpacity
                  style={styles.browseButton}
                  onPress={() => setActiveTab('packages')}
                >
                  <Text style={styles.browseButtonText}>تصفح الباقات</Text>
                </TouchableOpacity>
              </View>
            ) : (
              myBookings.map((booking) => (
                <View key={booking.id} style={styles.bookingCard}>
                  <View style={styles.bookingHeader}>
                    <View>
                      <Text style={styles.bookingName}>{booking.package_name}</Text>
                      <Text style={styles.coachNameText}>مع {booking.coach_name}</Text>
                    </View>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: booking.booking_status === 'confirmed' ? '#E8F5E9' : '#FFF3E0' }
                    ]}>
                      <Text style={[
                        styles.statusText,
                        { color: booking.booking_status === 'confirmed' ? '#4CAF50' : '#FF9800' }
                      ]}>
                        {booking.booking_status === 'confirmed' ? 'مؤكد' : 
                         booking.booking_status === 'completed' ? 'مكتمل' : 'قيد الانتظار'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.bookingDetails}>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>الساعات</Text>
                      <Text style={styles.detailValue}>{booking.hours_purchased} ساعة</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>المستخدم</Text>
                      <Text style={styles.detailValue}>{booking.hours_used} ساعة</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>المتبقي</Text>
                      <Text style={[styles.detailValue, { color: '#4CAF50' }]}>
                        {booking.hours_purchased - booking.hours_used} ساعة
                      </Text>
                    </View>
                  </View>
                  <View style={styles.bookingFooter}>
                    <Text style={styles.bookingDate}>
                      {new Date(booking.created_at).toLocaleDateString('ar-SA')}
                    </Text>
                    <Text style={styles.bookingAmount}>${booking.amount}</Text>
                  </View>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>

      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>تأكيد الحجز</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            {selectedPackage && (
              <>
                <View style={styles.modalPackageInfo}>
                  <Text style={styles.modalPackageName}>{selectedPackage.name}</Text>
                  <Text style={styles.modalPackageDetails}>
                    {selectedPackage.hours} ساعة تدريبية
                  </Text>
                  <Text style={styles.modalPackagePrice}>${selectedPackage.price}</Text>
                </View>
                <View style={styles.paymentMethods}>
                  <Text style={styles.paymentTitle}>طريقة الدفع:</Text>
                  <TouchableOpacity style={styles.paymentOption}>
                    <Ionicons name="card" size={24} color="#2196F3" />
                    <Text style={styles.paymentOptionText}>بطاقة ائتمان (Stripe)</Text>
                    <View style={styles.radioSelected} />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.confirmButton} onPress={confirmBooking}>
                  <Text style={styles.confirmButtonText}>تأكيد الحجز</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: { fontSize: 24, fontFamily: 'Cairo_700Bold', color: '#333', textAlign: 'right' },
  hoursBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 8,
    gap: 8,
  },
  hoursText: { fontSize: 16, fontFamily: 'Cairo_700Bold', color: '#4CAF50' },
  tabs: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#fff',
    gap: 8,
  },
  tabActive: { backgroundColor: '#4CAF50' },
  tabText: { fontSize: 14, fontFamily: 'Cairo_700Bold', color: '#666' },
  tabTextActive: { color: '#fff' },
  content: { padding: 16, paddingBottom: 100 },
  sectionTitle: { fontSize: 18, fontFamily: 'Cairo_700Bold', color: '#333', marginBottom: 16, textAlign: 'right' },
  emptyState: { alignItems: 'center', padding: 40 },
  emptyText: { fontSize: 16, fontFamily: 'Cairo_400Regular', color: '#999', marginTop: 16 },
  browseButton: { marginTop: 16, backgroundColor: '#4CAF50', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  browseButtonText: { fontSize: 14, fontFamily: 'Cairo_700Bold', color: '#fff' },
  packageCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, elevation: 2 },
  packageHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  packageIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#4CAF50', justifyContent: 'center', alignItems: 'center', marginLeft: 16 },
  packageInfo: { flex: 1 },
  packageName: { fontSize: 18, fontFamily: 'Cairo_700Bold', color: '#333', textAlign: 'right' },
  packageHours: { fontSize: 14, fontFamily: 'Cairo_400Regular', color: '#666', textAlign: 'right' },
  packagePrice: { alignItems: 'center' },
  priceAmount: { fontSize: 24, fontFamily: 'Cairo_700Bold', color: '#4CAF50' },
  packageDescription: { fontSize: 14, fontFamily: 'Cairo_400Regular', color: '#666', textAlign: 'right', marginBottom: 16, lineHeight: 22 },
  packageFeatures: { marginBottom: 16 },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  featureText: { fontSize: 14, fontFamily: 'Cairo_400Regular', color: '#333' },
  bookButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#4CAF50', padding: 14, borderRadius: 12, gap: 8 },
  bookButtonText: { fontSize: 16, fontFamily: 'Cairo_700Bold', color: '#fff' },
  bookingCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12 },
  bookingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  bookingName: { fontSize: 16, fontFamily: 'Cairo_700Bold', color: '#333' },
  coachNameText: { fontSize: 13, fontFamily: 'Cairo_400Regular', color: '#666', marginTop: 2 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontFamily: 'Cairo_700Bold' },
  bookingDetails: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#f0f0f0' },
  detailItem: { alignItems: 'center' },
  detailLabel: { fontSize: 12, fontFamily: 'Cairo_400Regular', color: '#999' },
  detailValue: { fontSize: 16, fontFamily: 'Cairo_700Bold', color: '#333' },
  bookingFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  bookingDate: { fontSize: 12, fontFamily: 'Cairo_400Regular', color: '#999' },
  bookingAmount: { fontSize: 16, fontFamily: 'Cairo_700Bold', color: '#4CAF50' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontFamily: 'Cairo_700Bold', color: '#333' },
  modalPackageInfo: { alignItems: 'center', padding: 20, backgroundColor: '#f5f5f5', borderRadius: 16, marginBottom: 20 },
  modalPackageName: { fontSize: 18, fontFamily: 'Cairo_700Bold', color: '#333' },
  modalPackageDetails: { fontSize: 14, fontFamily: 'Cairo_400Regular', color: '#666', marginTop: 4 },
  modalPackagePrice: { fontSize: 32, fontFamily: 'Cairo_700Bold', color: '#4CAF50', marginTop: 8 },
  paymentMethods: { marginBottom: 20 },
  paymentTitle: { fontSize: 16, fontFamily: 'Cairo_700Bold', color: '#333', marginBottom: 12, textAlign: 'right' },
  paymentOption: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#E3F2FD', borderRadius: 12, gap: 12 },
  paymentOptionText: { flex: 1, fontSize: 14, fontFamily: 'Cairo_400Regular', color: '#333', textAlign: 'right' },
  radioSelected: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#2196F3' },
  confirmButton: { backgroundColor: '#4CAF50', padding: 16, borderRadius: 12, alignItems: 'center' },
  confirmButtonText: { fontSize: 18, fontFamily: 'Cairo_700Bold', color: '#fff' },
});
