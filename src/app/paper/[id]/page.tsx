import { Paper, Summary } from '@/types';
import PaperDetailClient from './PaperDetailClient';

interface PaperDetailProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function PaperDetail({ params }: PaperDetailProps) {
  const { id } = await params;
  
  return <PaperDetailClient paperId={id} />;
} 