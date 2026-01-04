import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView,  KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Cairo_400Regular, Cairo_700Bold } from '@expo-google-fonts/cairo';
import { useRouter } from 'expo-router';
import { SaveResultButton } from '../../src/components/SaveResultButton';


export default function OneRepMaxCalculator() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [result, setResult] = useState<any>(null);
  const [fontsLoaded] = useFonts({ Cairo_400Regular, Cairo_700Bold });

  const calculateOneRM = () => {
    const w = parseFloat(weight);
    const r = parseFloat(reps);
    
    if (w > 0 && r > 0 && r <= 12) {
      const epley = w * (1 + r / 30);
      const brzycki = w * (36 / (37 - r));
      const lander = (100 * w) / (101.3 - 2.67123 * r);
      const lombardi = w * Math.pow(r, 0.10);
      
      const average = (epley + brzycki + lander + lombardi) / 4;
      
      const percentages = [
        { percent: 95, weight: Math.round(average * 0.95) },
        { percent: 90, weight: Math.round(average * 0.90) },
        { percent: 85, weight: Math.round(average * 0.85) },
        { percent: 80, weight: Math.round(average * 0.80) },
        { percent: 75, weight: Math.round(average * 0.75) },
        { percent: 70, weight: Math.round(average * 0.70) },
      ];
      
      setResult({ oneRM: Math.round(average), percentages });
    }
  };

  if (!fontsLoaded) return null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.navigationHeader}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>الحد الأقصى للتكرار</Text>
        <View style={{ width: 40 }} />
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Ionicons name="podium" size={60} color="#673AB7" />
            <Text style={styles.title}>حاسبة 1RM</Text>
            <Text style={styles.subtitle}>One Rep Max Calculator</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>الوزن المرفوع (كجم)</Text>
              <TextInput style={styles.input} placeholder="100" keyboardType="numeric" value={weight} onChangeText={setWeight} placeholderTextColor="#999" />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>عدد التكرارات (1-12)</Text>
              <TextInput style={styles.input} placeholder="5" keyboardType="numeric" value={reps} onChangeText={setReps} placeholderTextColor="#999" />
            </View>

            <TouchableOpacity style={styles.button} onPress={calculateOneRM}>
              <Text style={styles.buttonText}>احسب</Text>
            </TouchableOpacity>
          </View>

          {result && (
            <View style={styles.result}>
              <View style={styles.mainResult}>
                <Text style={styles.resultLabel}>الحد الأقصى (1RM)</Text>
                <Text style={styles.resultValue}>{result.oneRM} كجم</Text>
              </View>
              
              <Text style={styles.tableTitle}>نسب التدريب</Text>
              {result.percentages.map((p: any) => (
                <View key={p.percent} style={styles.row}>
                  <Text style={styles.rowWeight}>{p.weight} كجم</Text>
                  <Text style={styles.rowPercent}>{p.percent}%</Text>
                </View>
              ))}
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
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 16, fontFamily: 'Cairo_700Bold', color: '#333', marginBottom: 8, textAlign: 'right' },
  input: { height: 56, borderWidth: 2, borderColor: '#e0e0e0', borderRadius: 12, paddingHorizontal: 16, fontSize: 18, fontFamily: 'Cairo_400Regular', textAlign: 'right', backgroundColor: '#fafafa' },
  button: { backgroundColor: '#673AB7', borderRadius: 12, height: 56, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontSize: 20, fontFamily: 'Cairo_700Bold' },
  result: { backgroundColor: '#fff', borderRadius: 16, padding: 20 },
  mainResult: { backgroundColor: '#EDE7F6', borderRadius: 12, padding: 24, alignItems: 'center', marginBottom: 20 },
  resultLabel: { fontSize: 16, fontFamily: 'Cairo_700Bold', color: '#673AB7' },
  resultValue: { fontSize: 48, fontFamily: 'Cairo_700Bold', color: '#673AB7', marginTop: 8 },
  tableTitle: { fontSize: 18, fontFamily: 'Cairo_700Bold', color: '#333', marginBottom: 12, textAlign: 'right' },
  row: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  rowPercent: { fontSize: 16, fontFamily: 'Cairo_700Bold', color: '#673AB7' },
  rowWeight: { fontSize: 16, fontFamily: 'Cairo_400Regular', color: '#666' }});