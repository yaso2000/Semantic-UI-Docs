import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Cairo_400Regular, Cairo_700Bold } from '@expo-google-fonts/cairo';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const breathingPatterns = [
  { id: 'box', name: 'تنفس الصندوق', inhale: 4, hold1: 4, exhale: 4, hold2: 4, color: '#2196F3' },
  { id: 'relax', name: 'تنفس الاسترخاء', inhale: 4, hold1: 7, exhale: 8, hold2: 0, color: '#4CAF50' },
  { id: 'energy', name: 'تنفس الطاقة', inhale: 6, hold1: 0, exhale: 2, hold2: 0, color: '#FF9800' },
  { id: 'calm', name: 'تنفس الهدوء', inhale: 5, hold1: 2, exhale: 7, hold2: 0, color: '#9C27B0' },
];

export default function BreathingExerciseScreen() {
  const router = useRouter();
  const [selectedPattern, setSelectedPattern] = useState(breathingPatterns[0]);
  const [isRunning, setIsRunning] = useState(false);
  const [phase, setPhase] = useState('ready'); // ready, inhale, hold1, exhale, hold2
  const [cycleCount, setCycleCount] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  
  const [fontsLoaded] = useFonts({ Cairo_400Regular, Cairo_700Bold });

  useEffect(() => {
    if (!isRunning) return;

    const runCycle = async () => {
      // Inhale
      setPhase('inhale');
      setCountdown(selectedPattern.inhale);
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: selectedPattern.inhale * 1000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start();
      await wait(selectedPattern.inhale * 1000);

      if (selectedPattern.hold1 > 0) {
        setPhase('hold1');
        setCountdown(selectedPattern.hold1);
        await wait(selectedPattern.hold1 * 1000);
      }

      // Exhale
      setPhase('exhale');
      setCountdown(selectedPattern.exhale);
      Animated.timing(scaleAnim, {
        toValue: 0.5,
        duration: selectedPattern.exhale * 1000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start();
      await wait(selectedPattern.exhale * 1000);

      if (selectedPattern.hold2 > 0) {
        setPhase('hold2');
        setCountdown(selectedPattern.hold2);
        await wait(selectedPattern.hold2 * 1000);
      }

      setCycleCount(prev => prev + 1);
    };

    const runExercise = async () => {
      while (isRunning) {
        await runCycle();
      }
    };

    runExercise();
  }, [isRunning, selectedPattern]);

  useEffect(() => {
    if (!isRunning || countdown <= 0) return;
    
    const timer = setInterval(() => {
      setCountdown(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, phase]);

  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const startExercise = () => {
    setIsRunning(true);
    setCycleCount(0);
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 20000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  };

  const stopExercise = () => {
    setIsRunning(false);
    setPhase('ready');
    rotateAnim.stopAnimation();
    scaleAnim.setValue(0.5);
  };

  const getPhaseText = () => {
    switch (phase) {
      case 'inhale': return 'شهيق';
      case 'hold1': return 'احبس';
      case 'exhale': return 'زفير';
      case 'hold2': return 'احبس';
      default: return 'استعد';
    }
  };

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (!fontsLoaded) return null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navigationHeader}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>تمارين التنفس</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {!isRunning ? (
          <>
            <View style={styles.header}>
              <Ionicons name="fitness" size={50} color={selectedPattern.color} />
              <Text style={styles.title}>تمارين التنفس الموجهة</Text>
              <Text style={styles.subtitle}>اختر نمط التنفس المناسب لك</Text>
            </View>

            <View style={styles.patternsContainer}>
              {breathingPatterns.map((pattern) => (
                <TouchableOpacity
                  key={pattern.id}
                  style={[
                    styles.patternCard,
                    selectedPattern.id === pattern.id && { borderColor: pattern.color, backgroundColor: pattern.color + '10' },
                  ]}
                  onPress={() => setSelectedPattern(pattern)}
                >
                  <View style={[styles.patternIcon, { backgroundColor: pattern.color }]}>
                    <Ionicons name="leaf" size={24} color="#fff" />
                  </View>
                  <Text style={[styles.patternName, selectedPattern.id === pattern.id && { color: pattern.color }]}>
                    {pattern.name}
                  </Text>
                  <View style={styles.patternDetails}>
                    <Text style={styles.patternDetail}>شهيق: {pattern.inhale}ث</Text>
                    {pattern.hold1 > 0 && <Text style={styles.patternDetail}>حبس: {pattern.hold1}ث</Text>}
                    <Text style={styles.patternDetail}>زفير: {pattern.exhale}ث</Text>
                    {pattern.hold2 > 0 && <Text style={styles.patternDetail}>حبس: {pattern.hold2}ث</Text>}
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.startButton, { backgroundColor: selectedPattern.color }]}
              onPress={startExercise}
            >
              <Ionicons name="play" size={24} color="#fff" />
              <Text style={styles.startButtonText}>ابدأ التمرين</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.exerciseContainer}>
            <Text style={styles.cycleText}>الدورة: {cycleCount + 1}</Text>
            
            <View style={styles.breathingVisual}>
              <Animated.View style={[styles.outerCircle, { transform: [{ rotate }] }]}>
                {[0, 1, 2, 3].map((i) => (
                  <View
                    key={i}
                    style={[
                      styles.cornerDot,
                      {
                        backgroundColor: selectedPattern.color,
                        top: i < 2 ? 0 : undefined,
                        bottom: i >= 2 ? 0 : undefined,
                        left: i % 2 === 0 ? 0 : undefined,
                        right: i % 2 === 1 ? 0 : undefined,
                      },
                    ]}
                  />
                ))}
              </Animated.View>
              
              <Animated.View
                style={[
                  styles.breathCircle,
                  {
                    backgroundColor: selectedPattern.color,
                    transform: [{ scale: scaleAnim }],
                  },
                ]}
              >
                <Text style={styles.phaseText}>{getPhaseText()}</Text>
                <Text style={styles.countdownText}>{countdown}</Text>
              </Animated.View>
            </View>

            <View style={styles.phaseIndicators}>
              <View style={[styles.phaseIndicator, phase === 'inhale' && styles.phaseActive]}>
                <Text style={[styles.phaseIndicatorText, phase === 'inhale' && styles.phaseActiveText]}>شهيق</Text>
              </View>
              {selectedPattern.hold1 > 0 && (
                <View style={[styles.phaseIndicator, phase === 'hold1' && styles.phaseActive]}>
                  <Text style={[styles.phaseIndicatorText, phase === 'hold1' && styles.phaseActiveText]}>حبس</Text>
                </View>
              )}
              <View style={[styles.phaseIndicator, phase === 'exhale' && styles.phaseActive]}>
                <Text style={[styles.phaseIndicatorText, phase === 'exhale' && styles.phaseActiveText]}>زفير</Text>
              </View>
              {selectedPattern.hold2 > 0 && (
                <View style={[styles.phaseIndicator, phase === 'hold2' && styles.phaseActive]}>
                  <Text style={[styles.phaseIndicatorText, phase === 'hold2' && styles.phaseActiveText]}>حبس</Text>
                </View>
              )}
            </View>

            <TouchableOpacity style={styles.stopButton} onPress={stopExercise}>
              <Ionicons name="stop" size={24} color="#fff" />
              <Text style={styles.stopButtonText}>إيقاف</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  navigationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navTitle: { fontSize: 18, fontFamily: 'Cairo_700Bold', color: '#333' },
  content: { flex: 1, padding: 20 },
  header: { alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 24, fontFamily: 'Cairo_700Bold', color: '#333', marginTop: 12 },
  subtitle: { fontSize: 14, fontFamily: 'Cairo_400Regular', color: '#666', marginTop: 4 },
  patternsContainer: { gap: 12 },
  patternCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  patternIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
  patternName: { fontSize: 16, fontFamily: 'Cairo_700Bold', color: '#333', flex: 1, textAlign: 'right' },
  patternDetails: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  patternDetail: { fontSize: 11, fontFamily: 'Cairo_400Regular', color: '#666', backgroundColor: '#f5f5f5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 16,
    gap: 10,
    marginTop: 24,
  },
  startButtonText: { fontSize: 20, fontFamily: 'Cairo_700Bold', color: '#fff' },
  exerciseContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cycleText: { fontSize: 18, fontFamily: 'Cairo_700Bold', color: '#666', marginBottom: 20 },
  breathingVisual: { alignItems: 'center', justifyContent: 'center', marginBottom: 40 },
  outerCircle: {
    width: 250,
    height: 250,
    borderRadius: 125,
    borderWidth: 3,
    borderColor: '#e0e0e0',
    position: 'absolute',
  },
  cornerDot: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  breathCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    justifyContent: 'center',
    alignItems: 'center',
  },
  phaseText: { fontSize: 28, fontFamily: 'Cairo_700Bold', color: '#fff' },
  countdownText: { fontSize: 48, fontFamily: 'Cairo_700Bold', color: '#fff' },
  phaseIndicators: { flexDirection: 'row', gap: 12, marginBottom: 40 },
  phaseIndicator: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
  },
  phaseActive: { backgroundColor: '#2196F3' },
  phaseIndicatorText: { fontSize: 14, fontFamily: 'Cairo_400Regular', color: '#666' },
  phaseActiveText: { color: '#fff', fontFamily: 'Cairo_700Bold' },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F44336',
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  stopButtonText: { fontSize: 18, fontFamily: 'Cairo_700Bold', color: '#fff' },
});