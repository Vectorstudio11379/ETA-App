import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Maximize2,
  X,
  Download,
  CheckCircle,
} from 'lucide-react-native';
import { useApp } from '../../context/AppContext';

export default function VideoPlayerScreen() {
  const router = useRouter();
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  const { colors } = useApp();

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'content' | 'comment'>('content');

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: colors.secondary }]}>‹ Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Video Player Display Container */}
        <View style={styles.playerContainer}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=800&auto=format&fit=crop' }}
            style={styles.videoPoster}
          />

          {/* Controls Overlay */}
          <View style={styles.controlsOverlay}>
            <TouchableOpacity style={styles.closeOverlayBtn} onPress={() => router.back()}>
              <X size={20} color="#FFF" />
            </TouchableOpacity>

            <View style={styles.centerControlsRow}>
              <TouchableOpacity style={styles.seekBtn}>
                <RotateCcw size={22} color="#FFF" />
                <Text style={styles.seekText}>10</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.mainPlayBtn}
                onPress={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? (
                  <Pause size={28} color="#000" fill="#000" />
                ) : (
                  <Play size={28} color="#000" fill="#000" />
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.seekBtn}>
                <RotateCw size={22} color="#FFF" />
                <Text style={styles.seekText}>10</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.bottomBarRow}>
              <Text style={styles.timeText}>00:00</Text>
              <View style={styles.seekTrack}>
                <View style={[styles.seekFill, { width: '35%', backgroundColor: colors.secondary }]} />
              </View>
              <Text style={styles.timeText}>25:04</Text>

              <TouchableOpacity style={styles.fullscreenBtn}>
                <Maximize2 size={16} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Lesson Details Card */}
        <View style={[styles.detailsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.lessonTitle, { color: colors.text }]}>Introduction to Virtual Assistant</Text>

          <View style={styles.actionButtonsRow}>
            <TouchableOpacity style={[styles.actionPill, { backgroundColor: colors.surfaceLight }]}>
              <Download size={16} color={colors.primary} />
              <Text style={[styles.actionPillText, { color: colors.text }]}>Download</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionPill,
                { backgroundColor: isCompleted ? colors.success : colors.surfaceLight },
              ]}
              onPress={() => setIsCompleted(!isCompleted)}
            >
              <CheckCircle
                size={16}
                color={isCompleted ? '#FFF' : colors.secondary}
              />
              <Text
                style={[
                  styles.actionPillText,
                  { color: isCompleted ? '#FFF' : colors.text },
                ]}
              >
                {isCompleted ? 'Completed' : 'Complete'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Segmented Switcher Tabs */}
        <View style={[styles.segmentContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'content' && { backgroundColor: colors.primary }]}
            onPress={() => setActiveTab('content')}
          >
            <Text style={[styles.segmentText, { color: activeTab === 'content' ? '#FFF' : colors.textSecondary }]}>
              Content
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'comment' && { backgroundColor: colors.primary }]}
            onPress={() => setActiveTab('comment')}
          >
            <Text style={[styles.segmentText, { color: activeTab === 'comment' ? '#FFF' : colors.textSecondary }]}>
              Comment
            </Text>
          </TouchableOpacity>
        </View>

        {/* Description Box */}
        <View style={[styles.descriptionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.descHeading, { color: colors.text }]}>Description</Text>
          <TouchableOpacity
            onPress={() => Linking.openURL('https://aqskill.com/downloads')}
          >
            <Text style={[styles.downloadLinkText, { color: colors.secondary }]}>Click here to download the course files</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    paddingVertical: 4,
  },
  backText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  playerContainer: {
    position: 'relative',
    height: 220,
    marginHorizontal: 16,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 14,
    backgroundColor: '#000',
  },
  videoPoster: {
    width: '100%',
    height: '100%',
    opacity: 0.6,
  },
  controlsOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    padding: 14,
    justifyContent: 'space-between',
  },
  closeOverlayBtn: {
    alignSelf: 'flex-start',
    padding: 6,
  },
  centerControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
  },
  seekBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  seekText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: -4,
  },
  mainPlayBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  timeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  seekTrack: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  seekFill: {
    height: '100%',
  },
  fullscreenBtn: {
    padding: 4,
  },
  detailsCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lessonTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 10,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 6,
  },
  actionPillText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  segmentContainer: {
    flexDirection: 'row',
    borderRadius: 22,
    marginHorizontal: 16,
    marginBottom: 14,
    padding: 4,
    borderWidth: 1,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 18,
    alignItems: 'center',
  },
  segmentText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  descriptionCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginHorizontal: 16,
  },
  descHeading: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  downloadLinkText: {
    fontSize: 13,
    textDecorationLine: 'underline',
  },
});
