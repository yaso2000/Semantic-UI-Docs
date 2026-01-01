import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFonts, Cairo_400Regular, Cairo_700Bold } from '@expo-google-fonts/cairo';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

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

export default function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const [fontsLoaded] = useFonts({ Cairo_400Regular, Cairo_700Bold });

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/bookings/all`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setBookings(data);
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadBookings();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return { bg: '#E8F5E9', text: '#4CAF50' };
      case 'pending':
        return { bg: '#FFF3E0', text: '#FF9800' };
      case 'cancelled':
        return { bg: '#FFEBEE', text: '#F44336' };
      default:
        return { bg: '#F5F5F5', text: '#666' };
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'مكتمل';
      case 'pending':
        return 'قيد الانتظار';
      case 'cancelled':
        return 'ملغي';
      default:
        return status;
    }
  };

  const renderBooking = ({ item }: { item: Booking }) => {
    const statusColor = getStatusColor(item.payment_status);

    return (
      <View style={styles.bookingCard}>
        <View style={styles.bookingHeader}>
          <View style={styles.packageInfo}>
            <Text style={styles.packageName}>{item.package_name}</Text>
            <Text style={styles.bookingDate}>
              {new Date(item.created_at).toLocaleDateString('ar-SA')}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
            <Text style={[styles.statusText, { color: statusColor.text }]}>
              {getStatusLabel(item.payment_status)}
            </Text>
          </View>
        </View>

        <View style={styles.bookingDetails}>
          <View style={styles.detailItem}>
            <Ionicons name="time-outline" size={18} color="#666" />
            <Text style={styles.detailLabel}>الساعات</Text>
            <Text style={styles.detailValue}>{item.hours_purchased}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="checkmark-circle-outline" size={18} color="#666" />
            <Text style={styles.detailLabel}>المستخدم</Text>
            <Text style={styles.detailValue}>{item.hours_used}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="hourglass-outline" size={18} color="#4CAF50" />
            <Text style={styles.detailLabel}>المتبقي</Text>
            <Text style={[styles.detailValue, { color: '#4CAF50' }]}>
              {item.hours_purchased - item.hours_used}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="cash-outline" size={18} color="#666" />
            <Text style={styles.detailLabel}>المبلغ</Text>
            <Text style={styles.detailValue}>${item.amount_paid}</Text>
          </View>
        </View>
      </View>
    );
  };

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-forward" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>إدارة الحجوزات</Text>
      </View>

      <FlatList
        data={bookings}
        renderItem={renderBooking}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>لا توجد حجوزات بعد</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginLeft: 16,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontFamily: 'Cairo_700Bold',
    color: '#333',
    textAlign: 'right',
  },
  listContent: {
    padding: 16,
  },
  bookingCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  packageInfo: {
    flex: 1,
  },
  packageName: {
    fontSize: 16,
    fontFamily: 'Cairo_700Bold',
    color: '#333',
    textAlign: 'right',
  },
  bookingDate: {
    fontSize: 12,
    fontFamily: 'Cairo_400Regular',
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Cairo_700Bold',
  },
  bookingDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  detailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 10,
    fontFamily: 'Cairo_400Regular',
    color: '#999',
    marginTop: 4,
  },
  detailValue: {
    fontSize: 16,
    fontFamily: 'Cairo_700Bold',
    color: '#333',
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Cairo_400Regular',
    color: '#999',
    marginTop: 16,
  },
});
