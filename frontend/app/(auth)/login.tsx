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

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <Ionicons name="sparkles" size={50} color={COLORS.gold} />
          </View>
          <Text style={styles.title}>اسأل يازو</Text>
          <Text style={styles.titleEn}>Ask Yazo</Text>
          <Text style={styles.subtitle}>مرحباً بعودتك</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
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
              placeholder="كلمة المرور"
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

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <Text style={styles.buttonText}>جاري تسجيل الدخول...</Text>
            ) : (
              <>
                <Text style={styles.buttonText}>تسجيل الدخول</Text>
                <Ionicons name="arrow-back" size={20} color={COLORS.primary} />
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => router.push('/(auth)/register')}
          >
            <Text style={styles.linkText}>ليس لديك حساب؟</Text>
            <Text style={styles.linkTextHighlight}> سجل الآن</Text>
          </TouchableOpacity>
        </View>

        {/* Decorative */}
        <View style={styles.decorativeSection}>
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>رحلتك نحو التغيير</Text>
            <View style={styles.dividerLine} />
          </View>
          
          <View style={styles.pillarsRow}>
            <View style={styles.pillarItem}>
              <Ionicons name="barbell" size={20} color={COLORS.gold} />
              <Text style={styles.pillarText}>اللياقة</Text>
            </View>
            <View style={styles.pillarItem}>
              <Ionicons name="nutrition" size={20} color={COLORS.gold} />
              <Text style={styles.pillarText}>التغذية</Text>
            </View>
            <View style={styles.pillarItem}>
              <Ionicons name="heart" size={20} color={COLORS.gold} />
              <Text style={styles.pillarText}>النفسية</Text>
            </View>
            <View style={styles.pillarItem}>
              <Ionicons name="sparkles" size={20} color={COLORS.gold} />
              <Text style={styles.pillarText}>الروحية</Text>
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
    justifyContent: 'center',
    padding: 24,
  },

  // Logo Section
  logoSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: COLORS.gold,
  },
  title: {
    fontSize: 36,
    fontFamily: FONTS.bold,
    color: COLORS.gold,
    marginBottom: 4,
  },
  titleEn: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    fontFamily: FONTS.semiBold,
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
    marginBottom: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 56,
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: COLORS.text,
    textAlign: 'right',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.gold,
    borderRadius: 16,
    height: 56,
    marginTop: 8,
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
    marginTop: 24,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  linkText: {
    color: COLORS.textMuted,
    fontSize: 16,
    fontFamily: FONTS.regular,
  },
  linkTextHighlight: {
    color: COLORS.gold,
    fontSize: 16,
    fontFamily: FONTS.bold,
  },

  // Decorative
  decorativeSection: {
    marginTop: 40,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
  },
  pillarsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  pillarItem: {
    alignItems: 'center',
    gap: 6,
  },
  pillarText: {
    fontSize: 12,
    fontFamily: FONTS.semiBold,
    color: COLORS.textMuted,
  },
});
