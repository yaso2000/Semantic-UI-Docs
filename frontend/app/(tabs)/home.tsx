import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFonts, Alexandria_400Regular, Alexandria_600SemiBold, Alexandria_700Bold } from '@expo-google-fonts/alexandria';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../src/constants/theme';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

// الركائز الأربع
const pillars = [
  { 
    id: 'physical', 
    title: 'اللياقة البدنية', 
    titleEn: 'Physical Fitness',
    icon: 'fitness', 
    description: 'معاً نبني جسماً قوياً وصحياً',
    color: COLORS.physical,
    route: '/(tabs)/calculators'
  },
  { 
    id: 'nutrition', 
    title: 'الصحة الغذائية', 
    titleEn: 'Nutritional Health',
    icon: 'nutrition', 
    description: 'تغذية متوازنة لحياة أفضل',
    color: COLORS.nutritional,
    route: '/(tabs)/calculators'
  },
  { 
    id: 'mental', 
    title: 'الصحة النفسية', 
    titleEn: 'Mental Wellness',
    icon: 'happy', 
    description: 'عقل صافٍ وروح متزنة',
    color: COLORS.mental,
    route: '/(tabs)/calculators'
  },
  { 
    id: 'spiritual', 
    title: 'الصحة الروحية', 
    titleEn: 'Spiritual Well-being',
    icon: 'sparkles', 
    description: 'السلام الداخلي والتواصل الروحي',
    color: COLORS.spiritual,
    route: '/(tabs)/calculators'
  },
];

// واجهة المتدرب
function ClientHome({ user, router }: { user: any; router: any }) {
  return (
    <>
      {/* الهيدر */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Ionicons name="leaf" size={36} color={COLORS.teal} />
        </View>
        <Text style={styles.logo}>اسأل يازو</Text>
        <Text style={styles.greeting}>أهلاً {user?.full_name?.split(' ')[0] || 'بك'}! 👋</Text>
        <Text style={styles.subtitle}>رحلتك نحو حياة متوازنة</Text>
      </View>

      {/* بطاقة الترحيب */}
      <View style={styles.welcomeCard}>
        <View style={styles.welcomeIcon}>
          <Ionicons name="sunny" size={24} color={COLORS.gold} />
        </View>
        <View style={styles.welcomeContent}>
          <Text style={styles.welcomeTitle}>صباح النشاط والتجديد</Text>
          <Text style={styles.welcomeText}>استكشف الركائز الأربعة لتحقيق التوازن</Text>
        </View>
      </View>

      {/* بطاقة الركائز الأربعة */}
      <TouchableOpacity 
        style={styles.pillarsMainCard}
        onPress={() => router.push('/(tabs)/calculators' as any)}
        activeOpacity={0.85}
      >
        <View style={styles.pillarsMainContent}>
          <Text style={styles.pillarsMainTitle}>الركائز الأربعة</Text>
          <Text style={styles.pillarsMainSubtitle}>اكتشف أدوات التوازن الشامل</Text>
        </View>
        <View style={styles.pillarsIconsRow}>
          <View style={[styles.pillarMiniIcon, { backgroundColor: `${COLORS.physical}15` }]}>
            <Ionicons name="fitness" size={22} color={COLORS.physical} />
          </View>
          <View style={[styles.pillarMiniIcon, { backgroundColor: `${COLORS.mental}15` }]}>
            <Ionicons name="happy" size={22} color={COLORS.mental} />
          </View>
          <View style={[styles.pillarMiniIcon, { backgroundColor: `${COLORS.social}15` }]}>
            <Ionicons name="people" size={22} color={COLORS.social} />
          </View>
          <View style={[styles.pillarMiniIcon, { backgroundColor: `${COLORS.spiritual}15` }]}>
            <Ionicons name="sparkles" size={22} color={COLORS.spiritual} />
          </View>
        </View>
        <View style={styles.pillarsArrow}>
          <Ionicons name="arrow-back-circle" size={28} color={COLORS.teal} />
        </View>
      </TouchableOpacity>

      {/* أدوات سريعة */}
      <Text style={styles.sectionTitle}>أدوات سريعة</Text>
      <View style={styles.toolsRow}>
        <TouchableOpacity 
          style={styles.toolCard}
          onPress={() => router.push('/my-profile' as any)}
        >
          <View style={[styles.toolIcon, { backgroundColor: `${COLORS.teal}10` }]}>
            <Ionicons name="person-circle" size={22} color={COLORS.teal} />
          </View>
          <Text style={styles.toolText}>ملفي الشخصي</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.toolCard}
          onPress={() => router.push('/habit-tracker' as any)}
        >
          <View style={[styles.toolIcon, { backgroundColor: `${COLORS.sage}20` }]}>
            <Ionicons name="checkmark-done" size={22} color={COLORS.sageDark} />
          </View>
          <Text style={styles.toolText}>متتبع العادات</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.toolCard}
          onPress={() => router.push('/intake-questionnaire' as any)}
        >
          <View style={[styles.toolIcon, { backgroundColor: `${COLORS.gold}15` }]}>
            <Ionicons name="clipboard" size={22} color={COLORS.goldDark} />
          </View>
          <Text style={styles.toolText}>استبيان القبول</Text>
        </TouchableOpacity>
      </View>
      
      {/* أدوات إضافية */}
      <View style={styles.toolsRow}>
        <TouchableOpacity 
          style={styles.toolCard}
          onPress={() => router.push('/resources' as any)}
        >
          <View style={[styles.toolIcon, { backgroundColor: `${COLORS.physical}15` }]}>
            <Ionicons name="library" size={22} color={COLORS.physical} />
          </View>
          <Text style={styles.toolText}>المكتبة</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.toolCard}
          onPress={() => router.push('/goals' as any)}
        >
          <View style={[styles.toolIcon, { backgroundColor: `${COLORS.mental}15` }]}>
            <Ionicons name="flag" size={22} color={COLORS.mental} />
          </View>
          <Text style={styles.toolText}>أهدافي</Text>
        </TouchableOpacity>
        <View style={[styles.toolCard, { opacity: 0 }]} />
      </View>

      {/* زر حجز جلسة */}
      <TouchableOpacity 
        style={styles.bookingBtn}
        onPress={() => router.push('/(tabs)/bookings' as any)}
        activeOpacity={0.8}
      >
        <Ionicons name="calendar" size={22} color={COLORS.white} />
        <Text style={styles.bookingBtnText}>احجز جلستك مع يازو</Text>
      </TouchableOpacity>
    </>
  );
}

