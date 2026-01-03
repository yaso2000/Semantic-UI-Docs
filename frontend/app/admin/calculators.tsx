import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  StatusBar,
  Switch} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFonts, Alexandria_400Regular, Alexandria_600SemiBold, Alexandria_700Bold } from '@expo-google-fonts/alexandria';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, FONTS, SHADOWS, RADIUS, SPACING } from '../../src/constants/theme';
import { Picker } from '@react-native-picker/picker';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface CustomCalculator {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  html_content: string;
  is_active: boolean;
  created_at?: string;
}

const CATEGORIES = [
  { value: 'physical', label: 'اللياقة البدنية', color: COLORS.teal },
  { value: 'nutritional', label: 'الصحة التغذوية', color: COLORS.sage },
  { value: 'mental', label: 'الصحة النفسية', color: COLORS.gold },
  { value: 'spiritual', label: 'الرفاهية الروحية', color: COLORS.spiritual },
];

const ICONS = [
  'calculator', 'fitness', 'nutrition', 'happy', 'sparkles',
  'body', 'heart', 'pulse', 'flame', 'water',
  'scale', 'trending-up', 'analytics', 'timer', 'speedometer'
];

// قوالب جاهزة للحاسبات
const TEMPLATES = [
  {
    name: 'حاسبة BMI',
    category: 'physical',
    icon: 'body',
    html: `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { box-sizing: border-box; font-family: 'Alexandria', sans-serif; }
    body { margin: 0; padding: 20px; background: #FAF8F5; color: #2D3436; }
    .container { max-width: 400px; margin: 0 auto; }
    h2 { color: #2A7B7B; text-align: center; margin-bottom: 20px; }
    .input-group { margin-bottom: 15px; }
    label { display: block; margin-bottom: 5px; font-weight: 600; color: #636E72; }
    input { width: 100%; padding: 12px; border: 2px solid #DFE6E9; border-radius: 10px; font-size: 16px; text-align: center; }
    input:focus { border-color: #2A7B7B; outline: none; }
    button { width: 100%; padding: 14px; background: #2A7B7B; color: white; border: none; border-radius: 10px; font-size: 16px; font-weight: bold; cursor: pointer; margin-top: 10px; }
    button:hover { background: #1E5F5F; }
    .result { margin-top: 20px; padding: 20px; background: white; border-radius: 15px; text-align: center; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .result-number { font-size: 48px; font-weight: bold; color: #2A7B7B; }
    .result-label { color: #636E72; margin-top: 5px; }
    .category { padding: 8px 16px; border-radius: 20px; display: inline-block; margin-top: 10px; font-weight: 600; }
    .underweight { background: #74B9FF; color: white; }
    .normal { background: #00B894; color: white; }
    .overweight { background: #FDCB6E; color: #2D3436; }
    .obese { background: #E17055; color: white; }
  </style>
</head>
<body>
  <div class="container">
    <h2>🏋️ حاسبة مؤشر كتلة الجسم</h2>
    <div class="input-group">
      <label>الوزن (كجم)</label>
      <input type="number" id="weight" placeholder="مثال: 70">
    </div>
    <div class="input-group">
      <label>الطول (سم)</label>
      <input type="number" id="height" placeholder="مثال: 170">
    </div>
    <button onclick="calculateBMI()">احسب BMI</button>
    <div class="result" id="result" style="display:none;">
      <div class="result-number" id="bmi-value">0</div>
      <div class="result-label">مؤشر كتلة الجسم</div>
      <div id="category"></div>
    </div>
  </div>
  <script>
    function calculateBMI() {
      const weight = parseFloat(document.getElementById('weight').value);
      const height = parseFloat(document.getElementById('height').value) / 100;
      if (!weight || !height) { alert('يرجى إدخال الوزن والطول'); return; }
      const bmi = weight / (height * height);
      document.getElementById('bmi-value').textContent = bmi.toFixed(1);
      let cat = '', cls = '';
      if (bmi < 18.5) { cat = 'نقص في الوزن'; cls = 'underweight'; }
      else if (bmi < 25) { cat = 'وزن طبيعي ✓'; cls = 'normal'; }
      else if (bmi < 30) { cat = 'زيادة في الوزن'; cls = 'overweight'; }
      else { cat = 'سمنة'; cls = 'obese'; }
      document.getElementById('category').innerHTML = '<span class="category ' + cls + '">' + cat + '</span>';
      document.getElementById('result').style.display = 'block';
    }
  </script>
</body>
</html>`
  },
  {
    name: 'حاسبة السعرات اليومية',
    category: 'nutritional',
    icon: 'flame',
    html: `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { box-sizing: border-box; font-family: 'Alexandria', sans-serif; }
    body { margin: 0; padding: 20px; background: #FAF8F5; color: #2D3436; }
    .container { max-width: 400px; margin: 0 auto; }
    h2 { color: #8FAE8B; text-align: center; margin-bottom: 20px; }
    .input-group { margin-bottom: 15px; }
    label { display: block; margin-bottom: 5px; font-weight: 600; color: #636E72; }
    input, select { width: 100%; padding: 12px; border: 2px solid #DFE6E9; border-radius: 10px; font-size: 16px; }
    input:focus, select:focus { border-color: #8FAE8B; outline: none; }
    .radio-group { display: flex; gap: 10px; margin-top: 5px; }
    .radio-btn { flex: 1; padding: 10px; border: 2px solid #DFE6E9; border-radius: 10px; text-align: center; cursor: pointer; }
    .radio-btn.active { border-color: #8FAE8B; background: #8FAE8B20; }
    button { width: 100%; padding: 14px; background: #8FAE8B; color: white; border: none; border-radius: 10px; font-size: 16px; font-weight: bold; cursor: pointer; margin-top: 10px; }
    .result { margin-top: 20px; padding: 20px; background: white; border-radius: 15px; text-align: center; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .result-number { font-size: 42px; font-weight: bold; color: #8FAE8B; }
    .result-label { color: #636E72; }
    .goals { display: flex; gap: 10px; margin-top: 15px; }
    .goal { flex: 1; padding: 10px; background: #F5F0E8; border-radius: 10px; text-align: center; }
    .goal-value { font-size: 18px; font-weight: bold; color: #2D3436; }
    .goal-label { font-size: 11px; color: #636E72; }
  </style>
</head>
<body>
  <div class="container">
    <h2>🔥 حاسبة السعرات اليومية</h2>
    <div class="input-group">
      <label>الجنس</label>
      <div class="radio-group">
        <div class="radio-btn active" onclick="selectGender('male', this)">ذكر</div>
        <div class="radio-btn" onclick="selectGender('female', this)">أنثى</div>
      </div>
    </div>
    <div class="input-group">
      <label>العمر</label>
      <input type="number" id="age" placeholder="مثال: 25">
    </div>
    <div class="input-group">
      <label>الوزن (كجم)</label>
      <input type="number" id="weight" placeholder="مثال: 70">
    </div>
    <div class="input-group">
      <label>الطول (سم)</label>
      <input type="number" id="height" placeholder="مثال: 170">
    </div>
    <div class="input-group">
      <label>مستوى النشاط</label>
      <select id="activity">
        <option value="1.2">قليل الحركة</option>
        <option value="1.375">نشاط خفيف (1-3 أيام/أسبوع)</option>
        <option value="1.55" selected>نشاط متوسط (3-5 أيام/أسبوع)</option>
        <option value="1.725">نشاط عالي (6-7 أيام/أسبوع)</option>
        <option value="1.9">نشاط مكثف جداً</option>
      </select>
    </div>
    <button onclick="calculateTDEE()">احسب السعرات</button>
    <div class="result" id="result" style="display:none;">
      <div class="result-number" id="tdee-value">0</div>
      <div class="result-label">سعرة حرارية / يوم</div>
      <div class="goals">
        <div class="goal">
          <div class="goal-value" id="lose">0</div>
          <div class="goal-label">لخسارة الوزن</div>
        </div>
        <div class="goal">
          <div class="goal-value" id="gain">0</div>
          <div class="goal-label">لزيادة الوزن</div>
        </div>
      </div>
    </div>
  </div>
  <script>
    let gender = 'male';
    function selectGender(g, el) {
      gender = g;
      document.querySelectorAll('.radio-btn').forEach(b => b.classList.remove('active'));
      el.classList.add('active');
    }
    function calculateTDEE() {
      const age = parseFloat(document.getElementById('age').value);
      const weight = parseFloat(document.getElementById('weight').value);
      const height = parseFloat(document.getElementById('height').value);
      const activity = parseFloat(document.getElementById('activity').value);
      if (!age || !weight || !height) { alert('يرجى ملء جميع الحقول'); return; }
      let bmr;
      if (gender === 'male') {
        bmr = 10 * weight + 6.25 * height - 5 * age + 5;
      } else {
        bmr = 10 * weight + 6.25 * height - 5 * age - 161;
      }
      const tdee = Math.round(bmr * activity);
      document.getElementById('tdee-value').textContent = tdee;
      document.getElementById('lose').textContent = tdee - 500;
      document.getElementById('gain').textContent = tdee + 500;
      document.getElementById('result').style.display = 'block';
    }
  </script>
</body>
</html>`
  },
  {
    name: 'حاسبة كمية الماء',
    category: 'nutritional',
    icon: 'water',
    html: `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { box-sizing: border-box; font-family: 'Alexandria', sans-serif; }
    body { margin: 0; padding: 20px; background: #FAF8F5; color: #2D3436; }
    .container { max-width: 400px; margin: 0 auto; }
    h2 { color: #0984E3; text-align: center; margin-bottom: 20px; }
    .input-group { margin-bottom: 15px; }
    label { display: block; margin-bottom: 5px; font-weight: 600; color: #636E72; }
    input { width: 100%; padding: 12px; border: 2px solid #DFE6E9; border-radius: 10px; font-size: 16px; text-align: center; }
    button { width: 100%; padding: 14px; background: #0984E3; color: white; border: none; border-radius: 10px; font-size: 16px; font-weight: bold; cursor: pointer; margin-top: 10px; }
    .result { margin-top: 20px; padding: 20px; background: linear-gradient(135deg, #74B9FF, #0984E3); border-radius: 15px; text-align: center; color: white; }
    .water-icon { font-size: 48px; }
    .result-number { font-size: 48px; font-weight: bold; }
    .result-label { opacity: 0.9; }
    .cups { margin-top: 15px; display: flex; justify-content: center; gap: 5px; flex-wrap: wrap; }
    .cup { font-size: 24px; }
  </style>
</head>
<body>
  <div class="container">
    <h2>💧 حاسبة كمية الماء اليومية</h2>
    <div class="input-group">
      <label>الوزن (كجم)</label>
      <input type="number" id="weight" placeholder="مثال: 70">
    </div>
    <button onclick="calculateWater()">احسب</button>
    <div class="result" id="result" style="display:none;">
      <div class="water-icon">💧</div>
      <div class="result-number"><span id="liters">0</span> لتر</div>
      <div class="result-label">كمية الماء اليومية الموصى بها</div>
      <div class="cups" id="cups"></div>
    </div>
  </div>
  <script>
    function calculateWater() {
      const weight = parseFloat(document.getElementById('weight').value);
      if (!weight) { alert('يرجى إدخال الوزن'); return; }
      const liters = (weight * 0.033).toFixed(1);
      const cups = Math.round(liters * 4);
      document.getElementById('liters').textContent = liters;
      document.getElementById('cups').innerHTML = '🥛'.repeat(Math.min(cups, 12)) + (cups > 12 ? '...' : '');
      document.getElementById('result').style.display = 'block';
    }
  </script>
</body>
</html>`
  }
];

