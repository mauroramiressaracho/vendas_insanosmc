import { useEffect, useMemo, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone));

export const usePwaInstall = () => {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(() => isStandalone());
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem("pwa-install-dismissed") === "1");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const beforeInstall = (event: Event) => {
      event.preventDefault();
      if (!isStandalone()) setPromptEvent(event as BeforeInstallPromptEvent);
    };
    const appInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
      setMessage("Aplicativo instalado com sucesso.");
    };

    window.addEventListener("beforeinstallprompt", beforeInstall);
    window.addEventListener("appinstalled", appInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", beforeInstall);
      window.removeEventListener("appinstalled", appInstalled);
    };
  }, []);

  const canInstall = Boolean(promptEvent && !installed && !dismissed);
  const showInstructions = !installed && !promptEvent && !dismissed;

  const install = async () => {
    if (!promptEvent) {
      setMessage("No Chrome, abra o menu de três pontos e selecione 'Instalar aplicativo' ou 'Adicionar à tela inicial'.");
      return;
    }
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    if (choice.outcome === "accepted") {
      setInstalled(true);
      setMessage("Aplicativo instalado com sucesso.");
    }
    setPromptEvent(null);
  };

  const dismiss = () => {
    sessionStorage.setItem("pwa-install-dismissed", "1");
    setDismissed(true);
  };

  return useMemo(
    () => ({ canInstall, showInstructions, installed, message, install, dismiss }),
    [canInstall, showInstructions, installed, message],
  );
};
