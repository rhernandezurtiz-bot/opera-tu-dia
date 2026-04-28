import { useState } from "react";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, ArrowRight } from "lucide-react";

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Ingresa tu nombre")
    .max(100, "Máximo 100 caracteres"),
  company: z
    .string()
    .trim()
    .min(2, "Ingresa el nombre de tu empresa")
    .max(120, "Máximo 120 caracteres"),
  whatsapp: z
    .string()
    .trim()
    .min(7, "Ingresa un WhatsApp válido")
    .max(20, "Máximo 20 caracteres")
    .regex(/^[\d+\s()-]+$/, "Solo números y símbolos válidos"),
  email: z
    .string()
    .trim()
    .email("Correo inválido")
    .max(255, "Máximo 255 caracteres"),
});

export function DemoRequestModal({
  trigger,
  open,
  onOpenChange,
}: {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setOpen = (v: boolean) => {
    if (!isControlled) setInternalOpen(v);
    onOpenChange?.(v);
    if (!v) {
      // Reset on close after a tick
      setTimeout(() => {
        setSubmitted(false);
        setErrors({});
        setForm({ name: "", company: "", whatsapp: "", email: "" });
      }, 200);
    }
  };

  const [form, setForm] = useState({
    name: "",
    company: "",
    whatsapp: "",
    email: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = schema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((i) => {
        const k = i.path[0] as string;
        if (!fieldErrors[k]) fieldErrors[k] = i.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSubmitting(true);
    // Simulate request — backend integration pending
    await new Promise((r) => setTimeout(r, 700));
    setSubmitting(false);
    setSubmitted(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[460px] rounded-2xl">
        {submitted ? (
          <div className="py-6 text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-foreground text-background grid place-items-center mb-4">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <DialogTitle className="text-[20px] font-semibold tracking-tight">
              Gracias.
            </DialogTitle>
            <p className="mt-2 text-[14px] text-muted-foreground leading-relaxed">
              Te contactamos en menos de 24h hábiles.
            </p>
            <Button
              className="mt-6 rounded-full"
              onClick={() => setOpen(false)}
            >
              Cerrar
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-[20px] font-semibold tracking-tight">
                Solicitar demo
              </DialogTitle>
              <DialogDescription className="text-[13.5px]">
                Te mostramos cómo se vería Operia funcionando con tu operación.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2" noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-[12.5px]">
                  Nombre
                </Label>
                <Input
                  id="name"
                  value={form.name}
                  maxLength={100}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                  placeholder="Tu nombre"
                />
                {errors.name && (
                  <p className="text-[12px] text-destructive">{errors.name}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="company" className="text-[12.5px]">
                  Empresa
                </Label>
                <Input
                  id="company"
                  value={form.company}
                  maxLength={120}
                  onChange={(e) =>
                    setForm({ ...form, company: e.target.value })
                  }
                  placeholder="Nombre de la empresa"
                />
                {errors.company && (
                  <p className="text-[12px] text-destructive">
                    {errors.company}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="whatsapp" className="text-[12.5px]">
                    WhatsApp
                  </Label>
                  <Input
                    id="whatsapp"
                    value={form.whatsapp}
                    maxLength={20}
                    inputMode="tel"
                    onChange={(e) =>
                      setForm({ ...form, whatsapp: e.target.value })
                    }
                    placeholder="+52 ..."
                  />
                  {errors.whatsapp && (
                    <p className="text-[12px] text-destructive">
                      {errors.whatsapp}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-[12.5px]">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    maxLength={255}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    placeholder="tu@empresa.com"
                  />
                  {errors.email && (
                    <p className="text-[12px] text-destructive">
                      {errors.email}
                    </p>
                  )}
                </div>
              </div>
              <Button
                type="submit"
                disabled={submitting}
                className="w-full rounded-full mt-2"
              >
                {submitting ? "Enviando..." : (
                  <>
                    Enviar solicitud <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
              <p className="text-[11.5px] text-muted-foreground text-center">
                Contacto en menos de 24h hábiles.
              </p>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
