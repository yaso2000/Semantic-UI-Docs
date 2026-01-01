import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Cairo_400Regular, Cairo_700Bold } from '@expo-google-fonts/cairo';
import { useRouter } from 'expo-router';

const allValues = [
  { id: 'family', name: 'العائلة', icon: 'people', color: '#E91E63' },
  { id: 'health', name: 'الصحة', icon: 'fitness', color: '#4CAF50' },
  { id: 'faith', name: 'الإيمان', icon: 'heart', color: '#9C27B0' },
  { id: 'success', name: 'النجاح', icon: 'trophy', color: '#FF9800' },
  { id: 'freedom', name: 'الحرية', icon: 'airplane', color: '#2196F3' },
  { id: 'knowledge', name: 'المعرفة', icon: 'book', color: '#795548' },
  { id: 'creativity', name: 'الإبداع', icon: 'color-palette', color: '#FF5722' },
  { id: 'honesty', name: 'الصدق', icon: 'shield-checkmark', color: '#009688' },
  { id: 'love', name: 'الحب', icon: 'heart-circle', color: '#F44336' },
  { id: 'peace', name: 'السلام', icon: 'leaf', color: '#8BC34A' },
  { id: 'wealth', name: 'الثروة', icon: 'cash', color: '#FFC107' },
  { id: 'adventure', name: 'المغامرة', icon: 'compass', color: '#00BCD4' },
  { id: 'respect', name: 'الاحترام', icon: 'ribbon', color: '#673AB7' },
  { id: 'loyalty', name: 'الوفاء', icon: 'hand-left', color: '#3F51B5' },
  { id: 'justice', name: 'العدل', icon: 'scale', color: '#607D8B' },
  { id: 'gratitude', name: 'الامتنان', icon: 'happy', color: '#FFEB3B' },
  { id: 'courage', name: 'الشجاعة', icon: 'flash', color: '#FF5722' },
  { id: 'compassion', name: 'الرحمة', icon: 'heart-half', color: '#E91E63' },
  { id: 'growth', name: 'التطور', icon: 'trending-up', color: '#4CAF50' },
  { id: 'balance', name: 'التوازن', icon: 'git-compare', color: '#9E9E9E' },
];

