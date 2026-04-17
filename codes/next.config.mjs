const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
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
      // pdf-parse imports its own test file at require-time; alias it away to prevent webpack errors
      config.resolve.alias = {
        ...config.resolve.alias,
        'pdf-parse/lib/pdf-parse.js': 'pdf-parse/lib/pdf-parse.js', // keep real
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
  serverExternalPackages: ['pdf-parse', 'mammoth'],
};

export default nextConfig;
