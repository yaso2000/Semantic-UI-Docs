import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  
  TextInput,
  Alert} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Cairo_400Regular, Cairo_700Bold } from '@expo-google-fonts/cairo';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, subDays } from 'date-fns';
import { ar } from 'date-fns/locale';

interface GratitudeEntry {
  date: string;
  items: string[];
}

export default function GratitudeJournalScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [item1, setItem1] = useState('');
  const [item2, setItem2] = useState('');
  const [item3, setItem3] = useState('');
  const [todayEntry, setTodayEntry] = useState<GratitudeEntry | null>(null);
  const [weekEntries, setWeekEntries] = useState<GratitudeEntry[]>([]);
  const [saved, setSaved] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  
  const [fontsLoaded] = useFonts({ Cairo_400Regular, Cairo_700Bold });

  useEffect(() => {
    loadGratitudeData();
  }, []);

  const loadGratitudeData = async () => {
    try {
      const data = await AsyncStorage.getItem('gratitude_journal');
      if (data) {
        const entries: GratitudeEntry[] = JSON.parse(data);
        const today = format(new Date(), 'yyyy-MM-dd');
        const todayData = entries.find(e => e.date === today);
        
        if (todayData) {
          setTodayEntry(todayData);
          setItem1(todayData.items[0] || '');
          setItem2(todayData.items[1] || '');
          setItem3(todayData.items[2] || '');
        }
        
        // Get last 7 days
        const sevenDaysAgo = subDays(new Date(), 7);
        const recent = entries.filter(e => new Date(e.date) >= sevenDaysAgo);
        setWeekEntries(recent.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      }
    } catch (error) {
      console.error('Error loading gratitude data:', error);
    }
  };

  const saveGratitude = async () => {
    if (!item1.trim() && !item2.trim() && !item3.trim()) {
      Alert.alert('تنبيه', 'الرجاء كتابة شيء واحد على الأقل تشكر عليه');
      return;
    }

    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const entry: GratitudeEntry = {
        date: today,
        items: [item1.trim(), item2.trim(), item3.trim()].filter(Boolean)};

      const data = await AsyncStorage.getItem('gratitude_journal');
      let entries: GratitudeEntry[] = data ? JSON.parse(data) : [];
      
      // Remove today's entry if exists
      entries = entries.filter(e => e.date !== today);
      entries.push(entry);
      
      await AsyncStorage.setItem('gratitude_journal', JSON.stringify(entries));
      setTodayEntry(entry);
      setSaved(true);
      
      // Refresh entries
      const sevenDaysAgo = subDays(new Date(), 7);
      const recent = entries.filter(e => new Date(e.date) >= sevenDaysAgo);
      setWeekEntries(recent.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Error saving gratitude:', error);
      Alert.alert('خطأ', 'فشل في الحفظ');
    }
  };

  const getTotalGratitudes = () => {
    return weekEntries.reduce((sum, entry) => sum + entry.items.length, 0);
  };

  if (!fontsLoaded) return null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.navigationHeader}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>دفتر الامتنان</Text>
        <TouchableOpacity onPress={() => setShowHistory(!showHistory)}>
          <Ionicons name={showHistory ? 'create' : 'time'} size={24} color="#FF9800" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.emoji}>🙏</Text>
          <Text style={styles.title}>دفتر الامتنان اليومي</Text>
          <Text style={styles.date}>
            {format(new Date(), 'EEEE، d MMMM yyyy', { locale: ar })}
          </Text>
        </View>

        {!showHistory ? (
          <>
            <View style={styles.quoteBox}>
              <Text style={styles.quote}>
                "الامتنان يحول ما لدينا إلى كفاية، وأكثر. يحول الإنكار إلى قبول، والفوضى إلى نظام."
              </Text>
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.sectionTitle}>اليوم أنا ممتن لـ...</Text>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputNumber}>1</Text>
                <TextInput
                  style={styles.input}
                  placeholder="شيء أشكر الله عليه..."
                  value={item1}
                  onChangeText={setItem1}
                  placeholderTextColor="#999"
                  multiline
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputNumber}>2</Text>
                <TextInput
                  style={styles.input}
                  placeholder="نعمة أخرى..."
                  value={item2}
                  onChangeText={setItem2}
                  placeholderTextColor="#999"
                  multiline
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputNumber}>3</Text>
                <TextInput
                  style={styles.input}
                  placeholder="شيء ثالث..."
                  value={item3}
                  onChangeText={setItem3}
                  placeholderTextColor="#999"
                  multiline
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.saveButton, saved && styles.saveButtonSaved]}
              onPress={saveGratitude}
              disabled={saved}
            >
              <Ionicons name={saved ? 'checkmark-circle' : 'heart'} size={24} color="#fff" />
              <Text style={styles.saveButtonText}>
                {saved ? 'تم الحفظ!' : (todayEntry ? 'تحديث الامتنان' : 'حفظ الامتنان')}
              </Text>
            </TouchableOpacity>

            {weekEntries.length > 0 && (
              <View style={styles.statsBox}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{weekEntries.length}</Text>
                  <Text style={styles.statLabel}>أيام متتالية</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{getTotalGratitudes()}</Text>
                  <Text style={styles.statLabel}>نعمة هذا الأسبوع</Text>
                </View>
              </View>
            )}
          </>
        ) : (
          <View style={styles.historySection}>
            <Text style={styles.sectionTitle}>سجل الامتنان</Text>
            
            {weekEntries.length === 0 ? (
              <View style={styles.emptyHistory}>
                <Ionicons name="book-outline" size={60} color="#ccc" />
                <Text style={styles.emptyText}>لا توجد سجلات بعد</Text>
                <Text style={styles.emptySubtext}>ابدأ بكتابة ما تشكر عليه اليوم</Text>
              </View>
            ) : (
              weekEntries.map((entry, index) => (
                <View key={index} style={styles.historyCard}>
                  <View style={styles.historyHeader}>
                    <Ionicons name="calendar" size={18} color="#FF9800" />
                    <Text style={styles.historyDate}>
                      {format(new Date(entry.date), 'EEEE، d MMMM', { locale: ar })}
                    </Text>
                  </View>
                  {entry.items.map((item, i) => (
                    <View key={i} style={styles.historyItem}>
                      <Text style={styles.historyBullet}>💛</Text>
                      <Text style={styles.historyText}>{item}</Text>
                    </View>
                  ))}
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8E1' },
  navigationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'},
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center'},
  navTitle: { fontSize: 18, fontFamily: 'Cairo_700Bold', color: '#333' },
  content: { padding: 20 },
  header: { alignItems: 'center', marginBottom: 20 },
  emoji: { fontSize: 50 },
  title: { fontSize: 24, fontFamily: 'Cairo_700Bold', color: '#333', marginTop: 8 },
  date: { fontSize: 14, fontFamily: 'Cairo_400Regular', color: '#666', marginTop: 4 },
  quoteBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderRightWidth: 4,
    borderRightColor: '#FF9800'},
  quote: { fontSize: 14, fontFamily: 'Cairo_400Regular', color: '#666', lineHeight: 24, textAlign: 'right' },
  inputSection: { marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontFamily: 'Cairo_700Bold', color: '#333', marginBottom: 16, textAlign: 'right' },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12},
  inputNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FF9800',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 30,
    fontFamily: 'Cairo_700Bold',
    marginLeft: 12},
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Cairo_400Regular',
    color: '#333',
    textAlign: 'right',
    minHeight: 40},
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF9800',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 20},
  saveButtonSaved: { backgroundColor: '#4CAF50' },
  saveButtonText: { fontSize: 18, fontFamily: 'Cairo_700Bold', color: '#fff' },
  statsBox: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'space-around'},
  statItem: { alignItems: 'center' },
  statNumber: { fontSize: 32, fontFamily: 'Cairo_700Bold', color: '#FF9800' },
  statLabel: { fontSize: 12, fontFamily: 'Cairo_400Regular', color: '#666', marginTop: 4 },
  statDivider: { width: 1, height: 40, backgroundColor: '#e0e0e0' },
  historySection: { marginTop: 10 },
  historyCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12},
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 12},
  historyDate: { fontSize: 14, fontFamily: 'Cairo_700Bold', color: '#333' },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8},
  historyBullet: { fontSize: 14 },
  historyText: { flex: 1, fontSize: 14, fontFamily: 'Cairo_400Regular', color: '#666', textAlign: 'right' },
  emptyHistory: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 18, fontFamily: 'Cairo_700Bold', color: '#999', marginTop: 16 },
  emptySubtext: { fontSize: 14, fontFamily: 'Cairo_400Regular', color: '#bbb', marginTop: 8 }});