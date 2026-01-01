import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Cairo_400Regular, Cairo_700Bold } from '@expo-google-fonts/cairo';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const moods = [
  { icon: 'happy', label: 'سعيد جداً', color: '#4CAF50', value: 5 },
  { icon: 'happy-outline', label: 'سعيد', color: '#8BC34A', value: 4 },
  { icon: 'remove-circle-outline', label: 'عادي', color: '#FF9800', value: 3 },
  { icon: 'sad-outline', label: 'حزين', color: '#FF5722', value: 2 },
  { icon: 'sad', label: 'حزين جداً', color: '#F44336', value: 1 },
];

interface MoodEntry {
  date: string;
  mood: number;
  intensity: number;
  note?: string;
}

export default function MoodTrackerScreen() {
  const router = useRouter();
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [intensity, setIntensity] = useState(5);
  const [todayEntry, setTodayEntry] = useState<MoodEntry | null>(null);
  const [weekHistory, setWeekHistory] = useState<MoodEntry[]>([]);
  const [saved, setSaved] = useState(false);
  
  const [fontsLoaded] = useFonts({ Cairo_400Regular, Cairo_700Bold });

  useEffect(() => {
    loadMoodData();
  }, []);

  const loadMoodData = async () => {
    try {
      const data = await AsyncStorage.getItem('mood_history');
      if (data) {
        const history: MoodEntry[] = JSON.parse(data);
        const today = format(new Date(), 'yyyy-MM-dd');
        const todayData = history.find(e => e.date === today);
        if (todayData) {
          setTodayEntry(todayData);
          setSelectedMood(todayData.mood);
          setIntensity(todayData.intensity);
        }
        
        // Get last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recent = history.filter(e => new Date(e.date) >= sevenDaysAgo);
        setWeekHistory(recent.slice(-7));
      }
    } catch (error) {
      console.error('Error loading mood data:', error);
    }
  };

  const saveMood = async () => {
    if (selectedMood === null) {
      Alert.alert('تنبيه', 'الرجاء اختيار حالتك المزاجية');
      return;
    }

    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const entry: MoodEntry = {
        date: today,
        mood: selectedMood,
        intensity,
      };

      const data = await AsyncStorage.getItem('mood_history');
      let history: MoodEntry[] = data ? JSON.parse(data) : [];
      
      // Remove today's entry if exists
      history = history.filter(e => e.date !== today);
      history.push(entry);
      
      await AsyncStorage.setItem('mood_history', JSON.stringify(history));
      setTodayEntry(entry);
      setSaved(true);
      
      // Refresh week history
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recent = history.filter(e => new Date(e.date) >= sevenDaysAgo);
      setWeekHistory(recent.slice(-7));
      
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Error saving mood:', error);
      Alert.alert('خطأ', 'فشل في حفظ المزاج');
    }
  };

  const getMoodInfo = (value: number) => moods.find(m => m.value === value);

  const getAverageMood = () => {
    if (weekHistory.length === 0) return null;
    const sum = weekHistory.reduce((a, b) => a + b.mood, 0);
    return (sum / weekHistory.length).toFixed(1);
  };

  if (!fontsLoaded) return null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navigationHeader}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>متتبع المزاج اليومي</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.disclaimer}>
          <Ionicons name="information-circle" size={20} color="#FF9800" />
          <Text style={styles.disclaimerText}>
            هذه النتائج للوعي الذاتي وأغراض التدريب فقط ولا تشكل تشخيصاً طبياً
          </Text>
        </View>

        <View style={styles.header}>
          <Ionicons name="calendar" size={50} color="#00BCD4" />
          <Text style={styles.title}>كيف حالك اليوم؟</Text>
          <Text style={styles.date}>
            {format(new Date(), 'EEEE، d MMMM yyyy', { locale: ar })}
          </Text>
        </View>

        <View style={styles.moodSection}>
          <Text style={styles.sectionTitle}>اختر حالتك المزاجية</Text>
          <View style={styles.moodGrid}>
            {moods.map((mood) => (
              <TouchableOpacity
                key={mood.value}
                style={[
                  styles.moodButton,
                  selectedMood === mood.value && { backgroundColor: mood.color + '20', borderColor: mood.color },
                ]}
                onPress={() => setSelectedMood(mood.value)}
              >
                <Ionicons
                  name={mood.icon as any}
                  size={40}
                  color={selectedMood === mood.value ? mood.color : '#666'}
                />
                <Text style={[
                  styles.moodLabel,
                  selectedMood === mood.value && { color: mood.color, fontFamily: 'Cairo_700Bold' },
                ]}>
                  {mood.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.intensitySection}>
          <Text style={styles.sectionTitle}>شدة الشعور: {intensity}/10</Text>
          <View style={styles.intensityBar}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
              <TouchableOpacity
                key={num}
                style={[
                  styles.intensityDot,
                  intensity >= num && styles.intensityDotActive,
                ]}
                onPress={() => setIntensity(num)}
              >
                <Text style={[
                  styles.intensityNumber,
                  intensity >= num && styles.intensityNumberActive,
                ]}>
                  {num}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, saved && styles.saveButtonSaved]}
          onPress={saveMood}
          disabled={saved}
        >
          <Ionicons name={saved ? 'checkmark-circle' : 'save'} size={24} color="#fff" />
          <Text style={styles.saveButtonText}>
            {saved ? 'تم الحفظ!' : (todayEntry ? 'تحديث المزاج' : 'حفظ المزاج')}
          </Text>
        </TouchableOpacity>

        {weekHistory.length > 0 && (
          <View style={styles.historySection}>
            <Text style={styles.sectionTitle}>سجل الأسبوع الماضي</Text>
            <View style={styles.historyGrid}>
              {weekHistory.map((entry, index) => {
                const moodInfo = getMoodInfo(entry.mood);
                return (
                  <View key={index} style={styles.historyItem}>
                    <Text style={styles.historyDay}>
                      {format(new Date(entry.date), 'EEE', { locale: ar })}
                    </Text>
                    <View style={[styles.historyMood, { backgroundColor: moodInfo?.color + '20' }]}>
                      <Ionicons
                        name={moodInfo?.icon as any}
                        size={24}
                        color={moodInfo?.color}
                      />
                    </View>
                    <Text style={styles.historyIntensity}>{entry.intensity}</Text>
                  </View>
                );
              })}
            </View>
            
            <View style={styles.averageBox}>
              <Text style={styles.averageLabel}>متوسط المزاج هذا الأسبوع</Text>
              <View style={styles.averageValue}>
                <Text style={styles.averageNumber}>{getAverageMood()}</Text>
                <Text style={styles.averageMax}>/5</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  navigationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navTitle: { fontSize: 18, fontFamily: 'Cairo_700Bold', color: '#333' },
  content: { padding: 20 },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
  },
  disclaimerText: { flex: 1, fontSize: 12, fontFamily: 'Cairo_400Regular', color: '#F57C00', textAlign: 'right' },
  header: { alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 24, fontFamily: 'Cairo_700Bold', color: '#333', marginTop: 12 },
  date: { fontSize: 16, fontFamily: 'Cairo_400Regular', color: '#666', marginTop: 4 },
  moodSection: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontFamily: 'Cairo_700Bold', color: '#333', marginBottom: 16, textAlign: 'right' },
  moodGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', gap: 12 },
  moodButton: {
    width: '30%',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  moodLabel: { fontSize: 12, fontFamily: 'Cairo_400Regular', color: '#666', marginTop: 8, textAlign: 'center' },
  intensitySection: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 20 },
  intensityBar: { flexDirection: 'row', justifyContent: 'space-between' },
  intensityDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  intensityDotActive: { backgroundColor: '#00BCD4' },
  intensityNumber: { fontSize: 12, fontFamily: 'Cairo_700Bold', color: '#666' },
  intensityNumberActive: { color: '#fff' },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00BCD4',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 20,
  },
  saveButtonSaved: { backgroundColor: '#4CAF50' },
  saveButtonText: { fontSize: 18, fontFamily: 'Cairo_700Bold', color: '#fff' },
  historySection: { backgroundColor: '#fff', borderRadius: 16, padding: 20 },
  historyGrid: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
  historyItem: { alignItems: 'center' },
  historyDay: { fontSize: 12, fontFamily: 'Cairo_400Regular', color: '#666', marginBottom: 8 },
  historyMood: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  historyIntensity: { fontSize: 12, fontFamily: 'Cairo_700Bold', color: '#333' },
  averageBox: {
    backgroundColor: '#E0F7FA',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  averageLabel: { fontSize: 14, fontFamily: 'Cairo_400Regular', color: '#00838F', marginBottom: 8 },
  averageValue: { flexDirection: 'row', alignItems: 'baseline' },
  averageNumber: { fontSize: 36, fontFamily: 'Cairo_700Bold', color: '#00BCD4' },
  averageMax: { fontSize: 18, fontFamily: 'Cairo_400Regular', color: '#00838F' },
});