import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFonts, Alexandria_400Regular, Alexandria_600SemiBold, Alexandria_700Bold } from '@expo-google-fonts/alexandria';
import { COLORS, FONTS } from '../../src/constants/theme';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

// الركائز الأربع - توجه للحاسبات
const pillars = [
  { 
    id: 'physical', 
    title: 'اللياقة البدنية', 
    titleEn: 'Physical Fitness',
    icon: 'barbell', 
    description: 'معاً نبني جسماً قوياً وصحياً',
    route: '/(tabs)/calculators'
  },
  { 
    id: 'nutrition', 
    title: 'الصحة الغذائية', 
    titleEn: 'Nutritional Health',
    icon: 'nutrition', 
    description: 'تغذية متوازنة لحياة أفضل',
    route: '/(tabs)/calculators'
  },
  { 
    id: 'mental', 
    title: 'الصحة النفسية', 
    titleEn: 'Mental Wellness',
    icon: 'happy', 
    description: 'عقل صافٍ وروح متزنة',
    route: '/(tabs)/calculators'
  },
  { 
    id: 'spiritual', 
    title: 'الصحة الروحية', 
    titleEn: 'Spiritual Well-being',
    icon: 'sparkles', 
    description: 'السلام الداخلي والتواصل الروحي',
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
          <Ionicons name="sparkles" size={32} color={COLORS.gold} />
        </View>
        <Text style={styles.logo}>اسأل يازو</Text>
        <Text style={styles.greeting}>أهلاً {user?.full_name?.split(' ')[0] || 'بك'}! 👋</Text>
        <Text style={styles.subtitle}>منهج 4 ركائز للتطوير الشامل</Text>
      </View>

      {/* الركائز الأربع */}
      <View style={styles.pillarsContainer}>
        {pillars.map((pillar, index) => (
          <TouchableOpacity
            key={pillar.id}
            style={styles.pillarCard}
            onPress={() => router.push(pillar.route as any)}
            activeOpacity={0.8}
          >
            <View style={styles.pillarIconContainer}>
              <Ionicons name={pillar.icon as any} size={28} color={COLORS.gold} />
            </View>
            <View style={styles.pillarContent}>
              <Text style={styles.pillarNumber}>الركيزة {index + 1}</Text>
              <Text style={styles.pillarTitle}>{pillar.title}</Text>
              <Text style={styles.pillarTitleEn}>{pillar.titleEn}</Text>
              <Text style={styles.pillarDescription}>{pillar.description}</Text>
            </View>
            <Ionicons name="chevron-back" size={22} color={COLORS.gold} />
          </TouchableOpacity>
        ))}
      </View>

      {/* أدوات سريعة */}
      <View style={styles.quickTools}>
        <Text style={styles.sectionTitle}>أدوات سريعة</Text>
        <View style={styles.toolsRow}>
          <TouchableOpacity 
            style={styles.toolCard}
            onPress={() => router.push('/habit-tracker' as any)}
          >
            <View style={styles.toolIcon}>
              <Ionicons name="checkmark-done" size={24} color={COLORS.gold} />
            </View>
            <Text style={styles.toolText}>متتبع العادات</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.toolCard}
            onPress={() => router.push('/intake-questionnaire' as any)}
          >
            <View style={styles.toolIcon}>
              <Ionicons name="clipboard" size={24} color={COLORS.gold} />
            </View>
            <Text style={styles.toolText}>استبيان القبول</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.toolCard}
            onPress={() => router.push('/resources' as any)}
          >
            <View style={styles.toolIcon}>
              <Ionicons name="library" size={24} color={COLORS.gold} />
            </View>
            <Text style={styles.toolText}>المكتبة</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* زر حجز جلسة */}
      <TouchableOpacity 
        style={styles.bookingBtn}
        onPress={() => router.push('/(tabs)/bookings' as any)}
      >
        <Text style={styles.bookingBtnText}>احجز جلستك مع يازو</Text>
        <Ionicons name="calendar" size={22} color={COLORS.primary} />
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
      <View style={styles.yazoHeader}>
        <View style={styles.logoContainer}>
          <Ionicons name="sparkles" size={32} color={COLORS.gold} />
        </View>
        <Text style={styles.logo}>اسأل يازو</Text>
        <Text style={styles.greeting}>مرحباً يازو! 👋</Text>
        <Text style={styles.subtitle}>لوحة التحكم</Text>
      </View>

      {/* الإحصائيات */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Ionicons name="people" size={28} color={COLORS.gold} />
          <Text style={styles.statNumber}>{stats.total_clients}</Text>
          <Text style={styles.statLabel}>المتدربين</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="calendar" size={28} color={COLORS.gold} />
          <Text style={styles.statNumber}>{stats.active_bookings}</Text>
          <Text style={styles.statLabel}>الحجوزات</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="cash" size={28} color={COLORS.gold} />
          <Text style={styles.statNumber}>${stats.total_revenue}</Text>
          <Text style={styles.statLabel}>الإيرادات</Text>
        </View>
      </View>

      {/* قائمة الإدارة */}
      <View style={styles.adminMenu}>
        <TouchableOpacity style={styles.adminMenuItem} onPress={() => router.push('/(tabs)/my-trainees')}>
          <View style={styles.adminMenuIcon}>
            <Ionicons name="people" size={24} color={COLORS.gold} />
          </View>
          <View style={styles.adminMenuContent}>
            <Text style={styles.adminMenuTitle}>المتدربين</Text>
            <Text style={styles.adminMenuSubtitle}>إدارة المتدربين</Text>
          </View>
          <Ionicons name="chevron-back" size={20} color={COLORS.gold} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.adminMenuItem} onPress={() => router.push('/coach/sessions' as any)}>
          <View style={styles.adminMenuIcon}>
            <Ionicons name="time" size={24} color={COLORS.gold} />
          </View>
          <View style={styles.adminMenuContent}>
            <Text style={styles.adminMenuTitle}>الجلسات</Text>
            <Text style={styles.adminMenuSubtitle}>سجل الجلسات</Text>
          </View>
          <Ionicons name="chevron-back" size={20} color={COLORS.gold} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.adminMenuItem} onPress={() => router.push('/admin/packages' as any)}>
          <View style={styles.adminMenuIcon}>
            <Ionicons name="pricetags" size={24} color={COLORS.gold} />
          </View>
          <View style={styles.adminMenuContent}>
            <Text style={styles.adminMenuTitle}>الباقات</Text>
            <Text style={styles.adminMenuSubtitle}>إدارة الباقات</Text>
          </View>
          <Ionicons name="chevron-back" size={20} color={COLORS.gold} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.adminMenuItem} onPress={() => router.push('/(tabs)/bookings')}>
          <View style={styles.adminMenuIcon}>
            <Ionicons name="receipt" size={24} color={COLORS.gold} />
          </View>
          <View style={styles.adminMenuContent}>
            <Text style={styles.adminMenuTitle}>الحجوزات الواردة</Text>
            <Text style={styles.adminMenuSubtitle}>طلبات الحجز الجديدة</Text>
          </View>
          <Ionicons name="chevron-back" size={20} color={COLORS.gold} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.adminMenuItem} onPress={() => router.push('/(tabs)/chat')}>
          <View style={styles.adminMenuIcon}>
            <Ionicons name="chatbubbles" size={24} color={COLORS.gold} />
          </View>
          <View style={styles.adminMenuContent}>
            <Text style={styles.adminMenuTitle}>المحادثات</Text>
            <Text style={styles.adminMenuSubtitle}>التواصل مع المتدربين</Text>
          </View>
          <Ionicons name="chevron-back" size={20} color={COLORS.gold} />
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
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        <ActivityIndicator size="large" color={COLORS.gold} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {user?.role === 'admin' ? (
          <YazoHome user={user} router={router} />
        ) : (
          <ClientHome user={user} router={router} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.primary 
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: COLORS.primary 
  },
  scrollContent: { 
    padding: 20, 
    paddingBottom: 100 
  },
  
  // Header
  header: { 
    alignItems: 'center', 
    marginBottom: 28,
    paddingTop: 10,
  },
  yazoHeader: { 
    alignItems: 'center', 
    marginBottom: 28,
    paddingTop: 10,
  },
  logoContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: COLORS.gold,
  },
  logo: { 
    fontSize: 32, 
    fontFamily: FONTS.bold, 
    color: COLORS.gold,
    marginBottom: 4,
  },
  greeting: { 
    fontSize: 22, 
    fontFamily: FONTS.semiBold, 
    color: COLORS.text,
    marginTop: 8,
  },
  subtitle: { 
    fontSize: 14, 
    fontFamily: FONTS.regular, 
    color: COLORS.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },

  // Pillars
  pillarsContainer: {
    gap: 12,
  },
  pillarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondary,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pillarIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 14,
  },
  pillarContent: {
    flex: 1,
  },
  pillarNumber: {
    fontSize: 11,
    fontFamily: FONTS.semiBold,
    color: COLORS.gold,
    marginBottom: 2,
    textAlign: 'right',
  },
  pillarTitle: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    textAlign: 'right',
  },
  pillarTitleEn: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    marginBottom: 4,
    textAlign: 'right',
  },
  pillarDescription: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    textAlign: 'right',
  },

  // Quick Tools
  quickTools: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.gold,
    textAlign: 'right',
    marginBottom: 12,
  },
  toolsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  toolCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: COLORS.secondary,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  toolIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
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
    backgroundColor: COLORS.gold,
    borderRadius: 14,
    padding: 16,
    marginTop: 24,
    gap: 10,
  },
  bookingBtnText: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.primary,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.secondary,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statNumber: {
    fontSize: 22,
    fontFamily: FONTS.bold,
    color: COLORS.gold,
    marginTop: 6,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    marginTop: 4,
  },

  // Admin Menu
  adminMenu: {
    gap: 10,
  },
  adminMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondary,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  adminMenuIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
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
    color: COLORS.textMuted,
    marginTop: 2,
  },
});
