import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Alexandria_400Regular, Alexandria_600SemiBold, Alexandria_700Bold } from '@expo-google-fonts/alexandria';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../src/constants/theme';

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const [fontsLoaded] = useFonts({
    Alexandria_400Regular,
    Alexandria_600SemiBold,
    Alexandria_700Bold,
  });

  if (!fontsLoaded) return null;

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      {/* Logo Section */}
      <View style={styles.logoSection}>
        <Image 
          source={require('../assets/images/logo.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.appName}>اسأل يازو</Text>
        <Text style={styles.tagline}>رحلتك نحو حياة أفضل تبدأ هنا</Text>
      </View>

      {/* Features Icons */}
      <View style={styles.featuresRow}>
        <View style={styles.featureItem}>
          <View style={[styles.featureIcon, { backgroundColor: `${COLORS.physical}15` }]}>
            <Ionicons name="fitness" size={24} color={COLORS.physical} />
          </View>
          <Text style={styles.featureText}>الجسدي</Text>
        </View>
        <View style={styles.featureItem}>
          <View style={[styles.featureIcon, { backgroundColor: `${COLORS.mental}15` }]}>
            <Ionicons name="happy" size={24} color={COLORS.mental} />
          </View>
          <Text style={styles.featureText}>النفسي</Text>
        </View>
        <View style={styles.featureItem}>
          <View style={[styles.featureIcon, { backgroundColor: `${COLORS.social}15` }]}>
            <Ionicons name="people" size={24} color={COLORS.social} />
          </View>
          <Text style={styles.featureText}>الاجتماعي</Text>
        </View>
        <View style={styles.featureItem}>
          <View style={[styles.featureIcon, { backgroundColor: `${COLORS.spiritual}15` }]}>
            <Ionicons name="sparkles" size={24} color={COLORS.spiritual} />
          </View>
          <Text style={styles.featureText}>الروحي</Text>
        </View>
      </View>

      {/* Start Button */}
      <View style={styles.buttonSection}>
        <TouchableOpacity 
          style={styles.startButton}
          onPress={() => router.push('/(auth)/login')}
          activeOpacity={0.8}
        >
          <Text style={styles.startButtonText}>ابدأ الآن</Text>
          <Ionicons name="arrow-back" size={22} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Ask Yazo</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.xl,
    justifyContent: 'space-between',
  },
  logoSection: {
    alignItems: 'center',
    marginTop: SPACING['3xl'],
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: SPACING.lg,
  },
  appName: {
    fontSize: 36,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  tagline: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  featuresRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: SPACING.md,
  },
  featureItem: {
    alignItems: 'center',
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  featureText: {
    fontSize: 12,
    fontFamily: FONTS.semiBold,
    color: COLORS.textSecondary,
  },
  buttonSection: {
    paddingHorizontal: SPACING.md,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.teal,
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.full,
    gap: SPACING.sm,
    ...SHADOWS.lg,
  },
  startButtonText: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: SPACING.lg,
  },
  footerText: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    color: COLORS.textMuted,
  },
});
