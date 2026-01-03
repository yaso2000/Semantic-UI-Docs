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
import { COLORS, FONTS, SHADOWS, RADIUS, SPACING } from '../src/constants/theme';

export default function SettingsScreen() {
  const [notifications, setNotifications] = useState(true);
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
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <ActivityIndicator size="large" color={COLORS.teal} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>الإعدادات</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Account Section */}
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

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>الإشعارات</Text>
          
          <View style={styles.settingItem}>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: COLORS.border, true: COLORS.tealLight }}
              thumbColor={notifications ? COLORS.teal : COLORS.textMuted}
            />
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>تفعيل الإشعارات</Text>
              <Text style={styles.settingDesc}>استلم إشعارات التذكير والرسائل</Text>
            </View>
            <View style={styles.settingIconContainer}>
              <Ionicons name="notifications" size={24} color={COLORS.teal} />
            </View>
          </View>

          <TouchableOpacity style={styles.settingItem}>
            <Ionicons name="chevron-back" size={20} color={COLORS.textMuted} />
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>وقت التذكير اليومي</Text>
              <Text style={styles.settingDesc}>{reminderTime} صباحاً</Text>
            </View>
            <View style={styles.settingIconContainer}>
              <Ionicons name="time" size={24} color={COLORS.teal} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Data Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>البيانات</Text>
          
          <TouchableOpacity style={styles.settingItem} onPress={clearCache}>
            <Ionicons name="chevron-back" size={20} color={COLORS.textMuted} />
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>مسح الذاكرة المؤقتة</Text>
              <Text style={styles.settingDesc}>حذف البيانات المحفوظة محلياً</Text>
            </View>
            <View style={[styles.settingIconContainer, { backgroundColor: COLORS.errorLight }]}>
              <Ionicons name="trash" size={24} color={COLORS.error} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Support Section */}
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
            <View style={styles.settingIconContainer}>
              <Ionicons name="help-circle" size={24} color={COLORS.teal} />
            </View>
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
            <View style={styles.settingIconContainer}>
              <Ionicons name="document-text" size={24} color={COLORS.teal} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <Ionicons name="chevron-back" size={20} color={COLORS.textMuted} />
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>تواصل معنا</Text>
              <Text style={styles.settingDesc}>support@askyazo.com</Text>
            </View>
            <View style={styles.settingIconContainer}>
              <Ionicons name="mail" size={24} color={COLORS.teal} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutBtnText}>تسجيل الخروج</Text>
          <Ionicons name="log-out" size={22} color={COLORS.error} />
        </TouchableOpacity>

        {/* Version Section */}
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
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background 
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: COLORS.background 
  },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.teal,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.md,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: COLORS.white,
    textAlign: 'right',
  },

  content: {
    padding: SPACING.md,
    paddingBottom: 40,
  },

  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    color: COLORS.textSecondary,
    textAlign: 'right',
    marginBottom: 12,
    paddingRight: 4,
  },

  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    ...SHADOWS.md,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.teal,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 14,
  },
  profileLetter: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.white,
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
    color: COLORS.textSecondary,
    textAlign: 'right',
  },
  profileRole: {
    fontSize: 12,
    fontFamily: FONTS.semiBold,
    color: COLORS.teal,
    textAlign: 'right',
    marginTop: 4,
  },

  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: 8,
    ...SHADOWS.sm,
  },
  settingIconContainer: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.beige,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
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
    color: COLORS.textSecondary,
    textAlign: 'right',
    marginTop: 2,
  },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.errorLight,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
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
    marginTop: SPACING.xl,
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  appName: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: COLORS.teal,
  },
  versionText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  copyrightText: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    marginTop: 4,
  },
});
