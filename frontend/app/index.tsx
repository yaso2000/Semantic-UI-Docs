import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function Index() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="chatbubble-ellipses" size={80} color="#2196F3" />
        <Text style={styles.title}>Ask Yazo</Text>
        <Text style={styles.subtitle}>رحلتك نحو الحياة الأفضل</Text>
        <Text style={styles.subtitleEn}>Your Journey to a Better Life</Text>
      </View>

      <View style={styles.buttonsContainer}>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => router.push('/(auth)/login')}
        >
          <Text style={styles.buttonText}>تسجيل الدخول / Login</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.buttonSecondary]}
          onPress={() => router.push('/(auth)/register')}
        >
          <Text style={[styles.buttonText, styles.buttonTextSecondary]}>التسجيل / Register</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.pillarsContainer}>
        <Text style={styles.pillarsTitle}>أربع ركائز للعافية</Text>
        <Text style={styles.pillarsTitleEn}>Four Pillars of Wellness</Text>
        <View style={styles.pillarsGrid}>
          <View style={styles.pillarCard}>
            <Ionicons name="barbell" size={32} color="#4CAF50" />
            <Text style={styles.pillarText}>البدني</Text>
            <Text style={styles.pillarTextEn}>Physical</Text>
          </View>
          <View style={styles.pillarCard}>
            <Ionicons name="nutrition" size={32} color="#FF9800" />
            <Text style={styles.pillarText}>التغذوي</Text>
            <Text style={styles.pillarTextEn}>Nutritional</Text>
          </View>
          <View style={styles.pillarCard}>
            <Ionicons name="happy" size={32} color="#9C27B0" />
            <Text style={styles.pillarText}>النفسي</Text>
            <Text style={styles.pillarTextEn}>Mental</Text>
          </View>
          <View style={styles.pillarCard}>
            <Ionicons name="leaf" size={32} color="#00BCD4" />
            <Text style={styles.pillarText}>الروحي</Text>
            <Text style={styles.pillarTextEn}>Spiritual</Text>
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
    fontSize: 38,
    fontWeight: 'bold',
    color: '#2196F3',
    marginTop: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 20,
    color: '#666',
    marginTop: 8,
    fontWeight: '600',
  },
  subtitleEn: {
    fontSize: 16,
    color: '#999',
    marginTop: 4,
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
    fontSize: 18,
    fontWeight: '600',
  },
  buttonTextSecondary: {
    color: '#2196F3',
  },
  pillarsContainer: {
    alignItems: 'center',
  },
  pillarsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  pillarsTitleEn: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
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
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
  },
  pillarTextEn: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '600',
  },
});