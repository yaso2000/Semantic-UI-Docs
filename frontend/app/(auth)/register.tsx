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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts, Cairo_400Regular, Cairo_700Bold } from '@expo-google-fonts/cairo';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'client' | 'coach'>('client');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [fontsLoaded] = useFonts({ Cairo_400Regular, Cairo_700Bold });

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
        role: role
      });

      const { access_token, user } = response.data;
      
      await AsyncStorage.setItem('token', access_token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      
      Alert.alert('نجاح', 'تم إنشاء الحساب بنجاح!');
      router.replace('/(tabs)/home');
    } catch (error: any) {
      Alert.alert('فشل التسجيل', error.response?.data?.detail || 'حدث خطأ');
    } finally {
      setLoading(false);
    }
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Ionicons name="chatbubble-ellipses" size={60} color="#2196F3" />
          <Text style={styles.title}>اسأل يازو</Text>
          <Text style={styles.subtitle}>إنشاء حساب جديد</Text>
        </View>

        <View style={styles.form}>
          {/* Role Selection */}
          <Text style={styles.roleLabel}>نوع الحساب</Text>
          <View style={styles.roleContainer}>
            <TouchableOpacity
              style={[
                styles.roleButton,
                role === 'client' && styles.roleButtonActive,
                { borderTopRightRadius: 12, borderBottomRightRadius: 12 }
              ]}
              onPress={() => setRole('client')}
            >
              <Ionicons 
                name="person" 
                size={24} 
                color={role === 'client' ? '#fff' : '#666'} 
              />
              <Text style={[
                styles.roleText,
                role === 'client' && styles.roleTextActive
              ]}>متدرب</Text>
              <Text style={[
                styles.roleSubtext,
                role === 'client' && styles.roleSubtextActive
              ]}>أريد التدريب</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.roleButton,
                role === 'coach' && styles.roleButtonActiveCoach,
                { borderTopLeftRadius: 12, borderBottomLeftRadius: 12 }
              ]}
              onPress={() => setRole('coach')}
            >
              <Ionicons 
                name="fitness" 
                size={24} 
                color={role === 'coach' ? '#fff' : '#666'} 
              />
              <Text style={[
                styles.roleText,
                role === 'coach' && styles.roleTextActive
              ]}>مدرب</Text>
              <Text style={[
                styles.roleSubtext,
                role === 'coach' && styles.roleSubtextActive
              ]}>أريد التدريب للآخرين</Text>
            </TouchableOpacity>
          </View>

          {role === 'coach' && (
            <View style={styles.coachNote}>
              <Ionicons name="information-circle" size={20} color="#FF9800" />
              <Text style={styles.coachNoteText}>
                حساب المدرب يتطلب اشتراك شهري للوصول الكامل للمنصة
              </Text>
            </View>
          )}

          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="الاسم الكامل"
              value={fullName}
              onChangeText={setFullName}
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="البريد الإلكتروني"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="كلمة المرور (6 أحرف على الأقل)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholderTextColor="#999"
            />
          </View>

          <TouchableOpacity
            style={[
              styles.button, 
              loading && styles.buttonDisabled,
              role === 'coach' && styles.buttonCoach
            ]}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'جاري الإنشاء...' : role === 'coach' ? 'إنشاء حساب مدرب' : 'إنشاء حساب متدرب'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => router.back()}
          >
            <Text style={styles.linkText}>لديك حساب بالفعل؟ سجل الدخول</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Cairo_700Bold',
    color: '#2196F3',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 18,
    fontFamily: 'Cairo_400Regular',
    color: '#666',
    marginTop: 4,
  },
  form: {
    width: '100%',
  },
  roleLabel: {
    fontSize: 16,
    fontFamily: 'Cairo_700Bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'right',
  },
  roleContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  roleButton: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  roleButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  roleButtonActiveCoach: {
    backgroundColor: '#FF9800',
    borderColor: '#FF9800',
  },
  roleText: {
    fontSize: 16,
    fontFamily: 'Cairo_700Bold',
    color: '#333',
    marginTop: 8,
  },
  roleTextActive: {
    color: '#fff',
  },
  roleSubtext: {
    fontSize: 11,
    fontFamily: 'Cairo_400Regular',
    color: '#666',
    marginTop: 2,
  },
  roleSubtextActive: {
    color: 'rgba(255,255,255,0.8)',
  },
  coachNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  coachNoteText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Cairo_400Regular',
    color: '#E65100',
    textAlign: 'right',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 56,
    fontSize: 16,
    fontFamily: 'Cairo_400Regular',
    color: '#333',
    textAlign: 'right',
  },
  button: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonCoach: {
    backgroundColor: '#FF9800',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Cairo_700Bold',
  },
  linkButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  linkText: {
    color: '#2196F3',
    fontSize: 16,
    fontFamily: 'Cairo_400Regular',
  },
});
