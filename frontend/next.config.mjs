let userConfig = undefined
try {
  userConfig = await import('./v0-user-next.config')
} catch {
  // ignore error
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // OJO: en Next 16 esta opcion ya no hace nada (`next lint` fue eliminado y el
  // build no corre ESLint). El gate de lint vive en `npm run lint` y en el
  // workflow .github/workflows/frontend-quality.yml. Se deja en false para que
  // quede explicito que no queremos saltear lint en ningun lado.
  eslint: {
    ignoreDuringBuilds: false,
  },
  // Este SI es efectivo: `next build` aborta con "Failed to type check" si
  // `tsc` encuentra errores. No volver a poner en true para tapar errores.
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    webpackBuildWorker: true,
    parallelServerBuildTraces: true,
    parallelServerCompiles: true,
  },
}

mergeConfig(nextConfig, userConfig)

function mergeConfig(nextConfig, userConfig) {
  if (!userConfig) {
    return
  }

  for (const key in userConfig) {
    if (
      typeof nextConfig[key] === 'object' &&
      !Array.isArray(nextConfig[key])
    ) {
      nextConfig[key] = {
        ...nextConfig[key],
        ...userConfig[key],
      }
    } else {
      nextConfig[key] = userConfig[key]
    }
  }
}

export default nextConfig
