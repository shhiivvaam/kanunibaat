import type { Href } from 'expo-router';
import { Link, Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { trpc } from '@kb/api-client';
import { INDIAN_STATES_AND_UTS } from '@kb/utils';

function Bullets({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.map((line, i) => (
        <Text key={i} style={styles.bullet}>
          • {line}
        </Text>
      ))}
    </View>
  );
}

export default function GuideDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const id = slug ?? '';
  const detail = trpc.emergencyGuide.bySlug.useQuery({ slug: id }, { enabled: Boolean(id) });
  const [stateCode, setStateCode] = useState('DL');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const personalize = trpc.emergencyGuide.personalize.useMutation();

  const scenario = detail.data?.scenario;
  const guide = personalize.data?.guide;

  const lawyerHref = useMemo(() => {
    const hint = scenario?.lawyerSearchHint ?? 'lawyer';
    return `/(tabs)/lawyers?q=${encodeURIComponent(hint)}` as Href;
  }, [scenario?.lawyerSearchHint]);

  return (
    <>
      <Stack.Screen options={{ title: scenario?.titleEn ?? 'Guide' }} />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.hotlines}>
          <Text style={styles.hotlinesTitle}>Emergency (India)</Text>
          <Text style={styles.hotlinesText}>Police 100 · Women 1091 · Legal Aid 15100</Text>
        </View>

        {detail.isPending ? (
          <ActivityIndicator size="large" />
        ) : detail.isError ? (
          <Text style={styles.error}>{detail.error.message}</Text>
        ) : scenario ? (
          <>
            <Text style={styles.title}>{scenario.titleEn}</Text>
            <Text style={styles.subtitle}>{scenario.titleHi}</Text>

            <Text style={styles.label}>State / UT</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stateRow}>
              {INDIAN_STATES_AND_UTS.map((s) => (
                <Pressable
                  key={s.code}
                  onPress={() => setStateCode(s.code)}
                  style={[styles.stateChip, stateCode === s.code ? styles.stateChipOn : null]}
                >
                  <Text style={[styles.stateChipText, stateCode === s.code ? styles.stateChipTextOn : null]}>
                    {s.code}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {scenario.contextQuestions.map((q) => (
              <View key={q.id} style={styles.field}>
                <Text style={styles.qEn}>{q.labelEn}</Text>
                <Text style={styles.qHi}>{q.labelHi}</Text>
                <TextInput
                  value={answers[q.id] ?? ''}
                  onChangeText={(t) => setAnswers((prev) => ({ ...prev, [q.id]: t }))}
                  multiline
                  style={styles.input}
                />
              </View>
            ))}

            <Pressable
              onPress={() => personalize.mutate({ slug: scenario.slug, stateCode, answers })}
              style={styles.primaryBtn}
              disabled={personalize.isPending}
            >
              <Text style={styles.primaryBtnText}>{personalize.isPending ? '…' : 'Personalise guide'}</Text>
            </Pressable>
            {personalize.isError ? <Text style={styles.error}>{personalize.error.message}</Text> : null}
            {personalize.data?.notice ? <Text style={styles.notice}>{personalize.data.notice}</Text> : null}

            {guide ? (
              <>
                <Bullets title="Right now" items={guide.right_now} />
                <Bullets title="Your rights" items={guide.your_rights} />
                <Bullets title="Documents" items={guide.documents} />
                <Bullets title="What not to do" items={guide.what_not_to_do} />
                <Bullets title="Police / court" items={guide.police_or_court} />
                <Bullets title="Timeline" items={guide.timeline} />
                <Bullets title="Laws (orientation)" items={guide.applicable_laws} />
              </>
            ) : (
              <>
                <Bullets title="Right now" items={[...scenario.base.rightNow]} />
                <Bullets title="Your rights" items={[...scenario.base.rights]} />
                <Bullets title="Documents" items={[...scenario.base.documents]} />
                <Bullets title="What not to do" items={[...scenario.base.whatNotToDo]} />
                <Bullets title="Police / court" items={[...scenario.base.policeOrCourt]} />
                <Bullets title="Timeline" items={[...scenario.base.timeline]} />
                <Bullets title="Laws (orientation)" items={[...scenario.base.applicableLaws]} />
              </>
            )}

            {detail.data?.disclaimer ? <Text style={styles.disclaimer}>{detail.data.disclaimer}</Text> : null}

            <Link href={lawyerHref} style={styles.lawyerLink}>
              <Text style={styles.lawyerLinkText}>Find a relevant lawyer</Text>
            </Link>
          </>
        ) : null}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 48, gap: 10 },
  hotlines: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#E7E5E4',
  },
  hotlinesTitle: { fontWeight: '700', color: '#1C1917' },
  hotlinesText: { fontSize: 12, color: '#44403C', marginTop: 4 },
  title: { fontSize: 22, fontWeight: '700', color: '#1C1917' },
  subtitle: { fontSize: 15, color: '#57534E', marginTop: 4 },
  label: { fontWeight: '600', marginTop: 8, color: '#1C1917' },
  stateRow: { maxHeight: 44, marginVertical: 6 },
  stateChip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginRight: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E7E5E4',
    backgroundColor: '#FFFFFF',
  },
  stateChipOn: { backgroundColor: '#C2410C', borderColor: '#C2410C' },
  stateChipText: { fontSize: 12, fontWeight: '700', color: '#44403C' },
  stateChipTextOn: { color: '#FFFFFF' },
  field: { marginTop: 8 },
  qEn: { fontSize: 14, fontWeight: '600', color: '#292524' },
  qHi: { fontSize: 12, color: '#78716C', marginTop: 2 },
  input: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#E7E5E4',
    borderRadius: 10,
    padding: 10,
    minHeight: 56,
    textAlignVertical: 'top',
    backgroundColor: '#FFFFFF',
  },
  primaryBtn: {
    marginTop: 12,
    backgroundColor: '#C2410C',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#FFFFFF', fontWeight: '700' },
  notice: { fontSize: 13, color: '#92400E', marginTop: 8 },
  section: { marginTop: 14, padding: 12, backgroundColor: '#FAFAF9', borderRadius: 12, borderWidth: 1, borderColor: '#E7E5E4' },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#78716C', textTransform: 'uppercase', marginBottom: 6 },
  bullet: { fontSize: 14, color: '#292524', marginTop: 4, lineHeight: 20 },
  error: { color: '#B91C1C' },
  disclaimer: { fontSize: 11, color: '#A8A29E', marginTop: 8 },
  lawyerLink: {
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#C2410C',
    alignItems: 'center',
  },
  lawyerLinkText: { color: '#FFFFFF', fontWeight: '700' },
});
