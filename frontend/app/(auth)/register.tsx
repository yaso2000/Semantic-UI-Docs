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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts, Alexandria_400Regular, Alexandria_600SemiBold, Alexandria_700Bold } from '@expo-google-fonts/alexandria';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../src/constants/theme';

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    Alexandria_400Regular,
    Alexandria_600SemiBold,
    Alexandria_700Bold,
  });

  const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

  const handleRegister = async () => {
    if (!email || !password || !fullName) {
      Alert.alert('خطأ', 'الرجاء ملء جميع الحقول');
      return;
    }

    if (password.length < 6) {
      Alert.alert('خطأ', 'يجب أن تكون كلمة المرور 6 أحرف على الأقل');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/auth/register`, {
        email,
        password,
        full_name: fullName,
        role: 'trainee'
      });

      const { access_token, user } = response.data;
      
      await AsyncStorage.setItem('token', access_token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      
      router.replace('/(tabs)/home');
    } catch (error: any) {
      Alert.alert('فشل التسجيل', error.response?.data?.detail || 'حدث خطأ');
    } finally {
      setLoading(false);
    }
  };

  if (!fontsLoaded) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header with back button */}
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-forward" size={24} color={COLORS.teal} />
          </TouchableOpacity>

        {/* Logo Section */}
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <Ionicons name="person-add" size={42} color={COLORS.teal} />
          </View>
          <Text style={styles.title}>إنشاء حساب</Text>
          <Text style={styles.subtitle}>انضم لعائلة اسأل يازو</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>الاسم الكامل</Text>
            <View style={[
              styles.inputContainer,
              nameFocused && styles.inputContainerFocused
            ]}>
              <TextInput
                style={styles.input}
                placeholder="أدخل اسمك الكامل"
                value={fullName}
                onChangeText={setFullName}
                placeholderTextColor={COLORS.textMuted}
                onFocus={() => setNameFocused(true)}
                onBlur={() => setNameFocused(false)}
              />
              <Ionicons 
                name="person-outline" 
                size={20} 
                color={nameFocused ? COLORS.teal : COLORS.textMuted} 
              />
            </View>
          </View>

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
                placeholder="6 أحرف على الأقل"
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

          {/* Info Box */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color={COLORS.sage} />
            <Text style={styles.infoText}>
              بإنشاء حسابك، ستتمكن من حجز جلسات تدريبية مع يازو والوصول لجميع الأدوات
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <Text style={styles.buttonText}>جاري إنشاء الحساب...</Text>
            ) : (
              <View style={styles.buttonContent}>
                <Ionicons name="checkmark-circle" size={22} color={COLORS.white} />
                <Text style={styles.buttonText}>إنشاء الحساب</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => router.back()}
          >
            <Text style={styles.linkText}>لديك حساب بالفعل؟</Text>
            <Text style={styles.linkTextHighlight}> سجل الدخول</Text>
          </TouchableOpacity>
        </View>

        {/* Features */}
        <View style={styles.featuresSection}>
          <Text style={styles.featuresTitle}>ماذا ستحصل عليه؟</Text>
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: `${COLORS.teal}15` }]}>
                <Ionicons name="chatbubbles" size={18} color={COLORS.teal} />
              </View>
              <Text style={styles.featureText}>محادثة مباشرة مع يازو</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: `${COLORS.sage}25` }]}>
                <Ionicons name="calendar" size={18} color={COLORS.sageDark} />
              </View>
              <Text style={styles.featureText}>حجز جلسات تدريبية</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: `${COLORS.gold}20` }]}>
                <Ionicons name="calculator" size={18} color={COLORS.goldDark} />
              </View>
              <Text style={styles.featureText}>أدوات وحاسبات متقدمة</Text>
            </View>
          </View>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </View>
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
    paddingTop: SPACING.md,
  },

  backBtn: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.md,
    zIndex: 10,
  },

  // Logo Section
  logoSection: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
    marginTop: SPACING.lg,
  },
  logoContainer: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: `${COLORS.teal}10`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    borderWidth: 2,
    borderColor: `${COLORS.teal}30`,
  },
  title: {
    fontSize: 28,
    fontFamily: FONTS.bold,
    color: COLORS.teal,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
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

  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: `${COLORS.sage}15`,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: `${COLORS.sage}40`,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'right',
    lineHeight: 22,
  },

  button: {
    backgroundColor: COLORS.teal,
    borderRadius: RADIUS.md,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: 18,
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

  // Features
  featuresSection: {
    marginTop: SPACING.xl,
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  featuresTitle: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  featuresList: {
    gap: SPACING.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'right',
  },
});
