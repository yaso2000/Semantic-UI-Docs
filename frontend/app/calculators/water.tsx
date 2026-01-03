import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView,  KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Cairo_400Regular, Cairo_700Bold } from '@expo-google-fonts/cairo';
import { useRouter } from 'expo-router';

export default function WaterCalculator() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [weight, setWeight] = useState('');
  const [activity, setActivity] = useState('moderate');
  const [result, setResult] = useState<any>(null);
  const [fontsLoaded] = useFonts({ Cairo_400Regular, Cairo_700Bold });

  const calculateWater = () => {
    const w = parseFloat(weight);
    if (w > 0) {
      let baseWater = w * 0.033; // لتر
      
      if (activity === 'low') baseWater *= 1;
      else if (activity === 'moderate') baseWater *= 1.15;
      else if (activity === 'high') baseWater *= 1.3;
      
      const glasses = Math.round((baseWater * 1000) / 250); // كوب 250مل
      const bottles = (baseWater / 0.5).toFixed(1); // زجاجة 500مل
      
      setResult({ liters: baseWater.toFixed(1), glasses, bottles });
    }
  };

  if (!fontsLoaded) return null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.navigationHeader}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>كمية الماء اليومية</Text>
        <View style={{ width: 40 }} />
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Ionicons name="water" size={60} color="#03A9F4" />
            <Text style={styles.title}>حاسبة الماء اليومية</Text>
            <Text style={styles.subtitle}>Daily Water Intake</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>الوزن (كجم)</Text>
              <TextInput style={styles.input} placeholder="70" keyboardType="numeric" value={weight} onChangeText={setWeight} placeholderTextColor="#999" />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>مستوى النشاط</Text>
              <TouchableOpacity style={[styles.activityButton, activity === 'low' && styles.activityActive]} onPress={() => setActivity('low')}>
                <Text style={[styles.activityText, activity === 'low' && styles.activityTextActive]}>قليل النشاط</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.activityButton, activity === 'moderate' && styles.activityActive]} onPress={() => setActivity('moderate')}>
                <Text style={[styles.activityText, activity === 'moderate' && styles.activityTextActive]}>نشاط متوسط</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.activityButton, activity === 'high' && styles.activityActive]} onPress={() => setActivity('high')}>
                <Text style={[styles.activityText, activity === 'high' && styles.activityTextActive]}>نشاط عالي</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.button} onPress={calculateWater}>
              <Text style={styles.buttonText}>احسب</Text>
            </TouchableOpacity>
          </View>

          {result && (
            <View style={styles.result}>
              <View style={styles.mainResult}>
                <Ionicons name="water" size={48} color="#03A9F4" />
                <Text style={styles.resultValue}>{result.liters} لتر</Text>
                <Text style={styles.resultLabel}>يومياً</Text>
              </View>
              <View style={styles.equivalents}>
                <View style={styles.equivCard}>
                  <Ionicons name="wine" size={32} color="#03A9F4" />
                  <Text style={styles.equivValue}>{result.glasses}</Text>
                  <Text style={styles.equivLabel}>كوب (250مل)</Text>
                </View>
                <View style={styles.equivCard}>
                  <Ionicons name="flask" size={32} color="#03A9F4" />
                  <Text style={styles.equivValue}>{result.bottles}</Text>
                  <Text style={styles.equivLabel}>زجاجة (500مل)</Text>
                </View>
              </View>
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
  activityButton: { padding: 16, borderRadius: 12, backgroundColor: '#f5f5f5', marginBottom: 8 },
  activityActive: { backgroundColor: '#E1F5FE', borderWidth: 2, borderColor: '#03A9F4' },
  activityText: { fontSize: 14, fontFamily: 'Cairo_400Regular', color: '#666', textAlign: 'right' },
  activityTextActive: { color: '#03A9F4', fontFamily: 'Cairo_700Bold' },
  button: { backgroundColor: '#03A9F4', borderRadius: 12, height: 56, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontSize: 20, fontFamily: 'Cairo_700Bold' },
  result: { backgroundColor: '#fff', borderRadius: 16, padding: 24 },
  mainResult: { alignItems: 'center', marginBottom: 24, paddingBottom: 24, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  resultValue: { fontSize: 48, fontFamily: 'Cairo_700Bold', color: '#03A9F4', marginTop: 12 },
  resultLabel: { fontSize: 16, fontFamily: 'Cairo_400Regular', color: '#666' },
  equivalents: { flexDirection: 'row', gap: 12 },
  equivCard: { flex: 1, backgroundColor: '#E1F5FE', borderRadius: 12, padding: 16, alignItems: 'center' },
  equivValue: { fontSize: 32, fontFamily: 'Cairo_700Bold', color: '#03A9F4', marginTop: 8 },
  equivLabel: { fontSize: 12, fontFamily: 'Cairo_400Regular', color: '#666', marginTop: 4, textAlign: 'center' }});