// واجهة يازو (الأدمن)
function YazoHome({ user, router }: { user: any; router: any }) {
  const [stats, setStats] = useState({ 
    total_clients: 0, 
    active_bookings: 0, 
    total_revenue: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/admin/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setStats({
          total_clients: data.total_users || 0,
          active_bookings: data.total_bookings || 0,
          total_revenue: data.total_revenue || 0,
        });
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Ionicons name="leaf" size={36} color={COLORS.teal} />
        </View>
        <Text style={styles.logo}>اسأل يازو</Text>
        <Text style={styles.greeting}>مرحباً يازو! 👋</Text>
        <Text style={styles.subtitle}>لوحة التحكم</Text>
      </View>

      {/* الإحصائيات */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { borderLeftColor: COLORS.teal, borderLeftWidth: 3 }]}>
          <View style={[styles.statIcon, { backgroundColor: `${COLORS.teal}10` }]}>
            <Ionicons name="people" size={22} color={COLORS.teal} />
          </View>
          <Text style={styles.statNumber}>{stats.total_clients}</Text>
          <Text style={styles.statLabel}>المتدربين</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: COLORS.sage, borderLeftWidth: 3 }]}>
          <View style={[styles.statIcon, { backgroundColor: `${COLORS.sage}20` }]}>
            <Ionicons name="calendar" size={22} color={COLORS.sageDark} />
          </View>
          <Text style={styles.statNumber}>{stats.active_bookings}</Text>
          <Text style={styles.statLabel}>الحجوزات</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: COLORS.gold, borderLeftWidth: 3 }]}>
          <View style={[styles.statIcon, { backgroundColor: `${COLORS.gold}15` }]}>
            <Ionicons name="cash" size={22} color={COLORS.goldDark} />
          </View>
          <Text style={styles.statNumber}>${stats.total_revenue}</Text>
          <Text style={styles.statLabel}>الإيرادات</Text>
        </View>
      </View>

      {/* قائمة الإدارة */}
      <Text style={styles.sectionTitle}>الإدارة</Text>
      <View style={styles.adminMenu}>
        <TouchableOpacity style={styles.adminMenuItem} onPress={() => router.push('/(tabs)/my-trainees')}>
          <View style={[styles.adminMenuIcon, { backgroundColor: `${COLORS.teal}10` }]}>
            <Ionicons name="people" size={22} color={COLORS.teal} />
          </View>
          <View style={styles.adminMenuContent}>
            <Text style={styles.adminMenuTitle}>المتدربين</Text>
            <Text style={styles.adminMenuSubtitle}>إدارة ومتابعة المتدربين</Text>
          </View>
          <Ionicons name="chevron-back" size={18} color={COLORS.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.adminMenuItem} onPress={() => router.push('/coach/sessions' as any)}>
          <View style={[styles.adminMenuIcon, { backgroundColor: `${COLORS.sage}20` }]}>
            <Ionicons name="time" size={22} color={COLORS.sageDark} />
          </View>
          <View style={styles.adminMenuContent}>
            <Text style={styles.adminMenuTitle}>الجلسات</Text>
            <Text style={styles.adminMenuSubtitle}>سجل وإدارة الجلسات</Text>
          </View>
          <Ionicons name="chevron-back" size={18} color={COLORS.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.adminMenuItem} onPress={() => router.push('/admin/packages' as any)}>
          <View style={[styles.adminMenuIcon, { backgroundColor: `${COLORS.gold}15` }]}>
            <Ionicons name="pricetags" size={22} color={COLORS.goldDark} />
          </View>
          <View style={styles.adminMenuContent}>
            <Text style={styles.adminMenuTitle}>الباقات</Text>
            <Text style={styles.adminMenuSubtitle}>إدارة الأسعار والباقات</Text>
          </View>
          <Ionicons name="chevron-back" size={18} color={COLORS.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.adminMenuItem} onPress={() => router.push('/(tabs)/bookings')}>
          <View style={[styles.adminMenuIcon, { backgroundColor: `${COLORS.spiritual}15` }]}>
            <Ionicons name="receipt" size={22} color={COLORS.spiritual} />
          </View>
          <View style={styles.adminMenuContent}>
            <Text style={styles.adminMenuTitle}>الحجوزات الواردة</Text>
            <Text style={styles.adminMenuSubtitle}>طلبات الحجز الجديدة</Text>
          </View>
          <Ionicons name="chevron-back" size={18} color={COLORS.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.adminMenuItem} onPress={() => router.push('/(tabs)/chat')}>
          <View style={[styles.adminMenuIcon, { backgroundColor: `${COLORS.info}15` }]}>
            <Ionicons name="chatbubbles" size={22} color={COLORS.info} />
          </View>
          <View style={styles.adminMenuContent}>
            <Text style={styles.adminMenuTitle}>المحادثات</Text>
            <Text style={styles.adminMenuSubtitle}>التواصل مع المتدربين</Text>
          </View>
          <Ionicons name="chevron-back" size={18} color={COLORS.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.adminMenuItem} onPress={() => router.push('/admin/resources' as any)}>
          <View style={[styles.adminMenuIcon, { backgroundColor: `${COLORS.sageLight}30` }]}>
            <Ionicons name="library" size={22} color={COLORS.sage} />
          </View>
          <View style={styles.adminMenuContent}>
            <Text style={styles.adminMenuTitle}>إدارة المكتبة</Text>
            <Text style={styles.adminMenuSubtitle}>الموارد والمقالات</Text>
          </View>
          <Ionicons name="chevron-back" size={18} color={COLORS.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.adminMenuItem} onPress={() => router.push('/admin/calculators' as any)}>
          <View style={[styles.adminMenuIcon, { backgroundColor: `${COLORS.gold}20` }]}>
            <Ionicons name="calculator" size={22} color={COLORS.gold} />
          </View>
          <View style={styles.adminMenuContent}>
            <Text style={styles.adminMenuTitle}>الحاسبات المخصصة</Text>
            <Text style={styles.adminMenuSubtitle}>إضافة حاسبات HTML</Text>
          </View>
          <Ionicons name="chevron-back" size={18} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>
    </>
  );
}

