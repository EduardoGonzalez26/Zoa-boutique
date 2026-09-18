import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
