import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome, {user?.full_name || 'User'}!</Text>
          <Text style={styles.subtitle}>Your Holistic Wellness Journey</Text>
        </View>

        <View style={styles.pillarsSection}>
          <Text style={styles.sectionTitle}>Four Pillars of Wellness</Text>
          <View style={styles.pillarsGrid}>
            <TouchableOpacity style={[styles.pillarCard, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="barbell" size={40} color="#4CAF50" />
              <Text style={styles.pillarTitle}>Physical</Text>
              <Text style={styles.pillarSubtitle}>Fitness & Health</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.pillarCard, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="nutrition" size={40} color="#FF9800" />
              <Text style={styles.pillarTitle}>Nutritional</Text>
              <Text style={styles.pillarSubtitle}>Diet & Nutrition</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.pillarCard, { backgroundColor: '#F3E5F5' }]}>
              <Ionicons name="happy" size={40} color="#9C27B0" />
              <Text style={styles.pillarTitle}>Mental</Text>
              <Text style={styles.pillarSubtitle}>Mind & Wellness</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.pillarCard, { backgroundColor: '#E0F7FA' }]}>
              <Ionicons name="leaf" size={40} color="#00BCD4" />
              <Text style={styles.pillarTitle}>Spiritual</Text>
              <Text style={styles.pillarSubtitle}>Inner Peace</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/calculators')}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="calculator" size={24} color="#2196F3" />
            </View>
            <View style={styles.actionText}>
              <Text style={styles.actionTitle}>Health Calculators</Text>
              <Text style={styles.actionSubtitle}>BMI, TDEE & Anxiety Assessment</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/bookings')}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="calendar" size={24} color="#4CAF50" />
            </View>
            <View style={styles.actionText}>
              <Text style={styles.actionTitle}>Book a Session</Text>
              <Text style={styles.actionSubtitle}>Schedule coaching hours</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/chat')}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="chatbubbles" size={24} color="#FF9800" />
            </View>
            <View style={styles.actionText}>
              <Text style={styles.actionTitle}>Chat with Coach</Text>
              <Text style={styles.actionSubtitle}>Direct messaging</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#999" />
          </TouchableOpacity>
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
  scrollContent: {
    padding: 20,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  pillarsSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  pillarsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  pillarCard: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  pillarTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
  },
  pillarSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  actionsSection: {
    marginBottom: 32,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionText: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
});