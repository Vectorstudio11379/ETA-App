import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '../context/AppContext';
import { courseService } from '../services/courseService';
import { CourseQAItem } from '../data/types';

export function CourseQA({ courseId }: { courseId: string }) {
  const router = useRouter();
  const { colors, showToast, isAuthenticated } = useApp();

  const [items, setItems] = useState<CourseQAItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);

  const [question, setQuestion] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const res = await courseService.fetchCourseQA(courseId);
    if (res.success && res.data) {
      setItems(Array.isArray(res.data.qa_items) ? res.data.qa_items : []);
    } else {
      setLoadError(res.error || 'Could not load questions.');
    }
    setLoading(false);
  }, [courseId]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async () => {
    const text = question.trim();
    if (submitting) return;
    if (text.length < 5) {
      setSubmitError('Please write a little more so the instructor can help.');
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    const res = await courseService.submitCourseQuestion({ course_id: courseId, question: text });
    setSubmitting(false);

    if (res.success) {
      showToast(res.data?.message || 'Your question has been sent to the instructors.');
      setQuestion('');
      const newItem = res.data?.qa_item;
      if (newItem) setItems((prev) => [newItem, ...prev]);
      else await load();
      setExpanded(0);
      return;
    }
    setSubmitError(res.error || 'Could not send your question. Please try again.');
  };

  // One reply box at a time: the one under the open question.
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);

  useEffect(() => {
    setReplyText('');
    setReplyError(null);
  }, [expanded]);

  const sendReply = async (idx: number) => {
    const item = items[idx];
    const text = replyText.trim();
    if (!item?.id || replying) return;
    if (text.length < 2) {
      setReplyError('Please write a little more.');
      return;
    }
    setReplying(true);
    setReplyError(null);
    const res = await courseService.replyToCourseQuestion({ question_id: item.id, reply: text });
    setReplying(false);

    const reply = res.data?.reply;
    if (res.success && reply) {
      setReplyText('');
      setItems((prev) =>
        prev.map((q, i) => {
          if (i !== idx) return q;
          const replies = [...(q.replies || []), reply];
          return {
            ...q,
            replies,
            reply_count: replies.length,
            answered: q.answered || reply.is_instructor,
            answer: !q.answered && reply.is_instructor ? reply.content : q.answer,
          };
        })
      );
      showToast(res.data?.message || 'Your reply has been posted.');
      return;
    }
    if (res.success) {
      await load();
      return;
    }
    setReplyError(res.error || 'Could not post your reply. Please try again.');
  };

  return (
    <View>
      {!isAuthenticated ? (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.push('/auth/login' as any)}>
            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
              <Text style={{ color: colors.accent, fontWeight: '600' }}>Sign in</Text> to ask the instructor a question.
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.heading, { color: colors.text }]}>Ask a question</Text>
        <TextInput
          value={question}
          onChangeText={setQuestion}
          placeholder="What would you like to ask the instructor?"
          placeholderTextColor={colors.textMuted}
          style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceLight }]}
          multiline
          maxLength={1000}
        />
        {submitError && <Text style={[styles.error, { color: colors.error }]}>{submitError}</Text>}
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.accent, opacity: submitting ? 0.6 : 1 }]}
          onPress={submit}
          disabled={submitting}
        >
          {submitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Send question</Text>}
        </TouchableOpacity>
      </View>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : loadError ? (
        <View style={styles.center}>
          <Text style={{ color: colors.textSecondary, marginBottom: 10 }}>{loadError}</Text>
          <TouchableOpacity onPress={load}>
            <Text style={{ color: colors.accent, fontWeight: '600' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : items.length === 0 ? (
        <Text style={[styles.muted, { color: colors.textSecondary }]}>No questions yet. Be the first to ask.</Text>
      ) : (
        items.map((item, idx) => {
          const open = expanded === idx;
          const replies = item.replies || [];
          const canReply = isAuthenticated && !!item.id && item.can_reply !== false;
          const replyCount = item.reply_count ?? replies.length;
          return (
            <View
              key={item.id ? `q-${item.id}` : `${idx}-${item.question.slice(0, 20)}`}
              style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <TouchableOpacity activeOpacity={0.8} onPress={() => setExpanded(open ? null : idx)}>
                {!!item.badge && (
                  <Text style={[styles.badge, { color: colors.accent, backgroundColor: colors.accentLight }]}>{item.badge}</Text>
                )}
                <Text style={[styles.question, { color: colors.text }]}>{item.question}</Text>
                {(item.author || item.date || replyCount > 0) && (
                  <Text style={[styles.meta, { color: colors.textMuted }]}>
                    {[
                      item.author,
                      item.date,
                      replyCount > 0 ? `${replyCount} ${replyCount === 1 ? 'reply' : 'replies'}` : null,
                    ].filter(Boolean).join(' · ')}
                  </Text>
                )}
              </TouchableOpacity>

              {open && (
                <View>
                  {replies.length > 0 ? (
                    replies.map((r) => (
                      <View key={`r-${r.id}`} style={[styles.reply, { borderColor: colors.border }]}>
                        <Text style={[styles.meta, { color: r.is_instructor ? colors.accent : colors.textMuted, marginTop: 0 }]}>
                          {[r.author, r.is_instructor ? 'Instructor' : null, r.date].filter(Boolean).join(' · ')}
                        </Text>
                        <Text style={[styles.answer, { color: colors.textSecondary, marginTop: 4 }]}>{r.content}</Text>
                      </View>
                    ))
                  ) : (
                    !!item.answer && <Text style={[styles.answer, { color: colors.textSecondary }]}>{item.answer}</Text>
                  )}

                  {canReply && (
                    <View style={{ marginTop: 10 }}>
                      <TextInput
                        value={replyText}
                        onChangeText={setReplyText}
                        placeholder="Write a reply..."
                        placeholderTextColor={colors.textMuted}
                        style={[styles.input, { minHeight: 56, color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceLight }]}
                        multiline
                        maxLength={1000}
                      />
                      {replyError && <Text style={[styles.error, { color: colors.error }]}>{replyError}</Text>}
                      <TouchableOpacity
                        style={[styles.button, { backgroundColor: colors.accent, opacity: replying ? 0.6 : 1 }]}
                        onPress={() => sendReply(idx)}
                        disabled={replying}
                      >
                        {replying ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Reply</Text>}
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
            </View>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { padding: 24, alignItems: 'center' },
  card: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 12 },
  heading: { fontSize: 15, fontWeight: '700', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 10,
  },
  error: { fontSize: 13, marginBottom: 10 },
  button: { borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  buttonText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  muted: { fontSize: 13, textAlign: 'center', marginTop: 8 },
  badge: {
    alignSelf: 'flex-start',
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 6,
  },
  question: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
  meta: { fontSize: 12, marginTop: 4 },
  answer: { fontSize: 13, lineHeight: 19, marginTop: 8 },
  reply: { borderLeftWidth: 2, paddingLeft: 10, marginTop: 10 },
});
