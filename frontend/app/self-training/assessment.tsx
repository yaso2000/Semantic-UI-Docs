import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts, Alexandria_400Regular, Alexandria_600SemiBold, Alexandria_700Bold } from '@expo-google-fonts/alexandria';
import { COLORS, FONTS, SHADOWS, RADIUS, SPACING } from '../../src/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface AssessmentData {
  // البيانات الأساسية
  age: string;
  gender: 'male' | 'female' | '';
  height: string;
  weight: string;
  activity_level: string;
  
  // الأهداف
  primary_goal: string;
  target_weight: string;
  timeline: string;
  
  // التفضيلات
  workout_days: string;
  workout_duration: string;
  equipment: string[];
  injuries: string;
  dietary_restrictions: string[];
}

const ACTIVITY_LEVELS = [
  { id: 'sedentary', label: 'خامل (قليل أو لا تمارين)', icon: 'bed' },
  { id: 'light', label: 'خفيف (1-3 أيام/أسبوع)', icon: 'walk' },
  { id: 'moderate', label: 'معتدل (3-5 أيام/أسبوع)', icon: 'bicycle' },
  { id: 'active', label: 'نشط (6-7 أيام/أسبوع)', icon: 'fitness' },
  { id: 'very_active', label: 'نشط جداً (تمارين مكثفة)', icon: 'flame' },
];

const GOALS = [
  { id: 'lose_weight', label: 'خسارة الوزن', icon: 'trending-down' },
  { id: 'build_muscle', label: 'بناء العضلات', icon: 'barbell' },
  { id: 'maintain', label: 'الحفاظ على الوزن', icon: 'body' },
  { id: 'improve_fitness', label: 'تحسين اللياقة', icon: 'heart' },
  { id: 'increase_strength', label: 'زيادة القوة', icon: 'flash' },
];

const TIMELINES = [
  { id: '1month', label: 'شهر واحد' },
  { id: '3months', label: '3 شهور' },
  { id: '6months', label: '6 شهور' },
  { id: '12months', label: 'سنة كاملة' },
];

const EQUIPMENT_OPTIONS = [
  { id: 'none', label: 'لا أملك معدات' },
  { id: 'dumbbells', label: 'دمبلز' },
  { id: 'barbell', label: 'بار حديد' },
  { id: 'resistance_bands', label: 'أشرطة مقاومة' },
  { id: 'pull_up_bar', label: 'عقلة' },
  { id: 'full_gym', label: 'نادي رياضي كامل' },
];

const DIETARY_OPTIONS = [
  { id: 'none', label: 'لا يوجد' },
  { id: 'vegetarian', label: 'نباتي' },
  { id: 'vegan', label: 'نباتي صرف' },
  { id: 'halal', label: 'حلال فقط' },
  { id: 'gluten_free', label: 'خالي من الجلوتين' },
  { id: 'dairy_free', label: 'خالي من منتجات الألبان' },
];

