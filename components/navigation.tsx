"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Calculator, Home, Network } from "lucide-react";

export function Navigation() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Home", icon: Home },
    { href: "/linear", label: "Otimização Linear", icon: Calculator },
    { href: "/discrete", label: "Otimização Discreta", icon: Network },
  ];

  return (
    <nav className="border-b bg-card" aria-label="Navegação principal">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center gap-8">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
              <Calculator className="h-5 w-5" aria-hidden="true" />
            </div>
            <span>OptiSolver</span>
          </Link>
          <div className="flex gap-2 ml-auto">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Button
                  key={link.href}
                  asChild
                  variant={isActive ? "default" : "ghost"}
                  className={cn("gap-2", isActive && "pointer-events-none")}
                >
                  <Link href={link.href}>
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    <span>{link.label}</span>
                  </Link>
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
