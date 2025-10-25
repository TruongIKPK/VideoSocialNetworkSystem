import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const itemWidth = (width - 60) / 3; // 3 columns with margins

export default function Profile() {
  const [activeTab, setActiveTab] = useState('video'); // 'video', 'favorites', 'liked'
  
  const videos = Array(9).fill(null); // Sample data for 9 videos
  const favorites = Array(6).fill(null); // Sample data for 6 favorites
  const liked = Array(12).fill(null); // Sample data for 12 liked videos

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Profile Info */}
        <View style={styles.profileSection}>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e' }}
            style={styles.avatar}
          />
          
          <Text style={styles.username}>Hin Day Ni</Text>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.followButton}>
              <Text style={styles.followButtonText}>Follow</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.messageButton}>
              <Text style={styles.messageButtonText}>Nhắn tin</Text>
            </TouchableOpacity>
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>1</Text>
              <Text style={styles.statLabel}>Đã follow</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>1M</Text>
              <Text style={styles.statLabel}>Follower</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>153,45K</Text>
              <Text style={styles.statLabel}>Lượt thích</Text>
            </View>
          </View>

          {/* Tab Bar */}
          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'video' && styles.activeTab]}
              onPress={() => setActiveTab('video')}
            >
              <Ionicons 
                name="grid" 
                size={16} 
                color={activeTab === 'video' ? "#000" : "#666"} 
              />
              <Text style={activeTab === 'video' ? styles.activeTabText : styles.tabText}>
                Video
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'favorites' && styles.activeTab]}
              onPress={() => setActiveTab('favorites')}
            >
              <Ionicons 
                name="bookmark-outline" 
                size={16} 
                color={activeTab === 'favorites' ? "#000" : "#666"} 
              />
              <Text style={activeTab === 'favorites' ? styles.activeTabText : styles.tabText}>
                Yêu thích
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'liked' && styles.activeTab]}
              onPress={() => setActiveTab('liked')}
            >
              <Ionicons 
                name="heart-outline" 
                size={16} 
                color={activeTab === 'liked' ? "#000" : "#666"} 
              />
              <Text style={activeTab === 'liked' ? styles.activeTabText : styles.tabText}>
                Đã thích
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Content based on active tab */}
        <View style={styles.videoGrid}>
          {activeTab === 'video' && videos.map((_, index) => (
            <TouchableOpacity key={index} style={styles.videoItem}>
              <Image 
                source={{ uri: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba' }}
                style={styles.videoThumbnail}
                contentFit="cover"
              />
            </TouchableOpacity>
          ))}
          
          {activeTab === 'favorites' && favorites.map((_, index) => (
            <TouchableOpacity key={index} style={styles.videoItem}>
              <Image 
                source={{ uri: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b' }}
                style={styles.videoThumbnail}
                contentFit="cover"
              />
            </TouchableOpacity>
          ))}
          
          {activeTab === 'liked' && liked.map((_, index) => (
            <TouchableOpacity key={index} style={styles.videoItem}>
              <Image 
                source={{ uri: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256' }}
                style={styles.videoThumbnail}
                contentFit="cover"
              />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#f8f8f8',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 15,
  },
  username: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 15,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 10,
  },
  followButton: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 30,
    paddingVertical: 8,
    borderRadius: 20,
  },
  followButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  messageButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 30,
    paddingVertical: 8,
    borderRadius: 20,
  },
  messageButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 5,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#000',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
  },
  videoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 100, // Add padding for tab bar
  },
  videoItem: {
    width: itemWidth,
    height: itemWidth * 1.4,
    marginHorizontal: 2.5,
    marginBottom: 5,
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
});
