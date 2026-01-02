import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFonts, Cairo_400Regular, Cairo_700Bold } from '@expo-google-fonts/cairo';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface Habit {
  id: string;
  name: string;
  icon: string;
  color: string;
  frequency: 'daily' | 'weekly';
  completedDates: string[];
  createdAt: string;
}

interface HabitStats {
  total_habits: number;
  completed_today: number;
  today_progress: number;
  best_streak: number;
  weekly_rate: number;
}

const HABIT_ICONS = [
  { icon: 'water', color: '#2196F3', name: 'ماء' },
  { icon: 'fitness', color: '#4CAF50', name: 'رياضة' },
  { icon: 'book', color: '#9C27B0', name: 'قراءة' },
  { icon: 'bed', color: '#673AB7', name: 'نوم' },
  { icon: 'walk', color: '#FF9800', name: 'مشي' },
  { icon: 'leaf', color: '#8BC34A', name: 'تأمل' },
  { icon: 'nutrition', color: '#E91E63', name: 'تغذية' },
  { icon: 'happy', color: '#00BCD4', name: 'امتنان' },
  { icon: 'pencil', color: '#FF5722', name: 'كتابة' },
  { icon: 'musical-notes', color: '#3F51B5', name: 'موسيقى' },
];

export default function HabitTrackerScreen() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [stats, setStats] = useState<HabitStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState(HABIT_ICONS[0]);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const [fontsLoaded] = useFonts({ Cairo_400Regular, Cairo_700Bold });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('خطأ', 'يرجى تسجيل الدخول أولاً');
        router.replace('/login');
        return;
      }

      // Load habits
      const habitsRes = await fetch(`${API_URL}/api/habits`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (habitsRes.ok) {
        const habitsData = await habitsRes.json();
        setHabits(habitsData);
      }

      // Load stats
      const statsRes = await fetch(`${API_URL}/api/habits/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error('Error loading habits:', error);
      Alert.alert('خطأ', 'فشل في تحميل العادات');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getTodayString = () => {
    return new Date().toISOString().split('T')[0];
  };

  const isCompletedToday = (habit: Habit) => {
    return habit.completedDates.includes(getTodayString());
  };

  const toggleHabit = async (habitId: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const today = getTodayString();
      
      // Optimistic update
      setHabits(prev => prev.map(h => {
        if (h.id === habitId) {
          if (h.completedDates.includes(today)) {
            return { ...h, completedDates: h.completedDates.filter(d => d !== today) };
          } else {
            return { ...h, completedDates: [...h.completedDates, today] };
          }
        }
        return h;
      }));

      const response = await fetch(`${API_URL}/api/habits/${habitId}/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ date: today })
      });

      if (response.ok) {
        // Reload stats after toggle
        const statsRes = await fetch(`${API_URL}/api/habits/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }
      } else {
        // Revert on error
        loadData();
      }
    } catch (error) {
      console.error('Error toggling habit:', error);
      loadData();
    }
  };

  const addHabit = async () => {
    if (!newHabitName.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال اسم العادة');
      return;
    }

    setSaving(true);
    try {
      const token = await AsyncStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/api/habits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newHabitName,
          icon: selectedIcon.icon,
          color: selectedIcon.color,
          frequency: 'daily'
        })
      });

      if (response.ok) {
        const newHabit = await response.json();
        setHabits(prev => [...prev, newHabit]);
        setNewHabitName('');
        setSelectedIcon(HABIT_ICONS[0]);
        setShowAddModal(false);
        
        // Reload stats
        loadData();
      } else {
        const error = await response.json();
        Alert.alert('خطأ', error.detail || 'فشل في إضافة العادة');
      }
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ في الاتصال');
    } finally {
      setSaving(false);
    }
  };

  const deleteHabit = (habitId: string, habitName: string) => {
    Alert.alert('حذف العادة', `هل أنت متأكد من حذف "${habitName}"؟`, [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('token');
            
            // Optimistic update
            setHabits(prev => prev.filter(h => h.id !== habitId));
            
            const response = await fetch(`${API_URL}/api/habits/${habitId}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
              loadData(); // Revert on error
            } else {
              // Reload stats
              const statsRes = await fetch(`${API_URL}/api/habits/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              if (statsRes.ok) {
                const statsData = await statsRes.json();
                setStats(statsData);
              }
            }
          } catch (error) {
            loadData();
          }
        }
      }
    ]);
  };

  const getStreak = (habit: Habit) => {
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      if (habit.completedDates.includes(dateStr)) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    return streak;
  };

  const getWeekDays = () => {
    const days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      days.push({
        date: date.toISOString().split('T')[0],
        day: ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'][date.getDay()],
        dayNum: date.getDate(),
        isToday: i === 0
      });
    }
    return days;
  };

  const completedToday = habits.filter(h => isCompletedToday(h)).length;
  const totalHabits = habits.length;
  const progressPercent = totalHabits > 0 ? (completedToday / totalHabits) * 100 : 0;

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF9800" />
        <Text style={styles.loadingText}>جاري تحميل عاداتك...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>متتبع العادات</Text>
        <TouchableOpacity style={styles.statsBtn} onPress={onRefresh}>
          <Ionicons name="refresh" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF9800']} />
        }
      >
        {/* Today's Progress */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <View>
              <Text style={styles.progressTitle}>تقدم اليوم</Text>
              <Text style={styles.progressDate}>
                {new Date().toLocaleDateString('ar-SA', { weekday: 'long', day: 'numeric', month: 'long' })}
              </Text>
            </View>
            <View style={styles.progressCircle}>
              <Text style={styles.progressPercent}>{Math.round(progressPercent)}%</Text>
            </View>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {completedToday} من {totalHabits} عادات مكتملة
          </Text>
        </View>

        {/* Stats Cards */}
        {stats && (
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Ionicons name="flame" size={24} color="#FF9800" />
              <Text style={styles.statValue}>{stats.best_streak}</Text>
              <Text style={styles.statLabel}>أفضل سلسلة</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="trending-up" size={24} color="#4CAF50" />
              <Text style={styles.statValue}>{stats.weekly_rate}%</Text>
              <Text style={styles.statLabel}>معدل الأسبوع</Text>
            </View>
          </View>
        )}

        {/* Week View */}
        <View style={styles.weekView}>
          {getWeekDays().map((day, index) => (
            <View key={index} style={[styles.dayColumn, day.isToday && styles.dayColumnToday]}>
              <Text style={[styles.dayLabel, day.isToday && styles.dayLabelToday]}>{day.day}</Text>
              <Text style={[styles.dayNum, day.isToday && styles.dayNumToday]}>{day.dayNum}</Text>
              <View style={styles.dayDots}>
                {habits.slice(0, 4).map((habit, hIndex) => (
                  <View
                    key={hIndex}
                    style={[
                      styles.dayDot,
                      habit.completedDates.includes(day.date) && { backgroundColor: habit.color }
                    ]}
                  />
                ))}
              </View>
            </View>
          ))}
        </View>

        {/* Habits List */}
        <View style={styles.habitsSection}>
          <View style={styles.sectionHeader}>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => setShowAddModal(true)}
            >
              <Ionicons name="add" size={20} color="#FF9800" />
              <Text style={styles.addBtnText}>إضافة</Text>
            </TouchableOpacity>
            <Text style={styles.sectionTitle}>عاداتي اليومية</Text>
          </View>

          {habits.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="leaf-outline" size={64} color="#ddd" />
              <Text style={styles.emptyText}>لم تقم بإضافة أي عادات بعد</Text>
              <Text style={styles.emptySubtext}>ابدأ بإضافة عادة جديدة لتتبع تقدمك</Text>
            </View>
          ) : (
            habits.map((habit) => (
              <TouchableOpacity
                key={habit.id}
                style={styles.habitCard}
                onPress={() => toggleHabit(habit.id)}
                onLongPress={() => deleteHabit(habit.id, habit.name)}
              >
                <View style={[styles.habitIcon, { backgroundColor: habit.color }]}>
                  <Ionicons name={habit.icon as any} size={24} color="#fff" />
                </View>
                <View style={styles.habitInfo}>
                  <Text style={styles.habitName}>{habit.name}</Text>
                  <View style={styles.habitStreak}>
                    <Ionicons name="flame" size={14} color="#FF9800" />
                    <Text style={styles.streakText}>{getStreak(habit)} يوم متتالي</Text>
                  </View>
                </View>
                <View style={[
                  styles.checkBox,
                  isCompletedToday(habit) && { backgroundColor: habit.color, borderColor: habit.color }
                ]}>
                  {isCompletedToday(habit) && (
                    <Ionicons name="checkmark" size={20} color="#fff" />
                  )}
                </View>
              </TouchableOpacity>
            ))
          )}

          {habits.length > 0 && (
            <Text style={styles.tipText}>
              💡 اضغط مطولاً على العادة لحذفها
            </Text>
          )}
        </View>
      </ScrollView>

      {/* Add Habit Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>إضافة عادة جديدة</Text>
            </View>

            <TextInput
              style={styles.habitInput}
              value={newHabitName}
              onChangeText={setNewHabitName}
              placeholder="اسم العادة..."
              placeholderTextColor="#999"
              textAlign="right"
            />

            <Text style={styles.iconsLabel}>اختر أيقونة:</Text>
            <View style={styles.iconsGrid}>
              {HABIT_ICONS.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.iconOption,
                    selectedIcon.icon === item.icon && { borderColor: item.color, borderWidth: 3 }
                  ]}
                  onPress={() => setSelectedIcon(item)}
                >
                  <View style={[styles.iconPreview, { backgroundColor: item.color }]}>
                    <Ionicons name={item.icon as any} size={24} color="#fff" />
                  </View>
                  <Text style={styles.iconName}>{item.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity 
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]} 
              onPress={addHabit}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="add-circle" size={22} color="#fff" />
                  <Text style={styles.saveBtnText}>إضافة العادة</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },
  loadingText: { fontSize: 14, fontFamily: 'Cairo_400Regular', color: '#666', marginTop: 12 },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FF9800',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontFamily: 'Cairo_700Bold',
    color: '#fff',
    textAlign: 'right',
  },
  statsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  content: {
    padding: 16,
    paddingBottom: 40,
  },

  progressCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 18,
    fontFamily: 'Cairo_700Bold',
    color: '#333',
    textAlign: 'right',
  },
  progressDate: {
    fontSize: 13,
    fontFamily: 'Cairo_400Regular',
    color: '#666',
    textAlign: 'right',
    marginTop: 4,
  },
  progressCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressPercent: {
    fontSize: 18,
    fontFamily: 'Cairo_700Bold',
    color: '#FF9800',
  },
  progressBar: {
    height: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF9800',
    borderRadius: 5,
  },
  progressText: {
    fontSize: 14,
    fontFamily: 'Cairo_400Regular',
    color: '#666',
    textAlign: 'center',
    marginTop: 12,
  },

  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'Cairo_700Bold',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Cairo_400Regular',
    color: '#666',
    marginTop: 4,
  },

  weekView: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
  },
  dayColumn: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
  },
  dayColumnToday: {
    backgroundColor: '#FFF3E0',
  },
  dayLabel: {
    fontSize: 10,
    fontFamily: 'Cairo_700Bold',
    color: '#999',
    marginBottom: 4,
  },
  dayLabelToday: {
    color: '#FF9800',
  },
  dayNum: {
    fontSize: 14,
    fontFamily: 'Cairo_700Bold',
    color: '#333',
    marginBottom: 8,
  },
  dayNumToday: {
    color: '#FF9800',
  },
  dayDots: {
    gap: 4,
  },
  dayDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
  },

  habitsSection: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Cairo_700Bold',
    color: '#333',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  addBtnText: {
    fontSize: 14,
    fontFamily: 'Cairo_700Bold',
    color: '#FF9800',
  },

  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Cairo_700Bold',
    color: '#999',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: 'Cairo_400Regular',
    color: '#bbb',
    marginTop: 8,
    textAlign: 'center',
  },

  habitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#f9f9f9',
    borderRadius: 14,
    marginBottom: 10,
  },
  habitIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 14,
  },
  habitInfo: {
    flex: 1,
  },
  habitName: {
    fontSize: 16,
    fontFamily: 'Cairo_700Bold',
    color: '#333',
    textAlign: 'right',
  },
  habitStreak: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 4,
  },
  streakText: {
    fontSize: 12,
    fontFamily: 'Cairo_400Regular',
    color: '#999',
  },
  checkBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },

  tipText: {
    fontSize: 12,
    fontFamily: 'Cairo_400Regular',
    color: '#999',
    textAlign: 'center',
    marginTop: 16,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Cairo_700Bold',
    color: '#333',
  },
  habitInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    fontFamily: 'Cairo_400Regular',
    color: '#333',
    marginBottom: 20,
  },
  iconsLabel: {
    fontSize: 16,
    fontFamily: 'Cairo_700Bold',
    color: '#333',
    textAlign: 'right',
    marginBottom: 12,
  },
  iconsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  iconOption: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    width: '18%',
  },
  iconPreview: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconName: {
    fontSize: 11,
    fontFamily: 'Cairo_400Regular',
    color: '#666',
    marginTop: 4,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF9800',
    padding: 16,
    borderRadius: 14,
    gap: 8,
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveBtnText: {
    fontSize: 18,
    fontFamily: 'Cairo_700Bold',
    color: '#fff',
  },
});
