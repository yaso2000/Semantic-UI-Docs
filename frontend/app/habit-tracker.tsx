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
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFonts, Alexandria_400Regular, Alexandria_600SemiBold, Alexandria_700Bold } from '@expo-google-fonts/alexandria';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, FONTS, SHADOWS, RADIUS, SPACING } from '../src/constants/theme';

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
  { icon: 'water', color: COLORS.teal, name: 'ماء' },
  { icon: 'fitness', color: COLORS.sage, name: 'رياضة' },
  { icon: 'book', color: COLORS.spiritual, name: 'قراءة' },
  { icon: 'bed', color: COLORS.sageDark, name: 'نوم' },
  { icon: 'walk', color: COLORS.gold, name: 'مشي' },
  { icon: 'leaf', color: COLORS.sageLight, name: 'تأمل' },
  { icon: 'nutrition', color: COLORS.tealLight, name: 'تغذية' },
  { icon: 'happy', color: COLORS.goldLight, name: 'امتنان' },
  { icon: 'pencil', color: COLORS.goldDark, name: 'كتابة' },
  { icon: 'musical-notes', color: COLORS.tealDark, name: 'موسيقى' },
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

  const [fontsLoaded] = useFonts({ Alexandria_400Regular, Alexandria_600SemiBold, Alexandria_700Bold });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        router.replace('/(auth)/login');
        return;
      }

      const habitsRes = await fetch(`${API_URL}/api/habits`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (habitsRes.ok) {
        setHabits(await habitsRes.json());
      }

      const statsRes = await fetch(`${API_URL}/api/habits/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (statsRes.ok) {
        setStats(await statsRes.json());
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getTodayString = () => new Date().toISOString().split('T')[0];
  const isCompletedToday = (habit: Habit) => habit.completedDates.includes(getTodayString());

  const toggleHabit = async (habitId: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const today = getTodayString();
      
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

      await fetch(`${API_URL}/api/habits/${habitId}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ date: today })
      });
    } catch (error) {
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
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          name: newHabitName,
          icon: selectedIcon.icon,
          color: selectedIcon.color,
          frequency: 'daily'
        })
      });

      if (response.ok) {
        setNewHabitName('');
        setSelectedIcon(HABIT_ICONS[0]);
        setShowAddModal(false);
        loadData();
      }
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ');
    } finally {
      setSaving(false);
    }
  };

  const deleteHabit = async (habitId: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      setHabits(prev => prev.filter(h => h.id !== habitId));
      await fetch(`${API_URL}/api/habits/${habitId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (error) {
      loadData();
    }
  };

  const getStreak = (habit: Habit) => {
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      if (habit.completedDates.includes(dateStr)) streak++;
      else if (i > 0) break;
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
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <ActivityIndicator size="large" color={COLORS.teal} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>متتبع العادات</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={() => { setRefreshing(true); loadData(); }}>
          <Ionicons name="refresh" size={22} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} tintColor={COLORS.teal} />}
      >
        {/* Progress Card */}
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
          <Text style={styles.progressText}>{completedToday} من {totalHabits} عادات مكتملة</Text>
        </View>

        {/* Stats */}
        {stats && (
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Ionicons name="flame" size={24} color={COLORS.gold} />
              <Text style={styles.statValue}>{stats.best_streak}</Text>
              <Text style={styles.statLabel}>أفضل سلسلة</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="trending-up" size={24} color={COLORS.sage} />
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

        {/* Habits Section */}
        <View style={styles.habitsSection}>
          <View style={styles.sectionHeader}>
            <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
              <Ionicons name="add" size={18} color={COLORS.white} />
              <Text style={styles.addBtnText}>إضافة</Text>
            </TouchableOpacity>
            <Text style={styles.sectionTitle}>عاداتي اليومية</Text>
          </View>

          {habits.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="leaf-outline" size={64} color={COLORS.border} />
              <Text style={styles.emptyText}>لم تقم بإضافة أي عادات بعد</Text>
            </View>
          ) : (
            habits.map((habit) => (
              <TouchableOpacity
                key={habit.id}
                style={styles.habitCard}
                onPress={() => toggleHabit(habit.id)}
                onLongPress={() => deleteHabit(habit.id)}
              >
                <View style={[styles.habitIcon, { backgroundColor: habit.color }]}>
                  <Ionicons name={habit.icon as any} size={22} color={COLORS.white} />
                </View>
                <View style={styles.habitInfo}>
                  <Text style={styles.habitName}>{habit.name}</Text>
                  <View style={styles.habitStreak}>
                    <Ionicons name="flame" size={14} color={COLORS.gold} />
                    <Text style={styles.streakText}>{getStreak(habit)} يوم متتالي</Text>
                  </View>
                </View>
                <View style={[
                  styles.checkBox,
                  isCompletedToday(habit) && { backgroundColor: habit.color, borderColor: habit.color }
                ]}>
                  {isCompletedToday(habit) && <Ionicons name="checkmark" size={18} color={COLORS.white} />}
                </View>
              </TouchableOpacity>
            ))
          )}

          {habits.length > 0 && (
            <Text style={styles.tipText}>💡 اضغط مطولاً على العادة لحذفها</Text>
          )}
        </View>
      </ScrollView>

      {/* Add Habit Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.textMuted} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>إضافة عادة جديدة</Text>
            </View>

            <TextInput
              style={styles.habitInput}
              value={newHabitName}
              onChangeText={setNewHabitName}
              placeholder="اسم العادة..."
              placeholderTextColor={COLORS.textMuted}
              textAlign="right"
            />

            <Text style={styles.iconsLabel}>اختر أيقونة:</Text>
            <View style={styles.iconsGrid}>
              {HABIT_ICONS.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.iconOption, selectedIcon.icon === item.icon && { borderColor: item.color, borderWidth: 2 }]}
                  onPress={() => setSelectedIcon(item)}
                >
                  <View style={[styles.iconPreview, { backgroundColor: item.color }]}>
                    <Ionicons name={item.icon as any} size={22} color={COLORS.white} />
                  </View>
                  <Text style={styles.iconName}>{item.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={addHabit} disabled={saving}>
              {saving ? <ActivityIndicator color={COLORS.white} /> : (
                <>
                  <Ionicons name="add-circle" size={22} color={COLORS.white} />
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
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background 
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: COLORS.background 
  },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.teal,
  },
  backBtn: {
    width: 40, 
    height: 40, 
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', 
    alignItems: 'center', 
    marginLeft: SPACING.md,
  },
  headerTitle: {
    flex: 1, 
    fontSize: 20, 
    fontFamily: FONTS.bold, 
    color: COLORS.white, 
    textAlign: 'right',
  },
  refreshBtn: {
    width: 40, 
    height: 40, 
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', 
    alignItems: 'center',
  },

  content: { 
    padding: SPACING.md, 
    paddingBottom: 40 
  },

  progressCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg, 
    padding: SPACING.lg, 
    marginBottom: SPACING.md,
    ...SHADOWS.md,
  },
  progressHeader: {
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: SPACING.md,
  },
  progressTitle: { 
    fontSize: 18, 
    fontFamily: FONTS.bold, 
    color: COLORS.text, 
    textAlign: 'right' 
  },
  progressDate: { 
    fontSize: 13, 
    fontFamily: FONTS.regular, 
    color: COLORS.textSecondary, 
    textAlign: 'right', 
    marginTop: 4 
  },
  progressCircle: {
    width: 60, 
    height: 60, 
    borderRadius: 30,
    backgroundColor: COLORS.beige,
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 2, 
    borderColor: COLORS.teal,
  },
  progressPercent: { 
    fontSize: 18, 
    fontFamily: FONTS.bold, 
    color: COLORS.teal 
  },
  progressBar: { 
    height: 8, 
    backgroundColor: COLORS.beige, 
    borderRadius: 4, 
    overflow: 'hidden' 
  },
  progressFill: { 
    height: '100%', 
    backgroundColor: COLORS.teal, 
    borderRadius: 4 
  },
  progressText: { 
    fontSize: 14, 
    fontFamily: FONTS.regular, 
    color: COLORS.textSecondary, 
    textAlign: 'center', 
    marginTop: 12 
  },

  statsRow: { 
    flexDirection: 'row', 
    gap: 12, 
    marginBottom: SPACING.md 
  },
  statCard: {
    flex: 1, 
    backgroundColor: COLORS.white, 
    borderRadius: RADIUS.lg, 
    padding: SPACING.md, 
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  statValue: { 
    fontSize: 22, 
    fontFamily: FONTS.bold, 
    color: COLORS.teal, 
    marginTop: 6 
  },
  statLabel: { 
    fontSize: 12, 
    fontFamily: FONTS.regular, 
    color: COLORS.textSecondary, 
    marginTop: 4 
  },

  weekView: {
    flexDirection: 'row', 
    justifyContent: 'space-between',
    backgroundColor: COLORS.white, 
    borderRadius: RADIUS.lg, 
    padding: SPACING.sm, 
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  dayColumn: { 
    alignItems: 'center', 
    padding: 6, 
    borderRadius: RADIUS.sm 
  },
  dayColumnToday: { 
    backgroundColor: COLORS.beige 
  },
  dayLabel: { 
    fontSize: 10, 
    fontFamily: FONTS.semiBold, 
    color: COLORS.textSecondary, 
    marginBottom: 4 
  },
  dayLabelToday: { 
    color: COLORS.teal 
  },
  dayNum: { 
    fontSize: 14, 
    fontFamily: FONTS.bold, 
    color: COLORS.text, 
    marginBottom: 6 
  },
  dayNumToday: { 
    color: COLORS.teal 
  },
  dayDots: { 
    gap: 3 
  },
  dayDot: { 
    width: 6, 
    height: 6, 
    borderRadius: 3, 
    backgroundColor: COLORS.border 
  },

  habitsSection: {
    backgroundColor: COLORS.white, 
    borderRadius: RADIUS.lg, 
    padding: SPACING.md,
    ...SHADOWS.md,
  },
  sectionHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: SPACING.md 
  },
  sectionTitle: { 
    fontSize: 18, 
    fontFamily: FONTS.bold, 
    color: COLORS.text 
  },
  addBtn: {
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4,
    backgroundColor: COLORS.teal, 
    paddingHorizontal: 14, 
    paddingVertical: 6, 
    borderRadius: RADIUS.full,
  },
  addBtnText: { 
    fontSize: 14, 
    fontFamily: FONTS.bold, 
    color: COLORS.white 
  },

  emptyState: { 
    alignItems: 'center', 
    padding: SPACING.xl 
  },
  emptyText: { 
    fontSize: 16, 
    fontFamily: FONTS.semiBold, 
    color: COLORS.textSecondary, 
    marginTop: SPACING.md 
  },

  habitCard: {
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: SPACING.md,
    backgroundColor: COLORS.beige, 
    borderRadius: RADIUS.md, 
    marginBottom: 10,
  },
  habitIcon: { 
    width: 44, 
    height: 44, 
    borderRadius: RADIUS.md, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginLeft: 14 
  },
  habitInfo: { 
    flex: 1 
  },
  habitName: { 
    fontSize: 15, 
    fontFamily: FONTS.semiBold, 
    color: COLORS.text, 
    textAlign: 'right' 
  },
  habitStreak: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'flex-end', 
    gap: 4, 
    marginTop: 4 
  },
  streakText: { 
    fontSize: 12, 
    fontFamily: FONTS.regular, 
    color: COLORS.textSecondary 
  },
  checkBox: {
    width: 28, 
    height: 28, 
    borderRadius: 8, 
    borderWidth: 2, 
    borderColor: COLORS.border,
    justifyContent: 'center', 
    alignItems: 'center',
  },

  tipText: { 
    fontSize: 12, 
    fontFamily: FONTS.regular, 
    color: COLORS.textSecondary, 
    textAlign: 'center', 
    marginTop: SPACING.md 
  },

  modalOverlay: { 
    flex: 1, 
    backgroundColor: COLORS.overlay, 
    justifyContent: 'flex-end' 
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.xl, 
    borderTopRightRadius: RADIUS.xl, 
    padding: SPACING.lg, 
    paddingBottom: 40,
  },
  modalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: SPACING.lg 
  },
  modalTitle: { 
    fontSize: 20, 
    fontFamily: FONTS.bold, 
    color: COLORS.teal 
  },
  habitInput: {
    backgroundColor: COLORS.beige, 
    borderRadius: RADIUS.md, 
    padding: SPACING.md,
    fontSize: 16, 
    fontFamily: FONTS.regular, 
    color: COLORS.text, 
    marginBottom: SPACING.lg,
    borderWidth: 1, 
    borderColor: COLORS.border,
  },
  iconsLabel: { 
    fontSize: 15, 
    fontFamily: FONTS.bold, 
    color: COLORS.text, 
    textAlign: 'right', 
    marginBottom: 12 
  },
  iconsGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 10, 
    marginBottom: SPACING.lg 
  },
  iconOption: { 
    alignItems: 'center', 
    padding: 8, 
    borderRadius: RADIUS.md, 
    borderWidth: 1, 
    borderColor: 'transparent', 
    width: '18%' 
  },
  iconPreview: { 
    width: 40, 
    height: 40, 
    borderRadius: RADIUS.sm, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  iconName: { 
    fontSize: 10, 
    fontFamily: FONTS.regular, 
    color: COLORS.textSecondary, 
    marginTop: 4 
  },
  saveBtn: {
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    backgroundColor: COLORS.teal, 
    padding: SPACING.md, 
    borderRadius: RADIUS.md, 
    gap: 8,
  },
  saveBtnDisabled: { 
    opacity: 0.7 
  },
  saveBtnText: { 
    fontSize: 18, 
    fontFamily: FONTS.bold, 
    color: COLORS.white 
  },
});
