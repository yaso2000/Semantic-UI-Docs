import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Image,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Alexandria_400Regular, Alexandria_600SemiBold, Alexandria_700Bold } from '@expo-google-fonts/alexandria';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../src/constants/theme';

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
    const colors = [COLORS.teal, COLORS.sage, COLORS.gold, COLORS.spiritual, COLORS.info];
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
        backgroundColor: `${getLetterColor(contact.full_name)}20`
      }]}>
        <Text style={[styles.avatarLetter, { fontSize: size * 0.4, color: getLetterColor(contact.full_name) }]}>
          {contact.full_name?.charAt(0).toUpperCase() || '?'}
        </Text>
      </View>
    );
  };

  const renderContact = ({ item }: { item: Contact }) => (
    <TouchableOpacity
      style={styles.contactCard}
      onPress={() => selectContact(item)}
      activeOpacity={0.7}
    >
      <View style={styles.contactAvatar}>
        {renderAvatar(item, 52)}
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
              <Ionicons name="time" size={12} color={COLORS.teal} />
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
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <ActivityIndicator size="large" color={COLORS.teal} />
        <Text style={styles.loadingText}>جاري التحميل...</Text>
      </View>
    );
  }

  if (selectedContact) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <View style={styles.chatHeader}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => {
              setSelectedContact(null);
              loadContacts();
            }}
          >
            <Ionicons name="arrow-forward" size={22} color={COLORS.teal} />
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
              <ActivityIndicator color={COLORS.teal} />
            </View>
          ) : messages.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <Ionicons name="chatbubbles-outline" size={60} color={COLORS.teal} />
              </View>
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
                <ActivityIndicator color={COLORS.white} size="small" />
              ) : (
                <Ionicons name="send" size={20} color={COLORS.white} />
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
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <View style={styles.header}>
        <Ionicons name="chatbubbles" size={26} color={COLORS.teal} />
        <Text style={styles.headerTitle}>المحادثات</Text>
      </View>

      {contacts.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyStateIcon}>
            <Ionicons name="chatbubbles-outline" size={60} color={COLORS.teal} />
          </View>
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
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.teal} />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  loadingText: { fontSize: 15, fontFamily: FONTS.regular, color: COLORS.textSecondary, marginTop: SPACING.md },
  loadingMessages: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.sm,
    ...SHADOWS.sm,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },

  contactsList: { padding: SPACING.md },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  contactAvatar: {
    marginLeft: SPACING.md,
    position: 'relative',
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
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
    fontSize: 15,
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
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'right',
    marginBottom: 6,
  },
  noMessages: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: COLORS.teal,
    textAlign: 'right',
    marginBottom: 6,
  },
  contactMeta: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.sm,
  },
  hoursBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.teal}10`,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    gap: 4,
  },
  hoursText: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    color: COLORS.teal,
  },

  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyStateIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: `${COLORS.teal}10`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginTop: SPACING.sm,
  },
  emptyStateText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
    lineHeight: 22,
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.gold}10`,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginTop: SPACING.lg,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: `${COLORS.gold}30`,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: COLORS.goldDark,
    textAlign: 'right',
  },

  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
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
    marginLeft: SPACING.sm,
  },
  chatHeaderInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: SPACING.sm,
  },
  chatHeaderText: {
    alignItems: 'flex-end',
  },
  chatHeaderName: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  chatHeaderStatus: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.teal,
  },

  keyboardView: { flex: 1 },
  messagesList: { padding: SPACING.md, flexGrow: 1 },
  
  messageContainer: { marginBottom: SPACING.sm, alignItems: 'flex-end' },
  myMessageContainer: { alignItems: 'flex-start' },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: RADIUS.lg,
    padding: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  otherMessage: {
    backgroundColor: COLORS.white,
    ...SHADOWS.sm,
    borderTopRightRadius: 4,
  },
  myMessage: {
    backgroundColor: COLORS.teal,
    borderTopLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    fontFamily: FONTS.regular,
    color: COLORS.text,
    lineHeight: 22,
    textAlign: 'right',
  },
  myMessageText: { color: COLORS.white },
  msgTime: {
    fontSize: 10,
    fontFamily: FONTS.regular,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  myMsgTime: { color: 'rgba(255, 255, 255, 0.7)' },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
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
    marginTop: SPACING.xs,
    textAlign: 'center',
  },

  inputContainer: {
    flexDirection: 'row',
    padding: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 80,
    backgroundColor: COLORS.beige,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: FONTS.regular,
    textAlign: 'right',
    color: COLORS.text,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.teal,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: { backgroundColor: COLORS.border },
});
