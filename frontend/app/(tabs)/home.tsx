import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFonts, Cairo_400Regular, Cairo_700Bold } from '@expo-google-fonts/cairo';

// ==================== أدوات المتدربين ====================
const physicalTools = [
  { id: 'bmi', title: 'مؤشر كتلة الجسم', icon: 'body', color: '#4CAF50', route: '/calculators/bmi' },
  { id: 'bodyfat', title: 'نسبة الدهون', icon: 'analytics', color: '#FF5722', route: '/calculators/bodyfat' },
  { id: 'ideal-weight', title: 'الوزن المثالي', icon: 'fitness', color: '#2196F3', route: '/calculators/ideal-weight' },
  { id: 'waist-height', title: 'نسبة الخصر للطول', icon: 'resize', color: '#9C27B0', route: '/calculators/waist-height' },
  { id: 'tdee', title: 'السعرات اليومية', icon: 'flame', color: '#F44336', route: '/calculators/tdee' },
  { id: 'calories-burned', title: 'السعرات المحروقة', icon: 'barbell', color: '#FF9800', route: '/calculators/calories-burned' },
  { id: 'one-rep-max', title: 'الحد الأقصى للتكرار', icon: 'podium', color: '#673AB7', route: '/calculators/one-rep-max' },
  { id: 'heart-rate', title: 'نبض القلب المستهدف', icon: 'heart', color: '#E91E63', route: '/calculators/heart-rate' },
];

const nutritionTools = [
  { id: 'calorie-goal', title: 'هدف السعرات', icon: 'trending-down', color: '#00BCD4', route: '/calculators/calorie-goal' },
  { id: 'macros', title: 'المغذيات الكبرى', icon: 'nutrition', color: '#795548', route: '/calculators/macros' },
  { id: 'water', title: 'كمية الماء اليومية', icon: 'water', color: '#03A9F4', route: '/calculators/water' },
];

const mentalTools = [
  { id: 'pss10', title: 'مقياس التوتر', icon: 'brain', color: '#9C27B0', route: '/calculators/pss10' },
  { id: 'gad7', title: 'مقياس القلق', icon: 'pulse', color: '#E91E63', route: '/calculators/gad7' },
  { id: 'swls', title: 'الرضا عن الحياة', icon: 'happy', color: '#FF9800', route: '/calculators/swls' },
  { id: 'who5', title: 'مؤشر الرفاهية', icon: 'sunny', color: '#2196F3', route: '/calculators/who5' },
  { id: 'mood-tracker', title: 'متتبع المزاج', icon: 'calendar', color: '#00BCD4', route: '/calculators/mood-tracker' },
];

const spiritualTools = [
  { id: 'meditation-timer', title: 'مؤقت التأمل', icon: 'flower', color: '#7C4DFF', route: '/calculators/meditation-timer' },
  { id: 'breathing-exercise', title: 'تمارين التنفس', icon: 'fitness', color: '#2196F3', route: '/calculators/breathing-exercise' },
  { id: 'gratitude-journal', title: 'دفتر الامتنان', icon: 'heart', color: '#FF9800', route: '/calculators/gratitude-journal' },
  { id: 'core-values', title: 'القيم الأساسية', icon: 'diamond', color: '#9C27B0', route: '/calculators/core-values' },
  { id: 'reflection-prompts', title: 'تأملات عميقة', icon: 'bulb', color: '#00BCD4', route: '/calculators/reflection-prompts' },
  { id: 'wheel-of-life', title: 'عجلة الحياة', icon: 'pie-chart', color: '#E91E63', route: '/calculators/wheel-of-life' },
];

const pillars = [
  { id: 'physical', title: 'اللياقة البدنية', subtitle: 'اللياقة والصحة الجسدية', icon: 'barbell', color: '#4CAF50', bg: '#E8F5E9', tools: physicalTools },
  { id: 'nutrition', title: 'الصحة التغذوية', subtitle: 'النظام الغذائي والتغذية', icon: 'nutrition', color: '#FF9800', bg: '#FFF3E0', tools: nutritionTools },
  { id: 'mental', title: 'الصحة النفسية', subtitle: 'العقل والوعي والمشاعر', icon: 'happy', color: '#9C27B0', bg: '#F3E5F5', tools: mentalTools },
  { id: 'spiritual', title: 'الرفاهية الروحية', subtitle: 'السلام الداخلي والروحانية', icon: 'leaf', color: '#00BCD4', bg: '#E0F7FA', tools: spiritualTools },
];

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

