import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-display text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página no encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">La página que buscas no existe.</p>
        <div className="mt-6">
          <Link to="/" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Ir al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Operia — Organiza tus pedidos de WhatsApp" },
      { name: "description", content: "Operia convierte tus mensajes de WhatsApp en pedidos organizados, plan de producción y alertas de riesgo. Para reposterías, dark kitchens y pequeños negocios de comida." },
      { property: "og:title", content: "Operia — Organiza tus pedidos de WhatsApp" },
      { property: "og:description", content: "Operia convierte tus mensajes de WhatsApp en pedidos organizados, plan de producción y alertas de riesgo. Para reposterías, dark kitchens y pequeños negocios de comida." },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "Operia — Organiza tus pedidos de WhatsApp" },
      { name: "twitter:description", content: "Operia convierte tus mensajes de WhatsApp en pedidos organizados, plan de producción y alertas de riesgo. Para reposterías, dark kitchens y pequeños negocios de comida." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/9325c3d6-66a5-4f26-b497-cee87504f5da/id-preview-0122f764--6e1e1fec-976e-41f3-a2b1-84f636c87b57.lovable.app-1777475398227.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/9325c3d6-66a5-4f26-b497-cee87504f5da/id-preview-0122f764--6e1e1fec-976e-41f3-a2b1-84f636c87b57.lovable.app-1777475398227.png" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "apple-touch-icon", href: "/favicon.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <>
      <Outlet />
      <Toaster position="top-center" />
    </>
  );
}
