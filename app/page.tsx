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
import Image from "next/image";

export default function HomePage() {
  return (
    <main className="flex-1">
      <section className="relative py-20 md:py-32 bg-gradient-to-b from-background to-accent/30 overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          {/* Grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080801a_1px,transparent_1px),linear-gradient(to_bottom,#8080801a_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]"></div>
          
          {/* Glowing orbs */}
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px] -translate-y-1/2 mix-blend-multiply dark:mix-blend-screen animate-pulse"></div>
          <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-secondary/20 rounded-full blur-[80px] mix-blend-multiply dark:mix-blend-screen animate-pulse" style={{ animationDelay: '2s' }}></div>
          <div className="absolute -bottom-32 left-1/2 w-[600px] h-[400px] bg-accent/30 rounded-full blur-[100px] -translate-x-1/2 mix-blend-multiply dark:mix-blend-screen"></div>
        </div>

        <div className="container relative z-10 mx-auto px-4">
          <div className="max-w-4xl mx-auto flex flex-col items-center text-center space-y-8">
            <div className="relative mb-4">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-2xl blur opacity-30 animate-pulse"></div>
              <Image 
                src="/icon.svg" 
                alt="OptiSolver Logo Hero" 
                width={120} 
                height={120}
                className="relative rounded-2xl shadow-xl border border-background/50"
              />
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-balance bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/70">
              Otimização Matemática <br className="hidden md:block"/>Simplificada
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground text-pretty leading-relaxed max-w-2xl">
              Resolva problemas complexos de otimização linear e discreta usando
              algoritmos avançados como <span lang="en" className="font-semibold text-foreground/80">Dual Simplex</span> e{" "}
              <span lang="en" className="font-semibold text-foreground/80">Branch and Bound</span>.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6 w-full sm:w-auto">
              <Button
                asChild
                size="lg"
                className="gap-2 cursor-pointer h-14 px-8 text-base shadow-lg hover:shadow-primary/25 transition-all"
              >
                <Link href="/linear">
                  <Calculator className="h-5 w-5" aria-hidden="true" />
                  <span>Otimização Linear</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="gap-2 cursor-pointer h-14 px-8 text-base shadow-sm border border-border/50"
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
              <Card
                className="border-2 hover:border-primary transition-colors"
               
              >
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
                    Algoritmo <span lang="en">Dual Simplex</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground leading-relaxed">
                    Resolva problemas de programação linear com restrições de
                    desigualdade. O método <span lang="en">Dual Simplex</span> é
                    eficiente para problemas onde a otimalidade é mantida mas a
                    viabilidade precisa ser restaurada.
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

              <Card
                className="border-2 hover:border-secondary transition-colors"
               
              >
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
                    Algoritmo <span lang="en">Branch and Bound</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground leading-relaxed">
                    Resolva problemas de programação inteira usando o algoritmo
                    <span lang="en">Branch and Bound</span>. Explore a árvore de
                    decisão e entenda o processo de ramificação e poda.
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
