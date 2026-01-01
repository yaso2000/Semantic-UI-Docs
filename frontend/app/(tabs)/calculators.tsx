import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Cairo_400Regular, Cairo_700Bold } from '@expo-google-fonts/cairo';

// الركيزة الأولى: اللياقة البدنية
const physicalTools = [
  {
    id: 'bmi',
    title: 'مؤشر كتلة الجسم',
    subtitle: 'BMI',
    icon: 'body',
    color: '#4CAF50',
    bg: '#E8F5E9',
    route: '/calculators/bmi',
  },
  {
    id: 'bodyfat',
    title: 'نسبة الدهون',
    subtitle: 'Body Fat %',
    icon: 'analytics',
    color: '#FF5722',
    bg: '#FBE9E7',
    route: '/calculators/bodyfat',
  },
  {
    id: 'ideal-weight',
    title: 'الوزن المثالي',
    subtitle: 'Ideal Weight',
    icon: 'fitness',
    color: '#2196F3',
    bg: '#E3F2FD',
    route: '/calculators/ideal-weight',
  },
  {
    id: 'waist-height',
    title: 'نسبة الخصر للطول',
    subtitle: 'Waist-to-Height',
    icon: 'resize',
    color: '#9C27B0',
    bg: '#F3E5F5',
    route: '/calculators/waist-height',
  },
  {
    id: 'tdee',
    title: 'السعرات اليومية',
    subtitle: 'TDEE',
    icon: 'flame',
    color: '#F44336',
    bg: '#FFEBEE',
    route: '/calculators/tdee',
  },
  {
    id: 'calories-burned',
    title: 'السعرات المحروقة',
    subtitle: 'Calories Burned',
    icon: 'barbell',
    color: '#FF9800',
    bg: '#FFF3E0',
    route: '/calculators/calories-burned',
  },
  {
    id: 'one-rep-max',
    title: 'الحد الأقصى للتكرار',
    subtitle: '1RM',
    icon: 'podium',
    color: '#673AB7',
    bg: '#EDE7F6',
    route: '/calculators/one-rep-max',
  },
  {
    id: 'heart-rate',
    title: 'نبض القلب المستهدف',
    subtitle: 'Target HR',
    icon: 'heart',
    color: '#E91E63',
    bg: '#FCE4EC',
    route: '/calculators/heart-rate',
  },
];

// الركيزة الثانية: الصحة التغذوية
const nutritionTools = [
  {
    id: 'calorie-goal',
    title: 'هدف السعرات',
    subtitle: 'Calorie Goal',
    icon: 'trending-down',
    color: '#00BCD4',
    bg: '#E0F7FA',
    route: '/calculators/calorie-goal',
  },
  {
    id: 'macros',
    title: 'المغذيات الكبرى',
    subtitle: 'Macros',
    icon: 'nutrition',
    color: '#795548',
    bg: '#EFEBE9',
    route: '/calculators/macros',
  },
  {
    id: 'water',
    title: 'كمية الماء اليومية',
    subtitle: 'Water Intake',
    icon: 'water',
    color: '#03A9F4',
    bg: '#E1F5FE',
    route: '/calculators/water',
  },
];

// الركيزة الثالثة: الصحة النفسية
const mentalTools = [
  {
    id: 'pss10',
    title: 'مقياس التوتر',
    subtitle: 'PSS-10',
    icon: 'brain',
    color: '#9C27B0',
    bg: '#F3E5F5',
    route: '/calculators/pss10',
  },
  {
    id: 'gad7',
    title: 'مقياس القلق',
    subtitle: 'GAD-7',
    icon: 'pulse',
    color: '#E91E63',
    bg: '#FCE4EC',
    route: '/calculators/gad7',
  },
  {
    id: 'swls',
    title: 'الرضا عن الحياة',
    subtitle: 'SWLS',
    icon: 'happy',
    color: '#FF9800',
    bg: '#FFF3E0',
    route: '/calculators/swls',
  },
  {
    id: 'who5',
    title: 'مؤشر الرفاهية',
    subtitle: 'WHO-5',
    icon: 'sunny',
    color: '#2196F3',
    bg: '#E3F2FD',
    route: '/calculators/who5',
  },
  {
    id: 'mood-tracker',
    title: 'متتبع المزاج',
    subtitle: 'Mood Tracker',
    icon: 'calendar',
    color: '#00BCD4',
    bg: '#E0F7FA',
    route: '/calculators/mood-tracker',
  },
];

// الركيزة الرابعة: الرفاهية الروحية
const spiritualTools = [
  {
    id: 'meditation-timer',
    title: 'مؤقت التأمل',
    subtitle: 'Meditation',
    icon: 'flower',
    color: '#7C4DFF',
    bg: '#EDE7F6',
    route: '/calculators/meditation-timer',
  },
  {
    id: 'breathing-exercise',
    title: 'تمارين التنفس',
    subtitle: 'Breathing',
    icon: 'fitness',
    color: '#2196F3',
    bg: '#E3F2FD',
    route: '/calculators/breathing-exercise',
  },
  {
    id: 'gratitude-journal',
    title: 'دفتر الامتنان',
    subtitle: 'Gratitude',
    icon: 'heart',
    color: '#FF9800',
    bg: '#FFF8E1',
    route: '/calculators/gratitude-journal',
  },
  {
    id: 'core-values',
    title: 'القيم الأساسية',
    subtitle: 'Core Values',
    icon: 'diamond',
    color: '#9C27B0',
    bg: '#F3E5F5',
    route: '/calculators/core-values',
  },
  {
    id: 'reflection-prompts',
    title: 'تأملات عميقة',
    subtitle: 'Reflections',
    icon: 'bulb',
    color: '#00BCD4',
    bg: '#E0F7FA',
    route: '/calculators/reflection-prompts',
  },
  {
    id: 'wheel-of-life',
    title: 'عجلة الحياة',
    subtitle: 'Wheel of Life',
    icon: 'pie-chart',
    color: '#E91E63',
    bg: '#FCE4EC',
    route: '/calculators/wheel-of-life',
  },
];

