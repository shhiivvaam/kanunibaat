import { ScrollView, StyleSheet, Text } from 'react-native';

export function MarketingStaticScreen({
  title,
  paragraphs,
}: {
  title: string;
  paragraphs: string[];
}) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {paragraphs.map((p, i) => (
        <Text key={i} style={styles.p}>
          {p}
        </Text>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 18, paddingBottom: 48, gap: 12 },
  title: { fontSize: 22, fontWeight: '800', color: '#1C1917', marginBottom: 4 },
  p: { fontSize: 15, color: '#44403C', lineHeight: 23 },
});
