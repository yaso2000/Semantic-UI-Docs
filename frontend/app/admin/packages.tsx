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
import { COLORS, FONTS } from '../../src/constants/theme';

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
          <Ionicons name="fitness" size={28} color={COLORS.primary} />
        </View>
        <View style={styles.packageInfo}>
          <Text style={styles.packageName}>{item.name}</Text>
          <Text style={styles.packageDescription}>{item.description}</Text>
        </View>
      </View>
      
      <View style={styles.packageDetails}>
        <View style={styles.detailItem}>
          <Ionicons name="time-outline" size={20} color={COLORS.gold} />
          <Text style={styles.detailText}>{item.hours} ساعة</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="cash-outline" size={20} color={COLORS.gold} />
          <Text style={styles.detailText}>${item.price}</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="calculator-outline" size={20} color={COLORS.gold} />
          <Text style={styles.detailText}>${(item.price / item.hours).toFixed(2)}/ساعة</Text>
        </View>
      </View>

      <View style={styles.packageActions}>
        <TouchableOpacity 
          style={[styles.actionBtn, styles.editBtn]}
          onPress={() => handleEditPackage(item)}
        >
          <Ionicons name="create" size={20} color={COLORS.gold} />
          <Text style={[styles.actionBtnText, { color: COLORS.gold }]}>تعديل</Text>
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
              <Ionicons name="trash" size={20} color={COLORS.error} />
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
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        <ActivityIndicator size="large" color={COLORS.gold} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-forward" size={24} color={COLORS.gold} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>إدارة الباقات</Text>
      </View>
      <FlatList
        data={packages}
        renderItem={renderPackageCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.gold} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="pricetags-outline" size={64} color={COLORS.border} />
            <Text style={styles.emptyText}>لا توجد باقات حالياً</Text>
            <Text style={styles.emptySubtext}>أنشئ أول باقة تدريبية</Text>
          </View>
        }
      />
      <TouchableOpacity style={styles.fab} onPress={handleCreatePackage}>
        <Ionicons name="add" size={32} color={COLORS.primary} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.secondary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: COLORS.gold,
    textAlign: 'right',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  packageCard: {
    backgroundColor: COLORS.secondary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  packageHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  packageIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.gold,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
  packageInfo: {
    flex: 1,
  },
  packageName: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    textAlign: 'right',
  },
  packageDescription: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    marginTop: 4,
    textAlign: 'right',
  },
  packageDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    color: COLORS.textMuted,
  },
  packageActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  editBtn: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderWidth: 1,
    borderColor: COLORS.gold,
  },
  deleteBtn: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  actionBtnText: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.textMuted,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  fab: {
    position: 'absolute',
    left: 20,
    bottom: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.gold,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});
