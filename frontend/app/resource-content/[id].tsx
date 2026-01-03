import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFonts, Alexandria_400Regular, Alexandria_600SemiBold, Alexandria_700Bold } from '@expo-google-fonts/alexandria';
import { COLORS, FONTS, SHADOWS, RADIUS, SPACING } from '../../src/constants/theme';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface Resource {
  id: string;
  title: string;
  description: string;
  category: string;
  content_type: string;
  content?: string;
  duration?: string;
  icon: string;
  created_at?: string;
}

export default function ResourceContentScreen() {
  const { id } = useLocalSearchParams();
  const [resource, setResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const [fontsLoaded] = useFonts({ Alexandria_400Regular, Alexandria_600SemiBold, Alexandria_700Bold });

  useEffect(() => {
    loadResource();
  }, [id]);

  const loadResource = async () => {
    try {
      const response = await fetch(`${API_URL}/api/resources/${id}`);
      if (response.ok) {
        const data = await response.json();
        setResource(data);
      }
    } catch (error) {
      console.error('Error loading resource:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryLabel = (category: string) => {
    const categories: Record<string, string> = {
      wellness: 'الصحة',
      mindset: 'العقلية',
      productivity: 'الإنتاجية',
      relationships: 'العلاقات',
    };
    return categories[category] || category;
  };

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <ActivityIndicator size="large" color={COLORS.teal} />
      </View>
    );
  }

  if (!resource) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-forward" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>المورد غير موجود</Text>
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="alert-circle-outline" size={64} color={COLORS.error} />
          <Text style={styles.emptyText}>لم يتم العثور على هذا المورد</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>العودة للمكتبة</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{resource.title}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Article Header */}
        <View style={styles.articleHeader}>
          <View style={[styles.iconContainer, { backgroundColor: COLORS.teal }]}>
            <Ionicons name={resource.icon as any} size={32} color={COLORS.white} />
          </View>
          <Text style={styles.articleTitle}>{resource.title}</Text>
          <Text style={styles.articleDesc}>{resource.description}</Text>
          
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="folder" size={16} color={COLORS.teal} />
              <Text style={styles.metaText}>{getCategoryLabel(resource.category)}</Text>
            </View>
            {resource.duration && (
              <View style={styles.metaItem}>
                <Ionicons name="time" size={16} color={COLORS.teal} />
                <Text style={styles.metaText}>{resource.duration}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Article Content */}
        <View style={styles.articleContent}>
          <Text style={styles.contentText}>{resource.content || 'لا يوجد محتوى متاح'}</Text>
        </View>

        {/* Back Button */}
        <TouchableOpacity style={styles.returnBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={20} color={COLORS.teal} />
          <Text style={styles.returnBtnText}>العودة للمكتبة</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
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
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.white,
    textAlign: 'right',
  },

  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  backButton: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.teal,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  backButtonText: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },

  content: {
    padding: SPACING.md,
    paddingBottom: 40,
  },

  articleHeader: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    ...SHADOWS.md,
  },
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  articleTitle: {
    fontSize: 22,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 32,
  },
  articleDesc: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.lg,
    marginTop: SPACING.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    fontFamily: FONTS.semiBold,
    color: COLORS.teal,
  },

  articleContent: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginTop: SPACING.md,
    ...SHADOWS.sm,
  },
  contentText: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: COLORS.text,
    textAlign: 'right',
    lineHeight: 28,
  },

  returnBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.lg,
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.teal,
  },
  returnBtnText: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.teal,
  },
});
