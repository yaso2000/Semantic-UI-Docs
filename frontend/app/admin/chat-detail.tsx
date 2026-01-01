import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { format } from 'date-fns';

export default function ChatDetail() {
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState('');
  const params = useLocalSearchParams();
  const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

  const userId = params.userId as string;
  const userName = params.userName as string;

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        setCurrentUserId(user.id);
      }

      const response = await axios.get(`${API_URL}/api/messages/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(response.data);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load messages');
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isAdminMessage = item.sender_id === currentUserId;
    
    return (
      <View style={[styles.messageContainer, isAdminMessage && styles.adminMessageContainer]}>
        <View style={[styles.messageBubble, isAdminMessage ? styles.adminBubble : styles.clientBubble]}>
          <View style={styles.messageHeader}>
            <Ionicons 
              name={isAdminMessage ? 'shield-checkmark' : 'person'} 
              size={16} 
              color={isAdminMessage ? '#2196F3' : '#4CAF50'} 
            />
            <Text style={styles.senderLabel}>
              {isAdminMessage ? 'Coach (You)' : userName}
            </Text>
          </View>
          <Text style={styles.messageText}>{item.message}</Text>
          <Text style={styles.messageTime}>
            {format(new Date(item.timestamp), 'MMM dd, hh:mm a')}
          </Text>
          {item.read && !isAdminMessage && (
            <View style={styles.readIndicator}>
              <Ionicons name="checkmark-done" size={14} color="#4CAF50" />
              <Text style={styles.readText}>Read</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={24} color="#2196F3" />
          </View>
          <View>
            <Text style={styles.headerTitle}>{userName}</Text>
            <Text style={styles.messageCount}>{messages.length} messages</Text>
          </View>
        </View>
      </View>
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.messagesContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No messages yet</Text>
          </View>
        }
      />
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
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  messageCount: {
    fontSize: 14,
    color: '#666',
  },
  messagesContent: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  adminMessageContainer: {
    alignItems: 'flex-end',
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 12,
    padding: 12,
  },
  clientBubble: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  adminBubble: {
    backgroundColor: '#E3F2FD',
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  senderLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  messageText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  messageTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 6,
  },
  readIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  readText: {
    fontSize: 12,
    color: '#4CAF50',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
});