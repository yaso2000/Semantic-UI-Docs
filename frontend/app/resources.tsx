import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFonts, Alexandria_400Regular, Alexandria_600SemiBold, Alexandria_700Bold } from '@expo-google-fonts/alexandria';
import { COLORS, FONTS, SHADOWS, RADIUS, SPACING } from '../src/constants/theme';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface Resource {
  id: string;
  title: string;
  description: string;
  category: string;
  content_type: string;
  content?: string;
  external_url?: string;
  duration?: string;
  icon: string;
  is_active: boolean;
}

const CATEGORIES = [
  { id: 'all', name: 'الكل', icon: 'apps' },
  { id: 'wellness', name: 'الصحة', icon: 'heart' },
  { id: 'mindset', name: 'العقلية', icon: 'bulb' },
  { id: 'productivity', name: 'الإنتاجية', icon: 'trending-up' },
  { id: 'relationships', name: 'العلاقات', icon: 'people' },
];

// الموارد الافتراضية - مقالات وفيديوهات فقط (بدون روابط للحاسبات)
const DEFAULT_RESOURCES: Resource[] = [
  { 
    id: '1', 
    title: '10 عادات صباحية للنجاح', 
    description: 'اكتشف العادات الصباحية التي يمارسها الناجحون يومياً لتحقيق أهدافهم', 
    category: 'productivity', 
    content_type: 'article', 
    icon: 'document-text', 
    duration: '5 دقائق',
    content: 'هذا مقال تجريبي عن العادات الصباحية...',
    is_active: true 
  },
  { 
    id: '2', 
    title: 'تقنيات التأمل للمبتدئين', 
    description: 'دليل شامل لتعلم التأمل في 10 دقائق يومياً وتحسين صحتك النفسية', 
    category: 'mindset', 
    content_type: 'video', 
    icon: 'play-circle', 
    duration: '15 دقيقة', 
    external_url: 'https://www.youtube.com/watch?v=inpok4MKVLM',
    is_active: true 
  },
  { 
    id: '3', 
    title: 'أهمية النوم الصحي', 
    description: 'كيف يؤثر النوم على صحتك الجسدية والنفسية وطرق تحسينه', 
    category: 'wellness', 
    content_type: 'article', 
    icon: 'document-text', 
    duration: '7 دقائق',
    content: 'النوم هو أحد أهم العوامل للصحة...',
    is_active: true 
  },
  { 
    id: '4', 
    title: 'بناء علاقات إيجابية', 
    description: 'نصائح عملية لتحسين علاقاتك الاجتماعية والأسرية', 
    category: 'relationships', 
    content_type: 'video', 
    icon: 'play-circle', 
    duration: '12 دقيقة', 
    external_url: 'https://www.youtube.com/watch?v=k9WqpQp8VSU',
    is_active: true 
  },
  { 
    id: '5', 
    title: 'إدارة الوقت بفعالية', 
    description: 'تعلم كيف تنظم وقتك وتزيد إنتاجيتك اليومية', 
    category: 'productivity', 
    content_type: 'article', 
    icon: 'document-text', 
    duration: '6 دقائق',
    content: 'إدارة الوقت هي مهارة أساسية...',
    is_active: true 
  },
];

