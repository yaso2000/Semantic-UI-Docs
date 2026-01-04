import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView,  KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Cairo_400Regular, Cairo_700Bold } from '@expo-google-fonts/cairo';
import { useRouter } from 'expo-router';
import { useSaveResult } from '../../src/hooks/useSaveResult';
import { ActivityIndicator } from 'react-native';


export default function IdealWeightCalculator() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [gender, setGender] = useState('male');
  const [height, setHeight] = useState('');
  const [result, setResult] = useState<any>(null);
  const { hasSubscription, saving, saveResult } = useSaveResult();
  const [fontsLoaded] = useFonts({ Cairo_400Regular, Cairo_700Bold });

  const calculateIdealWeight = () => {
    const h = parseFloat(height);
    if (h > 0) {
      let robinson = 0, miller = 0, hamwi = 0, devine = 0;
      
      if (gender === 'male') {
        robinson = 52 + 1.9 * ((h - 152.4) / 2.54);
        miller = 56.2 + 1.41 * ((h - 152.4) / 2.54);
        hamwi = 48 + 2.7 * ((h - 152.4) / 2.54);
        devine = 50 + 2.3 * ((h - 152.4) / 2.54);
      } else {
        robinson = 49 + 1.7 * ((h - 152.4) / 2.54);
        miller = 53.1 + 1.36 * ((h - 152.4) / 2.54);
        hamwi = 45.5 + 2.2 * ((h - 152.4) / 2.54);
        devine = 45.5 + 2.3 * ((h - 152.4) / 2.54);
      }
      
      const average = (robinson + miller + hamwi + devine) / 4;
      setResult({ robinson: robinson.toFixed(1), miller: miller.toFixed(1), hamwi: hamwi.toFixed(1), devine: devine.toFixed(1), average: average.toFixed(1) });
    }
  };

  if (!fontsLoaded) return null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.navigationHeader}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>الوزن المثالي</Text>
        <View style={{ width: 40 }} />
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Ionicons name="fitness" size={60} color="#2196F3" />
            <Text style={styles.title}>حاسبة الوزن المثالي</Text>
            <Text style={styles.subtitle}>Ideal Body Weight</Text>
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
              <Text style={styles.label}>الطول (سم)</Text>
              <TextInput style={styles.input} placeholder="170" keyboardType="numeric" value={height} onChangeText={setHeight} placeholderTextColor="#999" />
            </View>

            <TouchableOpacity style={styles.button} onPress={calculateIdealWeight}>
              <Text style={styles.buttonText}>احسب</Text>
            </TouchableOpacity>
          </View>

          {result && (
            <View style={styles.result}>
              <View style={styles.resultCard}>
                <Text style={styles.resultLabel}>المتوسط</Text>
                <Text style={styles.resultValue}>{result.average} كجم</Text>
              </View>
              <View style={styles.methodCard}>
                <Text style={styles.methodLabel}>Robinson: {result.robinson} كجم</Text>
              </View>
              <View style={styles.methodCard}>
                <Text style={styles.methodLabel}>Miller: {result.miller} كجم</Text>
              </View>
              <View style={styles.methodCard}>
                <Text style={styles.methodLabel}>Hamwi: {result.hamwi} كجم</Text>
              </View>
              <View style={styles.methodCard}>
                <Text style={styles.methodLabel}>Devine: {result.devine} كجم</Text>
              </View>
              
              {/* زر حفظ النتيجة */}
              <TouchableOpacity 
                style={[styles.saveButton, !hasSubscription && styles.saveButtonDisabled]}
                onPress={() => saveResult({
                  calculator_name: 'حاسبة الوزن المثالي',
                  calculator_type: 'ideal-weight',
                  pillar: 'physical',
                  inputs: { gender, height: parseFloat(height) },
                  result_value: parseFloat(result.average),
                  result_text: `الوزن المثالي: ${result.average} كجم`
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
  navigationHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center' },
  navTitle: { fontSize: 18, fontFamily: 'Cairo_700Bold', color: '#333' },
  content: { padding: 20 },
  header: { alignItems: 'center', marginBottom: 32 },
  title: { fontSize: 24, fontFamily: 'Cairo_700Bold', color: '#333', marginTop: 16, textAlign: 'center' },
  subtitle: { fontSize: 14, fontFamily: 'Cairo_400Regular', color: '#666', marginTop: 4 },
  form: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 20 },
  genderContainer: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  genderButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, backgroundColor: '#f5f5f5', gap: 8 },
  genderActive: { backgroundColor: '#2196F3' },
  genderText: { fontSize: 16, fontFamily: 'Cairo_700Bold', color: '#666' },
  genderTextActive: { color: '#fff' },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 16, fontFamily: 'Cairo_700Bold', color: '#333', marginBottom: 8, textAlign: 'right' },
  input: { height: 56, borderWidth: 2, borderColor: '#e0e0e0', borderRadius: 12, paddingHorizontal: 16, fontSize: 18, fontFamily: 'Cairo_400Regular', textAlign: 'right', backgroundColor: '#fafafa' },
  button: { backgroundColor: '#2196F3', borderRadius: 12, height: 56, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontSize: 20, fontFamily: 'Cairo_700Bold' },
  result: { backgroundColor: '#fff', borderRadius: 16, padding: 24 },
  resultCard: { backgroundColor: '#E3F2FD', borderRadius: 12, padding: 20, alignItems: 'center', marginBottom: 16 },
  resultLabel: { fontSize: 16, fontFamily: 'Cairo_700Bold', color: '#2196F3' },
  resultValue: { fontSize: 32, fontFamily: 'Cairo_700Bold', color: '#2196F3', marginTop: 8 },
  methodCard: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  methodLabel: { fontSize: 14, fontFamily: 'Cairo_400Regular', color: '#666', textAlign: 'right' },
  saveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#4CAF50', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 25, marginTop: 20, gap: 8 },
  saveButtonDisabled: { backgroundColor: '#9E9E9E' },
  saveButtonText: { color: '#fff', fontSize: 14, fontFamily: 'Cairo_700Bold' }});