import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFonts, Cairo_400Regular, Cairo_700Bold } from '@expo-google-fonts/cairo';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

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
  { id: 'pss10', title: 'مقياس التوتر', icon: 'pulse', color: '#9C27B0', route: '/calculators/pss10' },
  { id: 'gad7', title: 'مقياس القلق', icon: 'medical', color: '#E91E63', route: '/calculators/gad7' },
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

// ==================== واجهة المتدرب ====================
function ClientHome({ user, router }: { user: any; router: any }) {
  const [expandedPillar, setExpandedPillar] = useState<string | null>(null);

  return (
    <>
      <View style={styles.clientHeader}>
        <Text style={styles.logoText}>اسأل يازو</Text>
        <Text style={styles.greeting}>أهلاً {user?.full_name || 'بك'}!</Text>
        <Text style={styles.subtitle}>رحلتك نحو الحياة الأفضل تبدأ هنا</Text>
      </View>

      <View style={styles.pillarsSection}>
        <Text style={styles.sectionTitle}>الركائز الأربع للعافية</Text>
        
        {pillars.map((pillar) => (
          <View key={pillar.id} style={styles.pillarContainer}>
            <TouchableOpacity
              style={[styles.pillarCard, { backgroundColor: pillar.bg }]}
              onPress={() => setExpandedPillar(expandedPillar === pillar.id ? null : pillar.id)}
            >
              <View style={[styles.pillarIconContainer, { backgroundColor: pillar.color }]}>
                <Ionicons name={pillar.icon as any} size={24} color="#fff" />
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
                      <Ionicons name={tool.icon as any} size={22} color={tool.color} />
                    </View>
                    <Text style={styles.toolTitle}>{tool.title}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        ))}
      </View>

      {/* أدوات إضافية */}
      <View style={styles.extraToolsSection}>
        <Text style={styles.sectionTitle}>أدوات إضافية</Text>
        <View style={styles.extraToolsGrid}>
          <TouchableOpacity 
            style={styles.extraToolCard}
            onPress={() => router.push('/intake-questionnaire' as any)}
          >
            <View style={[styles.extraToolIcon, { backgroundColor: '#E3F2FD' }]}>
              <Ionicons name="clipboard" size={28} color="#2196F3" />
            </View>
            <Text style={styles.extraToolTitle}>استبيان القبول</Text>
            <Text style={styles.extraToolDesc}>حدد أهدافك</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.extraToolCard}
            onPress={() => router.push('/habit-tracker' as any)}
          >
            <View style={[styles.extraToolIcon, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="checkmark-done" size={28} color="#4CAF50" />
            </View>
            <Text style={styles.extraToolTitle}>متتبع العادات</Text>
            <Text style={styles.extraToolDesc}>تابع تقدمك</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.extraToolCard}
            onPress={() => router.push('/resources' as any)}
          >
            <View style={[styles.extraToolIcon, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="library" size={28} color="#FF9800" />
            </View>
            <Text style={styles.extraToolTitle}>مكتبة الموارد</Text>
            <Text style={styles.extraToolDesc}>مقالات وفيديوهات</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.extraToolCard}
            onPress={() => router.push('/settings' as any)}
          >
            <View style={[styles.extraToolIcon, { backgroundColor: '#F3E5F5' }]}>
              <Ionicons name="settings" size={28} color="#9C27B0" />
            </View>
            <Text style={styles.extraToolTitle}>الإعدادات</Text>
            <Text style={styles.extraToolDesc}>تخصيص التطبيق</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

// ==================== واجهة المدرب ====================
function CoachHome({ user, router }: { user: any; router: any }) {
  const [stats, setStats] = useState({ clients: 0, bookings: 0, revenue: 0 });
  const [hasSubscription, setHasSubscription] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const [statsRes, subRes] = await Promise.all([
        fetch(`${API_URL}/api/coach/stats`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/api/coach/subscription`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      
      if (statsRes.ok) setStats(await statsRes.json());
      if (subRes.ok) {
        const sub = await subRes.json();
        setHasSubscription(sub?.status === 'active');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <>
      <View style={styles.coachHeader}>
        <View style={styles.badge}>
          <Ionicons name="fitness" size={14} color="#fff" />
          <Text style={styles.badgeText}>مدرب</Text>
        </View>
        <Text style={styles.headerGreeting}>مرحباً {user?.full_name}!</Text>
        <Text style={styles.headerSubtitle}>لوحة تحكم المدرب</Text>
      </View>

      {!hasSubscription && (
        <TouchableOpacity style={styles.subscriptionAlert} onPress={() => router.push('/(tabs)/subscription')}>
          <Ionicons name="warning" size={24} color="#FF9800" />
          <View style={styles.alertContent}>
            <Text style={styles.alertTitle}>اشتراكك غير مفعل</Text>
            <Text style={styles.alertText}>اشترك للظهور في قائمة المدربين</Text>
          </View>
          <Ionicons name="chevron-back" size={20} color="#FF9800" />
        </TouchableOpacity>
      )}

      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: '#E3F2FD' }]}>
          <Ionicons name="people" size={28} color="#2196F3" />
          <Text style={styles.statNumber}>{stats.clients}</Text>
          <Text style={styles.statLabel}>المتدربين</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#E8F5E9' }]}>
          <Ionicons name="calendar" size={28} color="#4CAF50" />
          <Text style={styles.statNumber}>{stats.bookings}</Text>
          <Text style={styles.statLabel}>الحجوزات</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#FFF3E0' }]}>
          <Ionicons name="cash" size={28} color="#FF9800" />
          <Text style={styles.statNumber}>${stats.revenue}</Text>
          <Text style={styles.statLabel}>الإيرادات</Text>
        </View>
      </View>

      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>إدارة التدريب</Text>

        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/coach/profile' as any)}>
          <View style={[styles.menuIcon, { backgroundColor: '#FFF3E0' }]}>
            <Ionicons name="person-circle" size={22} color="#FF9800" />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>بروفايلي</Text>
            <Text style={styles.menuSubtitle}>تعديل السيرة والتخصصات</Text>
          </View>
          <Ionicons name="chevron-back" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/coach/packages' as any)}>
          <View style={[styles.menuIcon, { backgroundColor: '#FFF3E0' }]}>
            <Ionicons name="pricetags" size={22} color="#FF9800" />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>باقاتي</Text>
            <Text style={styles.menuSubtitle}>إدارة باقات التدريب</Text>
          </View>
          <Ionicons name="chevron-back" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/coach/sessions' as any)}>
          <View style={[styles.menuIcon, { backgroundColor: '#E3F2FD' }]}>
            <Ionicons name="time" size={22} color="#2196F3" />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>سجل الجلسات</Text>
            <Text style={styles.menuSubtitle}>تتبع جلسات التدريب</Text>
          </View>
          <Ionicons name="chevron-back" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(tabs)/my-trainees')}>
          <View style={[styles.menuIcon, { backgroundColor: '#E8F5E9' }]}>
            <Ionicons name="school" size={22} color="#4CAF50" />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>متدربيني</Text>
            <Text style={styles.menuSubtitle}>عرض وإدارة المتدربين</Text>
          </View>
          <Ionicons name="chevron-back" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(tabs)/chat')}>
          <View style={[styles.menuIcon, { backgroundColor: '#E3F2FD' }]}>
            <Ionicons name="chatbubbles" size={22} color="#2196F3" />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>المحادثات</Text>
            <Text style={styles.menuSubtitle}>التواصل مع المتدربين</Text>
          </View>
          <Ionicons name="chevron-back" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(tabs)/subscription')}>
          <View style={[styles.menuIcon, { backgroundColor: '#FFF3E0' }]}>
            <Ionicons name="card" size={22} color="#FF9800" />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>اشتراكي</Text>
            <Text style={styles.menuSubtitle}>إدارة الاشتراك الشهري</Text>
          </View>
          <Ionicons name="chevron-back" size={20} color="#999" />
        </TouchableOpacity>
      </View>
    </>
  );
}

// ==================== واجهة يازو (المدرب والأدمن) ====================
function YazoHome({ user, router }: { user: any; router: any }) {
  const [stats, setStats] = useState({ 
    total_clients: 0, 
    active_bookings: 0, 
    total_revenue: 0,
    total_sessions: 0 
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      // نستخدم API الأدمن للإحصائيات
      const response = await fetch(`${API_URL}/api/admin/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setStats({
          total_clients: data.total_users || 0,
          active_bookings: data.total_bookings || 0,
          total_revenue: data.total_revenue || 0,
          total_sessions: data.total_sessions || 0,
        });
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <>
      <View style={styles.yazoHeader}>
        <Text style={styles.yazoLogo}>اسأل يازو</Text>
        <Text style={styles.yazoGreeting}>مرحباً يازو! 👋</Text>
        <Text style={styles.yazoSubtitle}>لوحة التحكم الخاصة بك</Text>
      </View>

      {/* الإحصائيات */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: '#E8F5E9' }]}>
          <Ionicons name="people" size={28} color="#4CAF50" />
          <Text style={styles.statNumber}>{stats.total_clients}</Text>
          <Text style={styles.statLabel}>المتدربين</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#E3F2FD' }]}>
          <Ionicons name="calendar" size={28} color="#2196F3" />
          <Text style={styles.statNumber}>{stats.active_bookings}</Text>
          <Text style={styles.statLabel}>الحجوزات</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#FFF3E0' }]}>
          <Ionicons name="cash" size={28} color="#FF9800" />
          <Text style={styles.statNumber}>${stats.total_revenue}</Text>
          <Text style={styles.statLabel}>الإيرادات</Text>
        </View>
      </View>

      {/* إدارة التدريب */}
      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>إدارة التدريب</Text>

        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(tabs)/my-trainees')}>
          <View style={[styles.menuIcon, { backgroundColor: '#E8F5E9' }]}>
            <Ionicons name="people" size={22} color="#4CAF50" />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>المتدربين</Text>
            <Text style={styles.menuSubtitle}>عرض وإدارة المتدربين</Text>
          </View>
          <Ionicons name="chevron-back" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/coach/sessions' as any)}>
          <View style={[styles.menuIcon, { backgroundColor: '#E3F2FD' }]}>
            <Ionicons name="time" size={22} color="#2196F3" />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>سجل الجلسات</Text>
            <Text style={styles.menuSubtitle}>تتبع جلسات التدريب</Text>
          </View>
          <Ionicons name="chevron-back" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(tabs)/chat')}>
          <View style={[styles.menuIcon, { backgroundColor: '#FFF3E0' }]}>
            <Ionicons name="chatbubbles" size={22} color="#FF9800" />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>المحادثات</Text>
            <Text style={styles.menuSubtitle}>التواصل مع المتدربين</Text>
          </View>
          <Ionicons name="chevron-back" size={20} color="#999" />
        </TouchableOpacity>
      </View>

      {/* إدارة المنصة */}
      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>إدارة المنصة</Text>

        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/admin/packages' as any)}>
          <View style={[styles.menuIcon, { backgroundColor: '#FFF3E0' }]}>
            <Ionicons name="pricetags" size={22} color="#FF9800" />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>باقات التدريب</Text>
            <Text style={styles.menuSubtitle}>إدارة الباقات والأسعار</Text>
          </View>
          <Ionicons name="chevron-back" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/admin/payments' as any)}>
          <View style={[styles.menuIcon, { backgroundColor: '#E8F5E9' }]}>
            <Ionicons name="wallet" size={22} color="#4CAF50" />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>المدفوعات</Text>
            <Text style={styles.menuSubtitle}>الإيرادات والمعاملات</Text>
          </View>
          <Ionicons name="chevron-back" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/admin/users' as any)}>
          <View style={[styles.menuIcon, { backgroundColor: '#F3E5F5' }]}>
            <Ionicons name="person-add" size={22} color="#9C27B0" />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>إدارة المستخدمين</Text>
            <Text style={styles.menuSubtitle}>المتدربين المسجلين</Text>
          </View>
          <Ionicons name="chevron-back" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/admin/settings' as any)}>
          <View style={[styles.menuIcon, { backgroundColor: '#ECEFF1' }]}>
            <Ionicons name="settings" size={22} color="#607D8B" />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>إعدادات المنصة</Text>
            <Text style={styles.menuSubtitle}>تخصيص التطبيق</Text>
          </View>
          <Ionicons name="chevron-back" size={20} color="#999" />
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
        <ActivityIndicator size="large" color="#4CAF50" />
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
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 16, paddingBottom: 100 },
  
  // Client Header
  clientHeader: { marginBottom: 24, alignItems: 'center' },
  logoText: { fontSize: 28, fontFamily: 'Cairo_700Bold', color: '#4CAF50' },
  greeting: { fontSize: 22, fontFamily: 'Cairo_700Bold', color: '#333', marginTop: 8 },
  subtitle: { fontSize: 14, color: '#666', fontFamily: 'Cairo_400Regular' },
  
  // Yazo Header
  yazoHeader: { 
    alignItems: 'center', 
    marginBottom: 20, 
    paddingVertical: 24, 
    backgroundColor: '#FF9800', 
    borderRadius: 20, 
    marginHorizontal: -8 
  },
  yazoLogo: { fontSize: 28, fontFamily: 'Cairo_700Bold', color: '#fff' },
  yazoGreeting: { fontSize: 22, fontFamily: 'Cairo_700Bold', color: '#fff', marginTop: 8 },
  yazoSubtitle: { fontSize: 14, fontFamily: 'Cairo_400Regular', color: 'rgba(255,255,255,0.9)' },
  
  // Legacy (for compatibility)
  coachHeader: { alignItems: 'center', marginBottom: 20, paddingVertical: 24, backgroundColor: '#FF9800', borderRadius: 20, marginHorizontal: -8 },
  adminHeader: { alignItems: 'center', marginBottom: 20, paddingVertical: 24, backgroundColor: '#2196F3', borderRadius: 20, marginHorizontal: -8 },
  badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.3)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, gap: 4 },
  badgeText: { fontSize: 12, fontFamily: 'Cairo_700Bold', color: '#fff' },
  headerGreeting: { fontSize: 22, fontFamily: 'Cairo_700Bold', color: '#fff', marginTop: 12 },
  headerSubtitle: { fontSize: 14, fontFamily: 'Cairo_400Regular', color: 'rgba(255,255,255,0.9)' },
  
  // Subscription Alert (unused now but kept for compatibility)
  subscriptionAlert: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF3E0', padding: 16, borderRadius: 12, marginBottom: 16, gap: 12 },
  alertContent: { flex: 1 },
  alertTitle: { fontSize: 14, fontFamily: 'Cairo_700Bold', color: '#E65100', textAlign: 'right' },
  alertText: { fontSize: 12, fontFamily: 'Cairo_400Regular', color: '#FF9800', textAlign: 'right' },
  
  // Stats
  statsGrid: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: { flex: 1, padding: 14, borderRadius: 14, alignItems: 'center' },
  statNumber: { fontSize: 22, fontFamily: 'Cairo_700Bold', color: '#333', marginTop: 6 },
  statLabel: { fontSize: 11, fontFamily: 'Cairo_400Regular', color: '#666', marginTop: 2 },
  
  // Pillars
  pillarsSection: { marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontFamily: 'Cairo_700Bold', color: '#333', marginBottom: 12, textAlign: 'right' },
  pillarContainer: { marginBottom: 10 },
  pillarCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 14 },
  pillarIconContainer: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginLeft: 12 },
  pillarContent: { flex: 1 },
  pillarTitle: { fontSize: 16, fontFamily: 'Cairo_700Bold', textAlign: 'right' },
  pillarSubtitle: { fontSize: 11, fontFamily: 'Cairo_400Regular', color: '#666', textAlign: 'right' },
  pillarBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pillarBadgeText: { fontSize: 16, fontFamily: 'Cairo_700Bold' },
  
  // Tools
  toolsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 10, paddingTop: 6, gap: 8, backgroundColor: '#fff', borderBottomLeftRadius: 14, borderBottomRightRadius: 14, marginTop: -6 },
  toolCard: { width: '31%', padding: 10, borderRadius: 10, alignItems: 'center', backgroundColor: '#f9f9f9' },
  toolIconBg: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  toolTitle: { fontSize: 10, fontFamily: 'Cairo_700Bold', color: '#333', textAlign: 'center' },
  
  // Menu
  menuSection: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginTop: 8 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  menuIcon: { width: 44, height: 44, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginLeft: 12 },
  menuContent: { flex: 1 },
  menuTitle: { fontSize: 15, fontFamily: 'Cairo_700Bold', color: '#333', textAlign: 'right' },
  menuSubtitle: { fontSize: 11, fontFamily: 'Cairo_400Regular', color: '#999', textAlign: 'right', marginTop: 1 },
  
  // Extra Tools (Trainee)
  extraToolsSection: { marginTop: 20, marginBottom: 20 },
  extraToolsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
  extraToolCard: { width: '47%', backgroundColor: '#fff', borderRadius: 16, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  extraToolIcon: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  extraToolTitle: { fontSize: 14, fontFamily: 'Cairo_700Bold', color: '#333', textAlign: 'center', marginBottom: 4 },
  extraToolDesc: { fontSize: 11, fontFamily: 'Cairo_400Regular', color: '#888', textAlign: 'center' },
});
