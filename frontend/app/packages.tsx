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
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts, Alexandria_400Regular, Alexandria_600SemiBold, Alexandria_700Bold } from '@expo-google-fonts/alexandria';
import { COLORS, FONTS, SHADOWS, RADIUS, SPACING } from '../src/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';
const { width } = Dimensions.get('window');

interface Package {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'private_sessions' | 'self_training';
  
  sessions_count?: number;
  validity_days?: number;
  includes_self_training?: boolean;
  
  subscription_type?: string;
  duration_months?: number;
  auto_renewal?: boolean;
  
  features: string[];
  discount_percentage: number;
  is_popular: boolean;
}

interface ActiveSubscription {
  id: string;
  package_id: string;
  category: string;
  end_date: string;
}

const SUBSCRIPTION_LABELS: Record<string, string> = {
  'monthly': 'شهري',
  'quarterly': 'فصلي',
  'yearly': 'سنوي',
};

export default function PackagesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [packages, setPackages] = useState<Package[]>([]);
  const [activeSubscriptions, setActiveSubscriptions] = useState<ActiveSubscription[]>([]);
  const [activeTab, setActiveTab] = useState<'private_sessions' | 'self_training'>('private_sessions');
  const [subscribing, setSubscribing] = useState<string | null>(null);

  const [fontsLoaded] = useFonts({ Alexandria_400Regular, Alexandria_600SemiBold, Alexandria_700Bold });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // جلب الباقات
      const packagesRes = await fetch(`${API_URL}/api/all-packages`);
      if (packagesRes.ok) {
        const packagesData = await packagesRes.json();
        setPackages(packagesData);
      }

      // جلب الاشتراكات الفعالة
      const token = await AsyncStorage.getItem('token');
      if (token) {
        const subsRes = await fetch(`${API_URL}/api/my-subscriptions`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (subsRes.ok) {
          const subsData = await subsRes.json();
          // فلترة الاشتراكات الفعالة فقط
          const active = subsData.filter((sub: any) => 
            sub.status === 'active' && 
            sub.payment_status === 'paid' &&
            new Date(sub.end_date) > new Date()
          );
          setActiveSubscriptions(active);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasActiveSubscription = (category: string) => {
    return activeSubscriptions.some(sub => sub.category === category);
  };

  const getActiveSubscriptionEndDate = (category: string) => {
    const sub = activeSubscriptions.find(s => s.category === category);
    if (sub) {
      return new Date(sub.end_date).toLocaleDateString('ar-SA');
    }
    return null;
  };

  const handleSubscribe = async (pkg: Package) => {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      Alert.alert('تسجيل الدخول مطلوب', 'يرجى تسجيل الدخول للاشتراك في الباقات', [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'تسجيل الدخول', onPress: () => router.push('/login' as any) }
      ]);
      return;
    }

    if (hasActiveSubscription(pkg.category)) {
      const endDate = getActiveSubscriptionEndDate(pkg.category);
      Alert.alert(
        'لديك اشتراك فعال',
        `لديك اشتراك فعال في هذه الفئة حتى ${endDate}. يمكنك الاشتراك مجدداً بعد انتهاء صلاحية الباقة الحالية.`
      );
      return;
    }

    // توجيه المستخدم مباشرة لصفحة الدفع
    router.push({
      pathname: '/checkout',
      params: { packageId: pkg.id }
    } as any);
  };

  const filteredPackages = packages.filter(pkg => pkg.category === activeTab);

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
        <Text style={styles.headerTitle}>الباقات والاشتراكات</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'private_sessions' && styles.tabActive]}
          onPress={() => setActiveTab('private_sessions')}
        >
          <Ionicons 
            name="people" 
            size={20} 
            color={activeTab === 'private_sessions' ? COLORS.white : COLORS.teal} 
          />
          <Text style={[styles.tabText, activeTab === 'private_sessions' && styles.tabTextActive]}>
            الحصص الخاصة
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'self_training' && styles.tabActive]}
          onPress={() => setActiveTab('self_training')}
        >
          <Ionicons 
            name="fitness" 
            size={20} 
            color={activeTab === 'self_training' ? COLORS.white : '#9C27B0'} 
          />
          <Text style={[styles.tabText, activeTab === 'self_training' && styles.tabTextActive]}>
            التدريب الذاتي
          </Text>
        </TouchableOpacity>
      </View>

      {/* Active Subscription Warning */}
      {hasActiveSubscription(activeTab) && (
        <View style={styles.warningBanner}>
          <Ionicons name="information-circle" size={20} color="#FF9800" />
          <Text style={styles.warningText}>
            لديك اشتراك فعال حتى {getActiveSubscriptionEndDate(activeTab)}
          </Text>
        </View>
      )}

      {/* Tab Description */}
      <View style={styles.tabDescription}>
        <Text style={styles.tabDescTitle}>
          {activeTab === 'private_sessions' ? 'التدريب بالحصص الخاصة' : 'برنامج التدريب الذاتي'}
        </Text>
        <Text style={styles.tabDescText}>
          {activeTab === 'private_sessions' 
            ? 'احصل على تدريب شخصي مباشر مع المدرب. حصص فردية مخصصة لأهدافك.'
            : 'اشترك واحصل على خطة تدريب وتغذية مخصصة. تدرب بشكل مستقل مع متابعة مستمرة.'
          }
        </Text>
      </View>

      {/* Packages List */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {filteredPackages.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={64} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>لا توجد باقات متاحة حالياً</Text>
          </View>
        ) : (
          filteredPackages.map((pkg) => {
            const isSubscribed = hasActiveSubscription(pkg.category);
            const isCurrentlySubscribing = subscribing === pkg.id;
            
            return (
              <View 
                key={pkg.id} 
                style={[
                  styles.packageCard,
                  pkg.is_popular && styles.packageCardPopular
                ]}
              >
                {/* Popular Badge */}
                {pkg.is_popular && (
                  <View style={styles.popularBadge}>
                    <Ionicons name="star" size={14} color="#FF9800" />
                    <Text style={styles.popularBadgeText}>الأكثر شعبية</Text>
                  </View>
                )}

                {/* Discount Badge */}
                {pkg.discount_percentage > 0 && (
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountBadgeText}>خصم {pkg.discount_percentage}%</Text>
                  </View>
                )}

                {/* Package Header */}
                <View style={styles.packageHeader}>
                  <View style={[
                    styles.packageIcon,
                    { backgroundColor: activeTab === 'private_sessions' ? '#E3F2FD' : '#F3E5F5' }
                  ]}>
                    <Ionicons 
                      name={activeTab === 'private_sessions' ? 'people' : 'fitness'} 
                      size={28} 
                      color={activeTab === 'private_sessions' ? '#2196F3' : '#9C27B0'} 
                    />
                  </View>
                  <View style={styles.packageHeaderInfo}>
                    <Text style={styles.packageName}>{pkg.name}</Text>
                    <Text style={styles.packageMeta}>
                      {activeTab === 'private_sessions' 
                        ? `${pkg.sessions_count} حصة • صالحة ${pkg.validity_days} يوم`
                        : SUBSCRIPTION_LABELS[pkg.subscription_type || 'monthly'] || pkg.subscription_type
                      }
                    </Text>
                  </View>
                </View>

                {/* Description */}
                <Text style={styles.packageDesc}>{pkg.description}</Text>

                {/* Features */}
                {pkg.features && pkg.features.length > 0 && (
                  <View style={styles.featuresContainer}>
                    {pkg.features.map((feature, idx) => (
                      <View key={idx} style={styles.featureItem}>
                        <Ionicons name="checkmark-circle" size={16} color={COLORS.teal} />
                        <Text style={styles.featureText}>{feature}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Price & Subscribe Button */}
                <View style={styles.packageFooter}>
                  <View style={styles.priceContainer}>
                    <Text style={styles.priceLabel}>السعر</Text>
                    <View style={styles.priceRow}>
                      <Text style={styles.priceValue}>{pkg.price}</Text>
                      <Text style={styles.priceCurrency}>ر.س</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.subscribeBtn,
                      isSubscribed && styles.subscribeBtnDisabled
                    ]}
                    onPress={() => handleSubscribe(pkg)}
                    disabled={isSubscribed || isCurrentlySubscribing}
                  >
                    {isCurrentlySubscribing ? (
                      <ActivityIndicator color={COLORS.white} size="small" />
                    ) : isSubscribed ? (
                      <>
                        <Ionicons name="lock-closed" size={18} color={COLORS.white} />
                        <Text style={styles.subscribeBtnText}>مشترك</Text>
                      </>
                    ) : (
                      <>
                        <Ionicons name="cart" size={18} color={COLORS.white} />
                        <Text style={styles.subscribeBtnText}>اشترك الآن</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Subscribed Message */}
                {isSubscribed && (
                  <View style={styles.subscribedMessage}>
                    <Ionicons name="information-circle-outline" size={16} color={COLORS.textSecondary} />
                    <Text style={styles.subscribedMessageText}>
                      يمكنك الاشتراك مجدداً بعد انتهاء اشتراكك الحالي
                    </Text>
                  </View>
                )}
              </View>
            );
          })
        )}

        {/* My Subscriptions Link */}
        <TouchableOpacity 
          style={styles.mySubscriptionsLink}
          onPress={() => router.push('/my-subscriptions' as any)}
        >
          <Ionicons name="receipt-outline" size={20} color={COLORS.teal} />
          <Text style={styles.mySubscriptionsText}>عرض اشتراكاتي</Text>
          <Ionicons name="chevron-back" size={18} color={COLORS.teal} />
        </TouchableOpacity>
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

  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    padding: SPACING.sm,
    gap: SPACING.sm,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.background,
  },
  tabActive: {
    backgroundColor: COLORS.teal,
  },
  tabText: {
    fontSize: 13,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
  },
  tabTextActive: {
    color: COLORS.white,
  },

  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: '#FFF3E0',
    padding: SPACING.md,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: '#E65100',
    textAlign: 'right',
  },

  tabDescription: {
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    marginTop: SPACING.sm,
  },
  tabDescTitle: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    textAlign: 'right',
  },
  tabDescText: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'right',
    lineHeight: 20,
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
  emptyText: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    marginTop: SPACING.md,
  },

  packageCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.md,
    position: 'relative',
  },
  packageCardPopular: {
    borderWidth: 2,
    borderColor: '#FF9800',
  },

  popularBadge: {
    position: 'absolute',
    top: -10,
    right: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF3E0',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF9800',
  },
  popularBadgeText: {
    fontSize: 11,
    fontFamily: FONTS.bold,
    color: '#FF9800',
  },

  discountBadge: {
    position: 'absolute',
    top: -10,
    left: SPACING.md,
    backgroundColor: '#4CAF50',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  discountBadgeText: {
    fontSize: 11,
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },

  packageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginTop: SPACING.sm,
  },
  packageIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  packageHeaderInfo: {
    flex: 1,
  },
  packageName: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    textAlign: 'right',
  },
  packageMeta: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginTop: 2,
    textAlign: 'right',
  },

  packageDesc: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
    textAlign: 'right',
    lineHeight: 20,
  },

  featuresContainer: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  featureText: {
    flex: 1,
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: COLORS.text,
    textAlign: 'right',
  },

  packageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  priceContainer: {
    alignItems: 'flex-start',
  },
  priceLabel: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  priceValue: {
    fontSize: 28,
    fontFamily: FONTS.bold,
    color: COLORS.teal,
  },
  priceCurrency: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    color: COLORS.teal,
  },

  subscribeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.teal,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
  },
  subscribeBtnDisabled: {
    backgroundColor: COLORS.textMuted,
  },
  subscribeBtnText: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },

  subscribedMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  subscribedMessageText: {
    flex: 1,
    fontSize: 11,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'right',
  },

  mySubscriptionsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginTop: SPACING.md,
    ...SHADOWS.sm,
  },
  mySubscriptionsText: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    color: COLORS.teal,
  },
});
