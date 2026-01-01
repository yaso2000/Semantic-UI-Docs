import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Cairo_400Regular, Cairo_700Bold } from '@expo-google-fonts/cairo';
import { useRouter } from 'expo-router';
import { Audio } from 'expo-av';

const durations = [
  { label: '3 دقائق', value: 3 },
  { label: '5 دقائق', value: 5 },
  { label: '10 دقائق', value: 10 },
  { label: '15 دقيقة', value: 15 },
  { label: '20 دقيقة', value: 20 },
  { label: '30 دقيقة', value: 30 },
];

const ambientSounds = [
  { id: 'none', label: 'بدون صوت', icon: 'volume-mute' },
  { id: 'waves', label: 'أمواج البحر', icon: 'water' },
  { id: 'rain', label: 'صوت المطر', icon: 'rainy' },
  { id: 'forest', label: 'الغابة', icon: 'leaf' },
  { id: 'birds', label: 'زقزقة الطيور', icon: 'musical-notes' },
];

export default function MeditationTimerScreen() {
  const router = useRouter();
  const [duration, setDuration] = useState(5);
  const [selectedSound, setSelectedSound] = useState('none');
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const breathAnim = useRef(new Animated.Value(0)).current;
  
  const [fontsLoaded] = useFonts({ Cairo_400Regular, Cairo_700Bold });

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      
      // Breathing animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(breathAnim, {
            toValue: 1,
            duration: 4000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(breathAnim, {
            toValue: 0,
            duration: 4000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      setIsComplete(true);
    }
    
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const startMeditation = () => {
    setTimeLeft(duration * 60);
    setIsRunning(true);
    setIsComplete(false);
  };

  const stopMeditation = () => {
    setIsRunning(false);
    setTimeLeft(0);
    breathAnim.stopAnimation();
  };

  const resetMeditation = () => {
    setIsComplete(false);
    setTimeLeft(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const breathScale = breathAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.3],
  });

  if (!fontsLoaded) return null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navigationHeader}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>مؤقت التأمل</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {!isRunning && !isComplete ? (
          <>
            <View style={styles.header}>
              <Ionicons name="flower" size={60} color="#7C4DFF" />
              <Text style={styles.title}>جلسة تأمل هادئة</Text>
              <Text style={styles.subtitle}>اختر المدة والصوت المحيط</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>مدة التأمل</Text>
              <View style={styles.durationGrid}>
                {durations.map((d) => (
                  <TouchableOpacity
                    key={d.value}
                    style={[
                      styles.durationButton,
                      duration === d.value && styles.durationSelected,
                    ]}
                    onPress={() => setDuration(d.value)}
                  >
                    <Text style={[
                      styles.durationText,
                      duration === d.value && styles.durationTextSelected,
                    ]}>
                      {d.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>الصوت المحيط</Text>
              <View style={styles.soundGrid}>
                {ambientSounds.map((sound) => (
                  <TouchableOpacity
                    key={sound.id}
                    style={[
                      styles.soundButton,
                      selectedSound === sound.id && styles.soundSelected,
                    ]}
                    onPress={() => setSelectedSound(sound.id)}
                  >
                    <Ionicons
                      name={sound.icon as any}
                      size={28}
                      color={selectedSound === sound.id ? '#7C4DFF' : '#666'}
                    />
                    <Text style={[
                      styles.soundText,
                      selectedSound === sound.id && styles.soundTextSelected,
                    ]}>
                      {sound.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity style={styles.startButton} onPress={startMeditation}>
              <Ionicons name="play" size={24} color="#fff" />
              <Text style={styles.startButtonText}>ابدأ التأمل</Text>
            </TouchableOpacity>
          </>
        ) : isComplete ? (
          <View style={styles.completeContainer}>
            <Ionicons name="checkmark-circle" size={100} color="#4CAF50" />
            <Text style={styles.completeTitle}>أحسنت! 🙏</Text>
            <Text style={styles.completeText}>
              لقد أكملت جلسة تأمل لمدة {duration} دقائق
            </Text>
            <Text style={styles.completeQuote}>
              "السلام يأتي من الداخل. لا تبحث عنه في الخارج."
            </Text>
            <TouchableOpacity style={styles.resetButton} onPress={resetMeditation}>
              <Text style={styles.resetButtonText}>جلسة جديدة</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.timerContainer}>
            <Text style={styles.breathText}>
              {breathAnim._value < 0.5 ? 'شهيق...' : 'زفير...'}
            </Text>
            
            <Animated.View style={[styles.timerCircle, { transform: [{ scale: breathScale }] }]}>
              <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
              <Text style={styles.timerLabel}>متبقي</Text>
            </Animated.View>

            <View style={styles.soundIndicator}>
              <Ionicons
                name={ambientSounds.find(s => s.id === selectedSound)?.icon as any || 'volume-mute'}
                size={24}
                color="#7C4DFF"
              />
              <Text style={styles.soundIndicatorText}>
                {ambientSounds.find(s => s.id === selectedSound)?.label}
              </Text>
            </View>

            <View style={styles.instructions}>
              <Text style={styles.instructionText}>🧘 اجلس بشكل مريح</Text>
              <Text style={styles.instructionText}>👃 تنفس ببطء وعمق</Text>
              <Text style={styles.instructionText}>🧠 ركز على اللحظة الحالية</Text>
            </View>

            <TouchableOpacity style={styles.stopButton} onPress={stopMeditation}>
              <Ionicons name="stop" size={24} color="#fff" />
              <Text style={styles.stopButtonText}>إيقاف</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f4ff' },
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
  content: { padding: 20 },
  header: { alignItems: 'center', marginBottom: 32 },
  title: { fontSize: 26, fontFamily: 'Cairo_700Bold', color: '#333', marginTop: 16 },
  subtitle: { fontSize: 14, fontFamily: 'Cairo_400Regular', color: '#666', marginTop: 4 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontFamily: 'Cairo_700Bold', color: '#333', marginBottom: 12, textAlign: 'right' },
  durationGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  durationButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  durationSelected: { backgroundColor: '#EDE7F6', borderColor: '#7C4DFF' },
  durationText: { fontSize: 14, fontFamily: 'Cairo_400Regular', color: '#666' },
  durationTextSelected: { color: '#7C4DFF', fontFamily: 'Cairo_700Bold' },
  soundGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  soundButton: {
    width: '30%',
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  soundSelected: { backgroundColor: '#EDE7F6', borderColor: '#7C4DFF' },
  soundText: { fontSize: 11, fontFamily: 'Cairo_400Regular', color: '#666', marginTop: 8, textAlign: 'center' },
  soundTextSelected: { color: '#7C4DFF', fontFamily: 'Cairo_700Bold' },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7C4DFF',
    padding: 18,
    borderRadius: 16,
    gap: 10,
    marginTop: 20,
  },
  startButtonText: { fontSize: 20, fontFamily: 'Cairo_700Bold', color: '#fff' },
  timerContainer: { alignItems: 'center', paddingVertical: 40 },
  breathText: { fontSize: 24, fontFamily: 'Cairo_700Bold', color: '#7C4DFF', marginBottom: 30 },
  timerCircle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#7C4DFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  timerText: { fontSize: 48, fontFamily: 'Cairo_700Bold', color: '#fff' },
  timerLabel: { fontSize: 16, fontFamily: 'Cairo_400Regular', color: '#E8E0FF' },
  soundIndicator: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 30 },
  soundIndicatorText: { fontSize: 14, fontFamily: 'Cairo_400Regular', color: '#7C4DFF' },
  instructions: { marginBottom: 30 },
  instructionText: { fontSize: 16, fontFamily: 'Cairo_400Regular', color: '#666', textAlign: 'center', marginVertical: 4 },
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
  completeContainer: { alignItems: 'center', paddingVertical: 40 },
  completeTitle: { fontSize: 32, fontFamily: 'Cairo_700Bold', color: '#4CAF50', marginTop: 20 },
  completeText: { fontSize: 18, fontFamily: 'Cairo_400Regular', color: '#666', marginTop: 12, textAlign: 'center' },
  completeQuote: { fontSize: 16, fontFamily: 'Cairo_400Regular', color: '#999', marginTop: 24, textAlign: 'center', fontStyle: 'italic', paddingHorizontal: 20 },
  resetButton: { backgroundColor: '#7C4DFF', paddingHorizontal: 40, paddingVertical: 14, borderRadius: 12, marginTop: 30 },
  resetButtonText: { fontSize: 18, fontFamily: 'Cairo_700Bold', color: '#fff' },
});