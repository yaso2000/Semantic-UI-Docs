import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  
  ActivityIndicator,
  Alert,
  TextInput,
  StatusBar} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFonts, Alexandria_400Regular, Alexandria_600SemiBold, Alexandria_700Bold } from '@expo-google-fonts/alexandria';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, FONTS } from '../src/constants/theme';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface Question {
  id: number;
  question: string;
  type: 'radio' | 'checkbox' | 'text' | 'scale';
  options?: string[];
  required: boolean;
}

const QUESTIONS: Question[] = [
  {
    id: 1,
    question: 'ما هو هدفك الرئيسي من التدريب؟',
    type: 'radio',
    options: [
      'تطوير الذات والنمو الشخصي',
      'تحسين الصحة واللياقة البدنية',
      'تحقيق التوازن في الحياة',
      'تحسين العلاقات الاجتماعية',
      'التقدم المهني والوظيفي',
      'أخرى'
    ],
    required: true
  },
  {
    id: 2,
    question: 'ما هي المجالات التي تريد التركيز عليها؟',
    type: 'checkbox',
    options: [
      'الصحة الجسدية',
      'الصحة النفسية',
      'العلاقات',
      'العمل والمهنة',
      'المال والأعمال',
      'الروحانية',
      'المتعة والترفيه',
      'البيئة المحيطة'
    ],
    required: true
  },
  {
    id: 3,
    question: 'كيف تصف مستوى طاقتك اليومية؟',
    type: 'scale',
    required: true
  },
  {
    id: 4,
    question: 'هل لديك أي تحديات صحية يجب أن نعرفها؟',
    type: 'text',
    required: false
  },
  {
    id: 5,
    question: 'ما هو مستوى التزامك بتحقيق أهدافك؟',
    type: 'scale',
    required: true
  },
  {
    id: 6,
    question: 'كم ساعة أسبوعياً يمكنك تخصيصها للتدريب؟',
    type: 'radio',
    options: [
      'أقل من ساعة',
      '1-2 ساعة',
      '3-5 ساعات',
      'أكثر من 5 ساعات'
    ],
    required: true
  },
  {
    id: 7,
    question: 'هل جربت التدريب الشخصي من قبل؟',
    type: 'radio',
    options: [
      'نعم، وكانت تجربة إيجابية',
      'نعم، لكن لم تكن مناسبة',
      'لا، هذه أول مرة'
    ],
    required: true
  },
  {
    id: 8,
    question: 'ما الذي تتوقعه من المدرب؟',
    type: 'text',
    required: true
  }
];

