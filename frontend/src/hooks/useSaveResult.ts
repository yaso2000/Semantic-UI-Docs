import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface SaveResultParams {
  calculator_name: string;
  calculator_type: string;
  pillar: 'physical' | 'mental' | 'social' | 'spiritual';
  inputs: Record<string, any>;
  result_value: any;
  result_text: string;
}

export function useSaveResult() {
  const [hasSubscription, setHasSubscription] = useState(false);
  const [saving, setSaving] = useState(false);
  const [checkingSubscription, setCheckingSubscription] = useState(true);

  useEffect(() => {
    checkSubscription();
  }, []);

  const checkSubscription = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        setHasSubscription(false);
        setCheckingSubscription(false);
        return;
      }

      const response = await fetch(`${API_URL}/api/user-profile/check-subscription`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setHasSubscription(data.has_subscription);
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    } finally {
      setCheckingSubscription(false);
    }
  };

  const saveResult = async (params: SaveResultParams): Promise<boolean> => {
    if (!hasSubscription) {
      Alert.alert(
        'غير متاح',
        'حفظ النتائج متاح للمشتركين فقط. اشترك في إحدى الباقات للاستفادة من هذه الميزة.',
        [{ text: 'حسناً' }]
      );
      return false;
    }

    try {
      setSaving(true);
      const token = await AsyncStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/api/user-results/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(params)
      });

      if (response.ok) {
        Alert.alert('تم الحفظ', 'تم حفظ النتيجة في ملفك الشخصي بنجاح');
        return true;
      } else {
        const error = await response.json();
        Alert.alert('خطأ', error.detail || 'حدث خطأ أثناء الحفظ');
        return false;
      }
    } catch (error) {
      console.error('Error saving result:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء الحفظ');
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    hasSubscription,
    checkingSubscription,
    saving,
    saveResult,
    checkSubscription
  };
}
