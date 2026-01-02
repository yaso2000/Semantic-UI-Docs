import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFonts, Cairo_400Regular, Cairo_700Bold } from '@expo-google-fonts/cairo';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

// ألوان مختلفة لكل حرف
const LETTER_COLORS: { [key: string]: string } = {
  'ا': '#E91E63', 'أ': '#E91E63', 'إ': '#E91E63', 'آ': '#E91E63',
  'ب': '#9C27B0', 'ت': '#673AB7', 'ث': '#3F51B5',
  'ج': '#2196F3', 'ح': '#03A9F4', 'خ': '#00BCD4',
  'د': '#009688', 'ذ': '#4CAF50', 'ر': '#8BC34A',
  'م': '#00BCD4', 'ع': '#E91E63',
};

const getLetterColor = (name: string): string => {
  const firstLetter = name?.trim().charAt(0) || '?';
  return LETTER_COLORS[firstLetter] || '#FF9800';
};

interface Booking {
  id: string;
  client_id: string;
  client_name: string;
  package_name: string;
  hours_purchased: number;
  hours_used: number;
  amount: number;
  payment_status: string;
  booking_status: string;
  notes: string;
  created_at: string;
}

export default function MyTraineesScreen() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'confirmed' | 'all'>('all');
  const router = useRouter();

  const [fontsLoaded] = useFonts({ Cairo_400Regular, Cairo_700Bold });

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/coach/my-clients`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setBookings(data);
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const updateBookingStatus = async (bookingId: string, status: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/bookings/${bookingId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ booking_status: status })
      });
      
      if (response.ok) {
        Alert.alert('نجاح', status === 'confirmed' ? 'تم قبول الحجز' : 'تم تحديث الحجز');
        loadBookings();
      }
    } catch (error) {
      Alert.alert('خطأ', 'فشل في تحديث الحجز');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadBookings();
  };

  const filteredBookings = bookings.filter(b => {
    if (activeTab === 'pending') return b.booking_status === 'pending';
    if (activeTab === 'confirmed') return b.booking_status === 'confirmed';
    return true;
  });

  const pendingCount = bookings.filter(b => b.booking_status === 'pending').length;

  const renderBooking = ({ item }: { item: Booking }) => (
    <View style={styles.bookingCard}>
      <View style={styles.bookingHeader}>
        <View style={[styles.avatar, { backgroundColor: getLetterColor(item.client_name) }]}>
          <Text style={styles.avatarLetter}>
            {item.client_name?.charAt(0).toUpperCase() || '?'}
          </Text>
        </View>
        <View style={styles.clientInfo}>
          <Text style={styles.clientName}>{item.client_name}</Text>
          <Text style={styles.packageName}>{item.package_name}</Text>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: item.booking_status === 'confirmed' ? '#E8F5E9' : 
                           item.booking_status === 'completed' ? '#E3F2FD' : '#FFF3E0' }
        ]}>
          <Text style={[
            styles.statusText,
            { color: item.booking_status === 'confirmed' ? '#4CAF50' : 
                    item.booking_status === 'completed' ? '#2196F3' : '#FF9800' }
          ]}>
            {item.booking_status === 'confirmed' ? 'مؤكد' : 
             item.booking_status === 'completed' ? 'مكتمل' : 'جديد'}
          </Text>
        </View>
      </View>

      <View style={styles.bookingDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailValue}>{item.hours_purchased} ساعة</Text>
          <Text style={styles.detailLabel}>الساعات المحجوزة</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailValue}>{item.hours_used} ساعة</Text>
          <Text style={styles.detailLabel}>المستخدمة</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={[styles.detailValue, { color: '#4CAF50' }]}>${item.amount}</Text>
          <Text style={styles.detailLabel}>المبلغ</Text>
        </View>
      </View>

      {item.notes && (
        <View style={styles.notesSection}>
          <Ionicons name="document-text" size={16} color="#666" />
          <Text style={styles.notesText}>{item.notes}</Text>
        </View>
      )}

      <View style={styles.bookingActions}>
        {item.booking_status === 'pending' && (
          <>
            <TouchableOpacity
              style={styles.acceptBtn}
              onPress={() => updateBookingStatus(item.id, 'confirmed')}
            >
              <Ionicons name="checkmark" size={18} color="#fff" />
              <Text style={styles.acceptBtnText}>قبول</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.rejectBtn}
              onPress={() => updateBookingStatus(item.id, 'rejected')}
            >
              <Ionicons name="close" size={18} color="#F44336" />
              <Text style={styles.rejectBtnText}>رفض</Text>
            </TouchableOpacity>
          </>
        )}
        <TouchableOpacity
          style={styles.chatBtn}
          onPress={() => router.push(`/(tabs)/chat?recipientId=${item.client_id}` as any)}
        >
          <Ionicons name="chatbubble" size={18} color="#FF9800" />
          <Text style={styles.chatBtnText}>محادثة</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.bookingDate}>
        {new Date(item.created_at).toLocaleDateString('ar-SA')}
      </Text>
    </View>
  );

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF9800" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>المتدربين</Text>
        {pendingCount > 0 && (
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingText}>{pendingCount} جديد</Text>
          </View>
        )}
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.tabActive]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>الكل</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pending' && styles.tabActive]}
          onPress={() => setActiveTab('pending')}
        >
          <Text style={[styles.tabText, activeTab === 'pending' && styles.tabTextActive]}>جديد</Text>
          {pendingCount > 0 && <View style={styles.tabBadge}><Text style={styles.tabBadgeText}>{pendingCount}</Text></View>}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'confirmed' && styles.tabActive]}
          onPress={() => setActiveTab('confirmed')}
        >
          <Text style={[styles.tabText, activeTab === 'confirmed' && styles.tabTextActive]}>مؤكد</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredBookings}
        keyExtractor={(item) => item.id}
        renderItem={renderBooking}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>لا توجد حجوزات بعد</Text>
            <Text style={styles.emptySubtext}>ستظهر هنا طلبات الحجز من المتدربين</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backBtn: {
    marginLeft: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 22,
    fontFamily: 'Cairo_700Bold',
    color: '#333',
    textAlign: 'right',
  },
  pendingBadge: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pendingText: {
    fontSize: 12,
    fontFamily: 'Cairo_700Bold',
    color: '#fff',
  },

  tabs: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    backgroundColor: '#fff',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
    gap: 6,
  },
  tabActive: {
    backgroundColor: '#FF9800',
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'Cairo_700Bold',
    color: '#666',
  },
  tabTextActive: {
    color: '#fff',
  },
  tabBadge: {
    backgroundColor: '#F44336',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBadgeText: {
    fontSize: 11,
    fontFamily: 'Cairo_700Bold',
    color: '#fff',
  },

  listContent: {
    padding: 16,
    paddingBottom: 100,
  },

  bookingCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  bookingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  avatarLetter: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontFamily: 'Cairo_700Bold',
    color: '#333',
    textAlign: 'right',
  },
  packageName: {
    fontSize: 13,
    fontFamily: 'Cairo_400Regular',
    color: '#666',
    textAlign: 'right',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Cairo_700Bold',
  },

  bookingDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
    marginBottom: 12,
  },
  detailRow: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 11,
    fontFamily: 'Cairo_400Regular',
    color: '#999',
  },
  detailValue: {
    fontSize: 16,
    fontFamily: 'Cairo_700Bold',
    color: '#333',
  },

  notesSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    gap: 8,
  },
  notesText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Cairo_400Regular',
    color: '#666',
    textAlign: 'right',
    lineHeight: 20,
  },

  bookingActions: {
    flexDirection: 'row',
    gap: 10,
  },
  acceptBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  acceptBtnText: {
    fontSize: 14,
    fontFamily: 'Cairo_700Bold',
    color: '#fff',
  },
  rejectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFEBEE',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 6,
  },
  rejectBtnText: {
    fontSize: 14,
    fontFamily: 'Cairo_700Bold',
    color: '#F44336',
  },
  chatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF3E0',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 6,
  },
  chatBtnText: {
    fontSize: 14,
    fontFamily: 'Cairo_700Bold',
    color: '#FF9800',
  },

  bookingDate: {
    fontSize: 11,
    fontFamily: 'Cairo_400Regular',
    color: '#999',
    textAlign: 'left',
    marginTop: 10,
  },

  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: 'Cairo_700Bold',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: 'Cairo_400Regular',
    color: '#999',
    marginTop: 4,
  },
});
