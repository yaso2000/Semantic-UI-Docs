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
  StatusBar,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Alexandria_400Regular, Alexandria_600SemiBold, Alexandria_700Bold } from '@expo-google-fonts/alexandria';
import { useRouter } from 'expo-router';
import { COLORS, FONTS, SHADOWS, RADIUS, SPACING } from '../../src/constants/theme';

const { width } = Dimensions.get('window');

const breathingPatterns = [
  { id: 'box', name: 'تنفس الصندوق', description: 'للتركيز والهدوء', inhale: 4, hold1: 4, exhale: 4, hold2: 4, color: COLORS.teal },
  { id: 'relax', name: 'تنفس الاسترخاء', description: '4-7-8 للنوم العميق', inhale: 4, hold1: 7, exhale: 8, hold2: 0, color: COLORS.sage },
  { id: 'energy', name: 'تنفس الطاقة', description: 'لزيادة النشاط', inhale: 6, hold1: 0, exhale: 2, hold2: 0, color: COLORS.gold },
  { id: 'calm', name: 'تنفس الهدوء', description: 'للتخلص من التوتر', inhale: 5, hold1: 2, exhale: 7, hold2: 0, color: COLORS.spiritual },
];

export default function BreathingExerciseScreen() {
  const router = useRouter();
  const [selectedPattern, setSelectedPattern] = useState(breathingPatterns[0]);
  const [isRunning, setIsRunning] = useState(false);
  const [phase, setPhase] = useState('ready');
  const [cycleCount, setCycleCount] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const isRunningRef = useRef(false);
  
  const [fontsLoaded] = useFonts({ Alexandria_400Regular, Alexandria_600SemiBold, Alexandria_700Bold });

  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const runCycle = async () => {
    if (!isRunningRef.current) return;

    // Inhale
    setPhase('inhale');
    setCountdown(selectedPattern.inhale);
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: selectedPattern.inhale * 1000,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();
    
    for (let i = selectedPattern.inhale; i > 0 && isRunningRef.current; i--) {
      setCountdown(i);
      await wait(1000);
    }

    if (!isRunningRef.current) return;

    if (selectedPattern.hold1 > 0) {
      setPhase('hold1');
      for (let i = selectedPattern.hold1; i > 0 && isRunningRef.current; i--) {
        setCountdown(i);
        await wait(1000);
      }
    }

    if (!isRunningRef.current) return;

    // Exhale
    setPhase('exhale');
    setCountdown(selectedPattern.exhale);
    Animated.timing(scaleAnim, {
      toValue: 0.5,
      duration: selectedPattern.exhale * 1000,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();

    for (let i = selectedPattern.exhale; i > 0 && isRunningRef.current; i--) {
      setCountdown(i);
      await wait(1000);
    }

    if (!isRunningRef.current) return;

    if (selectedPattern.hold2 > 0) {
      setPhase('hold2');
      for (let i = selectedPattern.hold2; i > 0 && isRunningRef.current; i--) {
        setCountdown(i);
        await wait(1000);
      }
    }

    if (isRunningRef.current) {
      setCycleCount(prev => prev + 1);
      runCycle();
    }
  };

  const startExercise = () => {
    isRunningRef.current = true;
    setIsRunning(true);
    setCycleCount(0);
    runCycle();
  };

  const stopExercise = () => {
    isRunningRef.current = false;
    setIsRunning(false);
    setPhase('ready');
    setCountdown(0);
    scaleAnim.setValue(0.5);
  };

  const getPhaseText = () => {
    switch (phase) {
      case 'inhale': return 'شهيق 🌬️';
      case 'hold1': return 'احبس ⏸️';
      case 'exhale': return 'زفير 💨';
      case 'hold2': return 'احبس ⏸️';
      default: return 'استعد 🧘';
    }
  };

  const getPhaseInstruction = () => {
    switch (phase) {
      case 'inhale': return 'خذ نفساً عميقاً';
      case 'hold1': return 'احبس الهواء';
      case 'exhale': return 'أخرج الهواء ببطء';
      case 'hold2': return 'انتظر قليلاً';
      default: return 'اضغط ابدأ للبدء';
    }
  };

  if (!fontsLoaded) return null;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>تمارين التنفس</Text>
        <View style={{ width: 40 }} />
      </View>

      {!isRunning ? (
        <ScrollView contentContainerStyle={styles.content}>
          {/* Intro */}
          <View style={styles.introSection}>
            <View style={[styles.introIcon, { backgroundColor: `${selectedPattern.color}20` }]}>
              <Ionicons name="fitness" size={40} color={selectedPattern.color} />
            </View>
            <Text style={styles.introTitle}>تمارين التنفس الموجهة</Text>
            <Text style={styles.introText}>اختر نمط التنفس المناسب لحالتك</Text>
          </View>

          {/* Patterns */}
          <View style={styles.patternsContainer}>
            {breathingPatterns.map((pattern) => (
              <TouchableOpacity
                key={pattern.id}
                style={[
                  styles.patternCard,
                  selectedPattern.id === pattern.id && { borderColor: pattern.color, backgroundColor: `${pattern.color}10` },
                ]}
                onPress={() => setSelectedPattern(pattern)}
              >
                <View style={[styles.patternIcon, { backgroundColor: pattern.color }]}>
                  <Ionicons name="leaf" size={22} color={COLORS.white} />
                </View>
                <View style={styles.patternInfo}>
                  <Text style={[styles.patternName, selectedPattern.id === pattern.id && { color: pattern.color }]}>
                    {pattern.name}
                  </Text>
                  <Text style={styles.patternDesc}>{pattern.description}</Text>
                  <View style={styles.patternDetails}>
                    <Text style={styles.patternDetail}>شهيق {pattern.inhale}ث</Text>
                    {pattern.hold1 > 0 && <Text style={styles.patternDetail}>• حبس {pattern.hold1}ث</Text>}
                    <Text style={styles.patternDetail}>• زفير {pattern.exhale}ث</Text>
                    {pattern.hold2 > 0 && <Text style={styles.patternDetail}>• حبس {pattern.hold2}ث</Text>}
                  </View>
                </View>
                {selectedPattern.id === pattern.id && (
                  <Ionicons name="checkmark-circle" size={24} color={pattern.color} />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Start Button */}
          <TouchableOpacity
            style={[styles.startButton, { backgroundColor: selectedPattern.color }]}
            onPress={startExercise}
          >
            <Ionicons name="play" size={24} color={COLORS.white} />
            <Text style={styles.startButtonText}>ابدأ التمرين</Text>
          </TouchableOpacity>

          {/* Tips */}
          <View style={styles.tipsSection}>
            <Text style={styles.tipsTitle}>نصائح للتنفس الصحيح</Text>
            <Text style={styles.tipItem}>🧘 اجلس في وضع مريح</Text>
            <Text style={styles.tipItem}>👃 تنفس من الأنف</Text>
            <Text style={styles.tipItem}>🫁 استخدم البطن وليس الصدر</Text>
            <Text style={styles.tipItem}>😌 أغمض عينيك للتركيز</Text>
          </View>
        </ScrollView>
      ) : (
        <View style={styles.exerciseContainer}>
          {/* Cycle Counter */}
          <View style={styles.cycleCounter}>
            <Text style={styles.cycleLabel}>الدورة</Text>
            <Text style={[styles.cycleNumber, { color: selectedPattern.color }]}>{cycleCount + 1}</Text>
          </View>

          {/* Breathing Visual */}
          <View style={styles.breathingVisual}>
            <View style={[styles.outerRing, { borderColor: `${selectedPattern.color}30` }]} />
            <View style={[styles.middleRing, { borderColor: `${selectedPattern.color}20` }]} />
            
            <Animated.View
              style={[
                styles.breathCircle,
                {
                  backgroundColor: selectedPattern.color,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              <Text style={styles.countdownText}>{countdown}</Text>
              <Text style={styles.phaseText}>{getPhaseText()}</Text>
            </Animated.View>
          </View>

          {/* Instruction */}
          <Text style={styles.instructionText}>{getPhaseInstruction()}</Text>

          {/* Phase Indicators */}
          <View style={styles.phaseIndicators}>
            <View style={[styles.phaseIndicator, phase === 'inhale' && { backgroundColor: selectedPattern.color }]}>
              <Text style={[styles.phaseIndicatorText, phase === 'inhale' && styles.phaseActiveText]}>شهيق</Text>
            </View>
            {selectedPattern.hold1 > 0 && (
              <View style={[styles.phaseIndicator, phase === 'hold1' && { backgroundColor: selectedPattern.color }]}>
                <Text style={[styles.phaseIndicatorText, phase === 'hold1' && styles.phaseActiveText]}>حبس</Text>
              </View>
            )}
            <View style={[styles.phaseIndicator, phase === 'exhale' && { backgroundColor: selectedPattern.color }]}>
              <Text style={[styles.phaseIndicatorText, phase === 'exhale' && styles.phaseActiveText]}>زفير</Text>
            </View>
            {selectedPattern.hold2 > 0 && (
              <View style={[styles.phaseIndicator, phase === 'hold2' && { backgroundColor: selectedPattern.color }]}>
                <Text style={[styles.phaseIndicatorText, phase === 'hold2' && styles.phaseActiveText]}>حبس</Text>
              </View>
            )}
          </View>

          {/* Stop Button */}
          <TouchableOpacity style={styles.stopButton} onPress={stopExercise}>
            <Ionicons name="stop" size={24} color={COLORS.white} />
            <Text style={styles.stopButtonText}>إيقاف</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.teal,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },

  content: {
    padding: SPACING.md,
    paddingBottom: 40,
  },

  introSection: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  introIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  introTitle: {
    fontSize: 22,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  introText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginTop: 4,
  },

  patternsContainer: {
    gap: SPACING.sm,
  },
  patternCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 2,
    borderColor: 'transparent',
    ...SHADOWS.sm,
  },
  patternIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.md,
  },
  patternInfo: {
    flex: 1,
  },
  patternName: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    textAlign: 'right',
  },
  patternDesc: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'right',
  },
  patternDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 6,
  },
  patternDetail: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
  },

  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    marginTop: SPACING.lg,
    gap: SPACING.sm,
    ...SHADOWS.md,
  },
  startButtonText: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },

  tipsSection: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginTop: SPACING.lg,
    ...SHADOWS.sm,
  },
  tipsTitle: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.teal,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  tipItem: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'right',
    paddingVertical: 4,
  },

  // Exercise Screen
  exerciseContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  cycleCounter: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  cycleLabel: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  cycleNumber: {
    fontSize: 32,
    fontFamily: FONTS.bold,
  },

  breathingVisual: {
    width: width * 0.7,
    height: width * 0.7,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  outerRing: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: width * 0.35,
    borderWidth: 2,
  },
  middleRing: {
    position: 'absolute',
    width: '80%',
    height: '80%',
    borderRadius: width * 0.28,
    borderWidth: 2,
  },
  breathCircle: {
    width: '60%',
    height: '60%',
    borderRadius: width * 0.21,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.lg,
  },
  countdownText: {
    fontSize: 56,
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },
  phaseText: {
    fontSize: 18,
    fontFamily: FONTS.semiBold,
    color: COLORS.white,
    marginTop: 4,
  },

  instructionText: {
    fontSize: 18,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },

  phaseIndicators: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  phaseIndicator: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.beige,
  },
  phaseIndicatorText: {
    fontSize: 13,
    fontFamily: FONTS.semiBold,
    color: COLORS.textSecondary,
  },
  phaseActiveText: {
    color: COLORS.white,
  },

  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.error,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    gap: SPACING.sm,
    ...SHADOWS.md,
  },
  stopButtonText: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },
});
