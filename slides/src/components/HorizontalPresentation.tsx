import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import logoRedrex from "@/assets/logo-redrex.png";

const stepsData = [
  {
    number: "00",
    title: "Precisão é um Processo.",
    subtitle: "O Método RedRex",
    description:
      "Metodologia prática para equipes que querem velocidade com qualidade usando agentes de IA no ciclo de desenvolvimento.",
    proof: "40-60% menos tempo em revisão · 62% menos bugs · 3x mais rápido",
    isHero: true,
  },
  {
    number: "01",
    title: "DevContainer",
    subtitle: "Segurança",
    description:
      "Agentes de IA são poderosos, mas imprevisíveis. O DevContainer isola o ambiente de desenvolvimento, criando uma sandbox onde a IA opera com permissões restritas.",
    principles: [
      "Isolamento total — montar apenas a pasta do projeto",
      "Firewall de rede — política deny-by-default",
      "Usuário não-root — containers sem privilégios elevados",
      "Zero credenciais de produção dentro do container",
    ],
    responsible: "DevOps / Tech Lead",
  },
  {
    number: "02",
    title: "Arquitetura",
    subtitle: "Desenhar",
    description:
      "Antes de qualquer linha de código, o Tech Lead define o que será construído. A IA é uma ferramenta de execução — sem uma arquitetura clara, ela gera código que funciona isoladamente mas não se integra.",
    principles: [
      "Spec-Driven Development (SDD)",
      "Contrato formal entre humano e IA",
      "Decisões arquiteturais ficam com humanos",
      "Especificação como código executável",
    ],
    responsible: "Tech Lead",
  },
  {
    number: "03",
    title: "TDD",
    subtitle: "Validar",
    description:
      "Quando os testes existem antes do código, a IA não consegue 'trapacear'. Os testes se tornam a especificação executável do sistema.",
    principles: [
      "Red → Green → Refactor com IA",
      "TL escreve testes, IA gera código",
      "Testes como especificação executável",
      "Validação contínua a cada iteração",
    ],
    responsible: "Tech Lead",
  },
  {
    number: "04",
    title: "Desenvolver",
    subtitle: "Comandar IA",
    description:
      "Com testes escritos e falhando, o desenvolvedor comanda a IA para gerar a implementação. O segredo está na qualidade do prompt usando o framework CRISP.",
    principles: [
      "C — Context: stack e ambiente do projeto",
      "R — Role: persona técnica para a IA",
      "I — Instructions: tarefa objetiva",
      "S — Specifications: restrições e contratos",
      "P — Polish: padrões de qualidade",
    ],
    responsible: "Dev + IA",
  },
  {
    number: "05",
    title: "Entender",
    subtitle: "Impacto",
    description:
      "A IA gerou o código, mas o desenvolvedor é responsável por ele. Este passo é sobre leitura crítica e análise de impacto — segurança, performance, manutenibilidade.",
    principles: [
      "42-48% taxa de detecção de bugs com IA",
      "Tempo de revisão: 60min → 25min",
      "62% menos bugs em produção",
      "Análise de dependências e breaking changes",
    ],
    responsible: "Dev",
  },
  {
    number: "06",
    title: "Interface",
    subtitle: "UI/UX",
    description:
      "A IA reduz em 50% o tempo de tarefas repetitivas de UI e 30-40% em debugging de CSS/JS. O humano foca na experiência e nos fluxos do usuário.",
    principles: [
      "Formulários CRUD — qualidade excelente",
      "Layouts responsivos — qualidade boa",
      "UX e fluxo do usuário — revisão obrigatória",
      "Acessibilidade (a11y) — IA mecânica, humano contextual",
    ],
    responsible: "Dev + IA",
  },
  {
    number: "07",
    title: "Otimizar",
    subtitle: "Performance",
    description:
      "Otimização sem métricas é chute. Meça primeiro, otimize depois, meça de novo. Todas as otimizações devem manter os testes existentes passando.",
    principles: [
      "Benchmark antes e depois de cada mudança",
      "Cache para consultas repetidas",
      "Paralelização de operações I/O",
      "Batch processing onde aplicável",
    ],
    responsible: "Dev + IA",
  },
  {
    number: "08",
    title: "Deploy",
    subtitle: "Entregar",
    description:
      "Pipeline CI/CD com IA integrada. Push → Lint → Testes → Security Scan → Build → Deploy. Nunca tudo de uma vez, sempre com rollback.",
    principles: [
      "Blue-Green — troca instantânea e rollback rápido",
      "Canary — liberar para % pequeno de usuários",
      "Feature Flags — funcionalidade controlada por config",
      "Rolling Update — atualização gradual",
    ],
    responsible: "DevOps + IA",
  },
];

const transition = {
  duration: 0.8,
  ease: [0.23, 1, 0.32, 1] as const,
};

