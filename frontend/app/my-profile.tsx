import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Alert,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts, Alexandria_400Regular, Alexandria_600SemiBold, Alexandria_700Bold } from '@expo-google-fonts/alexandria';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../src/constants/theme';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';
const { width } = Dimensions.get('window');

interface SavedResult {
  id: string;
  calculator_name: string;
  calculator_type: string;
  pillar: string;
  result_value: any;
  result_text: string;
  saved_at: string;
}

interface ProfileData {
  user_id: string;
  full_name: string;
  email: string;
  saved_results: SavedResult[];
  intake_questionnaire: any;
  habit_tracker: any[];
  bookings: any[];
}

const PILLARS = [
  { id: 'physical', name: 'الجسدي', icon: 'fitness', color: COLORS.physical },
  { id: 'mental', name: 'النفسي', icon: 'happy', color: COLORS.mental },
  { id: 'social', name: 'الاجتماعي', icon: 'people', color: COLORS.social },
  { id: 'spiritual', name: 'الروحي', icon: 'sparkles', color: COLORS.spiritual },
];

export default function MyProfileScreen() {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [organizedResults, setOrganizedResults] = useState<{[key: string]: SavedResult[]}>({});
  const [loading, setLoading] = useState(true);
  const [selectedPillar, setSelectedPillar] = useState<string | null>(null);
  const [hasSubscription, setHasSubscription] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [fontsLoaded] = useFonts({
    Alexandria_400Regular,
    Alexandria_600SemiBold,
    Alexandria_700Bold,
  });

  useEffect(() => {
    loadProfileData();
    checkSubscription();
  }, []);

  const checkSubscription = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/user-profile/check-subscription`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setHasSubscription(data.has_subscription);
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const loadProfileData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userData = await AsyncStorage.getItem('user');
      if (!userData || !token) return;
      
      const user = JSON.parse(userData);
      
      const response = await fetch(`${API_URL}/api/user-profile/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setProfileData(data);
        
        // تنظيم النتائج حسب الركيزة
        const organized: {[key: string]: SavedResult[]} = {
          physical: [],
          mental: [],
          social: [],
          spiritual: []
        };
        
        data.saved_results?.forEach((result: SavedResult) => {
          if (organized[result.pillar]) {
            organized[result.pillar].push(result);
          }
        });
        
        setOrganizedResults(organized);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const renderProgressChart = (results: SavedResult[]) => {
    if (results.length < 2) return null;
    
    // نحصل على آخر 7 نتائج
    const recentResults = results.slice(0, 7).reverse();
    const maxValue = Math.max(...recentResults.map(r => 
      typeof r.result_value === 'number' ? r.result_value : 0
    ));
    
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>تقدم النتائج</Text>
        <View style={styles.chart}>
          {recentResults.map((result, index) => {
            const value = typeof result.result_value === 'number' ? result.result_value : 0;
            const height = maxValue > 0 ? (value / maxValue) * 100 : 0;
            return (
              <View key={index} style={styles.chartBar}>
                <View 
                  style={[
                    styles.bar, 
                    { 
                      height: `${Math.max(height, 10)}%`,
                      backgroundColor: PILLARS.find(p => p.id === result.pillar)?.color || COLORS.teal
                    }
                  ]} 
                />
                <Text style={styles.chartLabel}>{value.toFixed(1)}</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  if (!fontsLoaded || loading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={COLORS.teal} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color={COLORS.teal} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ملفي الشخصي</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* User Info Card */}
        <View style={styles.userCard}>
          <View style={styles.userAvatar}>
            <Ionicons name="person" size={40} color={COLORS.teal} />
          </View>
          <Text style={styles.userName}>{profileData?.full_name}</Text>
          <Text style={styles.userEmail}>{profileData?.email}</Text>
          {hasSubscription ? (
            <View style={styles.subscribedBadge}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.teal} />
              <Text style={styles.subscribedText}>مشترك</Text>
            </View>
          ) : (
            <View style={styles.freeBadge}>
              <Ionicons name="information-circle" size={16} color={COLORS.textMuted} />
              <Text style={styles.freeText}>حساب مجاني</Text>
            </View>
          )}
        </View>

        {/* Stats Summary */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{profileData?.saved_results?.length || 0}</Text>
            <Text style={styles.statLabel}>نتيجة محفوظة</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{profileData?.habit_tracker?.length || 0}</Text>
            <Text style={styles.statLabel}>عادة متتبعة</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{profileData?.bookings?.length || 0}</Text>
            <Text style={styles.statLabel}>حجز</Text>
          </View>
        </View>

        {/* Pillars Filter */}
        <Text style={styles.sectionTitle}>النتائج حسب الركيزة</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillarsScroll}>
          <TouchableOpacity
            style={[styles.pillarBtn, !selectedPillar && styles.pillarBtnActive]}
            onPress={() => setSelectedPillar(null)}
          >
            <Text style={[styles.pillarBtnText, !selectedPillar && styles.pillarBtnTextActive]}>الكل</Text>
          </TouchableOpacity>
          {PILLARS.map(pillar => (
            <TouchableOpacity
              key={pillar.id}
              style={[
                styles.pillarBtn, 
                selectedPillar === pillar.id && { backgroundColor: pillar.color }
              ]}
              onPress={() => setSelectedPillar(pillar.id)}
            >
              <Ionicons 
                name={pillar.icon as any} 
                size={16} 
                color={selectedPillar === pillar.id ? COLORS.white : pillar.color} 
              />
              <Text style={[
                styles.pillarBtnText, 
                selectedPillar === pillar.id && styles.pillarBtnTextActive
              ]}>
                {pillar.name}
              </Text>
              <View style={[styles.countBadge, { backgroundColor: `${pillar.color}20` }]}>
                <Text style={[styles.countText, { color: pillar.color }]}>
                  {organizedResults[pillar.id]?.length || 0}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Results List */}
        {!hasSubscription && !profileData?.saved_results?.length ? (
          <View style={styles.emptyState}>
            <Ionicons name="lock-closed" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>حفظ النتائج للمشتركين فقط</Text>
            <Text style={styles.emptyText}>اشترك في إحدى الباقات لحفظ نتائجك وتتبع تقدمك</Text>
            <TouchableOpacity 
              style={styles.subscribeBtn}
              onPress={() => router.push('/(tabs)/bookings')}
            >
              <Text style={styles.subscribeBtnText}>استعرض الباقات</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Chart for selected pillar */}
            {selectedPillar && organizedResults[selectedPillar]?.length > 1 && 
              renderProgressChart(organizedResults[selectedPillar])
            }
            
            {/* Results Cards */}
            {(selectedPillar ? [selectedPillar] : Object.keys(organizedResults)).map(pillarId => {
              const pillar = PILLARS.find(p => p.id === pillarId);
              const results = organizedResults[pillarId] || [];
              
              if (results.length === 0) return null;
              
              return (
                <View key={pillarId} style={styles.pillarSection}>
                  {!selectedPillar && (
                    <View style={styles.pillarHeader}>
                      <Ionicons name={pillar?.icon as any} size={20} color={pillar?.color} />
                      <Text style={[styles.pillarTitle, { color: pillar?.color }]}>{pillar?.name}</Text>
                    </View>
                  )}
                  
                  {results.map((result) => (
                    <View key={result.id} style={styles.resultCard}>
                      <View style={[styles.resultIcon, { backgroundColor: `${pillar?.color}15` }]}>
                        <Ionicons name="analytics" size={20} color={pillar?.color} />
                      </View>
                      <View style={styles.resultContent}>
                        <Text style={styles.resultName}>{result.calculator_name}</Text>
                        <Text style={styles.resultValue}>{result.result_text}</Text>
                        <Text style={styles.resultDate}>{formatDate(result.saved_at)}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              );
            })}
          </>
        )}

        {/* Intake Questionnaire */}
        {profileData?.intake_questionnaire && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>استبيان القبول</Text>
            <View style={styles.intakeCard}>
              <Ionicons name="clipboard-outline" size={24} color={COLORS.teal} />
              <Text style={styles.intakeText}>تم تعبئة الاستبيان</Text>
              <Text style={styles.intakeDate}>
                {formatDate(profileData.intake_questionnaire.created_at)}
              </Text>
            </View>
          </View>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${COLORS.teal}10`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 100,
  },
  userCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.md,
    ...SHADOWS.md,
  },
  userAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${COLORS.teal}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  userName: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  subscribedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.teal}15`,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADIUS.full,
    gap: 6,
  },
  subscribedText: {
    fontSize: 12,
    fontFamily: FONTS.semiBold,
    color: COLORS.teal,
  },
  freeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.beige,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADIUS.full,
    gap: 6,
  },
  freeText: {
    fontSize: 12,
    fontFamily: FONTS.semiBold,
    color: COLORS.textMuted,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  statNumber: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    color: COLORS.teal,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.md,
    textAlign: 'right',
  },
  pillarsScroll: {
    marginBottom: SPACING.lg,
  },
  pillarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: RADIUS.full,
    marginRight: 8,
    gap: 6,
    ...SHADOWS.sm,
  },
  pillarBtnActive: {
    backgroundColor: COLORS.teal,
  },
  pillarBtnText: {
    fontSize: 13,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
  },
  pillarBtnTextActive: {
    color: COLORS.white,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countText: {
    fontSize: 11,
    fontFamily: FONTS.bold,
  },
  chartContainer: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    ...SHADOWS.sm,
  },
  chartTitle: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
    marginBottom: SPACING.md,
    textAlign: 'right',
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 120,
    justifyContent: 'space-around',
  },
  chartBar: {
    alignItems: 'center',
    width: 40,
  },
  bar: {
    width: 24,
    borderRadius: 4,
    minHeight: 10,
  },
  chartLabel: {
    fontSize: 10,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  pillarSection: {
    marginBottom: SPACING.lg,
  },
  pillarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: SPACING.sm,
  },
  pillarTitle: {
    fontSize: 15,
    fontFamily: FONTS.bold,
  },
  resultCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  resultIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.md,
  },
  resultContent: {
    flex: 1,
  },
  resultName: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
    textAlign: 'right',
  },
  resultValue: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'right',
    marginVertical: 2,
  },
  resultDate: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    textAlign: 'right',
  },
  emptyState: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    ...SHADOWS.md,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  subscribeBtn: {
    backgroundColor: COLORS.teal,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.full,
  },
  subscribeBtnText: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },
  section: {
    marginTop: SPACING.lg,
  },
  intakeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.md,
    ...SHADOWS.sm,
  },
  intakeText: {
    flex: 1,
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
  },
  intakeDate: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
  },
});
