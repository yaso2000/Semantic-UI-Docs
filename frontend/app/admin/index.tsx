import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFonts, Cairo_400Regular, Cairo_700Bold } from '@expo-google-fonts/cairo';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface AdminStats {
  total_users: number;
  coaches: number;
  total_bookings: number;
  total_revenue: number;
  active_subscriptions: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const [fontsLoaded] = useFonts({ Cairo_400Regular, Cairo_700Bold });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/admin/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadStats();
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
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-forward" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>لوحة التحكم</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: '#E8F5E9' }]}>
            <Ionicons name="people" size={28} color="#4CAF50" />
            <Text style={styles.statNumber}>{stats?.total_users || 0}</Text>
            <Text style={styles.statLabel}>المتدربين</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#FFF3E0' }]}>
            <Ionicons name="fitness" size={28} color="#FF9800" />
            <Text style={styles.statNumber}>{stats?.coaches || 0}</Text>
            <Text style={styles.statLabel}>المدربين</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#E3F2FD' }]}>
            <Ionicons name="card" size={28} color="#2196F3" />
            <Text style={styles.statNumber}>{stats?.active_subscriptions || 0}</Text>
            <Text style={styles.statLabel}>اشتراك نشط</Text>
          </View>
        </View>

        {/* قسم إدارة المتدربين */}
        <View style={styles.menuSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="school" size={20} color="#4CAF50" />
            <Text style={[styles.sectionTitle, { color: '#4CAF50' }]}>إدارة المتدربين</Text>
          </View>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/admin/packages' as any)}
          >
            <View style={[styles.menuIcon, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="pricetag" size={22} color="#4CAF50" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>إدارة الباقات</Text>
              <Text style={styles.menuSubtitle}>باقات التدريب للمتدربين</Text>
            </View>
            <Ionicons name="chevron-back" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/admin/users' as any)}
          >
            <View style={[styles.menuIcon, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="people" size={22} color="#4CAF50" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>قائمة المتدربين</Text>
              <Text style={styles.menuSubtitle}>عرض وإدارة المتدربين</Text>
            </View>
            <Ionicons name="chevron-back" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/admin/bookings' as any)}
          >
            <View style={[styles.menuIcon, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="calendar" size={22} color="#4CAF50" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>حجوزات المتدربين</Text>
              <Text style={styles.menuSubtitle}>عرض جميع الحجوزات</Text>
            </View>
            <Ionicons name="chevron-back" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        {/* قسم إدارة المدربين */}
        <View style={styles.menuSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="fitness" size={20} color="#FF9800" />
            <Text style={[styles.sectionTitle, { color: '#FF9800' }]}>إدارة المدربين</Text>
          </View>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/admin/subscriptions' as any)}
          >
            <View style={[styles.menuIcon, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="card" size={22} color="#FF9800" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>إدارة الاشتراكات</Text>
              <Text style={styles.menuSubtitle}>اشتراكات المدربين الشهرية/السنوية</Text>
            </View>
            <Ionicons name="chevron-back" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/admin/coaches' as any)}
          >
            <View style={[styles.menuIcon, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="people" size={22} color="#FF9800" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>قائمة المدربين</Text>
              <Text style={styles.menuSubtitle}>عرض وتحويل الصفات</Text>
            </View>
            <Ionicons name="chevron-back" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        {/* قسم عام */}
        <View style={styles.menuSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="settings" size={20} color="#2196F3" />
            <Text style={[styles.sectionTitle, { color: '#2196F3' }]}>عام</Text>
          </View>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/admin/resources' as any)}
          >
            <View style={[styles.menuIcon, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="library" size={22} color="#4CAF50" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>إدارة المكتبة</Text>
              <Text style={styles.menuSubtitle}>إضافة وتعديل الموارد والمقالات</Text>
            </View>
            <Ionicons name="chevron-back" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/admin/settings' as any)}
          >
            <View style={[styles.menuIcon, { backgroundColor: '#E3F2FD' }]}>
              <Ionicons name="options" size={22} color="#2196F3" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>إعدادات المنصة</Text>
              <Text style={styles.menuSubtitle}>حدود الأسعار والإعدادات العامة</Text>
            </View>
            <Ionicons name="chevron-back" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/(tabs)/chat')}
          >
            <View style={[styles.menuIcon, { backgroundColor: '#FFEBEE' }]}>
              <Ionicons name="chatbubbles" size={22} color="#F44336" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>المحادثات</Text>
              <Text style={styles.menuSubtitle}>التواصل مع المستخدمين</Text>
            </View>
            <Ionicons name="chevron-back" size={20} color="#999" />
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    backgroundColor: '#2196F3',
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
    fontSize: 22,
    fontFamily: 'Cairo_700Bold',
    color: '#fff',
    textAlign: 'right',
  },
  statsGrid: {
    flexDirection: 'row',
    padding: 16,
    gap: 10,
  },
  statCard: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 22,
    fontFamily: 'Cairo_700Bold',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: 'Cairo_400Regular',
    color: '#666',
    marginTop: 2,
  },
  menuSection: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 14,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Cairo_700Bold',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  menuIcon: {
    width: 42,
    height: 42,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  menuContent: { flex: 1 },
  menuTitle: {
    fontSize: 15,
    fontFamily: 'Cairo_700Bold',
    color: '#333',
    textAlign: 'right',
  },
  menuSubtitle: {
    fontSize: 11,
    fontFamily: 'Cairo_400Regular',
    color: '#999',
    textAlign: 'right',
    marginTop: 1,
  },
});
