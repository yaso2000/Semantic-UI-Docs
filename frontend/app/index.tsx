import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Alexandria_400Regular, Alexandria_600SemiBold, Alexandria_700Bold } from '@expo-google-fonts/alexandria';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

const COLORS = {
  primary: '#0A1628',
  secondary: '#1A2744',
  gold: '#D4AF37',
  goldLight: '#F4E4BC',
  white: '#FFFFFF',
  text: '#E8E8E8',
  textMuted: '#8A9BB8',
  border: '#2A3A5C',
};

export default function Index() {
  const router = useRouter();
  
  const [fontsLoaded] = useFonts({
    Alexandria_400Regular,
    Alexandria_600SemiBold,
    Alexandria_700Bold,
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
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      <View style={styles.content}>
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <Ionicons name="sparkles" size={60} color={COLORS.gold} />
          </View>
          <Text style={styles.title}>اسأل يازو</Text>
          <Text style={styles.titleEn}>Ask Yazo</Text>
          <Text style={styles.subtitle}>رحلتك نحو الحياة الأفضل</Text>
        </View>

        {/* Features */}
        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="barbell" size={24} color={COLORS.gold} />
            </View>
            <Text style={styles.featureText}>اللياقة البدنية</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="nutrition" size={24} color={COLORS.gold} />
            </View>
            <Text style={styles.featureText}>الصحة الغذائية</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="heart" size={24} color={COLORS.gold} />
            </View>
            <Text style={styles.featureText}>الصحة النفسية</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="sparkles" size={24} color={COLORS.gold} />
            </View>
            <Text style={styles.featureText}>الصحة الروحية</Text>
          </View>
        </View>

        {/* Buttons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.primaryButtonText}>تسجيل الدخول</Text>
            <Ionicons name="arrow-back" size={20} color={COLORS.primary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={() => router.push('/(auth)/register')}
          >
            <Text style={styles.secondaryButtonText}>إنشاء حساب جديد</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>منهج 4 ركائز للتغيير الشامل</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },

  // Logo Section
  logoSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: COLORS.gold,
  },
  title: {
    fontSize: 42,
    fontFamily: 'Alexandria_700Bold',
    color: COLORS.gold,
    marginBottom: 4,
  },
  titleEn: {
    fontSize: 18,
    fontFamily: 'Alexandria_400Regular',
    color: COLORS.textMuted,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Alexandria_400Regular',
    color: COLORS.text,
  },

  // Features
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 40,
  },
  featureItem: {
    alignItems: 'center',
    width: '45%',
  },
  featureIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  featureText: {
    fontSize: 12,
    fontFamily: 'Alexandria_600SemiBold',
    color: COLORS.text,
  },

  // Buttons
  buttonsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.gold,
    paddingVertical: 16,
    borderRadius: 30,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 18,
    fontFamily: 'Alexandria_700Bold',
    color: COLORS.primary,
  },
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: COLORS.gold,
  },
  secondaryButtonText: {
    fontSize: 18,
    fontFamily: 'Alexandria_600SemiBold',
    color: COLORS.gold,
  },

  // Footer
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    fontFamily: 'Alexandria_400Regular',
    color: COLORS.textMuted,
  },
});
