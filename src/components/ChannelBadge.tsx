import { Instagram, MessageCircle, Hand, Facebook } from "lucide-react";
import type { Channel } from "@/lib/operia-store";

const styles: Record<Channel, string> = {
  whatsapp: "bg-success/10 text-success/90 border-success/25",
  instagram: "bg-[oklch(0.7_0.18_15)]/12 text-foreground/80 border-[oklch(0.7_0.18_15)]/30",
  facebook: "bg-[oklch(0.55_0.2_260)]/12 text-foreground/80 border-[oklch(0.55_0.2_260)]/30",
  manual: "bg-secondary text-muted-foreground border-border",
};

const labels: Record<Channel, string> = {
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  facebook: "Facebook",
  manual: "Manual",
};

export function ChannelBadge({ canal, compact }: { canal?: Channel; compact?: boolean }) {
  const c: Channel = canal ?? "manual";
  const Icon =
    c === "whatsapp" ? MessageCircle :
    c === "instagram" ? Instagram :
    c === "facebook" ? Facebook :
    Hand;
  return (
    <span className={`inline-flex items-center gap-1 px-2 h-[20px] rounded-full text-[10.5px] font-medium border ${styles[c]}`}>
      <Icon className="h-3 w-3" />
      {!compact && labels[c]}
    </span>
  );
}
