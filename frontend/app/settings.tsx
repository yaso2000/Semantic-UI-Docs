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
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFonts, Alexandria_400Regular, Alexandria_600SemiBold, Alexandria_700Bold } from '@expo-google-fonts/alexandria';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, FONTS } from '../src/constants/theme';

export default function SettingsScreen() {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [reminderTime, setReminderTime] = useState('08:00');
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  const [fontsLoaded] = useFonts({ Alexandria_400Regular, Alexandria_600SemiBold, Alexandria_700Bold });

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        setUser(JSON.parse(userStr));
      }
    } catch (e) {
      console.log('Error loading user');
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.multiRemove(['token', 'user']);
    router.replace('/(auth)/login' as any);
  };

  const clearCache = async () => {
    await AsyncStorage.multiRemove(['habits', 'wheel_data', 'intake_completed']);
    Alert.alert('تم', 'تم مسح الذاكرة المؤقتة');
  };

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        <ActivityIndicator size="large" color={COLORS.gold} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color={COLORS.gold} />
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
                {user?.role === 'admin' ? 'مدرب - يازو' : 'متدرب'}
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
              trackColor={{ false: COLORS.border, true: 'rgba(212, 175, 55, 0.4)' }}
              thumbColor={notifications ? COLORS.gold : COLORS.textMuted}
            />
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>تفعيل الإشعارات</Text>
              <Text style={styles.settingDesc}>استلم إشعارات التذكير والرسائل</Text>
            </View>
            <Ionicons name="notifications" size={24} color={COLORS.gold} />
          </View>

          <TouchableOpacity style={styles.settingItem}>
            <Ionicons name="chevron-back" size={20} color={COLORS.textMuted} />
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>وقت التذكير اليومي</Text>
              <Text style={styles.settingDesc}>{reminderTime} صباحاً</Text>
            </View>
            <Ionicons name="time" size={24} color={COLORS.gold} />
          </TouchableOpacity>
        </View>

        {/* المظهر */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>المظهر</Text>
          
          <View style={styles.settingItem}>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: COLORS.border, true: 'rgba(212, 175, 55, 0.4)' }}
              thumbColor={darkMode ? COLORS.gold : COLORS.textMuted}
            />
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>الوضع الليلي</Text>
              <Text style={styles.settingDesc}>التصميم الفاخر الحالي</Text>
            </View>
            <Ionicons name="moon" size={24} color={COLORS.gold} />
          </View>
        </View>

        {/* البيانات */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>البيانات</Text>
          
          <TouchableOpacity style={styles.settingItem} onPress={clearCache}>
            <Ionicons name="chevron-back" size={20} color={COLORS.textMuted} />
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>مسح الذاكرة المؤقتة</Text>
              <Text style={styles.settingDesc}>حذف البيانات المحفوظة محلياً</Text>
            </View>
            <Ionicons name="trash" size={24} color={COLORS.error} />
          </TouchableOpacity>
        </View>

        {/* الدعم */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>الدعم والمساعدة</Text>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => router.push('/help' as any)}
          >
            <Ionicons name="chevron-back" size={20} color={COLORS.textMuted} />
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>الأسئلة الشائعة</Text>
              <Text style={styles.settingDesc}>إجابات على أكثر الأسئلة شيوعاً</Text>
            </View>
            <Ionicons name="help-circle" size={24} color={COLORS.gold} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => router.push('/help' as any)}
          >
            <Ionicons name="chevron-back" size={20} color={COLORS.textMuted} />
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>شروط الاستخدام</Text>
              <Text style={styles.settingDesc}>الشروط والأحكام</Text>
            </View>
            <Ionicons name="document-text" size={24} color={COLORS.gold} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <Ionicons name="chevron-back" size={20} color={COLORS.textMuted} />
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>تواصل معنا</Text>
              <Text style={styles.settingDesc}>support@askyazo.com</Text>
            </View>
            <Ionicons name="mail" size={24} color={COLORS.gold} />
          </TouchableOpacity>
        </View>

        {/* زر تسجيل الخروج */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutBtnText}>تسجيل الخروج</Text>
          <Ionicons name="log-out" size={22} color={COLORS.error} />
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
  container: { flex: 1, backgroundColor: COLORS.primary },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.primary },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.secondary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: COLORS.gold,
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
    fontFamily: FONTS.semiBold,
    color: COLORS.textMuted,
    textAlign: 'right',
    marginBottom: 12,
    paddingRight: 4,
  },

  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondary,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.gold,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 14,
  },
  profileLetter: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    textAlign: 'right',
  },
  profileEmail: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    textAlign: 'right',
  },
  profileRole: {
    fontSize: 12,
    fontFamily: FONTS.semiBold,
    color: COLORS.gold,
    textAlign: 'right',
    marginTop: 4,
  },

  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondary,
    borderRadius: 14,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  settingInfo: {
    flex: 1,
    marginHorizontal: 14,
  },
  settingLabel: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
    textAlign: 'right',
  },
  settingDesc: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    textAlign: 'right',
    marginTop: 2,
  },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderRadius: 14,
    padding: 16,
    marginTop: 8,
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  logoutBtnText: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.error,
  },

  versionSection: {
    alignItems: 'center',
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  appName: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: COLORS.gold,
  },
  versionText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  copyrightText: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    marginTop: 4,
  },
});
