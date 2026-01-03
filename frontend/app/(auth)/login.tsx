import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts, Alexandria_400Regular, Alexandria_600SemiBold, Alexandria_700Bold } from '@expo-google-fonts/alexandria';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../src/constants/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    Alexandria_400Regular,
    Alexandria_600SemiBold,
    Alexandria_700Bold,
  });

  const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('خطأ', 'الرجاء ملء جميع الحقول');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password
      });

      const { access_token, user } = response.data;
      
      await AsyncStorage.setItem('token', access_token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      
      router.replace('/(tabs)/home');
    } catch (error: any) {
      Alert.alert('فشل تسجيل الدخول', error.response?.data?.detail || 'حدث خطأ في الاتصال');
    } finally {
      setLoading(false);
    }
  };

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <Ionicons name="leaf" size={48} color={COLORS.teal} />
          </View>
          <Text style={styles.title}>اسأل يازو</Text>
          <Text style={styles.titleEn}>Ask Yazo</Text>
          <Text style={styles.subtitle}>رحلتك نحو حياة متوازنة</Text>
        </View>

        {/* Welcome Card */}
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeTitle}>مرحباً بعودتك</Text>
          <Text style={styles.welcomeText}>
            سجّل دخولك لمتابعة رحلتك في التطوير الشامل
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>البريد الإلكتروني</Text>
            <View style={[
              styles.inputContainer,
              emailFocused && styles.inputContainerFocused
            ]}>
              <TextInput
                style={styles.input}
                placeholder="example@email.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor={COLORS.textMuted}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
              />
              <Ionicons 
                name="mail-outline" 
                size={20} 
                color={emailFocused ? COLORS.teal : COLORS.textMuted} 
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>كلمة المرور</Text>
            <View style={[
              styles.inputContainer,
              passwordFocused && styles.inputContainerFocused
            ]}>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholderTextColor={COLORS.textMuted}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons 
                  name={showPassword ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color={passwordFocused ? COLORS.teal : COLORS.textMuted} 
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <Text style={styles.buttonText}>جاري تسجيل الدخول...</Text>
            ) : (
              <View style={styles.buttonContent}>
                <Ionicons name="arrow-back" size={20} color={COLORS.white} />
                <Text style={styles.buttonText}>تسجيل الدخول</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => router.push('/(auth)/register')}
          >
            <Text style={styles.linkText}>ليس لديك حساب؟</Text>
            <Text style={styles.linkTextHighlight}> إنشاء حساب جديد</Text>
          </TouchableOpacity>
        </View>

        {/* Pillars Section */}
        <View style={styles.pillarsSection}>
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>الأعمدة الأربعة للحياة المتوازنة</Text>
            <View style={styles.dividerLine} />
          </View>
          
          <View style={styles.pillarsRow}>
            <View style={[styles.pillarItem, { backgroundColor: `${COLORS.physical}15` }]}>
              <Ionicons name="fitness" size={24} color={COLORS.physical} />
              <Text style={[styles.pillarText, { color: COLORS.physical }]}>البدني</Text>
            </View>
            <View style={[styles.pillarItem, { backgroundColor: `${COLORS.nutritional}15` }]}>
              <Ionicons name="nutrition" size={24} color={COLORS.nutritional} />
              <Text style={[styles.pillarText, { color: COLORS.nutritional }]}>التغذوي</Text>
            </View>
            <View style={[styles.pillarItem, { backgroundColor: `${COLORS.mental}15` }]}>
              <Ionicons name="happy" size={24} color={COLORS.mental} />
              <Text style={[styles.pillarText, { color: COLORS.mental }]}>النفسي</Text>
            </View>
            <View style={[styles.pillarItem, { backgroundColor: `${COLORS.spiritual}15` }]}>
              <Ionicons name="sparkles" size={24} color={COLORS.spiritual} />
              <Text style={[styles.pillarText, { color: COLORS.spiritual }]}>الروحي</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    padding: SPACING.lg,
    paddingTop: SPACING['2xl'],
  },

  // Logo Section
  logoSection: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  logoContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: `${COLORS.teal}10`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    borderWidth: 2,
    borderColor: `${COLORS.teal}30`,
  },
  title: {
    fontSize: 32,
    fontFamily: FONTS.bold,
    color: COLORS.teal,
    marginBottom: 2,
  },
  titleEn: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },

  // Welcome Card
  welcomeCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.md,
  },
  welcomeTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    textAlign: 'right',
    marginBottom: SPACING.xs,
  },
  welcomeText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'right',
  },

  // Form
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
    textAlign: 'right',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  inputContainerFocused: {
    borderColor: COLORS.teal,
    borderWidth: 2,
  },
  input: {
    flex: 1,
    height: 52,
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: COLORS.text,
    textAlign: 'right',
  },
  button: {
    backgroundColor: COLORS.teal,
    borderRadius: RADIUS.md,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.md,
    ...SHADOWS.md,
  },
  buttonDisabled: {
    backgroundColor: COLORS.tealLight,
    opacity: 0.7,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontFamily: FONTS.bold,
  },
  linkButton: {
    marginTop: SPACING.lg,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  linkText: {
    color: COLORS.textSecondary,
    fontSize: 15,
    fontFamily: FONTS.regular,
  },
  linkTextHighlight: {
    color: COLORS.teal,
    fontSize: 15,
    fontFamily: FONTS.bold,
  },

  // Pillars Section
  pillarsSection: {
    marginTop: SPACING.xl,
    paddingTop: SPACING.lg,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.divider,
  },
  dividerText: {
    marginHorizontal: SPACING.md,
    fontSize: 12,
    fontFamily: FONTS.semiBold,
    color: COLORS.textMuted,
  },
  pillarsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pillarItem: {
    alignItems: 'center',
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    width: '23%',
    gap: SPACING.xs,
  },
  pillarText: {
    fontSize: 11,
    fontFamily: FONTS.semiBold,
    textAlign: 'center',
  },
});
