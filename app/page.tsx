import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calculator, Network, ArrowRight } from "lucide-react";
import Link from "next/link";
import { ProfileCard } from "@/components/profile-card";

export default function HomePage() {
  return (
    <main className="flex-1" tabIndex={-1}>
      <section className="py-20 md:py-32 bg-gradient-to-b from-background to-accent">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-balance">
              Ferramenta de Otimização Matemática
            </h1>
            <p className="text-xl text-muted-foreground text-pretty leading-relaxed">
              Resolva problemas complexos de otimização linear e discreta usando
              algoritmos avançados como Dual Simplex e Branch and Bound
            </p>
            <div className="flex gap-4 justify-center pt-4">
              <Button asChild size="lg" className="gap-2 cursor-pointer">
                <Link href="/linear">
                  <Calculator className="h-5 w-5" aria-hidden="true" />
                  <span>Otimização Linear</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="gap-2 bg-transparent cursor-pointer"
              >
                <Link href="/discrete">
                  <Network className="h-5 w-5" aria-hidden="true" />
                  <span>Otimização Discreta</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">
              Métodos Disponíveis
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="border-2 hover:border-primary transition-colors">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Calculator
                        className="h-6 w-6 text-primary"
                        aria-hidden="true"
                      />
                    </div>
                    <CardTitle className="text-2xl">
                      Otimização Linear
                    </CardTitle>
                  </div>
                  <CardDescription className="text-base">
                    Algoritmo Dual Simplex
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground leading-relaxed">
                    Resolva problemas de programação linear com restrições de
                    desigualdade. O método Dual Simplex é eficiente para
                    problemas onde a otimalidade é mantida mas a viabilidade
                    precisa ser restaurada.
                  </p>
                  <ul
                    className="space-y-2 text-sm text-muted-foreground"
                    aria-label="Recursos da otimização linear"
                  >
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>Visualização da região factível</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>Identificação da solução ótima no gráfico</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>Restrições interativas com identificadores</span>
                    </li>
                  </ul>
                  <Button
                    asChild
                    variant="secondary"
                    className="w-full gap-2 cursor-pointer"
                  >
                    <Link href="/linear">
                      Começar
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-secondary transition-colors">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-secondary/10 flex items-center justify-center">
                      <Network
                        className="h-6 w-6 text-secondary"
                        aria-hidden="true"
                      />
                    </div>
                    <CardTitle className="text-2xl">
                      Otimização Discreta
                    </CardTitle>
                  </div>
                  <CardDescription className="text-base">
                    Algoritmo Branch and Bound
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground leading-relaxed">
                    Resolva problemas de programação inteira usando o algoritmo
                    Branch and Bound. Explore a árvore de decisão e entenda o
                    processo de ramificação e poda.
                  </p>
                  <ul
                    className="space-y-2 text-sm text-muted-foreground"
                    aria-label="Recursos da otimização discreta"
                  >
                    <li className="flex items-start gap-2">
                      <span className="text-secondary mt-1">•</span>
                      <span>Visualização da árvore de decisão</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-secondary mt-1">•</span>
                      <span>Exploração interativa dos nós</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-secondary mt-1">•</span>
                      <span>Detalhes de relaxação e poda</span>
                    </li>
                  </ul>
                  <Button
                    asChild
                    variant="secondary"
                    className="w-full gap-2 cursor-pointer"
                  >
                    <Link href="/discrete">
                      Começar
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <h2 className="text-2xl font-bold">Acessibilidade e Usabilidade</h2>
            <p className="text-muted-foreground leading-relaxed">
              Esta ferramenta foi desenvolvida seguindo as diretrizes WCAG para
              garantir acessibilidade completa. Todos os elementos são
              navegáveis por teclado e compatíveis com leitores de tela.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <ProfileCard />
        </div>
      </section>
    </main>
  );
}
