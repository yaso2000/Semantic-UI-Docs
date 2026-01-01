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

interface Coach {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
  has_subscription: boolean;
  subscription_status: string;
}

export default function AdminCoaches() {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const [fontsLoaded] = useFonts({ Cairo_400Regular, Cairo_700Bold });

  useEffect(() => {
    loadCoaches();
  }, []);

  const loadCoaches = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/admin/coaches-with-status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCoaches(data);
      }
    } catch (error) {
      console.error('Error loading coaches:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadCoaches();
  };

  const handleChangeRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'coach' ? 'client' : 'coach';
    const message = newRole === 'coach' 
      ? 'هل تريد تحويل هذا المستخدم إلى مدرب؟'
      : 'هل تريد تحويل هذا المدرب إلى متدرب؟';

    Alert.alert('تغيير الصفة', message, [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'تأكيد',
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/admin/users/${userId}/role`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ role: newRole })
            });
            if (response.ok) {
              Alert.alert('نجاح', 'تم تغيير الصفة بنجاح');
              loadCoaches();
            }
          } catch (error) {
            Alert.alert('خطأ', 'فشل في تغيير الصفة');
          }
        }
      }
    ]);
  };

  const renderCoach = ({ item }: { item: Coach }) => (
    <View style={styles.coachCard}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={24} color="#fff" />
        </View>
        <View style={styles.coachInfo}>
          <Text style={styles.coachName}>{item.full_name}</Text>
          <Text style={styles.coachEmail}>{item.email}</Text>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: item.has_subscription ? '#E8F5E9' : '#FFEBEE' }
        ]}>
          <Text style={[
            styles.statusText,
            { color: item.has_subscription ? '#4CAF50' : '#F44336' }
          ]}>
            {item.has_subscription ? 'مشترك' : 'غير مشترك'}
          </Text>
        </View>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#E3F2FD' }]}
          onPress={() => router.push(`/(tabs)/chat?userId=${item.id}` as any)}
        >
          <Ionicons name="chatbubble" size={18} color="#2196F3" />
          <Text style={[styles.actionBtnText, { color: '#2196F3' }]}>محادثة</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#FFF3E0' }]}
          onPress={() => router.push(`/admin/subscriptions` as any)}
        >
          <Ionicons name="card" size={18} color="#FF9800" />
          <Text style={[styles.actionBtnText, { color: '#FF9800' }]}>اشتراك</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#FFEBEE' }]}
          onPress={() => handleChangeRole(item.id, 'coach')}
        >
          <Ionicons name="swap-horizontal" size={18} color="#F44336" />
          <Text style={[styles.actionBtnText, { color: '#F44336' }]}>تحويل لمتدرب</Text>
        </TouchableOpacity>
      </View>
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
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>المدربين</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{coaches.length}</Text>
        </View>
      </View>

      <FlatList
        data={coaches}
        renderItem={renderCoach}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="fitness-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>لا يوجد مدربين بعد</Text>
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
    backgroundColor: '#FF9800',
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
    fontSize: 20,
    fontFamily: 'Cairo_700Bold',
    color: '#fff',
    textAlign: 'right',
  },
  countBadge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countText: {
    fontSize: 14,
    fontFamily: 'Cairo_700Bold',
    color: '#fff',
  },
  listContent: { padding: 16 },
  coachCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FF9800',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  coachInfo: { flex: 1 },
  coachName: {
    fontSize: 16,
    fontFamily: 'Cairo_700Bold',
    color: '#333',
    textAlign: 'right',
  },
  coachEmail: {
    fontSize: 12,
    fontFamily: 'Cairo_400Regular',
    color: '#666',
    textAlign: 'right',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 11,
    fontFamily: 'Cairo_700Bold',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 8,
    gap: 4,
  },
  actionBtnText: {
    fontSize: 11,
    fontFamily: 'Cairo_700Bold',
  },
  emptyState: { alignItems: 'center', paddingTop: 80 },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Cairo_400Regular',
    color: '#999',
    marginTop: 16,
  },
});
