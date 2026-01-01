import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Image,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFonts, Cairo_400Regular, Cairo_700Bold } from '@expo-google-fonts/cairo';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface Review {
  id: string;
  rating: number;
  comment: string;
  client_name: string;
  created_at: string;
}

interface CoachProfile {
  id: string;
  full_name: string;
  email: string;
  bio: string;
  specialties: string[];
  rating: number;
  reviews_count: number;
  hourly_rate: number;
  reviews: Review[];
}

export default function CoachProfileScreen() {
  const { id } = useLocalSearchParams();
  const [coach, setCoach] = useState<CoachProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const [fontsLoaded] = useFonts({ Cairo_400Regular, Cairo_700Bold });

  useEffect(() => {
    if (id) loadCoach();
  }, [id]);

  const loadCoach = async () => {
    try {
      const response = await fetch(`${API_URL}/api/coaches/${id}`);
      if (response.ok) {
        const data = await response.json();
        setCoach(data);
      }
    } catch (error) {
      console.error('Error loading coach:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number, interactive = false, size = 20) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            disabled={!interactive}
            onPress={() => interactive && setNewRating(star)}
          >
            <Ionicons
              name={star <= rating ? 'star' : 'star-outline'}
              size={size}
              color="#FFD700"
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const submitReview = async () => {
    if (!newComment.trim()) {
      Alert.alert('خطأ', 'يرجى كتابة تعليق');
      return;
    }

    setSubmitting(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/coaches/${id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ rating: newRating, comment: newComment })
      });

      if (response.ok) {
        Alert.alert('نجاح', 'تم إضافة تقييمك بنجاح');
        setShowReviewForm(false);
        setNewComment('');
        setNewRating(5);
        loadCoach();
      } else {
        Alert.alert('خطأ', 'فشل في إضافة التقييم');
      }
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ في الاتصال');
    } finally {
      setSubmitting(false);
    }
  };

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  if (!coach) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorState}>
          <Ionicons name="alert-circle" size={64} color="#ccc" />
          <Text style={styles.errorText}>لم يتم العثور على المدرب</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-forward" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={48} color="#fff" />
          </View>
          <Text style={styles.name}>{coach.full_name}</Text>
          
          <View style={styles.ratingRow}>
            {renderStars(coach.rating)}
            <Text style={styles.ratingText}>{coach.rating.toFixed(1)} ({coach.reviews_count} تقييم)</Text>
          </View>

          <View style={styles.priceTag}>
            <Text style={styles.priceAmount}>${coach.hourly_rate}</Text>
            <Text style={styles.priceLabel}>/ساعة</Text>
          </View>
        </View>

        {coach.bio && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>نبذة عني</Text>
            <Text style={styles.bioText}>{coach.bio}</Text>
          </View>
        )}

        {coach.specialties && coach.specialties.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>التخصصات</Text>
            <View style={styles.specialtiesContainer}>
              {coach.specialties.map((spec, index) => (
                <View key={index} style={styles.specialtyBadge}>
                  <Text style={styles.specialtyText}>{spec}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>التقييمات ({coach.reviews_count})</Text>
            <TouchableOpacity
              style={styles.addReviewBtn}
              onPress={() => setShowReviewForm(!showReviewForm)}
            >
              <Ionicons name="add" size={20} color="#4CAF50" />
              <Text style={styles.addReviewText}>أضف تقييم</Text>
            </TouchableOpacity>
          </View>

          {showReviewForm && (
            <View style={styles.reviewForm}>
              <Text style={styles.formLabel}>تقييمك</Text>
              {renderStars(newRating, true, 32)}
              
              <Text style={[styles.formLabel, { marginTop: 16 }]}>تعليقك</Text>
              <TextInput
                style={styles.commentInput}
                placeholder="اكتب تعليقك هنا..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                value={newComment}
                onChangeText={setNewComment}
              />
              
              <TouchableOpacity
                style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
                onPress={submitReview}
                disabled={submitting}
              >
                <Text style={styles.submitBtnText}>
                  {submitting ? 'جاري الإرسال...' : 'إرسال التقييم'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {coach.reviews && coach.reviews.length > 0 ? (
            coach.reviews.map((review) => (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewerAvatar}>
                    <Ionicons name="person" size={16} color="#fff" />
                  </View>
                  <View style={styles.reviewerInfo}>
                    <Text style={styles.reviewerName}>{review.client_name}</Text>
                    <Text style={styles.reviewDate}>
                      {new Date(review.created_at).toLocaleDateString('ar-SA')}
                    </Text>
                  </View>
                  {renderStars(review.rating, false, 14)}
                </View>
                {review.comment && (
                  <Text style={styles.reviewComment}>{review.comment}</Text>
                )}
              </View>
            ))
          ) : (
            <Text style={styles.noReviews}>لا توجد تقييمات بعد</Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.contactBtn}
          onPress={() => router.push(`/(tabs)/chat?coachId=${coach.id}` as any)}
        >
          <Ionicons name="chatbubble" size={24} color="#fff" />
          <Text style={styles.contactBtnText}>تواصل مع المدرب</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16, fontFamily: 'Cairo_400Regular', color: '#999', marginTop: 16 },
  
  header: {
    backgroundColor: '#4CAF50',
    height: 120,
    justifyContent: 'flex-end',
    padding: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  profileSection: {
    alignItems: 'center',
    marginTop: -50,
    paddingBottom: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  name: {
    fontSize: 24,
    fontFamily: 'Cairo_700Bold',
    color: '#333',
    marginTop: 12,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingText: {
    fontSize: 14,
    fontFamily: 'Cairo_400Regular',
    color: '#666',
  },
  priceTag: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 12,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  priceAmount: {
    fontSize: 24,
    fontFamily: 'Cairo_700Bold',
    color: '#4CAF50',
  },
  priceLabel: {
    fontSize: 14,
    fontFamily: 'Cairo_400Regular',
    color: '#4CAF50',
  },
  
  section: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Cairo_700Bold',
    color: '#333',
    textAlign: 'right',
  },
  bioText: {
    fontSize: 14,
    fontFamily: 'Cairo_400Regular',
    color: '#666',
    lineHeight: 24,
    textAlign: 'right',
  },
  
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-end',
  },
  specialtyBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  specialtyText: {
    fontSize: 13,
    fontFamily: 'Cairo_400Regular',
    color: '#4CAF50',
  },
  
  addReviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addReviewText: {
    fontSize: 14,
    fontFamily: 'Cairo_700Bold',
    color: '#4CAF50',
  },
  
  reviewForm: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontFamily: 'Cairo_700Bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'right',
  },
  commentInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    fontFamily: 'Cairo_400Regular',
    color: '#333',
    textAlign: 'right',
    minHeight: 100,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  submitBtn: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  submitBtnDisabled: {
    backgroundColor: '#ccc',
  },
  submitBtnText: {
    fontSize: 16,
    fontFamily: 'Cairo_700Bold',
    color: '#fff',
  },
  
  reviewCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  reviewerInfo: {
    flex: 1,
  },
  reviewerName: {
    fontSize: 14,
    fontFamily: 'Cairo_700Bold',
    color: '#333',
    textAlign: 'right',
  },
  reviewDate: {
    fontSize: 11,
    fontFamily: 'Cairo_400Regular',
    color: '#999',
    textAlign: 'right',
  },
  reviewComment: {
    fontSize: 14,
    fontFamily: 'Cairo_400Regular',
    color: '#666',
    marginTop: 10,
    textAlign: 'right',
    lineHeight: 22,
  },
  noReviews: {
    fontSize: 14,
    fontFamily: 'Cairo_400Regular',
    color: '#999',
    textAlign: 'center',
    paddingVertical: 20,
  },
  
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    gap: 10,
  },
  contactBtnText: {
    fontSize: 18,
    fontFamily: 'Cairo_700Bold',
    color: '#fff',
  },
});
