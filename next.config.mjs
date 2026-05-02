import withPWAInit from "@ducanh2912/next-pwa";

/** Network-only for Firebase / Google APIs so Workbox never caches remote SDK traffic */
const firebaseRuntimeCaching = [
  {
    urlPattern:
      /^https:\/\/([^/]+\.)?(googleapis\.com|gstatic\.com|firebaseio\.com|google\.com)\/.*/i,
    handler: "NetworkOnly",
  },
];

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  reloadOnOnline: true,
  extendDefaultRuntimeCaching: true,
  runtimeCaching: firebaseRuntimeCaching,
  workboxOptions: {
    skipWaiting: true,
    clientsClaim: true,
    cleanupOutdatedCaches: true,
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

export default withPWA(nextConfig);
