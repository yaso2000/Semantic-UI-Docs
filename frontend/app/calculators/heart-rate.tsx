import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView,  KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Cairo_400Regular, Cairo_700Bold } from '@expo-google-fonts/cairo';
import { useRouter } from 'expo-router';
import { useSaveResult } from '../../src/hooks/useSaveResult';
import { ActivityIndicator } from 'react-native';


export default function HeartRateCalculator() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [age, setAge] = useState('');
  const [restingHR, setRestingHR] = useState('');
  const [result, setResult] = useState<any>(null);
  const { hasSubscription, saving, saveResult } = useSaveResult();
  const [fontsLoaded] = useFonts({ Cairo_400Regular, Cairo_700Bold });

  const calculateHeartRate = () => {
    const a = parseFloat(age);
    const rhr = parseFloat(restingHR);
    
    if (a > 0 && rhr > 0) {
      const maxHR = 220 - a;
      const hrReserve = maxHR - rhr;
      
      const zones = [
        { name: 'منطقة الإحماء', percent: '50-60%', min: Math.round(rhr + hrReserve * 0.5), max: Math.round(rhr + hrReserve * 0.6), color: '#03A9F4' },
        { name: 'حرق الدهون', percent: '60-70%', min: Math.round(rhr + hrReserve * 0.6), max: Math.round(rhr + hrReserve * 0.7), color: '#4CAF50' },
        { name: 'اللياقة الهوائية', percent: '70-80%', min: Math.round(rhr + hrReserve * 0.7), max: Math.round(rhr + hrReserve * 0.8), color: '#FF9800' },
        { name: 'اللاهوائية', percent: '80-90%', min: Math.round(rhr + hrReserve * 0.8), max: Math.round(rhr + hrReserve * 0.9), color: '#F44336' },
        { name: 'الحد الأقصى', percent: '90-100%', min: Math.round(rhr + hrReserve * 0.9), max: maxHR, color: '#E91E63' },
      ];
      
      setResult({ maxHR, zones });
    }
  };

  if (!fontsLoaded) return null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.navigationHeader}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>معدل نبض القلب</Text>
        <View style={{ width: 40 }} />
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Ionicons name="heart" size={60} color="#E91E63" />
            <Text style={styles.title}>حاسبة معدل النبض المستهدف</Text>
            <Text style={styles.subtitle}>Target Heart Rate Calculator</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>العمر</Text>
              <TextInput style={styles.input} placeholder="30" keyboardType="numeric" value={age} onChangeText={setAge} placeholderTextColor="#999" />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>معدل النبض أثناء الراحة (BPM)</Text>
              <TextInput style={styles.input} placeholder="65" keyboardType="numeric" value={restingHR} onChangeText={setRestingHR} placeholderTextColor="#999" />
            </View>

            <TouchableOpacity style={styles.button} onPress={calculateHeartRate}>
              <Text style={styles.buttonText}>احسب</Text>
            </TouchableOpacity>
          </View>

          {result && (
            <View style={styles.result}>
              <View style={styles.maxHRCard}>
                <Ionicons name="heart" size={40} color="#E91E63" />
                <Text style={styles.maxHRLabel}>الحد الأقصى للنبض</Text>
                <Text style={styles.maxHRValue}>{result.maxHR} BPM</Text>
              </View>
              
              <Text style={styles.zonesTitle}>مناطق معدل النبض</Text>
              {result.zones.map((zone: any, idx: number) => (
                <View key={idx} style={[styles.zoneCard, { borderLeftColor: zone.color }]}>
                  <View style={styles.zoneHeader}>
                    <Text style={styles.zoneName}>{zone.name}</Text>
                    <Text style={[styles.zonePercent, { color: zone.color }]}>{zone.percent}</Text>
                  </View>
                  <Text style={styles.zoneRange}>{zone.min} - {zone.max} BPM</Text>
                </View>
              ))}
              
              {/* زر حفظ النتيجة */}
              <TouchableOpacity 
                style={[styles.saveButton, !hasSubscription && styles.saveButtonDisabled]}
                onPress={() => saveResult({
                  calculator_name: 'معدل نبض القلب',
                  calculator_type: 'heart-rate',
                  pillar: 'physical',
                  inputs: { age: parseFloat(age), restingHR: parseFloat(restingHR) },
                  result_value: result.maxHR,
                  result_text: `الحد الأقصى: ${result.maxHR} BPM`
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
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 16, fontFamily: 'Cairo_700Bold', color: '#333', marginBottom: 8, textAlign: 'right' },
  input: { height: 56, borderWidth: 2, borderColor: '#e0e0e0', borderRadius: 12, paddingHorizontal: 16, fontSize: 18, fontFamily: 'Cairo_400Regular', textAlign: 'right', backgroundColor: '#fafafa' },
  button: { backgroundColor: '#E91E63', borderRadius: 12, height: 56, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontSize: 20, fontFamily: 'Cairo_700Bold' },
  result: { backgroundColor: '#fff', borderRadius: 16, padding: 20 },
  maxHRCard: { backgroundColor: '#FCE4EC', borderRadius: 12, padding: 24, alignItems: 'center', marginBottom: 20 },
  maxHRLabel: { fontSize: 16, fontFamily: 'Cairo_700Bold', color: '#E91E63', marginTop: 8 },
  maxHRValue: { fontSize: 40, fontFamily: 'Cairo_700Bold', color: '#E91E63', marginTop: 4 },
  zonesTitle: { fontSize: 18, fontFamily: 'Cairo_700Bold', color: '#333', marginBottom: 12, textAlign: 'right' },
  zoneCard: { padding: 16, backgroundColor: '#f9f9f9', borderRadius: 12, marginBottom: 12, borderLeftWidth: 4 },
  zoneHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  zoneName: { fontSize: 16, fontFamily: 'Cairo_700Bold', color: '#333' },
  zonePercent: { fontSize: 14, fontFamily: 'Cairo_700Bold' },
  zoneRange: { fontSize: 18, fontFamily: 'Cairo_700Bold', color: '#666', textAlign: 'right' },
  saveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#4CAF50', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 25, marginTop: 20, gap: 8 },
  saveButtonDisabled: { backgroundColor: '#9E9E9E' },
  saveButtonText: { color: '#fff', fontSize: 14, fontFamily: 'Cairo_700Bold' }});