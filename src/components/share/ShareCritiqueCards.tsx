import { CritiqueCard } from "@/components/report/CritiqueCard";

interface CritiqueData {
  technical: string;
  composition: string;
  color: string;
}

interface ShareCritiqueCardsProps {
  critiqueData: CritiqueData;
}

export function ShareCritiqueCards({ critiqueData }: ShareCritiqueCardsProps) {
  return (
    <div className="space-y-6 mb-8">
      <CritiqueCard title="技術面" icon="技" content={critiqueData.technical} />
      <CritiqueCard title="構図" icon="構" content={critiqueData.composition} />
      <CritiqueCard title="色彩" icon="色" content={critiqueData.color} />
    </div>
  );
}
