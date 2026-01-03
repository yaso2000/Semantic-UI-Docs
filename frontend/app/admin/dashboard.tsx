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
  Modal} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Cairo_400Regular, Cairo_700Bold } from '@expo-google-fonts/cairo';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface Stats {
  total_users: number;
  total_bookings: number;
  total_revenue: number;
}

interface User {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
}

interface Package {
  id: string;
  name: string;
  hours: number;
  price: number;
  description: string;
  active: boolean;
}

interface Booking {
  id: string;
  client_id: string;
  package_name: string;
  hours_purchased: number;
  hours_used: number;
  amount_paid: number;
  payment_status: string;
  created_at: string;
}

export default function AdminDashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'packages' | 'bookings'>('stats');
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [packageForm, setPackageForm] = useState({
    name: '',
    hours: '',
    price: '',
    description: ''});
  
  const [fontsLoaded] = useFonts({ Cairo_400Regular, Cairo_700Bold });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const getToken = async () => {
    return await AsyncStorage.getItem('token');
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const headers = { 'Authorization': `Bearer ${token}` };
      
      if (activeTab === 'stats') {
        const res = await fetch(`${API_URL}/api/admin/stats`, { headers });
        const data = await res.json();
        setStats(data);
      } else if (activeTab === 'users') {
        const res = await fetch(`${API_URL}/api/admin/users`, { headers });
        const data = await res.json();
        setUsers(data);
      } else if (activeTab === 'packages') {
        const res = await fetch(`${API_URL}/api/packages`);
        const data = await res.json();
        setPackages(data);
      } else if (activeTab === 'bookings') {
        const res = await fetch(`${API_URL}/api/bookings/all`, { headers });
        const data = await res.json();
        setBookings(data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const openPackageModal = (pkg?: Package) => {
    if (pkg) {
      setEditingPackage(pkg);
      setPackageForm({
        name: pkg.name,
        hours: pkg.hours.toString(),
        price: pkg.price.toString(),
        description: pkg.description});
    } else {
      setEditingPackage(null);
      setPackageForm({ name: '', hours: '', price: '', description: '' });
    }
    setShowPackageModal(true);
  };

  const savePackage = async () => {
    if (!packageForm.name || !packageForm.hours || !packageForm.price) {
      Alert.alert('خطأ', 'الرجاء ملء جميع الحقول المطلوبة');
      return;
    }

    try {
      const token = await getToken();
      const url = editingPackage 
        ? `${API_URL}/api/packages/${editingPackage.id}`
        : `${API_URL}/api/packages`;
      
      const response = await fetch(url, {
        method: editingPackage ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: packageForm.name,
          hours: parseInt(packageForm.hours),
          price: parseFloat(packageForm.price),
          description: packageForm.description,
          active: true})
      });

      if (response.ok) {
        Alert.alert('نجاح', editingPackage ? 'تم تحديث الباقة' : 'تم إنشاء الباقة');
        setShowPackageModal(false);
        loadData();
      } else {
        Alert.alert('خطأ', 'فشل في حفظ الباقة');
      }
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ في الاتصال');
    }
  };

  const deletePackage = async (pkgId: string) => {
    Alert.alert('تأكيد الحذف', 'هل أنت متأكد من حذف هذه الباقة؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: async () => {
          try {
            const token = await getToken();
            await fetch(`${API_URL}/api/packages/${pkgId}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
            });
            loadData();
          } catch (error) {
            Alert.alert('خطأ', 'فشل في حذف الباقة');
          }
        }
      }
    ]);
  };

  if (!fontsLoaded) return null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>لوحة التحكم</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsContainer}>
        <View style={styles.tabs}>
          {[
            { id: 'stats', icon: 'stats-chart', label: 'الإحصائيات' },
            { id: 'users', icon: 'people', label: 'المستخدمين' },
            { id: 'packages', icon: 'pricetag', label: 'الباقات' },
            { id: 'bookings', icon: 'calendar', label: 'الحجوزات' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, activeTab === tab.id && styles.tabActive]}
              onPress={() => setActiveTab(tab.id as any)}
            >
              <Ionicons name={tab.icon as any} size={20} color={activeTab === tab.id ? '#fff' : '#666'} />
              <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#2196F3" style={{ marginTop: 40 }} />
        ) : (
          <>
            {activeTab === 'stats' && stats && (
              <View style={styles.statsGrid}>
                <View style={[styles.statCard, { backgroundColor: '#E3F2FD' }]}>
                  <Ionicons name="people" size={40} color="#2196F3" />
                  <Text style={styles.statNumber}>{stats.total_users}</Text>
                  <Text style={styles.statLabel}>إجمالي المتدربين</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: '#E8F5E9' }]}>
                  <Ionicons name="calendar" size={40} color="#4CAF50" />
                  <Text style={styles.statNumber}>{stats.total_bookings}</Text>
                  <Text style={styles.statLabel}>إجمالي الحجوزات</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: '#FFF3E0' }]}>
                  <Ionicons name="cash" size={40} color="#FF9800" />
                  <Text style={styles.statNumber}>${stats.total_revenue}</Text>
                  <Text style={styles.statLabel}>إجمالي الإيرادات</Text>
                </View>
              </View>
            )}

            {activeTab === 'users' && (
              <>
                <Text style={styles.sectionTitle}>قائمة المتدربين ({users.length})</Text>
                {users.map((user) => (
                  <View key={user.id} style={styles.userCard}>
                    <View style={styles.userAvatar}>
                      <Ionicons name="person" size={24} color="#2196F3" />
                    </View>
                    <View style={styles.userInfo}>
                      <Text style={styles.userName}>{user.full_name}</Text>
                      <Text style={styles.userEmail}>{user.email}</Text>
                      <Text style={styles.userDate}>
                        انضم: {new Date(user.created_at).toLocaleDateString('ar-SA')}
                      </Text>
                    </View>
                    <TouchableOpacity>
                      <Ionicons name="ellipsis-vertical" size={24} color="#666" />
                    </TouchableOpacity>
                  </View>
                ))}
              </>
            )}

            {activeTab === 'packages' && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>الباقات ({packages.length})</Text>
                  <TouchableOpacity style={styles.addButton} onPress={() => openPackageModal()}>
                    <Ionicons name="add" size={20} color="#fff" />
                    <Text style={styles.addButtonText}>إضافة</Text>
                  </TouchableOpacity>
                </View>
                {packages.map((pkg) => (
                  <View key={pkg.id} style={styles.packageCard}>
                    <View style={styles.packageHeader}>
                      <Text style={styles.packageName}>{pkg.name}</Text>
                      <Text style={styles.packagePrice}>${pkg.price}</Text>
                    </View>
                    <Text style={styles.packageDetails}>{pkg.hours} ساعة - {pkg.description}</Text>
                    <View style={styles.packageActions}>
                      <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => openPackageModal(pkg)}
                      >
                        <Ionicons name="create" size={18} color="#2196F3" />
                        <Text style={styles.editButtonText}>تعديل</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => deletePackage(pkg.id)}
                      >
                        <Ionicons name="trash" size={18} color="#F44336" />
                        <Text style={styles.deleteButtonText}>حذف</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </>
            )}

            {activeTab === 'bookings' && (
              <>
                <Text style={styles.sectionTitle}>جميع الحجوزات ({bookings.length})</Text>
                {bookings.map((booking) => (
                  <View key={booking.id} style={styles.bookingCard}>
                    <View style={styles.bookingHeader}>
                      <Text style={styles.bookingPackage}>{booking.package_name}</Text>
                      <View style={[
                        styles.statusBadge,
                        { backgroundColor: booking.payment_status === 'completed' ? '#E8F5E9' : '#FFF3E0' }
                      ]}>
                        <Text style={[
                          styles.statusText,
                          { color: booking.payment_status === 'completed' ? '#4CAF50' : '#FF9800' }
                        ]}>
                          {booking.payment_status === 'completed' ? 'مكتمل' : 'قيد الانتظار'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.bookingInfo}>
                      <Text style={styles.bookingDetail}>الساعات: {booking.hours_purchased}</Text>
                      <Text style={styles.bookingDetail}>المستخدم: {booking.hours_used}</Text>
                      <Text style={styles.bookingAmount}>${booking.amount_paid}</Text>
                    </View>
                    <Text style={styles.bookingDate}>
                      {new Date(booking.created_at).toLocaleDateString('ar-SA')}
                    </Text>
                  </View>
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>

      <Modal visible={showPackageModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingPackage ? 'تعديل الباقة' : 'إضافة باقة جديدة'}
              </Text>
              <TouchableOpacity onPress={() => setShowPackageModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>اسم الباقة *</Text>
              <TextInput
                style={styles.formInput}
                value={packageForm.name}
                onChangeText={(text) => setPackageForm({ ...packageForm, name: text })}
                placeholder="مثال: الباقة الأساسية"
              />
            </View>
            
            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>عدد الساعات *</Text>
                <TextInput
                  style={styles.formInput}
                  value={packageForm.hours}
                  onChangeText={(text) => setPackageForm({ ...packageForm, hours: text })}
                  keyboardType="numeric"
                  placeholder="5"
                />
              </View>
              <View style={[styles.formGroup, { flex: 1, marginLeft: 12 }]}>
                <Text style={styles.formLabel}>السعر ($) *</Text>
                <TextInput
                  style={styles.formInput}
                  value={packageForm.price}
                  onChangeText={(text) => setPackageForm({ ...packageForm, price: text })}
                  keyboardType="numeric"
                  placeholder="99"
                />
              </View>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>الوصف</Text>
              <TextInput
                style={[styles.formInput, { height: 80 }]}
                value={packageForm.description}
                onChangeText={(text) => setPackageForm({ ...packageForm, description: text })}
                placeholder="وصف الباقة..."
                multiline
              />
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={savePackage}>
              <Text style={styles.saveButtonText}>حفظ الباقة</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'},
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontFamily: 'Cairo_700Bold', color: '#333' },
  tabsContainer: { backgroundColor: '#fff', maxHeight: 60 },
  tabs: { flexDirection: 'row', padding: 12, gap: 8 },
  tab: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#f5f5f5', gap: 6 },
  tabActive: { backgroundColor: '#2196F3' },
  tabText: { fontSize: 14, fontFamily: 'Cairo_700Bold', color: '#666' },
  tabTextActive: { color: '#fff' },
  content: { padding: 16, paddingBottom: 100 },
  statsGrid: { gap: 12 },
  statCard: { padding: 24, borderRadius: 16, alignItems: 'center' },
  statNumber: { fontSize: 36, fontFamily: 'Cairo_700Bold', color: '#333', marginTop: 12 },
  statLabel: { fontSize: 14, fontFamily: 'Cairo_400Regular', color: '#666', marginTop: 4 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontFamily: 'Cairo_700Bold', color: '#333', marginBottom: 16, textAlign: 'right' },
  addButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#4CAF50', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, gap: 4 },
  addButtonText: { fontSize: 14, fontFamily: 'Cairo_700Bold', color: '#fff' },
  userCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 8 },
  userAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center', marginLeft: 12 },
  userInfo: { flex: 1 },
  userName: { fontSize: 16, fontFamily: 'Cairo_700Bold', color: '#333', textAlign: 'right' },
  userEmail: { fontSize: 12, fontFamily: 'Cairo_400Regular', color: '#666', textAlign: 'right' },
  userDate: { fontSize: 10, fontFamily: 'Cairo_400Regular', color: '#999', textAlign: 'right', marginTop: 4 },
  packageCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12 },
  packageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  packageName: { fontSize: 16, fontFamily: 'Cairo_700Bold', color: '#333' },
  packagePrice: { fontSize: 20, fontFamily: 'Cairo_700Bold', color: '#4CAF50' },
  packageDetails: { fontSize: 14, fontFamily: 'Cairo_400Regular', color: '#666', textAlign: 'right', marginBottom: 12 },
  packageActions: { flexDirection: 'row', gap: 12 },
  editButton: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 8, backgroundColor: '#E3F2FD', borderRadius: 8 },
  editButtonText: { fontSize: 12, fontFamily: 'Cairo_700Bold', color: '#2196F3' },
  deleteButton: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 8, backgroundColor: '#FFEBEE', borderRadius: 8 },
  deleteButtonText: { fontSize: 12, fontFamily: 'Cairo_700Bold', color: '#F44336' },
  bookingCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 8 },
  bookingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  bookingPackage: { fontSize: 16, fontFamily: 'Cairo_700Bold', color: '#333' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontFamily: 'Cairo_700Bold' },
  bookingInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bookingDetail: { fontSize: 12, fontFamily: 'Cairo_400Regular', color: '#666' },
  bookingAmount: { fontSize: 16, fontFamily: 'Cairo_700Bold', color: '#4CAF50' },
  bookingDate: { fontSize: 10, fontFamily: 'Cairo_400Regular', color: '#999', textAlign: 'right', marginTop: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontFamily: 'Cairo_700Bold', color: '#333' },
  formGroup: { marginBottom: 16 },
  formLabel: { fontSize: 14, fontFamily: 'Cairo_700Bold', color: '#333', marginBottom: 8, textAlign: 'right' },
  formInput: { backgroundColor: '#f5f5f5', borderRadius: 12, padding: 14, fontSize: 16, fontFamily: 'Cairo_400Regular', textAlign: 'right' },
  formRow: { flexDirection: 'row' },
  saveButton: { backgroundColor: '#4CAF50', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  saveButtonText: { fontSize: 18, fontFamily: 'Cairo_700Bold', color: '#fff' }});
