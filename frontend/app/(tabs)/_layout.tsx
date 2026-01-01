import React, { useEffect, useState } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator } from 'react-native';

export default function TabsLayout() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserRole();
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

      {/* الشات - للجميع */}
      <Tabs.Screen
        name="chat"
        options={{
          title: 'المحادثة',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles" size={size} color={color} />
          ),
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
