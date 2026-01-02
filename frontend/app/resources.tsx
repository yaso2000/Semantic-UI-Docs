import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Linking,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFonts, Cairo_400Regular, Cairo_700Bold } from '@expo-google-fonts/cairo';

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
  {
    id: '1',
    title: '10 عادات صباحية للنجاح',
    description: 'اكتشف العادات الصباحية التي يمارسها الناجحون يومياً وكيف يمكنك تطبيقها',
    category: 'productivity',
    type: 'article',
    icon: 'document-text',
    color: '#4CAF50',
    duration: '5 دقائق قراءة'
  },
  {
    id: '2',
    title: 'تقنيات التأمل للمبتدئين',
    description: 'دليل شامل لتعلم التأمل وتحقيق السلام الداخلي في 10 دقائق يومياً',
    category: 'mindset',
    type: 'video',
    icon: 'play-circle',
    color: '#2196F3',
    duration: '15 دقيقة'
  },
  {
    id: '3',
    title: 'فن التواصل الفعال',
    description: 'تعلم مهارات التواصل الفعال لبناء علاقات أقوى في حياتك الشخصية والمهنية',
    category: 'relationships',
    type: 'article',
    icon: 'document-text',
    color: '#E91E63',
    duration: '8 دقائق قراءة'
  },
  {
    id: '4',
    title: 'جلسة استرخاء صوتية',
    description: 'جلسة استرخاء موجهة للتخلص من التوتر وتحسين جودة النوم',
    category: 'wellness',
    type: 'audio',
    icon: 'headset',
    color: '#9C27B0',
    duration: '20 دقيقة'
  },
  {
    id: '5',
    title: 'دليل تحديد الأهداف الذكية',
    description: 'تعلم كيفية وضع أهداف SMART وخطة عمل لتحقيقها',
    category: 'productivity',
    type: 'pdf',
    icon: 'document',
    color: '#FF9800',
    duration: 'PDF للتحميل'
  },
  {
    id: '6',
    title: 'عجلة الحياة: فهم التوازن',
    description: 'شرح تفصيلي لأداة عجلة الحياة وكيفية استخدامها لتحقيق التوازن',
    category: 'mindset',
    type: 'video',
    icon: 'play-circle',
    color: '#00BCD4',
    duration: '12 دقيقة'
  },
  {
    id: '7',
    title: 'تحسين جودة النوم',
    description: 'نصائح علمية لتحسين جودة نومك والاستيقاظ بنشاط',
    category: 'wellness',
    type: 'article',
    icon: 'document-text',
    color: '#673AB7',
    duration: '6 دقائق قراءة'
  },
  {
    id: '8',
    title: 'إدارة الوقت بفعالية',
    description: 'تقنيات مجربة لإدارة وقتك وزيادة إنتاجيتك اليومية',
    category: 'productivity',
    type: 'video',
    icon: 'play-circle',
    color: '#FF5722',
    duration: '18 دقيقة'
  },
];

export default function ResourcesScreen() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const router = useRouter();

  const [fontsLoaded] = useFonts({ Cairo_400Regular, Cairo_700Bold });

  const filteredResources = selectedCategory === 'all'
    ? RESOURCES
    : RESOURCES.filter(r => r.category === selectedCategory);

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
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>مكتبة الموارد</Text>
      </View>

      <View style={styles.intro}>
        <Ionicons name="library" size={32} color="#FF9800" />
        <Text style={styles.introText}>
          مجموعة من المقالات والفيديوهات والأدوات المفيدة لرحلتك في التطور الشخصي
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesScroll}
        contentContainerStyle={styles.categoriesContent}
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.categoryBtn,
              selectedCategory === cat.id && styles.categoryBtnActive
            ]}
            onPress={() => setSelectedCategory(cat.id)}
          >
            <Ionicons
              name={cat.icon as any}
              size={18}
              color={selectedCategory === cat.id ? '#fff' : '#666'}
            />
            <Text style={[
              styles.categoryText,
              selectedCategory === cat.id && styles.categoryTextActive
            ]}>{cat.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.content}>
        {filteredResources.map((resource) => (
          <TouchableOpacity
            key={resource.id}
            style={styles.resourceCard}
            onPress={() => {}}
          >
            <View style={[styles.resourceIcon, { backgroundColor: resource.color }]}>
              <Ionicons name={resource.icon as any} size={28} color="#fff" />
            </View>
            <View style={styles.resourceInfo}>
              <View style={styles.resourceHeader}>
                <Text style={styles.resourceTitle}>{resource.title}</Text>
                <View style={styles.typeBadge}>
                  <Ionicons name={getTypeIcon(resource.type)} size={12} color="#666" />
                </View>
              </View>
              <Text style={styles.resourceDesc} numberOfLines={2}>
                {resource.description}
              </Text>
              <View style={styles.resourceMeta}>
                <Ionicons name="time-outline" size={14} color="#999" />
                <Text style={styles.resourceDuration}>{resource.duration}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        <View style={styles.moreSection}>
          <Ionicons name="rocket" size={48} color="#FF9800" />
          <Text style={styles.moreTitle}>المزيد قريباً!</Text>
          <Text style={styles.moreText}>
            نعمل على إضافة المزيد من المحتوى القيم لمساعدتك في رحلتك
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FF9800',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontFamily: 'Cairo_700Bold',
    color: '#fff',
    textAlign: 'right',
  },

  intro: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    gap: 12,
  },
  introText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Cairo_400Regular',
    color: '#666',
    textAlign: 'right',
    lineHeight: 22,
  },

  categoriesScroll: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  categoriesContent: {
    padding: 12,
    gap: 10,
  },
  categoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    gap: 6,
  },
  categoryBtnActive: {
    backgroundColor: '#FF9800',
  },
  categoryText: {
    fontSize: 14,
    fontFamily: 'Cairo_700Bold',
    color: '#666',
  },
  categoryTextActive: {
    color: '#fff',
  },

  content: {
    padding: 16,
    paddingBottom: 40,
  },

  resourceCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  resourceIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 14,
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
    fontSize: 16,
    fontFamily: 'Cairo_700Bold',
    color: '#333',
    textAlign: 'right',
    lineHeight: 24,
  },
  typeBadge: {
    padding: 4,
    borderRadius: 6,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
  },
  resourceDesc: {
    fontSize: 13,
    fontFamily: 'Cairo_400Regular',
    color: '#666',
    textAlign: 'right',
    marginTop: 4,
    lineHeight: 20,
  },
  resourceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 8,
    gap: 4,
  },
  resourceDuration: {
    fontSize: 12,
    fontFamily: 'Cairo_400Regular',
    color: '#999',
  },

  moreSection: {
    alignItems: 'center',
    padding: 32,
    marginTop: 16,
  },
  moreTitle: {
    fontSize: 20,
    fontFamily: 'Cairo_700Bold',
    color: '#333',
    marginTop: 16,
  },
  moreText: {
    fontSize: 14,
    fontFamily: 'Cairo_400Regular',
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
});
