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
import { COLORS, FONTS, SHADOWS, RADIUS, SPACING } from '../../src/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';
const { width } = Dimensions.get('window');

interface SelfTrainingPackage {
  id: string;
  name: string;
  description: string;
  duration_months: number;
  price: number;
  price_per_month: number;
  discount_percentage: number;
  features: string[];
  is_popular: boolean;
}

export default function SelfTrainingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [packages, setPackages] = useState<SelfTrainingPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);

  const [fontsLoaded] = useFonts({ Alexandria_400Regular, Alexandria_600SemiBold, Alexandria_700Bold });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      
      // جلب الباقات
      const packagesRes = await fetch(`${API_URL}/api/self-training/packages`);
      if (packagesRes.ok) {
        const packagesData = await packagesRes.json();
        setPackages(packagesData);
        // اختيار الباقة الأكثر شعبية افتراضياً
        const popular = packagesData.find((p: SelfTrainingPackage) => p.is_popular);
        if (popular) setSelectedPackage(popular.id);
        else if (packagesData.length > 0) setSelectedPackage(packagesData[0].id);
      }
      
      // جلب حالة الاشتراك
      if (token) {
        const subRes = await fetch(`${API_URL}/api/self-training/my-subscription`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (subRes.ok) {
          const subData = await subRes.json();
          setHasSubscription(subData.has_subscription);
          if (subData.subscription) setSubscription(subData.subscription);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      Alert.alert('تسجيل الدخول مطلوب', 'يرجى تسجيل الدخول للاشتراك', [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'تسجيل الدخول', onPress: () => router.push('/login' as any) }
      ]);
      return;
    }

    if (!selectedPackage) {
      Alert.alert('تنبيه', 'يرجى اختيار باقة للاشتراك');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/self-training/subscribe/${selectedPackage}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        Alert.alert(
          'تم إنشاء الاشتراك',
          `المبلغ المطلوب: ${data.amount} ر.س\n\nسيتم تفعيل الاشتراك بعد تأكيد الدفع.`,
          [
            { text: 'لاحقاً', style: 'cancel' },
            { 
              text: 'تأكيد الدفع', 
              onPress: () => confirmPayment(data.subscription_id)
            }
          ]
        );
      } else {
        const error = await response.json();
        Alert.alert('خطأ', error.detail || 'فشل في إنشاء الاشتراك');
      }
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ في الاتصال');
    }
  };

  const confirmPayment = async (subscriptionId: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/self-training/confirm-payment/${subscriptionId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        Alert.alert('🎉 مبروك!', 'تم تفعيل اشتراكك بنجاح!\n\nيمكنك الآن البدء بالتقييم الذاتي.', [
          { text: 'ابدأ الآن', onPress: () => router.push('/self-training/assessment' as any) }
        ]);
        loadData();
      } else {
        Alert.alert('خطأ', 'فشل في تأكيد الدفع');
      }
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ في الاتصال');
    }
  };

  const startAssessment = () => {
    router.push('/self-training/assessment' as any);
  };

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color={COLORS.teal} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>التدريب الذاتي</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Hero Section */}
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroSection}
        >
          <View style={styles.heroIcon}>
            <Ionicons name="rocket" size={48} color="#fff" />
          </View>
          <Text style={styles.heroTitle}>ابدأ رحلتك نحو اللياقة</Text>
          <Text style={styles.heroSubtitle}>
            خطة تدريب وتغذية مخصصة 100% لك
            {'\n'}بناءً على تقييم ذاتي شامل
          </Text>
        </LinearGradient>

        {/* Features Grid */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>ماذا ستحصل؟</Text>
          <View style={styles.featuresGrid}>
            <View style={styles.featureCard}>
              <View style={[styles.featureIcon, { backgroundColor: '#E3F2FD' }]}>
                <Ionicons name="body" size={24} color="#2196F3" />
              </View>
              <Text style={styles.featureTitle}>تقييم شامل</Text>
              <Text style={styles.featureDesc}>تحليل كامل لجسمك وأهدافك</Text>
            </View>
            <View style={styles.featureCard}>
              <View style={[styles.featureIcon, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="barbell" size={24} color="#4CAF50" />
              </View>
              <Text style={styles.featureTitle}>خطة تمارين</Text>
              <Text style={styles.featureDesc}>جدول أسبوعي مفصل</Text>
            </View>
            <View style={styles.featureCard}>
              <View style={[styles.featureIcon, { backgroundColor: '#FFF3E0' }]}>
                <Ionicons name="nutrition" size={24} color="#FF9800" />
              </View>
              <Text style={styles.featureTitle}>خطة تغذية</Text>
              <Text style={styles.featureDesc}>نظام غذائي مخصص</Text>
            </View>
            <View style={styles.featureCard}>
              <View style={[styles.featureIcon, { backgroundColor: '#FCE4EC' }]}>
                <Ionicons name="document-text" size={24} color="#E91E63" />
              </View>
              <Text style={styles.featureTitle}>ملف PDF</Text>
              <Text style={styles.featureDesc}>خطتك الكاملة قابلة للتحميل</Text>
            </View>
          </View>
        </View>

        {/* Subscription Status or Packages */}
        {hasSubscription && subscription ? (
          <View style={styles.subscriptionCard}>
            <View style={styles.subscriptionHeader}>
              <Ionicons name="checkmark-circle" size={32} color={COLORS.success} />
              <Text style={styles.subscriptionTitle}>أنت مشترك!</Text>
            </View>
            <Text style={styles.subscriptionPlan}>{subscription.package_name}</Text>
            <Text style={styles.subscriptionDays}>
              متبقي {subscription.days_remaining} يوم
            </Text>
            <TouchableOpacity style={styles.startBtn} onPress={startAssessment}>
              <Text style={styles.startBtnText}>بدء التقييم الذاتي</Text>
              <Ionicons name="arrow-back" size={20} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.packagesSection}>
            <Text style={styles.sectionTitle}>اختر باقتك</Text>
            
            {packages.length === 0 ? (
              <View style={styles.noPackages}>
                <Ionicons name="cube-outline" size={48} color={COLORS.textMuted} />
                <Text style={styles.noPackagesText}>لا توجد باقات متاحة حالياً</Text>
              </View>
            ) : (
              <>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.packagesRow}
                >
                  {packages.map((pkg) => (
                    <TouchableOpacity
                      key={pkg.id}
                      style={[
                        styles.packageCard,
                        selectedPackage === pkg.id && styles.packageCardSelected,
                        pkg.is_popular && styles.packageCardPopular
                      ]}
                      onPress={() => setSelectedPackage(pkg.id)}
                    >
                      {pkg.is_popular && (
                        <View style={styles.popularRibbon}>
                          <Text style={styles.popularRibbonText}>الأكثر شعبية</Text>
                        </View>
                      )}
                      
                      {pkg.discount_percentage > 0 && (
                        <View style={styles.discountBadge}>
                          <Text style={styles.discountText}>خصم {Math.round(pkg.discount_percentage)}%</Text>
                        </View>
                      )}
                      
                      <Text style={styles.packageName}>{pkg.name}</Text>
                      <Text style={styles.packageDuration}>{pkg.duration_months} شهر</Text>
                      
                      <View style={styles.packagePricing}>
                        <Text style={styles.packagePrice}>{pkg.price}</Text>
                        <Text style={styles.packageCurrency}>ر.س</Text>
                      </View>
                      
                      <Text style={styles.packageMonthly}>
                        {Math.round(pkg.price_per_month)} ر.س/شهر
                      </Text>
                      
                      {selectedPackage === pkg.id && (
                        <View style={styles.selectedIndicator}>
                          <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Selected Package Features */}
                {selectedPackage && (
                  <View style={styles.selectedFeatures}>
                    {packages.find(p => p.id === selectedPackage)?.features.map((feature, idx) => (
                      <View key={idx} style={styles.featureItem}>
                        <Ionicons name="checkmark" size={16} color={COLORS.success} />
                        <Text style={styles.featureItemText}>{feature}</Text>
                      </View>
                    ))}
                  </View>
                )}

                <TouchableOpacity 
                  style={styles.subscribeBtn} 
                  onPress={handleSubscribe}
                  disabled={!selectedPackage}
                >
                  <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.subscribeBtnGradient}
                  >
                    <Text style={styles.subscribeBtnText}>اشترك الآن</Text>
                    <Ionicons name="arrow-back" size={20} color={COLORS.white} />
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {/* How It Works */}
        <View style={styles.howItWorksSection}>
          <Text style={styles.sectionTitle}>كيف يعمل؟</Text>
          
          <View style={styles.step}>
            <View style={[styles.stepNumber, { backgroundColor: '#667eea' }]}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>اشترك في الخدمة</Text>
              <Text style={styles.stepDesc}>اختر الباقة المناسبة لك وأكمل عملية الدفع</Text>
            </View>
          </View>

          <View style={styles.stepLine} />

          <View style={styles.step}>
            <View style={[styles.stepNumber, { backgroundColor: '#764ba2' }]}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>أكمل التقييم الذاتي</Text>
              <Text style={styles.stepDesc}>أجب على أسئلة حول أهدافك ومستواك وتفضيلاتك</Text>
            </View>
          </View>

          <View style={styles.stepLine} />

          <View style={styles.step}>
            <View style={[styles.stepNumber, { backgroundColor: '#E91E63' }]}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>احصل على خطتك</Text>
              <Text style={styles.stepDesc}>نولّد لك خطة تمارين وتغذية مخصصة كملف PDF</Text>
            </View>
          </View>
        </View>
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

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    paddingBottom: SPACING.lg,
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
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },

  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100,
  },

  heroSection: {
    padding: SPACING.xl,
    alignItems: 'center',
    marginTop: -20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  heroTitle: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    color: COLORS.white,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginTop: SPACING.sm,
    lineHeight: 22,
  },

  featuresSection: {
    padding: SPACING.md,
    marginTop: SPACING.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    textAlign: 'right',
    marginBottom: SPACING.md,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  featureTitle: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    textAlign: 'center',
  },
  featureDesc: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },

  subscriptionCard: {
    margin: SPACING.md,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    ...SHADOWS.md,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  subscriptionTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: COLORS.success,
  },
  subscriptionPlan: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
  },
  subscriptionDays: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginTop: 4,
    marginBottom: SPACING.md,
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: '#667eea',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
  },
  startBtnText: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },

  packagesSection: {
    padding: SPACING.md,
  },
  noPackages: {
    alignItems: 'center',
    padding: SPACING.xl,
  },
  noPackagesText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    marginTop: SPACING.sm,
  },
  packagesRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.xs,
  },
  packageCard: {
    width: (width - 40) / 3,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
    position: 'relative',
    minHeight: 160,
    ...SHADOWS.sm,
  },
  packageCardSelected: {
    borderColor: '#667eea',
    backgroundColor: '#F5F3FF',
  },
  packageCardPopular: {
    borderColor: COLORS.gold,
  },
  popularRibbon: {
    position: 'absolute',
    top: -10,
    backgroundColor: COLORS.gold,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  popularRibbonText: {
    fontSize: 9,
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },
  discountBadge: {
    position: 'absolute',
    top: -10,
    left: -10,
    backgroundColor: COLORS.success,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  discountText: {
    fontSize: 9,
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },
  packageName: {
    fontSize: 13,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginTop: 8,
  },
  packageDuration: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
  },
  packagePricing: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: SPACING.sm,
  },
  packagePrice: {
    fontSize: 22,
    fontFamily: FONTS.bold,
    color: '#667eea',
  },
  packageCurrency: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    marginLeft: 4,
  },
  packageMonthly: {
    fontSize: 10,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  selectedIndicator: {
    position: 'absolute',
    bottom: -12,
  },

  selectedFeatures: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.lg,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: SPACING.sm,
    marginBottom: 8,
  },
  featureItemText: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: COLORS.text,
  },

  subscribeBtn: {
    marginTop: SPACING.lg,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  subscribeBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
  },
  subscribeBtnText: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },

  howItWorksSection: {
    padding: SPACING.md,
    marginTop: SPACING.md,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    textAlign: 'right',
  },
  stepDesc: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'right',
    marginTop: 4,
  },
  stepLine: {
    width: 2,
    height: 30,
    backgroundColor: COLORS.border,
    marginLeft: 15,
    marginVertical: 4,
  },
});
