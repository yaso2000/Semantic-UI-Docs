import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  
  Dimensions} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Cairo_400Regular, Cairo_700Bold } from '@expo-google-fonts/cairo';
import { useRouter } from 'expo-router';
import Svg, { Polygon, Circle, Line, Text as SvgText } from 'react-native-svg';
import { SaveResultButton } from '../../src/components/SaveResultButton';


const { width } = Dimensions.get('window');
const chartSize = width - 80;
const center = chartSize / 2;
const radius = chartSize / 2 - 40;

const lifeAreas = [
  { id: 'career', name: 'العمل والمهنة', icon: 'briefcase', color: '#2196F3' },
  { id: 'finance', name: 'المال والثروة', icon: 'cash', color: '#4CAF50' },
  { id: 'health', name: 'الصحة واللياقة', icon: 'fitness', color: '#FF5722' },
  { id: 'relationships', name: 'العلاقات', icon: 'people', color: '#E91E63' },
  { id: 'family', name: 'العائلة', icon: 'home', color: '#9C27B0' },
  { id: 'growth', name: 'التطور الشخصي', icon: 'trending-up', color: '#FF9800' },
  { id: 'fun', name: 'المرح والترفيه', icon: 'game-controller', color: '#00BCD4' },
  { id: 'spiritual', name: 'الروحانية', icon: 'heart', color: '#795548' },
];

