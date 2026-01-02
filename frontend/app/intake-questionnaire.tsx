import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFonts, Cairo_400Regular, Cairo_700Bold } from '@expo-google-fonts/cairo';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
    question: 'ما هي المجالات التي تريد التركيز عليها؟ (يمكنك اختيار أكثر من واحد)',
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
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: any }>({});
  const [savedAnswers, setSavedAnswers] = useState<{ [key: number]: any } | null>(null);
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const router = useRouter();

  const [fontsLoaded] = useFonts({ Cairo_400Regular, Cairo_700Bold });

  useEffect(() => {
    checkIfCompleted();
  }, []);

  const checkIfCompleted = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      // Try to fetch saved questionnaire from server
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
      // Fallback to local storage
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
      setCompleted(true);
      Alert.alert(
        'شكراً لك! 🎉',
        'تم حفظ إجاباتك بنجاح. سيساعدنا هذا في تقديم تجربة تدريب مخصصة لك.',
        [{ text: 'حسناً', onPress: () => router.back() }]
      );
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
                    <Ionicons name="checkmark" size={16} color="#fff" />
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
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        );
    }
  };

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF9800" />
      </View>
    );
  }

  if (completed) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-forward" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>استبيان القبول</Text>
        </View>
        <View style={styles.completedState}>
          <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
          <Text style={styles.completedTitle}>تم إكمال الاستبيان ✅</Text>
          <Text style={styles.completedText}>شكراً لك! لقد أكملت استبيان القبول بنجاح.</Text>
          <TouchableOpacity style={styles.retakeBtn} onPress={() => { setCompleted(false); setCurrentQuestion(0); setAnswers({}); }}>
            <Text style={styles.retakeBtnText}>إعادة الاستبيان</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const question = QUESTIONS[currentQuestion];
  const progress = ((currentQuestion + 1) / QUESTIONS.length) * 100;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color="#fff" />
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
            <Ionicons name="arrow-forward" size={20} color="#FF9800" />
            <Text style={styles.prevBtnText}>السابق</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.nextBtn, !canProceed() && styles.nextBtnDisabled]}
          onPress={handleNext}
          disabled={!canProceed() || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.nextBtnText}>
                {currentQuestion === QUESTIONS.length - 1 ? 'إرسال' : 'التالي'}
              </Text>
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
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

  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF9800',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontFamily: 'Cairo_700Bold',
    color: '#666',
  },

  content: {
    padding: 20,
    paddingBottom: 100,
  },
  questionNumber: {
    fontSize: 14,
    fontFamily: 'Cairo_400Regular',
    color: '#FF9800',
    textAlign: 'right',
    marginBottom: 8,
  },
  questionText: {
    fontSize: 20,
    fontFamily: 'Cairo_700Bold',
    color: '#333',
    textAlign: 'right',
    lineHeight: 32,
    marginBottom: 8,
  },
  optionalText: {
    fontSize: 13,
    fontFamily: 'Cairo_400Regular',
    color: '#999',
    textAlign: 'right',
    marginBottom: 20,
  },

  optionsContainer: {
    marginTop: 20,
  },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  optionBtnSelected: {
    borderColor: '#FF9800',
    backgroundColor: '#FFF3E0',
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ccc',
    marginLeft: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleSelected: {
    borderColor: '#FF9800',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF9800',
  },
  checkBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#ccc',
    marginLeft: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkBoxSelected: {
    borderColor: '#FF9800',
    backgroundColor: '#FF9800',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Cairo_400Regular',
    color: '#333',
    textAlign: 'right',
  },
  optionTextSelected: {
    fontFamily: 'Cairo_700Bold',
    color: '#FF9800',
  },

  scaleContainer: {
    marginTop: 20,
  },
  scaleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  scaleLabel: {
    fontSize: 13,
    fontFamily: 'Cairo_400Regular',
    color: '#666',
  },
  scaleButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scaleBtn: {
    width: 32,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  scaleBtnSelected: {
    borderColor: '#FF9800',
    backgroundColor: '#FF9800',
  },
  scaleBtnText: {
    fontSize: 14,
    fontFamily: 'Cairo_700Bold',
    color: '#666',
  },
  scaleBtnTextSelected: {
    color: '#fff',
  },

  textInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Cairo_400Regular',
    color: '#333',
    textAlign: 'right',
    minHeight: 120,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    marginTop: 20,
  },

  footer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 12,
  },
  prevBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FF9800',
    gap: 8,
  },
  prevBtnText: {
    fontSize: 16,
    fontFamily: 'Cairo_700Bold',
    color: '#FF9800',
  },
  nextBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF9800',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  nextBtnDisabled: {
    backgroundColor: '#ccc',
  },
  nextBtnText: {
    fontSize: 16,
    fontFamily: 'Cairo_700Bold',
    color: '#fff',
  },

  completedState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  completedTitle: {
    fontSize: 24,
    fontFamily: 'Cairo_700Bold',
    color: '#333',
    marginTop: 20,
  },
  completedText: {
    fontSize: 16,
    fontFamily: 'Cairo_400Regular',
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 26,
  },
  retakeBtn: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#FF9800',
  },
  retakeBtnText: {
    fontSize: 16,
    fontFamily: 'Cairo_700Bold',
    color: '#FF9800',
  },
});