export default function AssessmentScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hasSubscription, setHasSubscription] = useState(false);
  
  const [data, setData] = useState<AssessmentData>({
    age: '',
    gender: '',
    height: '',
    weight: '',
    activity_level: '',
    primary_goal: '',
    target_weight: '',
    timeline: '',
    workout_days: '3',
    workout_duration: '45',
    equipment: [],
    injuries: '',
    dietary_restrictions: [],
  });

  const [fontsLoaded] = useFonts({ Alexandria_400Regular, Alexandria_600SemiBold, Alexandria_700Bold });

  const STEPS = [
    { title: 'البيانات الأساسية', icon: 'person' },
    { title: 'أهدافك', icon: 'flag' },
    { title: 'تفضيلاتك', icon: 'settings' },
    { title: 'المراجعة', icon: 'checkmark-circle' },
  ];

  useEffect(() => {
    checkSubscription();
  }, []);

  const checkSubscription = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('تسجيل الدخول مطلوب', 'يرجى تسجيل الدخول أولاً', [
          { text: 'تسجيل الدخول', onPress: () => router.push('/login' as any) }
        ]);
        return;
      }

      const response = await fetch(`${API_URL}/api/self-training/my-subscription`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.has_subscription) {
          setHasSubscription(true);
          // جلب بيانات التقييم السابقة إن وجدت
          const assessmentRes = await fetch(`${API_URL}/api/self-training/assessment`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (assessmentRes.ok) {
            const assessmentData = await assessmentRes.json();
            if (assessmentData && assessmentData.data) {
              setData(prev => ({ ...prev, ...assessmentData.data }));
            }
          }
        } else {
          Alert.alert('اشتراك مطلوب', 'يرجى الاشتراك في خدمة التدريب الذاتي أولاً', [
            { text: 'الاشتراك', onPress: () => router.push('/self-training' as any) }
          ]);
        }
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateData = (key: keyof AssessmentData, value: any) => {
    setData(prev => ({ ...prev, [key]: value }));
  };

  const toggleArrayItem = (key: 'equipment' | 'dietary_restrictions', item: string) => {
    setData(prev => {
      const arr = prev[key];
      if (arr.includes(item)) {
        return { ...prev, [key]: arr.filter(i => i !== item) };
      } else {
        return { ...prev, [key]: [...arr, item] };
      }
    });
  };

  const validateStep = () => {
    switch (currentStep) {
      case 0:
        if (!data.age || !data.gender || !data.height || !data.weight || !data.activity_level) {
          Alert.alert('تنبيه', 'يرجى ملء جميع الحقول المطلوبة');
          return false;
        }
        break;
      case 1:
        if (!data.primary_goal || !data.timeline) {
          Alert.alert('تنبيه', 'يرجى اختيار هدفك والمدة الزمنية');
          return false;
        }
        break;
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep()) {
      if (currentStep < STEPS.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const submitAssessment = async () => {
    setSubmitting(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/self-training/assessment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        Alert.alert(
          '🎉 تم حفظ التقييم!',
          'سيتم إنشاء خطتك المخصصة الآن. هل تريد توليد الخطة؟',
          [
            { text: 'لاحقاً', style: 'cancel', onPress: () => router.back() },
            { text: 'توليد الخطة', onPress: () => generatePlan() }
          ]
        );
      } else {
        const error = await response.json();
        Alert.alert('خطأ', error.detail || 'فشل في حفظ التقييم');
      }
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ في الاتصال');
    } finally {
      setSubmitting(false);
    }
  };

  const generatePlan = async () => {
    setSubmitting(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/self-training/complete-assessment`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        Alert.alert(
          '🎉 تم إنشاء خطتك!',
          'يمكنك الآن تحميل خطتك المخصصة كملف PDF',
          [{ text: 'عرض الخطة', onPress: () => router.push('/self-training/my-plan' as any) }]
        );
      } else {
        const error = await response.json();
        Alert.alert('خطأ', error.detail || 'فشل في توليد الخطة');
      }
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ في الاتصال');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderBasicInfo();
      case 1:
        return renderGoals();
      case 2:
        return renderPreferences();
      case 3:
        return renderReview();
      default:
        return null;
    }
  };

  const renderBasicInfo = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepDescription}>أخبرنا عن نفسك لنتمكن من تخصيص خطتك</Text>
      
      {/* العمر */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>العمر *</Text>
        <TextInput
          style={styles.input}
          value={data.age}
          onChangeText={(v) => updateData('age', v)}
          placeholder="مثال: 25"
          placeholderTextColor={COLORS.textMuted}
          keyboardType="numeric"
        />
      </View>

      {/* الجنس */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>الجنس *</Text>
        <View style={styles.genderRow}>
          <TouchableOpacity
            style={[styles.genderBtn, data.gender === 'male' && styles.genderBtnSelected]}
            onPress={() => updateData('gender', 'male')}
          >
            <Ionicons name="male" size={24} color={data.gender === 'male' ? COLORS.white : COLORS.teal} />
            <Text style={[styles.genderText, data.gender === 'male' && styles.genderTextSelected]}>ذكر</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.genderBtn, data.gender === 'female' && styles.genderBtnSelected]}
            onPress={() => updateData('gender', 'female')}
          >
            <Ionicons name="female" size={24} color={data.gender === 'female' ? COLORS.white : '#E91E63'} />
            <Text style={[styles.genderText, data.gender === 'female' && styles.genderTextSelected]}>أنثى</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* الطول والوزن */}
      <View style={styles.rowInputs}>
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.inputLabel}>الطول (سم) *</Text>
          <TextInput
            style={styles.input}
            value={data.height}
            onChangeText={(v) => updateData('height', v)}
            placeholder="170"
            placeholderTextColor={COLORS.textMuted}
            keyboardType="numeric"
          />
        </View>
        <View style={[styles.inputGroup, { flex: 1, marginRight: SPACING.md }]}>
          <Text style={styles.inputLabel}>الوزن (كجم) *</Text>
          <TextInput
            style={styles.input}
            value={data.weight}
            onChangeText={(v) => updateData('weight', v)}
            placeholder="70"
            placeholderTextColor={COLORS.textMuted}
            keyboardType="numeric"
          />
        </View>
      </View>

      {/* مستوى النشاط */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>مستوى النشاط البدني *</Text>
        {ACTIVITY_LEVELS.map((level) => (
          <TouchableOpacity
            key={level.id}
            style={[styles.optionItem, data.activity_level === level.id && styles.optionItemSelected]}
            onPress={() => updateData('activity_level', level.id)}
          >
            <Ionicons 
              name={level.icon as any} 
              size={20} 
              color={data.activity_level === level.id ? COLORS.white : COLORS.teal} 
            />
            <Text style={[styles.optionText, data.activity_level === level.id && styles.optionTextSelected]}>
              {level.label}
            </Text>
            {data.activity_level === level.id && (
              <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderGoals = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepDescription}>حدد أهدافك لنساعدك في تحقيقها</Text>

      {/* الهدف الرئيسي */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>الهدف الرئيسي *</Text>
        {GOALS.map((goal) => (
          <TouchableOpacity
            key={goal.id}
            style={[styles.optionItem, data.primary_goal === goal.id && styles.optionItemSelected]}
            onPress={() => updateData('primary_goal', goal.id)}
          >
            <Ionicons 
              name={goal.icon as any} 
              size={20} 
              color={data.primary_goal === goal.id ? COLORS.white : COLORS.teal} 
            />
            <Text style={[styles.optionText, data.primary_goal === goal.id && styles.optionTextSelected]}>
              {goal.label}
            </Text>
            {data.primary_goal === goal.id && (
              <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* الوزن المستهدف */}
      {(data.primary_goal === 'lose_weight' || data.primary_goal === 'build_muscle') && (
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>الوزن المستهدف (كجم)</Text>
          <TextInput
            style={styles.input}
            value={data.target_weight}
            onChangeText={(v) => updateData('target_weight', v)}
            placeholder="مثال: 65"
            placeholderTextColor={COLORS.textMuted}
            keyboardType="numeric"
          />
        </View>
      )}

      {/* المدة الزمنية */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>المدة الزمنية المتوقعة *</Text>
        <View style={styles.timelineGrid}>
          {TIMELINES.map((timeline) => (
            <TouchableOpacity
              key={timeline.id}
              style={[styles.timelineBtn, data.timeline === timeline.id && styles.timelineBtnSelected]}
              onPress={() => updateData('timeline', timeline.id)}
            >
              <Text style={[styles.timelineText, data.timeline === timeline.id && styles.timelineTextSelected]}>
                {timeline.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderPreferences = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepDescription}>أخبرنا عن تفضيلاتك في التدريب</Text>

      {/* أيام التمرين */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>عدد أيام التمرين في الأسبوع</Text>
        <View style={styles.sliderRow}>
          {['2', '3', '4', '5', '6'].map((day) => (
            <TouchableOpacity
              key={day}
              style={[styles.dayBtn, data.workout_days === day && styles.dayBtnSelected]}
              onPress={() => updateData('workout_days', day)}
            >
              <Text style={[styles.dayText, data.workout_days === day && styles.dayTextSelected]}>{day}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* مدة التمرين */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>مدة التمرين المفضلة (دقيقة)</Text>
        <View style={styles.sliderRow}>
          {['30', '45', '60', '90'].map((duration) => (
            <TouchableOpacity
              key={duration}
              style={[styles.dayBtn, data.workout_duration === duration && styles.dayBtnSelected]}
              onPress={() => updateData('workout_duration', duration)}
            >
              <Text style={[styles.dayText, data.workout_duration === duration && styles.dayTextSelected]}>{duration}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* المعدات */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>المعدات المتاحة لديك</Text>
        <View style={styles.chipsContainer}>
          {EQUIPMENT_OPTIONS.map((eq) => (
            <TouchableOpacity
              key={eq.id}
              style={[styles.chip, data.equipment.includes(eq.id) && styles.chipSelected]}
              onPress={() => toggleArrayItem('equipment', eq.id)}
            >
              <Text style={[styles.chipText, data.equipment.includes(eq.id) && styles.chipTextSelected]}>
                {eq.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* الإصابات */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>هل لديك إصابات أو قيود طبية؟</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={data.injuries}
          onChangeText={(v) => updateData('injuries', v)}
          placeholder="اكتب هنا إن وجدت..."
          placeholderTextColor={COLORS.textMuted}
          multiline
          numberOfLines={3}
        />
      </View>

      {/* القيود الغذائية */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>القيود الغذائية</Text>
        <View style={styles.chipsContainer}>
          {DIETARY_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.id}
              style={[styles.chip, data.dietary_restrictions.includes(opt.id) && styles.chipSelected]}
              onPress={() => toggleArrayItem('dietary_restrictions', opt.id)}
            >
              <Text style={[styles.chipText, data.dietary_restrictions.includes(opt.id) && styles.chipTextSelected]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderReview = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepDescription}>راجع بياناتك قبل إنشاء الخطة</Text>

      <View style={styles.reviewCard}>
        <Text style={styles.reviewTitle}>البيانات الأساسية</Text>
        <View style={styles.reviewRow}>
          <Text style={styles.reviewValue}>{data.age} سنة</Text>
          <Text style={styles.reviewLabel}>العمر</Text>
        </View>
        <View style={styles.reviewRow}>
          <Text style={styles.reviewValue}>{data.gender === 'male' ? 'ذكر' : 'أنثى'}</Text>
          <Text style={styles.reviewLabel}>الجنس</Text>
        </View>
        <View style={styles.reviewRow}>
          <Text style={styles.reviewValue}>{data.height} سم</Text>
          <Text style={styles.reviewLabel}>الطول</Text>
        </View>
        <View style={styles.reviewRow}>
          <Text style={styles.reviewValue}>{data.weight} كجم</Text>
          <Text style={styles.reviewLabel}>الوزن</Text>
        </View>
      </View>

      <View style={styles.reviewCard}>
        <Text style={styles.reviewTitle}>الأهداف</Text>
        <View style={styles.reviewRow}>
          <Text style={styles.reviewValue}>
            {GOALS.find(g => g.id === data.primary_goal)?.label || '-'}
          </Text>
          <Text style={styles.reviewLabel}>الهدف</Text>
        </View>
        <View style={styles.reviewRow}>
          <Text style={styles.reviewValue}>
            {TIMELINES.find(t => t.id === data.timeline)?.label || '-'}
          </Text>
          <Text style={styles.reviewLabel}>المدة</Text>
        </View>
      </View>

      <View style={styles.reviewCard}>
        <Text style={styles.reviewTitle}>التفضيلات</Text>
        <View style={styles.reviewRow}>
          <Text style={styles.reviewValue}>{data.workout_days} أيام</Text>
          <Text style={styles.reviewLabel}>أيام التمرين</Text>
        </View>
        <View style={styles.reviewRow}>
          <Text style={styles.reviewValue}>{data.workout_duration} دقيقة</Text>
          <Text style={styles.reviewLabel}>مدة التمرين</Text>
        </View>
      </View>
    </View>
  );

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color={COLORS.teal} />
        <Text style={styles.loadingText}>جاري التحميل...</Text>
      </View>
    );
  }

  if (!hasSubscription) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" />
        <View style={styles.noSubContainer}>
          <Ionicons name="lock-closed" size={64} color={COLORS.teal} />
          <Text style={styles.noSubTitle}>اشتراك مطلوب</Text>
          <Text style={styles.noSubText}>يرجى الاشتراك في خدمة التدريب الذاتي للوصول للتقييم</Text>
          <TouchableOpacity style={styles.subscribeBtn} onPress={() => router.push('/self-training' as any)}>
            <Text style={styles.subscribeBtnText}>الاشتراك الآن</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>التقييم الذاتي</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      {/* Progress Steps */}
      <View style={styles.progressContainer}>
        {STEPS.map((step, index) => (
          <View key={index} style={styles.progressStep}>
            <View style={[
              styles.progressCircle,
              index <= currentStep && styles.progressCircleActive
            ]}>
              {index < currentStep ? (
                <Ionicons name="checkmark" size={16} color={COLORS.white} />
              ) : (
                <Ionicons name={step.icon as any} size={16} color={index === currentStep ? COLORS.white : COLORS.textMuted} />
              )}
            </View>
            <Text style={[styles.progressText, index <= currentStep && styles.progressTextActive]}>
              {step.title}
            </Text>
            {index < STEPS.length - 1 && (
              <View style={[styles.progressLine, index < currentStep && styles.progressLineActive]} />
            )}
          </View>
        ))}
      </View>

      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {renderStepContent()}
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={[styles.navButtons, { paddingBottom: insets.bottom + 16 }]}>
        {currentStep > 0 && (
          <TouchableOpacity style={styles.prevBtn} onPress={prevStep}>
            <Ionicons name="arrow-forward" size={20} color={COLORS.teal} />
            <Text style={styles.prevBtnText}>السابق</Text>
          </TouchableOpacity>
        )}
        
        {currentStep < STEPS.length - 1 ? (
          <TouchableOpacity style={styles.nextBtn} onPress={nextStep}>
            <Text style={styles.nextBtnText}>التالي</Text>
            <Ionicons name="arrow-back" size={20} color={COLORS.white} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.nextBtn, styles.submitBtn]} 
            onPress={submitAssessment}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Text style={styles.nextBtnText}>إنشاء الخطة</Text>
                <Ionicons name="sparkles" size={20} color={COLORS.white} />
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
  },
  noSubContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  noSubTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginTop: SPACING.md,
  },
  noSubText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  subscribeBtn: {
    backgroundColor: COLORS.teal,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    marginTop: SPACING.lg,
  },
  subscribeBtnText: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },

  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
  },
  progressStep: {
    alignItems: 'center',
    flex: 1,
  },
  progressCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressCircleActive: {
    backgroundColor: '#667eea',
  },
  progressText: {
    fontSize: 10,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  progressTextActive: {
    color: '#667eea',
    fontFamily: FONTS.semiBold,
  },
  progressLine: {
    position: 'absolute',
    top: 16,
    left: '50%',
    width: '100%',
    height: 2,
    backgroundColor: COLORS.border,
    zIndex: -1,
  },
  progressLineActive: {
    backgroundColor: '#667eea',
  },

  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.md,
    paddingBottom: 100,
  },

  stepContent: {
    flex: 1,
  },
  stepDescription: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },

  inputGroup: {
    marginBottom: SPACING.lg,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
    textAlign: 'right',
  },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: COLORS.text,
    textAlign: 'right',
    ...SHADOWS.sm,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },

  rowInputs: {
    flexDirection: 'row',
  },

  genderRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  genderBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  genderBtnSelected: {
    backgroundColor: COLORS.teal,
    borderColor: COLORS.teal,
  },
  genderText: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
  },
  genderTextSelected: {
    color: COLORS.white,
  },

  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
    ...SHADOWS.sm,
  },
  optionItemSelected: {
    backgroundColor: '#667eea',
  },
  optionText: {
    flex: 1,
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.text,
    textAlign: 'right',
  },
  optionTextSelected: {
    color: COLORS.white,
  },

  timelineGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  timelineBtn: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  timelineBtnSelected: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  timelineText: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
  },
  timelineTextSelected: {
    color: COLORS.white,
  },

  sliderRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  dayBtn: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  dayBtnSelected: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  dayText: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  dayTextSelected: {
    color: COLORS.white,
  },

  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  chip: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipSelected: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  chipText: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: COLORS.text,
  },
  chipTextSelected: {
    color: COLORS.white,
  },

  reviewCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  reviewTitle: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: '#667eea',
    marginBottom: SPACING.md,
    textAlign: 'right',
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  reviewLabel: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  reviewValue: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
  },

  navButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  prevBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  prevBtnText: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    color: COLORS.teal,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: '#667eea',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    marginLeft: 'auto',
  },
  nextBtnText: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },
  submitBtn: {
    backgroundColor: '#4CAF50',
  },
});
