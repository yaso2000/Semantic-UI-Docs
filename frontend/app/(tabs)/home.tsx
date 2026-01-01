import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFonts, Cairo_400Regular, Cairo_700Bold } from '@expo-google-fonts/cairo';

// الركيزة الأولى: اللياقة البدنية
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

// الركيزة الثانية: الصحة التغذوية
const nutritionTools = [
  { id: 'calorie-goal', title: 'هدف السعرات', icon: 'trending-down', color: '#00BCD4', route: '/calculators/calorie-goal' },
  { id: 'macros', title: 'المغذيات الكبرى', icon: 'nutrition', color: '#795548', route: '/calculators/macros' },
  { id: 'water', title: 'كمية الماء اليومية', icon: 'water', color: '#03A9F4', route: '/calculators/water' },
];

// الركيزة الثالثة: الصحة النفسية
const mentalTools = [
  { id: 'pss10', title: 'مقياس التوتر', icon: 'brain', color: '#9C27B0', route: '/calculators/pss10' },
  { id: 'gad7', title: 'مقياس القلق', icon: 'pulse', color: '#E91E63', route: '/calculators/gad7' },
  { id: 'swls', title: 'الرضا عن الحياة', icon: 'happy', color: '#FF9800', route: '/calculators/swls' },
  { id: 'who5', title: 'مؤشر الرفاهية', icon: 'sunny', color: '#2196F3', route: '/calculators/who5' },
  { id: 'mood-tracker', title: 'متتبع المزاج', icon: 'calendar', color: '#00BCD4', route: '/calculators/mood-tracker' },
];

// الركيزة الرابعة: الرفاهية الروحية
const spiritualTools = [
  { id: 'meditation-timer', title: 'مؤقت التأمل', icon: 'flower', color: '#7C4DFF', route: '/calculators/meditation-timer' },
  { id: 'breathing-exercise', title: 'تمارين التنفس', icon: 'fitness', color: '#2196F3', route: '/calculators/breathing-exercise' },
  { id: 'gratitude-journal', title: 'دفتر الامتنان', icon: 'heart', color: '#FF9800', route: '/calculators/gratitude-journal' },
  { id: 'core-values', title: 'القيم الأساسية', icon: 'diamond', color: '#9C27B0', route: '/calculators/core-values' },
  { id: 'reflection-prompts', title: 'تأملات عميقة', icon: 'bulb', color: '#00BCD4', route: '/calculators/reflection-prompts' },
  { id: 'wheel-of-life', title: 'عجلة الحياة', icon: 'pie-chart', color: '#E91E63', route: '/calculators/wheel-of-life' },
];

const pillars = [
  {
    id: 'physical',
    title: 'اللياقة البدنية',
    subtitle: 'اللياقة والصحة الجسدية',
    icon: 'barbell',
    color: '#4CAF50',
    bg: '#E8F5E9',
    tools: physicalTools,
  },
  {
    id: 'nutrition',
    title: 'الصحة التغذوية',
    subtitle: 'النظام الغذائي والتغذية',
    icon: 'nutrition',
    color: '#FF9800',
    bg: '#FFF3E0',
    tools: nutritionTools,
  },
  {
    id: 'mental',
    title: 'الصحة النفسية',
    subtitle: 'العقل والوعي والمشاعر',
    icon: 'happy',
    color: '#9C27B0',
    bg: '#F3E5F5',
    tools: mentalTools,
  },
  {
    id: 'spiritual',
    title: 'الرفاهية الروحية',
    subtitle: 'السلام الداخلي والروحانية',
    icon: 'leaf',
    color: '#00BCD4',
    bg: '#E0F7FA',
    tools: spiritualTools,
  },
];

export default function HomeScreen() {
  const [user, setUser] = useState<any>(null);
  const [expandedPillar, setExpandedPillar] = useState<string | null>(null);
  const router = useRouter();
  
  const [fontsLoaded] = useFonts({
    Cairo_400Regular,
    Cairo_700Bold,
  });

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
    }
  };

  const togglePillar = (pillarId: string) => {
    setExpandedPillar(expandedPillar === pillarId ? null : pillarId);
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
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
                  <Ionicons
                    name={expandedPillar === pillar.id ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={pillar.color}
                  />
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
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/bookings')}
          >
            <View style={[styles.actionIconContainer, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="calendar" size={24} color="#4CAF50" />
            </View>
            <View style={styles.actionText}>
              <Text style={styles.actionTitle}>حجز جلسة</Text>
              <Text style={styles.actionSubtitle}>احجز ساعات التدريب مع المدرب</Text>
            </View>
            <Ionicons name="chevron-back" size={24} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/chat')}
          >
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

        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>إجمالي الأدوات المتاحة</Text>
          <View style={styles.statsGrid}>
            {pillars.map((pillar) => (
              <View key={pillar.id} style={styles.statItem}>
                <View style={[styles.statIcon, { backgroundColor: pillar.color }]}>
                  <Ionicons name={pillar.icon as any} size={18} color="#fff" />
                </View>
                <Text style={[styles.statNumber, { color: pillar.color }]}>{pillar.tools.length}</Text>
              </View>
            ))}
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: '#333' }]}>
                <Ionicons name="apps" size={18} color="#fff" />
              </View>
              <Text style={[styles.statNumber, { color: '#333' }]}>
                {pillars.reduce((sum, p) => sum + p.tools.length, 0)}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 32,
    fontFamily: 'Cairo_700Bold',
    color: '#2196F3',
  },
  logoSubtext: {
    fontSize: 14,
    fontFamily: 'Cairo_400Regular',
    color: '#666',
  },
  greeting: {
    fontSize: 24,
    fontFamily: 'Cairo_700Bold',
    color: '#333',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    fontFamily: 'Cairo_400Regular',
    textAlign: 'center',
  },
  pillarsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Cairo_700Bold',
    color: '#333',
    marginBottom: 4,
    textAlign: 'right',
  },
  sectionSubtitle: {
    fontSize: 12,
    fontFamily: 'Cairo_400Regular',
    color: '#666',
    marginBottom: 16,
    textAlign: 'right',
  },
  pillarContainer: {
    marginBottom: 12,
  },
  pillarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
  },
  pillarIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
  pillarContent: {
    flex: 1,
  },
  pillarTitle: {
    fontSize: 18,
    fontFamily: 'Cairo_700Bold',
    textAlign: 'right',
  },
  pillarSubtitle: {
    fontSize: 12,
    fontFamily: 'Cairo_400Regular',
    color: '#666',
    textAlign: 'right',
  },
  pillarBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pillarBadgeText: {
    fontSize: 18,
    fontFamily: 'Cairo_700Bold',
  },
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    paddingTop: 8,
    gap: 8,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    marginTop: -8,
  },
  toolCard: {
    width: '31%',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  toolIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  toolTitle: {
    fontSize: 10,
    fontFamily: 'Cairo_700Bold',
    color: '#333',
    textAlign: 'center',
  },
  actionsSection: {
    marginBottom: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
  actionText: {
    flex: 1,
    alignItems: 'flex-end',
  },
  actionTitle: {
    fontSize: 16,
    fontFamily: 'Cairo_700Bold',
    color: '#333',
    textAlign: 'right',
  },
  actionSubtitle: {
    fontSize: 12,
    fontFamily: 'Cairo_400Regular',
    color: '#666',
    marginTop: 2,
    textAlign: 'right',
  },
  statsContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
  },
  statsTitle: {
    fontSize: 14,
    fontFamily: 'Cairo_700Bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  statNumber: {
    fontSize: 18,
    fontFamily: 'Cairo_700Bold',
  },
});
