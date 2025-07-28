import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CritiqueCardProps {
  title: string;
  icon: string;
  content: string;
}

export function CritiqueCard({ title, icon, content }: CritiqueCardProps) {
  return (
    <Card className="border-l-4 border-l-gray-400 bg-white border-gray-200 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-800">
          <span className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-bold border border-gray-200">
            {icon}
          </span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-700 leading-relaxed whitespace-pre-line">
          {content}
        </p>
      </CardContent>
    </Card>
  );
}