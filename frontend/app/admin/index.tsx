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
  total_bookings: number;
  total_revenue: number;
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
          <View style={[styles.statCard, { backgroundColor: '#E3F2FD' }]}>
            <View style={[styles.statIcon, { backgroundColor: '#2196F3' }]}>
              <Ionicons name="people" size={28} color="#fff" />
            </View>
            <Text style={styles.statNumber}>{stats?.total_users || 0}</Text>
            <Text style={styles.statLabel}>المتدربين</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#E8F5E9' }]}>
            <View style={[styles.statIcon, { backgroundColor: '#4CAF50' }]}>
              <Ionicons name="calendar" size={28} color="#fff" />
            </View>
            <Text style={styles.statNumber}>{stats?.total_bookings || 0}</Text>
            <Text style={styles.statLabel}>الحجوزات</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#FFF3E0' }]}>
            <View style={[styles.statIcon, { backgroundColor: '#FF9800' }]}>
              <Ionicons name="cash" size={28} color="#fff" />
            </View>
            <Text style={styles.statNumber}>${stats?.total_revenue || 0}</Text>
            <Text style={styles.statLabel}>الإيرادات</Text>
          </View>
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>إدارة التطبيق</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/admin/packages' as any)}
          >
            <View style={[styles.menuIcon, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="pricetag" size={24} color="#4CAF50" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>إدارة الباقات</Text>
              <Text style={styles.menuSubtitle}>إضافة وتعديل وحذف الباقات</Text>
            </View>
            <Ionicons name="chevron-back" size={24} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/admin/bookings' as any)}
          >
            <View style={[styles.menuIcon, { backgroundColor: '#E3F2FD' }]}>
              <Ionicons name="calendar" size={24} color="#2196F3" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>إدارة الحجوزات</Text>
              <Text style={styles.menuSubtitle}>عرض وإدارة جميع الحجوزات</Text>
            </View>
            <Ionicons name="chevron-back" size={24} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/admin/users' as any)}
          >
            <View style={[styles.menuIcon, { backgroundColor: '#F3E5F5' }]}>
              <Ionicons name="people" size={24} color="#9C27B0" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>إدارة المتدربين</Text>
              <Text style={styles.menuSubtitle}>عرض بيانات المتدربين</Text>
            </View>
            <Ionicons name="chevron-back" size={24} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={[styles.menuIcon, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="folder" size={24} color="#FF9800" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>مكتبة الموارد</Text>
              <Text style={styles.menuSubtitle}>رفع وإدارة الملفات والمصادر</Text>
            </View>
            <Ionicons name="chevron-back" size={24} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={[styles.menuIcon, { backgroundColor: '#FFEBEE' }]}>
              <Ionicons name="chatbubbles" size={24} color="#F44336" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>المحادثات</Text>
              <Text style={styles.menuSubtitle}>التواصل مع المتدربين</Text>
            </View>
            <Ionicons name="chevron-back" size={24} color="#999" />
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    fontSize: 24,
    fontFamily: 'Cairo_700Bold',
    color: '#333',
    textAlign: 'right',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '30%',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  statIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 24,
    fontFamily: 'Cairo_700Bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Cairo_400Regular',
    color: '#666',
    marginTop: 4,
  },
  menuSection: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Cairo_700Bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'right',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontFamily: 'Cairo_700Bold',
    color: '#333',
    textAlign: 'right',
  },
  menuSubtitle: {
    fontSize: 12,
    fontFamily: 'Cairo_400Regular',
    color: '#999',
    textAlign: 'right',
    marginTop: 2,
  },
});
