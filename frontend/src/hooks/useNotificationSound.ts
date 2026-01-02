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
      // Vibrate (works on mobile)
      if (Platform.OS !== 'web') {
        // نمط اهتزاز للإشعار: توقف-اهتزاز-توقف-اهتزاز
        Vibration.vibrate([0, 200, 100, 200]);
        console.log('🔔 Notification vibration triggered');
      }

      // Play system notification sound using Audio API
      if (Platform.OS !== 'web') {
        try {
          // Unload previous sound if exists
          if (soundRef.current) {
            await soundRef.current.unloadAsync();
          }

          // Use expo-av's built-in notification approach
          const { sound } = await Audio.Sound.createAsync(
            { uri: 'https://notificationsounds.com/storage/sounds/file-sounds-1150-pristine.mp3' },
            { shouldPlay: true, volume: 0.7 }
          );
          
          soundRef.current = sound;
          console.log('🔊 Notification sound played');
          
          // Unload after playing
          sound.setOnPlaybackStatusUpdate((status) => {
            if (status.isLoaded && status.didJustFinish) {
              sound.unloadAsync();
            }
          });
        } catch (soundError) {
          // Sound might fail, but vibration already worked
          console.log('Sound playback skipped (vibration used instead):', soundError);
        }
      }
    } catch (error) {
      console.log('Notification error:', error);
    }
  }, []);

  const checkAndPlaySound = useCallback((newUnreadCount: number) => {
    // Play sound only if unread count increased
    if (newUnreadCount > lastUnreadCount.current) {
      console.log(`📬 New messages detected: ${lastUnreadCount.current} -> ${newUnreadCount}`);
      playNotificationSound();
    }
    lastUnreadCount.current = newUnreadCount;
  }, [playNotificationSound]);

  return { playNotificationSound, checkAndPlaySound };
}