const pillars = [
  {
    id: 'physical',
    title: 'اللياقة البدنية',
    subtitle: 'Physical Fitness',
    icon: 'barbell',
    color: '#4CAF50',
    gradient: ['#4CAF50', '#8BC34A'],
    tools: physicalTools,
  },
  {
    id: 'nutrition',
    title: 'الصحة التغذوية',
    subtitle: 'Nutritional Health',
    icon: 'nutrition',
    color: '#FF9800',
    gradient: ['#FF9800', '#FFC107'],
    tools: nutritionTools,
  },
  {
    id: 'mental',
    title: 'الصحة النفسية',
    subtitle: 'Mental Wellness',
    icon: 'brain',
    color: '#9C27B0',
    gradient: ['#9C27B0', '#E040FB'],
    tools: mentalTools,
  },
  {
    id: 'spiritual',
    title: 'الرفاهية الروحية',
    subtitle: 'Spiritual Well-being',
    icon: 'heart',
    color: '#2196F3',
    gradient: ['#2196F3', '#00BCD4'],
    tools: spiritualTools,
  },
];

export default function CalculatorsScreen() {
  const router = useRouter();
  const [expandedPillar, setExpandedPillar] = useState<string | null>(null);
  
  const [fontsLoaded] = useFonts({
    Cairo_400Regular,
    Cairo_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  const togglePillar = (pillarId: string) => {
    setExpandedPillar(expandedPillar === pillarId ? null : pillarId);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>الأدوات والحاسبات</Text>
        <Text style={styles.headerSubtitle}>موزعة على الركائز الأربع</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {pillars.map((pillar) => (
          <View key={pillar.id} style={styles.pillarContainer}>
            <TouchableOpacity
              style={[styles.pillarHeader, { backgroundColor: pillar.color }]}
              onPress={() => togglePillar(pillar.id)}
              activeOpacity={0.8}
            >
              <View style={styles.pillarHeaderContent}>
                <View style={styles.pillarIconContainer}>
                  <Ionicons name={pillar.icon as any} size={32} color="#fff" />
                </View>
                <View style={styles.pillarTitles}>
                  <Text style={styles.pillarTitle}>{pillar.title}</Text>
                  <Text style={styles.pillarSubtitle}>{pillar.subtitle}</Text>
                </View>
              </View>
              <View style={styles.pillarBadge}>
                <Text style={styles.pillarBadgeText}>{pillar.tools.length}</Text>
                <Ionicons
                  name={expandedPillar === pillar.id ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#fff"
                />
              </View>
            </TouchableOpacity>

            {expandedPillar === pillar.id && (
              <View style={styles.toolsGrid}>
                {pillar.tools.map((tool) => (
                  <TouchableOpacity
                    key={tool.id}
                    style={[styles.toolCard, { backgroundColor: tool.bg }]}
                    onPress={() => router.push(tool.route as any)}
                  >
                    <View style={[styles.toolIconBg, { backgroundColor: tool.color + '20' }]}>
                      <Ionicons name={tool.icon as any} size={28} color={tool.color} />
                    </View>
                    <Text style={styles.toolTitle}>{tool.title}</Text>
                    <Text style={styles.toolSubtitle}>{tool.subtitle}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        ))}

        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>إجمالي الأدوات</Text>
          <View style={styles.statsGrid}>
            {pillars.map((pillar) => (
              <View key={pillar.id} style={styles.statItem}>
                <View style={[styles.statIcon, { backgroundColor: pillar.color }]}>
                  <Ionicons name={pillar.icon as any} size={20} color="#fff" />
                </View>
                <Text style={styles.statNumber}>{pillar.tools.length}</Text>
                <Text style={styles.statLabel}>{pillar.title.split(' ')[0]}</Text>
              </View>
            ))}
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
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Cairo_700Bold',
    color: '#333',
    textAlign: 'right',
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Cairo_400Regular',
    color: '#666',
    textAlign: 'right',
    marginTop: 4,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  pillarContainer: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  pillarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  pillarHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  pillarIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
  pillarTitles: {
    flex: 1,
  },
  pillarTitle: {
    fontSize: 18,
    fontFamily: 'Cairo_700Bold',
    color: '#fff',
    textAlign: 'right',
  },
  pillarSubtitle: {
    fontSize: 12,
    fontFamily: 'Cairo_400Regular',
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'right',
  },
  pillarBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pillarBadgeText: {
    fontSize: 18,
    fontFamily: 'Cairo_700Bold',
    color: '#fff',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 10,
  },
  toolCard: {
    width: '31%',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  toolIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  toolTitle: {
    fontSize: 11,
    fontFamily: 'Cairo_700Bold',
    color: '#333',
    textAlign: 'center',
  },
  toolSubtitle: {
    fontSize: 9,
    fontFamily: 'Cairo_400Regular',
    color: '#666',
    textAlign: 'center',
    marginTop: 2,
  },
  statsContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
  },
  statsTitle: {
    fontSize: 16,
    fontFamily: 'Cairo_700Bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
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
    fontFamily: 'Cairo_700Bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 10,
    fontFamily: 'Cairo_400Regular',
    color: '#666',
  },
});
