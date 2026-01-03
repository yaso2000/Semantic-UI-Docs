import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFonts, Alexandria_400Regular, Alexandria_600SemiBold, Alexandria_700Bold } from '@expo-google-fonts/alexandria';
import { COLORS, FONTS, SHADOWS, RADIUS, SPACING } from '../src/constants/theme';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'general' | 'trainee' | 'payment' | 'terms';
}

const FAQ_DATA: FAQItem[] = [
  {
    id: '1',
    question: 'ما هو تطبيق Ask Yazo؟',
    answer: 'Ask Yazo هو تطبيق متكامل للتدريب الشامل على الحياة (Holistic Life Coaching)، يربطك مباشرة بيازو لمساعدتك في تحقيق التوازن في جميع جوانب حياتك.',
    category: 'general'
  },
  {
    id: '2',
    question: 'ما هي الركائز الأربع للتوازن؟',
    answer: 'الركائز الأربع هي: اللياقة البدنية، الصحة التغذوية، الصحة النفسية، والرفاهية الروحية. نعمل على تحقيق التوازن بين هذه الجوانب لحياة أفضل.',
    category: 'general'
  },
  {
    id: '3',
    question: 'هل التطبيق مجاني؟',
    answer: 'نعم، التطبيق مجاني. يمكنك استخدام أدوات التقييم الذاتي ومتتبع العادات مجاناً. تكلفة جلسات التدريب تحدد حسب الباقات المتاحة.',
    category: 'general'
  },
  {
    id: '4',
    question: 'كيف أبدأ مع يازو؟',
    answer: '1. سجل حسابك في التطبيق\n2. اذهب لصفحة الحجوزات\n3. اختر الباقة المناسبة\n4. أكد الحجز وابدأ رحلتك',
    category: 'trainee'
  },
  {
    id: '5',
    question: 'كيف أستخدم عجلة الحياة؟',
    answer: 'عجلة الحياة أداة تقييم ذاتي تساعدك على تحديد مستوى رضاك في 8 جوانب مختلفة من حياتك. حرّك المؤشر لكل جانب من 1 إلى 10 لرؤية الصورة الكاملة.',
    category: 'trainee'
  },
  {
    id: '6',
    question: 'هل يمكنني إلغاء الحجز؟',
    answer: 'نعم، يمكنك إلغاء الحجز قبل 24 ساعة من موعد الجلسة. تواصل مع يازو مباشرة لترتيب الإلغاء أو إعادة الجدولة.',
    category: 'trainee'
  },
  {
    id: '10',
    question: 'ما هي طرق الدفع المتاحة؟',
    answer: 'حالياً يتم الدفع مباشرة عبر التحويل البنكي أو المحافظ الإلكترونية. تواصل مع يازو لترتيب الدفع.',
    category: 'payment'
  },
  {
    id: '11',
    question: 'هل يوجد ضمان استرداد الأموال؟',
    answer: 'نعم، إذا لم تكن راضياً عن الجلسة الأولى، يمكنك طلب استرداد كامل خلال 48 ساعة. تواصل مع الدعم لتقديم الطلب.',
    category: 'payment'
  },
  {
    id: '12',
    question: 'ما هي شروط الاستخدام؟',
    answer: 'باستخدامك للتطبيق فإنك توافق على:\n• عدم استخدام المنصة لأي غرض غير قانوني\n• عدم انتحال شخصية أخرى\n• احترام خصوصية الآخرين\n• عدم نشر محتوى مسيء',
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
  { id: 'payment', name: 'الدفع', icon: 'card' },
  { id: 'terms', name: 'الشروط', icon: 'shield-checkmark' },
];

export default function HelpScreen() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const router = useRouter();

  const [fontsLoaded] = useFonts({ Alexandria_400Regular, Alexandria_600SemiBold, Alexandria_700Bold });

  const filteredFAQs = selectedCategory === 'all'
    ? FAQ_DATA
    : FAQ_DATA.filter(f => f.category === selectedCategory);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>المساعدة والدعم</Text>
      </View>

      {/* Intro */}
      <View style={styles.intro}>
        <View style={styles.introIcon}>
          <Ionicons name="help-buoy" size={36} color={COLORS.teal} />
        </View>
        <Text style={styles.introTitle}>كيف يمكننا مساعدتك؟</Text>
        <Text style={styles.introText}>
          ابحث عن إجابات لأسئلتك الشائعة أدناه
        </Text>
      </View>

      {/* Categories */}
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
              color={selectedCategory === cat.id ? COLORS.white : COLORS.textSecondary}
            />
            <Text style={[
              styles.categoryText,
              selectedCategory === cat.id && styles.categoryTextActive
            ]}>{cat.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* FAQ List */}
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
                color={COLORS.teal}
              />
              <Text style={styles.faqQuestion}>{faq.question}</Text>
              <View style={styles.faqIcon}>
                <Ionicons
                  name={faq.category === 'terms' ? 'shield-checkmark' : 'help-circle'}
                  size={20}
                  color={COLORS.teal}
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

        {/* Contact Section */}
        <View style={styles.contactSection}>
          <Text style={styles.contactTitle}>لم تجد إجابتك؟</Text>
          <Text style={styles.contactText}>
            تواصل معنا مباشرة وسنرد عليك في أقرب وقت
          </Text>
          <View style={styles.contactButtons}>
            <TouchableOpacity style={styles.contactBtn}>
              <Ionicons name="mail" size={22} color={COLORS.teal} />
              <Text style={styles.contactBtnText}>support@askyazo.com</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Warning Section */}
        <View style={styles.warningSection}>
          <View style={styles.warningHeader}>
            <Ionicons name="warning" size={24} color={COLORS.error} />
            <Text style={styles.warningTitle}>تحذيرات هامة</Text>
          </View>
          <Text style={styles.warningText}>
            • لا تشارك بيانات حسابك مع أي شخص{"\n"}
            • لا تحوّل أموال خارج المنصة{"\n"}
            • أبلغ عن أي سلوك مشبوه فوراً
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background 
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
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: COLORS.white,
    textAlign: 'right',
  },

  intro: {
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  introIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.beige,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  introTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  introText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginTop: 4,
  },

  categoriesScroll: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  categoriesContent: {
    padding: SPACING.sm,
    gap: 8,
  },
  categoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.beige,
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryBtnActive: {
    backgroundColor: COLORS.teal,
    borderColor: COLORS.teal,
  },
  categoryText: {
    fontSize: 13,
    fontFamily: FONTS.semiBold,
    color: COLORS.textSecondary,
  },
  categoryTextActive: {
    color: COLORS.white,
  },

  content: {
    padding: SPACING.md,
    paddingBottom: 40,
  },

  faqCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    marginBottom: 10,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  faqIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.beige,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 15,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
    textAlign: 'right',
    lineHeight: 24,
  },
  faqAnswer: {
    padding: SPACING.md,
    paddingTop: 0,
    backgroundColor: COLORS.beige,
  },
  faqAnswerText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'right',
    lineHeight: 24,
  },

  contactSection: {
    alignItems: 'center',
    padding: SPACING.lg,
    marginTop: SPACING.md,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    ...SHADOWS.md,
  },
  contactTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  contactText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  contactButtons: {
    marginTop: SPACING.md,
  },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.beige,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: RADIUS.md,
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.teal,
  },
  contactBtnText: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    color: COLORS.teal,
  },

  warningSection: {
    backgroundColor: COLORS.errorLight,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginTop: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.error,
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
    fontFamily: FONTS.bold,
    color: COLORS.error,
  },
  warningText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.error,
    textAlign: 'right',
    lineHeight: 26,
  },
});
