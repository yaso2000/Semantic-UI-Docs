import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Cairo_400Regular, Cairo_700Bold } from '@expo-google-fonts/cairo';

export default function ProfileScreen() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  
  const [fontsLoaded] = useFonts({
    Cairo_400Regular,
    Cairo_700Bold,
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

  const handleLogout = async () => {
    Alert.alert(
      'تسجيل الخروج',
      'هل أنت متأكد من تسجيل الخروج؟',
      [
        {
          text: 'إلغاء',
          style: 'cancel',
        },
        {
          text: 'خروج',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('token');
              await AsyncStorage.removeItem('user');
              router.replace('/');
            } catch (error) {
              console.error('Error logging out:', error);
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={48} color="#2196F3" />
          </View>
          <Text style={styles.name}>{user?.full_name || 'المستخدم'}</Text>
          <Text style={styles.email}>{user?.email || 'email@example.com'}</Text>
          {user?.role === 'admin' && (
            <View style={styles.adminBadge}>
              <Ionicons name="shield-checkmark" size={14} color="#fff" />
              <Text style={styles.adminBadgeText}>مدير</Text>
            </View>
          )}
        </View>

        <View style={styles.menuSection}>
          {/* ======= قوائم الأدمن ======= */}
          {user?.role === 'admin' && (
            <>
              <TouchableOpacity 
                style={[styles.menuItem, styles.adminMenuItem]}
                onPress={() => router.push('/admin' as any)}
              >
                <View style={[styles.menuIconContainer, { backgroundColor: '#E3F2FD' }]}>
                  <Ionicons name="shield-checkmark" size={24} color="#2196F3" />
                </View>
                <Text style={styles.menuText}>لوحة التحكم</Text>
                <Ionicons name="chevron-back" size={24} color="#2196F3" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/admin/users' as any)}>
                <View style={[styles.menuIconContainer, { backgroundColor: '#E8F5E9' }]}>
                  <Ionicons name="people" size={24} color="#4CAF50" />
                </View>
                <Text style={styles.menuText}>إدارة المستخدمين</Text>
                <Ionicons name="chevron-back" size={24} color="#999" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/admin/payments' as any)}>
                <View style={[styles.menuIconContainer, { backgroundColor: '#FFF3E0' }]}>
                  <Ionicons name="wallet" size={24} color="#FF9800" />
                </View>
                <Text style={styles.menuText}>إدارة المدفوعات</Text>
                <Ionicons name="chevron-back" size={24} color="#999" />
              </TouchableOpacity>
            </>
          )}

          {/* ======= قوائم المدرب ======= */}
          {user?.role === 'coach' && (
            <>
              <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/coach/profile' as any)}>
                <View style={[styles.menuIconContainer, { backgroundColor: '#FFF3E0' }]}>
                  <Ionicons name="person-circle" size={24} color="#FF9800" />
                </View>
                <Text style={styles.menuText}>بروفايلي</Text>
                <Ionicons name="chevron-back" size={24} color="#999" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/coach/packages' as any)}>
                <View style={[styles.menuIconContainer, { backgroundColor: '#E8F5E9' }]}>
                  <Ionicons name="pricetags" size={24} color="#4CAF50" />
                </View>
                <Text style={styles.menuText}>باقاتي</Text>
                <Ionicons name="chevron-back" size={24} color="#999" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/coach/sessions' as any)}>
                <View style={[styles.menuIconContainer, { backgroundColor: '#E3F2FD' }]}>
                  <Ionicons name="time" size={24} color="#2196F3" />
                </View>
                <Text style={styles.menuText}>سجل الجلسات</Text>
                <Ionicons name="chevron-back" size={24} color="#999" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(tabs)/subscription' as any)}>
                <View style={[styles.menuIconContainer, { backgroundColor: '#F3E5F5' }]}>
                  <Ionicons name="card" size={24} color="#9C27B0" />
                </View>
                <Text style={styles.menuText}>اشتراكي</Text>
                <Ionicons name="chevron-back" size={24} color="#999" />
              </TouchableOpacity>
            </>
          )}

          {/* ======= قوائم المتدرب ======= */}
          {user?.role === 'client' && (
            <>
              <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/intake-questionnaire' as any)}>
                <View style={[styles.menuIconContainer, { backgroundColor: '#E3F2FD' }]}>
                  <Ionicons name="clipboard" size={24} color="#2196F3" />
                </View>
                <Text style={styles.menuText}>استبيان القبول</Text>
                <Ionicons name="chevron-back" size={24} color="#999" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/resources' as any)}>
                <View style={[styles.menuIconContainer, { backgroundColor: '#E8F5E9' }]}>
                  <Ionicons name="folder" size={24} color="#4CAF50" />
                </View>
                <Text style={styles.menuText}>مكتبة الموارد</Text>
                <Ionicons name="chevron-back" size={24} color="#999" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/habit-tracker' as any)}>
                <View style={[styles.menuIconContainer, { backgroundColor: '#FFF3E0' }]}>
                  <Ionicons name="checkmark-done" size={24} color="#FF9800" />
                </View>
                <Text style={styles.menuText}>متتبع العادات</Text>
                <Ionicons name="chevron-back" size={24} color="#999" />
              </TouchableOpacity>
            </>
          )}

          {/* ======= قوائم مشتركة للجميع ======= */}
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/settings' as any)}>
            <View style={[styles.menuIconContainer, { backgroundColor: '#F3E5F5' }]}>
              <Ionicons name="settings" size={24} color="#9C27B0" />
            </View>
            <Text style={styles.menuText}>الإعدادات</Text>
            <Ionicons name="chevron-back" size={24} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/help' as any)}>
            <View style={[styles.menuIconContainer, { backgroundColor: '#E0F7FA' }]}>
              <Ionicons name="help-circle" size={24} color="#00BCD4" />
            </View>
            <Text style={styles.menuText}>المساعدة والدعم</Text>
            <Ionicons name="chevron-back" size={24} color="#999" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out" size={24} color="#F44336" />
          <Text style={styles.logoutText}>تسجيل الخروج</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>اسأل يازو - Ask Yazo</Text>
          <Text style={styles.versionText}>الإصدار 1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontFamily: 'Cairo_700Bold',
    color: '#333',
  },
  email: {
    fontSize: 14,
    fontFamily: 'Cairo_400Regular',
    color: '#666',
    marginTop: 4,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 12,
    gap: 4,
  },
  adminBadgeText: {
    fontSize: 12,
    fontFamily: 'Cairo_700Bold',
    color: '#fff',
  },
  menuSection: {
    backgroundColor: '#fff',
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  adminMenuItem: {
    backgroundColor: '#E3F2FD',
    borderBottomWidth: 2,
    borderBottomColor: '#2196F3',
  },
  menuIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Cairo_400Regular',
    color: '#333',
    textAlign: 'right',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginTop: 16,
    marginHorizontal: 16,
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontFamily: 'Cairo_700Bold',
    color: '#F44336',
  },
  footer: {
    alignItems: 'center',
    padding: 24,
  },
  footerText: {
    fontSize: 14,
    fontFamily: 'Cairo_700Bold',
    color: '#999',
  },
  versionText: {
    fontSize: 12,
    fontFamily: 'Cairo_400Regular',
    color: '#ccc',
    marginTop: 4,
  },
});
