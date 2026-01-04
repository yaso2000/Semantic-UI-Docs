import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Cairo_400Regular, Cairo_700Bold } from '@expo-google-fonts/cairo';
import { useRouter } from 'expo-router';
import { useSaveResult } from '../../src/hooks/useSaveResult';

export default function TDEECalculator() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [gender, setGender] = useState('male');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [activity, setActivity] = useState('1.2');
  const [result, setResult] = useState<any>(null);
  const { hasSubscription, saving, saveResult } = useSaveResult();
  
  const [fontsLoaded] = useFonts({ Cairo_400Regular, Cairo_700Bold });

  const activities = [
    { value: '1.2', label: 'قليل جداً (لا رياضة)' },
    { value: '1.375', label: 'خفيف (1-3 أيام/أسبوع)' },
    { value: '1.55', label: 'متوسط (3-5 أيام/أسبوع)' },
    { value: '1.725', label: 'نشط (6-7 أيام/أسبوع)' },
    { value: '1.9', label: 'نشط جداً (رياضي)' },
  ];

  const calculateTDEE = () => {
    const w = parseFloat(weight);
    const h = parseFloat(height);
    const a = parseFloat(age);
    const act = parseFloat(activity);
    
    if (w > 0 && h > 0 && a > 0) {
      let bmr = 0;
      if (gender === 'male') {
        bmr = 10 * w + 6.25 * h - 5 * a + 5;
      } else {
        bmr = 10 * w + 6.25 * h - 5 * a - 161;
      }
      
      const tdee = Math.round(bmr * act);
      const deficit = Math.round(tdee - 500);
      const surplus = Math.round(tdee + 300);
      
      setResult({ tdee, bmr: Math.round(bmr), deficit, surplus });
    }
  };

  if (!fontsLoaded) return null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.navigationHeader}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>حاسبة السعرات اليومية</Text>
        <View style={{ width: 40 }} />
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Ionicons name="flame" size={60} color="#F44336" />
            <Text style={styles.title}>حاسبة السعرات اليومية</Text>
            <Text style={styles.subtitle}>TDEE Calculator</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.genderContainer}>
              <TouchableOpacity style={[styles.genderButton, gender === 'male' && styles.genderActive]} onPress={() => setGender('male')}>
                <Ionicons name="male" size={24} color={gender === 'male' ? '#fff' : '#666'} />
                <Text style={[styles.genderText, gender === 'male' && styles.genderTextActive]}>ذكر</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.genderButton, gender === 'female' && styles.genderActive]} onPress={() => setGender('female')}>
                <Ionicons name="female" size={24} color={gender === 'female' ? '#fff' : '#666'} />
                <Text style={[styles.genderText, gender === 'female' && styles.genderTextActive]}>أنثى</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>العمر</Text>
              <TextInput style={styles.input} placeholder="25" keyboardType="numeric" value={age} onChangeText={setAge} placeholderTextColor="#999" />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>الوزن (كجم)</Text>
              <TextInput style={styles.input} placeholder="70" keyboardType="numeric" value={weight} onChangeText={setWeight} placeholderTextColor="#999" />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>الطول (سم)</Text>
              <TextInput style={styles.input} placeholder="170" keyboardType="numeric" value={height} onChangeText={setHeight} placeholderTextColor="#999" />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>مستوى النشاط</Text>
              {activities.map((act) => (
                <TouchableOpacity
                  key={act.value}
                  style={[styles.activityButton, activity === act.value && styles.activityActive]}
                  onPress={() => setActivity(act.value)}
                >
                  <Text style={[styles.activityText, activity === act.value && styles.activityTextActive]}>{act.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.button} onPress={calculateTDEE}>
              <Text style={styles.buttonText}>احسب</Text>
            </TouchableOpacity>
          </View>

          {result && (
            <View style={styles.result}>
              <View style={styles.resultCard}>
                <Ionicons name="flame" size={32} color="#F44336" />
                <Text style={styles.resultLabel}>TDEE</Text>
                <Text style={styles.resultValue}>{result.tdee}</Text>
                <Text style={styles.resultUnit}>سعرة/يوم</Text>
              </View>
              <View style={styles.resultCard}>
                <Ionicons name="pulse" size={32} color="#2196F3" />
                <Text style={styles.resultLabel}>BMR</Text>
                <Text style={styles.resultValue}>{result.bmr}</Text>
                <Text style={styles.resultUnit}>سعرة/يوم</Text>
              </View>
              <View style={styles.resultCard}>
                <Ionicons name="trending-down" size={32} color="#4CAF50" />
                <Text style={styles.resultLabel}>للتنحيف</Text>
                <Text style={styles.resultValue}>{result.deficit}</Text>
                <Text style={styles.resultUnit}>سعرة/يوم</Text>
              </View>
              <View style={styles.resultCard}>
                <Ionicons name="trending-up" size={32} color="#FF9800" />
                <Text style={styles.resultLabel}>للتضخيم</Text>
                <Text style={styles.resultValue}>{result.surplus}</Text>
                <Text style={styles.resultUnit}>سعرة/يوم</Text>
              </View>
              
              {/* زر حفظ النتيجة */}
              <TouchableOpacity 
                style={[styles.saveButton, !hasSubscription && styles.saveButtonDisabled]}
                onPress={() => saveResult({
                  calculator_name: 'حاسبة السعرات اليومية (TDEE)',
                  calculator_type: 'tdee',
                  pillar: 'physical',
                  inputs: { gender, age: parseFloat(age), weight: parseFloat(weight), height: parseFloat(height), activity },
                  result_value: result.tdee,
                  result_text: `TDEE: ${result.tdee} سعرة/يوم - BMR: ${result.bmr}`
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
      </KeyboardAvoidingView>
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
  navTitle: {
    fontSize: 18,
    fontFamily: 'Cairo_700Bold',
    color: '#333'},
  content: { padding: 20 },
  header: { alignItems: 'center', marginBottom: 32 },
  title: { fontSize: 24, fontFamily: 'Cairo_700Bold', color: '#333', marginTop: 16, textAlign: 'center' },
  subtitle: { fontSize: 14, fontFamily: 'Cairo_400Regular', color: '#666', marginTop: 4 },
  form: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 20 },
  genderContainer: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  genderButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, backgroundColor: '#f5f5f5', gap: 8 },
  genderActive: { backgroundColor: '#F44336' },
  genderText: { fontSize: 16, fontFamily: 'Cairo_700Bold', color: '#666' },
  genderTextActive: { color: '#fff' },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 16, fontFamily: 'Cairo_700Bold', color: '#333', marginBottom: 8, textAlign: 'right' },
  input: { height: 56, borderWidth: 2, borderColor: '#e0e0e0', borderRadius: 12, paddingHorizontal: 16, fontSize: 18, fontFamily: 'Cairo_400Regular', textAlign: 'right', backgroundColor: '#fafafa' },
  activityButton: { padding: 16, borderRadius: 12, backgroundColor: '#f5f5f5', marginBottom: 8 },
  activityActive: { backgroundColor: '#FFF3E0', borderWidth: 2, borderColor: '#F44336' },
  activityText: { fontSize: 14, fontFamily: 'Cairo_400Regular', color: '#666', textAlign: 'right' },
  activityTextActive: { color: '#F44336', fontFamily: 'Cairo_700Bold' },
  button: { backgroundColor: '#F44336', borderRadius: 12, height: 56, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontSize: 20, fontFamily: 'Cairo_700Bold' },
  result: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  resultCard: { flex: 1, minWidth: '45%', backgroundColor: '#fff', borderRadius: 16, padding: 20, alignItems: 'center', elevation: 2 },
  resultLabel: { fontSize: 14, fontFamily: 'Cairo_700Bold', color: '#666', marginTop: 8 },
  resultValue: { fontSize: 32, fontFamily: 'Cairo_700Bold', color: '#333', marginTop: 4 },
  resultUnit: { fontSize: 12, fontFamily: 'Cairo_400Regular', color: '#999', marginTop: 2 },
  saveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#4CAF50', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 25, marginTop: 20, gap: 8, width: '100%' },
  saveButtonDisabled: { backgroundColor: '#9E9E9E' },
  saveButtonText: { color: '#fff', fontSize: 14, fontFamily: 'Cairo_700Bold' }});