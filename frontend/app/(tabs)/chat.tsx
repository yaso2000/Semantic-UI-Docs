import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Cairo_400Regular, Cairo_700Bold } from '@expo-google-fonts/cairo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { format } from 'date-fns';

export default function ChatScreen() {
  const [fontsLoaded] = useFonts({ Cairo_400Regular, Cairo_700Bold });
  const [user, setUser] = useState<any>(null);
  const [coachId, setCoachId] = useState<string>('');
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

  useEffect(() => {
    loadUserAndMessages();
    // تحديث الرسائل كل 5 ثواني
    const interval = setInterval(() => {
      loadMessages();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const loadUserAndMessages = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);

        // إذا كان العميل، نحتاج للحصول على معرف المدرب
        if (parsedUser.role === 'client') {
          // الحصول على معرف المدرب (أول مدرب في النظام)
          const token = await AsyncStorage.getItem('token');
          const usersResponse = await axios.get(`${API_URL}/api/admin/users`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          // البحث عن المدرب
          const adminUser = await axios.get(`${API_URL}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          setCoachId('d8cca3f0-691e-44e5-a0ca-1291d62fc77b'); // معرف المدرب الافتراضي
        }

        await loadMessages();
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userData = await AsyncStorage.getItem('user');
      
      if (!userData) return;
      
      const parsedUser = JSON.parse(userData);
      const recipientId = parsedUser.role === 'client' 
        ? 'd8cca3f0-691e-44e5-a0ca-1291d62fc77b' // معرف المدرب
        : parsedUser.id; // للمدرب، يحتاج إلى معرف العميل

      const response = await axios.get(
        `${API_URL}/api/messages/${recipientId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessages(response.data.sort((a: any, b: any) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      ));
    } catch (error: any) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const recipientId = user?.role === 'client' 
        ? 'd8cca3f0-691e-44e5-a0ca-1291d62fc77b' // معرف المدرب
        : coachId;

      await axios.post(
        `${API_URL}/api/messages/send`,
        {
          recipient_id: recipientId,
          message: newMessage.trim(),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setNewMessage('');
      await loadMessages();
    } catch (error: any) {
      Alert.alert('خطأ', 'فشل إرسال الرسالة');
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isMyMessage = item.sender_id === user?.id;
    
    return (
      <View style={[styles.messageContainer, isMyMessage && styles.myMessageContainer]}>
        <View style={[styles.messageBubble, isMyMessage ? styles.myMessage : styles.otherMessage]}>
          {!isMyMessage && (
            <View style={styles.messageHeader}>
              <Ionicons name="person-circle" size={20} color="#2196F3" />
              <Text style={styles.senderName}>المدرب</Text>
            </View>
          )}
          <Text style={[styles.messageText, isMyMessage && styles.myMessageText]}>
            {item.message}
          </Text>
          <Text style={[styles.messageTime, isMyMessage && styles.myMessageTime]}>
            {format(new Date(item.timestamp), 'HH:mm')}
          </Text>
        </View>
      </View>
    );
  };

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="chatbubbles" size={64} color="#2196F3" />
        <Text style={styles.loadingText}>جاري التحميل...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.coachAvatar}>
            <Ionicons name="person" size={28} color="#2196F3" />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>
              {user?.role === 'client' ? 'المدرب' : 'المحادثات'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {messages.length} رسالة
            </Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={80} color="#ccc" />
            <Text style={styles.emptyText}>لا توجد رسائل بعد</Text>
            <Text style={styles.emptySubtext}>ابدأ المحادثة مع {user?.role === 'client' ? 'المدرب' : 'العميل'}</Text>
          </View>
        ) : (
          <FlatList
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.messagesList}
            inverted={false}
          />
        )}

        <View style={styles.inputContainer}>
          <TouchableOpacity
            style={[styles.sendButton, (!newMessage.trim() || sending) && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!newMessage.trim() || sending}
          >
            <Ionicons name="send" size={24} color="#fff" />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="اكتب رسالتك..."
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            maxLength={500}
            placeholderTextColor="#999"
            editable={!sending}
          />
        </View>
      </KeyboardAvoidingView>
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
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Cairo_400Regular',
    color: '#666',
    marginTop: 16,
  },
  header: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coachAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Cairo_700Bold',
    color: '#333',
    textAlign: 'right',
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Cairo_400Regular',
    color: '#666',
    textAlign: 'right',
  },
  keyboardView: {
    flex: 1,
  },
  messagesList: {
    padding: 16,
    flexGrow: 1,
  },
  messageContainer: {
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  myMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 16,
    padding: 12,
  },
  otherMessage: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderTopRightRadius: 4,
  },
  myMessage: {
    backgroundColor: '#2196F3',
    borderTopLeftRadius: 4,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  senderName: {
    fontSize: 12,
    fontFamily: 'Cairo_700Bold',
    color: '#2196F3',
  },
  messageText: {
    fontSize: 16,
    fontFamily: 'Cairo_400Regular',
    color: '#333',
    lineHeight: 24,
    textAlign: 'right',
  },
  myMessageText: {
    color: '#fff',
  },
  messageTime: {
    fontSize: 11,
    fontFamily: 'Cairo_400Regular',
    color: '#999',
    marginTop: 4,
    textAlign: 'right',
  },
  myMessageTime: {
    color: '#E3F2FD',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 20,
    fontFamily: 'Cairo_700Bold',
    color: '#999',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 16,
    fontFamily: 'Cairo_400Regular',
    color: '#bbb',
    marginTop: 8,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    maxHeight: 100,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    fontSize: 16,
    fontFamily: 'Cairo_400Regular',
    textAlign: 'right',
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#90CAF9',
  },
});