export default function ResourcesScreen() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [resources, setResources] = useState<Resource[]>(DEFAULT_RESOURCES);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [fontsLoaded] = useFonts({ Alexandria_400Regular, Alexandria_600SemiBold, Alexandria_700Bold });

  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    try {
      const response = await fetch(`${API_URL}/api/resources`);
      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          setResources(data);
        }
      }
    } catch (error) {
      console.error('Error loading resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredResources = selectedCategory === 'all' 
    ? resources 
    : resources.filter(r => r.category === selectedCategory);
  
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return 'videocam';
      case 'audio': return 'headset';
      case 'pdf': return 'document-attach';
      default: return 'document-text';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'video': return COLORS.teal;
      case 'audio': return COLORS.gold;
      case 'pdf': return COLORS.sage;
      default: return COLORS.sageDark;
    }
  };

  // التحقق من أن الرابط هو YouTube
  const isYouTubeUrl = (url: string) => {
    if (!url) return false;
    return url.includes('youtube.com') || url.includes('youtu.be');
  };

  const handleResourcePress = async (resource: Resource) => {
    // إذا كان فيديو YouTube - افتحه في المشغل الداخلي
    if (resource.external_url && isYouTubeUrl(resource.external_url)) {
      router.push({
        pathname: '/video-player/[id]',
        params: { 
          id: resource.id,
          url: resource.external_url,
          title: resource.title
        }
      } as any);
      return;
    }
    
    // إذا كان هناك رابط خارجي آخر (ليس يوتيوب)
    if (resource.external_url) {
      try {
        await Linking.openURL(resource.external_url);
      } catch (error) {
        console.error('Could not open URL:', error);
      }
      return;
    }
    
    // إذا كان هناك محتوى نصي، انتقل لصفحة العرض
    if (resource.content) {
      router.push(`/resource-content/${resource.id}` as any);
    }
  };

  const hasLink = (resource: Resource) => {
    return resource.external_url || resource.content;
  };

  if (!fontsLoaded) return null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>مكتبة الموارد</Text>
      </View>

      {/* Intro Section */}
      <View style={styles.intro}>
        <View style={styles.introIcon}>
          <Ionicons name="library" size={32} color={COLORS.teal} />
        </View>
        <Text style={styles.introText}>
          مجموعة من المقالات والفيديوهات المفيدة لرحلتك
        </Text>
      </View>

      {/* Categories */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.categoriesScroll} 
        contentContainerStyle={styles.categoriesContent}
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.categoryBtn, selectedCategory === cat.id && styles.categoryBtnActive]}
            onPress={() => setSelectedCategory(cat.id)}
          >
            <Ionicons 
              name={cat.icon as any} 
              size={16} 
              color={selectedCategory === cat.id ? COLORS.white : COLORS.textSecondary} 
            />
            <Text style={[styles.categoryText, selectedCategory === cat.id && styles.categoryTextActive]}>
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Resources List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.teal} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {filteredResources.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="library-outline" size={64} color={COLORS.border} />
              <Text style={styles.emptyText}>لا توجد موارد في هذه الفئة</Text>
            </View>
          ) : (
            filteredResources.map((resource) => (
              <TouchableOpacity 
                key={resource.id} 
                style={[styles.resourceCard, !hasLink(resource) && styles.resourceCardDisabled]}
                onPress={() => handleResourcePress(resource)}
                disabled={!hasLink(resource)}
              >
                <View style={[styles.resourceIcon, { backgroundColor: getTypeColor(resource.content_type) }]}>
                  <Ionicons name={resource.icon as any} size={26} color={COLORS.white} />
                </View>
                <View style={styles.resourceInfo}>
                  <View style={styles.resourceHeader}>
                    <Text style={styles.resourceTitle}>{resource.title}</Text>
                    <View style={styles.typeBadge}>
                      <Ionicons name={getTypeIcon(resource.content_type)} size={12} color={COLORS.textSecondary} />
                    </View>
                  </View>
                  <Text style={styles.resourceDesc} numberOfLines={2}>{resource.description}</Text>
                  <View style={styles.resourceMeta}>
                    {resource.external_url && isYouTubeUrl(resource.external_url) ? (
                      <View style={styles.videoBadge}>
                        <Ionicons name="play-circle" size={14} color={COLORS.teal} />
                        <Text style={styles.videoText}>يُعرض داخل التطبيق</Text>
                      </View>
                    ) : resource.external_url ? (
                      <View style={styles.externalBadge}>
                        <Ionicons name="open-outline" size={14} color={COLORS.info} />
                        <Text style={styles.externalText}>رابط خارجي</Text>
                      </View>
                    ) : hasLink(resource) ? (
                      <View style={styles.availableBadge}>
                        <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
                        <Text style={styles.availableText}>متاح</Text>
                      </View>
                    ) : (
                      <View style={styles.comingSoonBadge}>
                        <Ionicons name="time-outline" size={14} color={COLORS.gold} />
                        <Text style={styles.comingSoonText}>قريباً</Text>
                      </View>
                    )}
                    {resource.duration && (
                      <View style={styles.durationBadge}>
                        <Ionicons name="time-outline" size={14} color={COLORS.teal} />
                        <Text style={styles.resourceDuration}>{resource.duration}</Text>
                      </View>
                    )}
                  </View>
                </View>
                {hasLink(resource) && (
                  <Ionicons 
                    name={resource.external_url && isYouTubeUrl(resource.external_url) ? "play-circle" : resource.external_url ? "open-outline" : "chevron-back"} 
                    size={20} 
                    color={resource.external_url && isYouTubeUrl(resource.external_url) ? COLORS.teal : COLORS.textMuted} 
                  />
                )}
              </TouchableOpacity>
            ))
          )}

          {/* More Coming Section */}
          <View style={styles.moreSection}>
            <View style={styles.moreIcon}>
              <Ionicons name="rocket" size={40} color={COLORS.teal} />
            </View>
            <Text style={styles.moreTitle}>المزيد قريباً!</Text>
            <Text style={styles.moreText}>نعمل على إضافة المزيد من المحتوى القيم</Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background 
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.teal,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.md,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: COLORS.white,
    textAlign: 'right',
  },

  intro: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  introIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.beige,
    justifyContent: 'center',
    alignItems: 'center',
  },
  introText: {
    flex: 1,
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'right',
    lineHeight: 22,
  },

  categoriesScroll: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    maxHeight: 60,
  },
  categoriesContent: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.beige,
    borderWidth: 1,
    borderColor: COLORS.border,
    minWidth: 70,
    height: 40,
  },
  categoryBtnActive: {
    backgroundColor: COLORS.teal,
    borderColor: COLORS.teal,
  },
  categoryText: {
    fontSize: 13,
    fontFamily: FONTS.semiBold,
    color: COLORS.textSecondary,
    marginLeft: 6,
  },
  categoryTextActive: {
    color: COLORS.white,
  },

  content: {
    padding: SPACING.md,
    paddingBottom: 40,
  },

  emptyState: {
    alignItems: 'center',
    padding: SPACING['2xl'],
  },
  emptyText: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },

  resourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: 10,
    ...SHADOWS.md,
  },
  resourceCardDisabled: {
    opacity: 0.7,
  },
  resourceIcon: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.md,
  },
  resourceInfo: {
    flex: 1,
  },
  resourceHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  resourceTitle: {
    flex: 1,
    fontSize: 15,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    textAlign: 'right',
    lineHeight: 22,
  },
  typeBadge: {
    padding: 4,
    borderRadius: 6,
    backgroundColor: COLORS.beige,
    marginRight: 8,
  },
  resourceDesc: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'right',
    marginTop: 4,
    lineHeight: 20,
  },
  resourceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 8,
    gap: 12,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  resourceDuration: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.teal,
  },
  availableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.successLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  availableText: {
    fontSize: 11,
    fontFamily: FONTS.semiBold,
    color: COLORS.success,
  },
  externalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.infoLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  externalText: {
    fontSize: 11,
    fontFamily: FONTS.semiBold,
    color: COLORS.info,
  },
  videoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.tealLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  videoText: {
    fontSize: 11,
    fontFamily: FONTS.semiBold,
    color: COLORS.teal,
  },
  comingSoonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.warningLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  comingSoonText: {
    fontSize: 11,
    fontFamily: FONTS.semiBold,
    color: COLORS.goldDark,
  },

  moreSection: {
    alignItems: 'center',
    padding: SPACING.xl,
    marginTop: SPACING.md,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    ...SHADOWS.sm,
  },
  moreIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.beige,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  moreTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.teal,
  },
  moreText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
});
