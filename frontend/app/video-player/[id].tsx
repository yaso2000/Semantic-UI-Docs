import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Platform,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { WebView } from 'react-native-webview';
import { useFonts, Alexandria_400Regular, Alexandria_600SemiBold, Alexandria_700Bold } from '@expo-google-fonts/alexandria';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../src/constants/theme';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface Resource {
  id: string;
  title: string;
  description: string;
  category: string;
  content_type: string;
  external_url?: string;
  duration?: string;
  icon: string;
}

// استخراج معرف فيديو YouTube من الرابط
const extractYouTubeId = (url: string): string | null => {
  if (!url) return null;
  
  // أنماط مختلفة لروابط يوتيوب
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  
  return null;
};

export default function VideoPlayerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id, url, title: paramTitle } = useLocalSearchParams();
  
  const [resource, setResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);
  const [videoLoading, setVideoLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [fontsLoaded] = useFonts({ 
    Alexandria_400Regular, 
    Alexandria_600SemiBold, 
    Alexandria_700Bold 
  });

  useEffect(() => {
    if (url) {
      // إذا تم تمرير الرابط مباشرة
      setResource({
        id: id as string || 'direct',
        title: (paramTitle as string) || 'فيديو',
        description: '',
        category: '',
        content_type: 'video',
        external_url: url as string,
        icon: 'videocam',
      });
      setLoading(false);
    } else if (id) {
      // جلب المورد من API
      loadResource();
    }
  }, [id, url]);

  const loadResource = async () => {
    try {
      const response = await fetch(`${API_URL}/api/resources`);
      if (response.ok) {
        const data = await response.json();
        const found = data.find((r: Resource) => r.id === id);
        if (found) {
          setResource(found);
        } else {
          setError('المورد غير موجود');
        }
      } else {
        setError('حدث خطأ في التحميل');
      }
    } catch (err) {
      setError('حدث خطأ في الاتصال');
    } finally {
      setLoading(false);
    }
  };

  const videoId = resource?.external_url ? extractYouTubeId(resource.external_url) : null;

  // HTML للـ WebView مع مشغل YouTube المضمن
  const getEmbedHTML = () => {
    if (!videoId) return '';
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      background: #000; 
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }
    .video-container {
      position: relative;
      width: 100%;
      padding-bottom: 56.25%; /* 16:9 aspect ratio */
      height: 0;
    }
    .video-container iframe {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      border: none;
    }
  </style>
</head>
<body>
  <div class="video-container">
    <iframe
      src="https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1&autoplay=0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowfullscreen
    ></iframe>
  </div>
</body>
</html>
    `;
  };

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <ActivityIndicator size="large" color={COLORS.teal} />
      </View>
    );
  }

  if (error || !resource) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-forward" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>خطأ</Text>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={COLORS.error} />
          <Text style={styles.errorText}>{error || 'المورد غير موجود'}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => router.back()}>
            <Text style={styles.retryBtnText}>العودة</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!videoId) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-forward" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{resource.title}</Text>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="videocam-off-outline" size={64} color={COLORS.error} />
          <Text style={styles.errorText}>رابط الفيديو غير صالح</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => router.back()}>
            <Text style={styles.retryBtnText}>العودة</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{resource.title}</Text>
      </View>

      {/* Video Player */}
      <View style={styles.videoWrapper}>
        {videoLoading && (
          <View style={styles.videoLoading}>
            <ActivityIndicator size="large" color={COLORS.teal} />
            <Text style={styles.videoLoadingText}>جاري تحميل الفيديو...</Text>
          </View>
        )}
        
        {Platform.OS === 'web' ? (
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1`}
            style={{ 
              width: '100%', 
              height: '100%', 
              border: 'none',
              backgroundColor: '#000'
            }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            onLoad={() => setVideoLoading(false)}
          />
        ) : (
          <WebView
            source={{ html: getEmbedHTML() }}
            style={styles.webview}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            allowsFullscreenVideo={true}
            mediaPlaybackRequiresUserAction={false}
            onLoadEnd={() => setVideoLoading(false)}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.warn('WebView error:', nativeEvent);
              setVideoLoading(false);
            }}
          />
        )}
      </View>

      {/* Video Info */}
      <ScrollView style={styles.infoSection} contentContainerStyle={styles.infoContent}>
        <Text style={styles.videoTitle}>{resource.title}</Text>
        
        {resource.duration && (
          <View style={styles.durationBadge}>
            <Ionicons name="time-outline" size={16} color={COLORS.teal} />
            <Text style={styles.durationText}>{resource.duration}</Text>
          </View>
        )}
        
        {resource.description ? (
          <Text style={styles.videoDescription}>{resource.description}</Text>
        ) : null}

        {/* Tips Section */}
        <View style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <Ionicons name="bulb" size={20} color={COLORS.gold} />
            <Text style={styles.tipsTitle}>نصائح للمشاهدة</Text>
          </View>
          <Text style={styles.tipsText}>
            • اختر مكاناً هادئاً للمشاهدة{'\n'}
            • دوّن الملاحظات المهمة{'\n'}
            • طبّق ما تعلمته في حياتك اليومية
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: '#111',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.md,
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.white,
    textAlign: 'right',
  },

  videoWrapper: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    position: 'relative',
  },
  webview: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoLoading: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    zIndex: 10,
  },
  videoLoadingText: {
    marginTop: SPACING.sm,
    color: COLORS.white,
    fontFamily: FONTS.regular,
    fontSize: 14,
  },

  infoSection: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  infoContent: {
    padding: SPACING.lg,
  },
  videoTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    textAlign: 'right',
    lineHeight: 30,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: SPACING.sm,
    alignSelf: 'flex-end',
  },
  durationText: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    color: COLORS.teal,
  },
  videoDescription: {
    fontSize: 15,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'right',
    lineHeight: 24,
    marginTop: SPACING.md,
  },

  tipsCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginTop: SPACING.lg,
    ...SHADOWS.sm,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    marginBottom: SPACING.sm,
  },
  tipsTitle: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  tipsText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'right',
    lineHeight: 24,
  },

  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
    backgroundColor: COLORS.background,
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
