// ثوابت التصميم الفخم
export const COLORS = {
  primary: '#0A1628',      // أزرق داكن - الخلفية الرئيسية
  secondary: '#1A2744',    // أزرق أفتح - البطاقات
  tertiary: '#243B67',     // أزرق متوسط
  gold: '#D4AF37',         // ذهبي - العناصر المميزة
  goldLight: '#F4E4BC',    // ذهبي فاتح
  goldDark: '#B8960C',     // ذهبي داكن
  white: '#FFFFFF',
  text: '#E8E8E8',         // النصوص الفاتحة
  textMuted: '#8A9BB8',    // النصوص الباهتة
  border: '#2A3A5C',       // الحدود
  success: '#4CAF50',      // أخضر للنجاح
  error: '#F44336',        // أحمر للخطأ
  warning: '#FF9800',      // برتقالي للتحذير
  overlay: 'rgba(10, 22, 40, 0.9)',
};

export const FONTS = {
  regular: 'Alexandria_400Regular',
  semiBold: 'Alexandria_600SemiBold',
  bold: 'Alexandria_700Bold',
};

export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 4,
  },
};
