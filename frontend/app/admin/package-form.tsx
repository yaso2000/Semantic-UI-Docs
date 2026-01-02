import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFonts, Alexandria_400Regular, Alexandria_600SemiBold, Alexandria_700Bold } from '@expo-google-fonts/alexandria';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, FONTS } from '../../src/constants/theme';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

const showAlert = (title: string, message: string, buttons?: any[]) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
    if (buttons && buttons[0]?.onPress) buttons[0].onPress();
  } else {
    Alert.alert(title, message, buttons);
  }
};

export default function PackageForm() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [hours, setHours] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');

  const [fontsLoaded] = useFonts({ Alexandria_400Regular, Alexandria_600SemiBold, Alexandria_700Bold });

  useEffect(() => {
    if (params.packageData) {
      try {
        const pkg = JSON.parse(params.packageData as string);
        setIsEditing(true);
        setName(pkg.name || '');
        setHours(String(pkg.hours || ''));
        setPrice(String(pkg.price || ''));
        setDescription(pkg.description || '');
      } catch (e) {
        console.error('Error parsing package data:', e);
      }
    }
  }, [params.packageData]);

  const handleSubmit = async () => {
    if (!name.trim() || !hours || !price) {
      showAlert('خطأ', 'يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const packageData = {
        name: name.trim(),
        hours: parseInt(hours),
        price: parseFloat(price),
        description: description.trim(),
        active: true,
      };

      let response;
      if (isEditing && params.packageData) {
        const pkg = JSON.parse(params.packageData as string);
        response = await fetch(`${API_URL}/api/packages/${pkg.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(packageData),
        });
      } else {
        response = await fetch(`${API_URL}/api/packages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(packageData),
        });
      }

      if (response.ok) {
        showAlert('نجاح', isEditing ? 'تم تحديث الباقة بنجاح' : 'تم إنشاء الباقة بنجاح', [{ text: 'حسناً', onPress: () => router.back() }]);
      } else {
        const error = await response.json();
        showAlert('خطأ', error.detail || 'حدث خطأ أثناء الحفظ');
      }
    } catch (error) {
      showAlert('خطأ', 'حدث خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  if (!fontsLoaded) return null;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-forward" size={24} color={COLORS.gold} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{isEditing ? 'تعديل الباقة' : 'إضافة باقة جديدة'}</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>اسم الباقة *</Text>
              <TextInput
                style={styles.input}
                placeholder="مثال: باقة المبتدئين"
                placeholderTextColor={COLORS.textMuted}
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>عدد الساعات *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="10"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="numeric"
                  value={hours}
                  onChangeText={setHours}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
                <Text style={styles.label}>السعر ($) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="100"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="decimal-pad"
                  value={price}
                  onChangeText={setPrice}
                />
              </View>
            </View>

            {hours && price && (
              <View style={styles.pricePerHour}>
                <Ionicons name="calculator" size={20} color={COLORS.gold} />
                <Text style={styles.pricePerHourText}>
                  ${(parseFloat(price) / parseInt(hours)).toFixed(2)} للساعة الواحدة
                </Text>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>وصف الباقة</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="وصف مفصل للباقة والخدمات المقدمة..."
                placeholderTextColor={COLORS.textMuted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                value={description}
                onChangeText={setDescription}
              />
            </View>

            <View style={styles.previewCard}>
              <Text style={styles.previewTitle}>معاينة الباقة</Text>
              <View style={styles.previewContent}>
                <View style={styles.previewHeader}>
                  <View style={styles.previewIcon}>
                    <Ionicons name="fitness" size={24} color={COLORS.primary} />
                  </View>
                  <View style={styles.previewInfo}>
                    <Text style={styles.previewName}>{name || 'اسم الباقة'}</Text>
                    <Text style={styles.previewHours}>{hours || '0'} ساعة تدريبية</Text>
                  </View>
                  <Text style={styles.previewPrice}>${price || '0'}</Text>
                </View>
                {description && <Text style={styles.previewDescription}>{description}</Text>}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Ionicons name={isEditing ? 'checkmark' : 'add-circle'} size={22} color={COLORS.primary} />
              <Text style={styles.submitButtonText}>
                {loading ? 'جاري الحفظ...' : isEditing ? 'تحديث الباقة' : 'إنشاء الباقة'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  form: { padding: 20 },
  inputGroup: { marginBottom: 18 },
  label: { fontSize: 14, fontFamily: FONTS.bold, color: COLORS.text, marginBottom: 8, textAlign: 'right' },
  input: {
    backgroundColor: COLORS.secondary, borderRadius: 12, padding: 14,
    fontSize: 16, fontFamily: FONTS.regular, color: COLORS.text, textAlign: 'right',
    borderWidth: 1, borderColor: COLORS.border,
  },
  textArea: { minHeight: 100, paddingTop: 14 },
  row: { flexDirection: 'row' },
  pricePerHour: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end',
    backgroundColor: 'rgba(212, 175, 55, 0.15)', padding: 12, borderRadius: 10, marginBottom: 18, gap: 8,
    borderWidth: 1, borderColor: COLORS.gold,
  },
  pricePerHourText: { fontSize: 14, fontFamily: FONTS.bold, color: COLORS.gold },
  previewCard: {
    backgroundColor: COLORS.secondary, borderRadius: 16, padding: 16, marginBottom: 20,
    borderWidth: 2, borderColor: COLORS.border, borderStyle: 'dashed',
  },
  previewTitle: { fontSize: 14, fontFamily: FONTS.semiBold, color: COLORS.textMuted, marginBottom: 12, textAlign: 'center' },
  previewContent: { backgroundColor: COLORS.primary, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: COLORS.border },
  previewHeader: { flexDirection: 'row', alignItems: 'center' },
  previewIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.gold, justifyContent: 'center', alignItems: 'center', marginLeft: 12 },
  previewInfo: { flex: 1 },
  previewName: { fontSize: 16, fontFamily: FONTS.bold, color: COLORS.text, textAlign: 'right' },
  previewHours: { fontSize: 12, fontFamily: FONTS.regular, color: COLORS.textMuted, textAlign: 'right' },
  previewPrice: { fontSize: 20, fontFamily: FONTS.bold, color: COLORS.gold },
  previewDescription: { fontSize: 14, fontFamily: FONTS.regular, color: COLORS.textMuted, marginTop: 12, textAlign: 'right', lineHeight: 22, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 12 },
  submitButton: { flexDirection: 'row', backgroundColor: COLORS.gold, borderRadius: 12, padding: 16, alignItems: 'center', justifyContent: 'center', gap: 8 },
  submitButtonDisabled: { opacity: 0.7 },
  submitButtonText: { fontSize: 18, fontFamily: FONTS.bold, color: COLORS.primary },
});
