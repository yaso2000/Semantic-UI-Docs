import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  StatusBar,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Alexandria_400Regular, Alexandria_600SemiBold, Alexandria_700Bold } from '@expo-google-fonts/alexandria';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../src/constants/theme';

export default function ProfileScreen() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
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
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            {user?.role === 'admin' ? (
              <Image 
                source={require('../../assets/images/logo.png')} 
                style={styles.avatarImage}
                resizeMode="contain"
              />
            ) : (
              <Ionicons name="person" size={48} color={COLORS.teal} />
            )}
          </View>
          <Text style={styles.userName}>{user?.full_name || 'المستخدم'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <View style={[
            styles.badge,
            { backgroundColor: user?.role === 'admin' ? `${COLORS.teal}15` : `${COLORS.sage}20` }
          ]}>
            <Ionicons 
              name={user?.role === 'admin' ? 'star' : 'person'} 
              size={14} 
              color={user?.role === 'admin' ? COLORS.teal : COLORS.sageDark} 
            />
            <Text style={[
              styles.badgeText,
              { color: user?.role === 'admin' ? COLORS.teal : COLORS.sageDark }
            ]}>
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
                color={COLORS.teal}
                onPress={() => router.push('/(tabs)/my-trainees' as any)} 
              />
              <MenuItem 
                icon="time" 
                title="سجل الجلسات" 
                color={COLORS.sageDark}
                onPress={() => router.push('/coach/sessions' as any)} 
              />
              <MenuItem 
                icon="pricetags" 
                title="باقات التدريب" 
                color={COLORS.goldDark}
                onPress={() => router.push('/admin/packages' as any)} 
              />
              <MenuItem 
                icon="wallet" 
                title="المدفوعات" 
                color={COLORS.spiritual}
                onPress={() => router.push('/admin/payments' as any)} 
              />
              <MenuItem 
                icon="person-add" 
                title="إدارة المستخدمين" 
                color={COLORS.info}
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
                color={COLORS.teal}
                onPress={() => router.push('/intake-questionnaire' as any)} 
              />
              <MenuItem 
                icon="folder" 
                title="مكتبة الموارد" 
                color={COLORS.sageDark}
                onPress={() => router.push('/resources' as any)} 
              />
              <MenuItem 
                icon="checkmark-done" 
                title="متتبع العادات" 
                color={COLORS.goldDark}
                onPress={() => router.push('/habit-tracker' as any)} 
              />
            </>
          )}

          {/* قوائم مشتركة */}
          <MenuItem 
            icon="settings" 
            title="الإعدادات" 
            color={COLORS.textSecondary}
            onPress={() => router.push('/settings' as any)} 
          />
          <MenuItem 
            icon="help-circle" 
            title="المساعدة والدعم" 
            color={COLORS.info}
            onPress={() => router.push('/help' as any)} 
          />
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out" size={22} color={COLORS.error} />
          <Text style={styles.logoutText}>تسجيل الخروج</Text>
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>اسأل يازو - Ask Yazo</Text>
          <Text style={styles.versionText}>الإصدار 1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}

// Menu Item Component
function MenuItem({ icon, title, color, onPress }: { icon: string; title: string; color: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.menuIconContainer, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon as any} size={22} color={color} />
      </View>
      <Text style={styles.menuText}>{title}</Text>
      <Ionicons name="chevron-back" size={18} color={COLORS.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING['2xl'],
  },
  
  // Header
  header: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
    paddingVertical: SPACING.xl,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    ...SHADOWS.md,
  },
  avatarContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: `${COLORS.teal}10`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    borderWidth: 2,
    borderColor: `${COLORS.teal}30`,
  },
  userName: {
    fontSize: 22,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    gap: 6,
  },
  badgeText: {
    fontSize: 12,
    fontFamily: FONTS.semiBold,
  },

  // Menu
  menuSection: {
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    ...SHADOWS.sm,
  },
  menuIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.md,
  },
  menuText: {
    flex: 1,
    fontSize: 15,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
    textAlign: 'right',
  },

  // Logout
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.errorLight,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  logoutText: {
    fontSize: 15,
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
    color: COLORS.teal,
  },
  versionText: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    marginTop: 4,
  },
});
