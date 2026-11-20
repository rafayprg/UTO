import { removeBackground } from "@imgly/background-removal";
const scope = globalThis as unknown as { onmessage: (event: MessageEvent<Blob>) => void; postMessage: (data: unknown) => void };
scope.onmessage = async ({ data }) => {
  try {
    const result = await removeBackground(data, {
      model: "isnet_quint8", device: "cpu", proxyToWorker: false,
      output: { format: "image/png" },
      progress: (key, current, total) => scope.postMessage({ progress: `${key.startsWith("fetch") ? "Downloading model assets" : "Processing on your device"}: ${total ? Math.round(current / total * 100) : 0}%` }),
    });
    scope.postMessage({ result });
  } catch (error) { scope.postMessage({ error: error instanceof Error ? error.message : "Background removal failed. Check your connection for model downloads or try a smaller image." }); }
};