export default function WheelOfLifeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [ratings, setRatings] = useState<Record<string, number>>(
    Object.fromEntries(lifeAreas.map(a => [a.id, 5]))
  );
  const [showResults, setShowResults] = useState(false);
  
  const [fontsLoaded] = useFonts({ Cairo_400Regular, Cairo_700Bold });

  const updateRating = (id: string, value: number) => {
    setRatings({ ...ratings, [id]: value });
  };

  const getAverageScore = () => {
    const values = Object.values(ratings);
    return (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
  };

  const getLowestAreas = () => {
    return lifeAreas
      .map(a => ({ ...a, rating: ratings[a.id] }))
      .sort((a, b) => a.rating - b.rating)
      .slice(0, 3);
  };

  const getPolygonPoints = () => {
    const points = lifeAreas.map((_, index) => {
      const angle = (index * 360 / 8 - 90) * (Math.PI / 180);
      const value = ratings[lifeAreas[index].id];
      const r = (value / 10) * radius;
      const x = center + r * Math.cos(angle);
      const y = center + r * Math.sin(angle);
      return `${x},${y}`;
    });
    return points.join(' ');
  };

  const getPointPosition = (index: number, value: number) => {
    const angle = (index * 360 / 8 - 90) * (Math.PI / 180);
    const r = (value / 10) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle)};
  };

  const getLabelPosition = (index: number) => {
    const angle = (index * 360 / 8 - 90) * (Math.PI / 180);
    const r = radius + 25;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle)};
  };

  if (!fontsLoaded) return null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.navigationHeader}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>عجلة الحياة</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Ionicons name="pie-chart" size={50} color="#9C27B0" />
          <Text style={styles.title}>عجلة الحياة التفاعلية</Text>
          <Text style={styles.subtitle}>
            قيّم رضاك في كل مجال من 1 إلى 10
          </Text>
        </View>

        {!showResults ? (
          <>
            <View style={styles.ratingsContainer}>
              {lifeAreas.map((area) => (
                <View key={area.id} style={styles.ratingRow}>
                  <View style={styles.ratingHeader}>
                    <View style={[styles.areaIcon, { backgroundColor: area.color }]}>
                      <Ionicons name={area.icon as any} size={20} color="#fff" />
                    </View>
                    <Text style={styles.areaName}>{area.name}</Text>
                    <Text style={[styles.ratingValue, { color: area.color }]}>
                      {ratings[area.id]}
                    </Text>
                  </View>
                  <View style={styles.sliderContainer}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <TouchableOpacity
                        key={num}
                        style={[
                          styles.sliderDot,
                          ratings[area.id] >= num && { backgroundColor: area.color },
                        ]}
                        onPress={() => updateRating(area.id, num)}
                      />
                    ))}
                  </View>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={() => setShowResults(true)}
            >
              <Ionicons name="analytics" size={24} color="#fff" />
              <Text style={styles.submitButtonText}>عرض التحليل</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.resultsContainer}>
            <View style={styles.chartContainer}>
              <Svg width={chartSize} height={chartSize}>
                {/* Background circles */}
                {[2, 4, 6, 8, 10].map((level) => (
                  <Circle
                    key={level}
                    cx={center}
                    cy={center}
                    r={(level / 10) * radius}
                    fill="none"
                    stroke="#e0e0e0"
                    strokeWidth={1}
                  />
                ))}
                
                {/* Axis lines */}
                {lifeAreas.map((_, index) => {
                  const pos = getPointPosition(index, 10);
                  return (
                    <Line
                      key={index}
                      x1={center}
                      y1={center}
                      x2={pos.x}
                      y2={pos.y}
                      stroke="#e0e0e0"
                      strokeWidth={1}
                    />
                  );
                })}
                
                {/* Data polygon */}
                <Polygon
                  points={getPolygonPoints()}
                  fill="rgba(156, 39, 176, 0.3)"
                  stroke="#9C27B0"
                  strokeWidth={2}
                />
                
                {/* Data points */}
                {lifeAreas.map((area, index) => {
                  const pos = getPointPosition(index, ratings[area.id]);
                  return (
                    <Circle
                      key={area.id}
                      cx={pos.x}
                      cy={pos.y}
                      r={6}
                      fill={area.color}
                    />
                  );
                })}
              </Svg>
              
              {/* Labels */}
              {lifeAreas.map((area, index) => {
                const pos = getLabelPosition(index);
                return (
                  <View
                    key={area.id}
                    style={[
                      styles.chartLabel,
                      { left: pos.x - 30, top: pos.y - 10 },
                    ]}
                  >
                    <Ionicons name={area.icon as any} size={16} color={area.color} />
                  </View>
                );
              })}
            </View>

            <View style={styles.scoreBox}>
              <Text style={styles.scoreLabel}>متوسط التوازن</Text>
              <Text style={styles.scoreValue}>{getAverageScore()}/10</Text>
            </View>

            <View style={styles.insightsBox}>
              <Text style={styles.insightsTitle}>📊 تحليل النتائج</Text>
              <Text style={styles.insightsSubtitle}>مجالات تحتاج اهتمام:</Text>
              {getLowestAreas().map((area) => (
                <View key={area.id} style={styles.insightItem}>
                  <View style={[styles.insightIcon, { backgroundColor: area.color }]}>
                    <Ionicons name={area.icon as any} size={16} color="#fff" />
                  </View>
                  <Text style={styles.insightName}>{area.name}</Text>
                  <Text style={[styles.insightRating, { color: area.color }]}>
                    {area.rating}/10
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.adviceBox}>
              <Text style={styles.adviceTitle}>💡 نصيحة</Text>
              <Text style={styles.adviceText}>
                ركز على تحسين المجالات ذات التقييم المنخفض. التوازن في الحياة يعني أن جميع المجالات تحظى باهتمام متساوٍ.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.resetButton}
              onPress={() => setShowResults(false)}
            >
              <Text style={styles.resetButtonText}>إعادة التقييم</Text>
            </TouchableOpacity>
          </View>
        )}
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
  header: { alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 24, fontFamily: 'Cairo_700Bold', color: '#333', marginTop: 12 },
  subtitle: { fontSize: 14, fontFamily: 'Cairo_400Regular', color: '#666', marginTop: 4 },
  ratingsContainer: { gap: 16 },
  ratingRow: { backgroundColor: '#fff', borderRadius: 16, padding: 16 },
  ratingHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  areaIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginLeft: 12 },
  areaName: { flex: 1, fontSize: 16, fontFamily: 'Cairo_700Bold', color: '#333', textAlign: 'right' },
  ratingValue: { fontSize: 20, fontFamily: 'Cairo_700Bold' },
  sliderContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  sliderDot: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#e0e0e0' },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#9C27B0',
    padding: 18,
    borderRadius: 16,
    gap: 10,
    marginTop: 24},
  submitButtonText: { fontSize: 18, fontFamily: 'Cairo_700Bold', color: '#fff' },
  resultsContainer: { alignItems: 'center' },
  chartContainer: { position: 'relative', marginBottom: 20 },
  chartLabel: { position: 'absolute', width: 60, alignItems: 'center' },
  scoreBox: { backgroundColor: '#9C27B0', borderRadius: 16, padding: 20, alignItems: 'center', width: '100%', marginBottom: 20 },
  scoreLabel: { fontSize: 16, fontFamily: 'Cairo_400Regular', color: '#E8D0F0' },
  scoreValue: { fontSize: 36, fontFamily: 'Cairo_700Bold', color: '#fff' },
  insightsBox: { backgroundColor: '#fff', borderRadius: 16, padding: 20, width: '100%', marginBottom: 16 },
  insightsTitle: { fontSize: 18, fontFamily: 'Cairo_700Bold', color: '#333', marginBottom: 12 },
  insightsSubtitle: { fontSize: 14, fontFamily: 'Cairo_400Regular', color: '#666', marginBottom: 12 },
  insightItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  insightIcon: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginLeft: 12 },
  insightName: { flex: 1, fontSize: 14, fontFamily: 'Cairo_400Regular', color: '#333', textAlign: 'right' },
  insightRating: { fontSize: 16, fontFamily: 'Cairo_700Bold' },
  adviceBox: { backgroundColor: '#F3E5F5', borderRadius: 16, padding: 20, width: '100%', marginBottom: 20 },
  adviceTitle: { fontSize: 16, fontFamily: 'Cairo_700Bold', color: '#7B1FA2', marginBottom: 8 },
  adviceText: { fontSize: 14, fontFamily: 'Cairo_400Regular', color: '#666', lineHeight: 24, textAlign: 'right' },
  resetButton: { backgroundColor: '#9C27B0', paddingHorizontal: 40, paddingVertical: 14, borderRadius: 12 },
  resetButtonText: { fontSize: 16, fontFamily: 'Cairo_700Bold', color: '#fff' }});