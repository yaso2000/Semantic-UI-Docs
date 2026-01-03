import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView,  KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Cairo_400Regular, Cairo_700Bold } from '@expo-google-fonts/cairo';
import { useRouter } from 'expo-router';

export default function CalorieGoalCalculator() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [tdee, setTdee] = useState('');
  const [goal, setGoal] = useState('loss');
  const [result, setResult] = useState<any>(null);
  const [fontsLoaded] = useFonts({ Cairo_400Regular, Cairo_700Bold });

  const calculateGoal = () => {
    const t = parseFloat(tdee);
    if (t > 0) {
      const deficit500 = Math.round(t - 500);
      const deficit750 = Math.round(t - 750);
      const deficit1000 = Math.round(t - 1000);
      const surplus300 = Math.round(t + 300);
      const surplus500 = Math.round(t + 500);
      
      if (goal === 'loss') {
        setResult({ type: 'تخفيض الوزن', options: [{ label: 'تدريجي (0.25كجم/أسبوع)', value: deficit500, color: '#4CAF50' }, { label: 'معتدل (0.5كجم/أسبوع)', value: deficit750, color: '#FF9800' }, { label: 'سريع (1كجم/أسبوع)', value: deficit1000, color: '#F44336' }] });
      } else {
        setResult({ type: 'زيادة الوزن', options: [{ label: 'نظيف (0.25كجم/أسبوع)', value: surplus300, color: '#4CAF50' }, { label: 'متوسط (0.5كجم/أسبوع)', value: surplus500, color: '#2196F3' }] });
      }
    }
  };

  if (!fontsLoaded) return null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.navigationHeader}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>هدف السعرات</Text>
        <View style={{ width: 40 }} />
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Ionicons name="trending-down" size={60} color="#00BCD4" />
            <Text style={styles.title}>عجز/فائض السعرات</Text>
            <Text style={styles.subtitle}>Calorie Deficit/Surplus</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.goalContainer}>
              <TouchableOpacity style={[styles.goalButton, goal === 'loss' && styles.goalActive]} onPress={() => setGoal('loss')}>
                <Ionicons name="trending-down" size={24} color={goal === 'loss' ? '#fff' : '#666'} />
                <Text style={[styles.goalText, goal === 'loss' && styles.goalTextActive]}>تخفيض الوزن</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.goalButton, goal === 'gain' && styles.goalActive]} onPress={() => setGoal('gain')}>
                <Ionicons name="trending-up" size={24} color={goal === 'gain' ? '#fff' : '#666'} />
                <Text style={[styles.goalText, goal === 'gain' && styles.goalTextActive]}>زيادة الوزن</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>TDEE (سعرة/يوم)</Text>
              <TextInput style={styles.input} placeholder="2000" keyboardType="numeric" value={tdee} onChangeText={setTdee} placeholderTextColor="#999" />
            </View>

            <TouchableOpacity style={styles.button} onPress={calculateGoal}>
              <Text style={styles.buttonText}>احسب</Text>
            </TouchableOpacity>
          </View>

          {result && (
            <View style={styles.result}>
              <Text style={styles.resultTitle}>{result.type}</Text>
              {result.options.map((opt: any, idx: number) => (
                <View key={idx} style={[styles.optionCard, { borderLeftColor: opt.color }]}>
                  <Text style={styles.optionLabel}>{opt.label}</Text>
                  <Text style={[styles.optionValue, { color: opt.color }]}>{opt.value} سعرة/يوم</Text>
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
  goalContainer: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  goalButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, backgroundColor: '#f5f5f5', gap: 8 },
  goalActive: { backgroundColor: '#00BCD4' },
  goalText: { fontSize: 14, fontFamily: 'Cairo_700Bold', color: '#666' },
  goalTextActive: { color: '#fff' },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 16, fontFamily: 'Cairo_700Bold', color: '#333', marginBottom: 8, textAlign: 'right' },
  input: { height: 56, borderWidth: 2, borderColor: '#e0e0e0', borderRadius: 12, paddingHorizontal: 16, fontSize: 18, fontFamily: 'Cairo_400Regular', textAlign: 'right', backgroundColor: '#fafafa' },
  button: { backgroundColor: '#00BCD4', borderRadius: 12, height: 56, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontSize: 20, fontFamily: 'Cairo_700Bold' },
  result: { backgroundColor: '#fff', borderRadius: 16, padding: 20 },
  resultTitle: { fontSize: 20, fontFamily: 'Cairo_700Bold', color: '#333', marginBottom: 16, textAlign: 'right' },
  optionCard: { padding: 16, backgroundColor: '#f9f9f9', borderRadius: 12, marginBottom: 12, borderLeftWidth: 4 },
  optionLabel: { fontSize: 16, fontFamily: 'Cairo_700Bold', color: '#333', textAlign: 'right' },
  optionValue: { fontSize: 24, fontFamily: 'Cairo_700Bold', marginTop: 8, textAlign: 'right' }});