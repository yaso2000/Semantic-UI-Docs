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
import { useRouter } from 'expo-router';

export default function BMICalculator() {
  const router = useRouter();
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [result, setResult] = useState<any>(null);
  
  const [fontsLoaded] = useFonts({ Cairo_400Regular, Cairo_700Bold });

  const calculateBMI = () => {
    const w = parseFloat(weight);
    const h = parseFloat(height) / 100; // تحويل السم إلى متر
    
    if (w > 0 && h > 0) {
      const bmi = w / (h * h);
      let category = '';
      let color = '';
      let advice = '';
      
      if (bmi < 18.5) {
        category = 'نقص في الوزن';
        color = '#2196F3';
        advice = 'يجب زيادة الوزن بشكل صحي';
      } else if (bmi < 25) {
        category = 'وزن طبيعي';
        color = '#4CAF50';
        advice = 'وزنك مثالي! حافظ عليه';
      } else if (bmi < 30) {
        category = 'زيادة في الوزن';
        color = '#FF9800';
        advice = 'يُنصح بفقدان بعض الوزن';
      } else {
        category = 'سمنة';
        color = '#F44336';
        advice = 'يجب فقدان الوزن تحت إشراف طبي';
      }
      
      setResult({ bmi: bmi.toFixed(1), category, color, advice });
    }
  };

  if (!fontsLoaded) return null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navigationHeader}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>حاسبة مؤشر كتلة الجسم</Text>
        <View style={{ width: 40 }} />
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Ionicons name="body" size={60} color="#4CAF50" />
            <Text style={styles.title}>حاسبة مؤشر كتلة الجسم</Text>
            <Text style={styles.subtitle}>BMI Calculator</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>الوزن (كجم)</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="70"
                  keyboardType="numeric"
                  value={weight}
                  onChangeText={setWeight}
                  placeholderTextColor="#999"
                />
                <Ionicons name="barbell" size={20} color="#666" />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>الطول (سم)</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="170"
                  keyboardType="numeric"
                  value={height}
                  onChangeText={setHeight}
                  placeholderTextColor="#999"
                />
                <Ionicons name="resize" size={20} color="#666" />
              </View>
            </View>

            <TouchableOpacity style={styles.button} onPress={calculateBMI}>
              <Text style={styles.buttonText}>احسب</Text>
            </TouchableOpacity>
          </View>

          {result && (
            <View style={[styles.result, { borderColor: result.color }]}>
              <View style={[styles.bmiCircle, { backgroundColor: result.color }]}>
                <Text style={styles.bmiValue}>{result.bmi}</Text>
              </View>
              <Text style={[styles.category, { color: result.color }]}>{result.category}</Text>
              <Text style={styles.advice}>{result.advice}</Text>
              
              <View style={styles.scale}>
                <View style={[styles.scaleItem, styles.scaleUnder]}>
                  <Text style={styles.scaleText}>نقص</Text>
                  <Text style={styles.scaleRange}>&lt; 18.5</Text>
                </View>
                <View style={[styles.scaleItem, styles.scaleNormal]}>
                  <Text style={styles.scaleText}>طبيعي</Text>
                  <Text style={styles.scaleRange}>18.5-25</Text>
                </View>
                <View style={[styles.scaleItem, styles.scaleOver]}>
                  <Text style={styles.scaleText}>زيادة</Text>
                  <Text style={styles.scaleRange}>25-30</Text>
                </View>
                <View style={[styles.scaleItem, styles.scaleObese]}>
                  <Text style={styles.scaleText}>سمنة</Text>
                  <Text style={styles.scaleRange}>&gt; 30</Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Cairo_700Bold',
    color: '#333',
    marginTop: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Cairo_400Regular',
    color: '#666',
    marginTop: 4,
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontFamily: 'Cairo_700Bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'right',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fafafa',
  },
  input: {
    flex: 1,
    height: 56,
    fontSize: 18,
    fontFamily: 'Cairo_400Regular',
    textAlign: 'right',
  },
  button: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 20,
    fontFamily: 'Cairo_700Bold',
  },
  result: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 3,
  },
  bmiCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  bmiValue: {
    fontSize: 40,
    fontFamily: 'Cairo_700Bold',
    color: '#fff',
  },
  category: {
    fontSize: 24,
    fontFamily: 'Cairo_700Bold',
    marginBottom: 8,
  },
  advice: {
    fontSize: 16,
    fontFamily: 'Cairo_400Regular',
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  scale: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scaleItem: {
    flex: 1,
    padding: 8,
    borderRadius: 8,
    marginHorizontal: 2,
    alignItems: 'center',
  },
  scaleUnder: { backgroundColor: '#E3F2FD' },
  scaleNormal: { backgroundColor: '#E8F5E9' },
  scaleOver: { backgroundColor: '#FFF3E0' },
  scaleObese: { backgroundColor: '#FFEBEE' },
  scaleText: {
    fontSize: 11,
    fontFamily: 'Cairo_700Bold',
    color: '#333',
  },
  scaleRange: {
    fontSize: 10,
    fontFamily: 'Cairo_400Regular',
    color: '#666',
  },
});