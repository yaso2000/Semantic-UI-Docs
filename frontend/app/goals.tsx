import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Alert,
  TextInput,
  Modal,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts, Alexandria_400Regular, Alexandria_600SemiBold, Alexandria_700Bold } from '@expo-google-fonts/alexandria';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../src/constants/theme';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

const PILLARS = [
  { id: 'physical', name: 'الجسدي', icon: 'fitness', color: COLORS.physical },
  { id: 'mental', name: 'النفسي', icon: 'happy', color: COLORS.mental },
  { id: 'social', name: 'الاجتماعي', icon: 'people', color: COLORS.social },
  { id: 'spiritual', name: 'الروحي', icon: 'sparkles', color: COLORS.spiritual },
];

interface GoalStep {
  id: string;
  title: string;
  completed: boolean;
  completed_at?: string;
}

interface Goal {
  id: string;
  title: string;
  description?: string;
  pillar: string;
  target_date?: string;
  steps: GoalStep[];
  status: string;
  progress: number;
  created_at: string;
}

interface GoalsStats {
  total: number;
  active: number;
  completed: number;
  by_pillar: { [key: string]: { total: number; completed: number } };
}

export default function GoalsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [stats, setStats] = useState<GoalsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPillar, setSelectedPillar] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  
  // Form state
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalDescription, setNewGoalDescription] = useState('');
  const [newGoalPillar, setNewGoalPillar] = useState('physical');
  const [newGoalSteps, setNewGoalSteps] = useState<string[]>(['']);
  const [saving, setSaving] = useState(false);

  const [fontsLoaded] = useFonts({
    Alexandria_400Regular,
    Alexandria_600SemiBold,
    Alexandria_700Bold,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      
      const [goalsRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/api/goals/my-goals`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/goals/stats/summary`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (goalsRes.ok) {
        const goalsData = await goalsRes.json();
        setGoals(goalsData);
      }
      
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error('Error loading goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const createGoal = async () => {
    if (!newGoalTitle.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال عنوان الهدف');
      return;
    }

    setSaving(true);
    try {
      const token = await AsyncStorage.getItem('token');
      
      const steps = newGoalSteps
        .filter(s => s.trim())
        .map((title, index) => ({
          id: `step_${Date.now()}_${index}`,
          title: title.trim(),
          completed: false
        }));

      const response = await fetch(`${API_URL}/api/goals/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newGoalTitle.trim(),
          description: newGoalDescription.trim() || null,
          pillar: newGoalPillar,
          steps
        })
      });

      if (response.ok) {
        Alert.alert('نجاح', 'تم إنشاء الهدف بنجاح');
        setShowAddModal(false);
        resetForm();
        loadData();
      } else {
        Alert.alert('خطأ', 'حدث خطأ في إنشاء الهدف');
      }
    } catch (error) {
      console.error('Error creating goal:', error);
      Alert.alert('خطأ', 'حدث خطأ في الاتصال');
    } finally {
      setSaving(false);
    }
  };

  const toggleStep = async (goalId: string, stepId: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/api/goals/${goalId}/step/${stepId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        loadData();
        if (selectedGoal) {
          const updatedGoal = goals.find(g => g.id === goalId);
          if (updatedGoal) {
            const updatedSteps = updatedGoal.steps.map(s => 
              s.id === stepId ? { ...s, completed: !s.completed } : s
            );
            setSelectedGoal({ ...updatedGoal, steps: updatedSteps });
          }
        }
      }
    } catch (error) {
      console.error('Error toggling step:', error);
    }
  };

  const deleteGoal = async (goalId: string) => {
    Alert.alert(
      'تأكيد الحذف',
      'هل أنت متأكد من حذف هذا الهدف؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              await fetch(`${API_URL}/api/goals/${goalId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
              });
              setShowDetailsModal(false);
              loadData();
            } catch (error) {
              console.error('Error deleting goal:', error);
            }
          }
        }
      ]
    );
  };

  const resetForm = () => {
    setNewGoalTitle('');
    setNewGoalDescription('');
    setNewGoalPillar('physical');
    setNewGoalSteps(['']);
  };

  const addStep = () => {
    setNewGoalSteps([...newGoalSteps, '']);
  };

  const updateStep = (index: number, value: string) => {
    const updated = [...newGoalSteps];
    updated[index] = value;
    setNewGoalSteps(updated);
  };

  const removeStep = (index: number) => {
    if (newGoalSteps.length > 1) {
      setNewGoalSteps(newGoalSteps.filter((_, i) => i !== index));
    }
  };

  const getPillarInfo = (pillarId: string) => {
    return PILLARS.find(p => p.id === pillarId) || PILLARS[0];
  };

  const filteredGoals = selectedPillar 
    ? goals.filter(g => g.pillar === selectedPillar)
    : goals;

  if (!fontsLoaded || loading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <ActivityIndicator size="large" color={COLORS.teal} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color={COLORS.teal} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>أهدافي</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
          <Ionicons name="add" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Stats Cards */}
        {stats && (
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: COLORS.teal }]}>
              <Text style={styles.statNumber}>{stats.total}</Text>
              <Text style={styles.statLabel}>إجمالي</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: COLORS.mental }]}>
              <Text style={styles.statNumber}>{stats.active}</Text>
              <Text style={styles.statLabel}>نشط</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: COLORS.physical }]}>
              <Text style={styles.statNumber}>{stats.completed}</Text>
              <Text style={styles.statLabel}>مكتمل</Text>
            </View>
          </View>
        )}

        {/* Pillar Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillarsScroll}>
          <TouchableOpacity
            style={[styles.pillarBtn, !selectedPillar && styles.pillarBtnActive]}
            onPress={() => setSelectedPillar(null)}
          >
            <Text style={[styles.pillarBtnText, !selectedPillar && styles.pillarBtnTextActive]}>الكل</Text>
          </TouchableOpacity>
          {PILLARS.map(pillar => (
            <TouchableOpacity
              key={pillar.id}
              style={[
                styles.pillarBtn,
                selectedPillar === pillar.id && { backgroundColor: pillar.color }
              ]}
              onPress={() => setSelectedPillar(pillar.id)}
            >
              <Ionicons
                name={pillar.icon as any}
                size={16}
                color={selectedPillar === pillar.id ? COLORS.white : pillar.color}
              />
              <Text style={[
                styles.pillarBtnText,
                selectedPillar === pillar.id && styles.pillarBtnTextActive
              ]}>
                {pillar.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Goals List */}
        {filteredGoals.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="flag-outline" size={64} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>لا توجد أهداف</Text>
            <Text style={styles.emptyText}>ابدأ بإضافة هدفك الأول</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowAddModal(true)}>
              <Ionicons name="add" size={20} color={COLORS.white} />
              <Text style={styles.emptyBtnText}>إضافة هدف</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredGoals.map(goal => {
            const pillar = getPillarInfo(goal.pillar);
            return (
              <TouchableOpacity
                key={goal.id}
                style={styles.goalCard}
                onPress={() => {
                  setSelectedGoal(goal);
                  setShowDetailsModal(true);
                }}
              >
                <View style={[styles.goalPillarBar, { backgroundColor: pillar.color }]} />
                <View style={styles.goalContent}>
                  <View style={styles.goalHeader}>
                    <View style={styles.goalTitleRow}>
                      <Ionicons name={pillar.icon as any} size={18} color={pillar.color} />
                      <Text style={styles.goalTitle}>{goal.title}</Text>
                    </View>
                    {goal.status === 'completed' && (
                      <View style={styles.completedBadge}>
                        <Ionicons name="checkmark-circle" size={16} color={COLORS.physical} />
                      </View>
                    )}
                  </View>
                  
                  {goal.description && (
                    <Text style={styles.goalDescription} numberOfLines={2}>{goal.description}</Text>
                  )}
                  
                  {/* Progress Bar */}
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: `${goal.progress}%`, backgroundColor: pillar.color }]} />
                    </View>
                    <Text style={styles.progressText}>{goal.progress}%</Text>
                  </View>
                  
                  {/* Steps Preview */}
                  {goal.steps.length > 0 && (
                    <Text style={styles.stepsPreview}>
                      {goal.steps.filter(s => s.completed).length}/{goal.steps.length} خطوات مكتملة
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        )}

      </ScrollView>

      {/* Add Goal Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => { setShowAddModal(false); resetForm(); }}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>هدف جديد</Text>
              <View style={{ width: 24 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Title */}
              <Text style={styles.inputLabel}>عنوان الهدف *</Text>
              <TextInput
                style={styles.input}
                placeholder="مثال: فقدان 5 كيلو"
                placeholderTextColor={COLORS.textMuted}
                value={newGoalTitle}
                onChangeText={setNewGoalTitle}
                textAlign="right"
              />

              {/* Description */}
              <Text style={styles.inputLabel}>الوصف (اختياري)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="تفاصيل إضافية عن الهدف"
                placeholderTextColor={COLORS.textMuted}
                value={newGoalDescription}
                onChangeText={setNewGoalDescription}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                textAlign="right"
              />

              {/* Pillar Selection */}
              <Text style={styles.inputLabel}>الركيزة</Text>
              <View style={styles.pillarSelection}>
                {PILLARS.map(pillar => (
                  <TouchableOpacity
                    key={pillar.id}
                    style={[
                      styles.pillarOption,
                      newGoalPillar === pillar.id && { backgroundColor: pillar.color, borderColor: pillar.color }
                    ]}
                    onPress={() => setNewGoalPillar(pillar.id)}
                  >
                    <Ionicons
                      name={pillar.icon as any}
                      size={20}
                      color={newGoalPillar === pillar.id ? COLORS.white : pillar.color}
                    />
                    <Text style={[
                      styles.pillarOptionText,
                      newGoalPillar === pillar.id && { color: COLORS.white }
                    ]}>
                      {pillar.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Steps */}
              <Text style={styles.inputLabel}>الخطوات (اختياري)</Text>
              {newGoalSteps.map((step, index) => (
                <View key={index} style={styles.stepInputRow}>
                  <TextInput
                    style={styles.stepInput}
                    placeholder={`الخطوة ${index + 1}`}
                    placeholderTextColor={COLORS.textMuted}
                    value={step}
                    onChangeText={(val) => updateStep(index, val)}
                    textAlign="right"
                  />
                  {newGoalSteps.length > 1 && (
                    <TouchableOpacity onPress={() => removeStep(index)}>
                      <Ionicons name="close-circle" size={22} color={COLORS.error} />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              <TouchableOpacity style={styles.addStepBtn} onPress={addStep}>
                <Ionicons name="add-circle-outline" size={20} color={COLORS.teal} />
                <Text style={styles.addStepText}>إضافة خطوة</Text>
              </TouchableOpacity>

              {/* Save Button */}
              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                onPress={createGoal}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={22} color={COLORS.white} />
                    <Text style={styles.saveBtnText}>حفظ الهدف</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Goal Details Modal */}
      <Modal visible={showDetailsModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            {selectedGoal && (
              <>
                <View style={styles.modalHeader}>
                  <TouchableOpacity onPress={() => setShowDetailsModal(false)}>
                    <Ionicons name="close" size={24} color={COLORS.text} />
                  </TouchableOpacity>
                  <Text style={styles.modalTitle}>تفاصيل الهدف</Text>
                  <TouchableOpacity onPress={() => deleteGoal(selectedGoal.id)}>
                    <Ionicons name="trash-outline" size={22} color={COLORS.error} />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  <View style={styles.detailsHeader}>
                    <View style={[styles.detailsPillarIcon, { backgroundColor: getPillarInfo(selectedGoal.pillar).color }]}>
                      <Ionicons name={getPillarInfo(selectedGoal.pillar).icon as any} size={28} color={COLORS.white} />
                    </View>
                    <Text style={styles.detailsTitle}>{selectedGoal.title}</Text>
                    {selectedGoal.description && (
                      <Text style={styles.detailsDescription}>{selectedGoal.description}</Text>
                    )}
                  </View>

                  {/* Progress */}
                  <View style={styles.detailsProgress}>
                    <Text style={styles.detailsProgressLabel}>التقدم</Text>
                    <View style={styles.detailsProgressBar}>
                      <View style={[
                        styles.detailsProgressFill,
                        { width: `${selectedGoal.progress}%`, backgroundColor: getPillarInfo(selectedGoal.pillar).color }
                      ]} />
                    </View>
                    <Text style={styles.detailsProgressText}>{selectedGoal.progress}%</Text>
                  </View>

                  {/* Steps */}
                  {selectedGoal.steps.length > 0 && (
                    <View style={styles.stepsSection}>
                      <Text style={styles.stepsSectionTitle}>الخطوات</Text>
                      {selectedGoal.steps.map((step) => (
                        <TouchableOpacity
                          key={step.id}
                          style={styles.stepItem}
                          onPress={() => toggleStep(selectedGoal.id, step.id)}
                        >
                          <Ionicons
                            name={step.completed ? "checkbox" : "square-outline"}
                            size={24}
                            color={step.completed ? COLORS.physical : COLORS.textMuted}
                          />
                          <Text style={[
                            styles.stepTitle,
                            step.completed && styles.stepTitleCompleted
                          ]}>
                            {step.title}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {selectedGoal.status === 'completed' && (
                    <View style={styles.completedMessage}>
                      <Ionicons name="trophy" size={32} color={COLORS.gold} />
                      <Text style={styles.completedMessageText}>تهانينا! تم تحقيق الهدف 🎉</Text>
                    </View>
                  )}
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.md, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: `${COLORS.teal}10`, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontFamily: FONTS.bold, color: COLORS.text },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.teal, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: SPACING.md, paddingBottom: 100 },
  statsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
  statCard: { flex: 1, borderRadius: RADIUS.lg, padding: SPACING.md, alignItems: 'center' },
  statNumber: { fontSize: 28, fontFamily: FONTS.bold, color: COLORS.white },
  statLabel: { fontSize: 12, fontFamily: FONTS.regular, color: COLORS.white, opacity: 0.9 },
  pillarsScroll: { marginBottom: SPACING.lg },
  pillarBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, paddingVertical: 10, paddingHorizontal: 14, borderRadius: RADIUS.full, marginRight: 8, gap: 6, ...SHADOWS.sm },
  pillarBtnActive: { backgroundColor: COLORS.teal },
  pillarBtnText: { fontSize: 13, fontFamily: FONTS.semiBold, color: COLORS.text },
  pillarBtnTextActive: { color: COLORS.white },
  emptyState: { backgroundColor: COLORS.white, borderRadius: RADIUS.xl, padding: SPACING.xl, alignItems: 'center', ...SHADOWS.md },
  emptyTitle: { fontSize: 18, fontFamily: FONTS.bold, color: COLORS.text, marginTop: SPACING.md },
  emptyText: { fontSize: 14, fontFamily: FONTS.regular, color: COLORS.textSecondary, marginTop: 4 },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.teal, paddingVertical: 12, paddingHorizontal: 24, borderRadius: RADIUS.lg, marginTop: SPACING.lg, gap: 8 },
  emptyBtnText: { fontSize: 16, fontFamily: FONTS.bold, color: COLORS.white },
  goalCard: { flexDirection: 'row', backgroundColor: COLORS.white, borderRadius: RADIUS.lg, marginBottom: SPACING.md, overflow: 'hidden', ...SHADOWS.sm },
  goalPillarBar: { width: 5 },
  goalContent: { flex: 1, padding: SPACING.md },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  goalTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  goalTitle: { fontSize: 16, fontFamily: FONTS.bold, color: COLORS.text, flex: 1, textAlign: 'right' },
  completedBadge: { marginLeft: 8 },
  goalDescription: { fontSize: 13, fontFamily: FONTS.regular, color: COLORS.textSecondary, marginTop: 4, textAlign: 'right' },
  progressContainer: { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.sm, gap: 10 },
  progressBar: { flex: 1, height: 6, backgroundColor: COLORS.border, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  progressText: { fontSize: 12, fontFamily: FONTS.semiBold, color: COLORS.textSecondary, width: 35 },
  stepsPreview: { fontSize: 12, fontFamily: FONTS.regular, color: COLORS.textMuted, marginTop: 6, textAlign: 'right' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: SPACING.lg, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.lg },
  modalTitle: { fontSize: 18, fontFamily: FONTS.bold, color: COLORS.text },
  inputLabel: { fontSize: 14, fontFamily: FONTS.semiBold, color: COLORS.text, marginBottom: 8, marginTop: SPACING.md, textAlign: 'right' },
  input: { backgroundColor: COLORS.background, borderRadius: RADIUS.lg, padding: SPACING.md, fontSize: 14, fontFamily: FONTS.regular, color: COLORS.text },
  textArea: { minHeight: 80 },
  pillarSelection: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  pillarOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 14, borderRadius: RADIUS.lg, borderWidth: 2, borderColor: COLORS.border, gap: 6 },
  pillarOptionText: { fontSize: 13, fontFamily: FONTS.semiBold, color: COLORS.text },
  stepInputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  stepInput: { flex: 1, backgroundColor: COLORS.background, borderRadius: RADIUS.lg, padding: SPACING.md, fontSize: 14, fontFamily: FONTS.regular, color: COLORS.text },
  addStepBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10 },
  addStepText: { fontSize: 14, fontFamily: FONTS.semiBold, color: COLORS.teal },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.teal, paddingVertical: 14, borderRadius: RADIUS.lg, marginTop: SPACING.lg, gap: 8 },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { fontSize: 16, fontFamily: FONTS.bold, color: COLORS.white },
  detailsHeader: { alignItems: 'center', marginBottom: SPACING.lg },
  detailsPillarIcon: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.md },
  detailsTitle: { fontSize: 20, fontFamily: FONTS.bold, color: COLORS.text, textAlign: 'center' },
  detailsDescription: { fontSize: 14, fontFamily: FONTS.regular, color: COLORS.textSecondary, textAlign: 'center', marginTop: 8 },
  detailsProgress: { backgroundColor: COLORS.background, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.lg },
  detailsProgressLabel: { fontSize: 14, fontFamily: FONTS.semiBold, color: COLORS.text, marginBottom: 8, textAlign: 'right' },
  detailsProgressBar: { height: 10, backgroundColor: COLORS.border, borderRadius: 5, overflow: 'hidden' },
  detailsProgressFill: { height: '100%', borderRadius: 5 },
  detailsProgressText: { fontSize: 16, fontFamily: FONTS.bold, color: COLORS.teal, textAlign: 'center', marginTop: 8 },
  stepsSection: { marginTop: SPACING.md },
  stepsSectionTitle: { fontSize: 16, fontFamily: FONTS.bold, color: COLORS.text, marginBottom: SPACING.md, textAlign: 'right' },
  stepItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background, padding: SPACING.md, borderRadius: RADIUS.lg, marginBottom: 8, gap: 12 },
  stepTitle: { flex: 1, fontSize: 14, fontFamily: FONTS.regular, color: COLORS.text, textAlign: 'right' },
  stepTitleCompleted: { textDecorationLine: 'line-through', color: COLORS.textMuted },
  completedMessage: { alignItems: 'center', backgroundColor: `${COLORS.gold}15`, padding: SPACING.lg, borderRadius: RADIUS.lg, marginTop: SPACING.lg },
  completedMessageText: { fontSize: 16, fontFamily: FONTS.bold, color: COLORS.gold, marginTop: 8 },
});
