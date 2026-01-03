import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  
  StatusBar,
  ActivityIndicator,
  Platform} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { WebView } from 'react-native-webview';
import { useFonts, Alexandria_400Regular, Alexandria_600SemiBold, Alexandria_700Bold } from '@expo-google-fonts/alexandria';
import { COLORS, FONTS, SPACING, RADIUS } from '../../src/constants/theme';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface CustomCalculator {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  html_content: string;
}

export default function CustomCalculatorScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  const [calculator, setCalculator] = useState<CustomCalculator | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const [fontsLoaded] = useFonts({ Alexandria_400Regular, Alexandria_600SemiBold, Alexandria_700Bold });

  useEffect(() => {
    loadCalculator();
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

  // Inject fonts and RTL support
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
      </View>

      {/* WebView for Calculator */}
      {Platform.OS === 'web' ? (
        <iframe
          srcDoc={htmlWithStyles}
          style={{ flex: 1, border: 'none', width: '100%', height: '100%' }}
        />
      ) : (
        <WebView
          source={{ html: htmlWithStyles }}
          style={styles.webview}
          javaScriptEnabled={true}
          domStorageEnabled={true}
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
    backgroundColor: COLORS.background},
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background},

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.teal},
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.md},
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.white,
    textAlign: 'right'},

  webview: {
    flex: 1,
    backgroundColor: COLORS.background},
  webviewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background},

  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl},
  errorText: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
    textAlign: 'center'},
  retryBtn: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.teal,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md},
  retryBtnText: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: COLORS.white}});
