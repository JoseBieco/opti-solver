import { Github } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Footer() {
  return (
    <footer
      className="border-t border-border bg-muted/30 mt-16"
      tabIndex={-1}
      role="contentinfo"
      aria-label="Rodapé do site"
    >
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} OptiSolver. Desenvolvido com
              Next.js e TypeScript.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Ferramenta acadêmica para resolução de problemas de otimização.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="gap-2 bg-transparent cursor-pointer"
            >
              <a
                href="https://github.com/JoseBieco/opti-solver"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Ver repositório no GitHub (abre em nova aba)"
              >
                <Github className="h-4 w-4" aria-hidden="true" />
                <span>Repositório</span>
              </a>
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
}