interface StepSectionProps {
  step: (typeof stepsData)[0];
  index: number;
}

const StepSection = ({ step, index }: StepSectionProps) => {
  return (
    <section className="step-section flex-shrink-0 w-screen h-svh snap-center flex flex-col justify-center px-[8vw] md:px-[10vw] relative overflow-hidden">
      <div className="relative z-10 max-w-3xl">
        {/* Step number */}
        <motion.span
          initial={{ opacity: 0, x: 60 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: false, amount: 0.5 }}
          transition={{ ...transition, delay: 0 }}
          className="font-display text-[8rem] md:text-[12rem] leading-none font-bold text-transparent select-none"
          style={{
            WebkitTextStroke: step.isHero
              ? "2px hsl(var(--redrex))"
              : "1.5px hsl(var(--muted-foreground) / 0.3)",
          }}
        >
          {step.number}
        </motion.span>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, x: 60 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: false, amount: 0.5 }}
          transition={{ ...transition, delay: 0.1 }}
          className="text-sm md:text-base uppercase tracking-[0.2em] text-redrex font-display mt-[-2rem] md:mt-[-3rem] mb-2"
        >
          {step.subtitle}
        </motion.p>

        {/* Title */}
        <motion.h2
          initial={{ opacity: 0, x: 60 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: false, amount: 0.5 }}
          transition={{ ...transition, delay: 0.15 }}
          className={`font-display font-bold mb-6 leading-[1.1] ${
            step.isHero
              ? "text-4xl md:text-6xl lg:text-7xl"
              : "text-3xl md:text-5xl lg:text-6xl"
          } text-foreground`}
        >
          {step.title}
        </motion.h2>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, x: 60 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: false, amount: 0.5 }}
          transition={{ ...transition, delay: 0.2 }}
          className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-xl mb-8"
        >
          {step.description}
        </motion.p>

        {/* Proof / Principles */}
        {step.proof && (
          <motion.div
            initial={{ opacity: 0, x: 60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: false, amount: 0.5 }}
            transition={{ ...transition, delay: 0.25 }}
            className="inline-block px-4 py-2 border border-redrex/30 rounded-sm"
          >
            <span className="text-sm font-display text-redrex">
              {step.proof}
            </span>
          </motion.div>
        )}

        {"principles" in step && step.principles && (
          <motion.ul
            initial={{ opacity: 0, x: 60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: false, amount: 0.5 }}
            transition={{ ...transition, delay: 0.25 }}
            className="space-y-2"
          >
            {step.principles.map((p: string, i: number) => (
              <li
                key={i}
                className="flex items-start gap-3 text-sm md:text-base text-muted-foreground"
              >
                <span className="text-redrex mt-0.5 font-display text-xs">
                  ▸
                </span>
                {p}
              </li>
            ))}
          </motion.ul>
        )}

        {"responsible" in step && step.responsible && (
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: false, amount: 0.5 }}
            transition={{ ...transition, delay: 0.35 }}
            className="mt-8 text-xs uppercase tracking-[0.15em] text-muted-foreground font-display"
          >
            Responsável: {step.responsible}
          </motion.p>
        )}
      </div>

      {/* Step indicator line */}
      {!step.isHero && (
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: false, amount: 0.5 }}
          transition={{ ...transition, delay: 0.3 }}
          className="absolute bottom-12 left-[8vw] md:left-[10vw] h-px w-24 bg-redrex origin-left"
        />
      )}

      {/* Progress indicator */}
      <div className="absolute bottom-12 right-[8vw] md:right-[10vw] text-xs font-display text-muted-foreground">
        {String(index).padStart(2, "0")} / 08
      </div>
    </section>
  );
};

const Watermark = ({ containerRef }: { containerRef: React.RefObject<HTMLDivElement | null> }) => {
  const { scrollXProgress } = useScroll({ container: containerRef });
  const x = useTransform(scrollXProgress, [0, 1], ["0%", "-20%"]);

  return (
    <motion.div className="watermark opacity-5 dark:opacity-[0.03]" style={{ x }}>
      <img
        src={logoRedrex}
        alt=""
        className="w-[60vw] max-w-none grayscale"
        aria-hidden="true"
      />
    </motion.div>
  );
};

const HorizontalPresentation = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="relative h-svh w-screen overflow-hidden bg-background">
      <Watermark containerRef={containerRef} />

      {/* Navigation hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="fixed bottom-12 left-1/2 -translate-x-1/2 z-40 text-xs font-display text-muted-foreground tracking-widest pointer-events-none"
      >
        SCROLL →
      </motion.div>

      <div
        ref={containerRef}
        className="flex overflow-x-scroll snap-x snap-mandatory h-svh w-screen scrollbar-none"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {stepsData.map((step, i) => (
          <StepSection key={step.number} step={step} index={i} />
        ))}
      </div>
    </div>
  );
};

export default HorizontalPresentation;
