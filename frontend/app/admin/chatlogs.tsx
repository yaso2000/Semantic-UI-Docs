import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  
  Alert,
  RefreshControl} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { format } from 'date-fns';

export default function ChatLogs() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [conversations, setConversations] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const router = useRouter();
  const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      
      // Load all users
      const usersResponse = await axios.get(`${API_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(usersResponse.data);

      // For each user, get their conversation data
      const conversationsData = await Promise.all(
        usersResponse.data.map(async (user: any) => {
          try {
            const messages = await axios.get(`${API_URL}/api/messages/${user.id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            return {
              user,
              messageCount: messages.data.length,
              lastMessage: messages.data[messages.data.length - 1]};
          } catch (error) {
            return {
              user,
              messageCount: 0,
              lastMessage: null};
          }
        })
      );

      // Filter out users with no messages
      setConversations(conversationsData.filter(c => c.messageCount > 0));
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load chat logs');
      console.error('Error loading chat logs:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleViewConversation = (userId: string, userName: string) => {
    router.push({
      pathname: '/admin/chat-detail',
      params: { userId, userName }});
  };

  const renderConversationCard = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.conversationCard}
      onPress={() => handleViewConversation(item.user.id, item.user.full_name)}
    >
      <View style={styles.userAvatar}>
        <Ionicons name="person" size={32} color="#2196F3" />
      </View>
      <View style={styles.conversationInfo}>
        <View style={styles.conversationHeader}>
          <Text style={styles.userName}>{item.user.full_name}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.messageCount}</Text>
          </View>
        </View>
        <Text style={styles.userEmail}>{item.user.email}</Text>
        {item.lastMessage && (
          <View style={styles.lastMessageContainer}>
            <Ionicons name="chatbubble-outline" size={14} color="#999" />
            <Text style={styles.lastMessage} numberOfLines={1}>
              {item.lastMessage.message}
            </Text>
          </View>
        )}
        {item.lastMessage && (
          <Text style={styles.timestamp}>
            {format(new Date(item.lastMessage.timestamp), 'MMM dd, yyyy hh:mm a')}
          </Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={24} color="#999" />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Active Conversations: {conversations.length}</Text>
        <Text style={styles.headerSubtext}>Professional review of client communications</Text>
      </View>
      <FlatList
        data={conversations}
        renderItem={renderConversationCard}
        keyExtractor={(item) => item.user.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No conversations yet</Text>
            <Text style={styles.emptySubtext}>Client messages will appear here</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'},
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'},
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'},
  headerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333'},
  headerSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 4},
  listContent: {
    padding: 16},
  conversationCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    alignItems: 'center'},
  userAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16},
  conversationInfo: {
    flex: 1},
  conversationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8},
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333'},
  badge: {
    backgroundColor: '#2196F3',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2},
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff'},
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2},
  lastMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8},
  lastMessage: {
    fontSize: 14,
    color: '#999',
    flex: 1},
  timestamp: {
    fontSize: 12,
    color: '#bbb',
    marginTop: 4},
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100},
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginTop: 16},
  emptySubtext: {
    fontSize: 14,
    color: '#bbb',
    marginTop: 4}});