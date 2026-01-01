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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFonts, Cairo_400Regular, Cairo_700Bold } from '@expo-google-fonts/cairo';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function PackageForm() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [name, setName] = useState('');
  const [hours, setHours] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');

  const [fontsLoaded] = useFonts({ Cairo_400Regular, Cairo_700Bold });

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
      Alert.alert('خطأ', 'يرجى ملء جميع الحقول المطلوبة');
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
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(packageData),
        });
      } else {
        response = await fetch(`${API_URL}/api/packages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(packageData),
        });
      }

      if (response.ok) {
        Alert.alert(
          'نجاح',
          isEditing ? 'تم تحديث الباقة بنجاح' : 'تم إنشاء الباقة بنجاح',
          [{ text: 'حسناً', onPress: () => router.back() }]
        );
      } else {
        const error = await response.json();
        Alert.alert('خطأ', error.detail || 'حدث خطأ أثناء الحفظ');
      }
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-forward" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {isEditing ? 'تعديل الباقة' : 'إضافة باقة جديدة'}
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>اسم الباقة *</Text>
              <TextInput
                style={styles.input}
                placeholder="مثال: باقة المبتدئين"
                placeholderTextColor="#999"
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
                  placeholderTextColor="#999"
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
                  placeholderTextColor="#999"
                  keyboardType="decimal-pad"
                  value={price}
                  onChangeText={setPrice}
                />
              </View>
            </View>

            {hours && price && (
              <View style={styles.pricePerHour}>
                <Ionicons name="calculator" size={20} color="#4CAF50" />
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
                placeholderTextColor="#999"
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
                    <Ionicons name="fitness" size={24} color="#fff" />
                  </View>
                  <View style={styles.previewInfo}>
                    <Text style={styles.previewName}>{name || 'اسم الباقة'}</Text>
                    <Text style={styles.previewHours}>
                      {hours || '0'} ساعة تدريبية
                    </Text>
                  </View>
                  <Text style={styles.previewPrice}>${price || '0'}</Text>
                </View>
                {description && (
                  <Text style={styles.previewDescription}>{description}</Text>
                )}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
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
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginLeft: 16,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontFamily: 'Cairo_700Bold',
    color: '#333',
    textAlign: 'right',
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Cairo_700Bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'right',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Cairo_400Regular',
    color: '#333',
    textAlign: 'right',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 16,
  },
  row: {
    flexDirection: 'row',
  },
  pricePerHour: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    gap: 8,
  },
  pricePerHourText: {
    fontSize: 14,
    fontFamily: 'Cairo_700Bold',
    color: '#4CAF50',
  },
  previewCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  previewTitle: {
    fontSize: 14,
    fontFamily: 'Cairo_700Bold',
    color: '#999',
    marginBottom: 12,
    textAlign: 'center',
  },
  previewContent: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  previewInfo: {
    flex: 1,
  },
  previewName: {
    fontSize: 16,
    fontFamily: 'Cairo_700Bold',
    color: '#333',
    textAlign: 'right',
  },
  previewHours: {
    fontSize: 12,
    fontFamily: 'Cairo_400Regular',
    color: '#666',
    textAlign: 'right',
  },
  previewPrice: {
    fontSize: 20,
    fontFamily: 'Cairo_700Bold',
    color: '#4CAF50',
  },
  previewDescription: {
    fontSize: 14,
    fontFamily: 'Cairo_400Regular',
    color: '#666',
    marginTop: 12,
    textAlign: 'right',
    lineHeight: 22,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    fontSize: 18,
    fontFamily: 'Cairo_700Bold',
    color: '#fff',
  },
});
