import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFonts, Cairo_400Regular, Cairo_700Bold } from '@expo-google-fonts/cairo';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'general' | 'trainee' | 'coach' | 'payment' | 'terms';
}

const FAQ_DATA: FAQItem[] = [
  // أسئلة عامة
  {
    id: '1',
    question: 'ما هو تطبيق Ask Yazo؟',
    answer: 'Ask Yazo هو تطبيق متكامل للتدريب الشامل على الحياة (Holistic Life Coaching)، يربط بين المتدربين والمدربين المحترفين لمساعدتهم في تحقيق التوازن في جميع جوانب حياتهم.',
    category: 'general'
  },
  {
    id: '2',
    question: 'ما هي الركائز الأربع للتوازن؟',
    answer: 'الركائز الأربع هي: الصحة الجسدية، الصحة النفسية والعاطفية، العلاقات والحياة الاجتماعية، والنمو المهني. نعمل على تحقيق التوازن بين هذه الجوانب لحياة أفضل.',
    category: 'general'
  },
  {
    id: '3',
    question: 'هل التطبيق مجاني؟',
    answer: 'نعم، التطبيق مجاني للمتدربين. يمكنك استخدام أدوات التقييم الذاتي ومتتبع العادات مجاناً. تكلفة جلسات التدريب تحدد من قبل كل مدرب.',
    category: 'general'
  },

  // أسئلة المتدربين
  {
    id: '4',
    question: 'كيف أبدأ مع مدرب؟',
    answer: '1. تصفح قائمة المدربين من الصفحة الرئيسية\n2. اطلع على بروفايل المدرب وتخصصاته\n3. اختر الباقة المناسبة\n4. أكد الحجز وانتظر موافقة المدرب',
    category: 'trainee'
  },
  {
    id: '5',
    question: 'كيف أستخدم عجلة الحياة؟',
    answer: 'عجلة الحياة أداة تقييم ذاتي تساعدك على تحديد مستوى رضاك في 8 جوانب مختلفة من حياتك. حرّك المؤشر لكل جانب من 1 إلى 10 لرؤية الصورة الكاملة لتوازن حياتك.',
    category: 'trainee'
  },
  {
    id: '6',
    question: 'هل يمكنني إلغاء الحجز؟',
    answer: 'نعم، يمكنك إلغاء الحجز قبل 24 ساعة من موعد الجلسة. التواصل مع المدرب مباشرة لترتيب الإلغاء أو إعادة الجدولة.',
    category: 'trainee'
  },

  // أسئلة المدربين
  {
    id: '7',
    question: 'كيف أصبح مدرباً على المنصة؟',
    answer: '1. سجل حساب جديد كمدرب\n2. أكمل بروفايلك (السيرة، التخصصات، السعر)\n3. اشترك في المنصة (شهري أو سنوي)\n4. أنشئ باقاتك التدريبية\n5. ابدأ استقبال المتدربين',
    category: 'coach'
  },
  {
    id: '8',
    question: 'كيف أحدد أسعار باقاتي؟',
    answer: 'يمكنك تحديد سعر الساعة ضمن الحدود التي يحددها مدير المنصة. هذا يضمن تنافسية عادلة وجودة للمتدربين.',
    category: 'coach'
  },
  {
    id: '9',
    question: 'كيف أستلم مستحقاتي؟',
    answer: 'يتم تحويل مستحقاتك دورياً من قبل إدارة المنصة. تواصل مع الدعم لترتيب طريقة التحويل المناسبة لك.',
    category: 'coach'
  },

  // الدفع
  {
    id: '10',
    question: 'ما هي طرق الدفع المتاحة؟',
    answer: 'حالياً يتم الدفع مباشرة للمنصة عبر التحويل البنكي أو المحافظ الإلكترونية. تواصل مع المدرب لترتيب الدفع.',
    category: 'payment'
  },
  {
    id: '11',
    question: 'هل يوجد ضمان استرداد الأموال؟',
    answer: 'نعم، إذا لم تكن راضياً عن الجلسة الأولى، يمكنك طلب استرداد كامل خلال 48 ساعة. تواصل مع الدعم لتقديم الطلب.',
    category: 'payment'
  },

  // الشروط
  {
    id: '12',
    question: 'ما هي شروط الاستخدام؟',
    answer: 'باستخدامك للتطبيق فإنك توافق على:\n• عدم استخدام المنصة لأي غرض غير قانوني\n• عدم انتحال شخصية أخرى\n• احترام خصوصية الآخرين\n• عدم نشر محتوى مسيء',
    category: 'terms'
  },
  {
    id: '13',
    question: 'ما هي التجاوزات المحظورة؟',
    answer: '⚠️ تحذير: التجاوزات التالية ستؤدي لإيقاف حسابك فوراً:\n\n• محاولة التحايل على نظام الدفع\n• التواصل خارج المنصة للتهرب من الرسوم\n• إنشاء حسابات وهمية متعددة\n• التحرش أو الإساءة للآخرين\n• نشر معلومات كاذبة أو مضللة\n• استخدام المنصة للترويج لخدمات خارجية',
    category: 'terms'
  },
  {
    id: '14',
    question: 'ماذا يحدث عند مخالفة الشروط؟',
    answer: '⚠️ عند اكتشاف أي مخالفة:\n\n1. إنذار أولي (للمخالفات البسيطة)\n2. تعليق الحساب مؤقتاً\n3. حظر دائم من المنصة\n4. اتخاذ إجراءات قانونية إذا لزم الأمر\n\nنحتفظ بحق اتخاذ الإجراء المناسب حسب جسامة المخالفة.',
    category: 'terms'
  },
  {
    id: '15',
    question: 'كيف يتم حماية بياناتي؟',
    answer: 'نلتزم بحماية خصوصيتك:\n\n• تشفير جميع البيانات الشخصية\n• عدم مشاركة بياناتك مع أطراف ثالثة\n• إمكانية حذف حسابك وبياناتك بالكامل\n• الالتزام بقوانين حماية البيانات',
    category: 'terms'
  }
];

