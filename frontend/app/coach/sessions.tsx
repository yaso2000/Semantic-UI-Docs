import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  RefreshControl,
  StatusBar,
  Platform} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFonts, Alexandria_400Regular, Alexandria_600SemiBold, Alexandria_700Bold } from '@expo-google-fonts/alexandria';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Picker } from '@react-native-picker/picker';
import { COLORS, FONTS } from '../../src/constants/theme';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface Session {
  id: string;
  booking_id: string;
  client_name: string;
  package_name: string;
  duration_hours: number;
  session_type: string;
  notes?: string;
  session_date: string;
  created_at: string;
}

interface Stats {
  total_sessions: number;
  total_hours: number;
  monthly_sessions: number;
  active_clients: number;
}

interface Booking {
  id: string;
  client_name: string;
  package_name: string;
  hours_purchased: number;
  hours_used: number;
  booking_status: string;
}

const SESSION_TYPES = [
  { value: 'training', label: 'جلسة تدريب' },
  { value: 'consultation', label: 'استشارة' },
  { value: 'followup', label: 'متابعة' },
  { value: 'assessment', label: 'تقييم' },
];

const showAlert = (title: string, message: string, buttons?: any[]) => {
  if (Platform.OS === 'web') {
    const result = window.confirm(`${title}\n\n${message}`);
    if (buttons) {
      if (result && buttons[1]?.onPress) buttons[1].onPress();
      else if (!result && buttons[0]?.onPress) buttons[0].onPress();
    }
  } else {
    Alert.alert(title, message, buttons);
  }
};

