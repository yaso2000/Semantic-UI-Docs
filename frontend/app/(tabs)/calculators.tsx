import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Alexandria_400Regular, Alexandria_600SemiBold, Alexandria_700Bold } from '@expo-google-fonts/alexandria';
import { COLORS, FONTS, SHADOWS, RADIUS, SPACING } from '../../src/constants/theme';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface Tool {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  route: string;
  isCustom?: boolean;
}

const physicalTools: Tool[] = [
  { id: 'bmi', title: 'مؤشر كتلة الجسم', subtitle: 'BMI', icon: 'body', route: '/calculators/bmi' },
  { id: 'bodyfat', title: 'نسبة الدهون', subtitle: 'Body Fat %', icon: 'analytics', route: '/calculators/bodyfat' },
  { id: 'ideal-weight', title: 'الوزن المثالي', subtitle: 'Ideal Weight', icon: 'fitness', route: '/calculators/ideal-weight' },
  { id: 'waist-height', title: 'نسبة الخصر للطول', subtitle: 'Waist-to-Height', icon: 'resize', route: '/calculators/waist-height' },
  { id: 'tdee', title: 'السعرات اليومية', subtitle: 'TDEE', icon: 'flame', route: '/calculators/tdee' },
  { id: 'calories-burned', title: 'السعرات المحروقة', subtitle: 'Calories Burned', icon: 'barbell', route: '/calculators/calories-burned' },
  { id: 'one-rep-max', title: 'الحد الأقصى للتكرار', subtitle: '1RM', icon: 'podium', route: '/calculators/one-rep-max' },
  { id: 'heart-rate', title: 'نبض القلب المستهدف', subtitle: 'Target HR', icon: 'heart', route: '/calculators/heart-rate' },
];

const nutritionTools: Tool[] = [
  { id: 'calorie-goal', title: 'هدف السعرات', subtitle: 'Calorie Goal', icon: 'trending-down', route: '/calculators/calorie-goal' },
  { id: 'macros', title: 'المغذيات الكبرى', subtitle: 'Macros', icon: 'nutrition', route: '/calculators/macros' },
  { id: 'water', title: 'كمية الماء اليومية', subtitle: 'Water Intake', icon: 'water', route: '/calculators/water' },
];

const mentalTools: Tool[] = [
  { id: 'pss10', title: 'مقياس التوتر', subtitle: 'PSS-10', icon: 'flash', route: '/calculators/pss10' },
  { id: 'gad7', title: 'مقياس القلق', subtitle: 'GAD-7', icon: 'pulse', route: '/calculators/gad7' },
  { id: 'swls', title: 'الرضا عن الحياة', subtitle: 'SWLS', icon: 'happy', route: '/calculators/swls' },
  { id: 'who5', title: 'مؤشر الرفاهية', subtitle: 'WHO-5', icon: 'sunny', route: '/calculators/who5' },
  { id: 'mood-tracker', title: 'متتبع المزاج', subtitle: 'Mood Tracker', icon: 'calendar', route: '/calculators/mood-tracker' },
];

const spiritualTools: Tool[] = [
  { id: 'meditation-timer', title: 'مؤقت التأمل', subtitle: 'Meditation', icon: 'flower', route: '/calculators/meditation-timer' },
  { id: 'breathing-exercise', title: 'تمارين التنفس', subtitle: 'Breathing', icon: 'fitness', route: '/calculators/breathing-exercise' },
  { id: 'gratitude-journal', title: 'دفتر الامتنان', subtitle: 'Gratitude', icon: 'heart', route: '/calculators/gratitude-journal' },
  { id: 'core-values', title: 'القيم الأساسية', subtitle: 'Core Values', icon: 'diamond', route: '/calculators/core-values' },
  { id: 'reflection-prompts', title: 'تأملات عميقة', subtitle: 'Reflections', icon: 'bulb', route: '/calculators/reflection-prompts' },
  { id: 'wheel-of-life', title: 'عجلة الحياة', subtitle: 'Wheel of Life', icon: 'pie-chart', route: '/calculators/wheel-of-life' },
];

interface CustomCalculator {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  is_active: boolean;
}

