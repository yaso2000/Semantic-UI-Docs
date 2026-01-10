import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  ActivityIndicator,
  Alert,
  Modal,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts, Alexandria_400Regular, Alexandria_600SemiBold, Alexandria_700Bold } from '@expo-google-fonts/alexandria';
import { COLORS, FONTS, SHADOWS, RADIUS, SPACING } from '../../src/constants/theme';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface SelfTrainingPackage {
  id: string;
  name: string;
  description: string;
  duration_months: number;
  price: number;
  price_per_month: number;
  discount_percentage: number;
  features: string[];
  is_active: boolean;
  is_popular: boolean;
  subscribers_count?: number;
}

export default function AdminSelfTrainingPackages() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [packages, setPackages] = useState<SelfTrainingPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);
  
  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPackage, setEditingPackage] = useState<SelfTrainingPackage | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [durationMonths, setDurationMonths] = useState('1');
  const [price, setPrice] = useState('');
  const [features, setFeatures] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isPopular, setIsPopular] = useState(false);

  const [fontsLoaded] = useFonts({ Alexandria_400Regular, Alexandria_600SemiBold, Alexandria_700Bold });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setError(null);
      setNeedsLogin(false);
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        setNeedsLogin(true);
        setLoading(false);
        return;
      }
      
      // جلب الباقات
      const packagesRes = await fetch(`${API_URL}/api/admin/self-training/packages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (packagesRes.ok) {
        const packagesData = await packagesRes.json();
        setPackages(packagesData);
      } else if (packagesRes.status === 401 || packagesRes.status === 403) {
        setNeedsLogin(true);
        setLoading(false);
        return;
      } else {
        setError('فشل في جلب الباقات');
      }
      
      // جلب الإحصائيات
      const statsRes = await fetch(`${API_URL}/api/admin/self-training/stats`, {
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

  const openModal = (pkg?: SelfTrainingPackage) => {
    if (pkg) {
      setEditingPackage(pkg);
      setName(pkg.name);
      setDescription(pkg.description);
      setDurationMonths(pkg.duration_months.toString());
      setPrice(pkg.price.toString());
      setFeatures(pkg.features.join('\n'));
      setIsActive(pkg.is_active);
      setIsPopular(pkg.is_popular);
    } else {
      setEditingPackage(null);
      setName('');
      setDescription('');
      setDurationMonths('1');
      setPrice('');
      setFeatures('');
      setIsActive(true);
      setIsPopular(false);
    }
    setModalVisible(true);
  };

  const savePackage = async () => {
    if (!name.trim() || !price.trim() || !durationMonths.trim()) {
      Alert.alert('خطأ', 'يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    setSaving(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const featuresArray = features.split('\n').filter(f => f.trim());
      
      const packageData = {
        name: name.trim(),
        description: description.trim(),
        duration_months: parseInt(durationMonths),
        price: parseFloat(price),
        features: featuresArray,
        is_active: isActive,
        is_popular: isPopular
      };

      const url = editingPackage 
        ? `${API_URL}/api/admin/self-training/packages/${editingPackage.id}`
        : `${API_URL}/api/admin/self-training/packages`;
      
      const response = await fetch(url, {
        method: editingPackage ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(packageData)
      });

      if (response.ok) {
        Alert.alert('نجاح', editingPackage ? 'تم تحديث الباقة' : 'تم إنشاء الباقة');
        setModalVisible(false);
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

  const deletePackage = async (pkg: SelfTrainingPackage) => {
    Alert.alert(
      'تأكيد الحذف',
      `هل أنت متأكد من حذف باقة "${pkg.name}"؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              const response = await fetch(`${API_URL}/api/admin/self-training/packages/${pkg.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
              });

              if (response.ok) {
                Alert.alert('نجاح', 'تم حذف الباقة');
                loadData();
              } else {
                const error = await response.json();
                Alert.alert('خطأ', error.detail || 'فشل في حذف الباقة');
              }
            } catch (error) {
              Alert.alert('خطأ', 'حدث خطأ في الاتصال');
            }
          }
        }
      ]
    );
  };

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.teal} />
      </View>
    );
  }

  // شاشة تسجيل الدخول المطلوب
  if (needsLogin) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.teal} />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-forward" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>إدارة باقات التدريب الذاتي</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loginRequired}>
          <Ionicons name="lock-closed" size={64} color={COLORS.teal} />
          <Text style={styles.loginTitle}>تسجيل الدخول مطلوب</Text>
          <Text style={styles.loginSubtitle}>يرجى تسجيل الدخول كأدمن للوصول لهذه الصفحة</Text>
          <TouchableOpacity style={styles.loginBtn} onPress={() => router.push('/login' as any)}>
            <Text style={styles.loginBtnText}>تسجيل الدخول</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // شاشة الخطأ
  if (error) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.teal} />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-forward" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>إدارة باقات التدريب الذاتي</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loginRequired}>
          <Ionicons name="alert-circle" size={64} color={COLORS.error} />
          <Text style={styles.loginTitle}>{error}</Text>
          <TouchableOpacity style={styles.loginBtn} onPress={loadData}>
            <Text style={styles.loginBtnText}>إعادة المحاولة</Text>
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
        <Text style={styles.headerTitle}>إدارة باقات التدريب الذاتي</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => openModal()}>
          <Ionicons name="add" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Stats Cards */}
        {stats && (
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: COLORS.teal }]}>
              <Text style={styles.statNumber}>{stats.subscriptions?.active || 0}</Text>
              <Text style={styles.statLabel}>مشترك نشط</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: COLORS.sage }]}>
              <Text style={styles.statNumber}>{stats.plans_generated || 0}</Text>
              <Text style={styles.statLabel}>خطة مولدة</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: COLORS.gold }]}>
              <Text style={styles.statNumber}>{stats.total_revenue || 0}</Text>
              <Text style={styles.statLabel}>إجمالي الإيرادات</Text>
            </View>
          </View>
        )}

        {/* Packages List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>الباقات ({packages.length})</Text>
          
          {packages.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="cube-outline" size={64} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>لا توجد باقات بعد</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => openModal()}>
                <Text style={styles.emptyBtnText}>إنشاء باقة جديدة</Text>
              </TouchableOpacity>
            </View>
          ) : (
            packages.map((pkg) => (
              <View key={pkg.id} style={[styles.packageCard, !pkg.is_active && styles.inactiveCard]}>
                <View style={styles.packageHeader}>
                  <View style={styles.packageTitleRow}>
                    <Text style={styles.packageName}>{pkg.name}</Text>
                    {pkg.is_popular && (
                      <View style={styles.popularBadge}>
                        <Ionicons name="star" size={12} color={COLORS.white} />
                        <Text style={styles.popularText}>الأكثر شعبية</Text>
                      </View>
                    )}
                    {!pkg.is_active && (
                      <View style={styles.inactiveBadge}>
                        <Text style={styles.inactiveText}>غير نشطة</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.packageDesc}>{pkg.description}</Text>
                </View>

                <View style={styles.packagePricing}>
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>السعر الإجمالي</Text>
                    <Text style={styles.priceValue}>{pkg.price} ر.س</Text>
                  </View>
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>السعر الشهري</Text>
                    <Text style={styles.priceMonthly}>{pkg.price_per_month} ر.س/شهر</Text>
                  </View>
                  {pkg.discount_percentage > 0 && (
                    <View style={styles.discountBadge}>
                      <Text style={styles.discountText}>خصم {pkg.discount_percentage}%</Text>
                    </View>
                  )}
                </View>

                <View style={styles.packageMeta}>
                  <View style={styles.metaItem}>
                    <Ionicons name="calendar" size={16} color={COLORS.textMuted} />
                    <Text style={styles.metaText}>{pkg.duration_months} شهر</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="people" size={16} color={COLORS.textMuted} />
                    <Text style={styles.metaText}>{pkg.subscribers_count || 0} مشترك</Text>
                  </View>
                </View>

                {pkg.features.length > 0 && (
                  <View style={styles.featuresList}>
                    {pkg.features.slice(0, 3).map((feature, idx) => (
                      <View key={idx} style={styles.featureItem}>
                        <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
                        <Text style={styles.featureText}>{feature}</Text>
                      </View>
                    ))}
                    {pkg.features.length > 3 && (
                      <Text style={styles.moreFeatures}>+{pkg.features.length - 3} مميزات أخرى</Text>
                    )}
                  </View>
                )}

                <View style={styles.packageActions}>
                  <TouchableOpacity style={styles.editBtn} onPress={() => openModal(pkg)}>
                    <Ionicons name="create-outline" size={18} color={COLORS.teal} />
                    <Text style={styles.editBtnText}>تعديل</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => deletePackage(pkg)}>
                    <Ionicons name="trash-outline" size={18} color={COLORS.error} />
                    <Text style={styles.deleteBtnText}>حذف</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingPackage ? 'تعديل الباقة' : 'إنشاء باقة جديدة'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <Text style={styles.inputLabel}>اسم الباقة *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="مثال: الباقة الشهرية"
                placeholderTextColor={COLORS.textMuted}
              />

              <Text style={styles.inputLabel}>الوصف</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="وصف مختصر للباقة"
                placeholderTextColor={COLORS.textMuted}
                multiline
                numberOfLines={3}
              />

              <View style={styles.inputRow}>
                <View style={styles.inputHalf}>
                  <Text style={styles.inputLabel}>المدة (شهور) *</Text>
                  <TextInput
                    style={styles.input}
                    value={durationMonths}
                    onChangeText={setDurationMonths}
                    placeholder="1"
                    placeholderTextColor={COLORS.textMuted}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.inputHalf}>
                  <Text style={styles.inputLabel}>السعر (ر.س) *</Text>
                  <TextInput
                    style={styles.input}
                    value={price}
                    onChangeText={setPrice}
                    placeholder="99"
                    placeholderTextColor={COLORS.textMuted}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>المميزات (كل سطر ميزة)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={features}
                onChangeText={setFeatures}
                placeholder="خطة تدريب مخصصة\nخطة تغذية شاملة\nدعم مستمر"
                placeholderTextColor={COLORS.textMuted}
                multiline
                numberOfLines={5}
              />

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>الباقة نشطة</Text>
                <Switch
                  value={isActive}
                  onValueChange={setIsActive}
                  trackColor={{ false: COLORS.border, true: COLORS.teal }}
                />
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>الأكثر شعبية (تمييز)</Text>
                <Switch
                  value={isPopular}
                  onValueChange={setIsPopular}
                  trackColor={{ false: COLORS.border, true: COLORS.gold }}
                />
              </View>
            </ScrollView>

            <TouchableOpacity 
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]} 
              onPress={savePackage}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.saveBtnText}>
                  {editingPackage ? 'حفظ التعديلات' : 'إنشاء الباقة'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
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

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    backgroundColor: COLORS.teal,
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
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  statCard: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    color: COLORS.white,
    opacity: 0.9,
    marginTop: 4,
  },

  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.md,
    textAlign: 'right',
  },

  emptyState: {
    alignItems: 'center',
    padding: SPACING.xl,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    marginTop: SPACING.md,
  },
  emptyBtn: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.teal,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  emptyBtnText: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    color: COLORS.white,
  },

  packageCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  inactiveCard: {
    opacity: 0.6,
  },
  packageHeader: {
    marginBottom: SPACING.md,
  },
  packageTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: SPACING.sm,
    flexWrap: 'wrap',
  },
  packageName: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  popularBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gold,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  popularText: {
    fontSize: 10,
    fontFamily: FONTS.semiBold,
    color: COLORS.white,
  },
  inactiveBadge: {
    backgroundColor: COLORS.textMuted,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  inactiveText: {
    fontSize: 10,
    fontFamily: FONTS.semiBold,
    color: COLORS.white,
  },
  packageDesc: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'right',
    marginTop: 4,
  },

  packagePricing: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  priceLabel: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  priceValue: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.teal,
  },
  priceMonthly: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
  },
  discountBadge: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 4,
  },
  discountText: {
    fontSize: 11,
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },

  packageMeta: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.md,
    marginBottom: SPACING.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
  },

  featuresList: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    marginBottom: 4,
  },
  featureText: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  moreFeatures: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    color: COLORS.teal,
    textAlign: 'right',
    marginTop: 4,
  },

  packageActions: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.sm,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editBtnText: {
    fontSize: 13,
    fontFamily: FONTS.semiBold,
    color: COLORS.teal,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  deleteBtnText: {
    fontSize: 13,
    fontFamily: FONTS.semiBold,
    color: COLORS.error,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  modalForm: {
    padding: SPACING.md,
    maxHeight: 450,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
    marginBottom: 6,
    textAlign: 'right',
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: 15,
    fontFamily: FONTS.regular,
    color: COLORS.text,
    textAlign: 'right',
    marginBottom: SPACING.md,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  inputHalf: {
    flex: 1,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  switchLabel: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.text,
  },
  saveBtn: {
    backgroundColor: COLORS.teal,
    margin: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },
});
