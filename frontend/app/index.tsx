import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Cairo_400Regular, Cairo_700Bold } from '@expo-google-fonts/cairo';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

export default function Index() {
  const router = useRouter();
  
  const [fontsLoaded] = useFonts({
    Cairo_400Regular,
    Cairo_700Bold,
  });

  React.useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="chatbubble-ellipses" size={80} color="#2196F3" />
        <Text style={styles.title}>اسأل يازو</Text>
        <Text style={styles.subtitle}>رحلتك نحو الحياة الأفضل</Text>
      </View>

      <View style={styles.buttonsContainer}>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => router.push('/(auth)/login')}
        >
          <Text style={styles.buttonText}>تسجيل الدخول</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.buttonSecondary]}
          onPress={() => router.push('/(auth)/register')}
        >
          <Text style={[styles.buttonText, styles.buttonTextSecondary]}>إنشاء حساب جديد</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.pillarsContainer}>
        <Text style={styles.pillarsTitle}>الركائز الأربع للعافية</Text>
        <View style={styles.pillarsGrid}>
          <View style={styles.pillarCard}>
            <Ionicons name="barbell" size={32} color="#4CAF50" />
            <Text style={styles.pillarText}>البدنية</Text>
          </View>
          <View style={styles.pillarCard}>
            <Ionicons name="nutrition" size={32} color="#FF9800" />
            <Text style={styles.pillarText}>التغذوية</Text>
          </View>
          <View style={styles.pillarCard}>
            <Ionicons name="happy" size={32} color="#9C27B0" />
            <Text style={styles.pillarText}>النفسية</Text>
          </View>
          <View style={styles.pillarCard}>
            <Ionicons name="leaf" size={32} color="#00BCD4" />
            <Text style={styles.pillarText}>الروحية</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>askyazo.com</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#2196F3',
    marginTop: 16,
    textAlign: 'center',
    fontFamily: 'Cairo_700Bold',
  },
  subtitle: {
    fontSize: 22,
    color: '#666',
    marginTop: 8,
    fontFamily: 'Cairo_400Regular',
  },
  buttonsContainer: {
    marginBottom: 48,
  },
  button: {
    backgroundColor: '#2196F3',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonSecondary: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  buttonText: {
    color: '#fff',
    fontSize: 20,
    fontFamily: 'Cairo_700Bold',
  },
  buttonTextSecondary: {
    color: '#2196F3',
  },
  pillarsContainer: {
    alignItems: 'center',
  },
  pillarsTitle: {
    fontSize: 22,
    fontFamily: 'Cairo_700Bold',
    color: '#333',
    marginBottom: 24,
  },
  pillarsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
  },
  pillarCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: 120,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  pillarText: {
    fontSize: 16,
    fontFamily: 'Cairo_700Bold',
    color: '#333',
    marginTop: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
    color: '#2196F3',
    fontFamily: 'Cairo_700Bold',
  },
});