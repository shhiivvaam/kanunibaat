import { QaDetail } from '@/features/qa/qa-detail';

export default async function QuestionPage(props: { params: Promise<{ questionId: string }> }) {
  const { questionId } = await props.params;
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <QaDetail id={questionId} />
    </div>
  );
}
