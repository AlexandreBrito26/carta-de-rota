type AudioWindow = Window & { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };

// Dois tons curtos, sem arquivo de áudio. Falha em silêncio se o navegador bloquear.
export function playChime(): void {
  try {
    const w = window as AudioWindow;
    const Ctx = w.AudioContext ?? w.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    [0, 0.25].forEach((delay, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = i === 0 ? 660 : 880;
      osc.connect(gain);
      gain.connect(ctx.destination);
      const t = ctx.currentTime + delay;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
      osc.start(t);
      osc.stop(t + 0.55);
    });
    window.setTimeout(() => void ctx.close(), 1200);
  } catch {
    // áudio indisponível: segue só com o aviso visual
  }
}

export function canNotify(): boolean {
  return "Notification" in window;
}

export function askNotifyPermission(): void {
  if (canNotify() && Notification.permission === "default") {
    void Notification.requestPermission();
  }
}

export function notifyDone(title: string, body: string): void {
  if (canNotify() && Notification.permission === "granted") {
    try {
      new Notification(title, { body, icon: "icon-192.png" });
    } catch {
      // alguns navegadores só aceitam notificações pelo service worker
    }
  }
}
