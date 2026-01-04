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
import { useSaveResult } from '../../src/hooks/useSaveResult';
import { ActivityIndicator } from 'react-native';


const questions = [
  'في معظم النواحي، حياتي قريبة من المثالية',
  'ظروف حياتي ممتازة',
  'أنا راضٍ عن حياتي',
  'حتى الآن، حصلت على الأشياء المهمة التي أريدها في الحياة',
  'لو عشت حياتي من جديد، لما غيرت أي شيء تقريباً',
];

const options = [
  { label: 'لا أوافق بشدة', value: 1 },
  { label: 'لا أوافق', value: 2 },
  { label: 'لا أوافق قليلاً', value: 3 },
  { label: 'محايد', value: 4 },
  { label: 'أوافق قليلاً', value: 5 },
  { label: 'أوافق', value: 6 },
  { label: 'أوافق بشدة', value: 7 },
];

export default function SWLSScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [answers, setAnswers] = useState<number[]>(Array(5).fill(0));
  const [result, setResult] = useState<any>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const { hasSubscription, saving, saveResult } = useSaveResult();
  
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
    if (answers.includes(0)) {
      Alert.alert('تنبيه', 'الرجاء الإجابة على جميع الأسئلة');
      return;
    }

    const score = answers.reduce((a, b) => a + b, 0);
    let level = '';
    let color = '';
    let advice = '';

    if (score <= 9) {
      level = 'غير راضٍ للغاية';
      color = '#F44336';
      advice = 'تشعر بعدم الرضا الكبير عن حياتك. قد يكون من المفيد التحدث مع مختص لمساعدتك.';
    } else if (score <= 14) {
      level = 'غير راضٍ';
      color = '#FF5722';
      advice = 'هناك مجالات عديدة تحتاج للتحسين في حياتك. حدد أولوياتك وابدأ بخطوات صغيرة.';
    } else if (score <= 19) {
      level = 'أقل من الرضا قليلاً';
      color = '#FF9800';
      advice = 'لديك بعض مجالات الرضا ولكن هناك أمور تحتاج للاهتمام.';
    } else if (score === 20) {
      level = 'محايد';
      color = '#9E9E9E';
      advice = 'أنت في نقطة متوازنة. فكر في ما يمكن أن يرفع مستوى رضاك.';
    } else if (score <= 25) {
      level = 'راضٍ قليلاً';
      color = '#8BC34A';
      advice = 'لديك مستوى جيد من الرضا مع مجال للتحسين.';
    } else if (score <= 30) {
      level = 'راضٍ';
      color = '#4CAF50';
      advice = 'أنت راضٍ عن حياتك بشكل عام. استمر في الحفاظ على هذا التوازن!';
    } else {
      level = 'راضٍ جداً';
      color = '#2E7D32';
      advice = 'ممتاز! أنت تشعر برضا كبير عن حياتك. استمر في نشر هذه الإيجابية!';
    }

    setResult({ score, level, color, advice });
  };

  const resetTest = () => {
    setAnswers(Array(5).fill(0));
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
        <Text style={styles.navTitle}>مقياس الرضا عن الحياة</Text>
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
              <Ionicons name="happy" size={50} color="#FF9800" />
              <Text style={styles.title}>مقياس الرضا عن الحياة (SWLS)</Text>
              <Text style={styles.subtitle}>Satisfaction with Life Scale</Text>
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
                <Ionicons name="chevron-forward" size={24} color={currentQuestion === 0 ? '#ccc' : '#FF9800'} />
                <Text style={[styles.navButtonText, currentQuestion === 0 && styles.navButtonTextDisabled]}>السابق</Text>
              </TouchableOpacity>

              {currentQuestion === 4 ? (
                <TouchableOpacity style={styles.submitButton} onPress={calculateScore}>
                  <Text style={styles.submitButtonText}>عرض النتيجة</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.navButton, answers[currentQuestion] === 0 && styles.navButtonDisabled]}
                  onPress={() => setCurrentQuestion(currentQuestion + 1)}
                  disabled={answers[currentQuestion] === 0}
                >
                  <Text style={[styles.navButtonText, answers[currentQuestion] === 0 && styles.navButtonTextDisabled]}>التالي</Text>
                  <Ionicons name="chevron-back" size={24} color={answers[currentQuestion] === 0 ? '#ccc' : '#FF9800'} />
                </TouchableOpacity>
              )}
            </View>
          </>
        ) : (
          <View style={styles.resultContainer}>
            <View style={[styles.resultCircle, { backgroundColor: result.color }]}>
              <Text style={styles.resultScore}>{result.score}</Text>
              <Text style={styles.resultMax}>/ 35</Text>
            </View>
            <Text style={[styles.resultLevel, { color: result.color }]}>{result.level}</Text>
            <Text style={styles.resultAdvice}>{result.advice}</Text>
            
            <View style={styles.scaleInfo}>
              <View style={styles.scaleItem}>
                <View style={[styles.scaleColor, { backgroundColor: '#F44336' }]} />
                <Text style={styles.scaleText}>5-9: غير راضٍ للغاية</Text>
              </View>
              <View style={styles.scaleItem}>
                <View style={[styles.scaleColor, { backgroundColor: '#FF5722' }]} />
                <Text style={styles.scaleText}>10-14: غير راضٍ</Text>
              </View>
              <View style={styles.scaleItem}>
                <View style={[styles.scaleColor, { backgroundColor: '#FF9800' }]} />
                <Text style={styles.scaleText}>15-19: أقل من الرضا</Text>
              </View>
              <View style={styles.scaleItem}>
                <View style={[styles.scaleColor, { backgroundColor: '#8BC34A' }]} />
                <Text style={styles.scaleText}>21-25: راضٍ قليلاً</Text>
              </View>
              <View style={styles.scaleItem}>
                <View style={[styles.scaleColor, { backgroundColor: '#4CAF50' }]} />
                <Text style={styles.scaleText}>26-30: راضٍ</Text>
              </View>
              <View style={styles.scaleItem}>
                <View style={[styles.scaleColor, { backgroundColor: '#2E7D32' }]} />
                <Text style={styles.scaleText}>31-35: راضٍ جداً</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.resetButton} onPress={resetTest}>
              <Text style={styles.resetButtonText}>إعادة الاختبار</Text>
            </TouchableOpacity>
            
            {/* زر حفظ النتيجة */}
            <TouchableOpacity 
              style={[styles.saveButton, !hasSubscription && styles.saveButtonDisabled]}
              onPress={() => saveResult({
                calculator_name: 'مقياس الرضا عن الحياة (SWLS)',
                calculator_type: 'swls',
                pillar: 'mental',
                inputs: { answers },
                result_value: result.score,
                result_text: `النتيجة: ${result.score}/35 - ${result.level}`
              })}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name={hasSubscription ? "bookmark" : "lock-closed"} size={18} color="#fff" />
                  <Text style={styles.saveButtonText}>
                    {hasSubscription ? 'حفظ في ملفي' : 'للمشتركين فقط'}
                  </Text>
                </>
              )}
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
  subtitle: { fontSize: 14, fontFamily: 'Cairo_400Regular', color: '#666', marginTop: 4 },
  progress: { marginBottom: 20 },
  progressText: { fontSize: 14, fontFamily: 'Cairo_700Bold', color: '#666', textAlign: 'center', marginBottom: 8 },
  progressBar: { height: 8, backgroundColor: '#e0e0e0', borderRadius: 4 },
  progressFill: { height: '100%', backgroundColor: '#FF9800', borderRadius: 4 },
  questionCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 20 },
  questionText: { fontSize: 18, fontFamily: 'Cairo_700Bold', color: '#333', textAlign: 'right', lineHeight: 28, marginBottom: 20 },
  optionsContainer: { gap: 8 },
  optionButton: { padding: 14, borderRadius: 12, backgroundColor: '#f5f5f5', borderWidth: 2, borderColor: 'transparent' },
  optionSelected: { backgroundColor: '#FFF3E0', borderColor: '#FF9800' },
  optionText: { fontSize: 15, fontFamily: 'Cairo_400Regular', color: '#333', textAlign: 'center' },
  optionTextSelected: { fontFamily: 'Cairo_700Bold', color: '#FF9800' },
  navigation: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  navButton: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 4 },
  navButtonDisabled: { opacity: 0.5 },
  navButtonText: { fontSize: 16, fontFamily: 'Cairo_700Bold', color: '#FF9800' },
  navButtonTextDisabled: { color: '#ccc' },
  submitButton: { backgroundColor: '#FF9800', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
  submitButtonText: { fontSize: 16, fontFamily: 'Cairo_700Bold', color: '#fff' },
  resultContainer: { alignItems: 'center', paddingVertical: 20 },
  resultCircle: { width: 140, height: 140, borderRadius: 70, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  resultScore: { fontSize: 48, fontFamily: 'Cairo_700Bold', color: '#fff' },
  resultMax: { fontSize: 18, fontFamily: 'Cairo_400Regular', color: '#fff' },
  resultLevel: { fontSize: 28, fontFamily: 'Cairo_700Bold', marginBottom: 12 },
  resultAdvice: { fontSize: 16, fontFamily: 'Cairo_400Regular', color: '#666', textAlign: 'center', lineHeight: 26, marginBottom: 24, paddingHorizontal: 20 },
  scaleInfo: { backgroundColor: '#fff', borderRadius: 16, padding: 20, width: '100%', marginBottom: 20 },
  scaleItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 12 },
  scaleColor: { width: 20, height: 20, borderRadius: 10 },
  scaleText: { fontSize: 13, fontFamily: 'Cairo_400Regular', color: '#333' },
  resetButton: { backgroundColor: '#FF9800', paddingHorizontal: 40, paddingVertical: 14, borderRadius: 12 },
  resetButtonText: { fontSize: 16, fontFamily: 'Cairo_700Bold', color: '#fff' },
  saveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#4CAF50', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 25, marginTop: 16, gap: 8 },
  saveButtonDisabled: { backgroundColor: '#9E9E9E' },
  saveButtonText: { color: '#fff', fontSize: 14, fontFamily: 'Cairo_700Bold' }});