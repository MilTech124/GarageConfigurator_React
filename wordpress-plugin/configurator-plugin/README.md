# Configurator Plugin (WordPress)

## What it provides
- Shortcode: `[configurator_plugin]`
- REST endpoints:
  - `POST /wp-json/configurator/v1/inquiry`
  - `POST /wp-json/configurator/v1/upload-image`
- Runtime config for frontend via `window.__CONFIGURATOR_PLUGIN__`

## Install
1. Copy folder `wordpress-plugin/configurator-plugin` to:
   - `wp-content/plugins/configurator-plugin`
2. Build React app and copy generated files to:
   - `wp-content/plugins/configurator-plugin/assets/dist`
   - required: `assets/dist/.vite/manifest.json`
   - easiest on this repo: `npm run build:wp`
3. Activate plugin in WordPress admin.
4. Add shortcode to page:
   - `[configurator_plugin]`

## Runtime config injected into frontend
- `restBaseUrl`
- `inquiryEndpoint`
- `uploadEndpoint`
- `nonce`
- `thankYouPath`

## Settings
- WordPress -> Settings -> General:
  - `Configurator inquiry email`
