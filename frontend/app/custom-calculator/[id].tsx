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
  const [resultSaved, setResultSaved] = useState(false); // تتبع حالة الحفظ
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

  // معالجة الرسائل من WebView (للموبايل)
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
        // حفظ النتيجة مباشرة
        saveResultDirectly(data.resultValue, data.resultText, data.inputs || {});
      }
    } catch (err) {
      console.error('Error parsing WebView message:', err);
    }
  };

  // معالجة الرسائل من iframe (للويب)
  useEffect(() => {
    const handleIframeMessage = (event: MessageEvent) => {
      try {
        if (event.data && event.data.type === 'SAVE_RESULT') {
          console.log('Received save result from iframe:', event.data);
          setLastResult({
            resultValue: event.data.resultValue,
            resultText: event.data.resultText,
            inputs: event.data.inputs || {}
          });
          // حفظ النتيجة مباشرة
          saveResultDirectly(event.data.resultValue, event.data.resultText, event.data.inputs || {});
        }
      } catch (err) {
        console.error('Error handling iframe message:', err);
      }
    };

    if (Platform.OS === 'web') {
      window.addEventListener('message', handleIframeMessage);
      return () => window.removeEventListener('message', handleIframeMessage);
    }
  }, [calculator, hasSubscription]);

  // حفظ النتيجة مباشرة بدون انتظار زر الهيدر
  const saveResultDirectly = async (resultValue: string, resultText: string, inputs: any) => {
    if (!calculator) return;
    
    // السماح للأدمن بالحفظ دائماً، أو التحقق من الاشتراك للمستخدمين العاديين
    const userData = await AsyncStorage.getItem('user');
    const user = userData ? JSON.parse(userData) : null;
    const isAdmin = user?.role === 'admin' || user?.role === 'coach';
    
    if (!hasSubscription && !isAdmin) {
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
          inputs: inputs,
          result_value: resultValue,
          result_text: resultText
        })
      });

      if (response.ok) {
        Alert.alert('✅ تم الحفظ', 'تم حفظ النتيجة في ملفك الشخصي بنجاح!');
      } else {
        const errorData = await response.json();
        Alert.alert('خطأ', errorData.detail || 'فشل في حفظ النتيجة');
      }
    } catch (err) {
      console.error('Error saving result:', err);
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
      
      // إضافة زر الحفظ للنتائج
      function addSaveButton() {
        // البحث عن عناصر النتيجة المختلفة
        const selectors = [
          '#result',
          '.result',
          '.result-box',
          '[class*="result"]',
          '#vo2-value',
          '.result-value'
        ];
        
        let resultElement = null;
        for (const selector of selectors) {
          const el = document.querySelector(selector);
          if (el && el.offsetParent !== null) { // التأكد من أن العنصر مرئي
            resultElement = el;
            break;
          }
        }
        
        if (!resultElement) return;
        
        // التحقق من وجود زر الحفظ مسبقاً
        if (document.querySelector('.app-save-btn')) return;
        
        // البحث عن أفضل مكان لإضافة الزر
        let targetContainer = resultElement;
        if (resultElement.classList.contains('result-value') || resultElement.id === 'vo2-value') {
          targetContainer = resultElement.closest('.result-box') || resultElement.parentElement || resultElement;
        }
        
        // إنشاء زر الحفظ
        const saveBtn = document.createElement('button');
        saveBtn.className = 'app-save-btn';
        saveBtn.innerHTML = '💾 حفظ النتيجة في ملفي الشخصي';
        saveBtn.style.cssText = 'margin-top:20px;width:100%;padding:14px;background:linear-gradient(135deg, #2A7B7B, #1D5A5A);color:white;border:none;border-radius:12px;font-size:15px;font-weight:bold;cursor:pointer;font-family:Cairo,Alexandria,sans-serif;box-shadow:0 4px 15px rgba(42,123,123,0.3);';
        
        saveBtn.onclick = function() {
          // استخراج النتيجة
          const valueEl = document.querySelector('#vo2-value, .result-value, .result-number');
          const ratingEl = document.querySelector('#vo2-rating, .result-rating, .result-label');
          
          const value = valueEl ? valueEl.textContent.trim() : targetContainer.textContent.substring(0, 50).trim();
          const text = ratingEl ? ratingEl.textContent.trim() : 'نتيجة الحاسبة';
          
          // جمع المدخلات إن وجدت
          const inputs = {};
          document.querySelectorAll('input, select').forEach(function(input) {
            if (input.id || input.name) {
              inputs[input.id || input.name] = input.value;
            }
          });
          
          window.saveToApp(value, text, inputs);
          
          // تغيير شكل الزر للتأكيد
          saveBtn.innerHTML = '✅ تم إرسال النتيجة للتطبيق!';
          saveBtn.style.background = 'linear-gradient(135deg, #00B894, #00A884)';
          setTimeout(function() {
            saveBtn.innerHTML = '💾 حفظ النتيجة في ملفي الشخصي';
            saveBtn.style.background = 'linear-gradient(135deg, #2A7B7B, #1D5A5A)';
          }, 2500);
        };
        
        targetContainer.appendChild(saveBtn);
      }
      
      // مراقبة التغييرات في DOM لإضافة زر الحفظ عند ظهور النتيجة
      const observer = new MutationObserver(function(mutations) {
        // التحقق من أن النتيجة أصبحت مرئية
        const resultEl = document.querySelector('#result, .result-box');
        if (resultEl && resultEl.style.display !== 'none' && resultEl.offsetParent !== null) {
          setTimeout(addSaveButton, 100);
        }
      });
      
      observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class'] });
      
      // محاولة إضافة الزر بشكل دوري
      setInterval(function() {
        const resultEl = document.querySelector('#result, .result-box');
        if (resultEl && resultEl.style.display !== 'none' && resultEl.offsetParent !== null) {
          addSaveButton();
        }
      }, 1000);
    })();
    true;
  `;

  // Script to add save button - works for both Web and Mobile
  const saveButtonScript = `
    <script>
      // تنفيذ فوري للسكريبت
      (function initSaveButton() {
        console.log('Save button script loaded');
        
        // دالة لإرسال النتيجة
        window.saveResultToApp = function(resultValue, resultText, inputs) {
          console.log('Saving result:', resultValue, resultText);
          try {
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'SAVE_RESULT',
                resultValue: resultValue,
                resultText: resultText,
                inputs: inputs || {}
              }));
            } else {
              window.parent.postMessage({
                type: 'SAVE_RESULT',
                resultValue: resultValue,
                resultText: resultText,
                inputs: inputs || {}
              }, '*');
            }
            alert('✅ تم إرسال النتيجة! اضغط على أيقونة الحفظ 💾 في أعلى الشاشة لحفظها.');
          } catch(e) {
            console.error('Save error:', e);
          }
        };
        
        function addSaveButton() {
          console.log('Checking for result element...');
          
          // قائمة محددات للبحث عن النتيجة
          var resultEl = document.getElementById('result');
          if (!resultEl) resultEl = document.querySelector('.result-box');
          if (!resultEl) resultEl = document.querySelector('.result');
          if (!resultEl) resultEl = document.querySelector('[class*="result"]');
          
          if (!resultEl) {
            console.log('No result element found');
            return false;
          }
          
          // التحقق من أن العنصر مرئي
          var style = window.getComputedStyle(resultEl);
          if (style.display === 'none' || style.visibility === 'hidden') {
            console.log('Result element is hidden');
            return false;
          }
          
          // التحقق من عدم وجود زر مسبق
          if (document.querySelector('.app-save-btn')) {
            console.log('Save button already exists');
            return true;
          }
          
          console.log('Adding save button to:', resultEl.id || resultEl.className);
          
          // إنشاء الزر
          var saveBtn = document.createElement('button');
          saveBtn.className = 'app-save-btn';
          saveBtn.type = 'button';
          saveBtn.innerHTML = '💾 حفظ النتيجة في ملفي الشخصي';
          saveBtn.style.cssText = 'display:block;margin:20px auto 10px;width:90%;max-width:350px;padding:16px 24px;background:linear-gradient(135deg, #2A7B7B 0%, #1D5A5A 100%);color:white;border:none;border-radius:12px;font-size:16px;font-weight:bold;cursor:pointer;font-family:Cairo,Alexandria,Tahoma,sans-serif;box-shadow:0 4px 15px rgba(42,123,123,0.4);transition:all 0.3s ease;';
          
          saveBtn.onmouseover = function() {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 6px 20px rgba(42,123,123,0.5)';
          };
          saveBtn.onmouseout = function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 4px 15px rgba(42,123,123,0.4)';
          };
          
          saveBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            var valueEl = document.getElementById('vo2-value') || document.querySelector('.result-value') || document.querySelector('.result-number');
            var ratingEl = document.getElementById('vo2-rating') || document.querySelector('.result-rating') || document.querySelector('.result-label');
            
            var value = valueEl ? valueEl.textContent.trim() : '0';
            var text = ratingEl ? ratingEl.textContent.trim() : 'نتيجة الحاسبة';
            
            var inputs = {};
            var allInputs = document.querySelectorAll('input, select');
            for (var i = 0; i < allInputs.length; i++) {
              var inp = allInputs[i];
              if (inp.id || inp.name) {
                inputs[inp.id || inp.name] = inp.value;
              }
            }
            
            window.saveResultToApp(value, text, inputs);
            
            this.innerHTML = '✅ تم إرسال النتيجة!';
            this.style.background = 'linear-gradient(135deg, #00B894 0%, #00A884 100%)';
            var btn = this;
            setTimeout(function() {
              btn.innerHTML = '💾 حفظ النتيجة في ملفي الشخصي';
              btn.style.background = 'linear-gradient(135deg, #2A7B7B 0%, #1D5A5A 100%)';
            }, 2500);
          };
          
          resultEl.appendChild(saveBtn);
          console.log('Save button added successfully!');
          return true;
        }
        
        // مراقب للتغييرات
        var observer = new MutationObserver(function() {
          addSaveButton();
        });
        
        observer.observe(document.body, { 
          childList: true, 
          subtree: true, 
          attributes: true,
          attributeFilter: ['style', 'class', 'hidden']
        });
        
        // فحص دوري كل ثانية
        setInterval(addSaveButton, 1000);
        
        // محاولة أولية
        setTimeout(addSaveButton, 500);
        setTimeout(addSaveButton, 1500);
        setTimeout(addSaveButton, 3000);
      })();
    </script>
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
        .app-save-btn:hover { opacity: 0.9; transform: translateY(-2px); }
        .app-save-btn:active { transform: scale(0.98); }
      </style>
    </head>
    <body>
      ${calculator.html_content}
      ${saveButtonScript}
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
        
        {/* مؤشر الحفظ */}
        <View style={[styles.saveBtn, saving && styles.saveBtnActive]}>
          {saving ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Ionicons 
              name={lastResult ? "checkmark-circle" : "calculator"} 
              size={22} 
              color={COLORS.white} 
            />
          )}
        </View>
      </View>

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
  saveBtnActive: {
    backgroundColor: COLORS.success,
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
