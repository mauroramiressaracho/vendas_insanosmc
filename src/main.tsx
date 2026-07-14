import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import "./styles/global.css";

const PWA_CACHE_NAME = "caixa-insanos-v4";

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js")
      .then(() => navigator.serviceWorker.ready)
      .then(() => cacheCurrentAppShell())
      .catch(console.error);
  });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

async function cacheCurrentAppShell() {
  if (!("caches" in window)) return;

  const assetUrls = [
    window.location.href,
    "./manifest.json",
    "./manifest.webmanifest",
    "./icon.svg",
    "./icons/icon-192.png",
    "./icons/icon-512.png",
    ...Array.from(document.querySelectorAll<HTMLScriptElement>("script[src]")).map((script) => script.src),
    ...Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"][href]')).map((link) => link.href),
  ];

  const cache = await caches.open(PWA_CACHE_NAME);
  await cache.addAll(assetUrls);
}
