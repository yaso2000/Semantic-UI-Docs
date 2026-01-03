import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  
  Alert} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Cairo_400Regular, Cairo_700Bold } from '@expo-google-fonts/cairo';
import { useRouter } from 'expo-router';

const questions = [
  'الشعور بالتوتر أو القلق أو التوتر الشديد',
  'عدم القدرة على إيقاف القلق أو السيطرة عليه',
  'القلق المفرط حول أمور مختلفة',
  'صعوبة في الاسترخاء',
  'الشعور بعدم الراحة لدرجة صعوبة الجلوس ساكناً',
  'الانزعاج بسهولة أو الشعور بالتوتر',
  'الشعور بالخوف كما لو أن شيئاً سيئاً قد يحدث',
];

const options = [
  { label: 'أبداً', value: 0 },
  { label: 'عدة أيام', value: 1 },
  { label: 'أكثر من نصف الأيام', value: 2 },
  { label: 'تقريباً كل يوم', value: 3 },
];

export default function GAD7Screen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [answers, setAnswers] = useState<number[]>(Array(7).fill(-1));
  const [result, setResult] = useState<any>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  
  const [fontsLoaded] = useFonts({ Cairo_400Regular, Cairo_700Bold });

  const handleAnswer = (value: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = value;
    setAnswers(newAnswers);
    
    if (currentQuestion < 6) {
      setTimeout(() => setCurrentQuestion(currentQuestion + 1), 300);
    }
  };

  const calculateScore = () => {
    if (answers.includes(-1)) {
      Alert.alert('تنبيه', 'الرجاء الإجابة على جميع الأسئلة');
      return;
    }

    const score = answers.reduce((a, b) => a + b, 0);
    let level = '';
    let color = '';
    let advice = '';

    if (score <= 4) {
      level = 'قلق بسيط';
      color = '#4CAF50';
      advice = 'مستوى القلق لديك طبيعي. استمر في الحفاظ على صحتك النفسية.';
    } else if (score <= 9) {
      level = 'قلق خفيف';
      color = '#8BC34A';
      advice = 'لديك بعض أعراض القلق الخفيفة. تقنيات الاسترخاء قد تساعدك.';
    } else if (score <= 14) {
      level = 'قلق متوسط';
      color = '#FF9800';
      advice = 'مستوى القلق لديك متوسط. يُنصح بممارسة التأمل والتحدث مع مختص.';
    } else {
      level = 'قلق شديد';
      color = '#F44336';
      advice = 'مستوى القلق لديك مرتفع. يُنصح بشدة باستشارة مختص في الصحة النفسية.';
    }

    setResult({ score, level, color, advice });
  };

  const resetTest = () => {
    setAnswers(Array(7).fill(-1));
    setCurrentQuestion(0);
    setResult(null);
  };

  if (!fontsLoaded) return null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.navigationHeader}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>مقياس القلق العام</Text>
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
              <Ionicons name="pulse" size={50} color="#E91E63" />
              <Text style={styles.title}>مقياس القلق العام (GAD-7)</Text>
              <Text style={styles.subtitle}>خلال الأسبوعين الماضيين، كم مرة أزعجتك المشاكل التالية؟</Text>
            </View>

            <View style={styles.progress}>
              <Text style={styles.progressText}>السؤال {currentQuestion + 1} من 7</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${((currentQuestion + 1) / 7) * 100}%` }]} />
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
                <Ionicons name="chevron-forward" size={24} color={currentQuestion === 0 ? '#ccc' : '#E91E63'} />
                <Text style={[styles.navButtonText, currentQuestion === 0 && styles.navButtonTextDisabled]}>السابق</Text>
              </TouchableOpacity>

              {currentQuestion === 6 ? (
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
                  <Ionicons name="chevron-back" size={24} color={answers[currentQuestion] === -1 ? '#ccc' : '#E91E63'} />
                </TouchableOpacity>
              )}
            </View>
          </>
        ) : (
          <View style={styles.resultContainer}>
            <View style={[styles.resultCircle, { backgroundColor: result.color }]}>
              <Text style={styles.resultScore}>{result.score}</Text>
              <Text style={styles.resultMax}>/ 21</Text>
            </View>
            <Text style={[styles.resultLevel, { color: result.color }]}>{result.level}</Text>
            <Text style={styles.resultAdvice}>{result.advice}</Text>
            
            <View style={styles.scaleInfo}>
              <View style={styles.scaleItem}>
                <View style={[styles.scaleColor, { backgroundColor: '#4CAF50' }]} />
                <Text style={styles.scaleText}>0-4: قلق بسيط</Text>
              </View>
              <View style={styles.scaleItem}>
                <View style={[styles.scaleColor, { backgroundColor: '#8BC34A' }]} />
                <Text style={styles.scaleText}>5-9: قلق خفيف</Text>
              </View>
              <View style={styles.scaleItem}>
                <View style={[styles.scaleColor, { backgroundColor: '#FF9800' }]} />
                <Text style={styles.scaleText}>10-14: قلق متوسط</Text>
              </View>
              <View style={styles.scaleItem}>
                <View style={[styles.scaleColor, { backgroundColor: '#F44336' }]} />
                <Text style={styles.scaleText}>15-21: قلق شديد</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.resetButton} onPress={resetTest}>
              <Text style={styles.resetButtonText}>إعادة الاختبار</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
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
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8},
  disclaimerText: { flex: 1, fontSize: 12, fontFamily: 'Cairo_400Regular', color: '#F57C00', textAlign: 'right' },
  header: { alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 22, fontFamily: 'Cairo_700Bold', color: '#333', marginTop: 12, textAlign: 'center' },
  subtitle: { fontSize: 14, fontFamily: 'Cairo_400Regular', color: '#666', marginTop: 8, textAlign: 'center', lineHeight: 22 },
  progress: { marginBottom: 20 },
  progressText: { fontSize: 14, fontFamily: 'Cairo_700Bold', color: '#666', textAlign: 'center', marginBottom: 8 },
  progressBar: { height: 8, backgroundColor: '#e0e0e0', borderRadius: 4 },
  progressFill: { height: '100%', backgroundColor: '#E91E63', borderRadius: 4 },
  questionCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 20 },
  questionText: { fontSize: 18, fontFamily: 'Cairo_700Bold', color: '#333', textAlign: 'right', lineHeight: 28, marginBottom: 20 },
  optionsContainer: { gap: 10 },
  optionButton: { padding: 16, borderRadius: 12, backgroundColor: '#f5f5f5', borderWidth: 2, borderColor: 'transparent' },
  optionSelected: { backgroundColor: '#FCE4EC', borderColor: '#E91E63' },
  optionText: { fontSize: 16, fontFamily: 'Cairo_400Regular', color: '#333', textAlign: 'center' },
  optionTextSelected: { fontFamily: 'Cairo_700Bold', color: '#E91E63' },
  navigation: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  navButton: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 4 },
  navButtonDisabled: { opacity: 0.5 },
  navButtonText: { fontSize: 16, fontFamily: 'Cairo_700Bold', color: '#E91E63' },
  navButtonTextDisabled: { color: '#ccc' },
  submitButton: { backgroundColor: '#E91E63', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
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
  resetButton: { backgroundColor: '#E91E63', paddingHorizontal: 40, paddingVertical: 14, borderRadius: 12 },
  resetButtonText: { fontSize: 16, fontFamily: 'Cairo_700Bold', color: '#fff' }});