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
  'شعرت بالبهجة والمزاج الجيد',
  'شعرت بالهدوء والاسترخاء',
  'شعرت بالنشاط والحيوية',
  'استيقظت وأنا أشعر بالانتعاش والراحة',
  'كانت حياتي اليومية مليئة بأشياء تثير اهتمامي',
];

const options = [
  { label: 'طوال الوقت', value: 5 },
  { label: 'معظم الوقت', value: 4 },
  { label: 'أكثر من نصف الوقت', value: 3 },
  { label: 'أقل من نصف الوقت', value: 2 },
  { label: 'بعض الوقت', value: 1 },
  { label: 'في أي وقت', value: 0 },
];

export default function WHO5Screen() {
  const router = useRouter();
  const [answers, setAnswers] = useState<number[]>(Array(5).fill(-1));
  const [result, setResult] = useState<any>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  
  const [fontsLoaded] = useFonts({ Cairo_400Regular, Cairo_700Bold });

  const handleAnswer = (value: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = value;
    setAnswers(newAnswers);
    
    if (currentQuestion < 4) {
      setTimeout(() => setCurrentQuestion(currentQuestion + 1), 300);
    }
  };

  const calculateScore = () => {
    if (answers.includes(-1)) {
      Alert.alert('تنبيه', 'الرجاء الإجابة على جميع الأسئلة');
      return;
    }

    const rawScore = answers.reduce((a, b) => a + b, 0);
    const percentageScore = rawScore * 4; // Convert to 0-100 scale
    
    let level = '';
    let color = '';
    let advice = '';

    if (percentageScore >= 52) {
      level = 'رفاهية نفسية جيدة';
      color = '#4CAF50';
      advice = 'صحتك النفسية في حالة جيدة! استمر في الحفاظ على عاداتك الإيجابية.';
    } else if (percentageScore >= 28) {
      level = 'رفاهية نفسية متوسطة';
      color = '#FF9800';
      advice = 'صحتك النفسية بحاجة لبعض الاهتمام. جرب ممارسة الرياضة والتأمل.';
    } else {
      level = 'رفاهية نفسية منخفضة';
      color = '#F44336';
      advice = 'قد تستفيد من التحدث مع مختص. صحتك النفسية مهمة ولا تتردد في طلب المساعدة.';
    }

    setResult({ rawScore, percentageScore, level, color, advice });
  };

  const resetTest = () => {
    setAnswers(Array(5).fill(-1));
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
        <Text style={styles.navTitle}>مؤشر الرفاهية WHO-5</Text>
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
              <Ionicons name="sunny" size={50} color="#2196F3" />
              <Text style={styles.title}>مؤشر الرفاهية WHO-5</Text>
              <Text style={styles.subtitle}>خلال الأسبوعين الماضيين...</Text>
            </View>

            <View style={styles.progress}>
              <Text style={styles.progressText}>السؤال {currentQuestion + 1} من 5</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${((currentQuestion + 1) / 5) * 100}%` }]} />
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
                <Ionicons name="chevron-forward" size={24} color={currentQuestion === 0 ? '#ccc' : '#2196F3'} />
                <Text style={[styles.navButtonText, currentQuestion === 0 && styles.navButtonTextDisabled]}>السابق</Text>
              </TouchableOpacity>

              {currentQuestion === 4 ? (
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
                  <Ionicons name="chevron-back" size={24} color={answers[currentQuestion] === -1 ? '#ccc' : '#2196F3'} />
                </TouchableOpacity>
              )}
            </View>
          </>
        ) : (
          <View style={styles.resultContainer}>
            <View style={[styles.resultCircle, { backgroundColor: result.color }]}>
              <Text style={styles.resultScore}>{result.percentageScore}%</Text>
            </View>
            <Text style={[styles.resultLevel, { color: result.color }]}>{result.level}</Text>
            <Text style={styles.resultAdvice}>{result.advice}</Text>
            
            <View style={styles.scaleInfo}>
              <Text style={styles.scaleTitle}>مقياس التفسير:</Text>
              <View style={styles.scaleItem}>
                <View style={[styles.scaleColor, { backgroundColor: '#4CAF50' }]} />
                <Text style={styles.scaleText}>52-100%: رفاهية نفسية جيدة</Text>
              </View>
              <View style={styles.scaleItem}>
                <View style={[styles.scaleColor, { backgroundColor: '#FF9800' }]} />
                <Text style={styles.scaleText}>28-51%: رفاهية نفسية متوسطة</Text>
              </View>
              <View style={styles.scaleItem}>
                <View style={[styles.scaleColor, { backgroundColor: '#F44336' }]} />
                <Text style={styles.scaleText}>0-27%: رفاهية نفسية منخفضة</Text>
              </View>
              <Text style={styles.noteText}>
                ملاحظة: درجة أقل من 50% قد تشير إلى الحاجة لمزيد من الدعم النفسي.
              </Text>
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
  progressFill: { height: '100%', backgroundColor: '#2196F3', borderRadius: 4 },
  questionCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 20 },
  questionText: { fontSize: 18, fontFamily: 'Cairo_700Bold', color: '#333', textAlign: 'right', lineHeight: 28, marginBottom: 20 },
  optionsContainer: { gap: 10 },
  optionButton: { padding: 14, borderRadius: 12, backgroundColor: '#f5f5f5', borderWidth: 2, borderColor: 'transparent' },
  optionSelected: { backgroundColor: '#E3F2FD', borderColor: '#2196F3' },
  optionText: { fontSize: 15, fontFamily: 'Cairo_400Regular', color: '#333', textAlign: 'center' },
  optionTextSelected: { fontFamily: 'Cairo_700Bold', color: '#2196F3' },
  navigation: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  navButton: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 4 },
  navButtonDisabled: { opacity: 0.5 },
  navButtonText: { fontSize: 16, fontFamily: 'Cairo_700Bold', color: '#2196F3' },
  navButtonTextDisabled: { color: '#ccc' },
  submitButton: { backgroundColor: '#2196F3', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
  submitButtonText: { fontSize: 16, fontFamily: 'Cairo_700Bold', color: '#fff' },
  resultContainer: { alignItems: 'center', paddingVertical: 20 },
  resultCircle: { width: 140, height: 140, borderRadius: 70, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  resultScore: { fontSize: 36, fontFamily: 'Cairo_700Bold', color: '#fff' },
  resultLevel: { fontSize: 24, fontFamily: 'Cairo_700Bold', marginBottom: 12 },
  resultAdvice: { fontSize: 16, fontFamily: 'Cairo_400Regular', color: '#666', textAlign: 'center', lineHeight: 26, marginBottom: 24, paddingHorizontal: 20 },
  scaleInfo: { backgroundColor: '#fff', borderRadius: 16, padding: 20, width: '100%', marginBottom: 20 },
  scaleTitle: { fontSize: 16, fontFamily: 'Cairo_700Bold', color: '#333', marginBottom: 12, textAlign: 'right' },
  scaleItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 12 },
  scaleColor: { width: 20, height: 20, borderRadius: 10 },
  scaleText: { fontSize: 13, fontFamily: 'Cairo_400Regular', color: '#333' },
  noteText: { fontSize: 12, fontFamily: 'Cairo_400Regular', color: '#666', marginTop: 12, textAlign: 'right', lineHeight: 20 },
  resetButton: { backgroundColor: '#2196F3', paddingHorizontal: 40, paddingVertical: 14, borderRadius: 12 },
  resetButtonText: { fontSize: 16, fontFamily: 'Cairo_700Bold', color: '#fff' },
});