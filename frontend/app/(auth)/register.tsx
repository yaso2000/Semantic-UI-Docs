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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts, Alexandria_400Regular, Alexandria_600SemiBold, Alexandria_700Bold } from '@expo-google-fonts/alexandria';
import { COLORS, FONTS } from '../../src/constants/theme';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header with back button */}
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color={COLORS.gold} />
        </TouchableOpacity>

        {/* Logo Section */}
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <Ionicons name="person-add" size={45} color={COLORS.gold} />
          </View>
          <Text style={styles.title}>إنشاء حساب</Text>
          <Text style={styles.subtitle}>انضم لعائلة اسأل يازو</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={22} color={COLORS.gold} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="الاسم الكامل"
              value={fullName}
              onChangeText={setFullName}
              placeholderTextColor={COLORS.textMuted}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={22} color={COLORS.gold} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="البريد الإلكتروني"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={22} color={COLORS.gold} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="كلمة المرور (6 أحرف على الأقل)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              placeholderTextColor={COLORS.textMuted}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons 
                name={showPassword ? "eye-off-outline" : "eye-outline"} 
                size={22} 
                color={COLORS.textMuted} 
              />
            </TouchableOpacity>
          </View>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color={COLORS.gold} />
            <Text style={styles.infoText}>
              بإنشاء حسابك، ستتمكن من حجز جلسات تدريبية مع يازو والوصول لجميع الأدوات
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <Text style={styles.buttonText}>جاري إنشاء الحساب...</Text>
            ) : (
              <>
                <Text style={styles.buttonText}>إنشاء الحساب</Text>
                <Ionicons name="checkmark-circle" size={22} color={COLORS.primary} />
              </>
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
              <View style={styles.featureIcon}>
                <Ionicons name="chatbubbles" size={18} color={COLORS.gold} />
              </View>
              <Text style={styles.featureText}>محادثة مباشرة مع يازو</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Ionicons name="calendar" size={18} color={COLORS.gold} />
              </View>
              <Text style={styles.featureText}>حجز جلسات تدريبية</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Ionicons name="calculator" size={18} color={COLORS.gold} />
              </View>
              <Text style={styles.featureText}>أدوات وحاسبات متقدمة</Text>
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
    backgroundColor: COLORS.primary,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 60,
  },

  backBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    zIndex: 10,
  },

  // Logo Section
  logoSection: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 20,
  },
  logoContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: COLORS.gold,
  },
  title: {
    fontSize: 28,
    fontFamily: FONTS.bold,
    color: COLORS.gold,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: COLORS.text,
  },

  // Form
  form: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondary,
    borderRadius: 16,
    marginBottom: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 54,
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: COLORS.text,
    textAlign: 'right',
  },

  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: COLORS.goldLight,
    textAlign: 'right',
    lineHeight: 22,
  },

  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.gold,
    borderRadius: 16,
    height: 56,
    gap: 8,
  },
  buttonDisabled: {
    backgroundColor: COLORS.goldDark,
    opacity: 0.7,
  },
  buttonText: {
    color: COLORS.primary,
    fontSize: 18,
    fontFamily: FONTS.bold,
  },
  linkButton: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  linkText: {
    color: COLORS.textMuted,
    fontSize: 15,
    fontFamily: FONTS.regular,
  },
  linkTextHighlight: {
    color: COLORS.gold,
    fontSize: 15,
    fontFamily: FONTS.bold,
  },

  // Features
  featuresSection: {
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  featuresTitle: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    textAlign: 'right',
  },
});
