// Detailed methodology per mesocycle, shown in the "Detalhes" popup on the
// phase card. Verbatim from the athlete's training plan — "PROGRESSÃO DE
// CARGA E INTENSIDADE (60 DIAS)".

export interface PhaseDetailSection {
  heading: string;
  bullets: string[];
}

export interface PhaseDetailContent {
  title: string;
  intro?: string;
  sections: PhaseDetailSection[];
}

export const PHASE_DETAILS: Record<0 | 1 | 2, PhaseDetailContent> = {
  1: {
    title: "Mesociclo 1 (Semanas 1–4): Acumulação e Técnica",
    sections: [
      {
        heading: "Semanas 1–2",
        bullets: [
          "Foco em estabelecer cargas de trabalho e aperfeiçoar a técnica.",
          "Compostos: escolha uma carga que permita atingir o topo da faixa de repetições com RIR 3. Registre a carga e as repetições.",
          "Isoladores: escolha uma carga que permita atingir o topo da faixa de repetições com RIR 2. Registre a carga e as repetições.",
          "Progressão: se conseguir completar todas as séries e repetições com RIR 3 (compostos) ou RIR 2 (isoladores), aumente 2,5 kg nos compostos e 1 kg nos isoladores na semana seguinte.",
        ],
      },
      {
        heading: "Semanas 3–4",
        bullets: [
          "Aumentar ligeiramente a intensidade.",
          "Compostos: mantenha a carga ou aumente se a progressão da semana anterior foi bem-sucedida. Alvo RIR 2.",
          "Isoladores: mantenha a carga ou aumente se a progressão da semana anterior foi bem-sucedida. Alvo RIR 1.",
          "Progressão: continue buscando aumentar a carga (2,5 kg compostos / 1 kg isoladores) se o alvo de RIR for atingido em todas as séries. Se não conseguir aumentar a carga, tente adicionar 1 repetição em cada série.",
        ],
      },
    ],
  },
  2: {
    title: "Mesociclo 2 (Semanas 5–7): Intensificação e Hipertrofia",
    sections: [
      {
        heading: "Semanas 5–6",
        bullets: [
          "Aumentar a intensidade e introduzir Drop Sets.",
          "Compostos: inicie com a carga da semana 4 ou ligeiramente acima. Alvo RIR 1–2.",
          "Isoladores: inicie com a carga da semana 4 ou ligeiramente acima. Alvo RIR 1.",
          "Drop Sets: a partir da semana 6, inclua um Drop Set na última série do último exercício isolador de cada treino (Tríceps Corda no Treino A, Elevação Lateral Polia no Treino B, Rosca Bayesian Polia no Treino C).",
          "Execução do Drop Set: realize a série até RIR 1. Imediatamente, reduza a carga em 20–25% e continue as repetições até a falha técnica (RIR 0). Registre ambas as fases.",
        ],
      },
      {
        heading: "Semana 7 — Pico de intensidade",
        bullets: [
          "Compostos: tente superar as cargas ou repetições da semana 6, mantendo RIR 1.",
          "Isoladores: tente superar as cargas ou repetições da semana 6, mantendo RIR 1.",
          "Drop Sets: mantenha os Drop Sets no último isolador e, se a recuperação permitir, adicione um Drop Set no penúltimo exercício isolador (ex.: Desenvolvimento Arnold no Treino C, se sentir que pode gerenciar a fadiga).",
        ],
      },
    ],
  },
  0: {
    title: "Semana 8: Deload Ativo",
    sections: [
      {
        heading: "Objetivo",
        bullets: [
          "Reduzir a fadiga acumulada e preparar o corpo para o próximo ciclo.",
        ],
      },
      {
        heading: "Ajustes da semana",
        bullets: [
          "Volume: reduza o número de séries em 40% (ex.: de 3 séries para 2, ou de 2 para 1).",
          "Carga: reduza a carga em 20% em todos os exercícios.",
          "RIR: mantenha RIR 3 em todas as séries.",
          "Drop Sets: não realize Drop Sets nesta semana.",
          "Cardio: mantenha o cardio Zona 2, mas pode reduzir o tempo para 20–25 minutos.",
        ],
      },
    ],
  },
};