// الصفحة الرئيسية
export default function HomeScreen() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [fontsLoaded] = useFonts({ 
    Alexandria_400Regular, 
    Alexandria_600SemiBold, 
    Alexandria_700Bold 
  });

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) setUser(JSON.parse(userData));
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!fontsLoaded || loading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <ActivityIndicator size="large" color={COLORS.teal} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {user?.role === 'admin' ? (
          <YazoHome user={user} router={router} />
        ) : (
          <ClientHome user={user} router={router} />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background 
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: COLORS.background 
  },
  scrollContent: { 
    padding: SPACING.lg, 
    paddingBottom: 100 
  },
  
  // Header
  header: { 
    alignItems: 'center', 
    marginBottom: SPACING.lg,
    paddingTop: SPACING.sm,
  },
  logoContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: `${COLORS.teal}10`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    borderWidth: 2,
    borderColor: `${COLORS.teal}25`,
  },
  logo: { 
    fontSize: 28, 
    fontFamily: FONTS.bold, 
    color: COLORS.teal,
    marginBottom: 2,
  },
  greeting: { 
    fontSize: 20, 
    fontFamily: FONTS.semiBold, 
    color: COLORS.text,
    marginTop: SPACING.sm,
  },
  subtitle: { 
    fontSize: 14, 
    fontFamily: FONTS.regular, 
    color: COLORS.textSecondary,
    marginTop: 2,
  },

  // Welcome Card
  welcomeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    ...SHADOWS.md,
  },
  welcomeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${COLORS.gold}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.md,
  },
  welcomeContent: {
    flex: 1,
    alignItems: 'flex-end',
  },
  welcomeTitle: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginBottom: 2,
  },
  welcomeText: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },

  // Section Title
  sectionTitle: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    textAlign: 'right',
    marginBottom: SPACING.md,
    marginTop: SPACING.sm,
  },

  // Pillars Main Card
  pillarsMainCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.md,
    borderWidth: 1,
    borderColor: `${COLORS.teal}20`,
  },
  pillarsMainContent: {
    marginBottom: SPACING.md,
  },
  pillarsMainTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    textAlign: 'right',
    marginBottom: 4,
  },
  pillarsMainSubtitle: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'right',
  },
  pillarsIconsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  pillarMiniIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillarsArrow: {
    alignItems: 'center',
  },

  // Old Pillars (kept for reference)
  pillarsContainer: {
    gap: SPACING.sm,
  },
  pillarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    ...SHADOWS.sm,
  },
  pillarIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.md,
  },
  pillarContent: {
    flex: 1,
  },
  pillarNumber: {
    fontSize: 11,
    fontFamily: FONTS.semiBold,
    color: COLORS.textMuted,
    marginBottom: 2,
    textAlign: 'right',
  },
  pillarTitle: {
    fontSize: 15,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    textAlign: 'right',
  },
  pillarTitleEn: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    marginBottom: 4,
    textAlign: 'right',
  },
  pillarDescription: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'right',
  },

  // Quick Tools
  toolsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  toolCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    ...SHADOWS.sm,
  },
  toolIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  toolText: {
    fontSize: 12,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
    textAlign: 'center',
  },

  // Booking Button
  bookingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.teal,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.lg,
    gap: SPACING.sm,
    ...SHADOWS.md,
  },
  bookingBtnText: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  statNumber: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginTop: SPACING.xs,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginTop: 2,
  },

  // Admin Menu
  adminMenu: {
    gap: SPACING.sm,
  },
  adminMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    ...SHADOWS.sm,
  },
  adminMenuIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.md,
  },
  adminMenuContent: {
    flex: 1,
    alignItems: 'flex-end',
  },
  adminMenuTitle: {
    fontSize: 15,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
  },
  adminMenuSubtitle: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});
