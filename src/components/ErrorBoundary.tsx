import { Component, type ErrorInfo, type ReactNode } from "react";

interface State {
  failed: boolean;
}

// Se algo quebrar, mostra uma saída em vez de tela branca. Os dados continuam salvos.
export default class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Carta de Rota:", error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="fallback" role="alert">
        <h1>Algo saiu do rumo.</h1>
        <p>Seus dados continuam salvos neste navegador. Recarregue a página para voltar à rota.</p>
        <button type="button" className="btn btn--primary" onClick={() => window.location.reload()}>
          Recarregar
        </button>
      </div>
    );
  }
}
