import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFonts, Cairo_400Regular, Cairo_700Bold } from '@expo-google-fonts/cairo';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface Package {
  id: string;
  name: string;
  hours: number;
  price: number;
  description: string;
}

interface PriceSettings {
  min_hourly_rate: number;
  max_hourly_rate: number;
}

export default function CoachPackages() {
  const insets = useSafeAreaInsets();
  const [packages, setPackages] = useState<Package[]>([]);
  const [priceSettings, setPriceSettings] = useState<PriceSettings>({ min_hourly_rate: 20, max_hourly_rate: 200 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [saving, setSaving] = useState(false);
  
  const [name, setName] = useState('');
  const [hours, setHours] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [description, setDescription] = useState('');
  
  const router = useRouter();
  const [fontsLoaded] = useFonts({ Cairo_400Regular, Cairo_700Bold });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const [packagesRes, settingsRes] = await Promise.all([
        fetch(`${API_URL}/api/coach/my-packages`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/settings/price-limits`)
      ]);
      
      if (packagesRes.ok) setPackages(await packagesRes.json());
      if (settingsRes.ok) setPriceSettings(await settingsRes.json());
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const openAddModal = () => {
    setEditingPackage(null);
    setName('');
    setHours('');
    setHourlyRate('');
    setDescription('');
    setShowModal(true);
  };

  const openEditModal = (pkg: Package) => {
    setEditingPackage(pkg);
    setName(pkg.name);
    setHours(String(pkg.hours));
    setHourlyRate(String(pkg.price / pkg.hours));
    setDescription(pkg.description);
    setShowModal(true);
  };

  const validatePrice = () => {
    const rate = parseFloat(hourlyRate);
    if (rate < priceSettings.min_hourly_rate) {
      Alert.alert('خطأ', `الحد الأدنى لسعر الساعة هو $${priceSettings.min_hourly_rate}`);
      return false;
    }
    if (rate > priceSettings.max_hourly_rate) {
      Alert.alert('خطأ', `الحد الأعلى لسعر الساعة هو $${priceSettings.max_hourly_rate}`);
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!name.trim() || !hours || !hourlyRate) {
      Alert.alert('خطأ', 'يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    if (!validatePrice()) return;

    setSaving(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const totalPrice = parseFloat(hourlyRate) * parseInt(hours);
      
      const packageData = {
        name: name.trim(),
        hours: parseInt(hours),
        price: totalPrice,
        hourly_rate: parseFloat(hourlyRate),
        description: description.trim()
      };

      const url = editingPackage 
        ? `${API_URL}/api/coach/my-packages/${editingPackage.id}`
        : `${API_URL}/api/coach/my-packages`;
      
      const response = await fetch(url, {
        method: editingPackage ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(packageData)
      });

      if (response.ok) {
        Alert.alert('نجاح', editingPackage ? 'تم تحديث الباقة' : 'تم إنشاء الباقة');
        setShowModal(false);
        loadData();
      } else {
        const error = await response.json();
        Alert.alert('خطأ', error.detail || 'فشل في الحفظ');
      }
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ في الاتصال');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (pkg: Package) => {
    Alert.alert('حذف الباقة', `هل أنت متأكد من حذف "${pkg.name}"؟`, [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/coach/my-packages/${pkg.id}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
              Alert.alert('نجاح', 'تم حذف الباقة');
              loadData();
            }
          } catch (error) {
            Alert.alert('خطأ', 'فشل في الحذف');
          }
        }
      }
    ]);
  };

  const renderPackage = ({ item }: { item: Package }) => (
    <View style={styles.packageCard}>
      <View style={styles.packageHeader}>
        <View style={styles.packageIcon}>
          <Ionicons name="pricetag" size={24} color="#fff" />
        </View>
        <View style={styles.packageInfo}>
          <Text style={styles.packageName}>{item.name}</Text>
          <Text style={styles.packageHours}>{item.hours} ساعة تدريبية</Text>
        </View>
        <View style={styles.priceTag}>
          <Text style={styles.priceAmount}>${item.price}</Text>
          <Text style={styles.pricePerHour}>${(item.price / item.hours).toFixed(0)}/ساعة</Text>
        </View>
      </View>

      {item.description && (
        <Text style={styles.packageDesc}>{item.description}</Text>
      )}

      <View style={styles.packageActions}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#E3F2FD' }]}
          onPress={() => openEditModal(item)}
        >
          <Ionicons name="create" size={18} color="#2196F3" />
          <Text style={[styles.actionBtnText, { color: '#2196F3' }]}>تعديل</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#FFEBEE' }]}
          onPress={() => handleDelete(item)}
        >
          <Ionicons name="trash" size={18} color="#F44336" />
          <Text style={[styles.actionBtnText, { color: '#F44336' }]}>حذف</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF9800" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>باقاتي</Text>
      </View>

      <View style={styles.priceInfo}>
        <Ionicons name="information-circle" size={18} color="#FF9800" />
        <Text style={styles.priceInfoText}>
          سعر الساعة المسموح: ${priceSettings.min_hourly_rate} - ${priceSettings.max_hourly_rate}
        </Text>
      </View>

      <FlatList
        data={packages}
        renderItem={renderPackage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="pricetags-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>لم تنشئ أي باقات بعد</Text>
            <Text style={styles.emptySubtext}>أنشئ باقتك الأولى للمتدربين</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={openAddModal}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingPackage ? 'تعديل الباقة' : 'إنشاء باقة جديدة'}
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>اسم الباقة *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="مثال: باقة المبتدئين"
              placeholderTextColor="#999"
            />

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>عدد الساعات *</Text>
                <TextInput
                  style={styles.input}
                  value={hours}
                  onChangeText={setHours}
                  placeholder="10"
                  keyboardType="numeric"
                  placeholderTextColor="#999"
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>سعر الساعة ($) *</Text>
                <TextInput
                  style={styles.input}
                  value={hourlyRate}
                  onChangeText={setHourlyRate}
                  placeholder="30"
                  keyboardType="decimal-pad"
                  placeholderTextColor="#999"
                />
              </View>
            </View>

            {hours && hourlyRate && (
              <View style={styles.totalPrice}>
                <Text style={styles.totalPriceLabel}>السعر الإجمالي:</Text>
                <Text style={styles.totalPriceValue}>
                  ${(parseFloat(hourlyRate) * parseInt(hours)).toFixed(2)}
                </Text>
              </View>
            )}

            <Text style={styles.inputLabel}>وصف الباقة</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="وصف مفصل للباقة..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={styles.saveBtnText}>
                {saving ? 'جاري الحفظ...' : editingPackage ? 'تحديث' : 'إنشاء'}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FF9800'},
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16},
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontFamily: 'Cairo_700Bold',
    color: '#fff',
    textAlign: 'right'},
  priceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF3E0',
    padding: 10,
    gap: 8},
  priceInfoText: {
    fontSize: 13,
    fontFamily: 'Cairo_400Regular',
    color: '#E65100'},
  listContent: { padding: 16, paddingBottom: 100 },
  packageCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4},
  packageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12},
  packageIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FF9800',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12},
  packageInfo: { flex: 1 },
  packageName: {
    fontSize: 16,
    fontFamily: 'Cairo_700Bold',
    color: '#333',
    textAlign: 'right'},
  packageHours: {
    fontSize: 12,
    fontFamily: 'Cairo_400Regular',
    color: '#666',
    textAlign: 'right'},
  priceTag: { alignItems: 'center' },
  priceAmount: {
    fontSize: 20,
    fontFamily: 'Cairo_700Bold',
    color: '#4CAF50'},
  pricePerHour: {
    fontSize: 11,
    fontFamily: 'Cairo_400Regular',
    color: '#999'},
  packageDesc: {
    fontSize: 13,
    fontFamily: 'Cairo_400Regular',
    color: '#666',
    textAlign: 'right',
    marginBottom: 12,
    lineHeight: 20},
  packageActions: {
    flexDirection: 'row',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12},
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
    gap: 6},
  actionBtnText: {
    fontSize: 14,
    fontFamily: 'Cairo_700Bold'},
  emptyState: { alignItems: 'center', paddingTop: 80 },
  emptyText: {
    fontSize: 18,
    fontFamily: 'Cairo_700Bold',
    color: '#999',
    marginTop: 16},
  emptySubtext: {
    fontSize: 14,
    fontFamily: 'Cairo_400Regular',
    color: '#bbb',
    marginTop: 4},
  fab: {
    position: 'absolute',
    left: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF9800',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8},
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end'},
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '85%'},
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20},
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Cairo_700Bold',
    color: '#333'},
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Cairo_700Bold',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
    textAlign: 'right'},
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    fontFamily: 'Cairo_400Regular',
    color: '#333',
    textAlign: 'right',
    borderWidth: 1,
    borderColor: '#e0e0e0'},
  textArea: { minHeight: 80 },
  row: { flexDirection: 'row', gap: 12 },
  halfInput: { flex: 1 },
  totalPrice: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 10,
    marginTop: 12},
  totalPriceLabel: {
    fontSize: 14,
    fontFamily: 'Cairo_400Regular',
    color: '#4CAF50'},
  totalPriceValue: {
    fontSize: 20,
    fontFamily: 'Cairo_700Bold',
    color: '#4CAF50'},
  saveBtn: {
    backgroundColor: '#FF9800',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20},
  saveBtnDisabled: { backgroundColor: '#ccc' },
  saveBtnText: {
    fontSize: 16,
    fontFamily: 'Cairo_700Bold',
    color: '#fff'}});
