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
    const SHORTCODE = 'configurator_plugin';
    const REST_NS = 'configurator/v1';

    public static function init() {
        add_shortcode(self::SHORTCODE, [__CLASS__, 'render_shortcode']);
        add_action('rest_api_init', [__CLASS__, 'register_rest_routes']);
        add_action('admin_init', [__CLASS__, 'register_settings']);
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
    }

    public static function render_shortcode() {
        self::enqueue_frontend_assets();
        return '<div class="configurator-plugin-shell"><div id="configurator-plugin-root"></div></div>';
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
                    null
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
            null,
            true
        );
        wp_script_add_data($script_handle, 'type', 'module');

        $config = [
            'restBaseUrl' => untrailingslashit(rest_url(self::REST_NS)),
            'inquiryEndpoint' => untrailingslashit(rest_url(self::REST_NS)) . '/inquiry',
            'uploadEndpoint' => untrailingslashit(rest_url(self::REST_NS)) . '/upload-image',
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

        $sent = wp_mail(
            $to_email,
            $subject,
            self::build_inquiry_email($name, $email, $phone, $postal_code, $city, $address, $message, $price, $image_url, $garage, $lang),
            $headers,
            $attachments
        );

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
                <tr><th align="left" style="background:#f5f5f5;"><?php echo esc_html($t['height']); ?></th><td><?php echo esc_html(self::garage_value($garage, 'height')); ?> <?php echo esc_html($t['cm']); ?></td></tr>
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
                        <?php echo esc_html($t['size']); ?>: <?php echo esc_html(self::garage_value($garage, 'gateWidth' . $i)); ?> <?php echo esc_html($t['m']); ?> x <?php echo esc_html(self::garage_value($garage, 'gateHeight' . $i)); ?> <?php echo esc_html($t['cm']); ?>,
                        <?php echo esc_html($t['position']); ?>: <?php echo esc_html(self::garage_value($garage, 'gatePositionValue' . $i)); ?> <?php echo esc_html($t['cm']); ?>
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
        $size = isset($door['size']) ? (string) $door['size'] : '-';
        $door_type = self::translate_config_value(isset($door['type']) ? (string) $door['type'] : '-', $lang);
        $color = self::translate_config_value(isset($door['color']) ? (string) $door['color'] : '-', $lang);
        $position = self::translate_config_value(isset($door['position']) ? (string) $door['position'] : '-', $lang);
        $position_value = isset($door['positionValue']) ? (string) $door['positionValue'] : '-';
        if ($lang === 'cs') {
            return esc_html(
                'Dvere ' . $idx .
                ': rozmer ' . $size .
                ', typ ' . $door_type .
                ', barva ' . $color .
                ', pozice ' . $position .
                ', vzdalenost ' . $position_value . ' cm'
            );
        }
        if ($lang === 'sl') {
            return esc_html(
                'Dvere ' . $idx .
                ': rozmer ' . $size .
                ', typ ' . $door_type .
                ', farba ' . $color .
                ', pozicia ' . $position .
                ', vzdialenost ' . $position_value . ' cm'
            );
        }
        if ($lang === 'hu') {
            return esc_html(
                'Ajto ' . $idx .
                ': meret ' . $size .
                ', tipus ' . $door_type .
                ', szin ' . $color .
                ', pozicio ' . $position .
                ', tavolsag ' . $position_value . ' cm'
            );
        }
        return esc_html(
            'Drzwi ' . $idx .
            ': rozmiar ' . $size .
            ', typ ' . $door_type .
            ', kolor ' . $color .
            ', pozycja ' . $position .
            ', odleglosc ' . $position_value . ' cm'
        );
    }
        private static function format_window_line($window, $idx, $lang = 'pl') {
        $size = isset($window['size']) ? (string) $window['size'] : '-';
        $position = self::translate_config_value(isset($window['position']) ? (string) $window['position'] : '-', $lang);
        $position_value = isset($window['positionValue']) ? (string) $window['positionValue'] : '-';
        if ($lang === 'cs') {
            return esc_html(
                'Okno ' . $idx .
                ': rozmer ' . $size .
                ', pozice ' . $position .
                ', vzdalenost ' . $position_value . ' cm'
            );
        }
        if ($lang === 'sl') {
            return esc_html(
                'Okno ' . $idx .
                ': rozmer ' . $size .
                ', pozicia ' . $position .
                ', vzdialenost ' . $position_value . ' cm'
            );
        }
        if ($lang === 'hu') {
            return esc_html(
                'Ablak ' . $idx .
                ': meret ' . $size .
                ', pozicio ' . $position .
                ', tavolsag ' . $position_value . ' cm'
            );
        }
        return esc_html(
            'Okno ' . $idx .
            ': rozmiar ' . $size .
            ', pozycja ' . $position .
            ', odleglosc ' . $position_value . ' cm'
        );
    }

    private static function translate_config_value($value, $lang = 'pl') {
        $source = is_scalar($value) ? (string) $value : '';
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
    private static function layout_css() {
        return '
.configurator-plugin-shell {
  position: relative;
  width: 100vw;
  max-width: 100vw;
  margin-left: calc(50% - 50vw);
  margin-right: calc(50% - 50vw);
}

.configurator-plugin-shell #configurator-plugin-root {
  width: 100%;
  min-height: 100vh;
}

body.configurator-plugin-active {
  overflow-x: hidden;
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