const CATEGORIES = [
  { id: 'all', name: 'الكل', icon: 'apps' },
  { id: 'general', name: 'عام', icon: 'information-circle' },
  { id: 'trainee', name: 'للمتدربين', icon: 'person' },
  { id: 'coach', name: 'للمدربين', icon: 'school' },
  { id: 'payment', name: 'الدفع', icon: 'card' },
  { id: 'terms', name: 'الشروط', icon: 'shield-checkmark' },
];

export default function HelpScreen() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const router = useRouter();

  const [fontsLoaded] = useFonts({ Cairo_400Regular, Cairo_700Bold });

  const filteredFAQs = selectedCategory === 'all'
    ? FAQ_DATA
    : FAQ_DATA.filter(f => f.category === selectedCategory);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>المساعدة والدعم</Text>
      </View>

      <View style={styles.intro}>
        <Ionicons name="help-buoy" size={40} color="#FF9800" />
        <Text style={styles.introTitle}>كيف يمكننا مساعدتك؟</Text>
        <Text style={styles.introText}>
          ابحث عن إجابات لأسئلتك الشائعة أدناه
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesScroll}
        contentContainerStyle={styles.categoriesContent}
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.categoryBtn,
              selectedCategory === cat.id && styles.categoryBtnActive
            ]}
            onPress={() => setSelectedCategory(cat.id)}
          >
            <Ionicons
              name={cat.icon as any}
              size={16}
              color={selectedCategory === cat.id ? '#fff' : '#666'}
            />
            <Text style={[
              styles.categoryText,
              selectedCategory === cat.id && styles.categoryTextActive
            ]}>{cat.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.content}>
        {filteredFAQs.map((faq) => (
          <TouchableOpacity
            key={faq.id}
            style={styles.faqCard}
            onPress={() => setExpandedId(expandedId === faq.id ? null : faq.id)}
            activeOpacity={0.8}
          >
            <View style={styles.faqHeader}>
              <Ionicons
                name={expandedId === faq.id ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#FF9800"
              />
              <Text style={styles.faqQuestion}>{faq.question}</Text>
              <View style={[
                styles.faqIcon,
                { backgroundColor: faq.category === 'terms' ? '#FFEBEE' : '#FFF3E0' }
              ]}>
                <Ionicons
                  name={faq.category === 'terms' ? 'shield-checkmark' : 'help-circle'}
                  size={20}
                  color={faq.category === 'terms' ? '#F44336' : '#FF9800'}
                />
              </View>
            </View>
            {expandedId === faq.id && (
              <View style={styles.faqAnswer}>
                <Text style={styles.faqAnswerText}>{faq.answer}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}

        {/* قسم التواصل */}
        <View style={styles.contactSection}>
          <Text style={styles.contactTitle}>لم تجد إجابتك؟</Text>
          <Text style={styles.contactText}>
            تواصل معنا مباشرة وسنرد عليك في أقرب وقت
          </Text>
          <View style={styles.contactButtons}>
            <TouchableOpacity style={styles.contactBtn}>
              <Ionicons name="mail" size={22} color="#2196F3" />
              <Text style={styles.contactBtnText}>support@askyazo.com</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* التحذيرات */}
        <View style={styles.warningSection}>
          <View style={styles.warningHeader}>
            <Ionicons name="warning" size={24} color="#F44336" />
            <Text style={styles.warningTitle}>تحذيرات هامة</Text>
          </View>
          <Text style={styles.warningText}>
            • لا تشارك بيانات حسابك مع أي شخص{"\n"}
            • لا تحوّل أموال خارج المنصة{"\n"}
            • المدرب الحقيقي لن يطلب بيانات شخصية حساسة{"\n"}
            • أبلغ عن أي سلوك مشبوه فوراً
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FF9800',
  },
  backBtn: {
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

  intro: {
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  introTitle: {
    fontSize: 20,
    fontFamily: 'Cairo_700Bold',
    color: '#333',
    marginTop: 12,
  },
  introText: {
    fontSize: 14,
    fontFamily: 'Cairo_400Regular',
    color: '#666',
    marginTop: 4,
  },

  categoriesScroll: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  categoriesContent: {
    padding: 12,
    gap: 8,
  },
  categoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    gap: 6,
  },
  categoryBtnActive: {
    backgroundColor: '#FF9800',
  },
  categoryText: {
    fontSize: 13,
    fontFamily: 'Cairo_700Bold',
    color: '#666',
  },
  categoryTextActive: {
    color: '#fff',
  },

  content: {
    padding: 16,
    paddingBottom: 40,
  },

  faqCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 10,
    overflow: 'hidden',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  faqIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Cairo_700Bold',
    color: '#333',
    textAlign: 'right',
    lineHeight: 24,
  },
  faqAnswer: {
    padding: 16,
    paddingTop: 0,
    backgroundColor: '#FAFAFA',
  },
  faqAnswerText: {
    fontSize: 14,
    fontFamily: 'Cairo_400Regular',
    color: '#555',
    textAlign: 'right',
    lineHeight: 24,
  },

  contactSection: {
    alignItems: 'center',
    padding: 24,
    marginTop: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
  },
  contactTitle: {
    fontSize: 18,
    fontFamily: 'Cairo_700Bold',
    color: '#333',
  },
  contactText: {
    fontSize: 14,
    fontFamily: 'Cairo_400Regular',
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  contactButtons: {
    marginTop: 16,
  },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 10,
  },
  contactBtnText: {
    fontSize: 14,
    fontFamily: 'Cairo_700Bold',
    color: '#2196F3',
  },

  warningSection: {
    backgroundColor: '#FFEBEE',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    marginBottom: 12,
  },
  warningTitle: {
    fontSize: 16,
    fontFamily: 'Cairo_700Bold',
    color: '#F44336',
  },
  warningText: {
    fontSize: 14,
    fontFamily: 'Cairo_400Regular',
    color: '#C62828',
    textAlign: 'right',
    lineHeight: 26,
  },
});
