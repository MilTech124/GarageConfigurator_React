export function assetPath(path) {
  const clean = String(path).replace(/^\.?\//, "");
  const runtimeBase = globalThis?.__CONFIGURATOR_PLUGIN__?.assetsBaseUrl;
  if (runtimeBase) {
    const normalized = runtimeBase.endsWith("/") ? runtimeBase : `${runtimeBase}/`;
    return `${normalized}${clean}`;
  }
  return `${import.meta.env.BASE_URL}${clean}`;
}
