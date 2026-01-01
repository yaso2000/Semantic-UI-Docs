import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFonts, Cairo_400Regular, Cairo_700Bold } from '@expo-google-fonts/cairo';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

// ألوان مختلفة لكل حرف
const LETTER_COLORS: { [key: string]: string } = {
  'ا': '#E91E63', 'أ': '#E91E63', 'إ': '#E91E63', 'آ': '#E91E63',
  'ب': '#9C27B0', 'ت': '#673AB7', 'ث': '#3F51B5',
  'ج': '#2196F3', 'ح': '#03A9F4', 'خ': '#00BCD4',
  'د': '#009688', 'ذ': '#4CAF50', 'ر': '#8BC34A',
  'ز': '#CDDC39', 'س': '#FFC107', 'ش': '#FF9800',
  'ص': '#FF5722', 'ض': '#795548', 'ط': '#607D8B',
  'ظ': '#9E9E9E', 'ع': '#E91E63', 'غ': '#9C27B0',
  'ف': '#673AB7', 'ق': '#3F51B5', 'ك': '#2196F3',
  'ل': '#03A9F4', 'م': '#00BCD4', 'ن': '#009688',
  'ه': '#4CAF50', 'و': '#8BC34A', 'ي': '#FFC107',
};

const getLetterColor = (name: string): string => {
  const firstLetter = name?.trim().charAt(0) || '?';
  return LETTER_COLORS[firstLetter] || '#FF9800';
};

interface Coach {
  id: string;
  full_name: string;
  email: string;
  bio: string;
  specialties: string[];
  rating: number;
  reviews_count: number;
  hourly_rate: number;
  is_active: boolean;
  profile_image?: string;
}

export default function CoachesScreen() {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const [fontsLoaded] = useFonts({ Cairo_400Regular, Cairo_700Bold });

  useEffect(() => {
    loadCoaches();
  }, []);

  const loadCoaches = async () => {
    try {
      const response = await fetch(`${API_URL}/api/coaches`);
      if (response.ok) {
        const data = await response.json();
        setCoaches(data);
      }
    } catch (error) {
      console.error('Error loading coaches:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadCoaches();
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? 'star' : i - 0.5 <= rating ? 'star-half' : 'star-outline'}
          size={16}
          color="#FFD700"
        />
      );
    }
    return stars;
  };

  const renderCoach = ({ item }: { item: Coach }) => (
    <TouchableOpacity
      style={styles.coachCard}
      onPress={() => router.push(`/coach-profile/${item.id}` as any)}
    >
      <View style={styles.coachHeader}>
        <View style={[styles.avatar, !item.profile_image && { backgroundColor: getLetterColor(item.full_name) }]}>
          {item.profile_image ? (
            <Image source={{ uri: item.profile_image }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarLetter}>
              {item.full_name?.trim().charAt(0).toUpperCase() || '?'}
            </Text>
          )}
        </View>
        <View style={styles.coachInfo}>
          <Text style={styles.coachName}>{item.full_name}</Text>
          <View style={styles.ratingContainer}>
            {renderStars(item.rating)}
            <Text style={styles.ratingText}>({item.reviews_count} تقييم)</Text>
          </View>
        </View>
        <View style={styles.priceContainer}>
          <Text style={styles.priceAmount}>${item.hourly_rate}</Text>
          <Text style={styles.priceLabel}>/ساعة</Text>
        </View>
      </View>

      {item.bio && (
        <Text style={styles.bio} numberOfLines={2}>{item.bio}</Text>
      )}

      {item.specialties && item.specialties.length > 0 && (
        <View style={styles.specialtiesContainer}>
          {item.specialties.slice(0, 3).map((specialty, index) => (
            <View key={index} style={styles.specialtyBadge}>
              <Text style={styles.specialtyText}>{specialty}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.cardFooter}>
        <TouchableOpacity
          style={styles.viewProfileBtn}
          onPress={() => router.push(`/coach-profile/${item.id}` as any)}
        >
          <Text style={styles.viewProfileText}>عرض البروفايل</Text>
          <Ionicons name="arrow-back" size={16} color="#4CAF50" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>المدربين</Text>
        <Text style={styles.headerSubtitle}>اختر مدربك المناسب</Text>
      </View>

      <FlatList
        data={coaches}
        renderItem={renderCoach}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>لا يوجد مدربين متاحين حالياً</Text>
            <Text style={styles.emptySubtext}>تحقق لاحقاً</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    padding: 20,
    backgroundColor: '#4CAF50',
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Cairo_700Bold',
    color: '#fff',
    textAlign: 'right',
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Cairo_400Regular',
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'right',
  },
  listContent: { padding: 16 },
  coachCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  coachHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  coachInfo: { flex: 1 },
  coachName: {
    fontSize: 18,
    fontFamily: 'Cairo_700Bold',
    color: '#333',
    textAlign: 'right',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
    gap: 2,
  },
  ratingText: {
    fontSize: 12,
    fontFamily: 'Cairo_400Regular',
    color: '#666',
    marginRight: 4,
  },
  priceContainer: { alignItems: 'center' },
  priceAmount: {
    fontSize: 20,
    fontFamily: 'Cairo_700Bold',
    color: '#4CAF50',
  },
  priceLabel: {
    fontSize: 10,
    fontFamily: 'Cairo_400Regular',
    color: '#666',
  },
  bio: {
    fontSize: 14,
    fontFamily: 'Cairo_400Regular',
    color: '#666',
    textAlign: 'right',
    lineHeight: 22,
    marginBottom: 12,
  },
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 8,
    marginBottom: 12,
  },
  specialtyBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  specialtyText: {
    fontSize: 12,
    fontFamily: 'Cairo_400Regular',
    color: '#4CAF50',
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  viewProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  viewProfileText: {
    fontSize: 14,
    fontFamily: 'Cairo_700Bold',
    color: '#4CAF50',
  },
  emptyState: { alignItems: 'center', paddingTop: 80 },
  emptyText: {
    fontSize: 18,
    fontFamily: 'Cairo_700Bold',
    color: '#999',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: 'Cairo_400Regular',
    color: '#bbb',
    marginTop: 4,
  },
});
