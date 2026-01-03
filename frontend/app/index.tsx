import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Alexandria_400Regular, Alexandria_600SemiBold, Alexandria_700Bold } from '@expo-google-fonts/alexandria';
import * as SplashScreen from 'expo-splash-screen';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../src/constants/theme';

SplashScreen.preventAutoHideAsync();

export default function Index() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const [fontsLoaded] = useFonts({
    Alexandria_400Regular,
    Alexandria_600SemiBold,
    Alexandria_700Bold});

  React.useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      <View style={styles.content}>
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <Ionicons name="leaf" size={56} color={COLORS.teal} />
          </View>
          <Text style={styles.title}>اسأل يازو</Text>
          <Text style={styles.titleEn}>Ask Yazo</Text>
          <Text style={styles.subtitle}>رحلتك نحو حياة متوازنة</Text>
        </View>

        {/* Features - Four Pillars */}
        <View style={styles.featuresCard}>
          <Text style={styles.featuresTitle}>الأعمدة الأربعة للحياة المتوازنة</Text>
          <View style={styles.featuresContainer}>
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: `${COLORS.physical}15` }]}>
                <Ionicons name="fitness" size={24} color={COLORS.physical} />
              </View>
              <Text style={[styles.featureText, { color: COLORS.physical }]}>البدني</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: `${COLORS.nutritional}20` }]}>
                <Ionicons name="nutrition" size={24} color={COLORS.nutritional} />
              </View>
              <Text style={[styles.featureText, { color: COLORS.nutritional }]}>التغذوي</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: `${COLORS.mental}15` }]}>
                <Ionicons name="happy" size={24} color={COLORS.mental} />
              </View>
              <Text style={[styles.featureText, { color: COLORS.mental }]}>النفسي</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: `${COLORS.spiritual}15` }]}>
                <Ionicons name="sparkles" size={24} color={COLORS.spiritual} />
              </View>
              <Text style={[styles.featureText, { color: COLORS.spiritual }]}>الروحي</Text>
            </View>
          </View>
        </View>

        {/* Buttons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => router.push('/(auth)/login')}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={20} color={COLORS.white} />
            <Text style={styles.primaryButtonText}>تسجيل الدخول</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={() => router.push('/(auth)/register')}
            activeOpacity={0.7}
          >
            <Text style={styles.secondaryButtonText}>إنشاء حساب جديد</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerDivider}>
            <View style={styles.dividerLine} />
            <Text style={styles.footerText}>ابدأ رحلتك الآن</Text>
            <View style={styles.dividerLine} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background},
  content: {
    flex: 1,
    padding: SPACING.lg,
    justifyContent: 'center'},

  // Logo Section
  logoSection: {
    alignItems: 'center',
    marginBottom: SPACING.xl},
  logoContainer: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: `${COLORS.teal}10`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    borderWidth: 2,
    borderColor: `${COLORS.teal}25`},
  title: {
    fontSize: 40,
    fontFamily: FONTS.bold,
    color: COLORS.teal,
    marginBottom: 4},
  titleEn: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    marginBottom: SPACING.sm},
  subtitle: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary},

  // Features Card
  featuresCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    ...SHADOWS.md},
  featuresTitle: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.md},
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around'},
  featureItem: {
    alignItems: 'center',
    width: '22%'},
  featureIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs},
  featureText: {
    fontSize: 11,
    fontFamily: FONTS.semiBold,
    textAlign: 'center'},

  // Buttons
  buttonsContainer: {
    gap: SPACING.md,
    marginBottom: SPACING.lg},
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.teal,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.full,
    gap: SPACING.sm,
    ...SHADOWS.md},
  primaryButtonText: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.white},
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.full,
    borderWidth: 2,
    borderColor: COLORS.teal},
  secondaryButtonText: {
    fontSize: 18,
    fontFamily: FONTS.semiBold,
    color: COLORS.teal},

  // Footer
  footer: {
    alignItems: 'center'},
  footerDivider: {
    flexDirection: 'row',
    alignItems: 'center'},
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.divider},
  footerText: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    marginHorizontal: SPACING.md}});
