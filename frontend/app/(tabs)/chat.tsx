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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Cairo_400Regular, Cairo_700Bold } from '@expo-google-fonts/cairo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

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
  const [fontsLoaded] = useFonts({ Cairo_400Regular, Cairo_700Bold });
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
      // Poll for new messages every 3 seconds when in chat
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

  const selectContact = (contact: Contact) => {
    setSelectedContact(contact);
    loadMessages(contact.user_id);
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
    const colors: { [key: string]: string } = {
      'ا': '#E91E63', 'أ': '#E91E63', 'م': '#00BCD4', 'ع': '#E91E63',
      'ب': '#9C27B0', 'ت': '#673AB7', 'ث': '#3F51B5', 'ج': '#2196F3',
      'ح': '#03A9F4', 'خ': '#009688', 'د': '#4CAF50', 'ذ': '#8BC34A',
      'ر': '#CDDC39', 'ز': '#FFC107', 'س': '#FF9800', 'ش': '#FF5722',
      'ص': '#795548', 'ض': '#607D8B', 'ط': '#9E9E9E', 'ظ': '#E91E63',
      'ف': '#9C27B0', 'ق': '#673AB7', 'ك': '#3F51B5', 'ل': '#2196F3',
      'ن': '#03A9F4', 'ه': '#009688', 'و': '#4CAF50', 'ي': '#8BC34A',
    };
    const firstLetter = name?.trim().charAt(0) || '?';
    return colors[firstLetter] || '#FF9800';
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
          {item.role === 'coach' && item.booking_status === 'confirmed' && (
            <View style={styles.statusBadge}>
              <Ionicons name="checkmark-circle" size={12} color="#4CAF50" />
              <Text style={styles.statusText}>حجز فعال</Text>
            </View>
          )}
          {item.hours_remaining !== undefined && item.hours_remaining > 0 && (
            <View style={styles.hoursBadge}>
              <Ionicons name="time" size={12} color="#FF9800" />
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
          <Text style={[styles.messageTime, isMyMessage && styles.myMessageTime]}>
            {format(new Date(item.timestamp), 'h:mm a', { locale: ar })}
          </Text>
        </View>
      </View>
    );
  };

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>جاري التحميل...</Text>
      </View>
    );
  }

  // Show chat view when a contact is selected
  if (selectedContact) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.chatHeader}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => {
              setSelectedContact(null);
              loadContacts();
            }}
          >
            <Ionicons name="arrow-forward" size={24} color="#333" />
          </TouchableOpacity>
          <View style={styles.chatHeaderInfo}>
            {renderAvatar(selectedContact, 44)}
            <View style={styles.chatHeaderText}>
              <Text style={styles.chatHeaderName}>{selectedContact.full_name}</Text>
              <Text style={styles.chatHeaderStatus}>
                {selectedContact.role === 'coach' ? 'مدرب' : 'متدرب'}
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
              <ActivityIndicator color="#2196F3" />
            </View>
          ) : messages.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={80} color="#ccc" />
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
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Ionicons name="send" size={22} color="#fff" />
              )}
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

  // Show contacts list
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="chatbubbles" size={28} color="#2196F3" />
        <Text style={styles.headerTitle}>المحادثات</Text>
      </View>

      {contacts.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="chatbubbles-outline" size={80} color="#ddd" />
          <Text style={styles.emptyStateTitle}>لا توجد محادثات متاحة</Text>
          <Text style={styles.emptyStateText}>
            {user?.role === 'client' 
              ? 'قم بحجز جلسة مع مدرب للتمكن من التواصل معه'
              : 'ستظهر هنا المحادثات مع متدربيك بعد قبول حجوزاتهم'
            }
          </Text>
          {user?.role === 'client' && (
            <View style={styles.tipBox}>
              <Ionicons name="bulb" size={20} color="#FF9800" />
              <Text style={styles.tipText}>
                انتقل إلى صفحة "المدربين" واحجز جلسة للتواصل مع المدرب
              </Text>
            </View>
          )}
        </View>
      ) : (
        <FlatList
          data={contacts}
          renderItem={renderContact}
          keyExtractor={(item) => item.user_id}
          contentContainerStyle={styles.contactsList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2196F3']} />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },
  loadingText: { fontSize: 16, fontFamily: 'Cairo_400Regular', color: '#666', marginTop: 16 },
  loadingMessages: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    gap: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'Cairo_700Bold',
    color: '#333',
  },

  contactsList: { padding: 12 },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
    color: '#fff',
    fontFamily: 'Cairo_700Bold',
  },
  unreadBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#F44336',
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
    fontFamily: 'Cairo_700Bold',
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
    fontFamily: 'Cairo_700Bold',
    color: '#333',
    textAlign: 'right',
    flex: 1,
  },
  messageTime: {
    fontSize: 11,
    fontFamily: 'Cairo_400Regular',
    color: '#999',
  },
  lastMessage: {
    fontSize: 14,
    fontFamily: 'Cairo_400Regular',
    color: '#666',
    textAlign: 'right',
    marginBottom: 6,
  },
  noMessages: {
    fontSize: 14,
    fontFamily: 'Cairo_400Regular',
    color: '#bbb',
    textAlign: 'right',
    fontStyle: 'italic',
    marginBottom: 6,
  },
  contactMeta: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontFamily: 'Cairo_400Regular',
    color: '#4CAF50',
  },
  hoursBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  hoursText: {
    fontSize: 11,
    fontFamily: 'Cairo_400Regular',
    color: '#FF9800',
  },

  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontFamily: 'Cairo_700Bold',
    color: '#999',
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 15,
    fontFamily: 'Cairo_400Regular',
    color: '#bbb',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 24,
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    gap: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Cairo_400Regular',
    color: '#E65100',
    textAlign: 'right',
  },

  // Chat View
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
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
    fontFamily: 'Cairo_700Bold',
    color: '#333',
  },
  chatHeaderStatus: {
    fontSize: 13,
    fontFamily: 'Cairo_400Regular',
    color: '#666',
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
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderTopRightRadius: 4,
  },
  myMessage: {
    backgroundColor: '#2196F3',
    borderTopLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    fontFamily: 'Cairo_400Regular',
    color: '#333',
    lineHeight: 24,
    textAlign: 'right',
  },
  myMessageText: { color: '#fff' },
  myMessageTime: { color: 'rgba(255,255,255,0.7)' },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: 'Cairo_700Bold',
    color: '#999',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
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
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 12,
    marginRight: 10,
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
  sendButtonDisabled: { backgroundColor: '#90CAF9' },
});