export default function IntakeQuestionnaireScreen() {
  const insets = useSafeAreaInsets();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: any }>({});
  const [savedAnswers, setSavedAnswers] = useState<{ [key: number]: any } | null>(null);
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const router = useRouter();

  const [fontsLoaded] = useFonts({ Alexandria_400Regular, Alexandria_600SemiBold, Alexandria_700Bold });

  useEffect(() => {
    checkIfCompleted();
  }, []);

  const checkIfCompleted = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/intake-questionnaire`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        if (data && data.answers) {
          setSavedAnswers(data.answers);
          setCompleted(true);
        }
      }
    } catch (error) {
      const localCompleted = await AsyncStorage.getItem('intake_completed');
      if (localCompleted) {
        setCompleted(true);
      }
    }
  };

  const handleAnswer = (questionId: number, answer: any) => {
    setAnswers({ ...answers, [questionId]: answer });
  };

  const handleCheckbox = (questionId: number, option: string) => {
    const current = answers[questionId] || [];
    if (current.includes(option)) {
      handleAnswer(questionId, current.filter((o: string) => o !== option));
    } else {
      handleAnswer(questionId, [...current, option]);
    }
  };

  const canProceed = () => {
    const q = QUESTIONS[currentQuestion];
    if (!q.required) return true;
    const answer = answers[q.id];
    if (!answer) return false;
    if (Array.isArray(answer) && answer.length === 0) return false;
    if (typeof answer === 'string' && answer.trim() === '') return false;
    return true;
  };

  const handleNext = () => {
    if (currentQuestion < QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      await fetch(`${API_URL}/api/intake-questionnaire`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ answers })
      });
      
      await AsyncStorage.setItem('intake_completed', 'true');
      setSavedAnswers(answers);
      setCompleted(true);
    } catch (error) {
      Alert.alert('خطأ', 'فشل في حفظ الإجابات');
    } finally {
      setLoading(false);
    }
  };

  const renderQuestion = (q: Question) => {
    switch (q.type) {
      case 'radio':
        return (
          <View style={styles.optionsContainer}>
            {q.options?.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionBtn,
                  answers[q.id] === option && styles.optionBtnSelected
                ]}
                onPress={() => handleAnswer(q.id, option)}
              >
                <View style={[
                  styles.radioCircle,
                  answers[q.id] === option && styles.radioCircleSelected
                ]}>
                  {answers[q.id] === option && <View style={styles.radioInner} />}
                </View>
                <Text style={[
                  styles.optionText,
                  answers[q.id] === option && styles.optionTextSelected
                ]}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case 'checkbox':
        return (
          <View style={styles.optionsContainer}>
            {q.options?.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionBtn,
                  (answers[q.id] || []).includes(option) && styles.optionBtnSelected
                ]}
                onPress={() => handleCheckbox(q.id, option)}
              >
                <View style={[
                  styles.checkBox,
                  (answers[q.id] || []).includes(option) && styles.checkBoxSelected
                ]}>
                  {(answers[q.id] || []).includes(option) && (
                    <Ionicons name="checkmark" size={16} color={COLORS.primary} />
                  )}
                </View>
                <Text style={[
                  styles.optionText,
                  (answers[q.id] || []).includes(option) && styles.optionTextSelected
                ]}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case 'scale':
        return (
          <View style={styles.scaleContainer}>
            <View style={styles.scaleLabels}>
              <Text style={styles.scaleLabel}>ممتاز</Text>
              <Text style={styles.scaleLabel}>ضعيف</Text>
            </View>
            <View style={styles.scaleButtons}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <TouchableOpacity
                  key={num}
                  style={[
                    styles.scaleBtn,
                    answers[q.id] === num && styles.scaleBtnSelected
                  ]}
                  onPress={() => handleAnswer(q.id, num)}
                >
                  <Text style={[
                    styles.scaleBtnText,
                    answers[q.id] === num && styles.scaleBtnTextSelected
                  ]}>{num}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 'text':
        return (
          <TextInput
            style={styles.textInput}
            value={answers[q.id] || ''}
            onChangeText={(text) => handleAnswer(q.id, text)}
            placeholder="اكتب إجابتك هنا..."
            placeholderTextColor={COLORS.textMuted}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        );
    }
  };

  const getAnalysis = () => {
    const data = savedAnswers || answers;
    if (!data) return null;

    const focusAreas = data[2] || [];
    const energyLevel = data[3] || 5;
    const commitmentLevel = data[5] || 5;

    let recommendations = [];

    if (focusAreas.includes('الصحة الجسدية')) {
      recommendations.push('🏃 برنامج لياقة بدنية مخصص');
    }
    if (focusAreas.includes('الصحة النفسية')) {
      recommendations.push('🧘 جلسات تأمل وإدارة التوتر');
    }
    if (focusAreas.includes('العلاقات')) {
      recommendations.push('💬 تطوير مهارات التواصل');
    }
    if (focusAreas.includes('العمل والمهنة')) {
      recommendations.push('📈 تخطيط مسار مهني');
    }
    if (focusAreas.includes('الروحانية')) {
      recommendations.push('🌟 تعزيز الجانب الروحي');
    }

    let focusMessage = '';
    if (energyLevel <= 4) {
      focusMessage = 'لاحظنا أن مستوى طاقتك منخفض. سنعمل على تحسين ذلك أولاً!';
    } else if (energyLevel >= 8) {
      focusMessage = 'مستوى طاقتك ممتاز! هذا سيساعدك على التقدم بسرعة.';
    } else {
      focusMessage = 'مستوى طاقتك جيد ويمكن تحسينه أكثر.';
    }

    return { focusAreas, energyLevel, commitmentLevel, recommendations, focusMessage };
  };

  const renderResults = () => {
    const analysis = getAnalysis();
    const data = savedAnswers || {};

    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-forward" size={24} color={COLORS.gold} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>نتائج الاستبيان</Text>
        </View>

        <ScrollView contentContainerStyle={styles.resultsContent}>
          <View style={styles.completionBadge}>
            <Ionicons name="checkmark-circle" size={60} color={COLORS.gold} />
            <Text style={styles.completionTitle}>تم إكمال الاستبيان! 🎉</Text>
          </View>

          <View style={styles.resultCard}>
            <View style={styles.resultCardHeader}>
              <Text style={styles.resultCardTitle}>هدفك الرئيسي</Text>
              <Ionicons name="flag" size={24} color={COLORS.gold} />
            </View>
            <Text style={styles.resultCardValue}>{data[1] || 'لم يحدد'}</Text>
          </View>

          <View style={styles.resultCard}>
            <View style={styles.resultCardHeader}>
              <Text style={styles.resultCardTitle}>مجالات التركيز</Text>
              <Ionicons name="layers" size={24} color={COLORS.gold} />
            </View>
            <View style={styles.tagsContainer}>
              {(data[2] || []).map((area: string, index: number) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{area}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.metricsRow}>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{data[3] || 5}/10</Text>
              <Text style={styles.metricLabel}>مستوى الطاقة</Text>
              <Ionicons name="flash" size={20} color={data[3] >= 7 ? COLORS.success : data[3] >= 4 ? COLORS.warning : COLORS.error} />
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{data[5] || 5}/10</Text>
              <Text style={styles.metricLabel}>مستوى الالتزام</Text>
              <Ionicons name="heart" size={20} color={data[5] >= 7 ? COLORS.success : data[5] >= 4 ? COLORS.warning : COLORS.error} />
            </View>
          </View>

          <View style={styles.resultCard}>
            <View style={styles.resultCardHeader}>
              <Text style={styles.resultCardTitle}>الوقت المتاح أسبوعياً</Text>
              <Ionicons name="time" size={24} color={COLORS.gold} />
            </View>
            <Text style={styles.resultCardValue}>{data[6] || 'لم يحدد'}</Text>
          </View>

          {analysis && analysis.recommendations.length > 0 && (
            <View style={styles.recommendationsCard}>
              <Text style={styles.recommendationsTitle}>التوصيات المقترحة</Text>
              <Text style={styles.focusMessage}>{analysis.focusMessage}</Text>
              {analysis.recommendations.map((rec: string, index: number) => (
                <View key={index} style={styles.recommendationItem}>
                  <Text style={styles.recommendationText}>{rec}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              style={styles.bookBtn}
              onPress={() => router.push('/(tabs)/bookings')}
            >
              <Ionicons name="calendar" size={20} color={COLORS.primary} />
              <Text style={styles.bookBtnText}>احجز جلستك الأولى</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.retakeBtn} 
              onPress={() => { 
                setCompleted(false); 
                setCurrentQuestion(0); 
                setAnswers({}); 
                setSavedAnswers(null);
                AsyncStorage.removeItem('intake_completed');
              }}
            >
              <Ionicons name="refresh" size={20} color={COLORS.gold} />
              <Text style={styles.retakeBtnText}>إعادة الاستبيان</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  };

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.gold} />
      </View>
    );
  }

  if (completed) {
    return renderResults();
  }

  const question = QUESTIONS[currentQuestion];
  const progress = ((currentQuestion + 1) / QUESTIONS.length) * 100;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color={COLORS.gold} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>استبيان القبول</Text>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>{currentQuestion + 1} / {QUESTIONS.length}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.questionNumber}>السؤال {currentQuestion + 1}</Text>
        <Text style={styles.questionText}>{question.question}</Text>
        {!question.required && <Text style={styles.optionalText}>(اختياري)</Text>}

        {renderQuestion(question)}
      </ScrollView>

      <View style={styles.footer}>
        {currentQuestion > 0 && (
          <TouchableOpacity
            style={styles.prevBtn}
            onPress={() => setCurrentQuestion(currentQuestion - 1)}
          >
            <Ionicons name="arrow-forward" size={20} color={COLORS.gold} />
            <Text style={styles.prevBtnText}>السابق</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.nextBtn, !canProceed() && styles.nextBtnDisabled]}
          onPress={handleNext}
          disabled={!canProceed() || loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : (
            <>
              <Text style={styles.nextBtnText}>
                {currentQuestion === QUESTIONS.length - 1 ? 'إرسال' : 'التالي'}
              </Text>
              <Ionicons name="arrow-back" size={20} color={COLORS.primary} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.primary },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.secondary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border},
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16},
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: COLORS.gold,
    textAlign: 'right'},

  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.secondary,
    gap: 12},
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: 'hidden'},
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.gold,
    borderRadius: 4},
  progressText: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: COLORS.textMuted},

  content: {
    padding: 20,
    paddingBottom: 100},
  questionNumber: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.gold,
    textAlign: 'right',
    marginBottom: 8},
  questionText: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    textAlign: 'right',
    lineHeight: 32,
    marginBottom: 8},
  optionalText: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    textAlign: 'right',
    marginBottom: 20},

  optionsContainer: {
    marginTop: 20},
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border},
  optionBtnSelected: {
    borderColor: COLORS.gold,
    backgroundColor: 'rgba(212, 175, 55, 0.1)'},
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.textMuted,
    marginLeft: 12,
    justifyContent: 'center',
    alignItems: 'center'},
  radioCircleSelected: {
    borderColor: COLORS.gold},
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.gold},
  checkBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.textMuted,
    marginLeft: 12,
    justifyContent: 'center',
    alignItems: 'center'},
  checkBoxSelected: {
    borderColor: COLORS.gold,
    backgroundColor: COLORS.gold},
  optionText: {
    flex: 1,
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: COLORS.text,
    textAlign: 'right'},
  optionTextSelected: {
    fontFamily: FONTS.semiBold,
    color: COLORS.gold},

  scaleContainer: {
    marginTop: 20},
  scaleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12},
  scaleLabel: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted},
  scaleButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between'},
  scaleBtn: {
    width: 32,
    height: 40,
    borderRadius: 8,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border},
  scaleBtnSelected: {
    borderColor: COLORS.gold,
    backgroundColor: COLORS.gold},
  scaleBtnText: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: COLORS.textMuted},
  scaleBtnTextSelected: {
    color: COLORS.primary},

  textInput: {
    backgroundColor: COLORS.secondary,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: COLORS.text,
    textAlign: 'right',
    minHeight: 120,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 20},

  footer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: COLORS.secondary,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 12},
  prevBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.gold,
    gap: 8},
  prevBtnText: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.gold},
  nextBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.gold,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8},
  nextBtnDisabled: {
    backgroundColor: COLORS.border},
  nextBtnText: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.primary},

  // Results Styles
  resultsContent: {
    padding: 16,
    paddingBottom: 100},
  completionBadge: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: COLORS.secondary,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border},
  completionTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: COLORS.gold,
    marginTop: 12},
  resultCard: {
    backgroundColor: COLORS.secondary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border},
  resultCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12},
  resultCardTitle: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.text},
  resultCardValue: {
    fontSize: 15,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    textAlign: 'right',
    lineHeight: 24},
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8},
  tag: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.gold},
  tagText: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: COLORS.gold},
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12},
  metricCard: {
    flex: 1,
    backgroundColor: COLORS.secondary,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border},
  metricValue: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    color: COLORS.gold},
  metricLabel: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    marginTop: 4,
    marginBottom: 8},
  recommendationsCard: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.gold},
  recommendationsTitle: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.gold,
    marginBottom: 8,
    textAlign: 'right'},
  focusMessage: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.text,
    marginBottom: 12,
    textAlign: 'right',
    lineHeight: 22},
  recommendationItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.2)'},
  recommendationText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.text,
    textAlign: 'right'},
  actionsContainer: {
    marginTop: 8,
    gap: 12},
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.gold,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8},
  bookBtnText: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.primary},
  retakeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.gold,
    gap: 8},
  retakeBtnText: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.gold}});
