import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Cairo_400Regular, Cairo_700Bold } from '@expo-google-fonts/cairo';

export default function BodyFatCalculator() {
  const [gender, setGender] = useState('male');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [neck, setNeck] = useState('');
  const [waist, setWaist] = useState('');
  const [hip, setHip] = useState('');
  const [result, setResult] = useState<any>(null);
  
  const [fontsLoaded] = useFonts({ Cairo_400Regular, Cairo_700Bold });

  const calculateBodyFat = () => {
    const h = parseFloat(height);
    const w = parseFloat(weight);
    const n = parseFloat(neck);
    const wa = parseFloat(waist);
    const hi = parseFloat(hip);
    
    if (h > 0 && w > 0 && n > 0 && wa > 0) {
      let bodyFat = 0;
      
      if (gender === 'male') {
        bodyFat = 495 / (1.0324 - 0.19077 * Math.log10(wa - n) + 0.15456 * Math.log10(h)) - 450;
      } else {
        if (hi > 0) {
          bodyFat = 495 / (1.29579 - 0.35004 * Math.log10(wa + hi - n) + 0.22100 * Math.log10(h)) - 450;
        }
      }
      
      let category = '';
      let color = '';
      
      if (gender === 'male') {
        if (bodyFat < 6) { category = 'رياضي محترف'; color = '#2196F3'; }
        else if (bodyFat < 14) { category = 'لائق جداً'; color = '#4CAF50'; }
        else if (bodyFat < 18) { category = 'لائق'; color = '#8BC34A'; }
        else if (bodyFat < 25) { category = 'مقبول'; color = '#FF9800'; }
        else { category = 'زائد'; color = '#F44336'; }
      } else {
        if (bodyFat < 14) { category = 'رياضية محترفة'; color = '#2196F3'; }
        else if (bodyFat < 21) { category = 'لائقة جداً'; color = '#4CAF50'; }
        else if (bodyFat < 25) { category = 'لائقة'; color = '#8BC34A'; }
        else if (bodyFat < 32) { category = 'مقبول'; color = '#FF9800'; }
        else { category = 'زائد'; color = '#F44336'; }
      }
      
      setResult({ bodyFat: bodyFat.toFixed(1), category, color });
    }
  };

  if (!fontsLoaded) return null;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Ionicons name="analytics" size={60} color="#FF9800" />
            <Text style={styles.title}>حاسبة نسبة الدهون</Text>
            <Text style={styles.subtitle}>Body Fat Calculator</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.genderContainer}>
              <TouchableOpacity
                style={[styles.genderButton, gender === 'male' && styles.genderActive]}
                onPress={() => setGender('male')}
              >
                <Ionicons name="male" size={24} color={gender === 'male' ? '#fff' : '#666'} />
                <Text style={[styles.genderText, gender === 'male' && styles.genderTextActive]}>ذكر</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.genderButton, gender === 'female' && styles.genderActive]}
                onPress={() => setGender('female')}
              >
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
              <Text style={styles.label}>محيط الرقبة (سم)</Text>
              <TextInput style={styles.input} placeholder="37" keyboardType="numeric" value={neck} onChangeText={setNeck} placeholderTextColor="#999" />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>محيط الخصر (سم)</Text>
              <TextInput style={styles.input} placeholder="80" keyboardType="numeric" value={waist} onChangeText={setWaist} placeholderTextColor="#999" />
            </View>

            {gender === 'female' && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>محيط الورك (سم)</Text>
                <TextInput style={styles.input} placeholder="95" keyboardType="numeric" value={hip} onChangeText={setHip} placeholderTextColor="#999" />
              </View>
            )}

            <TouchableOpacity style={styles.button} onPress={calculateBodyFat}>
              <Text style={styles.buttonText}>احسب</Text>
            </TouchableOpacity>
          </View>

          {result && (
            <View style={[styles.result, { borderColor: result.color }]}>
              <View style={[styles.circle, { backgroundColor: result.color }]}>
                <Text style={styles.value}>{result.bodyFat}%</Text>
              </View>
              <Text style={[styles.category, { color: result.color }]}>{result.category}</Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 20 },
  header: { alignItems: 'center', marginBottom: 32 },
  title: { fontSize: 24, fontFamily: 'Cairo_700Bold', color: '#333', marginTop: 16, textAlign: 'center' },
  subtitle: { fontSize: 14, fontFamily: 'Cairo_400Regular', color: '#666', marginTop: 4 },
  form: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 20 },
  genderContainer: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  genderButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, backgroundColor: '#f5f5f5', gap: 8 },
  genderActive: { backgroundColor: '#FF9800' },
  genderText: { fontSize: 16, fontFamily: 'Cairo_700Bold', color: '#666' },
  genderTextActive: { color: '#fff' },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 16, fontFamily: 'Cairo_700Bold', color: '#333', marginBottom: 8, textAlign: 'right' },
  input: { height: 56, borderWidth: 2, borderColor: '#e0e0e0', borderRadius: 12, paddingHorizontal: 16, fontSize: 18, fontFamily: 'Cairo_400Regular', textAlign: 'right', backgroundColor: '#fafafa' },
  button: { backgroundColor: '#FF9800', borderRadius: 12, height: 56, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontSize: 20, fontFamily: 'Cairo_700Bold' },
  result: { backgroundColor: '#fff', borderRadius: 16, padding: 24, alignItems: 'center', borderWidth: 3 },
  circle: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  value: { fontSize: 36, fontFamily: 'Cairo_700Bold', color: '#fff' },
  category: { fontSize: 24, fontFamily: 'Cairo_700Bold' },
});