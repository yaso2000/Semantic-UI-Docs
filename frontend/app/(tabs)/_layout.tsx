import React, { useEffect, useState, useRef } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useNotificationSound } from '../../src/hooks/useNotificationSound';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

// ألوان التصميم الهادئ
const COLORS = {
  background: '#FAF8F5',
  white: '#FFFFFF',
  teal: '#2A7B7B',
  tealDark: '#1E5F5F',
  text: '#3D4852',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  border: '#E5E7EB',
  error: '#E57373',
};

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
  const { checkAndPlaySound } = useNotificationSound();
  const isFirstLoad = useRef(true);

  useEffect(() => {
    loadUserRole();
    fetchUnreadCount();
    
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
        const newCount = data.unread_count;
        
        if (!isFirstLoad.current) {
          checkAndPlaySound(newCount);
        } else {
          isFirstLoad.current = false;
        }
        
        setUnreadCount(newCount);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.teal} />
      </View>
    );
  }

  const isClient = userRole === 'client';
  const isYazo = userRole === 'admin';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.teal,
        tabBarInactiveTintColor: COLORS.textMuted,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 65,
          shadowColor: '#3D4852',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: isYazo ? 'لوحة التحكم' : 'الرئيسية',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={isYazo ? 'grid' : 'home'} size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="bookings"
        options={{
          title: isClient ? 'حجوزاتي' : 'الحجوزات',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="my-trainees"
        options={{
          title: 'المتدربين',
          href: isYazo ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
        }}
      />

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
            fetchUnreadCount();
          },
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'حسابي',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen name="calculators" options={{ href: null }} />
      <Tabs.Screen name="coaches" options={{ href: null }} />
      <Tabs.Screen name="subscription" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  iconContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -10,
    backgroundColor: COLORS.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
