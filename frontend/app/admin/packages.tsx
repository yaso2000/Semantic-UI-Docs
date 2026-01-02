import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useFonts, Alexandria_400Regular, Alexandria_600SemiBold, Alexandria_700Bold } from '@expo-google-fonts/alexandria';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../src/constants/theme';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface Package {
  id: string;
  name: string;
  hours: number;
  price: number;
  description: string;
}

export default function PackagesManagement() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [packages, setPackages] = useState<Package[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();

  const [fontsLoaded] = useFonts({ Alexandria_400Regular, Alexandria_600SemiBold, Alexandria_700Bold });

  useFocusEffect(
    useCallback(() => {
      loadPackages();
    }, [])
  );

  const loadPackages = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/packages`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setPackages(data);
    } catch (error: any) {
      console.error('Error loading packages:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPackages();
  };

  const handleDeletePackage = async (packageId: string) => {
    setDeletingId(packageId);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/packages/${packageId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        setPackages(prev => prev.filter(p => p.id !== packageId));
      } else {
        console.error('Delete failed');
      }
    } catch (error) {
      console.error('Delete error:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleCreatePackage = () => {
    router.push('/admin/package-form' as any);
  };

  const handleEditPackage = (pkg: Package) => {
    router.push({
      pathname: '/admin/package-form' as any,
      params: { packageData: JSON.stringify(pkg) },
    });
  };

  const renderPackageCard = ({ item }: { item: Package }) => (
    <View style={styles.packageCard}>
      <View style={styles.packageHeader}>
        <View style={styles.packageIcon}>
          <Ionicons name="fitness" size={26} color={COLORS.white} />
        </View>
        <View style={styles.packageInfo}>
          <Text style={styles.packageName}>{item.name}</Text>
          <Text style={styles.packageDescription}>{item.description}</Text>
        </View>
      </View>
      
      <View style={styles.packageDetails}>
        <View style={styles.detailItem}>
          <Ionicons name="time-outline" size={18} color={COLORS.teal} />
          <Text style={styles.detailText}>{item.hours} ساعة</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="cash-outline" size={18} color={COLORS.goldDark} />
          <Text style={styles.detailText}>${item.price}</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="calculator-outline" size={18} color={COLORS.sageDark} />
          <Text style={styles.detailText}>${(item.price / item.hours).toFixed(2)}/ساعة</Text>
        </View>
      </View>

      <View style={styles.packageActions}>
        <TouchableOpacity 
          style={[styles.actionBtn, styles.editBtn]}
          onPress={() => handleEditPackage(item)}
        >
          <Ionicons name="create" size={18} color={COLORS.teal} />
          <Text style={[styles.actionBtnText, { color: COLORS.teal }]}>تعديل</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionBtn, styles.deleteBtn]}
          onPress={() => handleDeletePackage(item.id)}
          disabled={deletingId === item.id}
        >
          {deletingId === item.id ? (
            <ActivityIndicator size="small" color={COLORS.error} />
          ) : (
            <>
              <Ionicons name="trash" size={18} color={COLORS.error} />
              <Text style={[styles.actionBtnText, { color: COLORS.error }]}>حذف</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <ActivityIndicator size="large" color={COLORS.teal} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-forward" size={22} color={COLORS.teal} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>إدارة الباقات</Text>
      </View>
      <FlatList
        data={packages}
        renderItem={renderPackageCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.teal} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Ionicons name="pricetags-outline" size={50} color={COLORS.teal} />
            </View>
            <Text style={styles.emptyText}>لا توجد باقات حالياً</Text>
            <Text style={styles.emptySubtext}>أنشئ أول باقة تدريبية</Text>
          </View>
        }
      />
      <TouchableOpacity style={styles.fab} onPress={handleCreatePackage}>
        <Ionicons name="add" size={28} color={COLORS.white} />
      </TouchableOpacity>
    </SafeAreaView>
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
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    ...SHADOWS.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${COLORS.teal}10`,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.md,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    textAlign: 'right',
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: 100,
  },
  packageCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.md,
  },
  packageHeader: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  packageIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.teal,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.md,
  },
  packageInfo: {
    flex: 1,
  },
  packageName: {
    fontSize: 17,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    textAlign: 'right',
  },
  packageDescription: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginTop: 2,
    textAlign: 'right',
  },
  packageDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 13,
    fontFamily: FONTS.semiBold,
    color: COLORS.textSecondary,
  },
  packageActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.sm,
    borderRadius: RADIUS.sm,
    gap: 6,
  },
  editBtn: {
    backgroundColor: `${COLORS.teal}10`,
  },
  deleteBtn: {
    backgroundColor: COLORS.errorLight,
  },
  actionBtnText: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: `${COLORS.teal}10`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  emptyText: {
    fontSize: 17,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  fab: {
    position: 'absolute',
    left: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.teal,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.lg,
  },
});
