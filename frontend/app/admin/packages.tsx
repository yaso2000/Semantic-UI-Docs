import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

export default function PackagesManagement() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [packages, setPackages] = useState<any[]>([]);
  const router = useRouter();
  const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/packages`);
      setPackages(response.data);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load packages');
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

  const handleDeletePackage = async (packageId: string, packageName: string) => {
    Alert.alert(
      'Delete Package',
      `Are you sure you want to delete "${packageName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              await axios.delete(`${API_URL}/api/packages/${packageId}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              Alert.alert('Success', 'Package deleted successfully');
              loadPackages();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete package');
            }
          },
        },
      ]
    );
  };

  const handleCreatePackage = () => {
    router.push('/admin/package-form');
  };

  const handleEditPackage = (pkg: any) => {
    router.push({
      pathname: '/admin/package-form',
      params: { packageData: JSON.stringify(pkg) },
    });
  };

  const renderPackageCard = ({ item }: { item: any }) => (
    <View style={styles.packageCard}>
      <View style={styles.packageHeader}>
        <View style={styles.packageIcon}>
          <Ionicons name="time" size={28} color="#4CAF50" />
        </View>
        <View style={styles.packageInfo}>
          <Text style={styles.packageName}>{item.name}</Text>
          <Text style={styles.packageDescription}>{item.description}</Text>
        </View>
      </View>
      
      <View style={styles.packageDetails}>
        <View style={styles.detailItem}>
          <Ionicons name="time-outline" size={20} color="#666" />
          <Text style={styles.detailText}>{item.hours} hours</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="cash-outline" size={20} color="#666" />
          <Text style={styles.detailText}>${item.price}</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="calculator-outline" size={20} color="#666" />
          <Text style={styles.detailText}>${(item.price / item.hours).toFixed(2)}/hr</Text>
        </View>
      </View>

      <View style={styles.packageActions}>
        <TouchableOpacity 
          style={[styles.actionBtn, styles.editBtn]}
          onPress={() => handleEditPackage(item)}
        >
          <Ionicons name="create" size={20} color="#2196F3" />
          <Text style={[styles.actionBtnText, { color: '#2196F3' }]}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionBtn, styles.deleteBtn]}
          onPress={() => handleDeletePackage(item.id, item.name)}
        >
          <Ionicons name="trash" size={20} color="#F44336" />
          <Text style={[styles.actionBtnText, { color: '#F44336' }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={packages}
        renderItem={renderPackageCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="pricetags-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No packages available</Text>
            <Text style={styles.emptySubtext}>Create your first coaching package</Text>
          </View>
        }
      />
      <TouchableOpacity style={styles.fab} onPress={handleCreatePackage}>
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  packageCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  packageHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  packageIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  packageInfo: {
    flex: 1,
  },
  packageName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  packageDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  packageDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
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
    backgroundColor: '#E3F2FD',
  },
  deleteBtn: {
    backgroundColor: '#FFEBEE',
  },
  actionBtnText: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#bbb',
    marginTop: 4,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});