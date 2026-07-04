const nextConfig = {
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    webpackBuildWorker: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'pdf-parse/lib/pdf-parse.js': 'pdf-parse/lib/pdf-parse.js',
        '@opentelemetry/exporter-jaeger': false,
        '@opentelemetry/otlp-grpc-exporter-base': false,
        '@opentelemetry/otlp-proto-exporter-base': false,
        '@opentelemetry/exporter-zipkin': false,
      };
      config.plugins = config.plugins || [];
    }

    // Prevent browser-only libraries from being bundled on the server
    config.resolve.fallback = {
      ...config.resolve.fallback,
      canvas: false,
      fs: false,
      path: false,
    };

    return config;
  },
  // Silence the "Critical dependency: require function" warning from pdf-parse
  serverExternalPackages: [
    'pdf-parse',
    'mammoth',
    'genkit',
    '@genkit-ai/core',
    '@genkit-ai/dotprompt',
    '@genkit-ai/flow',
    '@genkit-ai/ai',
    'genkitx-openai',
    'genkitx-groq',
    '@opentelemetry/sdk-node',
    '@opentelemetry/api',
    '@opentelemetry/resources',
    '@opentelemetry/semantic-conventions',
    '@opentelemetry/sdk-trace-base',
    '@opentelemetry/sdk-trace-node'
  ],
};

export default nextConfig;
