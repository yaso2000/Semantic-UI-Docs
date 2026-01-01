import React, { useState } from 'react';
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

const questions = [
  'في الشهر الماضي، كم مرة شعرت بالانزعاج بسبب شيء حدث بشكل غير متوقع؟',
  'في الشهر الماضي، كم مرة شعرت أنك غير قادر على التحكم في الأمور المهمة في حياتك؟',
  'في الشهر الماضي، كم مرة شعرت بالتوتر والضغط؟',
  'في الشهر الماضي، كم مرة شعرت بالثقة في قدرتك على التعامل مع مشاكلك الشخصية؟',
  'في الشهر الماضي، كم مرة شعرت أن الأمور تسير في صالحك؟',
  'في الشهر الماضي، كم مرة وجدت أنك لا تستطيع التعامل مع كل الأشياء التي يجب عليك القيام بها؟',
  'في الشهر الماضي، كم مرة كنت قادراً على السيطرة على مصادر الإزعاج في حياتك؟',
  'في الشهر الماضي، كم مرة شعرت أنك مسيطر على الأمور؟',
  'في الشهر الماضي، كم مرة شعرت بالغضب بسبب أمور خارجة عن سيطرتك؟',
  'في الشهر الماضي، كم مرة شعرت أن الصعوبات تتراكم لدرجة أنك لا تستطيع التغلب عليها؟',
];

const options = [
  { label: 'أبداً', value: 0 },
  { label: 'تقريباً أبداً', value: 1 },
  { label: 'أحياناً', value: 2 },
  { label: 'غالباً', value: 3 },
  { label: 'كثيراً جداً', value: 4 },
];

// Questions 4, 5, 7, 8 are reverse scored
const reverseScored = [3, 4, 6, 7];

