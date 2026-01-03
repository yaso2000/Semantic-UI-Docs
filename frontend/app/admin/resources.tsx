import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  StatusBar,
  Switch} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFonts, Alexandria_400Regular, Alexandria_600SemiBold, Alexandria_700Bold } from '@expo-google-fonts/alexandria';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, FONTS, SHADOWS, RADIUS, SPACING } from '../../src/constants/theme';
import { Picker } from '@react-native-picker/picker';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface Resource {
  id: string;
  title: string;
  description: string;
  category: string;
  content_type: string;
  content?: string;
  external_url?: string;
  internal_route?: string;
  duration?: string;
  icon: string;
  is_active: boolean;
  created_at?: string;
}

const CATEGORIES = [
  { value: 'wellness', label: 'الصحة', icon: 'heart' },
  { value: 'mindset', label: 'العقلية', icon: 'bulb' },
  { value: 'productivity', label: 'الإنتاجية', icon: 'trending-up' },
  { value: 'relationships', label: 'العلاقات', icon: 'people' },
];

const CONTENT_TYPES = [
  { value: 'article', label: 'مقال', icon: 'document-text' },
  { value: 'video', label: 'فيديو', icon: 'play-circle' },
  { value: 'audio', label: 'صوت', icon: 'headset' },
  { value: 'pdf', label: 'PDF', icon: 'document' },
];

const ICONS = [
  'document-text', 'play-circle', 'headset', 'document', 
  'book', 'bulb', 'heart', 'star', 'flash', 'leaf',
  'fitness', 'nutrition', 'happy', 'sparkles'
];

