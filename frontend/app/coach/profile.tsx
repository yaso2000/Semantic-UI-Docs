import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFonts, Cairo_400Regular, Cairo_700Bold } from '@expo-google-fonts/cairo';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface CoachProfile {
  bio: string;
  specialties: string[];
  hourly_rate: number;
}

const SPECIALTY_OPTIONS = [
  'تطوير الذات',
  'إدارة الوقت',
  'بناء الثقة',
  'التوازن الحياتي',
  'الصحة والعافية',
  'التغذية',
  'اللياقة البدنية',
  'الصحة النفسية',
  'التأمل والاسترخاء',
  'تحقيق الأهداف',
  'العلاقات',
  'التواصل الفعال',
  'القيادة',
  'الإنتاجية',
  'إدارة الضغوط',
];

export default function CoachProfileEdit() {
  const [profile, setProfile] = useState<CoachProfile>({
    bio: '',
    specialties: [],
    hourly_rate: 50
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newSpecialty, setNewSpecialty] = useState('');
  const [showSpecialtyPicker, setShowSpecialtyPicker] = useState(false);
  const router = useRouter();

  const [fontsLoaded] = useFonts({ Cairo_400Regular, Cairo_700Bold });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userStr = await AsyncStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      
      if (user) {
        const response = await fetch(`${API_URL}/api/coaches/${user.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          setProfile({
            bio: data.bio || '',
            specialties: data.specialties || [],
            hourly_rate: data.hourly_rate || 50
          });
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile.bio.trim()) {
      Alert.alert('خطأ', 'يرجى كتابة نبذة عنك');
      return;
    }

    if (profile.specialties.length === 0) {
      Alert.alert('خطأ', 'يرجى اختيار تخصص واحد على الأقل');
      return;
    }

    setSaving(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/coach/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profile)
      });

      if (response.ok) {
        Alert.alert('نجاح', 'تم حفظ البروفايل بنجاح', [
          { text: 'حسناً', onPress: () => router.back() }
        ]);
      } else {
        Alert.alert('خطأ', 'فشل في حفظ البروفايل');
      }
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ في الاتصال');
    } finally {
      setSaving(false);
    }
  };

  const addSpecialty = (specialty: string) => {
    if (specialty && !profile.specialties.includes(specialty)) {
      setProfile({
        ...profile,
        specialties: [...profile.specialties, specialty]
      });
    }
    setNewSpecialty('');
    setShowSpecialtyPicker(false);
  };

  const removeSpecialty = (specialty: string) => {
    setProfile({
      ...profile,
      specialties: profile.specialties.filter(s => s !== specialty)
    });
  };

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF9800" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-forward" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>تعديل البروفايل</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* نبذة عني */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="person-circle" size={24} color="#FF9800" />
              <Text style={styles.sectionTitle}>نبذة عني</Text>
            </View>
            <Text style={styles.sectionDesc}>
              اكتب نبذة تعريفية عنك وعن خبراتك ليراها المتدربين
            </Text>
            <TextInput
              style={styles.textArea}
              value={profile.bio}
              onChangeText={(text) => setProfile({ ...profile, bio: text })}
              placeholder="مثال: مدرب حياة معتمد مع خبرة 5 سنوات في مساعدة الأفراد على تحقيق أهدافهم..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{profile.bio.length}/500 حرف</Text>
          </View>

          {/* التخصصات */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="ribbon" size={24} color="#4CAF50" />
              <Text style={styles.sectionTitle}>التخصصات</Text>
            </View>
            <Text style={styles.sectionDesc}>
              اختر التخصصات التي تقدمها (حد أقصى 5)
            </Text>

            <View style={styles.specialtiesList}>
              {profile.specialties.map((specialty, index) => (
                <View key={index} style={styles.specialtyTag}>
                  <Text style={styles.specialtyTagText}>{specialty}</Text>
                  <TouchableOpacity onPress={() => removeSpecialty(specialty)}>
                    <Ionicons name="close-circle" size={20} color="#4CAF50" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {profile.specialties.length < 5 && (
              <TouchableOpacity
                style={styles.addSpecialtyBtn}
                onPress={() => setShowSpecialtyPicker(!showSpecialtyPicker)}
              >
                <Ionicons name="add-circle" size={22} color="#4CAF50" />
                <Text style={styles.addSpecialtyText}>إضافة تخصص</Text>
              </TouchableOpacity>
            )}

            {showSpecialtyPicker && (
              <View style={styles.specialtyPicker}>
                <Text style={styles.pickerTitle}>اختر تخصص:</Text>
                <View style={styles.specialtyOptions}>
                  {SPECIALTY_OPTIONS.filter(s => !profile.specialties.includes(s)).map((option, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.specialtyOption}
                      onPress={() => addSpecialty(option)}
                    >
                      <Text style={styles.specialtyOptionText}>{option}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                
                <View style={styles.customSpecialty}>
                  <TextInput
                    style={styles.customSpecialtyInput}
                    value={newSpecialty}
                    onChangeText={setNewSpecialty}
                    placeholder="أو أضف تخصص مخصص..."
                    placeholderTextColor="#999"
                  />
                  <TouchableOpacity
                    style={styles.customSpecialtyBtn}
                    onPress={() => addSpecialty(newSpecialty)}
                  >
                    <Ionicons name="add" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* سعر الساعة */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="cash" size={24} color="#2196F3" />
              <Text style={styles.sectionTitle}>سعر الساعة</Text>
            </View>
            <Text style={styles.sectionDesc}>
              السعر الأساسي للساعة (يمكنك تحديد أسعار مختلفة في الباقات)
            </Text>
            <View style={styles.priceInput}>
              <Text style={styles.priceCurrency}>$</Text>
              <TextInput
                style={styles.priceValue}
                value={String(profile.hourly_rate)}
                onChangeText={(text) => setProfile({ ...profile, hourly_rate: parseInt(text) || 0 })}
                keyboardType="numeric"
                placeholder="50"
              />
              <Text style={styles.priceLabel}>/ساعة</Text>
            </View>
          </View>

          {/* زر الحفظ */}
          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            <Ionicons name="checkmark-circle" size={24} color="#fff" />
            <Text style={styles.saveBtnText}>
              {saving ? 'جاري الحفظ...' : 'حفظ البروفايل'}
            </Text>
          </TouchableOpacity>

          {/* رابط إدارة الباقات */}
          <TouchableOpacity
            style={styles.packagesLink}
            onPress={() => router.push('/coach/packages' as any)}
          >
            <Ionicons name="pricetags" size={20} color="#FF9800" />
            <Text style={styles.packagesLinkText}>إدارة الباقات</Text>
            <Ionicons name="chevron-back" size={20} color="#FF9800" />
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FF9800',
  },
  backButton: {
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
  content: { padding: 16, paddingBottom: 40 },
  
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Cairo_700Bold',
    color: '#333',
  },
  sectionDesc: {
    fontSize: 13,
    fontFamily: 'Cairo_400Regular',
    color: '#666',
    textAlign: 'right',
    marginBottom: 16,
    lineHeight: 22,
  },
  
  textArea: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    fontFamily: 'Cairo_400Regular',
    color: '#333',
    textAlign: 'right',
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  charCount: {
    fontSize: 11,
    fontFamily: 'Cairo_400Regular',
    color: '#999',
    textAlign: 'left',
    marginTop: 8,
  },
  
  specialtiesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
    justifyContent: 'flex-end',
  },
  specialtyTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  specialtyTagText: {
    fontSize: 14,
    fontFamily: 'Cairo_400Regular',
    color: '#4CAF50',
  },
  addSpecialtyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4CAF50',
    borderStyle: 'dashed',
    gap: 8,
  },
  addSpecialtyText: {
    fontSize: 14,
    fontFamily: 'Cairo_700Bold',
    color: '#4CAF50',
  },
  
  specialtyPicker: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  pickerTitle: {
    fontSize: 14,
    fontFamily: 'Cairo_700Bold',
    color: '#333',
    textAlign: 'right',
    marginBottom: 12,
  },
  specialtyOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-end',
    marginBottom: 16,
  },
  specialtyOption: {
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  specialtyOptionText: {
    fontSize: 13,
    fontFamily: 'Cairo_400Regular',
    color: '#666',
  },
  customSpecialty: {
    flexDirection: 'row',
    gap: 10,
  },
  customSpecialtyInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    fontFamily: 'Cairo_400Regular',
    color: '#333',
    textAlign: 'right',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  customSpecialtyBtn: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  priceInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  priceCurrency: {
    fontSize: 24,
    fontFamily: 'Cairo_700Bold',
    color: '#2196F3',
    marginRight: 8,
  },
  priceValue: {
    fontSize: 32,
    fontFamily: 'Cairo_700Bold',
    color: '#333',
    minWidth: 80,
    textAlign: 'center',
  },
  priceLabel: {
    fontSize: 16,
    fontFamily: 'Cairo_400Regular',
    color: '#666',
    marginLeft: 8,
  },
  
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 14,
    padding: 18,
    gap: 10,
    marginTop: 8,
  },
  saveBtnDisabled: {
    backgroundColor: '#ccc',
  },
  saveBtnText: {
    fontSize: 18,
    fontFamily: 'Cairo_700Bold',
    color: '#fff',
  },
  
  packagesLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginTop: 16,
    gap: 8,
  },
  packagesLinkText: {
    fontSize: 16,
    fontFamily: 'Cairo_700Bold',
    color: '#FF9800',
  },
});
