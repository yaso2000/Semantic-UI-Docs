import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  
  TextInput} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Cairo_400Regular, Cairo_700Bold } from '@expo-google-fonts/cairo';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const dailyPrompts = [
  'ما الذي جعلك تبتسم اليوم؟',
  'ما هو أكبر تحدٍ واجهته اليوم وكيف تعاملت معه؟',
  'ما الذي تعلمته عن نفسك اليوم؟',
  'من هو الشخص الذي أثر فيك إيجابياً اليوم؟',
  'ما هي اللحظة التي شعرت فيها بالامتنان اليوم؟',
  'ما الذي كنت تتمنى فعله بشكل مختلف اليوم؟',
  'ما هو الشيء الصغير الذي أسعدك اليوم؟',
];

const weeklyPrompts = [
  'ما هي أهم ثلاثة إنجازات حققتها هذا الأسبوع؟',
  'ما الذي تعلمته عن نفسك هذا الأسبوع؟',
  'كيف ساهمت في حياة الآخرين هذا الأسبوع؟',
  'ما هي العادة التي تريد تغييرها الأسبوع القادم؟',
  'ما هو أكبر خوف واجهته هذا الأسبوع؟',
];

const deepPrompts = [
  'لو كان لديك ضمان بالنجاح، ما الذي ستحاول فعله؟',
  'ما هي القصة التي تخبرها لنفسك عن حياتك؟',
  'ما الذي ستنصح به نفسك قبل 10 سنوات؟',
  'ما هو الإرث الذي تريد تركه للعالم؟',
  'لو كان هذا آخر يوم في حياتك، ما الذي ستفعله؟',
  'ما هو الشيء الذي تخاف أن تعترف به لنفسك؟',
  'ما هو حلمك الذي تخليت عنه؟ لماذا؟',
  'ما هي النسخة الأفضل منك؟ كيف تبدو؟',
];

