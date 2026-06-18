import { SessionRoom } from '@/components/SessionRoom';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SessionRoomPage({ params }: PageProps) {
  const { id } = await params;
  return <SessionRoom sessionId={id} />;
}
