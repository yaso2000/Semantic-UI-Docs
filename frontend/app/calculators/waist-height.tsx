import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Cairo_400Regular, Cairo_700Bold } from '@expo-google-fonts/cairo';
import { useRouter } from 'expo-router';

export default function WaistHeightCalculator() {
  const router = useRouter();
  const [waist, setWaist] = useState('');
  const [height, setHeight] = useState('');
  const [result, setResult] = useState<any>(null);
  const [fontsLoaded] = useFonts({ Cairo_400Regular, Cairo_700Bold });

  const calculateRatio = () => {
    const w = parseFloat(waist);
    const h = parseFloat(height);
    if (w > 0 && h > 0) {
      const ratio = (w / h) * 100;
      let category = '', color = '', advice = '';
      
      if (ratio < 35) { category = 'نحيف جداً'; color = '#2196F3'; advice = 'قد تحتاج لزيادة الوزن'; }
      else if (ratio < 43) { category = 'نحيف'; color = '#03A9F4'; advice = 'وزنك أقل من المثالي'; }
      else if (ratio < 46) { category = 'صحي'; color = '#4CAF50'; advice = 'نسبة ممتازة!'; }
      else if (ratio < 53) { category = 'زيادة وزن'; color = '#FF9800'; advice = 'احذر من المخاطر الصحية'; }
      else if (ratio < 58) { category = 'سمنة'; color = '#F44336'; advice = 'استشر طبيب'; }
      else { category = 'سمنة مفرطة'; color = '#D32F2F'; advice = 'خطر صحي عالي'; }
      
      setResult({ ratio: ratio.toFixed(1), category, color, advice });
    }
  };

  if (!fontsLoaded) return null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navigationHeader}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>نسبة الخصر للطول</Text>
        <View style={{ width: 40 }} />
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Ionicons name="resize" size={60} color="#9C27B0" />
            <Text style={styles.title}>حاسبة نسبة الخصر للطول</Text>
            <Text style={styles.subtitle}>Waist-to-Height Ratio</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>محيط الخصر (سم)</Text>
              <TextInput style={styles.input} placeholder="80" keyboardType="numeric" value={waist} onChangeText={setWaist} placeholderTextColor="#999" />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>الطول (سم)</Text>
              <TextInput style={styles.input} placeholder="170" keyboardType="numeric" value={height} onChangeText={setHeight} placeholderTextColor="#999" />
            </View>

            <TouchableOpacity style={styles.button} onPress={calculateRatio}>
              <Text style={styles.buttonText}>احسب</Text>
            </TouchableOpacity>
          </View>

          {result && (
            <View style={[styles.result, { borderColor: result.color }]}>
              <View style={[styles.circle, { backgroundColor: result.color }]}>
                <Text style={styles.value}>{result.ratio}%</Text>
              </View>
              <Text style={[styles.category, { color: result.color }]}>{result.category}</Text>
              <Text style={styles.advice}>{result.advice}</Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 16, fontFamily: 'Cairo_700Bold', color: '#333', marginBottom: 8, textAlign: 'right' },
  input: { height: 56, borderWidth: 2, borderColor: '#e0e0e0', borderRadius: 12, paddingHorizontal: 16, fontSize: 18, fontFamily: 'Cairo_400Regular', textAlign: 'right', backgroundColor: '#fafafa' },
  button: { backgroundColor: '#9C27B0', borderRadius: 12, height: 56, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontSize: 20, fontFamily: 'Cairo_700Bold' },
  result: { backgroundColor: '#fff', borderRadius: 16, padding: 24, alignItems: 'center', borderWidth: 3 },
  circle: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  value: { fontSize: 36, fontFamily: 'Cairo_700Bold', color: '#fff' },
  category: { fontSize: 24, fontFamily: 'Cairo_700Bold' },
  advice: { fontSize: 16, fontFamily: 'Cairo_400Regular', color: '#666', textAlign: 'center', marginTop: 8 },
});