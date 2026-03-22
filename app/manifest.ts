import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'FutureLink',
    short_name: 'FutureLink',
    description: 'Modern school management software for admins, teachers, parents, and finance teams.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f6f8fc',
    theme_color: '#2550d7',
    icons: [
      {
        src: '/icon',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: '/apple-icon',
        sizes: '180x180',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
