import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // No revelar el framework en respuestas HTTP
  poweredByHeader: false,
  // Cabeceras de seguridad aplicadas a todas las rutas (páginas y API).
  // No se usa CSP completa para no romper el Brick de MercadoPago ni los
  // estilos/scripts inline de Next; solo `frame-ancestors` contra clickjacking.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      {
        // Fallback for Unsplash demo images
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
  // Expose only public env vars to the browser
  env: {
    NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY: process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY ?? "",
    // La llave pública tiene dos nombres en el código: inyecta en ambos el valor disponible
    NEXT_PUBLIC_MP_PUBLIC_KEY: process.env.NEXT_PUBLIC_MP_PUBLIC_KEY ?? process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY ?? "",
  },
};

export default nextConfig;