export default function CoreValuesScreen() {
  const router = useRouter();
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);
  
  const [fontsLoaded] = useFonts({ Cairo_400Regular, Cairo_700Bold });

  const toggleValue = (id: string) => {
    if (selectedValues.includes(id)) {
      setSelectedValues(selectedValues.filter(v => v !== id));
    } else if (selectedValues.length < 5) {
      setSelectedValues([...selectedValues, id]);
    } else {
      Alert.alert('تنبيه', 'يمكنك اختيار 5 قيم فقط. أزل قيمة لإضافة أخرى.');
    }
  };

  const showMyValues = () => {
    if (selectedValues.length < 5) {
      Alert.alert('تنبيه', `اختر ${5 - selectedValues.length} قيم أخرى لإكمال القائمة`);
      return;
    }
    setShowResults(true);
  };

  const resetSelection = () => {
    setSelectedValues([]);
    setShowResults(false);
  };

  const getSelectedValuesData = () => {
    return selectedValues.map(id => allValues.find(v => v.id === id)!).filter(Boolean);
  };

  if (!fontsLoaded) return null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navigationHeader}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>القيم الأساسية</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {!showResults ? (
          <>
            <View style={styles.header}>
              <Ionicons name="diamond" size={50} color="#9C27B0" />
              <Text style={styles.title}>اكتشف قيمك الأساسية</Text>
              <Text style={styles.subtitle}>
                اختر أهم 5 قيم تعبر عن شخصيتك وتوجه حياتك
              </Text>
            </View>

            <View style={styles.counter}>
              <Text style={styles.counterText}>
                المختار: {selectedValues.length} / 5
              </Text>
              <View style={styles.counterDots}>
                {[1, 2, 3, 4, 5].map(i => (
                  <View
                    key={i}
                    style={[
                      styles.counterDot,
                      i <= selectedValues.length && styles.counterDotActive,
                    ]}
                  />
                ))}
              </View>
            </View>

            <View style={styles.valuesGrid}>
              {allValues.map((value) => {
                const isSelected = selectedValues.includes(value.id);
                const order = selectedValues.indexOf(value.id) + 1;
                
                return (
                  <TouchableOpacity
                    key={value.id}
                    style={[
                      styles.valueCard,
                      isSelected && { backgroundColor: value.color + '20', borderColor: value.color },
                    ]}
                    onPress={() => toggleValue(value.id)}
                  >
                    {isSelected && (
                      <View style={[styles.orderBadge, { backgroundColor: value.color }]}>
                        <Text style={styles.orderText}>{order}</Text>
                      </View>
                    )}
                    <Ionicons
                      name={value.icon as any}
                      size={32}
                      color={isSelected ? value.color : '#666'}
                    />
                    <Text style={[
                      styles.valueName,
                      isSelected && { color: value.color, fontFamily: 'Cairo_700Bold' },
                    ]}>
                      {value.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={[styles.submitButton, selectedValues.length < 5 && styles.submitButtonDisabled]}
              onPress={showMyValues}
            >
              <Text style={styles.submitButtonText}>عرض قيمي الأساسية</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.resultsContainer}>
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsEmoji}>⭐</Text>
              <Text style={styles.resultsTitle}>قيمك الأساسية الخمس</Text>
              <Text style={styles.resultsSubtitle}>
                هذه القيم تمثل ما هو أهم في حياتك
              </Text>
            </View>

            <View style={styles.resultsGrid}>
              {getSelectedValuesData().map((value, index) => (
                <View
                  key={value.id}
                  style={[styles.resultCard, { borderColor: value.color }]}
                >
                  <View style={[styles.resultRank, { backgroundColor: value.color }]}>
                    <Text style={styles.resultRankText}>{index + 1}</Text>
                  </View>
                  <Ionicons name={value.icon as any} size={40} color={value.color} />
                  <Text style={[styles.resultName, { color: value.color }]}>{value.name}</Text>
                </View>
              ))}
            </View>

            <View style={styles.reflectionBox}>
              <Text style={styles.reflectionTitle}>💭 تأمل</Text>
              <Text style={styles.reflectionText}>
                كيف تعكس قراراتك اليومية هذه القيم؟{"\n"}
                هل حياتك الحالية متوافقة مع هذه القيم؟{"\n"}
                ما الذي يمكنك تغييره لتعيش وفقاً لقيمك؟
              </Text>
            </View>

            <TouchableOpacity style={styles.resetButton} onPress={resetSelection}>
              <Text style={styles.resetButtonText}>إعادة الاختيار</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
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
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navTitle: { fontSize: 18, fontFamily: 'Cairo_700Bold', color: '#333' },
  content: { padding: 20 },
  header: { alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 24, fontFamily: 'Cairo_700Bold', color: '#333', marginTop: 12 },
  subtitle: { fontSize: 14, fontFamily: 'Cairo_400Regular', color: '#666', marginTop: 8, textAlign: 'center', lineHeight: 22 },
  counter: { alignItems: 'center', marginBottom: 20 },
  counterText: { fontSize: 16, fontFamily: 'Cairo_700Bold', color: '#9C27B0', marginBottom: 8 },
  counterDots: { flexDirection: 'row', gap: 8 },
  counterDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#e0e0e0' },
  counterDotActive: { backgroundColor: '#9C27B0' },
  valuesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  valueCard: {
    width: '31%',
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  orderBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderText: { fontSize: 12, fontFamily: 'Cairo_700Bold', color: '#fff' },
  valueName: { fontSize: 12, fontFamily: 'Cairo_400Regular', color: '#666', marginTop: 8, textAlign: 'center' },
  submitButton: {
    backgroundColor: '#9C27B0',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: { backgroundColor: '#ccc' },
  submitButtonText: { fontSize: 18, fontFamily: 'Cairo_700Bold', color: '#fff' },
  resultsContainer: { alignItems: 'center' },
  resultsHeader: { alignItems: 'center', marginBottom: 24 },
  resultsEmoji: { fontSize: 60 },
  resultsTitle: { fontSize: 24, fontFamily: 'Cairo_700Bold', color: '#333', marginTop: 12 },
  resultsSubtitle: { fontSize: 14, fontFamily: 'Cairo_400Regular', color: '#666', marginTop: 8 },
  resultsGrid: { width: '100%', gap: 12 },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    gap: 16,
  },
  resultRank: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultRankText: { fontSize: 18, fontFamily: 'Cairo_700Bold', color: '#fff' },
  resultName: { fontSize: 18, fontFamily: 'Cairo_700Bold', flex: 1, textAlign: 'right' },
  reflectionBox: {
    backgroundColor: '#F3E5F5',
    borderRadius: 16,
    padding: 20,
    marginTop: 24,
    width: '100%',
  },
  reflectionTitle: { fontSize: 18, fontFamily: 'Cairo_700Bold', color: '#9C27B0', marginBottom: 12 },
  reflectionText: { fontSize: 14, fontFamily: 'Cairo_400Regular', color: '#666', lineHeight: 26, textAlign: 'right' },
  resetButton: {
    backgroundColor: '#9C27B0',
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
  },
  resetButtonText: { fontSize: 16, fontFamily: 'Cairo_700Bold', color: '#fff' },
});