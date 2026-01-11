import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts, Alexandria_400Regular, Alexandria_600SemiBold, Alexandria_700Bold } from '@expo-google-fonts/alexandria';
import { COLORS, FONTS, SHADOWS, RADIUS, SPACING } from '../../src/constants/theme';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface Package {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'private_sessions' | 'self_training';
  is_active: boolean;
  
  // حقول الحصص الخاصة
  sessions_count?: number;
  validity_days?: number;
  includes_self_training?: boolean;
  
  // حقول التدريب الذاتي
  subscription_type?: string;
  duration_months?: number;
  auto_renewal?: boolean;
  
  // حقول إضافية
  features: string[];
  discount_percentage: number;
  is_popular: boolean;
  display_order: number;
}

const SUBSCRIPTION_TYPES = [
  { id: 'monthly', label: 'شهري', months: 1 },
  { id: 'quarterly', label: 'فصلي (3 شهور)', months: 3 },
  { id: 'yearly', label: 'سنوي', months: 12 },
];

export default function AdminPackagesManagement() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'private_sessions' | 'self_training'>('all');
  
  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  // Form states
  const [category, setCategory] = useState<'private_sessions' | 'self_training'>('private_sessions');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isPopular, setIsPopular] = useState(false);
  const [features, setFeatures] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState('0');
  const [displayOrder, setDisplayOrder] = useState('0');
  
  // حقول الحصص الخاصة
  const [sessionsCount, setSessionsCount] = useState('');
  const [validityDays, setValidityDays] = useState('90');
  const [includesSelfTraining, setIncludesSelfTraining] = useState(false);
  
  // حقول التدريب الذاتي
  const [subscriptionType, setSubscriptionType] = useState('monthly');
  const [durationMonths, setDurationMonths] = useState('1');
  const [autoRenewal, setAutoRenewal] = useState(false);

  const [fontsLoaded] = useFonts({ Alexandria_400Regular, Alexandria_600SemiBold, Alexandria_700Bold });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setError(null);
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        setError('يرجى تسجيل الدخول أولاً');
        setLoading(false);
        return;
      }
      
      // جلب الباقات
      const packagesRes = await fetch(`${API_URL}/api/admin/packages/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (packagesRes.ok) {
        const packagesData = await packagesRes.json();
        setPackages(packagesData);
      } else if (packagesRes.status === 401 || packagesRes.status === 403) {
        setError('ليس لديك صلاحية للوصول لهذه الصفحة');
        setLoading(false);
        return;
      }
      
      // جلب الإحصائيات
      const statsRes = await fetch(`${API_URL}/api/admin/packages/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setError('حدث خطأ في الاتصال');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (pkg?: Package) => {
    if (pkg) {
      setEditingPackage(pkg);
      setCategory(pkg.category);
      setName(pkg.name);
      setDescription(pkg.description);
      setPrice(String(pkg.price));
      setIsActive(pkg.is_active);
      setIsPopular(pkg.is_popular);
      setFeatures(pkg.features?.join('\n') || '');
      setDiscountPercentage(String(pkg.discount_percentage || 0));
      setDisplayOrder(String(pkg.display_order || 0));
      
      // حقول الحصص الخاصة
      setSessionsCount(String(pkg.sessions_count || ''));
      setValidityDays(String(pkg.validity_days || 90));
      setIncludesSelfTraining(pkg.includes_self_training || false);
      
      // حقول التدريب الذاتي
      setSubscriptionType(pkg.subscription_type || 'monthly');
      setDurationMonths(String(pkg.duration_months || 1));
      setAutoRenewal(pkg.auto_renewal || false);
    } else {
      setEditingPackage(null);
      setCategory('private_sessions');
      setName('');
      setDescription('');
      setPrice('');
      setIsActive(true);
      setIsPopular(false);
      setFeatures('');
      setDiscountPercentage('0');
      setDisplayOrder('0');
      setSessionsCount('');
      setValidityDays('90');
      setIncludesSelfTraining(false);
      setSubscriptionType('monthly');
      setDurationMonths('1');
      setAutoRenewal(false);
    }
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingPackage(null);
  };

  const handleSave = async () => {
    // التحقق من الحقول المطلوبة
    if (!name.trim() || !description.trim() || !price) {
      Alert.alert('تنبيه', 'يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    if (category === 'private_sessions' && !sessionsCount) {
      Alert.alert('تنبيه', 'يرجى تحديد عدد الحصص');
      return;
    }

    if (category === 'self_training' && !subscriptionType) {
      Alert.alert('تنبيه', 'يرجى تحديد نوع الاشتراك');
      return;
    }

    setSaving(true);
    try {
      const token = await AsyncStorage.getItem('token');
      
      const packageData: any = {
        name: name.trim(),
        description: description.trim(),
        price: parseFloat(price),
        category,
        is_active: isActive,
        is_popular: isPopular,
        features: features.split('\n').filter(f => f.trim()),
        discount_percentage: parseFloat(discountPercentage) || 0,
        display_order: parseInt(displayOrder) || 0,
      };

      if (category === 'private_sessions') {
        packageData.sessions_count = parseInt(sessionsCount);
        packageData.validity_days = parseInt(validityDays) || 90;
        packageData.includes_self_training = includesSelfTraining;
      } else {
        packageData.subscription_type = subscriptionType;
        packageData.duration_months = parseInt(durationMonths) || SUBSCRIPTION_TYPES.find(t => t.id === subscriptionType)?.months || 1;
        packageData.auto_renewal = autoRenewal;
      }

      const url = editingPackage 
        ? `${API_URL}/api/admin/packages/${editingPackage.id}`
        : `${API_URL}/api/admin/packages/create`;
      
      const method = editingPackage ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(packageData)
      });

      if (response.ok) {
        Alert.alert('نجاح', editingPackage ? 'تم تحديث الباقة بنجاح' : 'تم إنشاء الباقة بنجاح');
        closeModal();
        loadData();
      } else {
        const error = await response.json();
        Alert.alert('خطأ', error.detail || 'فشل في حفظ الباقة');
      }
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ في الاتصال');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (packageId: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/admin/packages/${packageId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        Alert.alert('نجاح', 'تم حذف الباقة بنجاح');
        setDeleteConfirmId(null);
        loadData();
      } else {
        const error = await response.json();
        Alert.alert('خطأ', error.detail || 'فشل في حذف الباقة');
      }
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ في الاتصال');
    }
  };

  const filteredPackages = packages.filter(pkg => {
    if (activeFilter === 'all') return true;
    return pkg.category === activeFilter;
  });

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.teal} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.teal} />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-forward" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>إدارة الباقات</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={COLORS.error} />
          <Text style={styles.errorTitle}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadData}>
            <Text style={styles.retryBtnText}>إعادة المحاولة</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.teal} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>إدارة الباقات</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => openModal()}>
          <Ionicons name="add" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Stats */}
        {stats && (
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: '#E3F2FD' }]}>
              <Text style={[styles.statValue, { color: '#2196F3' }]}>{stats.total_packages}</Text>
              <Text style={styles.statLabel}>إجمالي الباقات</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#E8F5E9' }]}>
              <Text style={[styles.statValue, { color: '#4CAF50' }]}>{stats.active_subscriptions}</Text>
              <Text style={styles.statLabel}>الاشتراكات الفعالة</Text>
            </View>
          </View>
        )}

        {/* Filter Tabs */}
        <View style={styles.filterTabs}>
          <TouchableOpacity
            style={[styles.filterTab, activeFilter === 'all' && styles.filterTabActive]}
            onPress={() => setActiveFilter('all')}
          >
            <Text style={[styles.filterTabText, activeFilter === 'all' && styles.filterTabTextActive]}>الكل</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, activeFilter === 'private_sessions' && styles.filterTabActive]}
            onPress={() => setActiveFilter('private_sessions')}
          >
            <Text style={[styles.filterTabText, activeFilter === 'private_sessions' && styles.filterTabTextActive]}>
              حصص خاصة
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, activeFilter === 'self_training' && styles.filterTabActive]}
            onPress={() => setActiveFilter('self_training')}
          >
            <Text style={[styles.filterTabText, activeFilter === 'self_training' && styles.filterTabTextActive]}>
              تدريب ذاتي
            </Text>
          </TouchableOpacity>
        </View>

        {/* Packages List */}
        {filteredPackages.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={64} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>لا توجد باقات بعد</Text>
            <TouchableOpacity style={styles.createBtn} onPress={() => openModal()}>
              <Text style={styles.createBtnText}>إنشاء باقة جديدة</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredPackages.map((pkg) => (
            <View key={pkg.id} style={[styles.packageCard, !pkg.is_active && styles.packageCardInactive]}>
              {/* Badge */}
              <View style={styles.packageBadges}>
                <View style={[
                  styles.categoryBadge, 
                  { backgroundColor: pkg.category === 'private_sessions' ? '#E3F2FD' : '#F3E5F5' }
                ]}>
                  <Text style={[
                    styles.categoryBadgeText,
                    { color: pkg.category === 'private_sessions' ? '#2196F3' : '#9C27B0' }
                  ]}>
                    {pkg.category === 'private_sessions' ? 'حصص خاصة' : 'تدريب ذاتي'}
                  </Text>
                </View>
                {pkg.is_popular && (
                  <View style={styles.popularBadge}>
                    <Ionicons name="star" size={12} color="#FF9800" />
                    <Text style={styles.popularBadgeText}>مميزة</Text>
                  </View>
                )}
                {!pkg.is_active && (
                  <View style={styles.inactiveBadge}>
                    <Text style={styles.inactiveBadgeText}>معطلة</Text>
                  </View>
                )}
              </View>

              <Text style={styles.packageName}>{pkg.name}</Text>
              <Text style={styles.packageDesc} numberOfLines={2}>{pkg.description}</Text>

              <View style={styles.packageDetails}>
                <View style={styles.packageDetail}>
                  <Ionicons name="cash-outline" size={16} color={COLORS.teal} />
                  <Text style={styles.packageDetailText}>{pkg.price} ر.س</Text>
                </View>
                {pkg.category === 'private_sessions' ? (
                  <>
                    <View style={styles.packageDetail}>
                      <Ionicons name="time-outline" size={16} color={COLORS.teal} />
                      <Text style={styles.packageDetailText}>{pkg.sessions_count} حصة</Text>
                    </View>
                    <View style={styles.packageDetail}>
                      <Ionicons name="calendar-outline" size={16} color={COLORS.teal} />
                      <Text style={styles.packageDetailText}>{pkg.validity_days} يوم</Text>
                    </View>
                  </>
                ) : (
                  <View style={styles.packageDetail}>
                    <Ionicons name="refresh-outline" size={16} color={COLORS.teal} />
                    <Text style={styles.packageDetailText}>
                      {SUBSCRIPTION_TYPES.find(t => t.id === pkg.subscription_type)?.label || pkg.subscription_type}
                    </Text>
                  </View>
                )}
              </View>

              {/* Actions */}
              <View style={styles.packageActions}>
                <TouchableOpacity style={styles.editBtn} onPress={() => openModal(pkg)}>
                  <Ionicons name="create-outline" size={18} color={COLORS.teal} />
                  <Text style={styles.editBtnText}>تعديل</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.deleteBtn} 
                  onPress={() => setDeleteConfirmId(pkg.id)}
                >
                  <Ionicons name="trash-outline" size={18} color={COLORS.error} />
                  <Text style={styles.deleteBtnText}>حذف</Text>
                </TouchableOpacity>
              </View>

              {/* Delete Confirmation */}
              {deleteConfirmId === pkg.id && (
                <View style={styles.deleteConfirm}>
                  <Text style={styles.deleteConfirmText}>هل أنت متأكد من حذف هذه الباقة؟</Text>
                  <View style={styles.deleteConfirmActions}>
                    <TouchableOpacity 
                      style={styles.confirmDeleteBtn} 
                      onPress={() => handleDelete(pkg.id)}
                    >
                      <Text style={styles.confirmDeleteBtnText}>نعم، احذف</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.cancelDeleteBtn} 
                      onPress={() => setDeleteConfirmId(null)}
                    >
                      <Text style={styles.cancelDeleteBtnText}>إلغاء</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* Create/Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView 
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {editingPackage ? 'تعديل الباقة' : 'إنشاء باقة جديدة'}
              </Text>
              <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.modalBody}>
              {/* اختيار الفئة (للباقات الجديدة فقط) */}
              {!editingPackage && (
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>فئة الباقة *</Text>
                  <View style={styles.categorySelector}>
                    <TouchableOpacity
                      style={[
                        styles.categoryOption,
                        category === 'private_sessions' && styles.categoryOptionActive
                      ]}
                      onPress={() => setCategory('private_sessions')}
                    >
                      <Ionicons 
                        name="people" 
                        size={24} 
                        color={category === 'private_sessions' ? COLORS.white : '#2196F3'} 
                      />
                      <Text style={[
                        styles.categoryOptionText,
                        category === 'private_sessions' && styles.categoryOptionTextActive
                      ]}>
                        حصص خاصة
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.categoryOption,
                        category === 'self_training' && styles.categoryOptionActive
                      ]}
                      onPress={() => setCategory('self_training')}
                    >
                      <Ionicons 
                        name="fitness" 
                        size={24} 
                        color={category === 'self_training' ? COLORS.white : '#9C27B0'} 
                      />
                      <Text style={[
                        styles.categoryOptionText,
                        category === 'self_training' && styles.categoryOptionTextActive
                      ]}>
                        تدريب ذاتي
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* الحقول المشتركة */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>اسم الباقة *</Text>
                <TextInput
                  style={styles.formInput}
                  value={name}
                  onChangeText={setName}
                  placeholder="مثال: باقة النخبة"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>الوصف *</Text>
                <TextInput
                  style={[styles.formInput, styles.textArea]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="وصف تفصيلي للباقة..."
                  placeholderTextColor={COLORS.textMuted}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>السعر (ر.س) *</Text>
                <TextInput
                  style={styles.formInput}
                  value={price}
                  onChangeText={setPrice}
                  placeholder="مثال: 299"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="numeric"
                />
              </View>

              {/* حقول خاصة بالحصص الخاصة */}
              {category === 'private_sessions' && (
                <>
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>عدد الحصص *</Text>
                    <TextInput
                      style={styles.formInput}
                      value={sessionsCount}
                      onChangeText={setSessionsCount}
                      placeholder="مثال: 8"
                      placeholderTextColor={COLORS.textMuted}
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>مدة الصلاحية (أيام)</Text>
                    <TextInput
                      style={styles.formInput}
                      value={validityDays}
                      onChangeText={setValidityDays}
                      placeholder="مثال: 90"
                      placeholderTextColor={COLORS.textMuted}
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={styles.switchRow}>
                    <Text style={styles.switchLabel}>تتضمن الوصول للتدريب الذاتي</Text>
                    <Switch
                      value={includesSelfTraining}
                      onValueChange={setIncludesSelfTraining}
                      trackColor={{ false: COLORS.border, true: COLORS.teal }}
                    />
                  </View>
                </>
              )}

              {/* حقول خاصة بالتدريب الذاتي */}
              {category === 'self_training' && (
                <>
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>نوع الاشتراك *</Text>
                    <View style={styles.subscriptionTypes}>
                      {SUBSCRIPTION_TYPES.map((type) => (
                        <TouchableOpacity
                          key={type.id}
                          style={[
                            styles.subscriptionTypeBtn,
                            subscriptionType === type.id && styles.subscriptionTypeBtnActive
                          ]}
                          onPress={() => {
                            setSubscriptionType(type.id);
                            setDurationMonths(String(type.months));
                          }}
                        >
                          <Text style={[
                            styles.subscriptionTypeText,
                            subscriptionType === type.id && styles.subscriptionTypeTextActive
                          ]}>
                            {type.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={styles.switchRow}>
                    <Text style={styles.switchLabel}>التجديد التلقائي</Text>
                    <Switch
                      value={autoRenewal}
                      onValueChange={setAutoRenewal}
                      trackColor={{ false: COLORS.border, true: COLORS.teal }}
                    />
                  </View>
                </>
              )}

              {/* حقول إضافية */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>المميزات (سطر لكل ميزة)</Text>
                <TextInput
                  style={[styles.formInput, styles.textArea]}
                  value={features}
                  onChangeText={setFeatures}
                  placeholder="مثال:&#10;متابعة شخصية&#10;خطة تغذية&#10;دعم واتساب"
                  placeholderTextColor={COLORS.textMuted}
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>نسبة الخصم %</Text>
                  <TextInput
                    style={styles.formInput}
                    value={discountPercentage}
                    onChangeText={setDiscountPercentage}
                    placeholder="0"
                    placeholderTextColor={COLORS.textMuted}
                    keyboardType="numeric"
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1, marginRight: SPACING.md }]}>
                  <Text style={styles.formLabel}>ترتيب العرض</Text>
                  <TextInput
                    style={styles.formInput}
                    value={displayOrder}
                    onChangeText={setDisplayOrder}
                    placeholder="0"
                    placeholderTextColor={COLORS.textMuted}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>الباقة فعالة</Text>
                <Switch
                  value={isActive}
                  onValueChange={setIsActive}
                  trackColor={{ false: COLORS.border, true: COLORS.teal }}
                />
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>باقة مميزة (الأكثر شعبية)</Text>
                <Switch
                  value={isPopular}
                  onValueChange={setIsPopular}
                  trackColor={{ false: COLORS.border, true: '#FF9800' }}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={closeModal}>
                <Text style={styles.cancelBtnText}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.saveBtn} 
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color={COLORS.white} size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>
                    {editingPackage ? 'تحديث' : 'إنشاء'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  errorTitle: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: COLORS.teal,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    marginTop: SPACING.lg,
  },
  retryBtnText: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.teal,
    padding: SPACING.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.md,
    paddingBottom: 100,
  },

  statsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  statCard: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontFamily: FONTS.bold,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginTop: 4,
  },

  filterTabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: 4,
    marginBottom: SPACING.md,
  },
  filterTab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: RADIUS.sm,
  },
  filterTabActive: {
    backgroundColor: COLORS.teal,
  },
  filterTabText: {
    fontSize: 13,
    fontFamily: FONTS.semiBold,
    color: COLORS.textSecondary,
  },
  filterTabTextActive: {
    color: COLORS.white,
  },

  emptyState: {
    alignItems: 'center',
    padding: SPACING.xl,
    marginTop: SPACING.xl,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    marginTop: SPACING.md,
  },
  createBtn: {
    backgroundColor: COLORS.teal,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    marginTop: SPACING.lg,
  },
  createBtnText: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },

  packageCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  packageCardInactive: {
    opacity: 0.6,
  },
  packageBadges: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  categoryBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontFamily: FONTS.semiBold,
  },
  popularBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF3E0',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularBadgeText: {
    fontSize: 11,
    fontFamily: FONTS.semiBold,
    color: '#FF9800',
  },
  inactiveBadge: {
    backgroundColor: '#FFEBEE',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  inactiveBadgeText: {
    fontSize: 11,
    fontFamily: FONTS.semiBold,
    color: COLORS.error,
  },
  packageName: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    textAlign: 'right',
  },
  packageDesc: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'right',
  },
  packageDetails: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  packageDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  packageDetailText: {
    fontSize: 12,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
  },
  packageActions: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  editBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    backgroundColor: `${COLORS.teal}15`,
    padding: SPACING.sm,
    borderRadius: RADIUS.sm,
  },
  editBtnText: {
    fontSize: 13,
    fontFamily: FONTS.semiBold,
    color: COLORS.teal,
  },
  deleteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    backgroundColor: '#FFEBEE',
    padding: SPACING.sm,
    borderRadius: RADIUS.sm,
  },
  deleteBtnText: {
    fontSize: 13,
    fontFamily: FONTS.semiBold,
    color: COLORS.error,
  },
  deleteConfirm: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    backgroundColor: '#FFF3E0',
    borderRadius: RADIUS.md,
  },
  deleteConfirmText: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: COLORS.text,
    textAlign: 'center',
  },
  deleteConfirmActions: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
  confirmDeleteBtn: {
    flex: 1,
    backgroundColor: COLORS.error,
    padding: SPACING.sm,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
  },
  confirmDeleteBtnText: {
    fontSize: 13,
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },
  cancelDeleteBtn: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: SPACING.sm,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelDeleteBtnText: {
    fontSize: 13,
    fontFamily: FONTS.semiBold,
    color: COLORS.textSecondary,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  modalBody: {
    padding: SPACING.md,
    maxHeight: 500,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: SPACING.md,
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  formGroup: {
    marginBottom: SPACING.md,
  },
  formLabel: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
    textAlign: 'right',
  },
  formInput: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.text,
    textAlign: 'right',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  formRow: {
    flexDirection: 'row',
  },

  categorySelector: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  categoryOption: {
    flex: 1,
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.border,
    gap: SPACING.sm,
  },
  categoryOptionActive: {
    backgroundColor: COLORS.teal,
    borderColor: COLORS.teal,
  },
  categoryOptionText: {
    fontSize: 13,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
  },
  categoryOptionTextActive: {
    color: COLORS.white,
  },

  subscriptionTypes: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  subscriptionTypeBtn: {
    flex: 1,
    padding: SPACING.sm,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  subscriptionTypeBtnActive: {
    backgroundColor: '#9C27B0',
    borderColor: '#9C27B0',
  },
  subscriptionTypeText: {
    fontSize: 12,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
  },
  subscriptionTypeTextActive: {
    color: COLORS.white,
  },

  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.md,
  },
  switchLabel: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.text,
  },

  cancelBtn: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    color: COLORS.textSecondary,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: COLORS.teal,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },
});