export default function PSS10Screen() {
  const router = useRouter();
  const [answers, setAnswers] = useState<number[]>(Array(10).fill(-1));
  const [result, setResult] = useState<any>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  
  const [fontsLoaded] = useFonts({ Cairo_400Regular, Cairo_700Bold });

  const handleAnswer = (value: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = value;
    setAnswers(newAnswers);
    
    if (currentQuestion < 9) {
      setTimeout(() => setCurrentQuestion(currentQuestion + 1), 300);
    }
  };

  const calculateScore = () => {
    if (answers.includes(-1)) {
      Alert.alert('تنبيه', 'الرجاء الإجابة على جميع الأسئلة');
      return;
    }

    let score = 0;
    answers.forEach((answer, index) => {
      if (reverseScored.includes(index)) {
        score += (4 - answer);
      } else {
        score += answer;
      }
    });

    let level = '';
    let color = '';
    let advice = '';

    if (score <= 13) {
      level = 'توتر منخفض';
      color = '#4CAF50';
      advice = 'مستوى التوتر لديك منخفض. استمر في الحفاظ على توازنك النفسي.';
    } else if (score <= 26) {
      level = 'توتر متوسط';
      color = '#FF9800';
      advice = 'مستوى التوتر لديك متوسط. قد تستفيد من تقنيات الاسترخاء والتأمل.';
    } else {
      level = 'توتر مرتفع';
      color = '#F44336';
      advice = 'مستوى التوتر لديك مرتفع. يُنصح بالتحدث مع مختص والعمل على إدارة التوتر.';
    }

    setResult({ score, level, color, advice });
  };

  const resetTest = () => {
    setAnswers(Array(10).fill(-1));
    setCurrentQuestion(0);
    setResult(null);
  };

  if (!fontsLoaded) return null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navigationHeader}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>مقياس التوتر المُدرَك</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.disclaimer}>
          <Ionicons name="information-circle" size={20} color="#FF9800" />
          <Text style={styles.disclaimerText}>
            هذه النتائج للوعي الذاتي وأغراض التدريب فقط ولا تشكل تشخيصاً طبياً
          </Text>
        </View>

        {!result ? (
          <>
            <View style={styles.header}>
              <Ionicons name="brain" size={50} color="#9C27B0" />
              <Text style={styles.title}>مقياس التوتر المُدرَك (PSS-10)</Text>
              <Text style={styles.subtitle}>Perceived Stress Scale</Text>
            </View>

            <View style={styles.progress}>
              <Text style={styles.progressText}>السؤال {currentQuestion + 1} من 10</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${((currentQuestion + 1) / 10) * 100}%` }]} />
              </View>
            </View>

            <View style={styles.questionCard}>
              <Text style={styles.questionText}>{questions[currentQuestion]}</Text>
              
              <View style={styles.optionsContainer}>
                {options.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.optionButton,
                      answers[currentQuestion] === option.value && styles.optionSelected,
                    ]}
                    onPress={() => handleAnswer(option.value)}
                  >
                    <Text style={[
                      styles.optionText,
                      answers[currentQuestion] === option.value && styles.optionTextSelected,
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.navigation}>
              <TouchableOpacity
                style={[styles.navButton, currentQuestion === 0 && styles.navButtonDisabled]}
                onPress={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                disabled={currentQuestion === 0}
              >
                <Ionicons name="chevron-forward" size={24} color={currentQuestion === 0 ? '#ccc' : '#9C27B0'} />
                <Text style={[styles.navButtonText, currentQuestion === 0 && styles.navButtonTextDisabled]}>السابق</Text>
              </TouchableOpacity>

              {currentQuestion === 9 ? (
                <TouchableOpacity style={styles.submitButton} onPress={calculateScore}>
                  <Text style={styles.submitButtonText}>عرض النتيجة</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.navButton, answers[currentQuestion] === -1 && styles.navButtonDisabled]}
                  onPress={() => setCurrentQuestion(currentQuestion + 1)}
                  disabled={answers[currentQuestion] === -1}
                >
                  <Text style={[styles.navButtonText, answers[currentQuestion] === -1 && styles.navButtonTextDisabled]}>التالي</Text>
                  <Ionicons name="chevron-back" size={24} color={answers[currentQuestion] === -1 ? '#ccc' : '#9C27B0'} />
                </TouchableOpacity>
              )}
            </View>
          </>
        ) : (
          <View style={styles.resultContainer}>
            <View style={[styles.resultCircle, { backgroundColor: result.color }]}>
              <Text style={styles.resultScore}>{result.score}</Text>
              <Text style={styles.resultMax}>/ 40</Text>
            </View>
            <Text style={[styles.resultLevel, { color: result.color }]}>{result.level}</Text>
            <Text style={styles.resultAdvice}>{result.advice}</Text>
            
            <View style={styles.scaleInfo}>
              <View style={styles.scaleItem}>
                <View style={[styles.scaleColor, { backgroundColor: '#4CAF50' }]} />
                <Text style={styles.scaleText}>0-13: توتر منخفض</Text>
              </View>
              <View style={styles.scaleItem}>
                <View style={[styles.scaleColor, { backgroundColor: '#FF9800' }]} />
                <Text style={styles.scaleText}>14-26: توتر متوسط</Text>
              </View>
              <View style={styles.scaleItem}>
                <View style={[styles.scaleColor, { backgroundColor: '#F44336' }]} />
                <Text style={styles.scaleText}>27-40: توتر مرتفع</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.resetButton} onPress={resetTest}>
              <Text style={styles.resetButtonText}>إعادة الاختبار</Text>
            </TouchableOpacity>
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
  title: { fontSize: 22, fontFamily: 'Cairo_700Bold', color: '#333', marginTop: 12, textAlign: 'center' },
  subtitle: { fontSize: 14, fontFamily: 'Cairo_400Regular', color: '#666', marginTop: 4 },
  progress: { marginBottom: 20 },
  progressText: { fontSize: 14, fontFamily: 'Cairo_700Bold', color: '#666', textAlign: 'center', marginBottom: 8 },
  progressBar: { height: 8, backgroundColor: '#e0e0e0', borderRadius: 4 },
  progressFill: { height: '100%', backgroundColor: '#9C27B0', borderRadius: 4 },
  questionCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 20 },
  questionText: { fontSize: 18, fontFamily: 'Cairo_700Bold', color: '#333', textAlign: 'right', lineHeight: 28, marginBottom: 20 },
  optionsContainer: { gap: 10 },
  optionButton: { padding: 16, borderRadius: 12, backgroundColor: '#f5f5f5', borderWidth: 2, borderColor: 'transparent' },
  optionSelected: { backgroundColor: '#F3E5F5', borderColor: '#9C27B0' },
  optionText: { fontSize: 16, fontFamily: 'Cairo_400Regular', color: '#333', textAlign: 'center' },
  optionTextSelected: { fontFamily: 'Cairo_700Bold', color: '#9C27B0' },
  navigation: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  navButton: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 4 },
  navButtonDisabled: { opacity: 0.5 },
  navButtonText: { fontSize: 16, fontFamily: 'Cairo_700Bold', color: '#9C27B0' },
  navButtonTextDisabled: { color: '#ccc' },
  submitButton: { backgroundColor: '#9C27B0', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
  submitButtonText: { fontSize: 16, fontFamily: 'Cairo_700Bold', color: '#fff' },
  resultContainer: { alignItems: 'center', paddingVertical: 20 },
  resultCircle: { width: 140, height: 140, borderRadius: 70, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  resultScore: { fontSize: 48, fontFamily: 'Cairo_700Bold', color: '#fff' },
  resultMax: { fontSize: 18, fontFamily: 'Cairo_400Regular', color: '#fff' },
  resultLevel: { fontSize: 28, fontFamily: 'Cairo_700Bold', marginBottom: 12 },
  resultAdvice: { fontSize: 16, fontFamily: 'Cairo_400Regular', color: '#666', textAlign: 'center', lineHeight: 26, marginBottom: 24, paddingHorizontal: 20 },
  scaleInfo: { backgroundColor: '#fff', borderRadius: 16, padding: 20, width: '100%', marginBottom: 20 },
  scaleItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 },
  scaleColor: { width: 20, height: 20, borderRadius: 10 },
  scaleText: { fontSize: 14, fontFamily: 'Cairo_400Regular', color: '#333' },
  resetButton: { backgroundColor: '#9C27B0', paddingHorizontal: 40, paddingVertical: 14, borderRadius: 12 },
  resetButtonText: { fontSize: 16, fontFamily: 'Cairo_700Bold', color: '#fff' },
});