import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, FlatList } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Video, ResizeMode } from 'expo-av';
import { useFocusEffect } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

// Dữ liệu mẫu cho các video
const videoData = [
  {
    id: '1',
    videoUrl: 'https://res.cloudinary.com/dcnmynqty/video/upload/videos/vnjldnkahpmji1fywijl.mp4',
    username: '@Abd_Hakim_Zayd ✓',
    description: 'living 🐱',
    soundInfo: '🎵 Original sound',
    likes: '94.6M',
    comments: '320K',
    shares: '81.7K',
    saves: '59M',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e',
  },
  {
    id: '2',
    videoUrl: 'https://res.cloudinary.com/dcnmynqty/video/upload/videos/cymmx9xquwcboi0gryfa.mp4',
    username: '@user2 ✓',
    description: 'Amazing content!',
    soundInfo: '🎵 Trending sound',
    likes: '2.1M',
    comments: '15K',
    shares: '8.2K',
    saves: '12M',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786',
  },
  {
    id: '3',
    videoUrl: 'https://res.cloudinary.com/dcnmynqty/video/upload/videos/cymmx9xquwcboi0gryfa.mp4',
    username: '@user3 ✓',
    description: 'Fun times!',
    soundInfo: '🎵 Popular sound',
    likes: '5.3M',
    comments: '45K',
    shares: '12K',
    saves: '8M',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
  },
  {
    id: '4',
    videoUrl: 'https://res.cloudinary.com/dcnmynqty/video/upload/videos/vnjldnkahpmji1fywijl.mp4',
    username: '@user4 ✓',
    description: 'Another amazing video!',
    soundInfo: '🎵 Viral sound',
    likes: '8.2M',
    comments: '67K',
    shares: '15K',
    saves: '25M',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80',
  },
  {
    id: '5',
    videoUrl: 'https://res.cloudinary.com/dcnmynqty/video/upload/videos/cymmx9xquwcboi0gryfa.mp4',
    username: '@user5 ✓',
    description: 'Creative content!',
    soundInfo: '🎵 Original sound',
    likes: '3.7M',
    comments: '28K',
    shares: '9K',
    saves: '18M',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e',
  },
];

export default function HomeScreen() {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isLike, setIsLike] = useState(false);
  const [isSave, setIsSave] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const videoRefs = useRef<{ [key: number]: any }>({});

  // Xử lý dừng video khi rời khỏi tab
  useFocusEffect(
    React.useCallback(() => {
      setIsPlaying(true);
      return () => {
        setIsPlaying(false);
      };
    }, [])
  );

  const onViewableItemsChanged = ({ viewableItems }: { viewableItems: any[] }) => {
    if (viewableItems.length > 0) {
      const newIndex = viewableItems[0].index;
      setCurrentVideoIndex(newIndex);
      // Tự động play video mới và pause video cũ
      setIsPlaying(true);
    }
  };

  const renderVideoItem = ({ item, index }: { item: any; index: number }) => {
    const isCurrentVideo = index === currentVideoIndex;
    
    const handleVideoPress = async () => {
      if (isCurrentVideo) {
        const videoRef = videoRefs.current[index];
        if (videoRef) {
          if (isPlaying) {
            await videoRef.pauseAsync();
          } else {
            await videoRef.playAsync();
          }
        }
        setIsPlaying(!isPlaying);
      }
    };
    
    return (
      <View style={styles.videoContainer}>
        {/* Background Video */}
        <Video
          ref={(ref) => {
            if (ref) {
              videoRefs.current[index] = ref;
            }
          }}
          style={styles.backgroundVideo}
          source={{ uri: item.videoUrl }}
          useNativeControls={false}
          resizeMode={ResizeMode.COVER}
          isLooping
          shouldPlay={isCurrentVideo && isPlaying}
        />
        
        {/* Overlay để nhấn play/pause */}
        <TouchableOpacity 
          style={styles.videoOverlay} 
          onPress={handleVideoPress}
          activeOpacity={1}
        />
        
        {/* Play/Pause indicator - chỉ hiển thị khi video hiện tại bị pause */}
        {isCurrentVideo && !isPlaying && (
          <View style={styles.playPauseIndicator}>
            <Ionicons name="play" size={60} color="rgba(255,255,255,0.8)" />
          </View>
        )}
        
        {/* Right Side Actions */}
        <View style={styles.rightActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Image 
              source={{ uri: item.avatar }}
              style={styles.avatar}
            />
            <View style={styles.followButton}>
              <Text style={styles.plusIcon}>+</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="heart" size={32} color={isLike ? "red" : "#fff"} onPress={() => setIsLike(!isLike)}/>
            <Text style={styles.actionText}>{item.likes}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="chatbubble" size={28} color="#fff" />
            <Text style={styles.actionText}>{item.comments}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="arrow-redo" size={28} color="#fff" />
            <Text style={styles.actionText}>{item.shares}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="bookmark" size={28} color={isSave ? "yellow" : "#fff"} onPress={() => setIsSave(!isSave)}/>
            <Text style={styles.actionText}>{item.saves}</Text>
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
                <Text style={styles.username}>{item.username}</Text>
                <Text style={styles.description}>{item.description}</Text>
                <Text style={styles.soundInfo}>{item.soundInfo}</Text>
              </View>
            </View>
          </LinearGradient>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={videoData}
        renderItem={renderVideoItem}
        keyExtractor={(item) => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={height}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{
          itemVisiblePercentThreshold: 50,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoContainer: {
    width: width,
    height: height,
    position: 'relative',
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
  playPauseIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -30 }, { translateY: -30 }],
    zIndex: 3,
  },
});
