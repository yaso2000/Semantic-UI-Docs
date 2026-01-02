import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  Platform,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Alexandria_400Regular, Alexandria_600SemiBold, Alexandria_700Bold } from '@expo-google-fonts/alexandria';
import { COLORS, FONTS } from '../../src/constants/theme';

export default function ProfileScreen() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  
  const [fontsLoaded] = useFonts({
    Alexandria_400Regular,
    Alexandria_600SemiBold,
    Alexandria_700Bold,
  });

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const performLogout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      router.replace('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      performLogout();
    } else {
      Alert.alert(
        'تسجيل الخروج',
        'هل أنت متأكد من تسجيل الخروج؟',
        [
          { text: 'إلغاء', style: 'cancel' },
          { text: 'خروج', onPress: performLogout, style: 'destructive' },
        ]
      );
    }
  };

  if (!fontsLoaded) return null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={50} color={COLORS.gold} />
          </View>
          <Text style={styles.userName}>{user?.full_name || 'المستخدم'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <View style={styles.badge}>
            <Ionicons name={user?.role === 'admin' ? 'star' : 'person'} size={14} color={COLORS.primary} />
            <Text style={styles.badgeText}>
              {user?.role === 'admin' ? 'يازو - المدرب' : 'متدرب'}
            </Text>
          </View>
        </View>

        {/* Menu */}
        <View style={styles.menuSection}>
          {/* قوائم يازو */}
          {user?.role === 'admin' && (
            <>
              <MenuItem 
                icon="people" 
                title="المتدربين" 
                onPress={() => router.push('/(tabs)/my-trainees' as any)} 
              />
              <MenuItem 
                icon="time" 
                title="سجل الجلسات" 
                onPress={() => router.push('/coach/sessions' as any)} 
              />
              <MenuItem 
                icon="pricetags" 
                title="باقات التدريب" 
                onPress={() => router.push('/admin/packages' as any)} 
              />
              <MenuItem 
                icon="wallet" 
                title="المدفوعات" 
                onPress={() => router.push('/admin/payments' as any)} 
              />
              <MenuItem 
                icon="person-add" 
                title="إدارة المستخدمين" 
                onPress={() => router.push('/admin/users' as any)} 
              />
            </>
          )}

          {/* قوائم المتدرب */}
          {user?.role === 'client' && (
            <>
              <MenuItem 
                icon="clipboard" 
                title="استبيان القبول" 
                onPress={() => router.push('/intake-questionnaire' as any)} 
              />
              <MenuItem 
                icon="folder" 
                title="مكتبة الموارد" 
                onPress={() => router.push('/resources' as any)} 
              />
              <MenuItem 
                icon="checkmark-done" 
                title="متتبع العادات" 
                onPress={() => router.push('/habit-tracker' as any)} 
              />
            </>
          )}

          {/* قوائم مشتركة */}
          <MenuItem 
            icon="settings" 
            title="الإعدادات" 
            onPress={() => router.push('/settings' as any)} 
          />
          <MenuItem 
            icon="help-circle" 
            title="المساعدة والدعم" 
            onPress={() => router.push('/help' as any)} 
          />
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out" size={24} color={COLORS.error} />
          <Text style={styles.logoutText}>تسجيل الخروج</Text>
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>اسأل يازو - Ask Yazo</Text>
          <Text style={styles.versionText}>الإصدار 1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Menu Item Component
function MenuItem({ icon, title, onPress }: { icon: string; title: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuIconContainer}>
        <Ionicons name={icon as any} size={22} color={COLORS.gold} />
      </View>
      <Text style={styles.menuText}>{title}</Text>
      <Ionicons name="chevron-back" size={20} color={COLORS.gold} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  
  // Header
  header: {
    alignItems: 'center',
    marginBottom: 30,
    paddingVertical: 30,
    backgroundColor: COLORS.secondary,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: COLORS.gold,
  },
  userName: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    color: COLORS.white,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    marginBottom: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gold,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  badgeText: {
    fontSize: 12,
    fontFamily: FONTS.semiBold,
    color: COLORS.primary,
  },

  // Menu
  menuSection: {
    gap: 12,
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondary,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  menuIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    color: COLORS.white,
    textAlign: 'right',
  },

  // Logout
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.secondary,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.error,
    gap: 8,
    marginBottom: 24,
  },
  logoutText: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    color: COLORS.error,
  },

  // Footer
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    color: COLORS.gold,
  },
  versionText: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    marginTop: 4,
  },
});
