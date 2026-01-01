import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

export default function PackageForm() {
  const [name, setName] = useState('');
  const [hours, setHours] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [packageId, setPackageId] = useState('');
  
  const router = useRouter();
  const params = useLocalSearchParams();
  const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

  useEffect(() => {
    if (params.packageData) {
      try {
        const pkg = JSON.parse(params.packageData as string);
        setIsEdit(true);
        setPackageId(pkg.id);
        setName(pkg.name);
        setHours(pkg.hours.toString());
        setPrice(pkg.price.toString());
        setDescription(pkg.description);
      } catch (error) {
        console.error('Error parsing package data:', error);
      }
    }
  }, [params]);

  const handleSave = async () => {
    if (!name || !hours || !price || !description) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const hoursNum = parseFloat(hours);
    const priceNum = parseFloat(price);

    if (isNaN(hoursNum) || hoursNum <= 0) {
      Alert.alert('Error', 'Please enter a valid number of hours');
      return;
    }

    if (isNaN(priceNum) || priceNum <= 0) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const packageData = {
        name,
        hours: hoursNum,
        price: priceNum,
        description,
        active: true,
      };

      if (isEdit) {
        await axios.put(`${API_URL}/api/packages/${packageId}`, packageData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        Alert.alert('Success', 'Package updated successfully');
      } else {
        await axios.post(`${API_URL}/api/packages`, packageData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        Alert.alert('Success', 'Package created successfully');
      }
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to save package');
    } finally {
      setLoading(false);
    }
  };

  const pricePerHour = hours && price ? (parseFloat(price) / parseFloat(hours)).toFixed(2) : '0.00';

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Package Name *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="pricetag" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Starter Package"
                  value={name}
                  onChangeText={setName}
                  placeholderTextColor="#999"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Number of Hours *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="time" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 10"
                  value={hours}
                  onChangeText={setHours}
                  keyboardType="numeric"
                  placeholderTextColor="#999"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Price (USD) *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="cash" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 299.99"
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="numeric"
                  placeholderTextColor="#999"
                />
              </View>
            </View>

            {hours && price && (
              <View style={styles.calculationCard}>
                <Text style={styles.calculationLabel}>Price per hour:</Text>
                <Text style={styles.calculationValue}>${pricePerHour}/hr</Text>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description *</Text>
              <View style={[styles.inputContainer, styles.textAreaContainer]}>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Describe what's included in this package..."
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  placeholderTextColor="#999"
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.saveButton, loading && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={loading}
            >
              <Ionicons name="checkmark-circle" size={24} color="#fff" />
              <Text style={styles.saveButtonText}>
                {loading ? 'Saving...' : isEdit ? 'Update Package' : 'Create Package'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#333',
  },
  textAreaContainer: {
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  textArea: {
    height: 100,
  },
  calculationCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  calculationLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4CAF50',
  },
  calculationValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: '#2196F3',
    borderRadius: 8,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#90CAF9',
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
});