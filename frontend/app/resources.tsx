import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFonts, Alexandria_400Regular, Alexandria_600SemiBold, Alexandria_700Bold } from '@expo-google-fonts/alexandria';
import { COLORS, FONTS } from '../src/constants/theme';

interface Resource {
  id: string;
  title: string;
  description: string;
  category: string;
  type: 'article' | 'video' | 'audio' | 'pdf';
  icon: string;
  color: string;
  duration?: string;
}

const CATEGORIES = [
  { id: 'all', name: 'الكل', icon: 'apps' },
  { id: 'wellness', name: 'الصحة', icon: 'heart' },
  { id: 'mindset', name: 'العقلية', icon: 'bulb' },
  { id: 'productivity', name: 'الإنتاجية', icon: 'trending-up' },
  { id: 'relationships', name: 'العلاقات', icon: 'people' },
];

const RESOURCES: Resource[] = [
  { id: '1', title: '10 عادات صباحية للنجاح', description: 'اكتشف العادات الصباحية التي يمارسها الناجحون', category: 'productivity', type: 'article', icon: 'document-text', color: '#4CAF50', duration: '5 دقائق' },
  { id: '2', title: 'تقنيات التأمل للمبتدئين', description: 'دليل شامل لتعلم التأمل في 10 دقائق يومياً', category: 'mindset', type: 'video', icon: 'play-circle', color: '#2196F3', duration: '15 دقيقة' },
  { id: '3', title: 'فن التواصل الفعال', description: 'تعلم مهارات التواصل لبناء علاقات أقوى', category: 'relationships', type: 'article', icon: 'document-text', color: '#E91E63', duration: '8 دقائق' },
  { id: '4', title: 'جلسة استرخاء صوتية', description: 'جلسة موجهة للتخلص من التوتر', category: 'wellness', type: 'audio', icon: 'headset', color: '#9C27B0', duration: '20 دقيقة' },
  { id: '5', title: 'دليل تحديد الأهداف الذكية', description: 'تعلم وضع أهداف SMART وتحقيقها', category: 'productivity', type: 'pdf', icon: 'document', color: '#FF9800', duration: 'PDF' },
  { id: '6', title: 'عجلة الحياة: فهم التوازن', description: 'شرح تفصيلي لأداة عجلة الحياة', category: 'mindset', type: 'video', icon: 'play-circle', color: '#00BCD4', duration: '12 دقيقة' },
  { id: '7', title: 'تحسين جودة النوم', description: 'نصائح علمية لنوم أفضل', category: 'wellness', type: 'article', icon: 'document-text', color: '#673AB7', duration: '6 دقائق' },
  { id: '8', title: 'إدارة الوقت بفعالية', description: 'تقنيات لزيادة إنتاجيتك اليومية', category: 'productivity', type: 'video', icon: 'play-circle', color: '#FF5722', duration: '18 دقيقة' },
];

