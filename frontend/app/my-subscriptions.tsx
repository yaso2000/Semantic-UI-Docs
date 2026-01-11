import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts, Alexandria_400Regular, Alexandria_600SemiBold, Alexandria_700Bold } from '@expo-google-fonts/alexandria';
import { COLORS, FONTS, SHADOWS, RADIUS, SPACING } from '../src/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface Subscription {
  id: string;
  package_id: string;
  package_name: string;
  category: 'private_sessions' | 'self_training';
  sessions_remaining?: number;
  sessions_used: number;
  start_date: string;
  end_date: string;
  status: 'active' | 'expired' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'failed';
  amount_paid: number;
  includes_self_training: boolean;
  created_at: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: 'فعال', color: '#4CAF50', bg: '#E8F5E9' },
  expired: { label: 'منتهي', color: '#FF9800', bg: '#FFF3E0' },
  cancelled: { label: 'ملغي', color: '#F44336', bg: '#FFEBEE' },
};

const PAYMENT_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: 'في انتظار الدفع', color: '#FF9800' },
  paid: { label: 'مدفوع', color: '#4CAF50' },
  failed: { label: 'فشل الدفع', color: '#F44336' },
};

export default function MySubscriptionsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'expired'>('all');

  const [fontsLoaded] = useFonts({ Alexandria_400Regular, Alexandria_600SemiBold, Alexandria_700Bold });

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('تسجيل الدخول مطلوب', 'يرجى تسجيل الدخول لعرض اشتراكاتك', [
          { text: 'تسجيل الدخول', onPress: () => router.push('/login' as any) }
        ]);
        return;
      }

      const response = await fetch(`${API_URL}/api/my-subscriptions`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setSubscriptions(data);
      }
    } catch (error) {
      console.error('Error loading subscriptions:', error);
      Alert.alert('خطأ', 'فشل في تحميل الاشتراكات');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadSubscriptions();
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getProgressPercentage = (startDate: string, endDate: string) => {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    const now = new Date().getTime();
    const total = end - start;
    const elapsed = now - start;
    return Math.min(100, Math.max(0, (elapsed / total) * 100));
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'active') return sub.status === 'active' && sub.payment_status === 'paid';
    if (activeFilter === 'expired') return sub.status === 'expired' || sub.status === 'cancelled';
    return true;
  });

  const activeCount = subscriptions.filter(s => s.status === 'active' && s.payment_status === 'paid').length;
  const expiredCount = subscriptions.filter(s => s.status === 'expired' || s.status === 'cancelled').length;

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color={COLORS.teal} />
        <Text style={styles.loadingText}>جاري التحميل...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient
        colors={[COLORS.teal, '#1a8a7d']}
        style={styles.header}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>اشتراكاتي</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: '#E8F5E9' }]}>
          <Text style={[styles.statValue, { color: '#4CAF50' }]}>{activeCount}</Text>
          <Text style={styles.statLabel}>فعال</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#FFF3E0' }]}>
          <Text style={[styles.statValue, { color: '#FF9800' }]}>{expiredCount}</Text>
          <Text style={styles.statLabel}>منتهي</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#E3F2FD' }]}>
          <Text style={[styles.statValue, { color: '#2196F3' }]}>{subscriptions.length}</Text>
          <Text style={styles.statLabel}>الكل</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        <TouchableOpacity
          style={[styles.filterTab, activeFilter === 'all' && styles.filterTabActive]}
          onPress={() => setActiveFilter('all')}
        >
          <Text style={[styles.filterTabText, activeFilter === 'all' && styles.filterTabTextActive]}>الكل</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, activeFilter === 'active' && styles.filterTabActive]}
          onPress={() => setActiveFilter('active')}
        >
          <Text style={[styles.filterTabText, activeFilter === 'active' && styles.filterTabTextActive]}>الفعالة</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, activeFilter === 'expired' && styles.filterTabActive]}
          onPress={() => setActiveFilter('expired')}
        >
          <Text style={[styles.filterTabText, activeFilter === 'expired' && styles.filterTabTextActive]}>المنتهية</Text>
        </TouchableOpacity>
      </View>

      {/* Subscriptions List */}
      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.teal]} />
        }
      >
        {filteredSubscriptions.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={64} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>لا توجد اشتراكات</Text>
            <Text style={styles.emptyText}>
              {activeFilter === 'active' 
                ? 'ليس لديك اشتراكات فعالة حالياً'
                : activeFilter === 'expired'
                ? 'ليس لديك اشتراكات منتهية'
                : 'لم تقم بالاشتراك في أي باقة بعد'
              }
            </Text>
            <TouchableOpacity 
              style={styles.browseBtn}
              onPress={() => router.push('/packages' as any)}
            >
              <Text style={styles.browseBtnText}>تصفح الباقات</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredSubscriptions.map((sub) => {
            const status = STATUS_LABELS[sub.status];
            const paymentStatus = PAYMENT_STATUS_LABELS[sub.payment_status];
            const daysRemaining = getDaysRemaining(sub.end_date);
            const progress = getProgressPercentage(sub.start_date, sub.end_date);
            const isActive = sub.status === 'active' && sub.payment_status === 'paid';

            return (
              <View key={sub.id} style={styles.subscriptionCard}>
                {/* Header */}
                <View style={styles.cardHeader}>
                  <View style={[
                    styles.categoryBadge,
                    { backgroundColor: sub.category === 'private_sessions' ? '#E3F2FD' : '#F3E5F5' }
                  ]}>
                    <Ionicons 
                      name={sub.category === 'private_sessions' ? 'people' : 'fitness'} 
                      size={16} 
                      color={sub.category === 'private_sessions' ? '#2196F3' : '#9C27B0'} 
                    />
                    <Text style={[
                      styles.categoryText,
                      { color: sub.category === 'private_sessions' ? '#2196F3' : '#9C27B0' }
                    ]}>
                      {sub.category === 'private_sessions' ? 'حصص خاصة' : 'تدريب ذاتي'}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                    <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                  </View>
                </View>

                {/* Package Name */}
                <Text style={styles.packageName}>{sub.package_name}</Text>

                {/* Progress Bar (for active subscriptions) */}
                {isActive && (
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: `${progress}%` }]} />
                    </View>
                    <Text style={styles.progressText}>
                      {daysRemaining > 0 ? `${daysRemaining} يوم متبقي` : 'ينتهي اليوم'}
                    </Text>
                  </View>
                )}

                {/* Sessions (for private sessions) */}
                {sub.category === 'private_sessions' && sub.sessions_remaining !== null && (
                  <View style={styles.sessionsContainer}>
                    <View style={styles.sessionItem}>
                      <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                      <Text style={styles.sessionLabel}>مستخدمة</Text>
                      <Text style={styles.sessionValue}>{sub.sessions_used}</Text>
                    </View>
                    <View style={styles.sessionDivider} />
                    <View style={styles.sessionItem}>
                      <Ionicons name="time" size={18} color={COLORS.teal} />
                      <Text style={styles.sessionLabel}>متبقية</Text>
                      <Text style={[styles.sessionValue, { color: COLORS.teal }]}>
                        {sub.sessions_remaining}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Details */}
                <View style={styles.detailsContainer}>
                  <View style={styles.detailRow}>
                    <Ionicons name="calendar-outline" size={16} color={COLORS.textSecondary} />
                    <Text style={styles.detailLabel}>تاريخ البدء</Text>
                    <Text style={styles.detailValue}>
                      {new Date(sub.start_date).toLocaleDateString('ar-SA')}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="calendar" size={16} color={COLORS.textSecondary} />
                    <Text style={styles.detailLabel}>تاريخ الانتهاء</Text>
                    <Text style={styles.detailValue}>
                      {new Date(sub.end_date).toLocaleDateString('ar-SA')}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="cash-outline" size={16} color={COLORS.textSecondary} />
                    <Text style={styles.detailLabel}>المبلغ</Text>
                    <Text style={styles.detailValue}>{sub.amount_paid} ر.س</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="card-outline" size={16} color={COLORS.textSecondary} />
                    <Text style={styles.detailLabel}>حالة الدفع</Text>
                    <Text style={[styles.detailValue, { color: paymentStatus.color }]}>
                      {paymentStatus.label}
                    </Text>
                  </View>
                </View>

                {/* Actions */}
                {isActive && sub.category === 'self_training' && (
                  <TouchableOpacity 
                    style={styles.actionBtn}
                    onPress={() => router.push('/self-training/my-plan' as any)}
                  >
                    <Ionicons name="document-text" size={18} color={COLORS.white} />
                    <Text style={styles.actionBtnText}>عرض خطتي</Text>
                  </TouchableOpacity>
                )}

                {/* Pending Payment */}
                {sub.payment_status === 'pending' && (
                  <TouchableOpacity 
                    style={[styles.actionBtn, { backgroundColor: '#FF9800' }]}
                    onPress={() => Alert.alert('قريباً', 'سيتم تفعيل الدفع الإلكتروني قريباً')}
                  >
                    <Ionicons name="card" size={18} color={COLORS.white} />
                    <Text style={styles.actionBtnText}>إتمام الدفع</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        )}

        {/* Browse Packages Link */}
        {filteredSubscriptions.length > 0 && (
          <TouchableOpacity 
            style={styles.browseLink}
            onPress={() => router.push('/packages' as any)}
          >
            <Ionicons name="add-circle-outline" size={20} color={COLORS.teal} />
            <Text style={styles.browseLinkText}>تصفح المزيد من الباقات</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
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
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },

  statsContainer: {
    flexDirection: 'row',
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  statCard: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontFamily: FONTS.bold,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginTop: 4,
  },

  filterTabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    padding: 4,
  },
  filterTab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: RADIUS.sm,
  },
  filterTabActive: {
    backgroundColor: COLORS.teal,
  },
  filterTabText: {
    fontSize: 13,
    fontFamily: FONTS.semiBold,
    color: COLORS.textSecondary,
  },
  filterTabTextActive: {
    color: COLORS.white,
  },

  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.md,
    paddingBottom: 100,
  },

  emptyState: {
    alignItems: 'center',
    padding: SPACING.xl,
    marginTop: SPACING.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginTop: SPACING.md,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  browseBtn: {
    backgroundColor: COLORS.teal,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    marginTop: SPACING.lg,
  },
  browseBtnText: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },

  subscriptionCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.md,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 11,
    fontFamily: FONTS.semiBold,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontFamily: FONTS.bold,
  },

  packageName: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    textAlign: 'right',
  },

  progressContainer: {
    marginTop: SPACING.md,
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.teal,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'left',
  },

  sessionsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.md,
  },
  sessionItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  sessionLabel: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  sessionValue: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  sessionDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.md,
  },

  detailsContainer: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  detailLabel: {
    flex: 1,
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  detailValue: {
    fontSize: 13,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
  },

  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.teal,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginTop: SPACING.md,
  },
  actionBtnText: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },

  browseLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    marginTop: SPACING.md,
  },
  browseLinkText: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    color: COLORS.teal,
  },
});
