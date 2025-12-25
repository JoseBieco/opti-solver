import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, ExternalLink } from "lucide-react";
import Image from "next/image";

export function ProfileCard() {
  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Sobre o Desenvolvedor</CardTitle>
        <CardDescription>Informações do autor desta ferramenta</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="flex-shrink-0">
            <Image
              src="https://scholar.googleusercontent.com/citations?view_op=medium_photo&user=uqZV3EkAAAAJ&citpid=2"
              alt="Foto de José Eduardo Saroba Bieco"
              width={120}
              height={120}
              className="rounded-full border-2 border-border"
            />
          </div>

          <div className="flex-1 space-y-4">
            <div>
              <h3 className="text-xl font-semibold mb-1">
                José Eduardo Saroba Bieco
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Engenheiro da Computação (FACENS), Especialista em IA (UTFPR) e
                Mestrando (ICMC - USP), com foco de pesquisa em Otimização.
                <br />
                <strong>Email:</strong> jose.bieco@usp.br
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="gap-2 bg-transparent"
              >
                <a
                  href="mailto:jose.bieco@usp.br"
                  aria-label="Enviar email para José Eduardo Saroba Bieco"
                >
                  <Mail className="h-4 w-4" aria-hidden="true" />
                  <span>Email</span>
                </a>
              </Button>

              <Button
                asChild
                variant="outline"
                size="sm"
                className="gap-2 bg-transparent"
              >
                <a
                  href="http://lattes.cnpq.br/1790961525430099"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Ver Currículo Lattes de José Eduardo Saroba Bieco (abre em nova aba)"
                >
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  <span>Lattes</span>
                </a>
              </Button>

              <Button
                asChild
                variant="outline"
                size="sm"
                className="gap-2 bg-transparent"
              >
                <a
                  href="https://www.linkedin.com/in/josebieco"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Ver perfil LinkedIn de José Eduardo Saroba Bieco (abre em nova aba)"
                >
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  <span>LinkedIn</span>
                </a>
              </Button>

              <Button
                asChild
                variant="outline"
                size="sm"
                className="gap-2 bg-transparent"
              >
                <a
                  href="https://orcid.org/0009-0009-3773-9005"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Ver perfil ORCID de José Eduardo Saroba Bieco (abre em nova aba)"
                >
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  <span>ORCID</span>
                </a>
              </Button>

              <Button
                asChild
                variant="outline"
                size="sm"
                className="gap-2 bg-transparent"
              >
                <a
                  href="https://scholar.google.com/citations?hl=pt-BR&user=uqZV3EkAAAAJ"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Ver perfil Google Scholar de José Eduardo Saroba Bieco (abre em nova aba)"
                >
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  <span>Google Scholar</span>
                </a>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
