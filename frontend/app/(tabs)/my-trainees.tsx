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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFonts, Cairo_400Regular, Cairo_700Bold } from '@expo-google-fonts/cairo';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface Trainee {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
  hours_remaining: number;
  last_session?: string;
}

export default function MyTraineesScreen() {
  const [trainees, setTrainees] = useState<Trainee[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const [fontsLoaded] = useFonts({ Cairo_400Regular, Cairo_700Bold });

  useEffect(() => {
    loadTrainees();
  }, []);

  const loadTrainees = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/coach/my-trainees`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setTrainees(data);
      }
    } catch (error) {
      console.error('Error loading trainees:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTrainees();
  };

  const renderTrainee = ({ item }: { item: Trainee }) => (
    <View style={styles.traineeCard}>
      <View style={styles.avatar}>
        <Ionicons name="person" size={28} color="#fff" />
      </View>
      <View style={styles.traineeInfo}>
        <Text style={styles.traineeName}>{item.full_name}</Text>
        <Text style={styles.traineeEmail}>{item.email}</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="time" size={14} color="#4CAF50" />
            <Text style={styles.statText}>{item.hours_remaining || 0} ساعة متبقية</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity
        style={styles.chatBtn}
        onPress={() => router.push(`/(tabs)/chat?userId=${item.id}` as any)}
      >
        <Ionicons name="chatbubble" size={20} color="#FF9800" />
      </TouchableOpacity>
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
        <Text style={styles.headerTitle}>متدربيني</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{trainees.length}</Text>
        </View>
      </View>

      <FlatList
        data={trainees}
        renderItem={renderTrainee}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="school-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>لا يوجد متدربين بعد</Text>
            <Text style={styles.emptySubtext}>سيظهر هنا المتدربين المسجلين معك</Text>
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
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#FF9800',
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Cairo_700Bold',
    color: '#fff',
  },
  countBadge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  countText: {
    fontSize: 16,
    fontFamily: 'Cairo_700Bold',
    color: '#fff',
  },
  listContent: { padding: 16 },
  traineeCard: {
    flexDirection: 'row',
    alignItems: 'center',
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
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
  traineeInfo: { flex: 1 },
  traineeName: {
    fontSize: 16,
    fontFamily: 'Cairo_700Bold',
    color: '#333',
    textAlign: 'right',
  },
  traineeEmail: {
    fontSize: 12,
    fontFamily: 'Cairo_400Regular',
    color: '#666',
    textAlign: 'right',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    fontFamily: 'Cairo_400Regular',
    color: '#4CAF50',
  },
  chatBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: { alignItems: 'center', paddingTop: 80 },
  emptyText: {
    fontSize: 18,
    fontFamily: 'Cairo_700Bold',
    color: '#999',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: 'Cairo_400Regular',
    color: '#bbb',
    marginTop: 4,
  },
});
