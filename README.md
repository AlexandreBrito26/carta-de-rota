# Carta de Rota

Planejador de estudos com previsão de conclusão por dia da semana, etapas, linha do tempo, modo dia e noite e backup em JSON.

## Rodar

```bash
npm install
npm run dev       # desenvolvimento
npm run build     # checagem de tipos + build de produção
npm run preview   # testa o build
```

## Como funciona a previsão

- Cada dia da semana tem o seu número de horas (Dom a Sáb).
- Os tópicos pendentes são feitos na ordem do prazo, e cada dia gasta as horas disponíveis.
- Dias com 0h são pulados, então fins de semana livres não atrasam a rota.
- Um tópico é "em risco" quando a previsão passa do prazo, ou quando o prazo já venceu.

## Atalhos

- `N`: foca o campo de novo tópico.

## Dados

Tudo fica no `localStorage` do navegador. Use "Exportar backup" para levar a rota para outro aparelho.