export default function ReflectionPromptsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [category, setCategory] = useState<'daily' | 'weekly' | 'deep'>('daily');
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [reflection, setReflection] = useState('');
  const [saved, setSaved] = useState(false);
  
  const [fontsLoaded] = useFonts({ Cairo_400Regular, Cairo_700Bold });

  useEffect(() => {
    getRandomPrompt();
  }, [category]);

  const getRandomPrompt = () => {
    const prompts = category === 'daily' ? dailyPrompts : category === 'weekly' ? weeklyPrompts : deepPrompts;
    const randomIndex = Math.floor(Math.random() * prompts.length);
    setCurrentPrompt(prompts[randomIndex]);
    setReflection('');
    setSaved(false);
  };

  const saveReflection = async () => {
    if (!reflection.trim()) return;
    
    try {
      const entry = {
        date: new Date().toISOString(),
        category,
        prompt: currentPrompt,
        reflection: reflection.trim()};
      
      const data = await AsyncStorage.getItem('reflections');
      const reflections = data ? JSON.parse(data) : [];
      reflections.push(entry);
      await AsyncStorage.setItem('reflections', JSON.stringify(reflections));
      
      setSaved(true);
      setTimeout(() => {
        getRandomPrompt();
      }, 1500);
    } catch (error) {
      console.error('Error saving reflection:', error);
    }
  };

  const getCategoryColor = () => {
    switch (category) {
      case 'daily': return '#2196F3';
      case 'weekly': return '#FF9800';
      case 'deep': return '#9C27B0';
    }
  };

  if (!fontsLoaded) return null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.navigationHeader}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>تأملات عميقة</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Ionicons name="bulb" size={50} color={getCategoryColor()} />
          <Text style={styles.title}>رحلة التأمل الذاتي</Text>
          <Text style={styles.date}>
            {format(new Date(), 'EEEE، d MMMM yyyy', { locale: ar })}
          </Text>
        </View>

        <View style={styles.categoryTabs}>
          <TouchableOpacity
            style={[styles.categoryTab, category === 'daily' && { backgroundColor: '#2196F3' }]}
            onPress={() => setCategory('daily')}
          >
            <Ionicons name="today" size={20} color={category === 'daily' ? '#fff' : '#666'} />
            <Text style={[styles.categoryTabText, category === 'daily' && styles.categoryTabTextActive]}>يومي</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.categoryTab, category === 'weekly' && { backgroundColor: '#FF9800' }]}
            onPress={() => setCategory('weekly')}
          >
            <Ionicons name="calendar" size={20} color={category === 'weekly' ? '#fff' : '#666'} />
            <Text style={[styles.categoryTabText, category === 'weekly' && styles.categoryTabTextActive]}>أسبوعي</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.categoryTab, category === 'deep' && { backgroundColor: '#9C27B0' }]}
            onPress={() => setCategory('deep')}
          >
            <Ionicons name="infinite" size={20} color={category === 'deep' ? '#fff' : '#666'} />
            <Text style={[styles.categoryTabText, category === 'deep' && styles.categoryTabTextActive]}>عميق</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.promptCard, { borderColor: getCategoryColor() }]}>
          <View style={styles.promptHeader}>
            <Ionicons name="chatbubble-ellipses" size={24} color={getCategoryColor()} />
            <Text style={styles.promptLabel}>سؤال اليوم</Text>
          </View>
          <Text style={styles.promptText}>{currentPrompt}</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={getRandomPrompt}>
            <Ionicons name="refresh" size={20} color={getCategoryColor()} />
            <Text style={[styles.refreshText, { color: getCategoryColor() }]}>سؤال آخر</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.reflectionSection}>
          <Text style={styles.reflectionLabel}>تأملك:</Text>
          <TextInput
            style={styles.reflectionInput}
            placeholder="اكتب أفكارك ومشاعرك هنا..."
            value={reflection}
            onChangeText={setReflection}
            placeholderTextColor="#999"
            multiline
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[
            styles.saveButton,
            { backgroundColor: saved ? '#4CAF50' : getCategoryColor() },
            !reflection.trim() && styles.saveButtonDisabled,
          ]}
          onPress={saveReflection}
          disabled={!reflection.trim() || saved}
        >
          <Ionicons name={saved ? 'checkmark-circle' : 'save'} size={24} color="#fff" />
          <Text style={styles.saveButtonText}>
            {saved ? 'تم الحفظ! جاري تحميل سؤال جديد...' : 'حفظ التأمل'}
          </Text>
        </TouchableOpacity>

        <View style={styles.tipsBox}>
          <Text style={styles.tipsTitle}>💡 نصائح للتأمل الفعال</Text>
          <Text style={styles.tipText}>• خذ وقتك في التفكير قبل الكتابة</Text>
          <Text style={styles.tipText}>• كن صادقاً مع نفسك</Text>
          <Text style={styles.tipText}>• لا توجد إجابات صحيحة أو خاطئة</Text>
          <Text style={styles.tipText}>• اكتب بحرية دون حكم على نفسك</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  navigationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'},
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center'},
  navTitle: { fontSize: 18, fontFamily: 'Cairo_700Bold', color: '#333' },
  content: { padding: 20 },
  header: { alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 24, fontFamily: 'Cairo_700Bold', color: '#333', marginTop: 12 },
  date: { fontSize: 14, fontFamily: 'Cairo_400Regular', color: '#666', marginTop: 4 },
  categoryTabs: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  categoryTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#fff'},
  categoryTabText: { fontSize: 14, fontFamily: 'Cairo_400Regular', color: '#666' },
  categoryTabTextActive: { color: '#fff', fontFamily: 'Cairo_700Bold' },
  promptCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2},
  promptHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  promptLabel: { fontSize: 14, fontFamily: 'Cairo_700Bold', color: '#666' },
  promptText: { fontSize: 20, fontFamily: 'Cairo_700Bold', color: '#333', lineHeight: 34, textAlign: 'right' },
  refreshButton: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16, alignSelf: 'flex-start' },
  refreshText: { fontSize: 14, fontFamily: 'Cairo_400Regular' },
  reflectionSection: { marginBottom: 20 },
  reflectionLabel: { fontSize: 16, fontFamily: 'Cairo_700Bold', color: '#333', marginBottom: 12, textAlign: 'right' },
  reflectionInput: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Cairo_400Regular',
    color: '#333',
    minHeight: 150,
    textAlign: 'right'},
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 20},
  saveButtonDisabled: { backgroundColor: '#ccc' },
  saveButtonText: { fontSize: 16, fontFamily: 'Cairo_700Bold', color: '#fff' },
  tipsBox: {
    backgroundColor: '#E3F2FD',
    borderRadius: 16,
    padding: 20},
  tipsTitle: { fontSize: 16, fontFamily: 'Cairo_700Bold', color: '#1976D2', marginBottom: 12 },
  tipText: { fontSize: 14, fontFamily: 'Cairo_400Regular', color: '#1976D2', marginBottom: 6, textAlign: 'right' }});