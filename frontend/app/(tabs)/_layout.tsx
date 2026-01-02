import React, { useEffect, useState } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

function TabBarIconWithBadge({ 
  name, 
  color, 
  size, 
  badgeCount 
}: { 
  name: keyof typeof Ionicons.glyphMap; 
  color: string; 
  size: number;
  badgeCount: number;
}) {
  return (
    <View style={styles.iconContainer}>
      <Ionicons name={name} size={size} color={color} />
      {badgeCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {badgeCount > 99 ? '99+' : badgeCount}
          </Text>
        </View>
      )}
    </View>
  );
}

export default function TabsLayout() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadUserRole();
    fetchUnreadCount();
    
    // Poll for unread messages every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadUserRole = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        setUserRole(user.role);
      }
    } catch (error) {
      console.error('Error loading user role:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${API_URL}/api/messages/unread-count`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unread_count);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  // تحديد التبويبات حسب دور المستخدم
  const isClient = userRole === 'client';
  const isCoach = userRole === 'coach';
  const isAdmin = userRole === 'admin';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: isCoach ? '#FF9800' : isAdmin ? '#2196F3' : '#4CAF50',
        tabBarInactiveTintColor: '#999',
        headerShown: false,
        tabBarStyle: {
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      {/* الصفحة الرئيسية - للجميع */}
      <Tabs.Screen
        name="home"
        options={{
          title: isAdmin ? 'لوحة التحكم' : isCoach ? 'لوحتي' : 'الأدوات',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={isAdmin || isCoach ? 'grid' : 'apps'} size={size} color={color} />
          ),
        }}
      />

      {/* الحجوزات - للمتدربين فقط */}
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'الحجوزات',
          href: isClient ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size} color={color} />
          ),
        }}
      />

      {/* قائمة المدربين - للمتدربين فقط */}
      <Tabs.Screen
        name="coaches"
        options={{
          title: 'المدربين',
          href: isClient ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
        }}
      />

      {/* الاشتراك - للمدربين فقط */}
      <Tabs.Screen
        name="subscription"
        options={{
          title: 'اشتراكي',
          href: isCoach ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="card" size={size} color={color} />
          ),
        }}
      />

      {/* متدربيني - للمدربين فقط */}
      <Tabs.Screen
        name="my-trainees"
        options={{
          title: 'متدربيني',
          href: isCoach ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="school" size={size} color={color} />
          ),
        }}
      />

      {/* الشات - للجميع مع شارة الإشعارات */}
      <Tabs.Screen
        name="chat"
        options={{
          title: 'المحادثة',
          tabBarIcon: ({ color, size }) => (
            <TabBarIconWithBadge 
              name="chatbubbles" 
              size={size} 
              color={color} 
              badgeCount={unreadCount}
            />
          ),
        }}
        listeners={{
          focus: () => {
            // Refresh unread count when chat tab is focused
            fetchUnreadCount();
          },
        }}
      />

      {/* البروفايل - للجميع */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'حسابي',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />

      {/* إخفاء الصفحات القديمة */}
      <Tabs.Screen name="calculators" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -10,
    backgroundColor: '#F44336',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
