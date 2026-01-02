import React, { useEffect, useState, useCallback } from 'react';
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
  ActivityIndicator,
  RefreshControl,
  Image,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Alexandria_400Regular, Alexandria_600SemiBold, Alexandria_700Bold } from '@expo-google-fonts/alexandria';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { COLORS, FONTS } from '../../src/constants/theme';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface Contact {
  user_id: string;
  full_name: string;
  role: string;
  profile_image?: string;
  last_message?: string;
  last_message_time?: string;
  unread_count: number;
  booking_status?: string;
  package_name?: string;
  hours_remaining?: number;
  specialties?: string[];
}

interface Message {
  _id: string;
  sender_id: string;
  recipient_id: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export default function ChatScreen() {
  const [fontsLoaded] = useFonts({ Alexandria_400Regular, Alexandria_600SemiBold, Alexandria_700Bold });
  const [user, setUser] = useState<any>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadUserAndContacts();
  }, []);

  useEffect(() => {
    let interval: any;
    if (selectedContact) {
      interval = setInterval(() => {
        loadMessages(selectedContact.user_id, true);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [selectedContact]);

  const loadUserAndContacts = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        await loadContacts();
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadContacts = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/chat/available-contacts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setContacts(data);
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
    }
  };

  const loadMessages = async (recipientId: string, silent = false) => {
    if (!silent) setLoadingMessages(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/messages/${recipientId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.sort((a: Message, b: Message) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        ));
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  };

  const selectContact = async (contact: Contact) => {
    setSelectedContact(contact);
    loadMessages(contact.user_id);
    
    if (contact.unread_count > 0) {
      try {
        const token = await AsyncStorage.getItem('token');
        await fetch(`${API_URL}/api/messages/mark-read/${contact.user_id}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setContacts(prev => prev.map(c => 
          c.user_id === contact.user_id ? { ...c, unread_count: 0 } : c
        ));
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedContact) return;

    setSending(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/messages/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          recipient_id: selectedContact.user_id,
          message: newMessage.trim(),
        })
      });

      if (response.ok) {
        setNewMessage('');
        await loadMessages(selectedContact.user_id);
      } else {
        Alert.alert('خطأ', 'فشل إرسال الرسالة');
      }
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ في الاتصال');
    } finally {
      setSending(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadContacts();
    setRefreshing(false);
  }, []);

  const getLetterColor = (name: string): string => {
    const colors = [COLORS.gold, '#4CAF50', '#2196F3', '#9C27B0', '#E91E63', '#00BCD4', '#FF9800'];
    const index = (name?.charCodeAt(0) || 0) % colors.length;
    return colors[index];
  };

  const renderAvatar = (contact: Contact, size: number = 50) => {
    if (contact.profile_image) {
      return (
        <Image 
          source={{ uri: contact.profile_image }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
        />
      );
    }
    return (
      <View style={[styles.avatarPlaceholder, { 
        width: size, 
        height: size, 
        borderRadius: size / 2,
        backgroundColor: getLetterColor(contact.full_name)
      }]}>
        <Text style={[styles.avatarLetter, { fontSize: size * 0.4 }]}>
          {contact.full_name?.charAt(0).toUpperCase() || '?'}
        </Text>
      </View>
    );
  };

  const renderContact = ({ item }: { item: Contact }) => (
    <TouchableOpacity
      style={styles.contactCard}
      onPress={() => selectContact(item)}
    >
      <View style={styles.contactAvatar}>
        {renderAvatar(item, 56)}
        {item.unread_count > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{item.unread_count}</Text>
          </View>
        )}
      </View>
      <View style={styles.contactInfo}>
        <View style={styles.contactHeader}>
          <Text style={styles.contactName}>{item.full_name}</Text>
          {item.last_message_time && (
            <Text style={styles.messageTime}>
              {format(new Date(item.last_message_time), 'h:mm a', { locale: ar })}
            </Text>
          )}
        </View>
        {item.last_message ? (
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.last_message}
          </Text>
        ) : (
          <Text style={styles.noMessages}>ابدأ المحادثة</Text>
        )}
        <View style={styles.contactMeta}>
          {item.hours_remaining !== undefined && item.hours_remaining > 0 && (
            <View style={styles.hoursBadge}>
              <Ionicons name="time" size={12} color={COLORS.gold} />
              <Text style={styles.hoursText}>{item.hours_remaining} ساعة متبقية</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderMessage = ({ item }: { item: Message }) => {
    const isMyMessage = item.sender_id === user?.id;
    
    return (
      <View style={[styles.messageContainer, isMyMessage && styles.myMessageContainer]}>
        <View style={[styles.messageBubble, isMyMessage ? styles.myMessage : styles.otherMessage]}>
          <Text style={[styles.messageText, isMyMessage && styles.myMessageText]}>
            {item.message}
          </Text>
          <Text style={[styles.msgTime, isMyMessage && styles.myMsgTime]}>
            {format(new Date(item.timestamp), 'h:mm a', { locale: ar })}
          </Text>
        </View>
      </View>
    );
  };

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        <ActivityIndicator size="large" color={COLORS.gold} />
        <Text style={styles.loadingText}>جاري التحميل...</Text>
      </View>
    );
  }

  if (selectedContact) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        <View style={styles.chatHeader}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => {
              setSelectedContact(null);
              loadContacts();
            }}
          >
            <Ionicons name="arrow-forward" size={24} color={COLORS.gold} />
          </TouchableOpacity>
          <View style={styles.chatHeaderInfo}>
            {renderAvatar(selectedContact, 44)}
            <View style={styles.chatHeaderText}>
              <Text style={styles.chatHeaderName}>{selectedContact.full_name}</Text>
              <Text style={styles.chatHeaderStatus}>
                {selectedContact.role === 'admin' ? 'مدرب' : 'متدرب'}
              </Text>
            </View>
          </View>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          {loadingMessages ? (
            <View style={styles.loadingMessages}>
              <ActivityIndicator color={COLORS.gold} />
            </View>
          ) : messages.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={80} color={COLORS.border} />
              <Text style={styles.emptyText}>لا توجد رسائل بعد</Text>
              <Text style={styles.emptySubtext}>ابدأ المحادثة مع {selectedContact.full_name}</Text>
            </View>
          ) : (
            <FlatList
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item) => item._id}
              contentContainerStyle={styles.messagesList}
            />
          )}

          <View style={styles.inputContainer}>
            <TouchableOpacity
              style={[styles.sendButton, (!newMessage.trim() || sending) && styles.sendButtonDisabled]}
              onPress={sendMessage}
              disabled={!newMessage.trim() || sending}
            >
              {sending ? (
                <ActivityIndicator color={COLORS.primary} size="small" />
              ) : (
                <Ionicons name="send" size={22} color={COLORS.primary} />
              )}
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              placeholder="اكتب رسالتك..."
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
              maxLength={500}
              placeholderTextColor={COLORS.textMuted}
              editable={!sending}
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <View style={styles.header}>
        <Ionicons name="chatbubbles" size={28} color={COLORS.gold} />
        <Text style={styles.headerTitle}>المحادثات</Text>
      </View>

      {contacts.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="chatbubbles-outline" size={80} color={COLORS.border} />
          <Text style={styles.emptyStateTitle}>لا توجد محادثات متاحة</Text>
          <Text style={styles.emptyStateText}>
            {user?.role === 'trainee' 
              ? 'قم بحجز جلسة مع يازو للتمكن من التواصل'
              : 'ستظهر هنا المحادثات مع متدربيك'
            }
          </Text>
          <View style={styles.tipBox}>
            <Ionicons name="bulb" size={20} color={COLORS.gold} />
            <Text style={styles.tipText}>
              انتقل إلى صفحة "الحجوزات" لحجز جلسة تدريبية
            </Text>
          </View>
        </View>
      ) : (
        <FlatList
          data={contacts}
          renderItem={renderContact}
          keyExtractor={(item) => item.user_id}
          contentContainerStyle={styles.contactsList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.gold} />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.primary },
  loadingText: { fontSize: 16, fontFamily: FONTS.regular, color: COLORS.textMuted, marginTop: 16 },
  loadingMessages: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: 20,
    backgroundColor: COLORS.secondary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: FONTS.bold,
    color: COLORS.gold,
  },

  contactsList: { padding: 12 },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondary,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  contactAvatar: {
    marginLeft: 14,
    position: 'relative',
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    color: COLORS.primary,
    fontFamily: FONTS.bold,
  },
  unreadBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: '#fff',
    fontSize: 11,
    fontFamily: FONTS.bold,
  },
  contactInfo: { flex: 1 },
  contactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  contactName: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    textAlign: 'right',
    flex: 1,
  },
  messageTime: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
  },
  lastMessage: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    textAlign: 'right',
    marginBottom: 6,
  },
  noMessages: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.gold,
    textAlign: 'right',
    marginBottom: 6,
  },
  contactMeta: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  hoursBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  hoursText: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    color: COLORS.gold,
  },

  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: COLORS.textMuted,
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 15,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 24,
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.gold,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: COLORS.goldLight,
    textAlign: 'right',
  },

  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
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
    marginLeft: 12,
  },
  chatHeaderInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
  },
  chatHeaderText: {
    alignItems: 'flex-end',
  },
  chatHeaderName: {
    fontSize: 17,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  chatHeaderStatus: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: COLORS.gold,
  },

  keyboardView: { flex: 1 },
  messagesList: { padding: 16, flexGrow: 1 },
  
  messageContainer: { marginBottom: 12, alignItems: 'flex-end' },
  myMessageContainer: { alignItems: 'flex-start' },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 18,
    padding: 12,
    paddingHorizontal: 16,
  },
  otherMessage: {
    backgroundColor: COLORS.secondary,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderTopRightRadius: 4,
  },
  myMessage: {
    backgroundColor: COLORS.gold,
    borderTopLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: COLORS.text,
    lineHeight: 24,
    textAlign: 'right',
  },
  myMessageText: { color: COLORS.primary },
  msgTime: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  myMsgTime: { color: 'rgba(10, 22, 40, 0.7)' },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
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
    marginTop: 8,
    textAlign: 'center',
  },

  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.secondary,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    alignItems: 'center',
    gap: 12,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 80,
    backgroundColor: COLORS.primary,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: FONTS.regular,
    textAlign: 'right',
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: { backgroundColor: COLORS.border },
});
