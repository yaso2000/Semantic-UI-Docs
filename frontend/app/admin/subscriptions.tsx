import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  TextInput} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFonts, Cairo_400Regular, Cairo_700Bold } from '@expo-google-fonts/cairo';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface Subscription {
  id: string;
  coach_id: string;
  coach_name: string;
  coach_email: string;
  plan: string;
  status: string;
  start_date: string;
  end_date: string;
  amount: number;
}

interface Coach {
  id: string;
  full_name: string;
  email: string;
}

export default function AdminSubscriptions() {
  const insets = useSafeAreaInsets();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedCoach, setSelectedCoach] = useState<string>('');
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [duration, setDuration] = useState('1');
  const router = useRouter();

  const [fontsLoaded] = useFonts({ Cairo_400Regular, Cairo_700Bold });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const [subsRes, coachesRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/subscriptions`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/admin/coaches`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);
      
      if (subsRes.ok) setSubscriptions(await subsRes.json());
      if (coachesRes.ok) setCoaches(await coachesRes.json());
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleGrantSubscription = async () => {
    if (!selectedCoach) {
      Alert.alert('خطأ', 'يرجى اختيار مدرب');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/admin/grant-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          coach_id: selectedCoach,
          plan: selectedPlan,
          duration_months: parseInt(duration)
        })
      });

      if (response.ok) {
        Alert.alert('نجاح', 'تم منح الاشتراك بنجاح');
        setShowModal(false);
        setSelectedCoach('');
        loadData();
      } else {
        Alert.alert('خطأ', 'فشل في منح الاشتراك');
      }
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ في الاتصال');
    }
  };

  const handleCancelSubscription = async (subscriptionId: string) => {
    Alert.alert(
      'إلغاء الاشتراك',
      'هل أنت متأكد من إلغاء هذا الاشتراك؟',
      [
        { text: 'لا', style: 'cancel' },
        {
          text: 'نعم',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              const response = await fetch(`${API_URL}/api/admin/subscriptions/${subscriptionId}/cancel`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
              });
              if (response.ok) {
                Alert.alert('نجاح', 'تم إلغاء الاشتراك');
                loadData();
              }
            } catch (error) {
              Alert.alert('خطأ', 'فشل في إلغاء الاشتراك');
            }
          }
        }
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return { bg: '#E8F5E9', text: '#4CAF50' };
      case 'expired': return { bg: '#FFEBEE', text: '#F44336' };
      case 'cancelled': return { bg: '#F5F5F5', text: '#999' };
      default: return { bg: '#FFF3E0', text: '#FF9800' };
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'نشط';
      case 'expired': return 'منتهي';
      case 'cancelled': return 'ملغي';
      default: return status;
    }
  };

  const renderSubscription = ({ item }: { item: Subscription }) => {
    const statusColor = getStatusColor(item.status);
    
    return (
      <View style={styles.subscriptionCard}>
        <View style={styles.cardHeader}>
          <View style={styles.coachInfo}>
            <Text style={styles.coachName}>{item.coach_name}</Text>
            <Text style={styles.coachEmail}>{item.coach_email}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
            <Text style={[styles.statusText, { color: statusColor.text }]}>
              {getStatusLabel(item.status)}
            </Text>
          </View>
        </View>

        <View style={styles.cardDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailValue}>
              {item.plan === 'yearly' ? 'سنوي' : 'شهري'}
            </Text>
            <Text style={styles.detailLabel}>نوع الاشتراك</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailValue}>${item.amount}</Text>
            <Text style={styles.detailLabel}>المبلغ</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailValue}>
              {new Date(item.end_date).toLocaleDateString('ar-SA')}
            </Text>
            <Text style={styles.detailLabel}>ينتهي في</Text>
          </View>
        </View>

        {item.status === 'active' && (
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => handleCancelSubscription(item.id)}
          >
            <Text style={styles.cancelBtnText}>إلغاء الاشتراك</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF9800" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>إدارة الاشتراكات</Text>
      </View>

      <FlatList
        data={subscriptions}
        renderItem={renderSubscription}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="card-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>لا توجد اشتراكات بعد</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={() => setShowModal(true)}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Modal لمنح اشتراك */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>منح اشتراك لمدرب</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>اختر المدرب</Text>
            <View style={styles.coachList}>
              {coaches.map((coach) => (
                <TouchableOpacity
                  key={coach.id}
                  style={[
                    styles.coachOption,
                    selectedCoach === coach.id && styles.coachOptionSelected
                  ]}
                  onPress={() => setSelectedCoach(coach.id)}
                >
                  <Text style={[
                    styles.coachOptionText,
                    selectedCoach === coach.id && styles.coachOptionTextSelected
                  ]}>
                    {coach.full_name}
                  </Text>
                  {selectedCoach === coach.id && (
                    <Ionicons name="checkmark" size={20} color="#fff" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>نوع الاشتراك</Text>
            <View style={styles.planOptions}>
              <TouchableOpacity
                style={[
                  styles.planOption,
                  selectedPlan === 'monthly' && styles.planOptionSelected
                ]}
                onPress={() => setSelectedPlan('monthly')}
              >
                <Text style={[
                  styles.planOptionText,
                  selectedPlan === 'monthly' && styles.planOptionTextSelected
                ]}>شهري - $49</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.planOption,
                  selectedPlan === 'yearly' && styles.planOptionSelected
                ]}
                onPress={() => setSelectedPlan('yearly')}
              >
                <Text style={[
                  styles.planOptionText,
                  selectedPlan === 'yearly' && styles.planOptionTextSelected
                ]}>سنوي - $399</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>المدة (بالشهور)</Text>
            <TextInput
              style={styles.input}
              value={duration}
              onChangeText={setDuration}
              keyboardType="numeric"
              placeholder="1"
            />

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleGrantSubscription}
            >
              <Text style={styles.submitBtnText}>منح الاشتراك</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FF9800'},
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16},
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontFamily: 'Cairo_700Bold',
    color: '#fff',
    textAlign: 'right'},
  listContent: { padding: 16, paddingBottom: 100 },
  subscriptionCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4},
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12},
  coachInfo: { flex: 1 },
  coachName: {
    fontSize: 16,
    fontFamily: 'Cairo_700Bold',
    color: '#333',
    textAlign: 'right'},
  coachEmail: {
    fontSize: 12,
    fontFamily: 'Cairo_400Regular',
    color: '#666',
    textAlign: 'right'},
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12},
  statusText: {
    fontSize: 12,
    fontFamily: 'Cairo_700Bold'},
  cardDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0'},
  detailRow: { alignItems: 'center' },
  detailLabel: {
    fontSize: 10,
    fontFamily: 'Cairo_400Regular',
    color: '#999'},
  detailValue: {
    fontSize: 14,
    fontFamily: 'Cairo_700Bold',
    color: '#333',
    marginTop: 2},
  cancelBtn: {
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F44336',
    alignItems: 'center'},
  cancelBtnText: {
    fontSize: 14,
    fontFamily: 'Cairo_700Bold',
    color: '#F44336'},
  emptyState: { alignItems: 'center', paddingTop: 80 },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Cairo_400Regular',
    color: '#999',
    marginTop: 16},
  fab: {
    position: 'absolute',
    left: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF9800',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8},
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end'},
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%'},
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20},
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Cairo_700Bold',
    color: '#333'},
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Cairo_700Bold',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
    textAlign: 'right'},
  coachList: { maxHeight: 150 },
  coachOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 8},
  coachOptionSelected: {
    backgroundColor: '#FF9800',
    borderColor: '#FF9800'},
  coachOptionText: {
    fontSize: 14,
    fontFamily: 'Cairo_400Regular',
    color: '#333'},
  coachOptionTextSelected: { color: '#fff' },
  planOptions: { flexDirection: 'row', gap: 12 },
  planOption: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center'},
  planOptionSelected: {
    backgroundColor: '#FF9800',
    borderColor: '#FF9800'},
  planOptionText: {
    fontSize: 14,
    fontFamily: 'Cairo_700Bold',
    color: '#333'},
  planOptionTextSelected: { color: '#fff' },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Cairo_400Regular',
    textAlign: 'right'},
  submitBtn: {
    backgroundColor: '#FF9800',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20},
  submitBtnText: {
    fontSize: 16,
    fontFamily: 'Cairo_700Bold',
    color: '#fff'}});
