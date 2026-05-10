import { Redirect, Stack, useLocalSearchParams } from 'expo-router';

export default function MarketingLegalQQuestionRedirect() {
  const { questionId } = useLocalSearchParams<{ questionId: string }>();

  if (!questionId || typeof questionId !== 'string') {
    return (
      <>
        <Stack.Screen options={{ title: 'Legal Q&A' }} />
        <Redirect href="/marketing/legal-qa" />
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Question' }} />
      <Redirect href={{ pathname: '/legal-qa/[questionId]', params: { questionId } }} />
    </>
  );
}