export default function AdminResourcesScreen() {
  const insets = useSafeAreaInsets();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('wellness');
  const [contentType, setContentType] = useState('article');
  const [content, setContent] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [internalRoute, setInternalRoute] = useState('');
  const [duration, setDuration] = useState('');
  const [icon, setIcon] = useState('document-text');
  const [isActive, setIsActive] = useState(true);

  const [fontsLoaded] = useFonts({ Alexandria_400Regular, Alexandria_600SemiBold, Alexandria_700Bold });

  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/admin/resources`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setResources(data);
      }
    } catch (error) {
      console.error('Error loading resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('wellness');
    setContentType('article');
    setContent('');
    setExternalUrl('');
    setInternalRoute('');
    setDuration('');
    setIcon('document-text');
    setIsActive(true);
    setEditingResource(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (resource: Resource) => {
    setEditingResource(resource);
    setTitle(resource.title);
    setDescription(resource.description);
    setCategory(resource.category);
    setContentType(resource.content_type);
    setContent(resource.content || '');
    setExternalUrl(resource.external_url || '');
    setInternalRoute(resource.internal_route || '');
    setDuration(resource.duration || '');
    setIcon(resource.icon);
    setIsActive(resource.is_active);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('خطأ', 'يرجى ملء العنوان والوصف');
      return;
    }

    setSaving(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const resourceData = {
        title,
        description,
        category,
        content_type: contentType,
        content: content || null,
        external_url: externalUrl || null,
        internal_route: internalRoute || null,
        duration: duration || null,
        icon,
        is_active: isActive};

      const url = editingResource 
        ? `${API_URL}/api/admin/resources/${editingResource.id}`
        : `${API_URL}/api/admin/resources`;
      
      const method = editingResource ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(resourceData)
      });

      if (response.ok) {
        Alert.alert('نجاح', editingResource ? 'تم تحديث المورد' : 'تم إضافة المورد');
        setShowModal(false);
        resetForm();
        loadResources();
      } else {
        const error = await response.json();
        Alert.alert('خطأ', error.detail || 'حدث خطأ');
      }
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ في الاتصال');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (resourceId: string) => {
    Alert.alert(
      'تأكيد الحذف',
      'هل أنت متأكد من حذف هذا المورد؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              const response = await fetch(`${API_URL}/api/admin/resources/${resourceId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
              });

              if (response.ok) {
                Alert.alert('نجاح', 'تم حذف المورد');
                loadResources();
              }
            } catch (error) {
              Alert.alert('خطأ', 'حدث خطأ في الحذف');
            }
          }
        }
      ]
    );
  };

  const getCategoryLabel = (value: string) => {
    return CATEGORIES.find(c => c.value === value)?.label || value;
  };

  const getTypeLabel = (value: string) => {
    return CONTENT_TYPES.find(t => t.value === value)?.label || value;
  };

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
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
          <Ionicons name="arrow-forward" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>إدارة المكتبة</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openAddModal}>
          <Ionicons name="add" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{resources.length}</Text>
          <Text style={styles.statLabel}>إجمالي الموارد</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{resources.filter(r => r.is_active).length}</Text>
          <Text style={styles.statLabel}>نشط</Text>
        </View>
      </View>

      {/* Resources List */}
      <ScrollView contentContainerStyle={styles.content}>
        {resources.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="library-outline" size={64} color={COLORS.border} />
            <Text style={styles.emptyText}>لا توجد موارد بعد</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={openAddModal}>
              <Ionicons name="add" size={20} color={COLORS.white} />
              <Text style={styles.emptyBtnText}>إضافة مورد</Text>
            </TouchableOpacity>
          </View>
        ) : (
          resources.map((resource) => (
            <View key={resource.id} style={[styles.resourceCard, !resource.is_active && styles.resourceCardInactive]}>
              <View style={styles.resourceHeader}>
                <View style={[styles.resourceIcon, { backgroundColor: resource.is_active ? COLORS.teal : COLORS.textMuted }]}>
                  <Ionicons name={resource.icon as any} size={22} color={COLORS.white} />
                </View>
                <View style={styles.resourceInfo}>
                  <Text style={styles.resourceTitle}>{resource.title}</Text>
                  <View style={styles.resourceMeta}>
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{getCategoryLabel(resource.category)}</Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: COLORS.beige }]}>
                      <Text style={[styles.badgeText, { color: COLORS.textSecondary }]}>{getTypeLabel(resource.content_type)}</Text>
                    </View>
                    {!resource.is_active && (
                      <View style={[styles.badge, { backgroundColor: COLORS.errorLight }]}>
                        <Text style={[styles.badgeText, { color: COLORS.error }]}>غير نشط</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
              <Text style={styles.resourceDesc} numberOfLines={2}>{resource.description}</Text>
              
              {/* External URL indicator */}
              {resource.external_url && (
                <View style={styles.linkIndicator}>
                  <Ionicons name="link" size={14} color={COLORS.info} />
                  <Text style={styles.linkText}>رابط خارجي</Text>
                </View>
              )}
              
              <View style={styles.resourceActions}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => openEditModal(resource)}>
                  <Ionicons name="create" size={18} color={COLORS.teal} />
                  <Text style={styles.actionBtnText}>تعديل</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={() => handleDelete(resource.id)}>
                  <Ionicons name="trash" size={18} color={COLORS.error} />
                  <Text style={[styles.actionBtnText, { color: COLORS.error }]}>حذف</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.textMuted} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {editingResource ? 'تعديل المورد' : 'إضافة مورد جديد'}
              </Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Title */}
              <Text style={styles.inputLabel}>العنوان *</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="عنوان المورد"
                placeholderTextColor={COLORS.textMuted}
                textAlign="right"
              />

              {/* Description */}
              <Text style={styles.inputLabel}>الوصف *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="وصف مختصر للمورد"
                placeholderTextColor={COLORS.textMuted}
                textAlign="right"
                multiline
                numberOfLines={3}
              />

              {/* Category */}
              <Text style={styles.inputLabel}>الفئة</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={category}
                  onValueChange={setCategory}
                  style={styles.picker}
                >
                  {CATEGORIES.map(cat => (
                    <Picker.Item key={cat.value} label={cat.label} value={cat.value} />
                  ))}
                </Picker>
              </View>

              {/* Content Type */}
              <Text style={styles.inputLabel}>نوع المحتوى</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={contentType}
                  onValueChange={setContentType}
                  style={styles.picker}
                >
                  {CONTENT_TYPES.map(type => (
                    <Picker.Item key={type.value} label={type.label} value={type.value} />
                  ))}
                </Picker>
              </View>

              {/* Duration */}
              <Text style={styles.inputLabel}>المدة</Text>
              <TextInput
                style={styles.input}
                value={duration}
                onChangeText={setDuration}
                placeholder="مثال: 5 دقائق"
                placeholderTextColor={COLORS.textMuted}
                textAlign="right"
              />

              {/* External URL */}
              <Text style={styles.inputLabel}>رابط خارجي (يوتيوب، إلخ)</Text>
              <TextInput
                style={styles.input}
                value={externalUrl}
                onChangeText={setExternalUrl}
                placeholder="https://youtube.com/..."
                placeholderTextColor={COLORS.textMuted}
                textAlign="left"
                autoCapitalize="none"
                keyboardType="url"
              />

              {/* Content (for articles) */}
              {contentType === 'article' && (
                <>
                  <Text style={styles.inputLabel}>المحتوى النصي</Text>
                  <TextInput
                    style={[styles.input, styles.contentArea]}
                    value={content}
                    onChangeText={setContent}
                    placeholder="اكتب محتوى المقال هنا..."
                    placeholderTextColor={COLORS.textMuted}
                    textAlign="right"
                    multiline
                    numberOfLines={8}
                  />
                </>
              )}

              {/* Icon Selection */}
              <Text style={styles.inputLabel}>الأيقونة</Text>
              <View style={styles.iconsGrid}>
                {ICONS.map((iconName) => (
                  <TouchableOpacity
                    key={iconName}
                    style={[styles.iconOption, icon === iconName && styles.iconOptionSelected]}
                    onPress={() => setIcon(iconName)}
                  >
                    <Ionicons name={iconName as any} size={24} color={icon === iconName ? COLORS.white : COLORS.textSecondary} />
                  </TouchableOpacity>
                ))}
              </View>

              {/* Active Switch */}
              <View style={styles.switchRow}>
                <Switch
                  value={isActive}
                  onValueChange={setIsActive}
                  trackColor={{ false: COLORS.border, true: COLORS.tealLight }}
                  thumbColor={isActive ? COLORS.teal : COLORS.textMuted}
                />
                <Text style={styles.switchLabel}>نشط ومرئي للمستخدمين</Text>
              </View>

              {/* Save Button */}
              <TouchableOpacity 
                style={[styles.saveBtn, saving && styles.saveBtnDisabled]} 
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <>
                    <Ionicons name={editingResource ? "checkmark" : "add"} size={22} color={COLORS.white} />
                    <Text style={styles.saveBtnText}>
                      {editingResource ? 'حفظ التغييرات' : 'إضافة المورد'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background},
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background},

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.teal},
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center'},
  headerTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: COLORS.white},
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center'},

  statsRow: {
    flexDirection: 'row',
    padding: SPACING.md,
    gap: SPACING.sm},
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    ...SHADOWS.sm},
  statNumber: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    color: COLORS.teal},
  statLabel: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary},

  content: {
    padding: SPACING.md,
    paddingBottom: 40},

  emptyState: {
    alignItems: 'center',
    padding: SPACING['2xl']},
  emptyText: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    color: COLORS.textSecondary,
    marginTop: SPACING.md},
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.teal,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    gap: 6,
    marginTop: SPACING.md},
  emptyBtnText: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: COLORS.white},

  resourceCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.md},
  resourceCardInactive: {
    opacity: 0.7},
  resourceHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start'},
  resourceIcon: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.sm},
  resourceInfo: {
    flex: 1},
  resourceTitle: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    textAlign: 'right'},
  resourceMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 6,
    marginTop: 6},
  badge: {
    backgroundColor: `${COLORS.teal}15`,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.sm},
  badgeText: {
    fontSize: 11,
    fontFamily: FONTS.semiBold,
    color: COLORS.teal},
  resourceDesc: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'right',
    marginTop: SPACING.sm,
    lineHeight: 20},
  linkIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: SPACING.sm},
  linkText: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.info},
  resourceActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.sm,
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border},
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
    backgroundColor: `${COLORS.teal}10`,
    gap: 4},
  actionBtnText: {
    fontSize: 13,
    fontFamily: FONTS.semiBold,
    color: COLORS.teal},
  deleteBtn: {
    backgroundColor: COLORS.errorLight},

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end'},
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg,
    maxHeight: '90%'},
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg},
  modalTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: COLORS.teal},

  inputLabel: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
    textAlign: 'right',
    marginBottom: 6,
    marginTop: SPACING.sm},
  input: {
    backgroundColor: COLORS.beige,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: 15,
    fontFamily: FONTS.regular,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border},
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top'},
  contentArea: {
    minHeight: 150,
    textAlignVertical: 'top'},

  pickerContainer: {
    backgroundColor: COLORS.beige,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden'},
  picker: {
    height: 50},

  iconsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm},
  iconOption: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.beige,
    justifyContent: 'center',
    alignItems: 'center'},
  iconOptionSelected: {
    backgroundColor: COLORS.teal},

  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: SPACING.md,
    gap: SPACING.sm},
  switchLabel: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.text},

  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.teal,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    gap: 8,
    marginTop: SPACING.lg,
    marginBottom: SPACING.xl},
  saveBtnDisabled: {
    opacity: 0.7},
  saveBtnText: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.white}});
