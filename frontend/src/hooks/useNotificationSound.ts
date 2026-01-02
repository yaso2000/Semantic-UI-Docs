import { useCallback, useRef, useEffect } from 'react';
import { Platform, Vibration } from 'react-native';
import { Audio } from 'expo-av';

export function useNotificationSound() {
  const soundRef = useRef<Audio.Sound | null>(null);
  const lastUnreadCount = useRef(0);

  useEffect(() => {
    // Set up audio mode
    const setupAudio = async () => {
      if (Platform.OS !== 'web') {
        try {
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            playsInSilentModeIOS: true,
            staysActiveInBackground: false,
            shouldDuckAndroid: true,
          });
        } catch (error) {
          console.log('Audio setup error:', error);
        }
      }
    };
    
    setupAudio();

    return () => {
      // Cleanup sound on unmount
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const playNotificationSound = useCallback(async () => {
    try {
      // Vibrate first (works on mobile)
      if (Platform.OS !== 'web') {
        Vibration.vibrate([0, 200, 100, 200]);
      }

      // Try to play sound (only on native platforms)
      if (Platform.OS !== 'web') {
        try {
          // Unload previous sound if exists
          if (soundRef.current) {
            await soundRef.current.unloadAsync();
          }

          // Create and play new notification sound
          const { sound } = await Audio.Sound.createAsync(
            // Use a system-like notification sound
            require('./notification.mp3'),
            { shouldPlay: true, volume: 0.8 }
          );
          
          soundRef.current = sound;
          
          // Unload after playing
          sound.setOnPlaybackStatusUpdate((status) => {
            if (status.isLoaded && status.didJustFinish) {
              sound.unloadAsync();
            }
          });
        } catch (soundError) {
          // Sound file might not exist, just log and continue
          console.log('Sound playback skipped:', soundError);
        }
      }
    } catch (error) {
      console.log('Notification sound error:', error);
    }
  }, []);

  const checkAndPlaySound = useCallback((newUnreadCount: number) => {
    // Play sound only if unread count increased
    if (newUnreadCount > lastUnreadCount.current && lastUnreadCount.current >= 0) {
      playNotificationSound();
    }
    lastUnreadCount.current = newUnreadCount;
  }, [playNotificationSound]);

  return { playNotificationSound, checkAndPlaySound };
}
