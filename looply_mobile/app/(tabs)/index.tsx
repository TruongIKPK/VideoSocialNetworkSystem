import React, { use, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Video, ResizeMode } from 'expo-av';

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
  const video = useRef(null);
  const [isLike, setIsLike] = useState(false);
  const [isSave, setIsSave] = useState(false);
  const [status, setStatus] = useState({});
  const [isPlaying, setIsPlaying] = useState(true);

  const togglePlayPause = () => {
    if (isPlaying) {
      video.current.pauseAsync();
    } else {
      video.current.playAsync();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <View style={styles.container}>
      {/* Background Video */}
      <Video
        ref={video}
        style={styles.backgroundVideo}
        source={{
          uri: 'https://res.cloudinary.com/dcnmynqty/video/upload/videos/vnjldnkahpmji1fywijl.mp4',
        }}
        useNativeControls={false}
        resizeMode={ResizeMode.COVER}
        isLooping
        shouldPlay={isPlaying}
        onPlaybackStatusUpdate={status => setStatus(() => status)}
      />
      
      {/* Overlay để nhấn play/pause */}
      <TouchableOpacity 
        style={styles.videoOverlay} 
        onPress={togglePlayPause}
        activeOpacity={1} // Không có hiệu ứng khi nhấn
      />
      
      {/* Right Side Actions */}
      <View style={styles.rightActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e' }}
            style={styles.avatar}
          />
          <View style={styles.followButton}>
            <Text style={styles.plusIcon}>+</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="heart" size={32} color={isLike ? "red" : "#fff"} onPress={() => setIsLike(!isLike)}/>
          <Text style={styles.actionText}>94.6M</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="chatbubble" size={28} color="#fff" />
          <Text style={styles.actionText}>320K</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="arrow-redo" size={28} color="#fff" />
          <Text style={styles.actionText}>81.7K</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="bookmark" size={28} color={isSave ? "yellow" : "#fff"} onPress={() => setIsSave(!isSave)}/>
          <Text style={styles.actionText}>59M</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Content */}
      <View style={styles.bottomSection}>
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.bottomGradient}
        >
          <View style={styles.bottomContent}>
            <View style={styles.userInfo}>
              <Text style={styles.username}>@Abd_Hakim_Zayd ✓</Text>
              <Text style={styles.description}>living 🐱</Text>
              <Text style={styles.soundInfo}>🎵 Original sound</Text>
            </View>
          </View>
        </LinearGradient>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  backgroundVideo: {
    position: 'absolute',
    width: width,
    height: height,
    top: 0,
    left: 0,
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 1,
  },
  rightActions: {
    position: 'absolute',
    right: 15,
    top: height * 0.3,
    alignItems: 'center',
    zIndex: 2, 
  },
  actionButton: {
    alignItems: 'center',
    marginVertical: 15,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#fff',
  },
  followButton: {
    backgroundColor: '#ff4444',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -12,
  },
  plusIcon: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 5,
    fontWeight: '600',
  },
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
    zIndex: 2, // Đảm bảo nó ở trên overlay
  },
  bottomGradient: {
    flex: 1,
    padding: 10,
  },
  bottomContent: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 20,
    marginBottom: 80,
  },
  userInfo: {
    maxWidth: width * 0.7,
  },
  username: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  description: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 5,
  },
  soundInfo: {
    color: '#fff',
    fontSize: 13,
    opacity: 0.8,
  },
  playButton: {
    padding: 10,
  },
  volumeButton: {
    padding: 10,
  },
});