export default function AdminCalculatorsScreen() {
  const insets = useSafeAreaInsets();
  const [calculators, setCalculators] = useState<CustomCalculator[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [editingCalc, setEditingCalc] = useState<CustomCalculator | null>(null);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('physical');
  const [icon, setIcon] = useState('calculator');
  const [htmlContent, setHtmlContent] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [fontsLoaded] = useFonts({ Alexandria_400Regular, Alexandria_600SemiBold, Alexandria_700Bold });

  useEffect(() => {
    loadCalculators();
  }, []);

  const loadCalculators = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/admin/custom-calculators`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCalculators(data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('physical');
    setIcon('calculator');
    setHtmlContent('');
    setIsActive(true);
    setEditingCalc(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (calc: CustomCalculator) => {
    setEditingCalc(calc);
    setTitle(calc.title);
    setDescription(calc.description);
    setCategory(calc.category);
    setIcon(calc.icon);
    setHtmlContent(calc.html_content || '');
    setIsActive(calc.is_active);
    setShowModal(true);
  };

  const useTemplate = (template: typeof TEMPLATES[0]) => {
    setTitle(template.name);
    setDescription(`حاسبة ${template.name} المخصصة`);
    setCategory(template.category);
    setIcon(template.icon);
    setHtmlContent(template.html);
    setShowTemplates(false);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!title.trim() || !htmlContent.trim()) {
      Alert.alert('خطأ', 'يرجى ملء العنوان وكود HTML');
      return;
    }

    setSaving(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const calcData = {
        title,
        description,
        category,
        icon,
        html_content: htmlContent,
        is_active: isActive};

      const url = editingCalc
        ? `${API_URL}/api/admin/custom-calculators/${editingCalc.id}`
        : `${API_URL}/api/admin/custom-calculators`;

      const method = editingCalc ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(calcData)
      });

      if (response.ok) {
        Alert.alert('نجاح', editingCalc ? 'تم تحديث الحاسبة' : 'تم إضافة الحاسبة');
        setShowModal(false);
        resetForm();
        loadCalculators();
      } else {
        const error = await response.json();
        Alert.alert('خطأ', error.detail || 'حدث خطأ');
      }
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ في الاتصال');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (calcId: string) => {
    Alert.alert(
      'تأكيد الحذف',
      'هل أنت متأكد من حذف هذه الحاسبة؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              const response = await fetch(`${API_URL}/api/admin/custom-calculators/${calcId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
              });
              if (response.ok) {
                Alert.alert('نجاح', 'تم حذف الحاسبة');
                loadCalculators();
              }
            } catch (error) {
              Alert.alert('خطأ', 'حدث خطأ في الحذف');
            }
          }
        }
      ]
    );
  };

  const getCategoryInfo = (catValue: string) => {
    return CATEGORIES.find(c => c.value === catValue) || CATEGORIES[0];
  };

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <ActivityIndicator size="large" color={COLORS.teal} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>الحاسبات المخصصة</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowTemplates(true)}>
          <Ionicons name="add" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Ionicons name="calculator" size={24} color={COLORS.teal} />
          <Text style={styles.statNumber}>{calculators.length}</Text>
          <Text style={styles.statLabel}>حاسبة مخصصة</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
          <Text style={styles.statNumber}>{calculators.filter(c => c.is_active).length}</Text>
          <Text style={styles.statLabel}>نشطة</Text>
        </View>
      </View>

      {/* Calculators List */}
      <ScrollView contentContainerStyle={styles.content}>
        {calculators.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calculator-outline" size={64} color={COLORS.border} />
            <Text style={styles.emptyText}>لا توجد حاسبات مخصصة</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowTemplates(true)}>
              <Ionicons name="add" size={20} color={COLORS.white} />
              <Text style={styles.emptyBtnText}>إضافة حاسبة</Text>
            </TouchableOpacity>
          </View>
        ) : (
          calculators.map((calc) => {
            const catInfo = getCategoryInfo(calc.category);
            return (
              <View key={calc.id} style={[styles.calcCard, !calc.is_active && styles.calcCardInactive]}>
                <View style={styles.calcHeader}>
                  <View style={[styles.calcIcon, { backgroundColor: `${catInfo.color}20` }]}>
                    <Ionicons name={calc.icon as any} size={24} color={catInfo.color} />
                  </View>
                  <View style={styles.calcInfo}>
                    <Text style={styles.calcTitle}>{calc.title}</Text>
                    <View style={styles.calcMeta}>
                      <View style={[styles.badge, { backgroundColor: `${catInfo.color}15` }]}>
                        <Text style={[styles.badgeText, { color: catInfo.color }]}>{catInfo.label}</Text>
                      </View>
                      {!calc.is_active && (
                        <View style={[styles.badge, { backgroundColor: COLORS.errorLight }]}>
                          <Text style={[styles.badgeText, { color: COLORS.error }]}>غير نشط</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
                <Text style={styles.calcDesc} numberOfLines={2}>{calc.description}</Text>

                <View style={styles.calcActions}>
                  <TouchableOpacity 
                    style={styles.actionBtn} 
                    onPress={() => router.push(`/custom-calculator/${calc.id}` as any)}
                  >
                    <Ionicons name="eye" size={18} color={COLORS.info} />
                    <Text style={[styles.actionBtnText, { color: COLORS.info }]}>معاينة</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => openEditModal(calc)}>
                    <Ionicons name="create" size={18} color={COLORS.teal} />
                    <Text style={styles.actionBtnText}>تعديل</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={() => handleDelete(calc.id)}>
                    <Ionicons name="trash" size={18} color={COLORS.error} />
                    <Text style={[styles.actionBtnText, { color: COLORS.error }]}>حذف</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Templates Modal */}
      <Modal visible={showTemplates} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.templatesModal}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowTemplates(false)}>
                <Ionicons name="close" size={24} color={COLORS.textMuted} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>إضافة حاسبة</Text>
            </View>

            <TouchableOpacity style={styles.templateOption} onPress={openAddModal}>
              <View style={[styles.templateIcon, { backgroundColor: COLORS.beige }]}>
                <Ionicons name="code-slash" size={28} color={COLORS.teal} />
              </View>
              <View style={styles.templateInfo}>
                <Text style={styles.templateTitle}>حاسبة مخصصة</Text>
                <Text style={styles.templateDesc}>أنشئ حاسبة من الصفر بكود HTML</Text>
              </View>
              <Ionicons name="chevron-back" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>

            <Text style={styles.templatesTitle}>أو اختر من القوالب الجاهزة:</Text>

            {TEMPLATES.map((template, index) => {
              const catInfo = getCategoryInfo(template.category);
              return (
                <TouchableOpacity 
                  key={index} 
                  style={styles.templateOption} 
                  onPress={() => useTemplate(template)}
                >
                  <View style={[styles.templateIcon, { backgroundColor: `${catInfo.color}20` }]}>
                    <Ionicons name={template.icon as any} size={28} color={catInfo.color} />
                  </View>
                  <View style={styles.templateInfo}>
                    <Text style={styles.templateTitle}>{template.name}</Text>
                    <Text style={styles.templateDesc}>{catInfo.label}</Text>
                  </View>
                  <Ionicons name="chevron-back" size={20} color={COLORS.textMuted} />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Modal>

      {/* Add/Edit Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.textMuted} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {editingCalc ? 'تعديل الحاسبة' : 'إضافة حاسبة جديدة'}
              </Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Title */}
              <Text style={styles.inputLabel}>العنوان *</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="اسم الحاسبة"
                placeholderTextColor={COLORS.textMuted}
                textAlign="right"
              />

              {/* Description */}
              <Text style={styles.inputLabel}>الوصف</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="وصف مختصر"
                placeholderTextColor={COLORS.textMuted}
                textAlign="right"
                multiline
                numberOfLines={2}
              />

              {/* Category */}
              <Text style={styles.inputLabel}>الفئة</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={category}
                  onValueChange={setCategory}
                  style={styles.picker}
                >
                  {CATEGORIES.map(cat => (
                    <Picker.Item key={cat.value} label={cat.label} value={cat.value} />
                  ))}
                </Picker>
              </View>

              {/* Icon */}
              <Text style={styles.inputLabel}>الأيقونة</Text>
              <View style={styles.iconsGrid}>
                {ICONS.map((iconName) => (
                  <TouchableOpacity
                    key={iconName}
                    style={[styles.iconOption, icon === iconName && styles.iconOptionSelected]}
                    onPress={() => setIcon(iconName)}
                  >
                    <Ionicons name={iconName as any} size={24} color={icon === iconName ? COLORS.white : COLORS.textSecondary} />
                  </TouchableOpacity>
                ))}
              </View>

              {/* HTML Content */}
              <Text style={styles.inputLabel}>كود HTML/CSS/JavaScript *</Text>
              <TextInput
                style={[styles.input, styles.codeArea]}
                value={htmlContent}
                onChangeText={setHtmlContent}
                placeholder="<!DOCTYPE html>..."
                placeholderTextColor={COLORS.textMuted}
                textAlign="left"
                multiline
                numberOfLines={10}
              />

              {/* Active Switch */}
              <View style={styles.switchRow}>
                <Switch
                  value={isActive}
                  onValueChange={setIsActive}
                  trackColor={{ false: COLORS.border, true: COLORS.tealLight }}
                  thumbColor={isActive ? COLORS.teal : COLORS.textMuted}
                />
                <Text style={styles.switchLabel}>نشط ومرئي للمستخدمين</Text>
              </View>

              {/* Save Button */}
              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <>
                    <Ionicons name={editingCalc ? "checkmark" : "add"} size={22} color={COLORS.white} />
                    <Text style={styles.saveBtnText}>
                      {editingCalc ? 'حفظ التغييرات' : 'إضافة الحاسبة'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.teal},
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center'},
  headerTitle: { fontSize: 20, fontFamily: FONTS.bold, color: COLORS.white },
  addBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center'},

  statsRow: { flexDirection: 'row', padding: SPACING.md, gap: SPACING.sm },
  statCard: {
    flex: 1, backgroundColor: COLORS.white, borderRadius: RADIUS.md,
    padding: SPACING.md, alignItems: 'center', ...SHADOWS.sm},
  statNumber: { fontSize: 24, fontFamily: FONTS.bold, color: COLORS.teal, marginTop: 4 },
  statLabel: { fontSize: 12, fontFamily: FONTS.regular, color: COLORS.textSecondary },

  content: { padding: SPACING.md, paddingBottom: 40 },

  emptyState: { alignItems: 'center', padding: SPACING['2xl'] },
  emptyText: { fontSize: 16, fontFamily: FONTS.semiBold, color: COLORS.textSecondary, marginTop: SPACING.md },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.teal,
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full, gap: 6, marginTop: SPACING.md},
  emptyBtnText: { fontSize: 14, fontFamily: FONTS.bold, color: COLORS.white },

  calcCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    padding: SPACING.md, marginBottom: SPACING.sm, ...SHADOWS.md},
  calcCardInactive: { opacity: 0.7 },
  calcHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  calcIcon: {
    width: 50, height: 50, borderRadius: RADIUS.md,
    justifyContent: 'center', alignItems: 'center', marginLeft: SPACING.sm},
  calcInfo: { flex: 1 },
  calcTitle: { fontSize: 16, fontFamily: FONTS.bold, color: COLORS.text, textAlign: 'right' },
  calcMeta: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 6, marginTop: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS.sm },
  badgeText: { fontSize: 11, fontFamily: FONTS.semiBold },
  calcDesc: {
    fontSize: 13, fontFamily: FONTS.regular, color: COLORS.textSecondary,
    textAlign: 'right', marginTop: SPACING.sm, lineHeight: 20},
  calcActions: {
    flexDirection: 'row', justifyContent: 'flex-end', gap: SPACING.sm,
    marginTop: SPACING.md, paddingTop: SPACING.sm,
    borderTopWidth: 1, borderTopColor: COLORS.border},
  actionBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm, backgroundColor: `${COLORS.teal}10`, gap: 4},
  actionBtnText: { fontSize: 13, fontFamily: FONTS.semiBold, color: COLORS.teal },
  deleteBtn: { backgroundColor: COLORS.errorLight },

  modalOverlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: COLORS.white, borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl, padding: SPACING.lg, maxHeight: '90%'},
  templatesModal: {
    backgroundColor: COLORS.white, borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl, padding: SPACING.lg, maxHeight: '70%'},
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: SPACING.lg},
  modalTitle: { fontSize: 20, fontFamily: FONTS.bold, color: COLORS.teal },

  templatesTitle: {
    fontSize: 14, fontFamily: FONTS.semiBold, color: COLORS.textSecondary,
    textAlign: 'right', marginTop: SPACING.lg, marginBottom: SPACING.sm},
  templateOption: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.beige, borderRadius: RADIUS.md,
    padding: SPACING.md, marginBottom: SPACING.sm},
  templateIcon: {
    width: 50, height: 50, borderRadius: RADIUS.md,
    justifyContent: 'center', alignItems: 'center', marginLeft: SPACING.md},
  templateInfo: { flex: 1 },
  templateTitle: { fontSize: 15, fontFamily: FONTS.bold, color: COLORS.text, textAlign: 'right' },
  templateDesc: { fontSize: 12, fontFamily: FONTS.regular, color: COLORS.textSecondary, textAlign: 'right' },

  inputLabel: {
    fontSize: 14, fontFamily: FONTS.semiBold, color: COLORS.text,
    textAlign: 'right', marginBottom: 6, marginTop: SPACING.sm},
  input: {
    backgroundColor: COLORS.beige, borderRadius: RADIUS.md, padding: SPACING.md,
    fontSize: 15, fontFamily: FONTS.regular, color: COLORS.text,
    borderWidth: 1, borderColor: COLORS.border},
  textArea: { minHeight: 60, textAlignVertical: 'top' },
  codeArea: { minHeight: 150, textAlignVertical: 'top', fontFamily: 'monospace' },
  pickerContainer: {
    backgroundColor: COLORS.beige, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden'},
  picker: { height: 50 },
  iconsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  iconOption: {
    width: 48, height: 48, borderRadius: RADIUS.md,
    backgroundColor: COLORS.beige, justifyContent: 'center', alignItems: 'center'},
  iconOptionSelected: { backgroundColor: COLORS.teal },
  switchRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end',
    marginTop: SPACING.md, gap: SPACING.sm},
  switchLabel: { fontSize: 14, fontFamily: FONTS.regular, color: COLORS.text },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.teal, padding: SPACING.md, borderRadius: RADIUS.md,
    gap: 8, marginTop: SPACING.lg, marginBottom: SPACING.xl},
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { fontSize: 18, fontFamily: FONTS.bold, color: COLORS.white }});
