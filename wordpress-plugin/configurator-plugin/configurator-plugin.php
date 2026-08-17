<?php
/**
 * Plugin Name: Configurator Plugin
 * Description: React 3D configurator as shortcode with REST API endpoints for inquiry emails and image upload.
 * Version: 0.1.0
 * Author: Configurator Team
 */

if (!defined('ABSPATH')) {
    exit;
}

final class ConfiguratorPlugin {
    const OPTION_EMAIL = 'configurator_inquiry_email';
    const OPTION_PRICES_STANDARD = 'configurator_prices_standard';
    const OPTION_PRICES_GALVANIZED = 'configurator_prices_galvanized';
    const OPTION_PRICES_STANDING_SEAM = 'configurator_prices_standing_seam';
    const OPTION_SECTIONAL_GATE_PRICES = 'configurator_sectional_gate_prices';
    const OPTION_SHOW_PRICE = 'configurator_show_price';
    const OPTION_ADDON_PRICES = 'configurator_addon_prices';
    const OPTION_PDF_LANGUAGE = 'configurator_pdf_language';
    const OPTION_PDF_CZK_EXCHANGE_RATE = 'configurator_pdf_czk_exchange_rate';
    const SHORTCODE = 'configurator_plugin';
    const REST_NS = 'configurator/v1';
    private static $shortcode_assets_rendered = false;
    private static $sizes = [2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11, 11.5, 12];
    private static $sectional_widths = [2200,2300,2400,2500,2600,2700,2800,2900,3000,3100,3200,3300,3400,3500,3600,3700,3800,3900,4000,4100,4200,4300,4400,4500,4600,4700,4800,4900,5000,5100,5200,5300,5400,5500,5600,5700,5800,5900,6000];
    private static $sectional_heights = [2000,2120,2200,2300,2400,2500,2630,2740,2850,3020];

    private static function size_key($size) {
        return str_replace('.', '_', (string) $size);
    }

    private static function key_size($key) {
        return (float) str_replace('_', '.', (string) $key);
    }

    public static function init() {
        add_shortcode(self::SHORTCODE, [__CLASS__, 'render_shortcode']);
        add_action('rest_api_init', [__CLASS__, 'register_rest_routes']);
        add_action('admin_init', [__CLASS__, 'register_settings']);
        add_action('admin_init', [__CLASS__, 'handle_price_csv_export']);
        add_action('admin_menu', [__CLASS__, 'add_admin_menu']);
        add_filter('script_loader_tag', [__CLASS__, 'force_module_script_tag'], 10, 3);
    }

    public static function force_module_script_tag($tag, $handle, $src) {
        if ($handle !== 'configurator-plugin-app') {
            return $tag;
        }

        if (strpos($tag, ' type=') !== false) {
            return $tag;
        }

        return '<script type="module" src="' . esc_url($src) . '" id="' . esc_attr($handle) . '-js"></script>' . "\n";
    }

    public static function register_settings() {
        register_setting('general', self::OPTION_EMAIL, [
            'type' => 'string',
            'sanitize_callback' => 'sanitize_email',
            'default' => get_option('admin_email'),
        ]);

        add_settings_field(
            self::OPTION_EMAIL,
            'Configurator inquiry email',
            [__CLASS__, 'render_email_setting_field'],
            'general'
        );
    }

    public static function render_email_setting_field() {
        $value = get_option(self::OPTION_EMAIL, get_option('admin_email'));
        echo '<input type="email" name="' . esc_attr(self::OPTION_EMAIL) . '" value="' . esc_attr($value) . '" class="regular-text" />';
        echo '<p class="description">Address used to receive configurator inquiries.</p>';
    }

    public static function register_rest_routes() {
        register_rest_route(self::REST_NS, '/inquiry', [
            'methods' => WP_REST_Server::CREATABLE,
            'callback' => [__CLASS__, 'handle_inquiry'],
            'permission_callback' => '__return_true',
        ]);

        register_rest_route(self::REST_NS, '/upload-image', [
            'methods' => WP_REST_Server::CREATABLE,
            'callback' => [__CLASS__, 'handle_upload_image'],
            'permission_callback' => '__return_true',
        ]);

        register_rest_route(self::REST_NS, '/prices', [
            'methods' => WP_REST_Server::READABLE,
            'callback' => [__CLASS__, 'handle_get_prices'],
            'permission_callback' => '__return_true',
        ]);

        register_rest_route(self::REST_NS, '/generate-pdf', [
            'methods' => WP_REST_Server::CREATABLE,
            'callback' => [__CLASS__, 'handle_generate_pdf'],
            'permission_callback' => '__return_true',
        ]);
    }

    public static function render_shortcode() {
        return '<div class="configurator-plugin-shell"><div id="configurator-plugin-root"></div></div>' . self::render_shortcode_assets();
    }

    private static function render_shortcode_assets() {
        if (self::$shortcode_assets_rendered) {
            return '';
        }
        self::$shortcode_assets_rendered = true;

        $manifest_path = plugin_dir_path(__FILE__) . 'assets/dist/.vite/manifest.json';
        if (!file_exists($manifest_path)) {
            return '<!-- Configurator Plugin: missing build manifest at assets/dist/.vite/manifest.json -->';
        }

        $manifest = json_decode(file_get_contents($manifest_path), true);
        if (!is_array($manifest) || empty($manifest['index.html']['file'])) {
            return '<!-- Configurator Plugin: invalid Vite manifest -->';
        }

        $entry = $manifest['index.html'];
        $base_url = plugin_dir_url(__FILE__) . 'assets/dist/';
        $html = '<style id="configurator-plugin-layout-css">' . self::layout_css() . '</style>';

        if (!empty($entry['css']) && is_array($entry['css'])) {
            foreach ($entry['css'] as $css_file) {
                $html .= '<link rel="stylesheet" href="' . esc_url($base_url . ltrim($css_file, '/')) . '">' . "\n";
            }
        }

        $config = [
            'restBaseUrl' => untrailingslashit(rest_url(self::REST_NS)),
            'inquiryEndpoint' => untrailingslashit(rest_url(self::REST_NS)) . '/inquiry',
            'uploadEndpoint' => untrailingslashit(rest_url(self::REST_NS)) . '/upload-image',
            'pricesEndpoint' => untrailingslashit(rest_url(self::REST_NS)) . '/prices',
            'showPrice' => (bool) get_option(self::OPTION_SHOW_PRICE, true),
            'pdfLanguage' => self::get_pdf_language(),
            'pdfCzkExchangeRate' => self::get_pdf_czk_exchange_rate(),
            'assetsBaseUrl' => trailingslashit($base_url),
            'lang' => self::resolve_frontend_lang(),
            'locale' => get_locale(),
            'nonce' => wp_create_nonce('wp_rest'),
            'siteUrl' => home_url('/'),
            'logoUrl' => self::resolve_logo_url(),
            'thankYouPathPl' => '/dziekujemy',
            'thankYouPathCs' => '/dekujeme',
            'thankYouPathSl' => '/dakujeme',
            'thankYouPathHu' => '/koszonjuk',
            'thankYouPath' => '/thank-you',
            'isAdmin' => current_user_can('administrator'),
        ];
        $html .= '<script>window.__CONFIGURATOR_PLUGIN__ = ' . wp_json_encode($config) . ';' . self::layout_js() . '</script>' . "\n";
        $html .= '<script type="module" src="' . esc_url($base_url . ltrim($entry['file'], '/')) . '"></script>' . "\n";

        return $html;
    }

    private static function enqueue_frontend_assets() {
        $manifest_path = plugin_dir_path(__FILE__) . 'assets/dist/.vite/manifest.json';
        if (!file_exists($manifest_path)) {
            return;
        }

        $manifest = json_decode(file_get_contents($manifest_path), true);
        if (!is_array($manifest) || empty($manifest['index.html']['file'])) {
            return;
        }

        $entry = $manifest['index.html'];
        $base_url = plugin_dir_url(__FILE__) . 'assets/dist/';

        if (!empty($entry['css']) && is_array($entry['css'])) {
            foreach ($entry['css'] as $index => $css_file) {
                wp_enqueue_style(
                    'configurator-plugin-style-' . $index,
                    $base_url . ltrim($css_file, '/'),
                    [],
                    filemtime(plugin_dir_path(__FILE__) . 'assets/dist/' . ltrim($css_file, '/'))
                );
            }
        }

        wp_register_style('configurator-plugin-layout', false, [], null);
        wp_enqueue_style('configurator-plugin-layout');
        wp_add_inline_style('configurator-plugin-layout', self::layout_css());

        $script_handle = 'configurator-plugin-app';
        wp_enqueue_script(
            $script_handle,
            $base_url . ltrim($entry['file'], '/'),
            [],
            filemtime(plugin_dir_path(__FILE__) . 'assets/dist/' . ltrim($entry['file'], '/')),
            false
        );
        wp_script_add_data($script_handle, 'type', 'module');

        $config = [
            'restBaseUrl' => untrailingslashit(rest_url(self::REST_NS)),
            'inquiryEndpoint' => untrailingslashit(rest_url(self::REST_NS)) . '/inquiry',
            'uploadEndpoint' => untrailingslashit(rest_url(self::REST_NS)) . '/upload-image',
            'pricesEndpoint' => untrailingslashit(rest_url(self::REST_NS)) . '/prices',
            'showPrice' => (bool) get_option(self::OPTION_SHOW_PRICE, true),
            'pdfLanguage' => self::get_pdf_language(),
            'pdfCzkExchangeRate' => self::get_pdf_czk_exchange_rate(),
            'assetsBaseUrl' => trailingslashit($base_url),
            'lang' => self::resolve_frontend_lang(),
            'locale' => get_locale(),
            'nonce' => wp_create_nonce('wp_rest'),
            'siteUrl' => home_url('/'),
            'logoUrl' => self::resolve_logo_url(),
            'thankYouPathPl' => '/dziekujemy',
            'thankYouPathCs' => '/dekujeme',
            'thankYouPathSl' => '/dakujeme',
            'thankYouPathHu' => '/koszonjuk',
            'thankYouPath' => '/thank-you',
            'isAdmin' => current_user_can('administrator'),
        ];

        wp_add_inline_script(
            $script_handle,
            'window.__CONFIGURATOR_PLUGIN__ = ' . wp_json_encode($config) . ';',
            'before'
        );
        wp_add_inline_script($script_handle, self::layout_js(), 'before');
    }

    public static function handle_upload_image(WP_REST_Request $request) {
        $files = $request->get_file_params();
        if (empty($files['file'])) {
            return new WP_Error('no_file', 'No file uploaded', ['status' => 400]);
        }

        $file = $files['file'];
        $allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!in_array($file['type'], $allowed_types, true)) {
            return new WP_Error('invalid_file_type', 'Invalid file type', ['status' => 400]);
        }

        $max_size = 5 * 1024 * 1024;
        if ((int) $file['size'] > $max_size) {
            return new WP_Error('file_too_large', 'File too large', ['status' => 400]);
        }

        $upload_overrides = ['test_form' => false];
        $movefile = wp_handle_upload($file, $upload_overrides);
        if (!$movefile || isset($movefile['error'])) {
            return new WP_Error('upload_failed', 'Upload failed', ['status' => 500]);
        }

        $attachment = [
            'guid' => $movefile['url'],
            'post_mime_type' => $file['type'],
            'post_title' => preg_replace('/\.[^.]+$/', '', sanitize_file_name($file['name'])),
            'post_content' => '',
            'post_status' => 'inherit',
        ];
        $attach_id = wp_insert_attachment($attachment, $movefile['file']);
        if ($attach_id) {
            require_once ABSPATH . 'wp-admin/includes/image.php';
            $attach_data = wp_generate_attachment_metadata($attach_id, $movefile['file']);
            wp_update_attachment_metadata($attach_id, $attach_data);
        }