export default function ResourcesScreen() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const router = useRouter();
  const [fontsLoaded] = useFonts({ Alexandria_400Regular, Alexandria_600SemiBold, Alexandria_700Bold });

  const filteredResources = selectedCategory === 'all' ? RESOURCES : RESOURCES.filter(r => r.category === selectedCategory);
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return 'videocam';
      case 'audio': return 'headset';
      case 'pdf': return 'document-attach';
      default: return 'document-text';
    }
  };

  if (!fontsLoaded) return null;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color={COLORS.gold} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>مكتبة الموارد</Text>
      </View>

      <View style={styles.intro}>
        <View style={styles.introIcon}>
          <Ionicons name="library" size={32} color={COLORS.gold} />
        </View>
        <Text style={styles.introText}>
          مجموعة من المقالات والفيديوهات والأدوات المفيدة لرحلتك
        </Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll} contentContainerStyle={styles.categoriesContent}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.categoryBtn, selectedCategory === cat.id && styles.categoryBtnActive]}
            onPress={() => setSelectedCategory(cat.id)}
          >
            <Ionicons name={cat.icon as any} size={16} color={selectedCategory === cat.id ? COLORS.primary : COLORS.textMuted} />
            <Text style={[styles.categoryText, selectedCategory === cat.id && styles.categoryTextActive]}>{cat.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.content}>
        {filteredResources.map((resource) => (
          <TouchableOpacity key={resource.id} style={styles.resourceCard}>
            <View style={[styles.resourceIcon, { backgroundColor: resource.color }]}>
              <Ionicons name={resource.icon as any} size={26} color="#fff" />
            </View>
            <View style={styles.resourceInfo}>
              <View style={styles.resourceHeader}>
                <Text style={styles.resourceTitle}>{resource.title}</Text>
                <View style={styles.typeBadge}>
                  <Ionicons name={getTypeIcon(resource.type)} size={12} color={COLORS.textMuted} />
                </View>
              </View>
              <Text style={styles.resourceDesc} numberOfLines={2}>{resource.description}</Text>
              <View style={styles.resourceMeta}>
                <Ionicons name="time-outline" size={14} color={COLORS.gold} />
                <Text style={styles.resourceDuration}>{resource.duration}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        <View style={styles.moreSection}>
          <View style={styles.moreIcon}>
            <Ionicons name="rocket" size={40} color={COLORS.gold} />
          </View>
          <Text style={styles.moreTitle}>المزيد قريباً!</Text>
          <Text style={styles.moreText}>نعمل على إضافة المزيد من المحتوى القيم</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  
  header: {
    flexDirection: 'row', alignItems: 'center', padding: 20,
    backgroundColor: COLORS.secondary, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center', marginLeft: 16,
  },
  headerTitle: { flex: 1, fontSize: 20, fontFamily: FONTS.bold, color: COLORS.gold, textAlign: 'right' },

  intro: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.secondary, padding: 16, gap: 12,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  introIcon: {
    width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(212, 175, 55, 0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  introText: { flex: 1, fontSize: 14, fontFamily: FONTS.regular, color: COLORS.textMuted, textAlign: 'right', lineHeight: 22 },

  categoriesScroll: { backgroundColor: COLORS.secondary, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  categoriesContent: { padding: 12, gap: 8 },
  categoryBtn: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 14,
    borderRadius: 20, backgroundColor: COLORS.primary, gap: 6, borderWidth: 1, borderColor: COLORS.border,
  },
  categoryBtnActive: { backgroundColor: COLORS.gold, borderColor: COLORS.gold },
  categoryText: { fontSize: 13, fontFamily: FONTS.semiBold, color: COLORS.textMuted },
  categoryTextActive: { color: COLORS.primary },

  content: { padding: 16, paddingBottom: 40 },

  resourceCard: {
    flexDirection: 'row', backgroundColor: COLORS.secondary, borderRadius: 14, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: COLORS.border,
  },
  resourceIcon: { width: 56, height: 56, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginLeft: 14 },
  resourceInfo: { flex: 1 },
  resourceHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  resourceTitle: { flex: 1, fontSize: 15, fontFamily: FONTS.bold, color: COLORS.text, textAlign: 'right', lineHeight: 22 },
  typeBadge: { padding: 4, borderRadius: 6, backgroundColor: COLORS.primary, marginRight: 8 },
  resourceDesc: { fontSize: 13, fontFamily: FONTS.regular, color: COLORS.textMuted, textAlign: 'right', marginTop: 4, lineHeight: 20 },
  resourceMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 8, gap: 4 },
  resourceDuration: { fontSize: 12, fontFamily: FONTS.regular, color: COLORS.gold },

  moreSection: { alignItems: 'center', padding: 32, marginTop: 16 },
  moreIcon: {
    width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(212, 175, 55, 0.15)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  moreTitle: { fontSize: 18, fontFamily: FONTS.bold, color: COLORS.gold },
  moreText: { fontSize: 14, fontFamily: FONTS.regular, color: COLORS.textMuted, textAlign: 'center', marginTop: 8 },
});
