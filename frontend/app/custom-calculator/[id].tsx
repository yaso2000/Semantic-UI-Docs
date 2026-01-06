import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { useFonts, Alexandria_400Regular, Alexandria_600SemiBold, Alexandria_700Bold } from '@expo-google-fonts/alexandria';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../src/constants/theme';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface CustomCalculator {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  html_content: string;
}

// تحويل category لـ pillar
const categoryToPillar = (category: string): string => {
  const mapping: { [key: string]: string } = {
    'physical': 'physical',
    'nutritional': 'physical',
    'mental': 'mental',
    'spiritual': 'spiritual',
  };
  return mapping[category] || 'physical';
};

export default function CustomCalculatorScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  const [calculator, setCalculator] = useState<CustomCalculator | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const router = useRouter();
  const webViewRef = useRef<WebView>(null);

  const [fontsLoaded] = useFonts({ Alexandria_400Regular, Alexandria_600SemiBold, Alexandria_700Bold });

  useEffect(() => {
    loadCalculator();
    checkSubscription();
  }, [id]);

  const loadCalculator = async () => {
    try {
      const response = await fetch(`${API_URL}/api/custom-calculators/${id}`);
      if (response.ok) {
        const data = await response.json();
        setCalculator(data);
      } else {
        setError('الحاسبة غير موجودة');
      }
    } catch (err) {
      setError('حدث خطأ في التحميل');
    } finally {
      setLoading(false);
    }
  };

  const checkSubscription = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;
      
      const response = await fetch(`${API_URL}/api/user-profile/check-subscription`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setHasSubscription(data.has_subscription);
      }
    } catch (err) {
      console.error('Error checking subscription:', err);
    }
  };

  // معالجة الرسائل من WebView
  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === 'SAVE_RESULT') {
        // تخزين النتيجة لحفظها لاحقاً
        setLastResult({
          resultValue: data.resultValue,
          resultText: data.resultText,
          inputs: data.inputs || {}
        });
      }
    } catch (err) {
      console.error('Error parsing WebView message:', err);
    }
  };

  // حفظ النتيجة
  const saveResult = async () => {
    if (!calculator || !lastResult) {
      Alert.alert('تنبيه', 'لا توجد نتيجة لحفظها. قم بحساب النتيجة أولاً.');
      return;
    }

    if (!hasSubscription) {
      Alert.alert(
        'ميزة المشتركين',
        'هذه الميزة متاحة للمشتركين فقط. قم بحجز باقة للاستفادة من حفظ النتائج.',
        [
          { text: 'إلغاء', style: 'cancel' },
          { text: 'عرض الباقات', onPress: () => router.push('/(tabs)/bookings' as any) }
        ]
      );
      return;
    }

    setSaving(true);
    try {
      const token = await AsyncStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/api/user-results/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          calculator_name: calculator.title,
          calculator_type: `custom_${calculator.id}`,
          pillar: categoryToPillar(calculator.category),
          inputs: lastResult.inputs,
          result_value: lastResult.resultValue,
          result_text: lastResult.resultText
        })
      });

      if (response.ok) {
        Alert.alert('تم الحفظ', 'تم حفظ النتيجة في ملفك الشخصي بنجاح ✓');
      } else {
        const errorData = await response.json();
        Alert.alert('خطأ', errorData.detail || 'فشل في حفظ النتيجة');
      }
    } catch (err) {
      Alert.alert('خطأ', 'حدث خطأ في الاتصال');
    } finally {
      setSaving(false);
    }
  };

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <ActivityIndicator size="large" color={COLORS.teal} />
      </View>
    );
  }

  if (error || !calculator) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-forward" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>خطأ</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={COLORS.error} />
          <Text style={styles.errorText}>{error || 'الحاسبة غير موجودة'}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => router.back()}>
            <Text style={styles.retryBtnText}>العودة</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // إضافة JavaScript للتواصل مع التطبيق
  const injectedJavaScript = `
    (function() {
      // دالة لإرسال النتيجة للتطبيق
      window.saveToApp = function(resultValue, resultText, inputs) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'SAVE_RESULT',
          resultValue: resultValue,
          resultText: resultText,
          inputs: inputs || {}
        }));
      };
      
      // إضافة زر الحفظ تلقائياً للنتائج
      function addSaveButton() {
        const resultElements = document.querySelectorAll('.result, #result, [class*="result"]');
        resultElements.forEach(function(el) {
          if (!el.querySelector('.app-save-btn')) {
            // إنشاء زر الحفظ
            const saveBtn = document.createElement('button');
            saveBtn.className = 'app-save-btn';
            saveBtn.innerHTML = '💾 حفظ النتيجة';
            saveBtn.style.cssText = 'margin-top:15px;width:100%;padding:12px;background:#2A7B7B;color:white;border:none;border-radius:10px;font-size:14px;font-weight:bold;cursor:pointer;font-family:Alexandria,sans-serif;';
            saveBtn.onclick = function() {
              // استخراج النتيجة من العنصر
              const resultNumber = el.querySelector('.result-number, [class*="result-number"], [class*="value"]');
              const resultLabel = el.querySelector('.result-label, [class*="label"], [class*="category"]');
              
              const value = resultNumber ? resultNumber.textContent : el.textContent.substring(0, 50);
              const text = resultLabel ? resultLabel.textContent : 'نتيجة الحاسبة';
              
              window.saveToApp(value, text, {});
              
              // تغيير شكل الزر للتأكيد
              saveBtn.innerHTML = '✓ تم إرسال النتيجة';
              saveBtn.style.background = '#00B894';
              setTimeout(function() {
                saveBtn.innerHTML = '💾 حفظ النتيجة';
                saveBtn.style.background = '#2A7B7B';
              }, 2000);
            };
            el.appendChild(saveBtn);
          }
        });
      }
      
      // مراقبة التغييرات في DOM لإضافة زر الحفظ عند ظهور النتيجة
      const observer = new MutationObserver(function(mutations) {
        addSaveButton();
      });
      
      observer.observe(document.body, { childList: true, subtree: true, attributes: true });
      
      // محاولة إضافة الزر مباشرة
      setTimeout(addSaveButton, 1000);
      setTimeout(addSaveButton, 3000);
    })();
    true;
  `;

  // Inject fonts and RTL support with save functionality
  const htmlWithStyles = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <link href="https://fonts.googleapis.com/css2?family=Alexandria:wght@300;400;500;600;700&display=swap" rel="stylesheet">
      <style>
        * { font-family: 'Alexandria', sans-serif !important; }
        body { margin: 0; padding: 0; }
        .app-save-btn:hover { opacity: 0.9; }
        .app-save-btn:active { transform: scale(0.98); }
      </style>
    </head>
    <body>
      ${calculator.html_content}
    </body>
    </html>
  `;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{calculator.title}</Text>
        
        {/* زر الحفظ في الهيدر */}
        <TouchableOpacity 
          style={[styles.saveBtn, !lastResult && styles.saveBtnDisabled]}
          onPress={saveResult}
          disabled={saving || !lastResult}
        >
          {saving ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Ionicons 
              name={lastResult ? "bookmark" : "bookmark-outline"} 
              size={22} 
              color={COLORS.white} 
            />
          )}
        </TouchableOpacity>
      </View>

      {/* معلومات الحفظ */}
      {lastResult && (
        <View style={styles.saveHint}>
          <Ionicons name="information-circle" size={16} color={COLORS.teal} />
          <Text style={styles.saveHintText}>
            {hasSubscription 
              ? 'اضغط على أيقونة الحفظ لحفظ النتيجة' 
              : 'اشترك لحفظ النتائج في ملفك'}
          </Text>
        </View>
      )}

      {/* WebView for Calculator */}
      {Platform.OS === 'web' ? (
        <iframe
          srcDoc={htmlWithStyles}
          style={{ flex: 1, border: 'none', width: '100%', height: '100%' }}
        />
      ) : (
        <WebView
          ref={webViewRef}
          source={{ html: htmlWithStyles }}
          style={styles.webview}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          injectedJavaScript={injectedJavaScript}
          onMessage={handleMessage}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.webviewLoading}>
              <ActivityIndicator size="large" color={COLORS.teal} />
            </View>
          )}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.warn('WebView error:', nativeEvent);
          }}
        />
      )}
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
    padding: SPACING.md,
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.teal,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.md,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.white,
    textAlign: 'right',
  },
  saveBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },

  saveHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${COLORS.teal}15`,
    paddingVertical: 8,
    gap: 6,
  },
  saveHintText: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.teal,
  },

  webview: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  webviewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
  errorText: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.teal,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  retryBtnText: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },
});
