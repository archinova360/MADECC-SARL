import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        includeAssets: [
          'favicon.ico',
          'apple-touch-icon.png',
          'icon.svg',
          'logo.png',
          'pwa-192x192.png',
          'pwa-512x512.png',
          'screenshot-wide.png',
          'screenshot-narrow.png',
          'sw-extra.js',
          'widget-template.json',
          'robots.txt',
          'sitemap.xml',
          '.well-known/assetlinks.json'
        ],
        manifest: {
          id: '/',
          name: 'MADECC GROUP - Engineering, Construction & Tech',
          short_name: 'MADECC Group',
          description: 'Cameroon premier civil engineering, construction management, and architectural enterprise.',
          theme_color: '#0f172a',
          background_color: '#0f172a',
          display: 'standalone',
          display_override: [
            'tabbed',
            'window-controls-overlay',
            'standalone',
            'minimal-ui',
            'browser'
          ],
          tab_strip: {
            home_tab: {
              scope_url: '/'
            },
            new_tab_button: {
              url: '/budget-calculator'
            }
          },
          orientation: 'portrait-primary',
          start_url: '/',
          scope: '/',
          iarc_rating_id: 'e84b072d-71b3-4d3e-86ae-31a8ec4e53b7',
          launch_handler: {
            client_mode: ['navigate-existing', 'auto']
          },
          scope_extensions: [
            { origin: 'https://*.madeccgroup.online' },
            { origin: 'https://madeccgroup.online' },
            { origin: 'https://www.madeccgroup.online' },
            { origin: 'https://app.madeccgroup.online' }
          ],
          file_handlers: [
            {
              action: '/services',
              name: 'Civil Engineering & CAD Documents',
              icons: [
                {
                  src: '/pwa-192x192.png',
                  sizes: '192x192',
                  type: 'image/png'
                }
              ],
              accept: {
                'application/pdf': ['.pdf'],
                'application/json': ['.json'],
                'text/csv': ['.csv'],
                'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.svg']
              }
            }
          ],
          protocol_handlers: [
            {
              protocol: 'web+madecc',
              url: '/?protocol=%s'
            },
            {
              protocol: 'web+boq',
              url: '/budget-calculator?boq=%s'
            },
            {
              protocol: 'web+tender',
              url: '/tenders?tender=%s'
            }
          ],
          share_target: {
            action: '/request-a-quote',
            method: 'GET',
            enctype: 'application/x-www-form-urlencoded',
            params: {
              title: 'title',
              text: 'text',
              url: 'url'
            }
          },
          widgets: [
            {
              name: 'MADECC Cost Estimator Widget',
              short_name: 'Cost Estimator',
              description: 'Live construction cost calculator and regional material price benchmarks',
              tag: 'madecc-estimator-widget',
              template: 'widget-template',
              ms_ac_template: '/widget-template.json',
              data: '/api/widget/data',
              type: 'application/json',
              screenshots: [
                {
                  src: '/screenshot-narrow.png',
                  sizes: '720x1280',
                  label: 'Estimator Widget Preview'
                }
              ],
              icons: [
                {
                  src: '/pwa-192x192.png',
                  sizes: '192x192'
                }
              ],
              auth: false,
              update: 86400
            }
          ],
          note_taking: {
            new_note_url: '/booking?type=site_notes'
          },
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
          screenshots: [
            {
              src: '/screenshot-wide.png',
              sizes: '1280x720',
              type: 'image/png',
              form_factor: 'wide',
              label: 'MADECC GROUP Civil Engineering & Construction Management Dashboard'
            },
            {
              src: '/screenshot-narrow.png',
              sizes: '720x1280',
              type: 'image/png',
              form_factor: 'narrow',
              label: 'MADECC Mobile Project Budget Estimator & Services Portal'
            }
          ],
          related_applications: [
            {
              platform: 'play',
              url: 'https://play.google.com/store/apps/details?id=online.madeccgroup.twa',
              id: 'online.madeccgroup.twa'
            },
            {
              platform: 'webapp',
              url: 'https://madeccgroup.online/manifest.json'
            }
          ],
          prefer_related_applications: false,
          handle_links: 'preferred',
          edge_side_panel: {
            preferred_width: 480
          }
        } as any,
        workbox: {
          maximumFileSizeToCacheInBytes: 6 * 1024 * 1024, // 6 MB limit to support admin studio bundle
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,json}'],
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/api\//],
          importScripts: ['/sw-extra.js'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 15,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 15,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'unsplash-images-cache',
                expiration: {
                  maxEntries: 40,
                  maxAgeSeconds: 60 * 60 * 24 * 30,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      target: 'es2020',
      minify: 'esbuild',
      cssMinify: true,
      sourcemap: false,
      chunkSizeWarningLimit: 800,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (
                id.includes('jspdf') ||
                id.includes('html2canvas') ||
                id.includes('docx') ||
                id.includes('xlsx') ||
                id.includes('mammoth') ||
                id.includes('pdf-parse')
              ) {
                return 'vendor-docs-export';
              }
              if (id.includes('firebase')) {
                return 'vendor-firebase';
              }
              if (id.includes('recharts') || id.includes('d3')) {
                return 'vendor-charts';
              }
              if (id.includes('lucide-react')) {
                return 'vendor-icons';
              }
              if (id.includes('motion')) {
                return 'vendor-motion';
              }
              if (id.includes('react') || id.includes('react-dom')) {
                return 'vendor-react';
              }
            }
          },
        },
      },
    },
    server: {
      hmr: false,
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