export default function SessionsScreen() {
  const insets = useSafeAreaInsets();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newSession, setNewSession] = useState({ booking_id: '', duration_hours: '1', session_type: 'training', notes: '' });
  const router = useRouter();
  const [fontsLoaded] = useFonts({ Alexandria_400Regular, Alexandria_600SemiBold, Alexandria_700Bold });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const [sessionsRes, statsRes, bookingsRes] = await Promise.all([
        fetch(`${API_URL}/api/sessions/my-sessions`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/sessions/stats`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/coach/my-clients`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (sessionsRes.ok) setSessions(await sessionsRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
      if (bookingsRes.ok) {
        const data = await bookingsRes.json();
        setBookings(data.filter((b: Booking) => b.booking_status === 'confirmed'));
      }
    } catch (error) { console.error('Error:', error); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const addSession = async () => {
    if (!newSession.booking_id || !newSession.duration_hours || parseFloat(newSession.duration_hours) <= 0) {
      Alert.alert('خطأ', 'يرجى اختيار المتدرب وإدخال مدة صالحة');
      return;
    }
    setSaving(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/sessions/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...newSession, duration_hours: parseFloat(newSession.duration_hours), notes: newSession.notes || null })
      });
      if (response.ok) {
        Alert.alert('نجاح', 'تم تسجيل الجلسة بنجاح');
        setShowAddModal(false);
        setNewSession({ booking_id: '', duration_hours: '1', session_type: 'training', notes: '' });
        loadData();
      } else {
        const error = await response.json();
        Alert.alert('خطأ', error.detail || 'فشل في تسجيل الجلسة');
      }
    } catch (error) { Alert.alert('خطأ', 'حدث خطأ في الاتصال'); }
    finally { setSaving(false); }
  };

  const deleteSession = (sessionId: string) => {
    showAlert('حذف الجلسة', 'هل أنت متأكد من حذف هذه الجلسة؟', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'حذف', style: 'destructive', onPress: async () => {
        try {
          const token = await AsyncStorage.getItem('token');
          await fetch(`${API_URL}/api/sessions/${sessionId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
          loadData();
        } catch (error) { Alert.alert('خطأ', 'فشل في حذف الجلسة'); }
      }}
    ]);
  };

  const getSessionTypeLabel = (type: string) => SESSION_TYPES.find(t => t.value === type)?.label || type;

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        <ActivityIndicator size="large" color={COLORS.gold} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color={COLORS.gold} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>سجل الجلسات</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
          <Ionicons name="add" size={24} color={COLORS.gold} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={COLORS.gold} />}>
        {stats && (
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="calendar" size={26} color={COLORS.gold} />
              <Text style={styles.statValue}>{stats.total_sessions}</Text>
              <Text style={styles.statLabel}>إجمالي الجلسات</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="time" size={26} color="#4CAF50" />
              <Text style={styles.statValue}>{stats.total_hours.toFixed(1)}</Text>
              <Text style={styles.statLabel}>ساعة تدريب</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="trending-up" size={26} color="#2196F3" />
              <Text style={styles.statValue}>{stats.monthly_sessions}</Text>
              <Text style={styles.statLabel}>هذا الشهر</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="people" size={26} color="#9C27B0" />
              <Text style={styles.statValue}>{stats.active_clients}</Text>
              <Text style={styles.statLabel}>متدرب نشط</Text>
            </View>
          </View>
        )}

        <View style={styles.sessionsSection}>
          <Text style={styles.sectionTitle}>آخر الجلسات</Text>
          {sessions.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={64} color={COLORS.border} />
              <Text style={styles.emptyText}>لا توجد جلسات مسجلة</Text>
              <Text style={styles.emptySubtext}>اضغط + لتسجيل جلسة جديدة</Text>
            </View>
          ) : (
            sessions.map((session) => (
              <View key={session.id} style={styles.sessionCard}>
                <View style={styles.sessionHeader}>
                  <TouchableOpacity onPress={() => deleteSession(session.id)}>
                    <Ionicons name="trash-outline" size={20} color={COLORS.error} />
                  </TouchableOpacity>
                  <View style={styles.sessionInfo}>
                    <Text style={styles.sessionClient}>{session.client_name}</Text>
                    <Text style={styles.sessionPackage}>{session.package_name}</Text>
                  </View>
                </View>
                <View style={styles.sessionDetails}>
                  <View style={styles.sessionDetail}>
                    <Text style={styles.detailValue}>{session.duration_hours} ساعة</Text>
                    <Ionicons name="time" size={16} color={COLORS.gold} />
                  </View>
                  <View style={styles.sessionDetail}>
                    <Text style={styles.detailValue}>{getSessionTypeLabel(session.session_type)}</Text>
                    <Ionicons name="bookmark" size={16} color={COLORS.gold} />
                  </View>
                </View>
                {session.notes && <Text style={styles.sessionNotes}>{session.notes}</Text>}
                <Text style={styles.sessionDate}>
                  {format(new Date(session.session_date), 'EEEE, d MMMM yyyy - h:mm a', { locale: ar })}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.textMuted} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>تسجيل جلسة جديدة</Text>
            </View>

            <Text style={styles.inputLabel}>المتدرب</Text>
            <View style={styles.pickerContainer}>
              <Picker selectedValue={newSession.booking_id} onValueChange={(value) => setNewSession({ ...newSession, booking_id: value })} style={styles.picker}>
                <Picker.Item label="اختر المتدرب..." value="" />
                {bookings.map((booking) => (
                  <Picker.Item key={booking.id} label={`${booking.client_name} - ${booking.package_name} (${booking.hours_purchased - booking.hours_used} ساعة متبقية)`} value={booking.id} />
                ))}
              </Picker>
            </View>

            <Text style={styles.inputLabel}>مدة الجلسة (بالساعات)</Text>
            <TextInput style={styles.input} value={newSession.duration_hours} onChangeText={(text) => setNewSession({ ...newSession, duration_hours: text })} keyboardType="decimal-pad" placeholder="1" placeholderTextColor={COLORS.textMuted} textAlign="right" />

            <Text style={styles.inputLabel}>نوع الجلسة</Text>
            <View style={styles.typeButtons}>
              {SESSION_TYPES.map((type) => (
                <TouchableOpacity key={type.value} style={[styles.typeBtn, newSession.session_type === type.value && styles.typeBtnActive]} onPress={() => setNewSession({ ...newSession, session_type: type.value })}>
                  <Text style={[styles.typeBtnText, newSession.session_type === type.value && styles.typeBtnTextActive]}>{type.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>ملاحظات (اختياري)</Text>
            <TextInput style={[styles.input, styles.textArea]} value={newSession.notes} onChangeText={(text) => setNewSession({ ...newSession, notes: text })} placeholder="ملاحظات عن الجلسة..." placeholderTextColor={COLORS.textMuted} multiline numberOfLines={3} textAlign="right" />

            <TouchableOpacity style={[styles.submitBtn, saving && styles.submitBtnDisabled]} onPress={addSession} disabled={saving}>
              {saving ? <ActivityIndicator color={COLORS.primary} /> : (
                <>
                  <Ionicons name="checkmark" size={22} color={COLORS.primary} />
                  <Text style={styles.submitBtnText}>تسجيل الجلسة</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.primary },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16,
    backgroundColor: COLORS.secondary, borderBottomWidth: 1, borderBottomColor: COLORS.border},
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontFamily: FONTS.bold, color: COLORS.gold },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16, paddingBottom: 40 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  statCard: {
    width: '48%', backgroundColor: COLORS.secondary, borderRadius: 14, padding: 14, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border},
  statValue: { fontSize: 22, fontFamily: FONTS.bold, color: COLORS.gold, marginTop: 6 },
  statLabel: { fontSize: 11, fontFamily: FONTS.regular, color: COLORS.textMuted, marginTop: 4 },
  sessionsSection: {},
  sectionTitle: { fontSize: 18, fontFamily: FONTS.bold, color: COLORS.text, marginBottom: 12, textAlign: 'right' },
  emptyState: {
    alignItems: 'center', padding: 40, backgroundColor: COLORS.secondary, borderRadius: 16,
    borderWidth: 1, borderColor: COLORS.border},
  emptyText: { fontSize: 16, fontFamily: FONTS.bold, color: COLORS.textMuted, marginTop: 16 },
  emptySubtext: { fontSize: 14, fontFamily: FONTS.regular, color: COLORS.textMuted, marginTop: 8 },
  sessionCard: {
    backgroundColor: COLORS.secondary, borderRadius: 14, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: COLORS.border},
  sessionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  sessionInfo: { flex: 1, alignItems: 'flex-end' },
  sessionClient: { fontSize: 16, fontFamily: FONTS.bold, color: COLORS.text },
  sessionPackage: { fontSize: 13, fontFamily: FONTS.regular, color: COLORS.textMuted },
  sessionDetails: { flexDirection: 'row', justifyContent: 'flex-end', gap: 20, marginBottom: 8 },
  sessionDetail: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailValue: { fontSize: 14, fontFamily: FONTS.semiBold, color: COLORS.text },
  sessionNotes: {
    fontSize: 13, fontFamily: FONTS.regular, color: COLORS.textMuted, textAlign: 'right', marginBottom: 8,
    paddingTop: 8, borderTopWidth: 1, borderTopColor: COLORS.border},
  sessionDate: { fontSize: 12, fontFamily: FONTS.regular, color: COLORS.textMuted, textAlign: 'right' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: COLORS.secondary, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40, maxHeight: '90%'},
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontFamily: FONTS.bold, color: COLORS.gold },
  inputLabel: { fontSize: 14, fontFamily: FONTS.bold, color: COLORS.text, textAlign: 'right', marginBottom: 8, marginTop: 16 },
  input: {
    backgroundColor: COLORS.primary, borderRadius: 12, padding: 14,
    fontSize: 16, fontFamily: FONTS.regular, color: COLORS.text, borderWidth: 1, borderColor: COLORS.border},
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  pickerContainer: { backgroundColor: COLORS.primary, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
  picker: { height: 50, color: COLORS.text },
  typeButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeBtn: {
    paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, backgroundColor: COLORS.primary,
    borderWidth: 1, borderColor: COLORS.border},
  typeBtnActive: { backgroundColor: 'rgba(212, 175, 55, 0.15)', borderColor: COLORS.gold },
  typeBtnText: { fontSize: 13, fontFamily: FONTS.semiBold, color: COLORS.textMuted },
  typeBtnTextActive: { color: COLORS.gold },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.gold, borderRadius: 12, padding: 16, marginTop: 24, gap: 8},
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { fontSize: 18, fontFamily: FONTS.bold, color: COLORS.primary }});
