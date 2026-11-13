import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Star } from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { courseService } from '../services/courseService';
import { CourseReviewItem } from '../data/types';

interface ReviewsState {
  average: number;
  count: number;
  breakdown: { [key: string]: number };
  reviews: CourseReviewItem[];
  canReview: boolean;
}

const EMPTY: ReviewsState = { average: 0, count: 0, breakdown: {}, reviews: [], canReview: false };

export function CourseReviews({ courseId }: { courseId: string }) {
  const router = useRouter();
  const { colors, isAuthenticated, showToast } = useApp();

  const [state, setState] = useState<ReviewsState>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const res = await courseService.fetchCourseReviews(courseId);
    if (res.success && res.data) {
      const d: any = res.data;
      setState({
        average: Number(d.average_rating || 0),
        count: Number(d.reviews_count || 0),
        breakdown: d.rating_breakdown || {},
        reviews: Array.isArray(d.reviews) ? d.reviews : [],
        canReview: d.can_review === true,
      });
    } else {
      setLoadError(res.error || 'Could not load reviews.');
    }
    setLoading(false);
  }, [courseId]);

  useEffect(() => {
    load();
    // Reload when the user signs in or out, since can_review depends on the token.
  }, [load, isAuthenticated]);

  const submit = async () => {
    if (submitting) return;
    if (rating < 1) {
      setSubmitError('Please choose a star rating.');
      return;
    }
    if (!content.trim()) {
      setSubmitError('Please write a few words about the course.');
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    const res = await courseService.submitCourseReview({
      course_id: courseId,
      rating,
      title: title.trim(),
      content: content.trim(),
    });
    setSubmitting(false);

    if (res.success) {
      showToast('Thanks! Your review has been posted.');
      setRating(0);
      setTitle('');
      setContent('');
      await load();
      return;
    }
    // 401 also triggers the global sign-out handler in apiClient.
    setSubmitError(res.error || 'Could not post your review. Please try again.');
    if (res.statusCode === 409 || res.statusCode === 403) {
      setState((s) => ({ ...s, canReview: false }));
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (loadError) {
    return (
      <View style={styles.center}>
        <Text style={{ color: colors.textSecondary, marginBottom: 10 }}>{loadError}</Text>
        <TouchableOpacity onPress={load}>
          <Text style={{ color: colors.accent, fontWeight: '600' }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View>
      {/* Summary */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryLeft}>
            <Text style={[styles.average, { color: colors.text }]}>{state.average.toFixed(1)}</Text>
            <Stars value={Math.round(state.average)} size={14} />
            <Text style={[styles.muted, { color: colors.textSecondary }]}>
              {state.count} {state.count === 1 ? 'review' : 'reviews'}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            {[5, 4, 3, 2, 1].map((n) => {
              const c = Number(state.breakdown[String(n)] || 0);
              const pct = state.count > 0 ? (c / state.count) * 100 : 0;
              return (
                <View key={n} style={styles.barRow}>
                  <Text style={[styles.barLabel, { color: colors.textSecondary }]}>{n}</Text>
                  <View style={[styles.barTrack, { backgroundColor: colors.surfaceLight }]}>
                    <View style={[styles.barFill, { width: `${pct}%` }]} />
                  </View>
                  <Text style={[styles.barLabel, { color: colors.textSecondary }]}>{c}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      {/* Write a review */}
      {state.canReview ? (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.heading, { color: colors.text }]}>Write a review</Text>
          <View style={styles.starPicker}>
            {[1, 2, 3, 4, 5].map((n) => (
              <TouchableOpacity key={n} onPress={() => setRating(n)} hitSlop={6} accessibilityLabel={`${n} stars`}>
                <Star size={28} color="#F59E0B" fill={n <= rating ? '#F59E0B' : 'transparent'} />
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Title (optional)"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceLight }]}
            maxLength={120}
          />
          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder="What did you think of this course?"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, styles.multiline, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceLight }]}
            multiline
            maxLength={2000}
          />
          {submitError && <Text style={[styles.error, { color: colors.error }]}>{submitError}</Text>}
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.accent, opacity: submitting ? 0.6 : 1 }]}
            onPress={submit}
            disabled={submitting}
          >
            {submitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Post review</Text>}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {!isAuthenticated ? (
            <TouchableOpacity onPress={() => router.push('/auth/login' as any)}>
              <Text style={[styles.muted, { color: colors.textSecondary }]}>
                <Text style={{ color: colors.accent, fontWeight: '600' }}>Sign in</Text> to review this course.
              </Text>
            </TouchableOpacity>
          ) : (
            <Text style={[styles.muted, { color: colors.textSecondary }]}>
              {submitError || 'Only learners who have bought or started watching this course can review it.'}
            </Text>
          )}
        </View>
      )}

      {/* List */}
      {state.reviews.length === 0 ? (
        <Text style={[styles.muted, { color: colors.textSecondary, textAlign: 'center', marginTop: 8 }]}>
          No reviews yet.
        </Text>
      ) : (
        state.reviews.map((r) => (
          <View key={String(r.id)} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.reviewHeader}>
              <Text style={[styles.reviewName, { color: colors.text }]} numberOfLines={1}>{r.name}</Text>
              <Text style={[styles.muted, { color: colors.textMuted }]}>{r.date}</Text>
            </View>
            <Stars value={Number(r.rating) || 0} size={12} />
            {!!r.title && <Text style={[styles.reviewTitle, { color: colors.text }]}>{r.title}</Text>}
            <Text style={[styles.body, { color: colors.textSecondary }]}>{r.content}</Text>
          </View>
        ))
      )}
    </View>
  );
}

function Stars({ value, size }: { value: number; size: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2, marginVertical: 4 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={size} color="#F59E0B" fill={n <= value ? '#F59E0B' : 'transparent'} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { padding: 24, alignItems: 'center' },
  card: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 12 },
  summaryRow: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  summaryLeft: { alignItems: 'center', minWidth: 80 },
  average: { fontSize: 32, fontWeight: '700' },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginVertical: 2 },
  barLabel: { fontSize: 11, width: 16, textAlign: 'center' },
  barTrack: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: 6, backgroundColor: '#F59E0B' },
  heading: { fontSize: 15, fontWeight: '700', marginBottom: 8 },
  starPicker: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, marginBottom: 10 },
  multiline: { minHeight: 96, textAlignVertical: 'top' },
  error: { fontSize: 13, marginBottom: 10 },
  button: { borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  buttonText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  muted: { fontSize: 13 },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  reviewName: { fontSize: 14, fontWeight: '600', flex: 1 },
  reviewTitle: { fontSize: 14, fontWeight: '600', marginTop: 4 },
  body: { fontSize: 13, lineHeight: 19, marginTop: 4 },
});