export default function CalculatorsScreen() {
  const router = useRouter();
  const [expandedPillar, setExpandedPillar] = useState<string | null>(null);
  const [customCalculators, setCustomCalculators] = useState<CustomCalculator[]>([]);
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();
  
  const [fontsLoaded] = useFonts({
    Alexandria_400Regular,
    Alexandria_600SemiBold,
    Alexandria_700Bold,
  });

  // جلب الحاسبات المخصصة من API
  useEffect(() => {
    loadCustomCalculators();
  }, []);

  const loadCustomCalculators = async () => {
    try {
      const response = await fetch(`${API_URL}/api/custom-calculators`);
      if (response.ok) {
        const data = await response.json();
        setCustomCalculators(data.filter((c: CustomCalculator) => c.is_active));
      }
    } catch (error) {
      console.error('Error loading custom calculators:', error);
    } finally {
      setLoading(false);
    }
  };

  // تحويل الحاسبات المخصصة إلى أدوات
  const getCustomToolsByCategory = (category: string): Tool[] => {
    const categoryMapping: { [key: string]: string } = {
      'physical': 'physical',
      'nutritional': 'nutrition',
      'mental': 'mental',
      'spiritual': 'spiritual',
    };
    
    return customCalculators
      .filter(calc => {
        // physical category في الحاسبات المخصصة تطابق physical في الركائز
        // nutritional تطابق nutrition
        if (category === 'nutrition') {
          return calc.category === 'nutritional';
        }
        return calc.category === category;
      })
      .map(calc => ({
        id: `custom-${calc.id}`,
        title: calc.title,
        subtitle: calc.description || 'حاسبة مخصصة',
        icon: calc.icon || 'calculator',
        route: `/custom-calculator/${calc.id}`,
        isCustom: true,
      }));
  };

  // دمج الأدوات الثابتة مع المخصصة
  const getPillarTools = (pillarId: string, staticTools: Tool[]): Tool[] => {
    const customTools = getCustomToolsByCategory(pillarId);
    return [...staticTools, ...customTools];
  };

  const pillars = [
    { id: 'physical', title: 'اللياقة البدنية', subtitle: 'Physical Fitness', icon: 'barbell', color: COLORS.teal, staticTools: physicalTools },
    { id: 'nutrition', title: 'الصحة التغذوية', subtitle: 'Nutritional Health', icon: 'nutrition', color: COLORS.sage, staticTools: nutritionTools },
    { id: 'mental', title: 'الصحة النفسية', subtitle: 'Mental Wellness', icon: 'happy', color: COLORS.gold, staticTools: mentalTools },
    { id: 'spiritual', title: 'الرفاهية الروحية', subtitle: 'Spiritual Well-being', icon: 'sparkles', color: COLORS.spiritual, staticTools: spiritualTools },
  ];

  if (!fontsLoaded) {
    return null;
  }

  const togglePillar = (pillarId: string) => {
    setExpandedPillar(expandedPillar === pillarId ? null : pillarId);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>الأدوات والحاسبات</Text>
        <Text style={styles.headerSubtitle}>موزعة على الركائز الأربع</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {pillars.map((pillar) => (
          <View key={pillar.id} style={styles.pillarContainer}>
            <TouchableOpacity
              style={styles.pillarHeader}
              onPress={() => togglePillar(pillar.id)}
              activeOpacity={0.8}
            >
              <View style={styles.pillarHeaderContent}>
                <View style={[styles.pillarIconContainer, { backgroundColor: pillar.color }]}>
                  <Ionicons name={pillar.icon as any} size={28} color={COLORS.white} />
                </View>
                <View style={styles.pillarTitles}>
                  <Text style={styles.pillarTitle}>{pillar.title}</Text>
                  <Text style={styles.pillarSubtitle}>{pillar.subtitle}</Text>
                </View>
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
                    <View style={[styles.toolIconBg, { backgroundColor: `${pillar.color}20` }]}>
                      <Ionicons name={tool.icon as any} size={24} color={pillar.color} />
                    </View>
                    <Text style={styles.toolTitle}>{tool.title}</Text>
                    <Text style={styles.toolSubtitle}>{tool.subtitle}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        ))}

        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>إجمالي الأدوات</Text>
          <View style={styles.statsGrid}>
            {pillars.map((pillar) => (
              <View key={pillar.id} style={styles.statItem}>
                <View style={[styles.statIcon, { backgroundColor: pillar.color }]}>
                  <Ionicons name={pillar.icon as any} size={18} color={COLORS.white} />
                </View>
                <Text style={[styles.statNumber, { color: pillar.color }]}>{pillar.tools.length}</Text>
                <Text style={styles.statLabel}>{pillar.title.split(' ')[0]}</Text>
              </View>
            ))}
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
  header: {
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    color: COLORS.teal,
    textAlign: 'right',
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'right',
    marginTop: 4,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 100,
  },
  pillarContainer: {
    marginBottom: SPACING.md,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    backgroundColor: COLORS.white,
    ...SHADOWS.md,
  },
  pillarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    backgroundColor: COLORS.white,
  },
  pillarHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  pillarIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 14,
  },
  pillarTitles: {
    flex: 1,
  },
  pillarTitle: {
    fontSize: 17,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    textAlign: 'right',
  },
  pillarSubtitle: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'right',
  },
  pillarBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pillarBadgeText: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    backgroundColor: COLORS.beige,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: SPACING.sm,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.beige,
  },
  toolCard: {
    width: '31%',
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    backgroundColor: COLORS.white,
    ...SHADOWS.sm,
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
    fontSize: 11,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
    textAlign: 'center',
  },
  toolSubtitle: {
    fontSize: 9,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
  statsContainer: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginTop: 8,
    ...SHADOWS.md,
  },
  statsTitle: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.teal,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontFamily: FONTS.bold,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
});
