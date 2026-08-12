import { ReceiptReviewPage } from "@/components/ReceiptReviewForm";

type ReviewPageProps = {
  params: Promise<{ id: string }>;
};

export default async function SplitReviewPage({ params }: ReviewPageProps) {
  const { id } = await params;
  return <ReceiptReviewPage splitId={id} />;
}
