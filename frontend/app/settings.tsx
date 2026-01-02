import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFonts, Cairo_400Regular, Cairo_700Bold } from '@expo-google-fonts/cairo';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen() {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [reminderTime, setReminderTime] = useState('08:00');
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  const [fontsLoaded] = useFonts({ Cairo_400Regular, Cairo_700Bold });

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const userStr = await AsyncStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
  };

  const handleLogout = async () => {
    Alert.alert('تسجيل الخروج', 'هل أنت متأكد من تسجيل الخروج؟', [
      { text: 'إلغاء', style: 'cancel' },
      { 
        text: 'تسجيل الخروج', 
        style: 'destructive', 
        onPress: async () => {
          await AsyncStorage.multiRemove(['token', 'user']);
          router.replace('/(auth)/login' as any);
        }
      }
    ]);
  };

  const clearCache = async () => {
    Alert.alert('مسح الذاكرة المؤقتة', 'سيتم مسح البيانات المحفوظة محلياً. هل تريد المتابعة؟', [
      { text: 'إلغاء', style: 'cancel' },
      { 
        text: 'مسح', 
        style: 'destructive', 
        onPress: async () => {
          await AsyncStorage.multiRemove(['habits', 'wheel_data', 'intake_completed']);
          Alert.alert('تم', 'تم مسح الذاكرة المؤقتة');
        }
      }
    ]);
  };

  if (!fontsLoaded) return null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>الإعدادات</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* الحساب */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>الحساب</Text>
          
          <View style={styles.profileCard}>
            <View style={styles.profileAvatar}>
              <Text style={styles.profileLetter}>
                {user?.full_name?.charAt(0).toUpperCase() || '?'}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.full_name || 'مستخدم'}</Text>
              <Text style={styles.profileEmail}>{user?.email || ''}</Text>
              <Text style={styles.profileRole}>
                {user?.role === 'admin' ? 'مدير المنصة' : 
                 user?.role === 'coach' ? 'مدرب' : 'متدرب'}
              </Text>
            </View>
          </View>
        </View>

        {/* الإشعارات */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>الإشعارات</Text>
          
          <View style={styles.settingItem}>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: '#e0e0e0', true: '#FFE0B2' }}
              thumbColor={notifications ? '#FF9800' : '#f4f3f4'}
            />
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>تفعيل الإشعارات</Text>
              <Text style={styles.settingDesc}>استلم إشعارات التذكير والرسائل</Text>
            </View>
            <Ionicons name="notifications" size={24} color="#FF9800" />
          </View>

          <TouchableOpacity style={styles.settingItem}>
            <Ionicons name="chevron-back" size={20} color="#999" />
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>وقت التذكير اليومي</Text>
              <Text style={styles.settingDesc}>{reminderTime} صباحاً</Text>
            </View>
            <Ionicons name="time" size={24} color="#4CAF50" />
          </TouchableOpacity>
        </View>

        {/* المظهر */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>المظهر</Text>
          
          <View style={styles.settingItem}>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: '#e0e0e0', true: '#E0E0E0' }}
              thumbColor={darkMode ? '#333' : '#f4f3f4'}
            />
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>الوضع الليلي</Text>
              <Text style={styles.settingDesc}>تغيير مظهر التطبيق (قريباً)</Text>
            </View>
            <Ionicons name="moon" size={24} color="#673AB7" />
          </View>
        </View>

        {/* البيانات */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>البيانات</Text>
          
          <TouchableOpacity style={styles.settingItem} onPress={clearCache}>
            <Ionicons name="chevron-back" size={20} color="#999" />
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>مسح الذاكرة المؤقتة</Text>
              <Text style={styles.settingDesc}>حذف البيانات المحفوظة محلياً</Text>
            </View>
            <Ionicons name="trash" size={24} color="#F44336" />
          </TouchableOpacity>
        </View>

        {/* الدعم */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>الدعم والمساعدة</Text>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => router.push('/help' as any)}
          >
            <Ionicons name="chevron-back" size={20} color="#999" />
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>الأسئلة الشائعة</Text>
              <Text style={styles.settingDesc}>إجابات على أكثر الأسئلة شيوعاً</Text>
            </View>
            <Ionicons name="help-circle" size={24} color="#2196F3" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => router.push('/help' as any)}
          >
            <Ionicons name="chevron-back" size={20} color="#999" />
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>شروط الاستخدام</Text>
              <Text style={styles.settingDesc}>الشروط والأحكام</Text>
            </View>
            <Ionicons name="document-text" size={24} color="#FF9800" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <Ionicons name="chevron-back" size={20} color="#999" />
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>تواصل معنا</Text>
              <Text style={styles.settingDesc}>support@askyazo.com</Text>
            </View>
            <Ionicons name="mail" size={24} color="#4CAF50" />
          </TouchableOpacity>
        </View>

        {/* زر تسجيل الخروج */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutBtnText}>تسجيل الخروج</Text>
          <Ionicons name="log-out" size={22} color="#F44336" />
        </TouchableOpacity>

        {/* الإصدار */}
        <View style={styles.versionSection}>
          <Text style={styles.appName}>Ask Yazo</Text>
          <Text style={styles.versionText}>الإصدار 1.0.0</Text>
          <Text style={styles.copyrightText}>© 2025 جميع الحقوق محفوظة</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FF9800',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontFamily: 'Cairo_700Bold',
    color: '#fff',
    textAlign: 'right',
  },

  content: {
    padding: 16,
    paddingBottom: 40,
  },

  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Cairo_700Bold',
    color: '#999',
    textAlign: 'right',
    marginBottom: 12,
    paddingRight: 4,
  },

  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF9800',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 14,
  },
  profileLetter: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontFamily: 'Cairo_700Bold',
    color: '#333',
    textAlign: 'right',
  },
  profileEmail: {
    fontSize: 13,
    fontFamily: 'Cairo_400Regular',
    color: '#666',
    textAlign: 'right',
  },
  profileRole: {
    fontSize: 12,
    fontFamily: 'Cairo_700Bold',
    color: '#FF9800',
    textAlign: 'right',
    marginTop: 4,
  },

  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 8,
  },
  settingInfo: {
    flex: 1,
    marginHorizontal: 14,
  },
  settingLabel: {
    fontSize: 16,
    fontFamily: 'Cairo_700Bold',
    color: '#333',
    textAlign: 'right',
  },
  settingDesc: {
    fontSize: 12,
    fontFamily: 'Cairo_400Regular',
    color: '#999',
    textAlign: 'right',
    marginTop: 2,
  },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFEBEE',
    borderRadius: 14,
    padding: 16,
    marginTop: 8,
    gap: 10,
  },
  logoutBtnText: {
    fontSize: 16,
    fontFamily: 'Cairo_700Bold',
    color: '#F44336',
  },

  versionSection: {
    alignItems: 'center',
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  appName: {
    fontSize: 20,
    fontFamily: 'Cairo_700Bold',
    color: '#FF9800',
  },
  versionText: {
    fontSize: 14,
    fontFamily: 'Cairo_400Regular',
    color: '#999',
    marginTop: 4,
  },
  copyrightText: {
    fontSize: 12,
    fontFamily: 'Cairo_400Regular',
    color: '#bbb',
    marginTop: 4,
  },
});
