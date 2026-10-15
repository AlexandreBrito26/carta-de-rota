import { useEffect, useRef } from "react";

export type InfoTab = "help" | "news";

interface InfoDialogProps {
  tab: InfoTab | null;
  onClose: () => void;
  onTab: (tab: InfoTab) => void;
}

const CHANGES = [
  { version: "1.9", items: ["Modo tela cheia para o timer de foco, saindo com Esc.", "Revisão de acessibilidade: nomes e rótulos em todos os controles."] },
  { version: "1.8", items: ["Exportar o histórico de horas em CSV, para abrir em planilha."] },
  { version: "1.7", items: ["Aviso sonoro e notificação ao terminar o timer de foco.", "Meta semanal de horas, com barra de progresso.", "Histórico dos últimos 14 dias em gráfico.", "Correção do espaço vazio na coluna lateral."] },
  { version: "1.6", items: ["Timer de foco de 25 minutos por tópico, que registra o tempo ao terminar.", "Sequência de dias seguidos estudando, no cabeçalho.", "Busca e ordenação na rota.", "Confete ao concluir, e uma celebração maior ao terminar a rota.", "Ondas de clique nos botões e barras que crescem na entrada."] },
  { version: "1.5", items: ["Botão Efeitos para ligar e desligar as animações.", "Fundo com linhas de profundidade e bolhas em canvas."] },
  { version: "1.4", items: ["Fundo animado em canvas, inspirado numa carta náutica.", "A rota se desenha sozinha, com um navio percorrendo o trajeto."] },
  { version: "1.3", items: ["Ajuda e novidades no rodapé, com passos e atalhos.", "Janela de novidades com o histórico de versões."] },
  { version: "1.2", items: ["App instalável e funcionando sem internet.", "Tela de primeiro uso com exemplo.", "Tratamento de erro com saída amigável."] },
  { version: "1.1", items: ["Visual neumórfico nos dois temas.", "Marca nova com agulha animada.", "Troca de tema com transição circular.", "Números animados e brilho que segue o cursor."] },
  { version: "1.0", items: ["Etapas, previsão por dia da semana e linha do tempo.", "Backup em JSON, edição de tópicos e desfazer exclusão."] },
];

export default function InfoDialog({ tab, onClose, onTab }: InfoDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (tab && !dialog.open) dialog.showModal();
    if (!tab && dialog.open) dialog.close();
  }, [tab]);

  return (
    <dialog
      ref={ref}
      className="info"
      aria-labelledby="info-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="info__head">
        <div role="tablist" className="info__tabs">
          <button role="tab" type="button" aria-selected={tab === "help"} className="chip" aria-pressed={tab === "help"} onClick={() => onTab("help")}>Como usar</button>
          <button role="tab" type="button" aria-selected={tab === "news"} className="chip" aria-pressed={tab === "news"} onClick={() => onTab("news")}>Novidades</button>
        </div>
        <button type="button" className="info__close" onClick={onClose} aria-label="Fechar">×</button>
      </div>

      {tab === "help" && (
        <div className="info__body">
          <h2 id="info-title">Como usar</h2>
          <ol className="steps">
            <li>Crie <strong>etapas</strong> para agrupar os assuntos, como Fundamentos ou Projeto final.</li>
            <li>Adicione <strong>tópicos</strong> com as horas estimadas e o prazo.</li>
            <li>Marque em <strong>Semana de estudo</strong> quanto tempo você tem em cada dia.</li>
            <li>Registre as horas feitas, ou use o <strong>timer de foco</strong> de 25 minutos. A <strong>previsão</strong> se atualiza sozinha.</li>
          </ol>
          <h3>Atalhos</h3>
          <ul className="info__list">
            <li><kbd className="kbd">N</kbd> foca o novo tópico</li>
            <li>Enter registra as horas no campo de um tópico</li>
          </ul>
          <p className="hint">Os dados ficam neste navegador. Use "Exportar backup" para levar a rota para outro aparelho.</p>
        </div>
      )}

      {tab === "news" && (
        <div className="info__body">
          <h2 id="info-title">Novidades</h2>
          {CHANGES.map((c) => (
            <section key={c.version} className="info__release">
              <h3>v{c.version}</h3>
              <ul className="info__list">
                {c.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </dialog>
  );
}
