import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

// ألوان مختلفة لكل حرف
const LETTER_COLORS: { [key: string]: string } = {
  'ا': '#E91E63', 'أ': '#E91E63', 'إ': '#E91E63', 'آ': '#E91E63',
  'ب': '#9C27B0', 'ت': '#673AB7', 'ث': '#3F51B5',
  'ج': '#2196F3', 'ح': '#03A9F4', 'خ': '#00BCD4',
  'د': '#009688', 'ذ': '#4CAF50', 'ر': '#8BC34A',
  'ز': '#CDDC39', 'س': '#FFC107', 'ش': '#FF9800',
  'ص': '#FF5722', 'ض': '#795548', 'ط': '#607D8B',
  'ظ': '#9E9E9E', 'ع': '#E91E63', 'غ': '#9C27B0',
  'ف': '#673AB7', 'ق': '#3F51B5', 'ك': '#2196F3',
  'ل': '#03A9F4', 'م': '#00BCD4', 'ن': '#009688',
  'ه': '#4CAF50', 'و': '#8BC34A', 'ي': '#FFC107',
  'ى': '#FF9800', 'ة': '#FF5722', 'ء': '#795548',
  // English letters
  'a': '#E91E63', 'b': '#9C27B0', 'c': '#673AB7', 'd': '#3F51B5',
  'e': '#2196F3', 'f': '#03A9F4', 'g': '#00BCD4', 'h': '#009688',
  'i': '#4CAF50', 'j': '#8BC34A', 'k': '#CDDC39', 'l': '#FFC107',
  'm': '#FF9800', 'n': '#FF5722', 'o': '#795548', 'p': '#607D8B',
  'q': '#9E9E9E', 'r': '#E91E63', 's': '#9C27B0', 't': '#673AB7',
  'u': '#3F51B5', 'v': '#2196F3', 'w': '#03A9F4', 'x': '#00BCD4',
  'y': '#009688', 'z': '#4CAF50',
};

const DEFAULT_COLOR = '#4CAF50';

interface AvatarProps {
  name: string;
  imageUrl?: string | null;
  size?: number;
  isCoach?: boolean;
}

export default function Avatar({ name, imageUrl, size = 50, isCoach = false }: AvatarProps) {
  const firstLetter = name?.trim().charAt(0).toLowerCase() || '?';
  const backgroundColor = LETTER_COLORS[firstLetter] || DEFAULT_COLOR;
  const fontSize = size * 0.45;

  // إذا كان مدرب ولديه صورة، اعرض الصورة
  if (isCoach && imageUrl) {
    return (
      <View style={[styles.container, { width: size, height: size, borderRadius: size / 2 }]}>
        <Image
          source={{ uri: imageUrl }}
          style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
        />
      </View>
    );
  }

  // للمدرب بدون صورة، اعرض الحرف الأول بخلفية برتقالية
  if (isCoach) {
    return (
      <View style={[
        styles.container,
        styles.letterContainer,
        { 
          width: size, 
          height: size, 
          borderRadius: size / 2,
          backgroundColor: '#FF9800'
        }
      ]}>
        <Text style={[styles.letter, { fontSize }]}>{firstLetter.toUpperCase()}</Text>
      </View>
    );
  }

  // للمتدرب، اعرض الحرف الأول بلون مختلف حسب الحرف
  return (
    <View style={[
      styles.container,
      styles.letterContainer,
      { 
        width: size, 
        height: size, 
        borderRadius: size / 2,
        backgroundColor 
      }
    ]}>
      <Text style={[styles.letter, { fontSize }]}>{firstLetter.toUpperCase()}</Text>
    </View>
  );
}

// مكون لعرض الحرف الأول فقط (للمتدربين)
export function LetterAvatar({ name, size = 50 }: { name: string; size?: number }) {
  return <Avatar name={name} size={size} isCoach={false} />;
}

// مكون لعرض صورة المدرب أو الحرف الأول
export function CoachAvatar({ name, imageUrl, size = 50 }: { name: string; imageUrl?: string | null; size?: number }) {
  return <Avatar name={name} imageUrl={imageUrl} size={size} isCoach={true} />;
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    resizeMode: 'cover',
  },
  letterContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  letter: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
