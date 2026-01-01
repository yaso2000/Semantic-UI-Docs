import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Cairo_400Regular, Cairo_700Bold } from '@expo-google-fonts/cairo';
import { useRouter } from 'expo-router';

export default function CaloriesBurnedCalculator() {
  const router = useRouter();
  const [weight, setWeight] = useState('');
  const [activity, setActivity] = useState('walking');
  const [duration, setDuration] = useState('');
  const [result, setResult] = useState<any>(null);
  const [fontsLoaded] = useFonts({ Cairo_400Regular, Cairo_700Bold });

  const activities = [
    { value: 'walking', label: 'المشي', met: 3.5 },
    { value: 'jogging', label: 'الهرولة', met: 7 },
    { value: 'running', label: 'الجري', met: 9.8 },
    { value: 'cycling', label: 'الدراجة', met: 8 },
    { value: 'swimming', label: 'السباحة', met: 8.3 },
    { value: 'weights', label: 'رفع الأثقال', met: 6 },
    { value: 'yoga', label: 'اليوجا', met: 2.5 },
  ];

  const calculateCalories = () => {
    const w = parseFloat(weight);
    const d = parseFloat(duration);
    const met = activities.find(a => a.value === activity)?.met || 0;
    
    if (w > 0 && d > 0) {
      const calories = Math.round((met * w * d) / 60);
      setResult({ calories, activity: activities.find(a => a.value === activity)?.label });
    }
  };

  if (!fontsLoaded) return null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navigationHeader}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>السعرات المحروقة</Text>
        <View style={{ width: 40 }} />
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Ionicons name="barbell" size={60} color="#FF5722" />
            <Text style={styles.title}>حاسبة السعرات المحروقة</Text>
            <Text style={styles.subtitle}>Calories Burned Calculator</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>الوزن (كجم)</Text>
              <TextInput style={styles.input} placeholder="70" keyboardType="numeric" value={weight} onChangeText={setWeight} placeholderTextColor="#999" />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>المدة (دقيقة)</Text>
              <TextInput style={styles.input} placeholder="30" keyboardType="numeric" value={duration} onChangeText={setDuration} placeholderTextColor="#999" />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>نوع النشاط</Text>
              {activities.map((act) => (
                <TouchableOpacity key={act.value} style={[styles.activityButton, activity === act.value && styles.activityActive]} onPress={() => setActivity(act.value)}>
                  <Text style={[styles.activityText, activity === act.value && styles.activityTextActive]}>{act.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.button} onPress={calculateCalories}>
              <Text style={styles.buttonText}>احسب</Text>
            </TouchableOpacity>
          </View>

          {result && (
            <View style={styles.result}>
              <Ionicons name="flame" size={64} color="#FF5722" />
              <Text style={styles.resultValue}>{result.calories}</Text>
              <Text style={styles.resultLabel}>سعرة حرارية</Text>
              <Text style={styles.resultActivity}>{result.activity}</Text>
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
  activityButton: { padding: 12, borderRadius: 12, backgroundColor: '#f5f5f5', marginBottom: 8 },
  activityActive: { backgroundColor: '#FBE9E7', borderWidth: 2, borderColor: '#FF5722' },
  activityText: { fontSize: 14, fontFamily: 'Cairo_400Regular', color: '#666', textAlign: 'right' },
  activityTextActive: { color: '#FF5722', fontFamily: 'Cairo_700Bold' },
  button: { backgroundColor: '#FF5722', borderRadius: 12, height: 56, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontSize: 20, fontFamily: 'Cairo_700Bold' },
  result: { backgroundColor: '#fff', borderRadius: 16, padding: 32, alignItems: 'center' },
  resultValue: { fontSize: 56, fontFamily: 'Cairo_700Bold', color: '#FF5722', marginTop: 16 },
  resultLabel: { fontSize: 18, fontFamily: 'Cairo_400Regular', color: '#666', marginTop: 8 },
  resultActivity: { fontSize: 16, fontFamily: 'Cairo_700Bold', color: '#333', marginTop: 4 },
});