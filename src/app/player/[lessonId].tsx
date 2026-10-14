import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Platform,
  StatusBar,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import {
  CheckCircle,
  Download,
  Check,
  FileText,
  Smartphone,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import { storageService } from '../../services/storage';
import { INITIAL_COURSES } from '../../data/initialCourses';

export default function VideoPlayerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { lessonId, courseId } = useLocalSearchParams<{ lessonId: string; courseId?: string }>();
  const { courses, colors } = useApp();

  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [isDownloaded, setIsDownloaded] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'content' | 'comment'>('content');
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number }>({});
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [quizScore, setQuizScore] = useState<number>(0);

  // Dynamically resolve current lesson and course from live data or bundled catalog
  let currentLesson: any = {
    id: lessonId || '683',
    title: 'Loading lesson...',
    duration: '15m',
    videoUrl: '',
    type: 'video',
  };
  let currentCourse = courses[0] || INITIAL_COURSES[0];

  const searchPool = [...courses, ...INITIAL_COURSES];
  for (const c of searchPool) {
    if (c.modules) {
      for (const m of c.modules) {
        const found = m.lessons?.find((l) => String(l.id) === String(lessonId));
        if (found) {
          currentLesson = found;
          currentCourse = c;
          break;
        }
      }
      if (currentLesson.title !== 'Loading lesson...') break;
    }
  }

  // Check if saved offline
  useEffect(() => {
    let isMounted = true;
    if (lessonId) {
      storageService.isLessonOffline(String(lessonId)).then((offline) => {
        if (isMounted) setIsDownloaded(offline);
      });
    }
    return () => {
      isMounted = false;
    };
  }, [lessonId]);

  const isQuiz = currentLesson.type === 'quiz';
  const isAssignment = currentLesson.type === 'assignment';
  const isPdf = typeof currentLesson.videoUrl === 'string' && currentLesson.videoUrl.endsWith('.pdf');
  const isApk = typeof currentLesson.videoUrl === 'string' && currentLesson.videoUrl.endsWith('.apk');

  const handleToggleDownload = async () => {
    if (isDownloaded) {
      await storageService.removeOfflineDownload(String(currentLesson.id));
      setIsDownloaded(false);
    } else {
      await storageService.saveOfflineDownload({
        id: String(currentLesson.id),
        courseId: String(currentCourse?.id || ''),
        courseTitle: currentCourse?.title || 'Express Tech Academy',
        lessonTitle: currentLesson.title,
        duration: currentLesson.duration || '15m',
        videoUrl: currentLesson.videoUrl,
        thumbnail: currentCourse?.thumbnail,
        downloadedAt: new Date().toISOString(),
        sizeDisplay: 'In-App Offline',
      });
      setIsDownloaded(true);
    }
  };

  const handleOptionSelect = (qIdx: number, optIdx: number) => {
    if (quizSubmitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [qIdx]: optIdx }));
  };

  const handleSubmitQuiz = () => {
    const questions = currentLesson.quizData?.questions || [];
    if (questions.length === 0) return;
    let correct = 0;
    questions.forEach((q: any, idx: number) => {
      if (selectedAnswers[idx] === q.answer) {
        correct += 1;
      }
    });
    const percentage = Math.round((correct / questions.length) * 100);
    setQuizScore(percentage);
    setQuizSubmitted(true);
    if (percentage >= (currentLesson.quizData?.passingScore || 70)) {
      setIsCompleted(true);
    }
  };

  const videoHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <style>
          * { box-sizing: border-box; }
          body, html { margin:0; padding:0; width:100%; height:100%; background:#000; overflow:hidden; display:flex; align-items:center; justify-content:center; }
          video { width:100%; height:100%; max-height:100vh; object-fit:contain; background:#000; }
        </style>
      </head>
      <body>
        <video
          src="${currentLesson.videoUrl || ''}"
          poster="${currentCourse?.thumbnail || ''}"
          controls
          playsinline
          webkit-playsinline
          autoplay
          controlsList="nodownload"
        ></video>
      </body>
    </html>
  `;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Header */}
      <View style={[styles.headerRow, { paddingTop: Math.max(insets.top, 14) }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: colors.secondary }]}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerCourseTitle, { color: colors.textSecondary }]} numberOfLines={1}>
          {currentCourse?.title || 'Course Player'}
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Interactive Quiz or Assignment or Resource or Video Player */}
        {isQuiz ? (
          <View style={[styles.quizContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.quizHeader}>
              <View style={[styles.badgePill, { backgroundColor: 'rgba(249, 115, 22, 0.15)' }]}>
                <Text style={styles.badgePillText}>Knowledge Check Quiz</Text>
              </View>
              <Text style={[styles.passingText, { color: colors.textSecondary }]}>
                Passing score: {currentLesson.quizData?.passingScore || 70}%
              </Text>
            </View>

            {(currentLesson.quizData?.questions || []).map((qItem: any, qIdx: number) => (
              <View key={qIdx} style={styles.questionBlock}>
                <Text style={[styles.questionText, { color: colors.text }]}>
                  {qIdx + 1}. {qItem.q}
                </Text>
                {qItem.options.map((opt: string, optIdx: number) => {
                  const isSelected = selectedAnswers[qIdx] === optIdx;
                  const isCorrect = qItem.answer === optIdx;
                  let optBg = colors.surfaceLight;
                  let optBorder = colors.border;
                  if (quizSubmitted) {
                    if (isCorrect) {
                      optBg = 'rgba(16, 185, 129, 0.15)';
                      optBorder = '#10B981';
                    } else if (isSelected && !isCorrect) {
                      optBg = 'rgba(239, 68, 68, 0.15)';
                      optBorder = '#EF4444';
                    }
                  } else if (isSelected) {
                    optBg = 'rgba(37, 99, 235, 0.15)';
                    optBorder = colors.primary;
                  }

                  return (
                    <TouchableOpacity
                      key={optIdx}
                      style={[styles.optionItem, { backgroundColor: optBg, borderColor: optBorder }]}
                      onPress={() => handleOptionSelect(qIdx, optIdx)}
                    >
                      <View style={[styles.radioCircle, isSelected && { borderColor: colors.primary }]}>
                        {isSelected && <View style={[styles.radioFill, { backgroundColor: colors.primary }]} />}
                      </View>
                      <Text style={[styles.optionText, { color: colors.text }]}>{opt}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}

            {!quizSubmitted ? (
              <TouchableOpacity
                style={[styles.submitQuizBtn, { backgroundColor: colors.primary }]}
                onPress={handleSubmitQuiz}
              >
                <Text style={styles.submitQuizText}>Submit Answers</Text>
              </TouchableOpacity>
            ) : (
              <View style={[styles.resultCard, { backgroundColor: colors.surfaceLight }]}>
                <Text style={[styles.resultScore, { color: quizScore >= 70 ? colors.success : colors.error }]}>
                  Your Score: {quizScore}%
                </Text>
                <Text style={[styles.resultMessage, { color: colors.textSecondary }]}>
                  {quizScore >= 70
                    ? '🎉 Passed! Lesson marked completed.'
                    : 'Review the module materials and try again to pass.'}
                </Text>
              </View>
            )}
          </View>
        ) : isAssignment ? (
          <View style={[styles.quizContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.quizHeader}>
              <View style={[styles.badgePill, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                <Text style={[styles.badgePillText, { color: '#3b82f6' }]}>Practical Lab Assignment</Text>
              </View>
            </View>
            <Text style={[styles.assignmentTitle, { color: colors.text }]}>
              {currentLesson.assignmentData?.title || currentLesson.title}
            </Text>
            <Text style={[styles.assignmentDesc, { color: colors.textSecondary }]}>
              {currentLesson.assignmentData?.description || 'Implement the project following best practices.'}
            </Text>
            <View style={[styles.rubricBox, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}>
              <Text style={[styles.rubricHeading, { color: colors.text }]}>Evaluation Rubric</Text>
              <Text style={[styles.rubricText, { color: colors.textSecondary }]}>
                {currentLesson.assignmentData?.rubric || 'Clean implementation, zero runtime warnings, and verified functionality.'}
              </Text>
            </View>
          </View>
        ) : isPdf ? (
          <View style={[styles.resourceContainer, { backgroundColor: '#0B0F19', borderColor: '#1E293B' }]}>
            <View style={styles.resourceHeader}>
              <View style={[styles.resourceBadge, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
                <FileText size={16} color="#10B981" />
                <Text style={[styles.resourceBadgeText, { color: '#10B981' }]}>CURATED PDF BLUEPRINT</Text>
              </View>
              <ShieldCheck size={18} color="#10B981" />
            </View>
            <Text style={styles.resourceTitle}>{currentLesson.title}</Text>
            <Text style={styles.resourceDesc}>
              {currentLesson.summary || 'Protected research directory and curated testing portal blueprint.'}
            </Text>
            <View style={styles.protectedNotice}>
              <ShieldCheck size={14} color="#94A3B8" />
              <Text style={styles.protectedNoticeText}>Protected Resource &bull; Secure in-app viewing enabled</Text>
            </View>
          </View>
        ) : isApk ? (
          <View style={[styles.resourceContainer, { backgroundColor: '#0F172A', borderColor: '#1E293B' }]}>
            <View style={styles.resourceHeader}>
              <View style={[styles.resourceBadge, { backgroundColor: 'rgba(99, 102, 241, 0.2)' }]}>
                <Smartphone size={16} color="#818CF8" />
                <Text style={[styles.resourceBadgeText, { color: '#818CF8' }]}>ANDROID CLIENT SETUP</Text>
              </View>
              <ShieldCheck size={18} color="#818CF8" />
            </View>
            <Text style={styles.resourceTitle}>{currentLesson.title}</Text>
            <Text style={styles.resourceDesc}>
              {currentLesson.summary || 'Mobile proxy client setup guide and client installation file.'}
            </Text>
            <View style={styles.protectedNotice}>
              <ShieldCheck size={14} color="#94A3B8" />
              <Text style={styles.protectedNoticeText}>Protected Resource &bull; Configured & accessible inside ETA Mobile App</Text>
            </View>
          </View>
        ) : (
          <View style={styles.playerContainer}>
            {currentLesson.videoUrl ? (
              <WebView
                style={styles.webView}
                source={{ html: videoHtml }}
                allowsInlineMediaPlayback
                mediaPlaybackRequiresUserAction={false}
                javaScriptEnabled
                domStorageEnabled
                scrollEnabled={false}
              />
            ) : (
              <View style={styles.syncingPlaceholder}>
                <Image
                  source={{ uri: currentCourse?.thumbnail || 'https://expressteck.tech/wp-content/uploads/2026/10/1-1024x576.jpeg' }}
                  style={styles.syncingPoster}
                />
                <View style={styles.syncingOverlay}>
                  <AlertCircle size={28} color="#FF7700" />
                  <Text style={styles.syncingTitle}>Streaming Lesson Video</Text>
                  <Text style={styles.syncingText}>
                    This lesson is currently syncing on the server. Read the lesson breakdown below.
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Lesson Details Card */}
        <View style={[styles.detailsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.lessonTitle, { color: colors.text }]}>{currentLesson.title}</Text>

          <View style={styles.actionButtonsRow}>
            {/* Protected In-App Offline Download Button */}
            <TouchableOpacity
              style={[
                styles.actionPill,
                {
                  backgroundColor: isDownloaded ? 'rgba(16, 185, 129, 0.15)' : colors.surfaceLight,
                  borderColor: isDownloaded ? '#10B981' : colors.border,
                  borderWidth: 1,
                },
              ]}
              onPress={handleToggleDownload}
            >
              {isDownloaded ? (
                <>
                  <Check size={16} color="#10B981" />
                  <Text style={[styles.actionPillText, { color: '#10B981', fontWeight: '700' }]}>
                    Downloaded (Offline)
                  </Text>
                </>
              ) : (
                <>
                  <Download size={16} color={colors.primary} />
                  <Text style={[styles.actionPillText, { color: colors.text }]}>Download Offline</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionPill,
                {
                  backgroundColor: isCompleted ? colors.success : colors.surfaceLight,
                  borderColor: isCompleted ? colors.success : colors.border,
                  borderWidth: 1,
                },
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

        {/* Protected In-App Resource Information */}
        <View style={[styles.descriptionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.descHeading, { color: colors.text }]}>Lesson Overview & Materials</Text>
          <Text style={[styles.descBody, { color: colors.textSecondary }]}>
            {currentLesson.summary ||
              'All learning materials and practical sessions are securely streamed and available for offline viewing inside the ETA App.'}
          </Text>

          <View style={styles.secureBadgeRow}>
            <ShieldCheck size={16} color="#10B981" />
            <Text style={styles.secureBadgeText}>
              Protected Content &bull; Offline downloads stay secure in your app sandbox
            </Text>
          </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  backBtn: {
    paddingVertical: 4,
    paddingRight: 10,
  },
  backText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerCourseTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  playerContainer: {
    height: 230,
    marginHorizontal: 16,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 14,
    backgroundColor: '#000',
  },
  webView: {
    flex: 1,
    backgroundColor: '#000',
  },
  syncingPlaceholder: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#000',
  },
  syncingPoster: {
    width: '100%',
    height: '100%',
    opacity: 0.35,
  },
  syncingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
  },
  syncingTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
  },
  syncingText: {
    color: '#94A3B8',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
  },
  resourceContainer: {
    marginHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    padding: 22,
    marginBottom: 14,
  },
  resourceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  resourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  resourceBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  resourceTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  resourceDesc: {
    color: '#CBD5E1',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 16,
  },
  protectedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  protectedNoticeText: {
    color: '#94A3B8',
    fontSize: 11,
  },
  detailsCard: {
    marginHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  lessonTitle: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
    marginBottom: 14,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 24,
  },
  actionPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  segmentContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
    marginBottom: 12,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
  },
  descriptionCard: {
    marginHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    gap: 10,
  },
  descHeading: {
    fontSize: 15,
    fontWeight: '700',
  },
  descBody: {
    fontSize: 13,
    lineHeight: 20,
  },
  secureBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  secureBadgeText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '500',
  },
  quizContainer: {
    marginHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginBottom: 14,
  },
  quizHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  badgePill: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  badgePillText: {
    color: '#F97316',
    fontSize: 11,
    fontWeight: '700',
  },
  passingText: {
    fontSize: 12,
  },
  questionBlock: {
    marginBottom: 20,
  },
  questionText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
    lineHeight: 20,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
    gap: 10,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioFill: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  optionText: {
    flex: 1,
    fontSize: 13,
  },
  submitQuizBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  submitQuizText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  resultCard: {
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  resultScore: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  resultMessage: {
    fontSize: 13,
    textAlign: 'center',
  },
  assignmentTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  assignmentDesc: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 16,
  },
  rubricBox: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  rubricHeading: {
    fontSize: 12,
    fontWeight: '700',
  },
  rubricText: {
    fontSize: 12,
    lineHeight: 18,
  },
});
