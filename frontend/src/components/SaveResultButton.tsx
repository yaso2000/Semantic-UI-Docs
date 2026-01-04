import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSaveResult } from '../hooks/useSaveResult';

interface SaveResultButtonProps {
  calculatorName: string;
  calculatorType: string;
  pillar: 'physical' | 'mental' | 'social' | 'spiritual';
  inputs: Record<string, any>;
  resultValue: any;
  resultText: string;
}

export function SaveResultButton({
  calculatorName,
  calculatorType,
  pillar,
  inputs,
  resultValue,
  resultText
}: SaveResultButtonProps) {
  const { hasSubscription, saving, saveResult } = useSaveResult();

  const handleSave = () => {
    saveResult({
      calculator_name: calculatorName,
      calculator_type: calculatorType,
      pillar,
      inputs,
      result_value: resultValue,
      result_text: resultText
    });
  };

  return (
    <TouchableOpacity 
      style={[styles.saveButton, !hasSubscription && styles.saveButtonDisabled]}
      onPress={handleSave}
      disabled={saving}
    >
      {saving ? (
        <ActivityIndicator color="#fff" size="small" />
      ) : (
        <View style={styles.buttonContent}>
          <Ionicons 
            name={hasSubscription ? "bookmark" : "lock-closed"} 
            size={18} 
            color="#fff" 
          />
          <Text style={styles.saveButtonText}>
            {hasSubscription ? 'حفظ في ملفي' : 'للمشتركين فقط'}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    marginTop: 20,
    gap: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#9E9E9E',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