// ==================== واجهة المتدرب ====================
function ClientHome({ user, router }: { user: any; router: any }) {
  const [expandedPillar, setExpandedPillar] = useState<string | null>(null);

  const togglePillar = (pillarId: string) => {
    setExpandedPillar(expandedPillar === pillarId ? null : pillarId);
  };

  return (
    <>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>اسأل يازو</Text>
          <Text style={styles.logoSubtext}>Ask Yazo</Text>
        </View>
        <Text style={styles.greeting}>أهلاً {user?.full_name || 'بك'}!</Text>
        <Text style={styles.subtitle}>رحلتك نحو الحياة الأفضل تبدأ هنا</Text>
      </View>

      <View style={styles.pillarsSection}>
        <Text style={styles.sectionTitle}>الركائز الأربع للعافية</Text>
        <Text style={styles.sectionSubtitle}>اضغط على أي ركيزة لعرض الأدوات</Text>
        
        {pillars.map((pillar) => (
          <View key={pillar.id} style={styles.pillarContainer}>
            <TouchableOpacity
              style={[styles.pillarCard, { backgroundColor: pillar.bg }]}
              onPress={() => togglePillar(pillar.id)}
              activeOpacity={0.8}
            >
              <View style={[styles.pillarIconContainer, { backgroundColor: pillar.color }]}>
                <Ionicons name={pillar.icon as any} size={28} color="#fff" />
              </View>
              <View style={styles.pillarContent}>
                <Text style={[styles.pillarTitle, { color: pillar.color }]}>{pillar.title}</Text>
                <Text style={styles.pillarSubtitle}>{pillar.subtitle}</Text>
              </View>
              <View style={styles.pillarBadge}>
                <Text style={[styles.pillarBadgeText, { color: pillar.color }]}>{pillar.tools.length}</Text>
                <Ionicons name={expandedPillar === pillar.id ? 'chevron-up' : 'chevron-down'} size={20} color={pillar.color} />
              </View>
            </TouchableOpacity>

            {expandedPillar === pillar.id && (
              <View style={styles.toolsGrid}>
                {pillar.tools.map((tool) => (
                  <TouchableOpacity
                    key={tool.id}
                    style={styles.toolCard}
                    onPress={() => router.push(tool.route as any)}
                  >
                    <View style={[styles.toolIconBg, { backgroundColor: tool.color + '20' }]}>
                      <Ionicons name={tool.icon as any} size={24} color={tool.color} />
                    </View>
                    <Text style={styles.toolTitle}>{tool.title}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        ))}
      </View>

      <View style={styles.actionsSection}>
        <Text style={styles.sectionTitle}>الإجراءات السريعة</Text>
        
        <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/(tabs)/bookings')}>
          <View style={[styles.actionIconContainer, { backgroundColor: '#E8F5E9' }]}>
            <Ionicons name="calendar" size={24} color="#4CAF50" />
          </View>
          <View style={styles.actionText}>
            <Text style={styles.actionTitle}>حجز جلسة</Text>
            <Text style={styles.actionSubtitle}>احجز ساعات التدريب مع المدرب</Text>
          </View>
          <Ionicons name="chevron-back" size={24} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/(tabs)/chat')}>
          <View style={[styles.actionIconContainer, { backgroundColor: '#FFF3E0' }]}>
            <Ionicons name="chatbubbles" size={24} color="#FF9800" />
          </View>
          <View style={styles.actionText}>
            <Text style={styles.actionTitle}>محادثة المدرب</Text>
            <Text style={styles.actionSubtitle}>تواصل مباشر مع مدربك</Text>
          </View>
          <Ionicons name="chevron-back" size={24} color="#999" />
        </TouchableOpacity>
      </View>
    </>
  );
}

// ==================== واجهة المدرب ====================
function CoachHome({ user, router }: { user: any; router: any }) {
  const [stats, setStats] = useState({ clients: 0, bookings: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/coach/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <View style={styles.coachHeader}>
        <View style={styles.coachBadge}>
          <Ionicons name="fitness" size={16} color="#fff" />
          <Text style={styles.coachBadgeText}>مدرب</Text>
        </View>
        <Text style={styles.coachGreeting}>مرحباً {user?.full_name}!</Text>
        <Text style={styles.coachSubtitle}>لوحة تحكم المدرب</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: '#E3F2FD' }]}>
          <Ionicons name="people" size={32} color="#2196F3" />
          <Text style={styles.statNumber}>{stats.clients}</Text>
          <Text style={styles.statLabel}>المتدربين</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#E8F5E9' }]}>
          <Ionicons name="calendar" size={32} color="#4CAF50" />
          <Text style={styles.statNumber}>{stats.bookings}</Text>
          <Text style={styles.statLabel}>الحجوزات</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#FFF3E0' }]}>
          <Ionicons name="cash" size={32} color="#FF9800" />
          <Text style={styles.statNumber}>${stats.revenue}</Text>
          <Text style={styles.statLabel}>الإيرادات</Text>
        </View>
      </View>

      <View style={styles.coachMenu}>
        <Text style={styles.sectionTitle}>إدارة التدريب</Text>

        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/coach/packages' as any)}>
          <View style={[styles.menuIcon, { backgroundColor: '#E8F5E9' }]}>
            <Ionicons name="pricetag" size={24} color="#4CAF50" />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>باقاتي</Text>
            <Text style={styles.menuSubtitle}>إدارة الباقات والأسعار</Text>
          </View>
          <Ionicons name="chevron-back" size={24} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/coach/bookings' as any)}>
          <View style={[styles.menuIcon, { backgroundColor: '#E3F2FD' }]}>
            <Ionicons name="calendar" size={24} color="#2196F3" />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>الحجوزات</Text>
            <Text style={styles.menuSubtitle}>عرض وإدارة حجوزات المتدربين</Text>
          </View>
          <Ionicons name="chevron-back" size={24} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/coach/clients' as any)}>
          <View style={[styles.menuIcon, { backgroundColor: '#F3E5F5' }]}>
            <Ionicons name="people" size={24} color="#9C27B0" />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>المتدربين</Text>
            <Text style={styles.menuSubtitle}>قائمة المتدربين المسجلين</Text>
          </View>
          <Ionicons name="chevron-back" size={24} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(tabs)/chat')}>
          <View style={[styles.menuIcon, { backgroundColor: '#FFEBEE' }]}>
            <Ionicons name="chatbubbles" size={24} color="#F44336" />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>المحادثات</Text>
            <Text style={styles.menuSubtitle}>التواصل مع المتدربين</Text>
          </View>
          <Ionicons name="chevron-back" size={24} color="#999" />
        </TouchableOpacity>
      </View>
    </>
  );
}

// ==================== واجهة الأدمن ====================
function AdminHome({ user, router }: { user: any; router: any }) {
  const [stats, setStats] = useState({ users: 0, coaches: 0, bookings: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);

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
        setStats(data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <View style={styles.adminHeader}>
        <View style={styles.adminBadge}>
          <Ionicons name="shield-checkmark" size={16} color="#fff" />
          <Text style={styles.adminBadgeText}>مدير المنصة</Text>
        </View>
        <Text style={styles.adminGreeting}>مرحباً {user?.full_name}!</Text>
        <Text style={styles.adminSubtitle}>لوحة تحكم المدير</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: '#E8F5E9' }]}>
          <Ionicons name="people" size={32} color="#4CAF50" />
          <Text style={styles.statNumber}>{stats.users}</Text>
          <Text style={styles.statLabel}>المتدربين</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#FFF3E0' }]}>
          <Ionicons name="fitness" size={32} color="#FF9800" />
          <Text style={styles.statNumber}>{stats.coaches || 0}</Text>
          <Text style={styles.statLabel}>المدربين</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#E3F2FD' }]}>
          <Ionicons name="cash" size={32} color="#2196F3" />
          <Text style={styles.statNumber}>${stats.revenue}</Text>
          <Text style={styles.statLabel}>الإيرادات</Text>
        </View>
      </View>

      <View style={styles.adminMenu}>
        <Text style={styles.sectionTitle}>إدارة المنصة</Text>

        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/admin' as any)}>
          <View style={[styles.menuIcon, { backgroundColor: '#E3F2FD' }]}>
            <Ionicons name="grid" size={24} color="#2196F3" />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>لوحة التحكم الكاملة</Text>
            <Text style={styles.menuSubtitle}>جميع أدوات الإدارة</Text>
          </View>
          <Ionicons name="chevron-back" size={24} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/admin/packages' as any)}>
          <View style={[styles.menuIcon, { backgroundColor: '#E8F5E9' }]}>
            <Ionicons name="pricetag" size={24} color="#4CAF50" />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>إدارة الباقات</Text>
            <Text style={styles.menuSubtitle}>الباقات والأسعار</Text>
          </View>
          <Ionicons name="chevron-back" size={24} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/admin/users' as any)}>
          <View style={[styles.menuIcon, { backgroundColor: '#F3E5F5' }]}>
            <Ionicons name="people" size={24} color="#9C27B0" />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>إدارة المستخدمين</Text>
            <Text style={styles.menuSubtitle}>المتدربين والمدربين</Text>
          </View>
          <Ionicons name="chevron-back" size={24} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/admin/bookings' as any)}>
          <View style={[styles.menuIcon, { backgroundColor: '#FFF3E0' }]}>
            <Ionicons name="calendar" size={24} color="#FF9800" />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>الحجوزات</Text>
            <Text style={styles.menuSubtitle}>جميع الحجوزات</Text>
          </View>
          <Ionicons name="chevron-back" size={24} color="#999" />
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
  
  const [fontsLoaded] = useFonts({ Cairo_400Regular, Cairo_700Bold });

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  const renderHomeByRole = () => {
    switch (user?.role) {
      case 'admin':
        return <AdminHome user={user} router={router} />;
      case 'coach':
        return <CoachHome user={user} router={router} />;
      default:
        return <ClientHome user={user} router={router} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {renderHomeByRole()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 16, paddingBottom: 100 },
  
  // Client styles
  header: { marginBottom: 24, alignItems: 'center' },
  logoContainer: { alignItems: 'center', marginBottom: 16 },
  logoText: { fontSize: 32, fontFamily: 'Cairo_700Bold', color: '#2196F3' },
  logoSubtext: { fontSize: 14, fontFamily: 'Cairo_400Regular', color: '#666' },
  greeting: { fontSize: 24, fontFamily: 'Cairo_700Bold', color: '#333', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#666', marginTop: 4, fontFamily: 'Cairo_400Regular', textAlign: 'center' },
  
  pillarsSection: { marginBottom: 24 },
  sectionTitle: { fontSize: 20, fontFamily: 'Cairo_700Bold', color: '#333', marginBottom: 4, textAlign: 'right' },
  sectionSubtitle: { fontSize: 12, fontFamily: 'Cairo_400Regular', color: '#666', marginBottom: 16, textAlign: 'right' },
  
  pillarContainer: { marginBottom: 12 },
  pillarCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 16 },
  pillarIconContainer: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginLeft: 16 },
  pillarContent: { flex: 1 },
  pillarTitle: { fontSize: 18, fontFamily: 'Cairo_700Bold', textAlign: 'right' },
  pillarSubtitle: { fontSize: 12, fontFamily: 'Cairo_400Regular', color: '#666', textAlign: 'right' },
  pillarBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pillarBadgeText: { fontSize: 18, fontFamily: 'Cairo_700Bold' },
  
  toolsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, paddingTop: 8, gap: 8, backgroundColor: '#fff', borderBottomLeftRadius: 16, borderBottomRightRadius: 16, marginTop: -8 },
  toolCard: { width: '31%', padding: 12, borderRadius: 12, alignItems: 'center', backgroundColor: '#f9f9f9' },
  toolIconBg: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  toolTitle: { fontSize: 10, fontFamily: 'Cairo_700Bold', color: '#333', textAlign: 'center' },
  
  actionsSection: { marginBottom: 24 },
  actionButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  actionIconContainer: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginLeft: 16 },
  actionText: { flex: 1, alignItems: 'flex-end' },
  actionTitle: { fontSize: 16, fontFamily: 'Cairo_700Bold', color: '#333', textAlign: 'right' },
  actionSubtitle: { fontSize: 12, fontFamily: 'Cairo_400Regular', color: '#666', marginTop: 2, textAlign: 'right' },
  
  // Coach styles
  coachHeader: { alignItems: 'center', marginBottom: 24, paddingVertical: 20, backgroundColor: '#FF9800', borderRadius: 20, marginHorizontal: -8 },
  coachBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.3)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, gap: 4 },
  coachBadgeText: { fontSize: 12, fontFamily: 'Cairo_700Bold', color: '#fff' },
  coachGreeting: { fontSize: 24, fontFamily: 'Cairo_700Bold', color: '#fff', marginTop: 12 },
  coachSubtitle: { fontSize: 14, fontFamily: 'Cairo_400Regular', color: 'rgba(255,255,255,0.9)' },
  coachMenu: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginTop: 16 },
  
  // Admin styles
  adminHeader: { alignItems: 'center', marginBottom: 24, paddingVertical: 20, backgroundColor: '#2196F3', borderRadius: 20, marginHorizontal: -8 },
  adminBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.3)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, gap: 4 },
  adminBadgeText: { fontSize: 12, fontFamily: 'Cairo_700Bold', color: '#fff' },
  adminGreeting: { fontSize: 24, fontFamily: 'Cairo_700Bold', color: '#fff', marginTop: 12 },
  adminSubtitle: { fontSize: 14, fontFamily: 'Cairo_400Regular', color: 'rgba(255,255,255,0.9)' },
  adminMenu: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginTop: 16 },
  
  // Stats
  statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statCard: { flex: 1, padding: 16, borderRadius: 16, alignItems: 'center' },
  statNumber: { fontSize: 24, fontFamily: 'Cairo_700Bold', color: '#333', marginTop: 8 },
  statLabel: { fontSize: 12, fontFamily: 'Cairo_400Regular', color: '#666', marginTop: 4 },
  
  // Menu
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  menuIcon: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginLeft: 16 },
  menuContent: { flex: 1 },
  menuTitle: { fontSize: 16, fontFamily: 'Cairo_700Bold', color: '#333', textAlign: 'right' },
  menuSubtitle: { fontSize: 12, fontFamily: 'Cairo_400Regular', color: '#999', textAlign: 'right', marginTop: 2 },
});
