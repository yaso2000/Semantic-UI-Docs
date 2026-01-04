import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView,  KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Cairo_400Regular, Cairo_700Bold } from '@expo-google-fonts/cairo';
import { useRouter } from 'expo-router';
import { useSaveResult } from '../../src/hooks/useSaveResult';
import { ActivityIndicator } from 'react-native';


export default function MacrosCalculator() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [calories, setCalories] = useState('');
  const [goal, setGoal] = useState('balanced');
  const [result, setResult] = useState<any>(null);
  const { hasSubscription, saving, saveResult } = useSaveResult();
  const [fontsLoaded] = useFonts({ Cairo_400Regular, Cairo_700Bold });

  const calculateMacros = () => {
    const cal = parseFloat(calories);
    if (cal > 0) {
      let protein = 0, carbs = 0, fats = 0;
      
      if (goal === 'balanced') {
        protein = Math.round((cal * 0.30) / 4);
        carbs = Math.round((cal * 0.40) / 4);
        fats = Math.round((cal * 0.30) / 9);
      } else if (goal === 'high-protein') {
        protein = Math.round((cal * 0.40) / 4);
        carbs = Math.round((cal * 0.30) / 4);
        fats = Math.round((cal * 0.30) / 9);
      } else if (goal === 'low-carb') {
        protein = Math.round((cal * 0.35) / 4);
        carbs = Math.round((cal * 0.20) / 4);
        fats = Math.round((cal * 0.45) / 9);
      } else if (goal === 'keto') {
        protein = Math.round((cal * 0.25) / 4);
        carbs = Math.round((cal * 0.05) / 4);
        fats = Math.round((cal * 0.70) / 9);
      }
      
      setResult({ protein, carbs, fats, proteinCal: protein * 4, carbsCal: carbs * 4, fatsCal: fats * 9 });
    }
  };

  if (!fontsLoaded) return null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.navigationHeader}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>المغذيات الكبرى</Text>
        <View style={{ width: 40 }} />
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Ionicons name="nutrition" size={60} color="#795548" />
            <Text style={styles.title}>حاسبة المغذيات الكبرى</Text>
            <Text style={styles.subtitle}>Macros Calculator</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>السعرات اليومية</Text>
              <TextInput style={styles.input} placeholder="2000" keyboardType="numeric" value={calories} onChangeText={setCalories} placeholderTextColor="#999" />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>نوع النظام</Text>
              <TouchableOpacity style={[styles.goalButton, goal === 'balanced' && styles.goalActive]} onPress={() => setGoal('balanced')}>
                <Text style={[styles.goalText, goal === 'balanced' && styles.goalTextActive]}>متوازن (30% بروتين، 40% كارب، 30% دهون)</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.goalButton, goal === 'high-protein' && styles.goalActive]} onPress={() => setGoal('high-protein')}>
                <Text style={[styles.goalText, goal === 'high-protein' && styles.goalTextActive]}>عالي البروتين (40% بروتين، 30% كارب، 30% دهون)</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.goalButton, goal === 'low-carb' && styles.goalActive]} onPress={() => setGoal('low-carb')}>
                <Text style={[styles.goalText, goal === 'low-carb' && styles.goalTextActive]}>قليل الكارب (35% بروتين، 20% كارب، 45% دهون)</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.goalButton, goal === 'keto' && styles.goalActive]} onPress={() => setGoal('keto')}>
                <Text style={[styles.goalText, goal === 'keto' && styles.goalTextActive]}>كيتو (25% بروتين، 5% كارب، 70% دهون)</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.button} onPress={calculateMacros}>
              <Text style={styles.buttonText}>احسب</Text>
            </TouchableOpacity>
          </View>

          {result && (
            <View style={styles.result}>
              <View style={[styles.macroCard, { backgroundColor: '#FFEBEE' }]}>
                <Ionicons name="fitness" size={32} color="#F44336" />
                <Text style={styles.macroLabel}>البروتين</Text>
                <Text style={styles.macroValue}>{result.protein}جم</Text>
                <Text style={styles.macroCal}>{result.proteinCal} سعرة</Text>
              </View>
              <View style={[styles.macroCard, { backgroundColor: '#FFF3E0' }]}>
                <Ionicons name="pizza" size={32} color="#FF9800" />
                <Text style={styles.macroLabel}>الكربوهيدرات</Text>
                <Text style={styles.macroValue}>{result.carbs}جم</Text>
                <Text style={styles.macroCal}>{result.carbsCal} سعرة</Text>
              </View>
              <View style={[styles.macroCard, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="water" size={32} color="#4CAF50" />
                <Text style={styles.macroLabel}>الدهون</Text>
                <Text style={styles.macroValue}>{result.fats}جم</Text>
                <Text style={styles.macroCal}>{result.fatsCal} سعرة</Text>
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
  goalButton: { padding: 12, borderRadius: 12, backgroundColor: '#f5f5f5', marginBottom: 8 },
  goalActive: { backgroundColor: '#EFEBE9', borderWidth: 2, borderColor: '#795548' },
  goalText: { fontSize: 13, fontFamily: 'Cairo_400Regular', color: '#666', textAlign: 'right' },
  goalTextActive: { color: '#795548', fontFamily: 'Cairo_700Bold' },
  button: { backgroundColor: '#795548', borderRadius: 12, height: 56, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontSize: 20, fontFamily: 'Cairo_700Bold' },
  result: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  macroCard: { flex: 1, minWidth: '30%', borderRadius: 16, padding: 20, alignItems: 'center' },
  macroLabel: { fontSize: 14, fontFamily: 'Cairo_700Bold', color: '#333', marginTop: 8 },
  macroValue: { fontSize: 28, fontFamily: 'Cairo_700Bold', color: '#333', marginTop: 4 },
  macroCal: { fontSize: 12, fontFamily: 'Cairo_400Regular', color: '#666', marginTop: 2 }});