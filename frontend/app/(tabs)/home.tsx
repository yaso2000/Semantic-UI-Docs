import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFonts, Alexandria_400Regular, Alexandria_600SemiBold, Alexandria_700Bold } from '@expo-google-fonts/alexandria';
import { LinearGradient } from 'expo-linear-gradient';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';
const { width } = Dimensions.get('window');

// الألوان الفخمة
const COLORS = {
  primary: '#0A1628',      // أزرق داكن
  secondary: '#1A2744',    // أزرق أفتح
  gold: '#D4AF37',         // ذهبي
  goldLight: '#F4E4BC',    // ذهبي فاتح
  white: '#FFFFFF',
  text: '#E8E8E8',
  border: '#2A3A5C',
};

// ==================== الركائز الأربع ====================
const pillars = [
  { 
    id: 'physical', 
    title: 'اللياقة البدنية', 
    titleEn: 'Physical Fitness',
    icon: 'barbell', 
    description: 'معاً نبني جسماً قوياً وصحياً',
    route: '/pillars/physical'
  },
  { 
    id: 'nutrition', 
    title: 'الصحة الغذائية', 
    titleEn: 'Nutritional Health',
    icon: 'nutrition', 
    description: 'تغذية متوازنة لحياة أفضل',
    route: '/pillars/nutrition'
  },
  { 
    id: 'mental', 
    title: 'الصحة النفسية', 
    titleEn: 'Mental Wellness',
    icon: 'brain', 
    description: 'عقل صافٍ وروح متزنة',
    route: '/pillars/mental'
  },
  { 
    id: 'spiritual', 
    title: 'الصحة الروحية', 
    titleEn: 'Spiritual Well-being',
    icon: 'sparkles', 
    description: 'السلام الداخلي والتواصل الروحي',
    route: '/pillars/spiritual'
  },
];

// ==================== واجهة المتدرب ====================
function ClientHome({ user, router }: { user: any; router: any }) {
  return (
    <>
      {/* الهيدر */}
      <View style={styles.header}>
        <Text style={styles.logo}>اسأل يازو</Text>
        <Text style={styles.greeting}>أهلاً {user?.full_name?.split(' ')[0] || 'بك'}!</Text>
        <Text style={styles.subtitle}>منهج 4 ركائز للتطوير المتغيرة والتامحة الجندائية</Text>
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
              <Ionicons name={pillar.icon as any} size={32} color={COLORS.gold} />
            </View>
            <View style={styles.pillarContent}>
              <Text style={styles.pillarNumber}>{index + 1}</Text>
              <Text style={styles.pillarTitleEn}>{pillar.titleEn}</Text>
              <Text style={styles.pillarDescription}>{pillar.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={COLORS.gold} />
          </TouchableOpacity>
        ))}
      </View>

      {/* أدوات إضافية */}
      <View style={styles.extraTools}>
        <TouchableOpacity 
          style={styles.extraToolCard}
          onPress={() => router.push('/habit-tracker' as any)}
        >
          <Ionicons name="checkmark-done" size={24} color={COLORS.gold} />
          <Text style={styles.extraToolText}>متتبع العادات</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.extraToolCard}
          onPress={() => router.push('/resources' as any)}
        >
          <Ionicons name="library" size={24} color={COLORS.gold} />
          <Text style={styles.extraToolText}>مكتبة الموارد</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

// ==================== واجهة يازو (الأدمن) ====================
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

        <TouchableOpacity style={styles.adminMenuItem} onPress={() => router.push('/admin/payments' as any)}>
          <View style={styles.adminMenuIcon}>
            <Ionicons name="wallet" size={24} color={COLORS.gold} />
          </View>
          <View style={styles.adminMenuContent}>
            <Text style={styles.adminMenuTitle}>المدفوعات</Text>
            <Text style={styles.adminMenuSubtitle}>الإيرادات والمعاملات</Text>
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

// ==================== الصفحة الرئيسية ====================
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
        <ActivityIndicator size="large" color={COLORS.gold} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
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
    marginBottom: 30,
    paddingTop: 20,
  },
  yazoHeader: { 
    alignItems: 'center', 
    marginBottom: 30,
    paddingTop: 20,
  },
  logo: { 
    fontSize: 36, 
    fontFamily: 'Alexandria_700Bold', 
    color: COLORS.gold,
    marginBottom: 8,
  },
  greeting: { 
    fontSize: 24, 
    fontFamily: 'Alexandria_600SemiBold', 
    color: COLORS.white,
    marginTop: 8,
  },
  subtitle: { 
    fontSize: 14, 
    fontFamily: 'Alexandria_400Regular', 
    color: COLORS.text,
    marginTop: 4,
    textAlign: 'center',
  },

  // Pillars
  pillarsContainer: {
    gap: 16,
  },
  pillarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondary,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pillarIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  pillarContent: {
    flex: 1,
  },
  pillarNumber: {
    fontSize: 12,
    fontFamily: 'Alexandria_700Bold',
    color: COLORS.gold,
    marginBottom: 4,
  },
  pillarTitleEn: {
    fontSize: 16,
    fontFamily: 'Alexandria_600SemiBold',
    color: COLORS.white,
    marginBottom: 4,
  },
  pillarDescription: {
    fontSize: 12,
    fontFamily: 'Alexandria_400Regular',
    color: COLORS.text,
  },

  // Extra Tools
  extraTools: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  extraToolCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.secondary,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
  },
  extraToolText: {
    fontSize: 14,
    fontFamily: 'Alexandria_600SemiBold',
    color: COLORS.gold,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.secondary,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statNumber: {
    fontSize: 24,
    fontFamily: 'Alexandria_700Bold',
    color: COLORS.gold,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Alexandria_400Regular',
    color: COLORS.text,
    marginTop: 4,
  },

  // Admin Menu
  adminMenu: {
    gap: 12,
  },
  adminMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondary,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  adminMenuIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
    fontSize: 16,
    fontFamily: 'Alexandria_600SemiBold',
    color: COLORS.white,
  },
  adminMenuSubtitle: {
    fontSize: 12,
    fontFamily: 'Alexandria_400Regular',
    color: COLORS.text,
    marginTop: 2,
  },
});
