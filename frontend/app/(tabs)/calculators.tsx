import React from 'react';
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

const calculators = [
  {
    id: 'bmi',
    title: 'حاسبة مؤشر كتلة الجسم',
    subtitle: 'BMI Calculator',
    icon: 'body',
    color: '#4CAF50',
    bg: '#E8F5E9',
    route: '/calculators/bmi',
  },
  {
    id: 'bodyfat',
    title: 'حاسبة نسبة الدهون',
    subtitle: 'Body Fat %',
    icon: 'analytics',
    color: '#FF9800',
    bg: '#FFF3E0',
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
    title: 'حاسبة السعرات اليومية',
    subtitle: 'TDEE Calculator',
    icon: 'flame',
    color: '#F44336',
    bg: '#FFEBEE',
    route: '/calculators/tdee',
  },
  {
    id: 'calorie-goal',
    title: 'العجز/الفائض الحراري',
    subtitle: 'Calorie Deficit/Surplus',
    icon: 'trending-down',
    color: '#00BCD4',
    bg: '#E0F7FA',
    route: '/calculators/calorie-goal',
  },
  {
    id: 'macros',
    title: 'حاسبة المغذيات الكبرى',
    subtitle: 'Macros Calculator',
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
  {
    id: 'calories-burned',
    title: 'السعرات المحروقة',
    subtitle: 'Calories Burned',
    icon: 'barbell',
    color: '#FF5722',
    bg: '#FBE9E7',
    route: '/calculators/calories-burned',
  },
  {
    id: 'one-rep-max',
    title: 'الحد الأقصى للتكرار',
    subtitle: '1RM Calculator',
    icon: 'podium',
    color: '#673AB7',
    bg: '#EDE7F6',
    route: '/calculators/one-rep-max',
  },
  {
    id: 'heart-rate',
    title: 'معدل نبض القلب المستهدف',
    subtitle: 'Target Heart Rate',
    icon: 'heart',
    color: '#E91E63',
    bg: '#FCE4EC',
    route: '/calculators/heart-rate',
  },
];

const mentalTools = [
  {
    id: 'pss10',
    title: 'مقياس التوتر المُدرَك',
    subtitle: 'PSS-10',
    icon: 'brain',
    color: '#9C27B0',
    bg: '#F3E5F5',
    route: '/calculators/pss10',
  },
  {
    id: 'gad7',
    title: 'مقياس القلق العام',
    subtitle: 'GAD-7',
    icon: 'pulse',
    color: '#E91E63',
    bg: '#FCE4EC',
    route: '/calculators/gad7',
  },
  {
    id: 'swls',
    title: 'مقياس الرضا عن الحياة',
    subtitle: 'SWLS',
    icon: 'happy',
    color: '#FF9800',
    bg: '#FFF3E0',
    route: '/calculators/swls',
  },
  {
    id: 'who5',
    title: 'مؤشر الرفاهية WHO-5',
    subtitle: 'Well-Being Index',
    icon: 'sunny',
    color: '#2196F3',
    bg: '#E3F2FD',
    route: '/calculators/who5',
  },
  {
    id: 'mood-tracker',
    title: 'متتبع المزاج اليومي',
    subtitle: 'Daily Mood Tracker',
    icon: 'calendar',
    color: '#00BCD4',
    bg: '#E0F7FA',
    route: '/calculators/mood-tracker',
  },
];

export default function CalculatorsScreen() {
  const router = useRouter();
  
  const [fontsLoaded] = useFonts({
    Cairo_400Regular,
    Cairo_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>الحاسبات الصحية</Text>
        <Text style={styles.headerSubtitle}>أدوات متخصصة لصحتك</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏋️ الجسم والصحة</Text>
          <View style={styles.grid}>
            {calculators.slice(0, 4).map((calc) => (
              <TouchableOpacity
                key={calc.id}
                style={[styles.card, { backgroundColor: calc.bg }]}
                onPress={() => router.push(calc.route as any)}
              >
                <Ionicons name={calc.icon as any} size={32} color={calc.color} />
                <Text style={styles.cardTitle}>{calc.title}</Text>
                <Text style={styles.cardSubtitle}>{calc.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🍎 التغذية</Text>
          <View style={styles.grid}>
            {calculators.slice(4, 8).map((calc) => (
              <TouchableOpacity
                key={calc.id}
                style={[styles.card, { backgroundColor: calc.bg }]}
                onPress={() => router.push(calc.route as any)}
              >
                <Ionicons name={calc.icon as any} size={32} color={calc.color} />
                <Text style={styles.cardTitle}>{calc.title}</Text>
                <Text style={styles.cardSubtitle}>{calc.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💪 التمارين واللياقة</Text>
          <View style={styles.grid}>
            {calculators.slice(8, 11).map((calc) => (
              <TouchableOpacity
                key={calc.id}
                style={[styles.card, { backgroundColor: calc.bg }]}
                onPress={() => router.push(calc.route as any)}
              >
                <Ionicons name={calc.icon as any} size={32} color={calc.color} />
                <Text style={styles.cardTitle}>{calc.title}</Text>
                <Text style={styles.cardSubtitle}>{calc.subtitle}</Text>
              </TouchableOpacity>
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
    marginTop: 4,
    textAlign: 'right',
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Cairo_700Bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'right',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    width: '48%',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 14,
    fontFamily: 'Cairo_700Bold',
    color: '#333',
    marginTop: 12,
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: 11,
    fontFamily: 'Cairo_400Regular',
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
});