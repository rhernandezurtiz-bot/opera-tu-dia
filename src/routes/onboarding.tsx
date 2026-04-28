import { createFileRoute, useNavigate, Navigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-store";
import { useOperia } from "@/lib/operia-store";
import { ArrowRight, Check } from "lucide-react";
import operiaIcon from "@/assets/operia-icon.png";
import operiaLogo from "@/assets/operia-logo.png";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Configura tu negocio — Operia" },
      { name: "description", content: "Cuéntanos sobre tu negocio para personalizar Operia." },
    ],
  }),
  component: Onboarding,
});

const TIPOS = [
  "Repostería",
  "Comida / cocina",
  "Floristería",
  "Belleza / estética",
  "Servicios a domicilio",
  "Citas / consultas",
  "Talleres / reparación",
  "Otro",
];

function Onboarding() {
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const onboarded = useAuth((s) => s.onboarded);
  const completeOnboarding = useAuth((s) => s.completeOnboarding);
  const setNegocio = useOperia((s) => s.setNegocio);
  const negocio = useOperia((s) => s.negocio);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  // Redirección imperativa con guardia (evita loops por re-render durante hidratación)
  useEffect(() => {
    if (!hydrated) return;
    if (!user) navigate({ to: "/login" });
    else if (onboarded) navigate({ to: "/app" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, user, onboarded]);

  const [step, setStep] = useState(0);
  const [nombre, setNombre] = useState(negocio.nombre === "Mi Negocio" ? "" : negocio.nombre);
  const [tipo, setTipo] = useState(negocio.tipoNegocio || "");
  const [telefono, setTelefono] = useState(negocio.telefono || "");
  const [horarios, setHorarios] = useState(negocio.horarios || "");
  const [oferta, setOferta] = useState("");

  if (hydrated && (!user || onboarded)) return null;

  const steps = [
    { label: "Nombre", valid: !!nombre.trim() },
    { label: "Tipo", valid: !!tipo },
    { label: "Contacto", valid: !!telefono.trim() },
    { label: "Horario", valid: !!horarios.trim() },
    { label: "Oferta", valid: !!oferta.trim() },
  ];
  const totalSteps = steps.length;
  const current = steps[step];

  const next = () => {
    if (!current.valid) return;
    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else {
      setNegocio({
        nombre: nombre.trim(),
        tipoNegocio: tipo,
        telefono: telefono.trim(),
        horarios: horarios.trim(),
      });
      completeOnboarding();
      navigate({ to: "/app" });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="px-5 md:px-8 h-14 flex items-center border-b border-border">
        <div className="flex items-center gap-2.5">
          <img src={operiaIcon} alt="" className="h-7 w-7 rounded-full" />
          <img src={operiaLogo} alt="Operia" className="h-[16px] w-auto" />
        </div>
      </header>

      <main className="flex-1 grid place-items-center px-5 py-10">
        <div className="w-full max-w-md">
          {/* Progress */}
          <div className="flex items-center gap-1.5 mb-7">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full ${i <= step ? "bg-foreground" : "bg-border"}`}
              />
            ))}
          </div>

          <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground mb-2">
            Paso {step + 1} de {totalSteps}
          </div>

          <Card className="p-6 md:p-8 rounded-2xl">
            {step === 0 && (
              <Field
                title="¿Cómo se llama tu negocio?"
                hint="Lo verás en tu panel y en los mensajes que enviemos a clientes."
              >
                <Input
                  autoFocus
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Pastelería Luna"
                  className="rounded-lg h-11 text-[15px]"
                />
              </Field>
            )}
            {step === 1 && (
              <Field title="¿Qué tipo de negocio tienes?" hint="Operia se adapta al tipo de operación.">
                <div className="grid grid-cols-2 gap-2">
                  {TIPOS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTipo(t)}
                      className={`px-3 py-3 rounded-lg border text-[13px] text-left transition-colors ${
                        tipo === t
                          ? "border-foreground bg-foreground text-background"
                          : "border-border bg-card hover:border-foreground/30"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </Field>
            )}
            {step === 2 && (
              <Field title="¿Cuál es tu teléfono?" hint="El número donde recibes pedidos por WhatsApp.">
                <Input
                  autoFocus
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="+52 55 1234 5678"
                  className="rounded-lg h-11 text-[15px]"
                />
              </Field>
            )}
            {step === 3 && (
              <Field title="¿Cuál es tu horario?" hint="Para sugerir horas realistas a tus clientes.">
                <Input
                  autoFocus
                  value={horarios}
                  onChange={(e) => setHorarios(e.target.value)}
                  placeholder="Lun-Sáb · 10:00 a 19:00"
                  className="rounded-lg h-11 text-[15px]"
                />
              </Field>
            )}
            {step === 4 && (
              <Field title="¿Qué vendes o qué servicios ofreces?" hint="Una línea es suficiente.">
                <Input
                  autoFocus
                  value={oferta}
                  onChange={(e) => setOferta(e.target.value)}
                  placeholder="Ej. Pasteles personalizados y postres por encargo"
                  className="rounded-lg h-11 text-[15px]"
                />
              </Field>
            )}

            <div className="flex items-center justify-between mt-7">
              <button
                type="button"
                onClick={() => setStep(Math.max(0, step - 1))}
                disabled={step === 0}
                className="text-[13px] text-muted-foreground hover:text-foreground disabled:opacity-40"
              >
                Atrás
              </button>
              <Button onClick={next} disabled={!current.valid} className="h-10">
                {step === totalSteps - 1 ? (
                  <>
                    Empezar <Check className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    Continuar <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </Card>

          <p className="text-[12px] text-muted-foreground text-center mt-6">
            Tus datos solo se usan para personalizar Operia.
          </p>
        </div>
      </main>
    </div>
  );
}

function Field({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-[20px] font-semibold tracking-tight mb-1.5">{title}</h2>
      {hint && <p className="text-[13px] text-muted-foreground mb-5">{hint}</p>}
      {children}
    </div>
  );
}