        return [
            'success' => true,
            'message' => 'File uploaded',
            'id' => $attach_id,
            'url' => $movefile['url'],
            'guid' => ['rendered' => $movefile['url']],
        ];
    }

    public static function handle_inquiry(WP_REST_Request $request) {
        $data = $request->get_json_params();
        $contact = isset($data['contact']) && is_array($data['contact']) ? $data['contact'] : [];
        $garage = isset($data['garage_config']) && is_array($data['garage_config']) ? $data['garage_config'] : [];
        $name = isset($contact['name']) ? sanitize_text_field($contact['name']) : '';
        $email = isset($contact['email']) ? sanitize_email($contact['email']) : '';
        $phone = isset($contact['phone']) ? sanitize_text_field($contact['phone']) : '';
        $postal_code = isset($contact['postalCode'])
            ? sanitize_text_field($contact['postalCode'])
            : (isset($contact['wojewodztwo']) ? sanitize_text_field($contact['wojewodztwo']) : '');
        $city = isset($contact['city']) ? sanitize_text_field($contact['city']) : '';
        $address = isset($contact['address']) ? sanitize_text_field($contact['address']) : '';
        $message = isset($contact['message']) ? sanitize_textarea_field($contact['message']) : '';
        $price = isset($data['price']) ? sanitize_text_field((string) $data['price']) : '';
        $image_url = isset($data['imageURL']) ? esc_url_raw($data['imageURL']) : '';
        $allowed_langs = ['pl', 'cs', 'sl', 'hu'];
        $lang = isset($data['lang']) && in_array($data['lang'], $allowed_langs, true) ? $data['lang'] : 'pl';

        if ($name === '' || $email === '' || $phone === '') {
            return new WP_Error('missing_data', 'Missing required contact fields', ['status' => 400]);
        }
        if (!is_email($email)) {
            return new WP_Error('invalid_email', 'Invalid email', ['status' => 400]);
        }

        $to_email = get_option(self::OPTION_EMAIL, get_option('admin_email'));
        if ($lang === 'cs') {
            $subject = 'Nova poptavka z konfiguratoru garaze - ' . $name;
        } elseif ($lang === 'sl') {
            $subject = 'Novy dopyt z konfiguratora garaze - ' . $name;
        } elseif ($lang === 'hu') {
            $subject = 'Uj erdeklodes a garaz konfiguratorbol - ' . $name;
        } else {
            $subject = 'Nowe zapytanie z konfiguratora garazu - ' . $name;
        }
        $from_domain = wp_parse_url(home_url(), PHP_URL_HOST);
        $headers = [
            'Content-Type: text/html; charset=UTF-8',
            'From: Configurator <noreply@' . $from_domain . '>',
            'Reply-To: ' . $email,
        ];

        $attachments = self::resolve_image_attachments($image_url);
        $client_pdf_path = self::create_pdf_attachment_from_request($data);

        if ($client_pdf_path && file_exists($client_pdf_path)) {
            $attachments[] = $client_pdf_path;
        }

        if (!$client_pdf_path) {
            return new WP_Error('pdf_missing', 'Generated PDF attachment is missing', ['status' => 400]);
        }

        $sent = wp_mail(
            $to_email,
            $subject,
            self::build_inquiry_email($name, $email, $phone, $postal_code, $city, $address, $message, $price, $image_url, $garage, $lang),
            $headers,
            $attachments
        );

        // Clean up temp PDF.
        if ($client_pdf_path && file_exists($client_pdf_path)) {
            @unlink($client_pdf_path);
        }

        if (!$sent) {
            return new WP_Error('email_failed', 'Email send failed', ['status' => 500]);
        }

        // Send short confirmation email to the client.
        if ($lang === 'cs') {
            $client_subject = 'Potvrzeni prijeti poptavky - Konfigurator garaze';
        } elseif ($lang === 'sl') {
            $client_subject = 'Potvrdenie prijatia dopytu - Konfigurator garaze';
        } elseif ($lang === 'hu') {
            $client_subject = 'Erdeklodes visszaigazolasa - Garaz konfigurator';
        } else {
            $client_subject = 'Potwierdzenie przyjecia zapytania - Konfigurator garazu';
        }
        $client_headers = [
            'Content-Type: text/html; charset=UTF-8',
            'From: Configurator <noreply@' . $from_domain . '>',
        ];
        $client_confirmation_sent = wp_mail(
            $email,
            $client_subject,
            self::build_client_confirmation_email($name, $lang),
            $client_headers
        );

        return [
            'success' => true,
            'code' => 'sent',
            'message' => 'Inquiry sent',
            'data' => [
                'to' => $to_email,
                'pdf_attached' => true,
                'attachment_count' => count($attachments),
                'client_confirmation_sent' => (bool) $client_confirmation_sent,
            ],
        ];
    }

    private static function build_client_confirmation_email($name, $lang = 'pl') {
        if ($lang === 'cs') {
            $safe_name = esc_html($name);
            return '<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; color:#1f2937; line-height:1.5;">
  <div style="max-width:640px; margin:0 auto; padding:20px;">
    <h2 style="margin:0 0 12px;">Dekujeme za poptavku</h2>
    <p style="margin:0 0 10px;">Dobrý den ' . $safe_name . ',</p>
    <p style="margin:0 0 10px;">vase poptavka z konfiguratoru byla uspesne prijata.</p>
    <p style="margin:0 0 10px;">Nase obchodni oddeleni vas bude brzy kontaktovat s nezavaznou nabidkou.</p>
  </div>
</body>
</html>';
        }

        if ($lang === 'sl') {
            $safe_name = esc_html($name);
            return '<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; color:#1f2937; line-height:1.5;">
  <div style="max-width:640px; margin:0 auto; padding:20px;">
    <h2 style="margin:0 0 12px;">Dakujeme za dopyt</h2>
    <p style="margin:0 0 10px;">Dobry den ' . $safe_name . ',</p>
    <p style="margin:0 0 10px;">vas dopyt z konfiguratora bol uspesne prijaty.</p>
    <p style="margin:0 0 10px;">Nase obchodne oddelenie vas bude coskoro kontaktovat s nezavaznou cenovou ponukou.</p>
  </div>
</body>
</html>';
        }

        if ($lang === 'hu') {
            $safe_name = esc_html($name);
            return '<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; color:#1f2937; line-height:1.5;">
  <div style="max-width:640px; margin:0 auto; padding:20px;">
    <h2 style="margin:0 0 12px;">Koszonjuk az erdeklodest</h2>
    <p style="margin:0 0 10px;">Tisztelt ' . $safe_name . ',</p>
    <p style="margin:0 0 10px;">a konfiguratorbol kuldott erdeklodeset sikeresen megkaptuk.</p>
    <p style="margin:0 0 10px;">Munkatarsunk hamarosan felveszi Onnel a kapcsolatot egy kotelezettsegmentes ajanlattal.</p>
  </div>
</body>
</html>';
        }

        $safe_name = esc_html($name);
        return '<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; color:#1f2937; line-height:1.5;">
  <div style="max-width:640px; margin:0 auto; padding:20px;">
    <h2 style="margin:0 0 12px;">Dziekujemy za zapytanie</h2>
    <p style="margin:0 0 10px;">Dzien dobry ' . $safe_name . ',</p>
    <p style="margin:0 0 10px;">Twoje zapytanie z konfiguratora zostalo poprawnie przyjete.</p>
    <p style="margin:0 0 10px;">Skontaktujemy sie z Toba wkrotce z niezobowiazujaca wycena.</p>
  </div>
</body>
</html>';
    }

    private static function build_inquiry_email($name, $email, $phone, $postal_code, $city, $address, $message, $price, $image_url, $garage, $lang = 'pl') {
        $gate_count = (int) self::garage_value($garage, 'gateCount', 0);
        $door_count = (int) self::garage_value($garage, 'doorCount', 0);
        $window_count = (int) self::garage_value($garage, 'windowCount', 0);
        $has_carport = (bool) self::garage_value($garage, 'carport', false);
        if ($lang === 'cs') {
            $t = [
            'mail_title' => 'Nova poptavka z konfiguratoru garaze',
            'mail_subtitle' => 'Prisla nova poptavka od zakaznika',
            'contact' => 'Kontaktni udaje',
            'full_name' => 'Jmeno a prijmeni',
            'email' => 'E-mail',
            'phone' => 'Telefon',
            'postal_code' => 'PSC',
            'city' => 'Mesto',
            'delivery_address' => 'Adresa montaze',
            'message' => 'Poznamka',
            'garage_config' => 'Konfigurace garaze',
            'basic_params' => 'Zakladni parametry',
            'width' => 'Sirka',
            'depth' => 'Delka',
            'height' => 'Vyska',
            'color' => 'Barva',
            'emboss' => 'Prolis',
            'direction' => 'Smer prolisu',
            'roof' => 'Strecha',
            'roof_slope' => 'Typ spadu',
            'roof_color' => 'Barva strechy',
            'roof_type' => 'Typ krytiny',
            'gates' => 'Brany',
            'gate_count' => 'Pocet bran',
            'gate' => 'Brana',
            'type' => 'Typ',
            'size' => 'Rozmer',
            'position' => 'Pozice',
            'drive' => 'Pohon',
            'door' => 'Dvere',
            'door_count' => 'Pocet dveri',
            'details' => 'Detaily',
            'window' => 'Okna',
            'window_count' => 'Pocet oken',
            'carport' => 'Pristresek',
            'side' => 'Strana',
            'walls' => 'Steny',
            'walls2' => 'Steny 2',
            'addons' => 'Doplnky',
            'gutter' => 'Okapy',
            'roof_flashings' => 'Střešní lemování',
            'garage_flashings' => 'Lemování garáže',
            'same_as_roof' => 'Jako střecha',
            'same_as_garage' => 'Jako garáž',
            'automation' => 'Automatika',
            'filc' => 'Antikondenzacni filc',
            'transport' => 'Doprava',
            'garage_visualization' => 'Vizualizace garaze',
            'm' => 'm',
            'cm' => 'cm',
            'pieces' => ' ks',
            ];
        } elseif ($lang === 'sl') {
            $t = [
            'mail_title' => 'Novy dopyt z konfiguratora garaze',
            'mail_subtitle' => 'Prisiel novy dopyt od zakaznika',
            'contact' => 'Kontaktne udaje',
            'full_name' => 'Meno a priezvisko',
            'email' => 'E-mail',
            'phone' => 'Telefon',
            'postal_code' => 'PSC',
            'city' => 'Mesto',
            'delivery_address' => 'Adresa montaze',
            'message' => 'Poznamka',
            'garage_config' => 'Konfiguracia garaze',
            'basic_params' => 'Zakladne parametre',
            'width' => 'Sirka',
            'depth' => 'Dlzka',
            'height' => 'Vyska',
            'color' => 'Farba',
            'emboss' => 'Prelis',
            'direction' => 'Smer prelisu',
            'roof' => 'Strecha',
            'roof_slope' => 'Typ spadu',
            'roof_color' => 'Farba strechy',
            'roof_type' => 'Typ krytiny',
            'gates' => 'Brany',
            'gate_count' => 'Pocet bran',
            'gate' => 'Brana',
            'type' => 'Typ',
            'size' => 'Rozmer',
            'position' => 'Pozicia',
            'drive' => 'Pohon',
            'door' => 'Dvere',
            'door_count' => 'Pocet dveri',
            'details' => 'Detaily',
            'window' => 'Okna',
            'window_count' => 'Pocet okien',
            'carport' => 'Pristresok',
            'side' => 'Strana',
            'walls' => 'Steny',
            'walls2' => 'Steny 2',
            'addons' => 'Doplnky',
            'gutter' => 'Odkvapy',
            'roof_flashings' => 'Strešné lemovanie',
            'garage_flashings' => 'Lemovanie garáže',
            'same_as_roof' => 'Ako strecha',
            'same_as_garage' => 'Ako garáž',
            'automation' => 'Automatika',
            'filc' => 'Antikondenzacna plst',
            'transport' => 'Doprava',
            'garage_visualization' => 'Vizualizacia garaze',
            'm' => 'm',
            'cm' => 'cm',
            'pieces' => ' ks',
            ];
        } elseif ($lang === 'hu') {
            $t = [
            'mail_title' => 'Uj erdeklodes a garaz konfiguratorbol',
            'mail_subtitle' => 'Uj ugyfel erdeklodes erkezett',
            'contact' => 'Kapcsolati adatok',
            'full_name' => 'Nev',
            'email' => 'E-mail',
            'phone' => 'Telefon',
            'postal_code' => 'Iranyitoszam',
            'city' => 'Varos',
            'delivery_address' => 'Szerelesi cim',
            'message' => 'Megjegyzes',
            'garage_config' => 'Garazs konfiguracio',
            'basic_params' => 'Alapadatok',
            'width' => 'Szelesseg',
            'depth' => 'Hosszusag',
            'height' => 'Magassag',
            'color' => 'Szin',
            'emboss' => 'Profilozas',
            'direction' => 'Profil iranya',
            'roof' => 'Teto',
            'roof_slope' => 'Tetolejtes tipusa',
            'roof_color' => 'Tetoszin',
            'roof_type' => 'Fedestipus',
            'gates' => 'Kapuk',
            'gate_count' => 'Kapuk szama',
            'gate' => 'Kapu',
            'type' => 'Tipus',
            'size' => 'Meret',
            'position' => 'Pozicio',
            'drive' => 'Meghajtas',
            'door' => 'Ajtok',
            'door_count' => 'Ajtok szama',
            'details' => 'Reszletek',
            'window' => 'Ablakok',
            'window_count' => 'Ablakok szama',
            'carport' => 'Beallo',
            'side' => 'Oldal',
            'walls' => 'Oldalfalak',
            'walls2' => 'Oldalfalak 2',
            'addons' => 'Kiegeszitok',
            'gutter' => 'Ereszcsatorna',
            'roof_flashings' => 'Tetőszegélyek',
            'garage_flashings' => 'Garázsszegélyek',
            'same_as_roof' => 'Mint a tető',
            'same_as_garage' => 'Mint a garázs',
            'automation' => 'Automatika',
            'filc' => 'Paracseppgatlo filc',
            'transport' => 'Szallitas',
            'garage_visualization' => 'Garazs latvanyterv',
            'm' => 'm',
            'cm' => 'cm',
            'pieces' => ' db',
            ];
        } else {
            $t = [
            'mail_title' => 'Nowe zapytanie z konfiguratora garazu',
            'mail_subtitle' => 'Otrzymano nowe zapytanie od klienta',
            'contact' => 'Dane kontaktowe',
            'full_name' => 'Imie i nazwisko',
            'email' => 'Email',
            'phone' => 'Telefon',
            'postal_code' => 'Kod pocztowy',
            'city' => 'Miasto',
            'delivery_address' => 'Adres dostawy',
            'message' => 'Wiadomosc',
            'garage_config' => 'Konfiguracja garazu',
            'basic_params' => 'Parametry podstawowe',
            'width' => 'Szerokosc',
            'depth' => 'Glebokosc',
            'height' => 'Wysokosc',
            'color' => 'Kolor',
            'emboss' => 'Tloczenie',
            'direction' => 'Kierunek tloczenia',
            'roof' => 'Dach',
            'roof_slope' => 'Typ spadu',
            'roof_color' => 'Kolor dachu',
            'roof_type' => 'Rodzaj pokrycia',
            'gates' => 'Bramy',
            'gate_count' => 'Liczba bram',
            'gate' => 'Brama',
            'type' => 'Typ',
            'size' => 'Rozmiar',
            'position' => 'Pozycja',
            'drive' => 'Naped',
            'door' => 'Drzwi',
            'door_count' => 'Liczba drzwi',
            'details' => 'Szczegoly',
            'window' => 'Okna',
            'window_count' => 'Liczba okien',
            'carport' => 'Wiata',
            'side' => 'Strona',
            'walls' => 'Sciany',
            'walls2' => 'Sciany 2',
            'addons' => 'Dodatki',
            'gutter' => 'Rynny',
            'roof_flashings' => 'Obróbki dachu',
            'garage_flashings' => 'Obróbki garażu',
            'same_as_roof' => 'Jak dach',
            'same_as_garage' => 'Jak garaż',
            'automation' => 'Automatyka',
            'filc' => 'Filc',
            'transport' => 'Transport',
            'garage_visualization' => 'Wizualizacja garazu',
            'm' => 'm',
            'cm' => 'cm',
            'pieces' => ' szt.',
            ];
        }

        ob_start();
        ?>
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin:0; padding:0;">
          <div style="max-width:900px; margin:0 auto; padding:20px;">
            <div style="background:#1f2937; color:#fff; padding:18px; text-align:center; border-radius:8px;">
              <h1 style="margin:0; font-size:24px;"><?php echo esc_html($t['mail_title']); ?></h1>
              <p style="margin:8px 0 0;"><?php echo esc_html($t['mail_subtitle']); ?></p>
            </div>

            <div style="margin-top:18px; border:1px solid #ddd; border-radius:8px; padding:14px;">
              <h3 style="margin:0 0 10px;"><?php echo esc_html($t['contact']); ?></h3>
              <table cellpadding="6" cellspacing="0" border="0" style="width:100%; border-collapse:collapse;">
                <tr><th align="left" style="background:#f5f5f5; width:220px;"><?php echo esc_html($t['full_name']); ?></th><td><?php echo esc_html($name); ?></td></tr>
                <tr><th align="left" style="background:#f5f5f5;"><?php echo esc_html($t['email']); ?></th><td><a href="mailto:<?php echo esc_attr($email); ?>"><?php echo esc_html($email); ?></a></td></tr>
                <tr><th align="left" style="background:#f5f5f5;"><?php echo esc_html($t['phone']); ?></th><td><a href="tel:<?php echo esc_attr($phone); ?>"><?php echo esc_html($phone); ?></a></td></tr>
                <tr><th align="left" style="background:#f5f5f5;"><?php echo esc_html($t['postal_code']); ?></th><td><?php echo esc_html($postal_code); ?></td></tr>
                <tr><th align="left" style="background:#f5f5f5;"><?php echo esc_html($t['city']); ?></th><td><?php echo esc_html($city); ?></td></tr>
                <tr><th align="left" style="background:#f5f5f5;"><?php echo esc_html($t['delivery_address']); ?></th><td><?php echo esc_html($address); ?></td></tr>
                <tr><th align="left" style="background:#f5f5f5;"><?php echo esc_html($t['message']); ?></th><td><?php echo nl2br(esc_html($message)); ?></td></tr>
              </table>
            </div>

            <div style="margin-top:18px; border:1px solid #ddd; border-radius:8px; padding:14px;">
              <h3 style="margin:0 0 10px;"><?php echo esc_html($t['garage_config']); ?></h3>
              <h4 style="margin:14px 0 8px;"><?php echo esc_html($t['basic_params']); ?></h4>
              <table cellpadding="6" cellspacing="0" border="0" style="width:100%; border-collapse:collapse;">
                <tr><th align="left" style="background:#f5f5f5; width:220px;"><?php echo esc_html($t['width']); ?></th><td><?php echo esc_html(self::garage_value($garage, 'width')); ?> <?php echo esc_html($t['m']); ?></td></tr>
                <tr><th align="left" style="background:#f5f5f5;"><?php echo esc_html($t['depth']); ?></th><td><?php echo esc_html(self::garage_value($garage, 'depth')); ?> <?php echo esc_html($t['m']); ?></td></tr>
                <tr><th align="left" style="background:#f5f5f5;"><?php echo esc_html($t['height']); ?></th><td><?php echo esc_html(self::format_cm_as_m(self::garage_value($garage, 'height'))); ?></td></tr>
                <tr><th align="left" style="background:#f5f5f5;"><?php echo esc_html($t['color']); ?></th><td><?php echo esc_html(self::translate_config_value(self::garage_value($garage, 'color'), $lang)); ?></td></tr>
                <tr><th align="left" style="background:#f5f5f5;"><?php echo esc_html($t['emboss']); ?></th><td><?php echo esc_html(self::translate_config_value(self::garage_value($garage, 'emboss'), $lang)); ?></td></tr>
                <tr><th align="left" style="background:#f5f5f5;"><?php echo esc_html($t['direction']); ?></th><td><?php echo esc_html(self::translate_config_value(self::garage_value($garage, 'direction'), $lang)); ?></td></tr>
              </table>

              <h4 style="margin:14px 0 8px;"><?php echo esc_html($t['roof']); ?></h4>
              <table cellpadding="6" cellspacing="0" border="0" style="width:100%; border-collapse:collapse;">
                <tr><th align="left" style="background:#f5f5f5; width:220px;"><?php echo esc_html($t['roof_slope']); ?></th><td><?php echo esc_html(self::translate_config_value(self::garage_value($garage, 'roof'), $lang)); ?></td></tr>
                <tr><th align="left" style="background:#f5f5f5;"><?php echo esc_html($t['roof_color']); ?></th><td><?php echo esc_html(self::translate_config_value(self::garage_value($garage, 'roofColor'), $lang)); ?></td></tr>
                <tr><th align="left" style="background:#f5f5f5;"><?php echo esc_html($t['roof_type']); ?></th><td><?php echo esc_html(self::translate_config_value(self::garage_value($garage, 'roofType'), $lang)); ?></td></tr>
              </table>

              <h4 style="margin:14px 0 8px;"><?php echo esc_html($t['gates']); ?></h4>
              <table cellpadding="6" cellspacing="0" border="0" style="width:100%; border-collapse:collapse;">
                <tr><th align="left" style="background:#f5f5f5; width:220px;"><?php echo esc_html($t['gate_count']); ?></th><td><?php echo esc_html((string) $gate_count); ?></td></tr>
                <?php for ($i = 1; $i <= min(3, $gate_count); $i++): ?>
                  <?php $gate_type = self::garage_value($garage, 'gateType' . $i); ?>
                  <?php if ($gate_type !== ''): ?>
                    <tr>
                      <th align="left" style="background:#f5f5f5;"><?php echo esc_html($t['gate'] . ' ' . (int) $i); ?></th>
                      <td>
                        <?php echo esc_html($t['type']); ?>: <?php echo esc_html(self::translate_config_value($gate_type, $lang)); ?>,
                        <?php echo esc_html($t['color']); ?>: <?php echo esc_html(self::translate_config_value(self::garage_value($garage, 'gateColor' . $i), $lang)); ?>,
                        <?php echo esc_html($t['size']); ?>: <?php echo esc_html(self::garage_value($garage, 'gateWidth' . $i)); ?> <?php echo esc_html($t['m']); ?> x <?php echo esc_html(self::format_cm_as_m(self::garage_value($garage, 'gateHeight' . $i))); ?>,
                        <?php echo esc_html($t['position']); ?>: <?php echo esc_html(self::format_cm_as_m(self::garage_value($garage, 'gatePositionValue' . $i))); ?>
                        <?php if ($gate_type === 'segmentowa'): ?>,
                          <?php echo esc_html($t['drive']); ?>: CAME + 2 piloty
                        <?php endif; ?>
                      </td>
                    </tr>
                  <?php endif; ?>
                <?php endfor; ?>
              </table>

              <?php if ($door_count > 0): ?>
                <h4 style="margin:14px 0 8px;"><?php echo esc_html($t['door']); ?></h4>
                <table cellpadding="6" cellspacing="0" border="0" style="width:100%; border-collapse:collapse;">
                  <tr><th align="left" style="background:#f5f5f5; width:220px;"><?php echo esc_html($t['door_count']); ?></th><td><?php echo esc_html((string) $door_count); ?></td></tr>
                  <tr><th align="left" style="background:#f5f5f5;"><?php echo esc_html($t['details']); ?></th><td><?php echo self::format_item_details_html(self::garage_value($garage, 'doors'), 'door', $lang); ?></td></tr>
                </table>
              <?php endif; ?>

              <?php if ($window_count > 0): ?>
                <h4 style="margin:14px 0 8px;"><?php echo esc_html($t['window']); ?></h4>
                <table cellpadding="6" cellspacing="0" border="0" style="width:100%; border-collapse:collapse;">
                  <tr><th align="left" style="background:#f5f5f5; width:220px;"><?php echo esc_html($t['window_count']); ?></th><td><?php echo esc_html((string) $window_count); ?></td></tr>
                  <tr><th align="left" style="background:#f5f5f5;"><?php echo esc_html($t['details']); ?></th><td><?php echo self::format_item_details_html(self::garage_value($garage, 'windows'), 'window', $lang); ?></td></tr>
                </table>
              <?php endif; ?>

              <?php if ($has_carport): ?>
                <h4 style="margin:14px 0 8px;"><?php echo esc_html($t['carport']); ?></h4>
                <table cellpadding="6" cellspacing="0" border="0" style="width:100%; border-collapse:collapse;">
                  <tr><th align="left" style="background:#f5f5f5; width:220px;"><?php echo esc_html($t['width']); ?></th><td><?php echo esc_html(self::garage_value($garage, 'carportWidth')); ?> <?php echo esc_html($t['m']); ?></td></tr>
                  <tr><th align="left" style="background:#f5f5f5;"><?php echo esc_html($t['side']); ?></th><td><?php echo esc_html(self::translate_config_value(self::garage_value($garage, 'carportSide'), $lang)); ?></td></tr>
                  <tr><th align="left" style="background:#f5f5f5;"><?php echo esc_html($t['type']); ?></th><td><?php echo esc_html(self::translate_config_value(self::garage_value($garage, 'carportType'), $lang)); ?></td></tr>
                  <tr><th align="left" style="background:#f5f5f5;"><?php echo esc_html($t['walls']); ?></th><td><?php echo nl2br(esc_html(self::translate_config_value(self::garage_value($garage, 'carportSides'), $lang))); ?></td></tr>
                  <tr><th align="left" style="background:#f5f5f5;"><?php echo esc_html($t['walls2']); ?></th><td><?php echo nl2br(esc_html(self::translate_config_value(self::garage_value($garage, 'carportSides2'), $lang))); ?></td></tr>
                </table>
              <?php endif; ?>

              <h4 style="margin:14px 0 8px;"><?php echo esc_html($t['addons']); ?></h4>
              <table cellpadding="6" cellspacing="0" border="0" style="width:100%; border-collapse:collapse;">
                <tr><th align="left" style="background:#f5f5f5; width:220px;"><?php echo esc_html($t['gutter']); ?></th><td><?php echo esc_html(self::yes_no(self::garage_value($garage, 'gutter'), $lang)); ?></td></tr>
                <tr><th align="left" style="background:#f5f5f5;"><?php echo esc_html($t['roof_flashings']); ?></th><td><?php
                  $roof_flashing = self::yes_no(self::garage_value($garage, 'roofFlashing'), $lang);
                  if (self::garage_value($garage, 'roofFlashing')) {
                      $roof_flashing .= ' - ' . (self::garage_value($garage, 'roofFlashingColorMode') === 'custom'
                          ? self::translate_config_value(self::garage_value($garage, 'roofFlashingColor', self::garage_value($garage, 'roofFlashingColorRal')), $lang)
                          : $t['same_as_roof']);
                  }
                  echo esc_html($roof_flashing);
                ?></td></tr>
                <tr><th align="left" style="background:#f5f5f5;"><?php echo esc_html($t['garage_flashings']); ?></th><td><?php
                  $garage_flashing = self::yes_no(self::garage_value($garage, 'garageFlashing'), $lang);
                  if (self::garage_value($garage, 'garageFlashing')) {
                      $garage_flashing .= ' - ' . (self::garage_value($garage, 'garageFlashingColorMode') === 'custom'
                          ? self::translate_config_value(self::garage_value($garage, 'garageFlashingColor', self::garage_value($garage, 'garageFlashingColorRal')), $lang)
                          : $t['same_as_garage']);
                  }
                  echo esc_html($garage_flashing);
                ?></td></tr>
                <tr><th align="left" style="background:#f5f5f5;"><?php echo esc_html($t['automation']); ?></th><td><?php echo esc_html(self::yes_no(self::garage_value($garage, 'automatic'), $lang)); ?><?php echo !empty(self::garage_value($garage, 'automatic')) ? ' (' . esc_html((string) self::garage_value($garage, 'countAutomatic', 0)) . $t['pieces'] . ')' : ''; ?></td></tr>
                <tr><th align="left" style="background:#f5f5f5;"><?php echo esc_html($t['filc']); ?></th><td><?php echo esc_html(self::yes_no(self::garage_value($garage, 'filc'), $lang)); ?></td></tr>
                <tr><th align="left" style="background:#f5f5f5;"><?php echo esc_html($t['transport']); ?></th><td><?php echo esc_html(self::yes_no(self::garage_value($garage, 'transport'), $lang)); ?></td></tr>
              </table>
            </div>

            <?php if (!empty($image_url)): ?>
              <div style="margin-top:18px; border:1px solid #ddd; border-radius:8px; padding:14px; text-align:center;">
                <h3 style="margin:0 0 12px;"><?php echo esc_html($t['garage_visualization']); ?></h3>
                <img src="<?php echo esc_url($image_url); ?>" alt="<?php echo esc_attr($t['garage_visualization']); ?>" style="max-width:100%; height:auto; border:1px solid #ddd; border-radius:6px;" />
              </div>
            <?php endif; ?>

          </div>
        </body>
        </html>
        <?php
        return (string) ob_get_clean();
    }
    private static function resolve_logo_url() {
        $custom_logo_id = (int) get_theme_mod('custom_logo');
        if ($custom_logo_id > 0) {
            $logo = wp_get_attachment_image_url($custom_logo_id, 'full');
            if (!empty($logo)) {
                return $logo;
            }
        }
        $site_icon_id = (int) get_option('site_icon');
        if ($site_icon_id > 0) {
            $icon = wp_get_attachment_image_url($site_icon_id, 'full');
            if (!empty($icon)) {
                return $icon;
            }
        }
        return '';
    }

    private static function resolve_frontend_lang() {
        $locale = strtolower((string) get_locale());
        if (strpos($locale, 'cs') === 0) {
            return 'cs';
        }
        if (strpos($locale, 'sk') === 0) {
            return 'sl';
        }
        if (strpos($locale, 'hu') === 0) {
            return 'hu';
        }
        return 'pl';
    }

    private static function get_pdf_language() {
        $lang = (string) get_option(self::OPTION_PDF_LANGUAGE, 'pl');
        return in_array($lang, ['pl', 'cs'], true) ? $lang : 'pl';
    }

    private static function get_pdf_czk_exchange_rate() {
        $rate = get_option(self::OPTION_PDF_CZK_EXCHANGE_RATE, 6);
        $rate = is_string($rate) ? str_replace(',', '.', $rate) : $rate;
        $rate = (float) $rate;
        return $rate > 0 ? $rate : 6;
    }

    private static function resolve_pdf_language($requested_lang = '') {
        $configured_lang = self::get_pdf_language();
        if ($configured_lang !== '') {
            return $configured_lang;
        }

        return in_array($requested_lang, ['pl', 'cs'], true) ? $requested_lang : 'pl';
    }

    private static function garage_value($garage, $key, $default = '') {
        if (!is_array($garage)) {
            return $default;
        }
        return array_key_exists($key, $garage) ? $garage[$key] : $default;
    }

    private static function yes_no($value, $lang = 'pl') {
        if ($lang === 'cs') {
            return !empty($value) ? 'Ano' : 'Ne';
        }
        if ($lang === 'sl') {
            return !empty($value) ? 'Ano' : 'Nie';
        }
        if ($lang === 'hu') {
            return !empty($value) ? 'Igen' : 'Nem';
        }
        return !empty($value) ? 'Tak' : 'Nie';
    }

    private static function format_cm_as_m($value) {
        if ($value === null || $value === '') {
            return '-';
        }

        $number = is_numeric($value) ? ((float) $value / 100) : null;
        if ($number === null) {
            return (string) $value;
        }

        $formatted = number_format($number, 2, '.', '');
        $formatted = rtrim(rtrim($formatted, '0'), '.');

        return $formatted . ' m';
    }

    private static function format_size_cm_as_m($size) {
        $size = trim((string) $size);
        if ($size === '' || $size === '-') {
            return '-';
        }

        $parts = preg_split('/\s*x\s*/i', $size);
        if (!is_array($parts) || count($parts) !== 2 || !is_numeric($parts[0]) || !is_numeric($parts[1])) {
            return $size;
        }

        return self::format_cm_as_m($parts[0]) . ' x ' . self::format_cm_as_m($parts[1]);
    }

    private static function create_pdf_attachment_from_request($data) {
        if (empty($data['pdf']) || !is_array($data['pdf'])) {
            return null;
        }

        $pdf = $data['pdf'];
        $content_base64 = isset($pdf['contentBase64']) ? (string) $pdf['contentBase64'] : '';
        if ($content_base64 === '') {
            return null;
        }

        if (strpos($content_base64, ',') !== false) {
            $parts = explode(',', $content_base64, 2);
            $content_base64 = $parts[1];
        }

        $binary = base64_decode($content_base64, true);
        if ($binary === false || substr($binary, 0, 4) !== '%PDF') {
            return null;
        }

        $max_size = 10 * 1024 * 1024;
        if (strlen($binary) > $max_size) {
            return null;
        }

        $filename = isset($pdf['filename']) ? sanitize_file_name((string) $pdf['filename']) : '';
        if ($filename === '') {
            $filename = 'zapytanie-garaz.pdf';
        }
        if (strtolower(pathinfo($filename, PATHINFO_EXTENSION)) !== 'pdf') {
            $filename .= '.pdf';
        }

        $upload = wp_upload_dir();
        $dir = isset($upload['path']) ? (string) $upload['path'] : sys_get_temp_dir();
        if (!is_dir($dir)) {
            wp_mkdir_p($dir);
        }

        $path = trailingslashit($dir) . 'mail-' . wp_generate_password(12, false) . '-' . $filename;
        if (file_put_contents($path, $binary) === false) {
            return null;
        }

        return $path;
    }

    private static function resolve_image_attachments($image_url) {
        if (empty($image_url)) {
            return [];
        }
        $upload = wp_upload_dir();
        $base_url = isset($upload['baseurl']) ? (string) $upload['baseurl'] : '';
        $base_dir = isset($upload['basedir']) ? (string) $upload['basedir'] : '';
        if ($base_url === '' || $base_dir === '' || strpos($image_url, $base_url) !== 0) {
            return [];
        }
        $relative = ltrim(substr($image_url, strlen($base_url)), '/');
        $file_path = wp_normalize_path($base_dir . '/' . $relative);
        if (file_exists($file_path) && is_file($file_path)) {
            return [$file_path];
        }
        return [];
    }

    private static function format_item_details_html($raw, $type, $lang = 'pl') {
        if (!is_string($raw) || trim($raw) === '') {
            return '-';
        }

        $lines = preg_split('/\r\n|\r|\n/', trim($raw));
        $result = [];
        $idx = 0;

        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '') {
                continue;
            }
            $idx++;

            if (preg_match('/^[^:]+:\s*(\{.*\})$/', $line, $m)) {
                $decoded = json_decode($m[1], true);
                if (is_array($decoded)) {
                    $result[] = $type === 'door'
                        ? self::format_door_line($decoded, $idx, $lang)
                        : self::format_window_line($decoded, $idx, $lang);
                    continue;
                }
            }

            $result[] = esc_html($line);
        }

        return implode('<br>', $result);
    }

        private static function format_door_line($door, $idx, $lang = 'pl') {
        $size = isset($door['size']) ? self::format_size_cm_as_m($door['size']) : '-';
        $door_type = self::translate_config_value(isset($door['type']) ? (string) $door['type'] : '-', $lang);
        $color = self::translate_config_value(isset($door['color']) ? (string) $door['color'] : '-', $lang);
        $position = self::translate_config_value(isset($door['position']) ? (string) $door['position'] : '-', $lang);
        $position_value = isset($door['positionValue']) ? self::format_cm_as_m($door['positionValue']) : '-';
        if ($lang === 'cs') {
            return esc_html(
                'Dvere ' . $idx .
                ': rozmer ' . $size .
                ', typ ' . $door_type .
                ', barva ' . $color .
                ', pozice ' . $position .
                ', vzdalenost ' . $position_value
            );
        }
        if ($lang === 'sl') {
            return esc_html(
                'Dvere ' . $idx .
                ': rozmer ' . $size .
                ', typ ' . $door_type .
                ', farba ' . $color .
                ', pozicia ' . $position .
                ', vzdialenost ' . $position_value
            );
        }
        if ($lang === 'hu') {
            return esc_html(
                'Ajto ' . $idx .
                ': meret ' . $size .
                ', tipus ' . $door_type .
                ', szin ' . $color .
                ', pozicio ' . $position .
                ', tavolsag ' . $position_value
            );
        }
        return esc_html(
            'Drzwi ' . $idx .
            ': rozmiar ' . $size .
            ', typ ' . $door_type .
            ', kolor ' . $color .
            ', pozycja ' . $position .
            ', odleglosc ' . $position_value
        );
    }
        private static function format_window_line($window, $idx, $lang = 'pl') {
        $size = isset($window['size']) ? self::format_size_cm_as_m($window['size']) : '-';
        $position = self::translate_config_value(isset($window['position']) ? (string) $window['position'] : '-', $lang);
        $position_value = isset($window['positionValue']) ? self::format_cm_as_m($window['positionValue']) : '-';
        if ($lang === 'cs') {
            return esc_html(
                'Okno ' . $idx .
                ': rozmer ' . $size .
                ', pozice ' . $position .
                ', vzdalenost ' . $position_value
            );
        }
        if ($lang === 'sl') {
            return esc_html(
                'Okno ' . $idx .
                ': rozmer ' . $size .
                ', pozicia ' . $position .
                ', vzdialenost ' . $position_value
            );
        }
        if ($lang === 'hu') {
            return esc_html(
                'Ablak ' . $idx .
                ': meret ' . $size .
                ', pozicio ' . $position .
                ', tavolsag ' . $position_value
            );
        }
        return esc_html(
            'Okno ' . $idx .
            ': rozmiar ' . $size .
            ', pozycja ' . $position .
            ', odleglosc ' . $position_value
        );
    }

    private static function translate_config_value($value, $lang = 'pl') {
        $source = is_scalar($value) ? (string) $value : '';
        $special = [
            'na_rabek' => ['pl' => 'na rabek', 'cs' => 'stojata drazka', 'sl' => 'stojata drazka', 'hu' => 'allokorcos'],
            'segmentowa' => ['pl' => 'segmentowa', 'cs' => 'sekcni', 'sl' => 'sekcna', 'hu' => 'szekcionalt'],
            'none' => ['pl' => 'bez napedu', 'cs' => 'bez pohonu', 'sl' => 'bez pohonu', 'hu' => 'meghajtas nelkul'],
            'came' => ['pl' => 'CAME + 2 piloty', 'cs' => 'CAME + 2 ovladace', 'sl' => 'CAME + 2 ovladace', 'hu' => 'CAME + 2 taviranyito'],
        ];
        if (isset($special[$source])) {
            return isset($special[$source][$lang]) ? $special[$source][$lang] : $special[$source]['pl'];
        }
        if ($source === '' || $lang === 'pl') {
            return $source;
        }

        $replacements = [
            'cs' => [
                ['Lewo:', 'Prawo:', 'Przod:', 'Przód:', 'Tyl:', 'Tak', 'Nie'],
                ['Leva:', 'Prava:', 'Predni:', 'Predni:', 'Zadni:', 'Ano', 'Ne'],
            ],
            'sl' => [
                ['Lewo:', 'Prawo:', 'Przod:', 'Przód:', 'Tyl:', 'Tak', 'Nie'],
                ['Lava:', 'Prava:', 'Predna:', 'Predna:', 'Zadna:', 'Ano', 'Nie'],
            ],
            'hu' => [
                ['Lewo:', 'Prawo:', 'Przod:', 'Przód:', 'Tyl:', 'Tak', 'Nie'],
                ['Bal:', 'Jobb:', 'Elol:', 'Elol:', 'Hatul:', 'Igen', 'Nem'],
            ],
        ];

        $maps = [
            'cs' => [
                'ocynk' => 'Pozink',
                'orzech' => 'Orech',
                'zloty dab' => 'Zlaty dub',
                'złoty dąb' => 'Zlaty dub',
                'zloty dab ciemny' => 'Tmavy zlaty dub',
                'złoty dąb ciemny' => 'Tmavy zlaty dub',
                'lewo' => 'Leva',
                'prawo' => 'Prava',
                'przod' => 'Predni',
                'przód' => 'Predni',
                'tyl' => 'Zadni',
                'tył' => 'Zadni',
                'pion' => 'Svisle',
                'poziom' => 'Vodorovne',
                'spad tyl' => 'Spad dozadu',
                'spad tył' => 'Spad dozadu',
                'spad przod' => 'Spad dopredu',
                'spad przód' => 'Spad dopredu',
                'spad w lewo' => 'Spad doleva',
                'spad w prawo' => 'Spad doprava',
                'dwuspad' => 'Dvojity spad',
                'dwuspad przod-tyl' => 'Dvojity spad predek-zadek',
                'dwuspad przod-tył' => 'Dvojity spad predek-zadek',
                'trapezowa' => 'Trapezova',
                'blachodachowka' => 'Plechova stresni taska',
                'blachodachówka' => 'Plechova stresni taska',
                'uchylna' => 'Vyklopna',
                'dwuskrzydlowa' => 'Dvoukridlova',
                'dwuskrzydłowa' => 'Dvoukridlova',
                'brak' => 'Bez pristresku',
                'oblachowane' => 'Oplechovane',
                'azury' => 'Azurove',
                'mix' => 'Mix',
            ],
            'sl' => [
                'ocynk' => 'Pozink',
                'orzech' => 'Orech',
                'zloty dab' => 'Zlaty dub',
                'złoty dąb' => 'Zlaty dub',
                'zloty dab ciemny' => 'Tmavy zlaty dub',
                'złoty dąb ciemny' => 'Tmavy zlaty dub',
                'lewo' => 'Lava',
                'prawo' => 'Prava',
                'przod' => 'Predna',
                'przód' => 'Predna',
                'tyl' => 'Zadna',
                'tył' => 'Zadna',
                'pion' => 'Zvisle',
                'poziom' => 'Vodorovne',
                'spad tyl' => 'Spad dozadu',
                'spad tył' => 'Spad dozadu',
                'spad przod' => 'Spad dopredu',
                'spad przód' => 'Spad dopredu',
                'spad w lewo' => 'Spad dolava',
                'spad w prawo' => 'Spad doprava',
                'dwuspad' => 'Dvojity spad',
                'dwuspad przod-tyl' => 'Dvojity spad predu-zadu',
                'dwuspad przod-tył' => 'Dvojity spad predu-zadu',
                'trapezowa' => 'Trapezova',
                'blachodachowka' => 'Plechova stresna krytina',
                'blachodachówka' => 'Plechova stresna krytina',
                'uchylna' => 'Vyklopna',
                'dwuskrzydlowa' => 'Dvojkridlova',
                'dwuskrzydłowa' => 'Dvojkridlova',
                'brak' => 'Bez pristresku',
                'oblachowane' => 'Oplastene',
                'azury' => 'Azurowe',
                'mix' => 'Kombinacia',
            ],
            'hu' => [
                'ocynk' => 'Horganyzott',
                'orzech' => 'Dio',
                'zloty dab' => 'Aranytolgy',
                'złoty dąb' => 'Aranytolgy',
                'zloty dab ciemny' => 'Sotet aranytolgy',
                'złoty dąb ciemny' => 'Sotet aranytolgy',
                'lewo' => 'Bal',
                'prawo' => 'Jobb',
                'przod' => 'Elol',
                'przód' => 'Elol',
                'tyl' => 'Hatul',
                'tył' => 'Hatul',
                'pion' => 'Fuggoleges',
                'poziom' => 'Vizszintes',
                'spad tyl' => 'Hatso lejtes',
                'spad tył' => 'Hatso lejtes',
                'spad przod' => 'Elso lejtes',
                'spad przód' => 'Elso lejtes',
                'spad w lewo' => 'Balra lejto',
                'spad w prawo' => 'Jobbra lejto',
                'dwuspad' => 'Ketoldalu teto',
                'dwuspad przod-tyl' => 'Ketoldalu teto elol-hatul',
                'dwuspad przod-tył' => 'Ketoldalu teto elol-hatul',
                'trapezowa' => 'Trapezlemez',
                'blachodachowka' => 'Cserepmintas lemez',
                'blachodachówka' => 'Cserepmintas lemez',
                'uchylna' => 'Billeno',
                'dwuskrzydlowa' => 'Ketszarnyu',
                'dwuskrzydłowa' => 'Ketszarnyu',
                'brak' => 'Burkolat nelkul',
                'oblachowane' => 'Burkolt',
                'azury' => 'Lamelas',
                'mix' => 'Kombinalt',
            ],
        ];

        $translated = isset($replacements[$lang])
            ? str_ireplace($replacements[$lang][0], $replacements[$lang][1], $source)
            : $source;

        $key = strtolower(trim($translated));
        return isset($maps[$lang][$key]) ? $maps[$lang][$key] : $translated;
    }

    public static function handle_generate_pdf(WP_REST_Request $request) {
        // Increase limits for PDF generation.
        @set_time_limit(60);
        @ini_set('memory_limit', '256M');

        // Load PDF generator class only when needed.
        $generator_file = plugin_dir_path(__FILE__) . 'class-pdf-generator.php';
        if (!file_exists($generator_file)) {
            return new WP_Error('pdf_missing', 'PDF generator file not found', ['status' => 500]);
        }
        require_once $generator_file;

        $data = $request->get_json_params();
        $garage = isset($data['garage_config']) && is_array($data['garage_config']) ? $data['garage_config'] : [];
        $contact = isset($data['contact']) && is_array($data['contact']) ? $data['contact'] : [];
        $price = isset($data['price']) ? sanitize_text_field((string) $data['price']) : '';
        $image_url = isset($data['imageURL']) ? esc_url_raw($data['imageURL']) : '';
        $allowed_langs = ['pl', 'cs', 'sl', 'hu'];
        $lang = isset($data['lang']) && in_array($data['lang'], $allowed_langs, true) ? $data['lang'] : 'pl';
        $pdf_lang = self::resolve_pdf_language($lang);

        // Catch everything — errors, exceptions, and output buffering issues.
        ob_start();
        try {
            $pdf_gen = new Configurator_PDF_Generator($garage, $contact, $price, $image_url, $pdf_lang, self::get_pdf_czk_exchange_rate());
            $pdf_path = $pdf_gen->generate();

            if (!$pdf_path || !file_exists($pdf_path)) {
                $dbg = ob_get_clean();
                return new WP_Error('pdf_failed', 'PDF file not created. Debug: ' . $dbg, ['status' => 500]);
            }

            // Move to uploads directory with a publicly accessible name.
            $upload = wp_upload_dir();
            $filename = 'cfg-pdf-' . wp_generate_password(12, false) . '.pdf';
            $dest = trailingslashit($upload['path']) . $filename;
            rename($pdf_path, $dest);

            $download_url = trailingslashit($upload['url']) . $filename;

            // Schedule cleanup of old PDFs (delete files older than 1 hour).
            self::cleanup_temp_pdfs($upload['path']);

            ob_end_clean();

            return [
                'success' => true,
                'downloadUrl' => $download_url,
                'filename' => 'zamowienie-garaz-' . date('Y-m-d-His') . '.pdf',
            ];
        } catch (\Throwable $e) {
            $dbg = ob_get_clean();
            return new WP_Error('pdf_error', get_class($e) . ': ' . $e->getMessage() . ' in ' . basename($e->getFile()) . ':' . $e->getLine() . ($dbg ? ' | Output: ' . substr($dbg, 0, 500) : ''), ['status' => 500]);
        }
    }

    private static function cleanup_temp_pdfs($dir) {
        $files = glob(trailingslashit($dir) . 'cfg-pdf-*.pdf');
        if (!$files) return;
        $cutoff = time() - 3600; // 1 hour.
        foreach ($files as $f) {
            if (filemtime($f) < $cutoff) {
                @unlink($f);
            }
        }
    }

    // --- Price Editor Admin ---

    public static function add_admin_menu() {
        add_menu_page(
            'Ceny konfiguratora',
            'Ceny konfiguratora',
            'manage_options',
            'configurator-prices',
            [__CLASS__, 'render_price_admin_page'],
            'dashicons-money-alt',
            56
        );
    }

    private static function get_default_prices($type) {
        $filename = $type === 'galvanized'
            ? 'dataOcynk.json'
            : ($type === 'standing_seam' ? 'dataStandingSeam.json' : 'data.json');
        $file = plugin_dir_path(__FILE__) . 'defaults/' . $filename;
        if (!file_exists($file)) {
            return [];
        }
        $decoded = json_decode(file_get_contents($file), true);
        return is_array($decoded) ? $decoded : [];
    }

    private static function get_effective_prices($type) {
        if ($type === 'standing_seam') {
            $standing = get_option(self::OPTION_PRICES_STANDING_SEAM, false);
            if ($standing === false || !is_array($standing) || empty($standing)) {
                $standing = self::get_effective_prices('standard');
                update_option(self::OPTION_PRICES_STANDING_SEAM, $standing);
            }
            return $standing;
        }

        $option = $type === 'galvanized' ? self::OPTION_PRICES_GALVANIZED : self::OPTION_PRICES_STANDARD;
        $defaults = self::get_default_prices($type);
        $custom = get_option($option, false);
        if ($custom !== false && is_array($custom) && !empty($custom)) {
            $merged = self::build_price_lookup($defaults);
            foreach ($custom as $item) {
                $w = (string) (float) $item['width'];
                $d = (string) (float) $item['depth'];
                $merged[$w][$d] = (int) $item['price'];
            }

            $prices = [];
            $ws = array_keys($merged);
            usort($ws, function($a, $b) { return floatval($a) - floatval($b); });
            foreach ($ws as $w) {
                $depths = $merged[$w];
                $ds = array_keys($depths);
                usort($ds, function($a, $b) { return floatval($a) - floatval($b); });
                foreach ($ds as $d) {
                    $prices[] = ['width' => (float) $w, 'depth' => (float) $d, 'price' => (int) $depths[$d]];
                }
            }

            return $prices;
        }
        return $defaults;
    }

    private static function get_default_sectional_prices() {
        $file = plugin_dir_path(__FILE__) . 'defaults/sectionalGates.json';
        if (!file_exists($file)) {
            return [];
        }
        $decoded = json_decode(file_get_contents($file), true);
        if (!is_array($decoded)) {
            return [];
        }
        if (isset($decoded[0]['widthMm'])) {
            return $decoded;
        }
        $widths = isset($decoded['widthsMm']) && is_array($decoded['widthsMm']) ? $decoded['widthsMm'] : [];
        $prices = [];
        foreach ((isset($decoded['rows']) && is_array($decoded['rows']) ? $decoded['rows'] : []) as $row) {
            $height = isset($row['heightMm']) ? (int) $row['heightMm'] : 0;
            foreach ($widths as $index => $width) {
                $price = isset($row['prices'][$index]) ? (int) $row['prices'][$index] : 0;
                if ($height > 0 && (int) $width > 0 && $price > 0) {
                    $prices[] = ['widthMm' => (int) $width, 'heightMm' => $height, 'price' => $price];
                }
            }
        }
        return $prices;
    }

    private static function get_effective_sectional_prices($include_unavailable = false) {
        $custom = get_option(self::OPTION_SECTIONAL_GATE_PRICES, false);
        $prices = is_array($custom) && !empty($custom) ? $custom : self::get_default_sectional_prices();
        if ($include_unavailable) {
            return $prices;
        }
        return array_values(array_filter($prices, function($item) {
            return isset($item['price']) && (int) $item['price'] > 0;
        }));
    }

    private static function build_sectional_price_lookup($prices) {
        $map = [];
        foreach ($prices as $item) {
            $map[(int) $item['heightMm']][(int) $item['widthMm']] = (int) $item['price'];
        }
        return $map;
    }

    private static function build_price_lookup($prices) {
        $map = [];
        foreach ($prices as $item) {
            $w = (string) (float) $item['width'];
            $d = (string) (float) $item['depth'];
            $map[$w][$d] = (int) $item['price'];
        }
        return $map;
    }

    private static function get_addon_defaults() {
        return [
            'heightPerCm' => 700,
            'ocynkExtra' => 1400,
            'gateDwuskrzydlowa' => -400,
            'automatic' => 1300,
            'blachodachowkaPerM2' => 65,
            'filcPerM2' => 25,
            'door' => 450,
            'window' => 450,
            'spadTyl' => -500,
            'carportBrak' => 1000,
            'carportOblachowane' => 2000,
            'carportAzury' => 2500,
            'carportPerHalfMeter' => 500,
            'carportVariable' => 1000,
            'gutterPerMeter' => 100,
            'includedUpAndOverGate' => 0,
            'transportNear' => 250,
            'transportFar' => 500,
        ];
    }

    private static function get_effective_addons() {
        $custom = get_option(self::OPTION_ADDON_PRICES, []);
        if (!is_array($custom) || empty($custom)) {
            return self::get_addon_defaults();
        }
        return array_merge(self::get_addon_defaults(), $custom);
    }

    private static function csv_cell($row, $headers, $name, $default = '') {
        if (!isset($headers[$name])) {
            return $default;
        }
        $index = $headers[$name];
        return isset($row[$index]) ? trim((string) $row[$index]) : $default;
    }

    private static function csv_number($value) {
        $value = str_replace(["\xc2\xa0", ' '], '', (string) $value);
        return str_replace(',', '.', $value);
    }

    private static function read_csv_rows($file_path) {
        if (!is_readable($file_path)) {
            return [[], []];
        }

        $probe = fopen($file_path, 'r');
        if (!$probe) {
            return [[], []];
        }
        $first_line = (string) fgets($probe);
        fclose($probe);
        $delimiter = substr_count($first_line, ';') >= substr_count($first_line, ',') ? ';' : ',';
        $handle = fopen($file_path, 'r');
        if (!$handle) {
            return [[], []];
        }

        $headers = [];
        $rows = [];
        $first = fgetcsv($handle, 0, $delimiter);
        if (is_array($first)) {
            foreach ($first as $index => $header) {
                $key = strtolower(trim((string) $header));
                $key = preg_replace('/^\xEF\xBB\xBF/', '', $key);
                $headers[$key] = $index;
            }
        }

        while (($row = fgetcsv($handle, 0, $delimiter)) !== false) {
            if (is_array($row) && count(array_filter($row, function($value) { return trim((string) $value) !== ''; })) > 0) {
                $rows[] = $row;
            }
        }
        fclose($handle);

        return [$headers, $rows];
    }

    private static function import_price_csv($active_tab, $file_path) {
        [$headers, $rows] = self::read_csv_rows($file_path);
        if (empty($headers) || empty($rows)) {
            return 0;
        }

        if ($active_tab === 'addons') {
            $addons = self::get_effective_addons();
            $addon_key_map = [];
            foreach (array_keys(self::get_addon_defaults()) as $default_key) {
                $addon_key_map[strtolower($default_key)] = $default_key;
            }
            $count = 0;
            foreach ($rows as $row) {
                $raw_key = trim(self::csv_cell($row, $headers, 'key', self::csv_cell($row, $headers, 'addon')));
                $key_lookup = strtolower($raw_key);
                $key = isset($addon_key_map[$key_lookup]) ? $addon_key_map[$key_lookup] : $raw_key;
                $price = self::csv_number(self::csv_cell($row, $headers, 'price', self::csv_cell($row, $headers, 'cena')));
                if ($key !== '' && array_key_exists($key, self::get_addon_defaults()) && is_numeric($price)) {
                    $addons[$key] = (int) $price;
                    $count++;
                }
            }
            if ($count > 0) {
                update_option(self::OPTION_ADDON_PRICES, $addons);
            }
            return $count;
        }

        if ($active_tab === 'sectional_gates') {
            $prices = [];
            foreach ($rows as $row) {
                $width = self::csv_number(self::csv_cell($row, $headers, 'widthmm', self::csv_cell($row, $headers, 'width')));
                $height = self::csv_number(self::csv_cell($row, $headers, 'heightmm', self::csv_cell($row, $headers, 'height')));
                $price = self::csv_number(self::csv_cell($row, $headers, 'price', self::csv_cell($row, $headers, 'cena')));
                if (is_numeric($width) && is_numeric($height) && is_numeric($price)) {
                    $prices[] = [
                        'widthMm' => (int) $width,
                        'heightMm' => (int) $height,
                        'price' => max(0, (int) $price),
                    ];
                }
            }
            if (!empty($prices)) {
                update_option(self::OPTION_SECTIONAL_GATE_PRICES, $prices);
            }
            return count($prices);
        }

        $prices = [];
        foreach ($rows as $row) {
            $width = self::csv_number(self::csv_cell($row, $headers, 'width', self::csv_cell($row, $headers, 'szerokosc')));
            $depth = self::csv_number(self::csv_cell($row, $headers, 'depth', self::csv_cell($row, $headers, 'glebokosc')));
            $price = self::csv_number(self::csv_cell($row, $headers, 'price', self::csv_cell($row, $headers, 'cena')));
            if (is_numeric($width) && is_numeric($depth) && is_numeric($price)) {
                $prices[] = [
                    'width' => (float) $width,
                    'depth' => (float) $depth,
                    'price' => max(0, (int) $price),
                ];
            }
        }

        if (!empty($prices)) {
            $option = $active_tab === 'galvanized'
                ? self::OPTION_PRICES_GALVANIZED
                : ($active_tab === 'standing_seam' ? self::OPTION_PRICES_STANDING_SEAM : self::OPTION_PRICES_STANDARD);
            update_option($option, $prices);
        }

        return count($prices);
    }

    private static function export_price_csv($active_tab) {
        $filename = 'configurator-prices-' . $active_tab . '-' . date('Y-m-d') . '.csv';
        nocache_headers();
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="' . $filename . '"');

        $out = fopen('php://output', 'w');
        fwrite($out, "\xEF\xBB\xBF");

        if ($active_tab === 'addons') {
            fputcsv($out, ['key', 'price'], ';');
            foreach (self::get_effective_addons() as $key => $price) {
                fputcsv($out, [$key, (int) $price], ';');
            }
        } elseif ($active_tab === 'sectional_gates') {
            fputcsv($out, ['widthMm', 'heightMm', 'price'], ';');
            foreach (self::get_effective_sectional_prices(true) as $item) {
                fputcsv($out, [(int) $item['widthMm'], (int) $item['heightMm'], (int) $item['price']], ';');
            }
        } else {
            fputcsv($out, ['type', 'width', 'depth', 'price'], ';');
            $type = $active_tab === 'galvanized'
                ? 'galvanized'
                : ($active_tab === 'standing_seam' ? 'standing_seam' : 'standard');
            foreach (self::get_effective_prices($type) as $item) {
                fputcsv($out, [$type, $item['width'], $item['depth'], (int) $item['price']], ';');
            }
        }

        fclose($out);
        exit;
    }

    public static function handle_price_csv_export() {
        if (!is_admin() || !current_user_can('manage_options')) {
            return;
        }

        if (empty($_GET['configurator_export_prices']) || empty($_GET['page']) || $_GET['page'] !== 'configurator-prices') {
            return;
        }

        $valid_tabs = ['standard', 'galvanized', 'standing_seam', 'sectional_gates', 'addons'];
        $requested_tab = isset($_GET['tab']) ? sanitize_key(wp_unslash($_GET['tab'])) : 'standard';
        $active_tab = in_array($requested_tab, $valid_tabs, true) ? $requested_tab : 'standard';
        $nonce = isset($_GET['_wpnonce']) ? sanitize_text_field(wp_unslash($_GET['_wpnonce'])) : '';

        if (!wp_verify_nonce($nonce, 'configurator_export_prices_' . $active_tab)) {
            wp_die('Nieprawidlowy token eksportu.');
        }

        self::export_price_csv($active_tab);
    }

    public static function handle_get_prices(WP_REST_Request $request) {
        $standard = self::get_effective_prices('standard');
        $galvanized = self::get_effective_prices('galvanized');
        $standing_seam = self::get_effective_prices('standing_seam');
        $sectional_gates = self::get_effective_sectional_prices();
        return [
            'success' => true,
            'data' => [
                'standard' => $standard,
                'galvanized' => $galvanized,
                'standingSeam' => $standing_seam,
                'sectionalGates' => $sectional_gates,
                'showPrice' => (bool) get_option(self::OPTION_SHOW_PRICE, true),
                'addons' => self::get_effective_addons(),
                'pdfLanguage' => self::get_pdf_language(),
                'pdfCzkExchangeRate' => self::get_pdf_czk_exchange_rate(),
            ],
        ];
    }

    public static function render_price_admin_page() {
        if (!current_user_can('manage_options')) {
            return;
        }

        $notice = '';
        $valid_tabs = ['standard', 'galvanized', 'standing_seam', 'sectional_gates', 'addons'];
        $requested_tab = isset($_POST['configurator_active_tab'])
            ? sanitize_key(wp_unslash($_POST['configurator_active_tab']))
            : (isset($_GET['tab']) ? sanitize_key(wp_unslash($_GET['tab'])) : 'standard');
        $active_tab = in_array($requested_tab, $valid_tabs, true) ? $requested_tab : 'standard';

        if (isset($_POST['configurator_reset_prices']) && check_admin_referer('configurator_prices_save', 'configurator_prices_nonce')) {
            if ($active_tab === 'standard') {
                delete_option(self::OPTION_PRICES_STANDARD);
            } elseif ($active_tab === 'galvanized') {
                delete_option(self::OPTION_PRICES_GALVANIZED);
            } elseif ($active_tab === 'standing_seam') {
                update_option(self::OPTION_PRICES_STANDING_SEAM, self::get_effective_prices('standard'));
            } elseif ($active_tab === 'sectional_gates') {
                delete_option(self::OPTION_SECTIONAL_GATE_PRICES);
            } elseif ($active_tab === 'addons') {
                delete_option(self::OPTION_ADDON_PRICES);
            }
            $notice = '<div class="notice notice-success is-dismissible"><p>Ceny zostaly przywrocone do domyslnych.</p></div>';
        }

        if (isset($_POST['configurator_import_prices']) && check_admin_referer('configurator_prices_save', 'configurator_prices_nonce')) {
            if (!empty($_FILES['configurator_prices_csv']['tmp_name'])) {
                $imported = self::import_price_csv($active_tab, $_FILES['configurator_prices_csv']['tmp_name']);
                if ($imported > 0) {
                    $notice = '<div class="notice notice-success is-dismissible"><p>Zaimportowano ' . esc_html($imported) . ' pozycji z pliku CSV.</p></div>';
                } else {
                    $notice = '<div class="notice notice-error is-dismissible"><p>Nie zaimportowano danych. Sprawdz format pliku CSV.</p></div>';
                }
            } else {
                $notice = '<div class="notice notice-error is-dismissible"><p>Wybierz plik CSV do importu.</p></div>';
            }
        }

        if (isset($_POST['configurator_save_prices']) && check_admin_referer('configurator_prices_save', 'configurator_prices_nonce')) {
            $prices_standard = [];
            $prices_galvanized = [];
            $prices_standing_seam = [];
            $prices_sectional_gates = [];

            if (isset($_POST['prices']['standard']) && is_array($_POST['prices']['standard'])) {
                foreach ($_POST['prices']['standard'] as $w => $depths) {
                    $wf = self::key_size($w);
                    foreach ($depths as $d => $price) {
                        $df = self::key_size($d);
                        $prices_standard[] = ['width' => $wf, 'depth' => $df, 'price' => intval($price)];
                    }
                }
            }
            if (isset($_POST['prices']['galvanized']) && is_array($_POST['prices']['galvanized'])) {
                foreach ($_POST['prices']['galvanized'] as $w => $depths) {
                    $wf = self::key_size($w);
                    foreach ($depths as $d => $price) {
                        $df = self::key_size($d);
                        $prices_galvanized[] = ['width' => $wf, 'depth' => $df, 'price' => intval($price)];
                    }
                }
            }
            if (isset($_POST['prices']['standing_seam']) && is_array($_POST['prices']['standing_seam'])) {
                foreach ($_POST['prices']['standing_seam'] as $w => $depths) {
                    $wf = self::key_size($w);
                    foreach ($depths as $d => $price) {
                        $prices_standing_seam[] = [
                            'width' => $wf,
                            'depth' => self::key_size($d),
                            'price' => max(0, intval($price)),
                        ];
                    }
                }
            }
            if (isset($_POST['sectional_prices']) && is_array($_POST['sectional_prices'])) {
                foreach ($_POST['sectional_prices'] as $height_mm => $widths) {
                    if (!is_array($widths)) continue;
                    foreach ($widths as $width_mm => $price) {
                        $prices_sectional_gates[] = [
                            'widthMm' => absint($width_mm),
                            'heightMm' => absint($height_mm),
                            'price' => max(0, intval($price)),
                        ];
                    }
                }
            }

            if ($active_tab === 'standard' && !empty($prices_standard)) {
                update_option(self::OPTION_PRICES_STANDARD, $prices_standard);
            }
            if ($active_tab === 'galvanized' && !empty($prices_galvanized)) {
                update_option(self::OPTION_PRICES_GALVANIZED, $prices_galvanized);
            }
            if ($active_tab === 'standing_seam' && !empty($prices_standing_seam)) {
                update_option(self::OPTION_PRICES_STANDING_SEAM, $prices_standing_seam);
            }
            if ($active_tab === 'sectional_gates' && !empty($prices_sectional_gates)) {
                update_option(self::OPTION_SECTIONAL_GATE_PRICES, $prices_sectional_gates);
            }
            update_option(self::OPTION_SHOW_PRICE, !empty($_POST['configurator_show_price']) ? 1 : 0);
            $pdf_language = isset($_POST['configurator_pdf_language']) ? sanitize_key(wp_unslash($_POST['configurator_pdf_language'])) : 'pl';
            update_option(self::OPTION_PDF_LANGUAGE, in_array($pdf_language, ['pl', 'cs'], true) ? $pdf_language : 'pl');
            $czk_exchange_rate = isset($_POST['configurator_pdf_czk_exchange_rate'])
                ? (float) str_replace(',', '.', sanitize_text_field(wp_unslash($_POST['configurator_pdf_czk_exchange_rate'])))
                : self::get_pdf_czk_exchange_rate();
            update_option(self::OPTION_PDF_CZK_EXCHANGE_RATE, $czk_exchange_rate > 0 ? $czk_exchange_rate : self::get_pdf_czk_exchange_rate());

            if ($active_tab === 'addons' && isset($_POST['addons']) && is_array($_POST['addons'])) {
                $addons = [];
                foreach (self::get_addon_defaults() as $key => $default) {
                    $addons[$key] = isset($_POST['addons'][$key]) ? intval($_POST['addons'][$key]) : $default;
                }
                update_option(self::OPTION_ADDON_PRICES, $addons);
            }

            $notice = '<div class="notice notice-success is-dismissible"><p>Ceny zostaly zapisane.</p></div>';
        }

        $standard = self::get_effective_prices('standard');
        $galvanized = self::get_effective_prices('galvanized');
        $standing_seam = self::get_effective_prices('standing_seam');
        $sectional_gates = self::get_effective_sectional_prices(true);
        $standard_map = self::build_price_lookup($standard);
        $galvanized_map = self::build_price_lookup($galvanized);
        $standing_seam_map = self::build_price_lookup($standing_seam);
        $sectional_gate_map = self::build_sectional_price_lookup($sectional_gates);
        $addons = self::get_effective_addons();
        $pdf_language = self::get_pdf_language();
        $pdf_czk_exchange_rate = self::get_pdf_czk_exchange_rate();
        $addon_labels = [
            'heightPerCm' => 'Wysokosc (zl / 10cm powyzej 213cm)',
            'ocynkExtra' => 'Dodatek ocynk (zl)',
            'gateDwuskrzydlowa' => 'Brama dwuskrzydlowa (zl, ujemna = znizka)',
            'automatic' => 'Automatyka (zl / szt)',
            'blachodachowkaPerM2' => 'Blachodachowka (zl / m2)',
            'filcPerM2' => 'Filc antikondenzacyjny (zl / m2)',
            'door' => 'Drzwi (zl / szt)',
            'window' => 'Okno (zl / szt)',
            'spadTyl' => 'Spad tyl (zl, ujemna = znizka)',
            'carportBrak' => 'Wiata - brak (zl)',
            'carportOblachowane' => 'Wiata - oblachowane (zl)',
            'carportAzury' => 'Wiata - azury/mix (zl)',
            'carportPerHalfMeter' => 'Wiata - zl / 0.5m szerokosci',
            'carportVariable' => 'Wiata - stala (zl)',
            'gutterPerMeter' => 'Rynny (zl / m)',
            'includedUpAndOverGate' => 'Brama uchylna zawarta w cenie bazowej (zl / szt)',
            'transportNear' => 'Transport - blisko (zl)',
            'transportFar' => 'Transport - daleko (zl)',
        ];
        $export_url = wp_nonce_url(
            admin_url('admin.php?page=configurator-prices&tab=' . rawurlencode($active_tab) . '&configurator_export_prices=1'),
            'configurator_export_prices_' . $active_tab
        );
        ?>
        <div class="wrap">
            <h1>Ceny konfiguratora garazy</h1>
            <?php echo $notice; ?>

            <h2 class="nav-tab-wrapper">
                <a href="?page=configurator-prices&tab=standard" class="nav-tab <?php echo $active_tab === 'standard' ? 'nav-tab-active' : ''; ?>">Standard</a>
                <a href="?page=configurator-prices&tab=galvanized" class="nav-tab <?php echo $active_tab === 'galvanized' ? 'nav-tab-active' : ''; ?>">Ocynk</a>
                <a href="?page=configurator-prices&tab=standing_seam" class="nav-tab <?php echo $active_tab === 'standing_seam' ? 'nav-tab-active' : ''; ?>">Na rabek</a>
                <a href="?page=configurator-prices&tab=sectional_gates" class="nav-tab <?php echo $active_tab === 'sectional_gates' ? 'nav-tab-active' : ''; ?>">Bramy segmentowe</a>
                <a href="?page=configurator-prices&tab=addons" class="nav-tab <?php echo $active_tab === 'addons' ? 'nav-tab-active' : ''; ?>">Dodatki</a>
            </h2>

            <form method="post" action="" enctype="multipart/form-data">
                <?php wp_nonce_field('configurator_prices_save', 'configurator_prices_nonce'); ?>
                <input type="hidden" name="configurator_active_tab" value="<?php echo esc_attr($active_tab); ?>">

                <?php if ($active_tab === 'standard'): ?>
                    <h3>Ceny standardowe (zl)</h3>
                    <p class="description">Szerokosc (kolumny) x Glebokosc (wiersze) w metrach. Ceny w PLN. Tlo szare = wymiary polowkowe.</p>
                    <div style="overflow-x:auto;">
                    <table class="widefat fixed striped" style="margin-top:10px;">
                        <thead>
                            <tr>
                                <th style="width:50px; position:sticky; left:0; background:#fff; z-index:2;">Gleb.\Szer.</th>
                                <?php foreach (self::$sizes as $w): ?>
                                    <th style="text-align:center; min-width:55px; <?php echo strpos((string)$w, '.') !== false ? 'background:#e8e8e8;' : ''; ?>"><?php echo $w; ?></th>
                                <?php endforeach; ?>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach (self::$sizes as $d): ?>
                                <tr style="<?php echo strpos((string)$d, '.') !== false ? 'background:#f6f6f6;' : ''; ?>">
                                    <th style="position:sticky; left:0; <?php echo strpos((string)$d, '.') !== false ? 'background:#e8e8e8;' : 'background:#fff;'; ?> z-index:1;"><?php echo $d; ?></th>
                                    <?php foreach (self::$sizes as $w): ?>
                                        <?php $wk = (string)$w; $dk = (string)$d; ?>
                                        <td>
                                            <input type="number"
                                                   name="prices[standard][<?php echo self::size_key($w); ?>][<?php echo self::size_key($d); ?>]"
                                                   value="<?php echo esc_attr(isset($standard_map[$wk][$dk]) ? $standard_map[$wk][$dk] : 0); ?>"
                                                   min="0" step="100"
                                                   style="width:55px; text-align:right; font-size:12px;">
                                        </td>
                                    <?php endforeach; ?>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                    </div>
                <?php elseif ($active_tab === 'galvanized'): ?>
                    <h3>Ceny ocynk (zl)</h3>
                    <p class="description">Szerokosc (kolumny) x Glebokosc (wiersze) w metrach. Ceny w PLN. Tlo szare = wymiary polowkowe.</p>
                    <div style="overflow-x:auto;">
                    <table class="widefat fixed striped" style="margin-top:10px;">
                        <thead>
                            <tr>
                                <th style="width:50px; position:sticky; left:0; background:#fff; z-index:2;">Gleb.\Szer.</th>
                                <?php foreach (self::$sizes as $w): ?>
                                    <th style="text-align:center; min-width:55px; <?php echo strpos((string)$w, '.') !== false ? 'background:#e8e8e8;' : ''; ?>"><?php echo $w; ?></th>
                                <?php endforeach; ?>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach (self::$sizes as $d): ?>
                                <tr style="<?php echo strpos((string)$d, '.') !== false ? 'background:#f6f6f6;' : ''; ?>">
                                    <th style="position:sticky; left:0; <?php echo strpos((string)$d, '.') !== false ? 'background:#e8e8e8;' : 'background:#fff;'; ?> z-index:1;"><?php echo $d; ?></th>
                                    <?php foreach (self::$sizes as $w): ?>
                                        <?php $wk = (string)$w; $dk = (string)$d; ?>
                                        <td>
                                            <input type="number"
                                                   name="prices[galvanized][<?php echo self::size_key($w); ?>][<?php echo self::size_key($d); ?>]"
                                                   value="<?php echo esc_attr(isset($galvanized_map[$wk][$dk]) ? $galvanized_map[$wk][$dk] : 0); ?>"
                                                   min="0" step="100"
                                                   style="width:55px; text-align:right; font-size:12px;">
                                        </td>
                                    <?php endforeach; ?>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                    </div>
                <?php elseif ($active_tab === 'standing_seam'): ?>
                    <h3>Ceny garazy z blacha na rabek (zl)</h3>
                    <p class="description">Cennik calego garazu stosowany, gdy blacha na rabek jest wybrana na scianach lub na dachu. Szerokosc (kolumny) x glebokosc (wiersze) w metrach.</p>
                    <div style="overflow-x:auto;">
                    <table class="widefat fixed striped" style="margin-top:10px;">
                        <thead>
                            <tr>
                                <th style="width:50px; position:sticky; left:0; background:#fff; z-index:2;">Gleb.\Szer.</th>
                                <?php foreach (self::$sizes as $w): ?>
                                    <th style="text-align:center; min-width:55px; <?php echo strpos((string)$w, '.') !== false ? 'background:#e8e8e8;' : ''; ?>"><?php echo esc_html($w); ?></th>
                                <?php endforeach; ?>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach (self::$sizes as $d): ?>
                                <tr style="<?php echo strpos((string)$d, '.') !== false ? 'background:#f6f6f6;' : ''; ?>">
                                    <th style="position:sticky; left:0; <?php echo strpos((string)$d, '.') !== false ? 'background:#e8e8e8;' : 'background:#fff;'; ?> z-index:1;"><?php echo esc_html($d); ?></th>
                                    <?php foreach (self::$sizes as $w): ?>
                                        <?php $wk = (string)$w; $dk = (string)$d; ?>
                                        <td>
                                            <input type="number"
                                                   name="prices[standing_seam][<?php echo esc_attr(self::size_key($w)); ?>][<?php echo esc_attr(self::size_key($d)); ?>]"
                                                   value="<?php echo esc_attr(isset($standing_seam_map[$wk][$dk]) ? $standing_seam_map[$wk][$dk] : 0); ?>"
                                                   min="0" step="100" data-round="100"
                                                   style="width:55px; text-align:right; font-size:12px;">
                                        </td>
                                    <?php endforeach; ?>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                    </div>
                <?php elseif ($active_tab === 'sectional_gates'): ?>
                    <h3>Ceny bram segmentowych netto (zl)</h3>
                    <p class="description">Dokladne wymiary w milimetrach. Puste pole oznacza niedostepna kombinacje. Cena zawiera naped CAME i 2 piloty.</p>
                    <div style="overflow-x:auto;">
                    <table class="widefat fixed striped" style="margin-top:10px;">
                        <thead>
                            <tr>
                                <th style="width:70px; position:sticky; left:0; background:#fff; z-index:2;">Wys.\Szer.</th>
                                <?php foreach (self::$sectional_widths as $width_mm): ?>
                                    <th style="text-align:center; min-width:62px;"><?php echo esc_html($width_mm); ?></th>
                                <?php endforeach; ?>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach (self::$sectional_heights as $height_mm): ?>
                                <tr>
                                    <th style="position:sticky; left:0; background:#fff; z-index:1;"><?php echo esc_html($height_mm); ?></th>
                                    <?php foreach (self::$sectional_widths as $width_mm): ?>
                                        <?php $sectional_value = isset($sectional_gate_map[$height_mm][$width_mm]) && $sectional_gate_map[$height_mm][$width_mm] > 0 ? $sectional_gate_map[$height_mm][$width_mm] : ''; ?>
                                        <td>
                                            <input type="number"
                                                   name="sectional_prices[<?php echo esc_attr($height_mm); ?>][<?php echo esc_attr($width_mm); ?>]"
                                                   value="<?php echo esc_attr($sectional_value); ?>"
                                                   placeholder="---" min="0" step="5" data-round="5"
                                                   style="width:60px; text-align:right; font-size:12px;">
                                        </td>
                                    <?php endforeach; ?>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                    </div>
                <?php elseif ($active_tab === 'addons'): ?>
                    <h3>Ceny dodatkow</h3>
                    <p class="description">Zmiana cen dodatkow. Wartosci ujemne = znizka. Ceny w PLN.</p>
                    <table class="widefat striped" style="margin-top:10px; max-width:700px;">
                        <thead>
                            <tr>
                                <th style="width:60%;">Dodatek</th>
                                <th style="width:40%;">Cena (zl)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($addon_labels as $key => $label): ?>
                                <tr>
                                    <td><?php echo esc_html($label); ?></td>
                                    <td>
                                        <input type="number"
                                               name="addons[<?php echo esc_attr($key); ?>]"
                                               value="<?php echo esc_attr($addons[$key]); ?>"
                                               step="1" data-round="1"
                                               style="width:100px; text-align:right;">
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                <?php endif; ?>

                <div style="margin-top:12px; padding:10px; background:#f9f9f9; border:1px solid #ddd; border-radius:4px;">
                    <div style="display:flex; flex-wrap:wrap; align-items:center; gap:8px; margin-bottom:10px;">
                        <a href="<?php echo esc_url($export_url); ?>" class="button">Eksport CSV</a>
                        <input type="file" name="configurator_prices_csv" accept=".csv,text/csv" style="max-width:260px;">
                        <button type="submit" name="configurator_import_prices" value="1" class="button" onclick="return confirm('Zaimportowac CSV i nadpisac aktywna zakladke cennika?');">Import CSV</button>
                        <span class="description">CSV otworzysz i zapiszesz w Excelu. Import dotyczy aktywnej zakladki.</span>
                    </div>

                    <label style="display:flex; align-items:center; gap:8px; cursor:pointer; margin-bottom:8px;">
                        <input type="checkbox" name="configurator_show_price" value="1" <?php checked(get_option(self::OPTION_SHOW_PRICE, false), 1); ?>>
                        <strong>Pokazuj cene na frontendzie</strong>
                    </label>

                    <label style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
                        <strong>Jezyk PDF</strong>
                        <select name="configurator_pdf_language">
                            <option value="pl" <?php selected($pdf_language, 'pl'); ?>>Polski</option>
                            <option value="cs" <?php selected($pdf_language, 'cs'); ?>>Czeski</option>
                        </select>
                    </label>

                    <label style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
                        <strong>Kurs PDF CZK</strong>
                        <span>1 PLN =</span>
                        <input type="number"
                               name="configurator_pdf_czk_exchange_rate"
                               value="<?php echo esc_attr($pdf_czk_exchange_rate); ?>"
                               min="0.01"
                               step="0.01"
                               style="width:90px; text-align:right;">
                        <span>CZK</span>
                    </label>

                    <div style="display:inline-flex; align-items:center; gap:8px;">
                        <input type="number" id="cfg-price-percent" value="10" min="1" max="100" step="1" style="width:60px; text-align:right;">
                        <span>%</span>
                        <button type="button" class="button" onclick="cfgAdjustPrices(1)">Podnies ceny</button>
                        <button type="button" class="button" onclick="cfgAdjustPrices(-1)">Obniz ceny</button>
                    </div>
                </div>

                <p style="margin-top:15px;">
                    <?php submit_button('Zapisz ceny', 'primary', 'configurator_save_prices', false); ?>
                    <button type="submit" name="configurator_reset_prices" value="1" class="button button-link-delete" onclick="return confirm('Przywrocic domyslne ceny?');">Przywroc domyslne</button>
                </p>
            </form>

            <script>
            function cfgAdjustPrices(direction) {
                var pct = parseFloat(document.getElementById('cfg-price-percent').value) || 0;
                if (pct <= 0) return;
                var factor = direction === 1 ? (1 + pct / 100) : (1 - pct / 100);
                var inputs = document.querySelectorAll('table input[type="number"]');
                for (var i = 0; i < inputs.length; i++) {
                    var val = parseInt(inputs[i].value, 10) || 0;
                    var rounding = parseInt(inputs[i].getAttribute('data-round') || inputs[i].step || '100', 10) || 1;
                    inputs[i].value = Math.round((val * factor) / rounding) * rounding;
                }
            }
            </script>
        </div>
        <?php
    }

    // --- End Price Editor ---

    private static function layout_css() {
        return '
.configurator-plugin-shell {
  position: relative;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px;
  box-sizing: border-box;
}

.configurator-plugin-shell #configurator-plugin-root {
  width: 100%;
  min-height: 100vh;
}

