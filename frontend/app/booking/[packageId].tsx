import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFonts, Cairo_400Regular, Cairo_700Bold } from '@expo-google-fonts/cairo';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface Package {
  id: string;
  name: string;
  hours: number;
  price: number;
  hourly_rate: number;
  description: string;
}

interface Coach {
  id: string;
  full_name: string;
  profile_image?: string;
}

export default function BookingScreen() {
  const { packageId, coachId } = useLocalSearchParams();
  const [pkg, setPkg] = useState<Package | null>(null);
  const [coach, setCoach] = useState<Coach | null>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [notes, setNotes] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const router = useRouter();

  const [fontsLoaded] = useFonts({ Cairo_400Regular, Cairo_700Bold });

  useEffect(() => {
    loadData();
  }, [packageId, coachId]);

  const loadData = async () => {
    try {
      // Load coach info
      const coachRes = await fetch(`${API_URL}/api/coaches/${coachId}`);
      if (coachRes.ok) {
        const coachData = await coachRes.json();
        setCoach(coachData);
      }

      // Load package info
      const packagesRes = await fetch(`${API_URL}/api/coaches/${coachId}/packages`);
      if (packagesRes.ok) {
        const packages = await packagesRes.json();
        const foundPkg = packages.find((p: Package) => p.id === packageId);
        if (foundPkg) {
          setPkg(foundPkg);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async () => {
    if (!pkg || !coach) return;

    setBooking(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/bookings/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          package_id: pkg.id,
          coach_id: coach.id,
          notes: notes,
          scheduled_date: selectedDate || null,
          payment_method: 'cash' // For now, manual payment
        })
      });

      if (response.ok) {
        Alert.alert(
          'تم الحجز بنجاح! ✅',
          'تم إرسال طلب الحجز للمدرب. سيتم التواصل معك قريباً.',
          [
            { 
              text: 'عرض حجوزاتي', 
              onPress: () => router.replace('/(tabs)/bookings' as any)
            },
            {
              text: 'حسناً',
              onPress: () => router.back()
            }
          ]
        );
      } else {
        const error = await response.json();
        Alert.alert('خطأ', error.detail || 'فشل في إنشاء الحجز');
      }
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ في الاتصال');
    } finally {
      setBooking(false);
    }
  };

  const getLetterColor = (name: string): string => {
    const colors: { [key: string]: string } = {
      'ا': '#E91E63', 'أ': '#E91E63', 'م': '#00BCD4', 'ع': '#E91E63',
      'ب': '#9C27B0', 'ت': '#673AB7', 'ث': '#3F51B5', 'ج': '#2196F3',
    };
    const firstLetter = name?.trim().charAt(0) || '?';
    return colors[firstLetter] || '#FF9800';
  };

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF9800" />
      </View>
    );
  }

  if (!pkg || !coach) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorState}>
          <Ionicons name="alert-circle" size={64} color="#ccc" />
          <Text style={styles.errorText}>لم يتم العثور على الباقة</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>تأكيد الحجز</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* معلومات المدرب */}
        <View style={styles.coachCard}>
          <View style={[styles.coachAvatar, { backgroundColor: getLetterColor(coach.full_name) }]}>
            <Text style={styles.coachLetter}>
              {coach.full_name?.charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
          <View style={styles.coachInfo}>
            <Text style={styles.coachName}>{coach.full_name}</Text>
            <Text style={styles.coachLabel}>المدرب</Text>
          </View>
        </View>

        {/* تفاصيل الباقة */}
        <View style={styles.packageCard}>
          <View style={styles.packageHeader}>
            <Ionicons name="pricetag" size={24} color="#FF9800" />
            <Text style={styles.packageTitle}>{pkg.name}</Text>
          </View>
          
          <View style={styles.packageDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailValue}>{pkg.hours} ساعة</Text>
              <View style={styles.detailLabel}>
                <Text style={styles.detailLabelText}>عدد الساعات</Text>
                <Ionicons name="time" size={16} color="#666" />
              </View>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailValue}>${pkg.hourly_rate}</Text>
              <View style={styles.detailLabel}>
                <Text style={styles.detailLabelText}>سعر الساعة</Text>
                <Ionicons name="cash" size={16} color="#666" />
              </View>
            </View>
          </View>

          {pkg.description && (
            <Text style={styles.packageDesc}>{pkg.description}</Text>
          )}

          <View style={styles.totalSection}>
            <Text style={styles.totalLabel}>الإجمالي</Text>
            <Text style={styles.totalAmount}>${pkg.price}</Text>
          </View>
        </View>

        {/* ملاحظات */}
        <View style={styles.notesSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text" size={20} color="#4CAF50" />
            <Text style={styles.sectionTitle}>ملاحظات (اختياري)</Text>
          </View>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="أضف أي ملاحظات أو متطلبات خاصة..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* معلومات الدفع */}
        <View style={styles.paymentInfo}>
          <Ionicons name="information-circle" size={20} color="#2196F3" />
          <Text style={styles.paymentInfoText}>
            سيتم التواصل معك من قبل المدرب لترتيب موعد الجلسات وطريقة الدفع
          </Text>
        </View>

        {/* زر التأكيد */}
        <TouchableOpacity
          style={[styles.confirmBtn, booking && styles.confirmBtnDisabled]}
          onPress={handleBooking}
          disabled={booking}
        >
          {booking ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={24} color="#fff" />
              <Text style={styles.confirmBtnText}>تأكيد الحجز</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16, fontFamily: 'Cairo_400Regular', color: '#999', marginTop: 16 },
  
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
  
  coachCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  coachAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
  coachLetter: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
  },
  coachInfo: { flex: 1 },
  coachName: {
    fontSize: 18,
    fontFamily: 'Cairo_700Bold',
    color: '#333',
    textAlign: 'right',
  },
  coachLabel: {
    fontSize: 13,
    fontFamily: 'Cairo_400Regular',
    color: '#666',
    textAlign: 'right',
  },
  
  packageCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  packageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  packageTitle: {
    fontSize: 20,
    fontFamily: 'Cairo_700Bold',
    color: '#333',
  },
  packageDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  detailLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabelText: {
    fontSize: 14,
    fontFamily: 'Cairo_400Regular',
    color: '#666',
  },
  detailValue: {
    fontSize: 16,
    fontFamily: 'Cairo_700Bold',
    color: '#333',
  },
  packageDesc: {
    fontSize: 14,
    fontFamily: 'Cairo_400Regular',
    color: '#666',
    textAlign: 'right',
    lineHeight: 22,
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    marginHorizontal: -20,
    marginBottom: -20,
    padding: 20,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontFamily: 'Cairo_700Bold',
    color: '#FF9800',
  },
  totalAmount: {
    fontSize: 28,
    fontFamily: 'Cairo_700Bold',
    color: '#FF9800',
  },
  
  notesSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Cairo_700Bold',
    color: '#333',
  },
  notesInput: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    fontFamily: 'Cairo_400Regular',
    color: '#333',
    textAlign: 'right',
    minHeight: 80,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    gap: 10,
  },
  paymentInfoText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Cairo_400Regular',
    color: '#1976D2',
    textAlign: 'right',
    lineHeight: 22,
  },
  
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 14,
    padding: 18,
    gap: 10,
  },
  confirmBtnDisabled: {
    backgroundColor: '#ccc',
  },
  confirmBtnText: {
    fontSize: 18,
    fontFamily: 'Cairo_700Bold',
    color: '#fff',
  },
});
