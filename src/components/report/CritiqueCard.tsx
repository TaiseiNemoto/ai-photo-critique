import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CritiqueCardProps {
  title: string;
  icon: string;
  content: string;
}

export function CritiqueCard({ title, icon, content }: CritiqueCardProps) {
  return (
    <Card
      className="border-l-4 border-l-gray-400 bg-white border-gray-200 shadow-sm"
      role="region"
      aria-labelledby={`critique-${title.toLowerCase()}`}
    >
      <CardHeader className="pb-3">
        <CardTitle
          id={`critique-${title.toLowerCase()}`}
          className="flex items-center gap-2 text-gray-800 text-base sm:text-lg"
        >
          <span
            className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-bold border border-gray-200 shrink-0"
            aria-hidden="true"
          >
            {icon}
          </span>
          <span className="truncate">{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-gray-700 leading-relaxed whitespace-pre-line text-sm sm:text-base">
          {content}
        </p>
      </CardContent>
    </Card>
  );
}
