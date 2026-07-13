export const sharePdf = async (blob: Blob, filename: string) => {
  const file = new File([blob], filename, { type: "application/pdf" });
  const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
  if (navigator.share && nav.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: "Prestação de contas Insanos MC" });
    return;
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
  alert("Seu navegador não permite compartilhar o arquivo diretamente. O PDF foi preparado para download.");
};
