import { ConsultationRoom } from '@/components/ConsultationRoom';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ConsultationRoomPage({ params }: PageProps) {
  const { id } = await params;
  return <ConsultationRoom leadId={id} />;
}
