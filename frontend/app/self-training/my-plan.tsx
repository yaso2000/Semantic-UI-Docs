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
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts, Alexandria_400Regular, Alexandria_600SemiBold, Alexandria_700Bold } from '@expo-google-fonts/alexandria';
import { COLORS, FONTS, SHADOWS, RADIUS, SPACING } from '../../src/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface Plan {
  id: string;
  workout_plan: {
    weekly_schedule: {[key: string]: any};
    goal_focus?: string;
    focus?: string;
    recommendations?: string[];
    tips?: string[];
  };
  nutrition_plan: {
    daily_calories: number;
    macros: { 
      protein: any; 
      carbs: any; 
      fat?: any;
      fats?: number;
    };
    meal_examples?: {[key: string]: string[]};
    meal_plan?: any[];
    water_intake?: string;
    recommendations?: string[];
    tips?: string[];
  };
  created_at?: string;
}

export default function MyPlanScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [hasPlan, setHasPlan] = useState(false);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [reason, setReason] = useState('');
  const [activeTab, setActiveTab] = useState<'workout' | 'nutrition'>('workout');

  const [fontsLoaded] = useFonts({ Alexandria_400Regular, Alexandria_600SemiBold, Alexandria_700Bold });

  useEffect(() => {
    loadPlan();
  }, []);

  const loadPlan = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        router.push('/login' as any);
        return;
      }

      const response = await fetch(`${API_URL}/api/self-training/my-plan`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setHasPlan(data.has_plan);
        if (data.has_plan) {
          setPlan(data.plan);
        } else {
          setReason(data.reason);
        }
      }
    } catch (error) {
      console.error('Error loading plan:', error);
      Alert.alert('خطأ', 'فشل في تحميل الخطة');
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = async () => {
    if (!plan) return;

    setDownloading(true);
    try {
      // تحويل الجدول الأسبوعي إلى HTML
      let workoutScheduleHtml = '';
      if (plan.workout_plan?.weekly_schedule) {
        const schedule = plan.workout_plan.weekly_schedule;
        Object.entries(schedule).forEach(([dayName, dayData]: [string, any], idx: number) => {
          const exercises = dayData?.exercises?.map((ex: any) => {
            if (ex.sets && ex.reps) {
              return `<div class="exercise"><strong>${ex.name}</strong>: ${ex.sets} مجموعات × ${ex.reps}</div>`;
            } else if (ex.duration) {
              return `<div class="exercise"><strong>${ex.name}</strong>: ${ex.duration}</div>`;
            }
            return `<div class="exercise"><strong>${ex.name}</strong></div>`;
          }).join('') || '';
          
          const activities = dayData?.activities ? 
            `<p>أنشطة مقترحة: ${dayData.activities.join('، ')}</p>` : '';
          
          workoutScheduleHtml += `
            <div class="day">
              <div class="day-title">${dayName}</div>
              <p><strong>النوع:</strong> ${dayData?.type || 'تمارين عامة'}</p>
              ${dayData?.duration ? `<p><strong>المدة:</strong> ${dayData.duration}</p>` : ''}
              ${exercises}
              ${activities}
            </div>
          `;
        });
      }

      // تحويل الوجبات إلى HTML
      let mealsHtml = '';
      if (plan.nutrition_plan?.meal_examples) {
        const mealNames: {[key: string]: string} = {
          'breakfast': 'الإفطار',
          'lunch': 'الغداء', 
          'dinner': 'العشاء',
          'snacks': 'وجبات خفيفة'
        };
        
        Object.entries(plan.nutrition_plan.meal_examples).forEach(([mealType, examples]: [string, any]) => {
          const examplesList = Array.isArray(examples) ? examples.map((ex: string) => `<li>${ex}</li>`).join('') : '';
          mealsHtml += `
            <div class="meal">
              <div class="meal-title">${mealNames[mealType] || mealType}</div>
              <ul>${examplesList}</ul>
            </div>
          `;
        });
      }

      // النصائح
      const workoutTips = plan.workout_plan?.recommendations?.map((tip: string) => `<li>${tip}</li>`).join('') || '';
      const nutritionTips = plan.nutrition_plan?.recommendations?.map((tip: string) => `<li>${tip}</li>`).join('') || '';

      const htmlContent = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <style>
            * { font-family: 'Arial', sans-serif; }
            body { padding: 40px; direction: rtl; }
            h1 { color: #667eea; text-align: center; margin-bottom: 30px; }
            h2 { color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px; margin-top: 30px; }
            h3 { color: #764ba2; }
            .section { margin-bottom: 30px; background: #f9f9f9; padding: 20px; border-radius: 10px; }
            .day { margin: 15px 0; padding: 15px; background: white; border-radius: 8px; border-right: 4px solid #667eea; }
            .day-title { font-weight: bold; color: #667eea; font-size: 16px; margin-bottom: 10px; }
            .exercise { margin: 8px 0; padding: 8px; background: #f0f0f0; border-radius: 5px; }
            .meal { margin: 10px 0; padding: 10px; background: #e8f5e9; border-radius: 5px; }
            .meal-title { font-weight: bold; color: #4CAF50; margin-bottom: 8px; }
            .meal ul { margin: 5px 0; padding-right: 20px; }
            .macros { display: flex; justify-content: space-around; margin: 20px 0; flex-wrap: wrap; gap: 10px; }
            .macro-item { text-align: center; padding: 15px; background: linear-gradient(135deg, #667eea, #764ba2); color: white; border-radius: 10px; min-width: 80px; }
            .macro-value { font-size: 24px; font-weight: bold; }
            .water-info { background: #e3f2fd; padding: 15px; border-radius: 8px; text-align: center; margin: 15px 0; }
            .tips { list-style-type: none; padding: 0; }
            .tips li { margin: 10px 0; padding: 10px; background: #fff3e0; border-radius: 5px; border-right: 3px solid #ff9800; }
            .footer { text-align: center; margin-top: 40px; color: #999; font-size: 12px; }
          </style>
        </head>
        <body>
          <h1>🏋️ خطتك الشخصية للتدريب والتغذية</h1>
          
          <h2>📊 خطة التمارين</h2>
          <div class="section">
            <p><strong>التركيز:</strong> ${plan.workout_plan?.goal_focus || plan.workout_plan?.focus || 'تحسين اللياقة'}</p>
            
            ${workoutScheduleHtml || '<p>لم يتم توليد جدول التمارين بعد</p>'}
            
            ${workoutTips ? `
              <h3>💡 نصائح للتمارين</h3>
              <ul class="tips">${workoutTips}</ul>
            ` : ''}
          </div>
          
          <h2>🥗 خطة التغذية</h2>
          <div class="section">
            <h3>السعرات والماكروز اليومية</h3>
            <div class="macros">
              <div class="macro-item">
                <div class="macro-value">${plan.nutrition_plan?.daily_calories || 2000}</div>
                <div>سعرة</div>
              </div>
              <div class="macro-item">
                <div class="macro-value">${plan.nutrition_plan?.macros?.protein?.grams || plan.nutrition_plan?.macros?.protein || 150}g</div>
                <div>بروتين</div>
              </div>
              <div class="macro-item">
                <div class="macro-value">${plan.nutrition_plan?.macros?.carbs?.grams || plan.nutrition_plan?.macros?.carbs || 200}g</div>
                <div>كربوهيدرات</div>
              </div>
              <div class="macro-item">
                <div class="macro-value">${plan.nutrition_plan?.macros?.fat?.grams || plan.nutrition_plan?.macros?.fats || 60}g</div>
                <div>دهون</div>
              </div>
            </div>
            
            ${plan.nutrition_plan?.water_intake ? `
              <div class="water-info">
                <strong>💧 كمية الماء المطلوبة:</strong> ${plan.nutrition_plan.water_intake}
              </div>
            ` : ''}
            
            <h3>أمثلة على الوجبات</h3>
            ${mealsHtml || '<p>لم يتم توليد خطة الوجبات بعد</p>'}
            
            ${nutritionTips ? `
              <h3>💡 نصائح غذائية</h3>
              <ul class="tips">${nutritionTips}</ul>
            ` : ''}
          </div>
          
          <div class="footer">
            <p>تم إنشاء هذه الخطة بواسطة تطبيق "اسأل يازو" للتدريب الذاتي</p>
            <p>تاريخ الإنشاء: ${plan.created_at ? new Date(plan.created_at).toLocaleDateString('ar-SA') : new Date().toLocaleDateString('ar-SA')}</p>
          </div>
        </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'مشاركة خطتك',
          UTI: 'com.adobe.pdf'
        });
      } else {
        Alert.alert('تم إنشاء PDF', 'تم حفظ الملف بنجاح');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('خطأ', 'فشل في إنشاء ملف PDF. يرجى المحاولة مرة أخرى.');
    } finally {
      setDownloading(false);
    }
  };

  const sharePlan = async () => {
    try {
      await Share.share({
        message: `خطتي للتدريب الذاتي من تطبيق "اسأل يازو"\n\nالسعرات اليومية: ${plan?.nutrition_plan?.daily_calories || 2000} سعرة\nأيام التمرين: ${plan?.workout_plan?.weekly_schedule?.length || 0} أيام\n\nللمزيد، حمّل التطبيق!`,
        title: 'خطتي الشخصية'
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color={COLORS.teal} />
        <Text style={styles.loadingText}>جاري تحميل خطتك...</Text>
      </View>
    );
  }

  if (!hasPlan) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" />
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.header}
        >
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-forward" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>خطتي</Text>
          <View style={{ width: 40 }} />
        </LinearGradient>

        <View style={styles.noPlanContainer}>
          <Ionicons name="document-text-outline" size={80} color={COLORS.textMuted} />
          <Text style={styles.noPlanTitle}>
            {reason === 'no_subscription' ? 'لا يوجد اشتراك' : 'لم يتم إنشاء الخطة بعد'}
          </Text>
          <Text style={styles.noPlanText}>
            {reason === 'no_subscription' 
              ? 'يرجى الاشتراك في خدمة التدريب الذاتي أولاً'
              : 'أكمل التقييم الذاتي لإنشاء خطتك المخصصة'
            }
          </Text>
          <TouchableOpacity 
            style={styles.actionBtn} 
            onPress={() => router.push(reason === 'no_subscription' ? '/self-training' : '/self-training/assessment' as any)}
          >
            <Text style={styles.actionBtnText}>
              {reason === 'no_subscription' ? 'الاشتراك الآن' : 'بدء التقييم'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>خطتي الشخصية</Text>
        <TouchableOpacity style={styles.shareBtn} onPress={sharePlan}>
          <Ionicons name="share-outline" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'workout' && styles.tabActive]}
          onPress={() => setActiveTab('workout')}
        >
          <Ionicons name="barbell" size={20} color={activeTab === 'workout' ? '#667eea' : COLORS.textMuted} />
          <Text style={[styles.tabText, activeTab === 'workout' && styles.tabTextActive]}>التمارين</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'nutrition' && styles.tabActive]}
          onPress={() => setActiveTab('nutrition')}
        >
          <Ionicons name="nutrition" size={20} color={activeTab === 'nutrition' ? '#667eea' : COLORS.textMuted} />
          <Text style={[styles.tabText, activeTab === 'nutrition' && styles.tabTextActive]}>التغذية</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {activeTab === 'workout' ? (
          <View>
            {/* Focus Card */}
            <View style={styles.focusCard}>
              <Ionicons name="flame" size={24} color="#FF9800" />
              <Text style={styles.focusText}>التركيز: {plan?.workout_plan?.goal_focus || plan?.workout_plan?.focus || 'تحسين اللياقة'}</Text>
            </View>

            {/* Weekly Schedule */}
            <Text style={styles.sectionTitle}>الجدول الأسبوعي</Text>
            {plan?.workout_plan?.weekly_schedule && Object.keys(plan.workout_plan.weekly_schedule).length > 0 ? (
              Object.entries(plan.workout_plan.weekly_schedule).map(([dayName, dayData]: [string, any], idx: number) => (
                <View key={idx} style={styles.dayCard}>
                  <View style={styles.dayHeader}>
                    <View style={styles.dayNumber}>
                      <Text style={styles.dayNumberText}>{idx + 1}</Text>
                    </View>
                    <View style={styles.dayInfo}>
                      <Text style={styles.dayTitle}>{dayName}</Text>
                      <Text style={styles.dayType}>{dayData?.type || 'تمارين عامة'}</Text>
                    </View>
                    {dayData?.duration && (
                      <View style={styles.dayDuration}>
                        <Ionicons name="time-outline" size={16} color={COLORS.textMuted} />
                        <Text style={styles.dayDurationText}>{dayData.duration}</Text>
                      </View>
                    )}
                  </View>

                  {dayData?.exercises?.map((exercise: any, exIdx: number) => (
                    <View key={exIdx} style={styles.exerciseItem}>
                      <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                      <Text style={styles.exerciseName}>{exercise.name}</Text>
                      {exercise.sets && exercise.reps ? (
                        <Text style={styles.exerciseReps}>
                          {exercise.sets}×{exercise.reps}
                        </Text>
                      ) : exercise.duration ? (
                        <Text style={styles.exerciseReps}>{exercise.duration}</Text>
                      ) : null}
                    </View>
                  ))}
                  
                  {dayData?.activities && (
                    <View style={styles.restActivities}>
                      <Text style={styles.restText}>أنشطة مقترحة: {dayData.activities.join('، ')}</Text>
                    </View>
                  )}
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>لم يتم توليد جدول التمارين بعد</Text>
              </View>
            )}

            {/* Tips */}
            {plan?.workout_plan?.tips?.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>نصائح للتمارين</Text>
                {plan.workout_plan.tips.map((tip: string, idx: number) => (
                  <View key={idx} style={styles.tipItem}>
                    <Ionicons name="bulb" size={18} color="#FF9800" />
                    <Text style={styles.tipText}>{tip}</Text>
                  </View>
                ))}
              </>
            )}
          </View>
        ) : (
          <View>
            {/* Macros Card */}
            <View style={styles.macrosCard}>
              <Text style={styles.macrosTitle}>السعرات والماكروز اليومية</Text>
              <View style={styles.macrosGrid}>
                <View style={[styles.macroItem, { backgroundColor: '#E3F2FD' }]}>
                  <Text style={[styles.macroValue, { color: '#2196F3' }]}>
                    {plan?.nutrition_plan?.daily_calories || 2000}
                  </Text>
                  <Text style={styles.macroLabel}>سعرة</Text>
                </View>
                <View style={[styles.macroItem, { backgroundColor: '#FCE4EC' }]}>
                  <Text style={[styles.macroValue, { color: '#E91E63' }]}>
                    {plan?.nutrition_plan?.macros?.protein?.grams || plan?.nutrition_plan?.macros?.protein || 150}g
                  </Text>
                  <Text style={styles.macroLabel}>بروتين</Text>
                </View>
                <View style={[styles.macroItem, { backgroundColor: '#FFF3E0' }]}>
                  <Text style={[styles.macroValue, { color: '#FF9800' }]}>
                    {plan?.nutrition_plan?.macros?.carbs?.grams || plan?.nutrition_plan?.macros?.carbs || 200}g
                  </Text>
                  <Text style={styles.macroLabel}>كربوهيدرات</Text>
                </View>
                <View style={[styles.macroItem, { backgroundColor: '#E8F5E9' }]}>
                  <Text style={[styles.macroValue, { color: '#4CAF50' }]}>
                    {plan?.nutrition_plan?.macros?.fat?.grams || plan?.nutrition_plan?.macros?.fats || 60}g
                  </Text>
                  <Text style={styles.macroLabel}>دهون</Text>
                </View>
              </View>
            </View>

            {/* Water Intake */}
            {plan?.nutrition_plan?.water_intake && (
              <View style={styles.waterCard}>
                <Ionicons name="water" size={24} color="#2196F3" />
                <Text style={styles.waterText}>كمية الماء المطلوبة: {plan.nutrition_plan.water_intake}</Text>
              </View>
            )}

            {/* Meal Examples */}
            <Text style={styles.sectionTitle}>أمثلة على الوجبات</Text>
            {plan?.nutrition_plan?.meal_examples ? (
              Object.entries(plan.nutrition_plan.meal_examples).map(([mealType, examples]: [string, any], idx: number) => (
                <View key={idx} style={styles.mealCard}>
                  <View style={styles.mealHeader}>
                    <View style={styles.mealIcon}>
                      <Ionicons 
                        name={mealType === 'breakfast' ? 'sunny' : mealType === 'lunch' ? 'partly-sunny' : mealType === 'dinner' ? 'moon' : 'cafe'} 
                        size={20} 
                        color="#4CAF50" 
                      />
                    </View>
                    <Text style={styles.mealName}>
                      {mealType === 'breakfast' ? 'الإفطار' : 
                       mealType === 'lunch' ? 'الغداء' : 
                       mealType === 'dinner' ? 'العشاء' : 'وجبات خفيفة'}
                    </Text>
                  </View>
                  <View style={styles.mealExamples}>
                    {Array.isArray(examples) && examples.map((example: string, exIdx: number) => (
                      <View key={exIdx} style={styles.mealExampleItem}>
                        <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                        <Text style={styles.mealExampleText}>{example}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>لم يتم توليد خطة الوجبات بعد</Text>
              </View>
            )}

            {/* Recommendations */}
            {plan?.nutrition_plan?.recommendations?.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>نصائح غذائية</Text>
                {plan.nutrition_plan.recommendations.map((tip: string, idx: number) => (
                  <View key={idx} style={styles.tipItem}>
                    <Ionicons name="bulb" size={18} color="#4CAF50" />
                    <Text style={styles.tipText}>{tip}</Text>
                  </View>
                ))}
              </>
            )}
          </View>
        )}
      </ScrollView>

      {/* Download Button */}
      <View style={[styles.downloadContainer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity 
          style={styles.downloadBtn} 
          onPress={generatePDF}
          disabled={downloading}
        >
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.downloadBtnGradient}
          >
            {downloading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Ionicons name="download" size={22} color={COLORS.white} />
                <Text style={styles.downloadBtnText}>تحميل PDF</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
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
  loadingText: {
    marginTop: SPACING.md,
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  shareBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },

  noPlanContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  noPlanTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginTop: SPACING.md,
  },
  noPlanText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  actionBtn: {
    backgroundColor: '#667eea',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    marginTop: SPACING.lg,
  },
  actionBtnText: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },

  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    padding: SPACING.sm,
    gap: SPACING.sm,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.background,
  },
  tabActive: {
    backgroundColor: '#F0EDFF',
  },
  tabText: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    color: COLORS.textMuted,
  },
  tabTextActive: {
    color: '#667eea',
  },

  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.md,
    paddingBottom: 100,
  },

  focusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: '#FFF3E0',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
  },
  focusText: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    color: '#E65100',
  },

  sectionTitle: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    textAlign: 'right',
  },

  dayCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dayNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayNumberText: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },
  dayInfo: {
    flex: 1,
    marginHorizontal: SPACING.sm,
  },
  dayTitle: {
    fontSize: 15,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  dayType: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  dayDuration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dayDurationText: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  exerciseName: {
    flex: 1,
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: COLORS.text,
  },
  exerciseReps: {
    fontSize: 12,
    fontFamily: FONTS.semiBold,
    color: '#667eea',
    backgroundColor: '#F0EDFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  restActivities: {
    backgroundColor: '#E8F5E9',
    padding: SPACING.sm,
    borderRadius: RADIUS.sm,
    marginTop: SPACING.xs,
  },
  restText: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: '#2E7D32',
    textAlign: 'right',
  },

  macrosCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  macrosTitle: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  macrosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  macroItem: {
    flex: 1,
    minWidth: '45%',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  macroValue: {
    fontSize: 22,
    fontFamily: FONTS.bold,
  },
  macroLabel: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  waterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: '#E3F2FD',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
  },
  waterText: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    color: '#1976D2',
  },
  mealExamples: {
    marginTop: SPACING.sm,
  },
  mealExampleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: 4,
  },
  mealExampleText: {
    flex: 1,
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: COLORS.text,
    textAlign: 'right',
  },

  mealCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  mealIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mealName: {
    flex: 1,
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
  },
  mealCalories: {
    fontSize: 12,
    fontFamily: FONTS.semiBold,
    color: '#4CAF50',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  mealDesc: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    textAlign: 'right',
  },

  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    backgroundColor: '#FFF8E1',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: COLORS.text,
    textAlign: 'right',
  },

  emptyState: {
    alignItems: 'center',
    padding: SPACING.xl,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
  },

  downloadContainer: {
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  downloadBtn: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  downloadBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
  },
  downloadBtnText: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },
});
