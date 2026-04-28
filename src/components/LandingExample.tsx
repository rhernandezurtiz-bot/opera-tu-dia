import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, ArrowDown, Send } from "lucide-react";

export function LandingExample({
  icon: Icon,
  input,
  tipo,
  fields,
  action,
  message,
}: {
  icon: any;
  input: string;
  tipo: string;
  fields: { label: string; value: string; missing?: boolean }[];
  action: string;
  message: string;
}) {
  return (
    <Card className="p-5 rounded-2xl flex flex-col gap-3">
      <div className="flex items-start gap-2">
        <div className="h-7 w-7 rounded-full bg-success/15 text-success grid place-items-center shrink-0">
          <MessageSquare className="h-3.5 w-3.5" />
        </div>
        <div className="flex-1">
          <div className="text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground mb-1">
            Mensaje del cliente
          </div>
          <div className="text-[13.5px] bg-success/8 border border-success/20 rounded-2xl rounded-tl-sm px-3 py-2 leading-snug">
            {input}
          </div>
        </div>
      </div>

      <div className="flex justify-center text-muted-foreground">
        <ArrowDown className="h-4 w-4" />
      </div>

      <div className="rounded-xl border border-border bg-secondary/40 p-3.5">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-7 w-7 rounded-lg bg-foreground text-background grid place-items-center">
            <Icon className="h-3.5 w-3.5" />
          </div>
          <div className="text-[12.5px] font-semibold">{tipo}</div>
        </div>
        <ul className="space-y-1.5">
          {fields.map((f) => (
            <li key={f.label} className="flex justify-between gap-3 text-[12.5px]">
              <span className="text-muted-foreground">{f.label}</span>
              <span
                className={
                  f.missing
                    ? "text-danger/90 font-medium"
                    : "text-foreground font-medium"
                }
              >
                {f.missing ? "⚠ " : ""}
                {f.value}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex justify-center text-muted-foreground">
        <ArrowDown className="h-4 w-4" />
      </div>

      <div className="rounded-xl border border-foreground/15 bg-foreground/3 p-3.5">
        <div className="text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground mb-1">
          Próxima acción
        </div>
        <div className="text-[13.5px] font-semibold mb-2">{action}</div>
        <div className="text-[12.5px] text-foreground/80 italic leading-snug mb-3">
          "{message}"
        </div>
        <Button size="sm" className="w-full h-9">
          <Send className="h-3.5 w-3.5" /> Copiar y enviar
        </Button>
      </div>
    </Card>
  );
}
