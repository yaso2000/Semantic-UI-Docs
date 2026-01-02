import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFonts, Cairo_400Regular, Cairo_700Bold } from '@expo-google-fonts/cairo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface PaymentStats {
  total_revenue: number;
  booking_revenue: number;
  subscription_revenue: number;
  monthly_revenue: number;
  today_revenue: number;
  total_payments: number;
  completed_payments: number;
  pending_payments: number;
  failed_payments: number;
  coach_revenues: Array<{
    coach_id: string;
    coach_name: string;
    total_revenue: number;
  }>;
}

interface Payment {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  type: string;
  amount: number;
  status: string;
  payment_method: string;
  stripe_payment_intent_id?: string;
  booking_id?: string;
  plan?: string;
  created_at: string;
}

export default function AdminPaymentsScreen() {
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'transactions' | 'coaches'>('overview');
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualPayment, setManualPayment] = useState({ user_id: '', amount: '', type: 'booking', notes: '' });
  const router = useRouter();

  const [fontsLoaded] = useFonts({ Cairo_400Regular, Cairo_700Bold });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      
      // Load stats
      const statsRes = await fetch(`${API_URL}/api/admin/payments/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (statsRes.ok) {
        setStats(await statsRes.json());
      }

      // Load payments
      const paymentsRes = await fetch(`${API_URL}/api/admin/payments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (paymentsRes.ok) {
        setPayments(await paymentsRes.json());
      }
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#4CAF50';
      case 'pending': return '#FF9800';
      case 'failed': return '#F44336';
      case 'refunded': return '#9C27B0';
      default: return '#999';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'مكتمل';
      case 'pending': return 'معلق';
      case 'failed': return 'فشل';
      case 'refunded': return 'مسترد';
      default: return status;
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'booking': return 'حجز';
      case 'subscription': return 'اشتراك';
      case 'refund': return 'استرداد';
      default: return type;
    }
  };

  const recordManualPayment = async () => {
    if (!manualPayment.amount) {
      Alert.alert('خطأ', 'يرجى إدخال المبلغ');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/admin/payments/record-manual`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...manualPayment,
          amount: parseFloat(manualPayment.amount)
        })
      });

      if (response.ok) {
        Alert.alert('نجاح', 'تم تسجيل الدفعة بنجاح');
        setShowManualModal(false);
        setManualPayment({ user_id: '', amount: '', type: 'booking', notes: '' });
        loadData();
      } else {
        Alert.alert('خطأ', 'فشل في تسجيل الدفعة');
      }
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ في الاتصال');
    }
  };

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF9800" />
        <Text style={styles.loadingText}>جاري التحميل...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>إدارة المدفوعات</Text>
        <TouchableOpacity 
          style={styles.addBtn}
          onPress={() => setShowManualModal(true)}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'overview' && styles.tabActive]}
          onPress={() => setSelectedTab('overview')}
        >
          <Text style={[styles.tabText, selectedTab === 'overview' && styles.tabTextActive]}>نظرة عامة</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'transactions' && styles.tabActive]}
          onPress={() => setSelectedTab('transactions')}
        >
          <Text style={[styles.tabText, selectedTab === 'transactions' && styles.tabTextActive]}>المعاملات</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'coaches' && styles.tabActive]}
          onPress={() => setSelectedTab('coaches')}
        >
          <Text style={[styles.tabText, selectedTab === 'coaches' && styles.tabTextActive]}>المدربين</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF9800']} />
        }
      >
        {selectedTab === 'overview' && stats && (
          <>
            {/* Revenue Summary */}
            <View style={styles.revenueCard}>
              <Text style={styles.revenueLabel}>إجمالي الإيرادات</Text>
              <Text style={styles.revenueAmount}>${stats.total_revenue.toFixed(2)}</Text>
              <View style={styles.revenueBreakdown}>
                <View style={styles.breakdownItem}>
                  <Ionicons name="calendar" size={16} color="#4CAF50" />
                  <Text style={styles.breakdownLabel}>الحجوزات</Text>
                  <Text style={styles.breakdownValue}>${stats.booking_revenue.toFixed(2)}</Text>
                </View>
                <View style={styles.breakdownItem}>
                  <Ionicons name="card" size={16} color="#2196F3" />
                  <Text style={styles.breakdownLabel}>الاشتراكات</Text>
                  <Text style={styles.breakdownValue}>${stats.subscription_revenue.toFixed(2)}</Text>
                </View>
              </View>
            </View>

            {/* Quick Stats */}
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Ionicons name="today" size={28} color="#FF9800" />
                <Text style={styles.statValue}>${stats.today_revenue.toFixed(2)}</Text>
                <Text style={styles.statLabel}>إيرادات اليوم</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="calendar" size={28} color="#4CAF50" />
                <Text style={styles.statValue}>${stats.monthly_revenue.toFixed(2)}</Text>
                <Text style={styles.statLabel}>هذا الشهر</Text>
              </View>
            </View>

            {/* Payment Status */}
            <View style={styles.statusSection}>
              <Text style={styles.sectionTitle}>حالة المدفوعات</Text>
              <View style={styles.statusGrid}>
                <View style={[styles.statusCard, { borderLeftColor: '#4CAF50' }]}>
                  <Text style={styles.statusCount}>{stats.completed_payments}</Text>
                  <Text style={styles.statusLabel}>مكتمل</Text>
                </View>
                <View style={[styles.statusCard, { borderLeftColor: '#FF9800' }]}>
                  <Text style={styles.statusCount}>{stats.pending_payments}</Text>
                  <Text style={styles.statusLabel}>معلق</Text>
                </View>
                <View style={[styles.statusCard, { borderLeftColor: '#F44336' }]}>
                  <Text style={styles.statusCount}>{stats.failed_payments}</Text>
                  <Text style={styles.statusLabel}>فشل</Text>
                </View>
              </View>
            </View>
          </>
        )}

        {selectedTab === 'transactions' && (
          <View style={styles.transactionsSection}>
            <Text style={styles.sectionTitle}>آخر المعاملات ({payments.length})</Text>
            {payments.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="receipt-outline" size={64} color="#ddd" />
                <Text style={styles.emptyText}>لا توجد معاملات بعد</Text>
              </View>
            ) : (
              payments.map((payment) => (
                <View key={payment.id} style={styles.transactionCard}>
                  <View style={styles.transactionHeader}>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(payment.status) + '20' }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(payment.status) }]}>
                        {getStatusText(payment.status)}
                      </Text>
                    </View>
                    <View style={styles.transactionInfo}>
                      <Text style={styles.transactionName}>{payment.user_name}</Text>
                      <Text style={styles.transactionType}>{getTypeText(payment.type)}</Text>
                    </View>
                  </View>
                  <View style={styles.transactionFooter}>
                    <Text style={styles.transactionDate}>
                      {payment.created_at ? format(new Date(payment.created_at), 'dd MMM yyyy - h:mm a', { locale: ar }) : '-'}
                    </Text>
                    <Text style={[styles.transactionAmount, payment.type === 'refund' && { color: '#F44336' }]}>
                      {payment.type === 'refund' ? '-' : ''}${Math.abs(payment.amount).toFixed(2)}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {selectedTab === 'coaches' && stats && (
          <View style={styles.coachesSection}>
            <Text style={styles.sectionTitle}>إيرادات المدربين</Text>
            {stats.coach_revenues.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={64} color="#ddd" />
                <Text style={styles.emptyText}>لا توجد إيرادات بعد</Text>
              </View>
            ) : (
              stats.coach_revenues
                .sort((a, b) => b.total_revenue - a.total_revenue)
                .map((coach, index) => (
                  <View key={coach.coach_id} style={styles.coachCard}>
                    <View style={styles.coachRank}>
                      <Text style={styles.rankText}>{index + 1}</Text>
                    </View>
                    <View style={styles.coachInfo}>
                      <Text style={styles.coachName}>{coach.coach_name}</Text>
                      <View style={styles.coachRevenue}>
                        <Ionicons name="wallet" size={14} color="#4CAF50" />
                        <Text style={styles.coachRevenueText}>
                          ${coach.total_revenue.toFixed(2)}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.viewDetailsBtn}
                      onPress={() => Alert.alert('قريباً', 'عرض تفاصيل المدرب قريباً')}
                    >
                      <Ionicons name="eye" size={18} color="#2196F3" />
                    </TouchableOpacity>
                  </View>
                ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Manual Payment Modal */}
      <Modal visible={showManualModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowManualModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>تسجيل دفعة يدوية</Text>
            </View>

            <Text style={styles.inputLabel}>المبلغ ($)</Text>
            <TextInput
              style={styles.input}
              value={manualPayment.amount}
              onChangeText={(text) => setManualPayment({ ...manualPayment, amount: text })}
              placeholder="0.00"
              keyboardType="decimal-pad"
              textAlign="right"
            />

            <Text style={styles.inputLabel}>نوع الدفعة</Text>
            <View style={styles.typeButtons}>
              <TouchableOpacity
                style={[styles.typeBtn, manualPayment.type === 'booking' && styles.typeBtnActive]}
                onPress={() => setManualPayment({ ...manualPayment, type: 'booking' })}
              >
                <Text style={[styles.typeBtnText, manualPayment.type === 'booking' && styles.typeBtnTextActive]}>
                  حجز
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeBtn, manualPayment.type === 'subscription' && styles.typeBtnActive]}
                onPress={() => setManualPayment({ ...manualPayment, type: 'subscription' })}
              >
                <Text style={[styles.typeBtnText, manualPayment.type === 'subscription' && styles.typeBtnTextActive]}>
                  اشتراك
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>ملاحظات (اختياري)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={manualPayment.notes}
              onChangeText={(text) => setManualPayment({ ...manualPayment, notes: text })}
              placeholder="أي ملاحظات إضافية..."
              multiline
              numberOfLines={3}
              textAlign="right"
            />

            <TouchableOpacity style={styles.submitBtn} onPress={recordManualPayment}>
              <Ionicons name="checkmark" size={22} color="#fff" />
              <Text style={styles.submitBtnText}>تسجيل الدفعة</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 14, fontFamily: 'Cairo_400Regular', color: '#666', marginTop: 12 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#4CAF50',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Cairo_700Bold',
    color: '#fff',
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#4CAF50',
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'Cairo_700Bold',
    color: '#999',
  },
  tabTextActive: {
    color: '#4CAF50',
  },

  content: { padding: 16, paddingBottom: 40 },

  revenueCard: {
    backgroundColor: '#4CAF50',
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
  },
  revenueLabel: {
    fontSize: 14,
    fontFamily: 'Cairo_400Regular',
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  revenueAmount: {
    fontSize: 42,
    fontFamily: 'Cairo_700Bold',
    color: '#fff',
    textAlign: 'center',
    marginVertical: 8,
  },
  revenueBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  breakdownItem: {
    alignItems: 'center',
    gap: 4,
  },
  breakdownLabel: {
    fontSize: 12,
    fontFamily: 'Cairo_400Regular',
    color: 'rgba(255,255,255,0.7)',
  },
  breakdownValue: {
    fontSize: 16,
    fontFamily: 'Cairo_700Bold',
    color: '#fff',
  },

  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statValue: {
    fontSize: 22,
    fontFamily: 'Cairo_700Bold',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Cairo_400Regular',
    color: '#666',
    marginTop: 4,
  },

  statusSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Cairo_700Bold',
    color: '#333',
    textAlign: 'right',
    marginBottom: 16,
  },
  statusGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  statusCard: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderLeftWidth: 4,
  },
  statusCount: {
    fontSize: 24,
    fontFamily: 'Cairo_700Bold',
    color: '#333',
  },
  statusLabel: {
    fontSize: 12,
    fontFamily: 'Cairo_400Regular',
    color: '#666',
    marginTop: 4,
  },

  transactionsSection: {},
  transactionCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  transactionInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  transactionName: {
    fontSize: 16,
    fontFamily: 'Cairo_700Bold',
    color: '#333',
  },
  transactionType: {
    fontSize: 13,
    fontFamily: 'Cairo_400Regular',
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Cairo_700Bold',
  },
  transactionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  transactionDate: {
    fontSize: 12,
    fontFamily: 'Cairo_400Regular',
    color: '#999',
  },
  transactionAmount: {
    fontSize: 18,
    fontFamily: 'Cairo_700Bold',
    color: '#4CAF50',
  },

  coachesSection: {},
  coachCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },
  coachRank: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 14,
  },
  rankText: {
    fontSize: 16,
    fontFamily: 'Cairo_700Bold',
    color: '#FF9800',
  },
  coachInfo: {
    flex: 1,
  },
  coachName: {
    fontSize: 16,
    fontFamily: 'Cairo_700Bold',
    color: '#333',
    textAlign: 'right',
  },
  coachRevenue: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    marginTop: 4,
  },
  coachRevenueText: {
    fontSize: 14,
    fontFamily: 'Cairo_700Bold',
    color: '#4CAF50',
  },
  viewDetailsBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },

  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Cairo_400Regular',
    color: '#999',
    marginTop: 16,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Cairo_700Bold',
    color: '#333',
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Cairo_700Bold',
    color: '#333',
    textAlign: 'right',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    fontFamily: 'Cairo_400Regular',
    color: '#333',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  typeBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeBtnActive: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
  },
  typeBtnText: {
    fontSize: 14,
    fontFamily: 'Cairo_700Bold',
    color: '#666',
  },
  typeBtnTextActive: {
    color: '#4CAF50',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 14,
    padding: 16,
    marginTop: 24,
    gap: 8,
  },
  submitBtnText: {
    fontSize: 18,
    fontFamily: 'Cairo_700Bold',
    color: '#fff',
  },
});