body.configurator-plugin-active {
  overflow-x: hidden;
}

@media (max-width: 767px) {
  .configurator-plugin-shell .configurator-viewer-sticky {
    position: relative !important;
    top: 0 !important;
    height: auto !important;
    max-height: none !important;
    will-change: transform;
    z-index: 20;
  }

  .configurator-plugin-shell .configurator-canvas-area {
    height: 30vh !important;
    min-height: 30vh !important;
    max-height: 30vh !important;
  }
}

@media (min-width: 768px) {
  .configurator-plugin-shell {
    width: 100vw;
    max-width: 100vw;
    margin-left: calc(50% - 50vw);
    margin-right: calc(50% - 50vw);
    padding: 0;
  }

  .configurator-plugin-shell,
  .configurator-plugin-shell #configurator-plugin-root {
    overflow: visible !important;
    contain: none !important;
  }

  .configurator-plugin-shell .configurator-viewer-sticky {
    position: relative !important;
    top: 0 !important;
    align-self: flex-start;
    will-change: transform;
  }
}

/* Raise configurator only on selected page */
';
    }

    private static function layout_js() {
        return '
(function () {
  var shell = document.querySelector(".configurator-plugin-shell");
  if (!shell) return;
  document.body.classList.add("configurator-plugin-active");

  function installViewerFollower() {
    var viewer = shell.querySelector(".configurator-viewer-sticky");
    if (!viewer || viewer.dataset.wpFollowerReady === "1") return !!viewer;

    viewer.dataset.wpFollowerReady = "1";
    var container = viewer.parentElement;
    var framePending = false;

    function updateViewerPosition() {
      framePending = false;

      var containerRect = container.getBoundingClientRect();
      var containerTop = containerRect.top + window.scrollY;
      var viewerHeight = viewer.offsetHeight;
      var adminOffset = document.body.classList.contains("admin-bar")
        ? (window.innerWidth >= 783 ? 32 : 46)
        : 0;
      var maxTravel = Math.max(0, containerRect.height - viewerHeight);
      var travel = Math.min(
        maxTravel,
        Math.max(0, window.scrollY + adminOffset - containerTop)
      );

      viewer.style.setProperty("position", "relative", "important");
      viewer.style.setProperty("top", "0", "important");
      viewer.style.setProperty("will-change", "transform");
      viewer.style.setProperty("transform", "translate3d(0, " + travel + "px, 0)");
    }

    function scheduleViewerUpdate() {
      if (framePending) return;
      framePending = true;
      window.requestAnimationFrame(updateViewerPosition);
    }

    window.addEventListener("scroll", scheduleViewerUpdate, { passive: true });
    window.addEventListener("resize", scheduleViewerUpdate, { passive: true });
    if (typeof ResizeObserver !== "undefined") {
      var viewerResizeObserver = new ResizeObserver(scheduleViewerUpdate);
      viewerResizeObserver.observe(container);
      viewerResizeObserver.observe(viewer);
    }
    scheduleViewerUpdate();
    return true;
  }

  if (!installViewerFollower()) {
    var viewerMountObserver = new MutationObserver(function () {
      if (installViewerFollower()) viewerMountObserver.disconnect();
    });
    viewerMountObserver.observe(shell, { childList: true, subtree: true });
  }

  var titleSelectors = [
    ".entry-title",
    ".post-title",
    ".page-title",
    ".wp-block-post-title",
    ".elementor-heading-title"
  ];
  titleSelectors.forEach(function (selector) {
    document.querySelectorAll(selector).forEach(function (el) {
      el.style.display = "none";
    });
  });
})();
';
    }
}

ConfiguratorPlugin::init();

