import { Card } from "@/components/ui/card";
import { Quote } from "lucide-react";

export function Testimonial({
  quote,
  name,
  role,
  initial,
}: {
  quote: string;
  name: string;
  role: string;
  initial: string;
}) {
  return (
    <Card className="p-6 rounded-2xl flex flex-col gap-4 h-full">
      <Quote className="h-5 w-5 text-foreground/40" />
      <p className="text-[14px] leading-relaxed text-foreground/90 flex-1">
        "{quote}"
      </p>
      <div className="flex items-center gap-3 pt-3 border-t border-border">
        <div className="h-9 w-9 rounded-full bg-foreground text-background grid place-items-center text-[13px] font-semibold shrink-0">
          {initial}
        </div>
        <div className="min-w-0">
          <div className="text-[13.5px] font-semibold truncate">{name}</div>
          <div className="text-[12px] text-muted-foreground truncate">{role}</div>
        </div>
      </div>
    </Card>
  );
}
