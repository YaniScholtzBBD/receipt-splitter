import { ClaimBoard } from "@/components/ClaimBoard";
import { Item, Participant } from "@/lib/types";

type ClaimPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ClaimPage({ params }: ClaimPageProps) {
  const { id } = await params;
  const items: Item[] = [];
  const participants: Participant[] = [];
  const billSubtotal = 0;

  return (
    <ClaimBoard
      splitId={id}
      billSubtotal={billSubtotal}
      initialItems={items}
      participants={participants}
    />
  );
}
