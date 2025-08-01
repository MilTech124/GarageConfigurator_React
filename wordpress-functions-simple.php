<?php
/**
 * Kod do dodania do functions.php w WordPress
 * Obsługa wysyłania maili z konfiguratora garażu (bez zapisu do bazy danych)
 */

// Dodanie custom endpoint do WordPress REST API
add_action('rest_api_init', function () {
    register_rest_route('newgarage/v1', '/send-email', array(
        'methods' => 'POST',
        'callback' => 'newgarage_send_email',
        'permission_callback' => '__return_true',
    ));
    
    // Custom endpoint dla upload obrazów bez autoryzacji
    register_rest_route('newgarage/v1', '/upload-image', array(
        'methods' => 'POST',
        'callback' => 'newgarage_upload_image',
        'permission_callback' => '__return_true',
    ));
});

// Dodanie nagłówków CORS dla wszystkich WordPress REST API endpoints
add_action('rest_pre_serve_request', function() {
    // Pobierz origin z requestu
    $origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
    
    // Lista dozwolonych domen
    $allowed_origins = array(
        'http://localhost:5173',
        'http://localhost:3000',
        'http://localhost:8080',
        'https://newgarage.pl',
        'https://www.newgarage.pl'
    );
    
    // Sprawdź czy origin jest na liście dozwolonych
    if (in_array($origin, $allowed_origins)) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Access-Control-Allow-Credentials: true');
    } else {
        // Dla innych domen bez credentials
        header('Access-Control-Allow-Origin: *');
    }
    
    header('Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE, PATCH');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-WP-Nonce');
    header('Access-Control-Expose-Headers: X-WP-Total, X-WP-TotalPages');
    
    // Obsługa preflight requests
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit();
    }
}, 15);

// Dodatkowe nagłówki CORS dla wszystkich żądań (nie tylko REST API)
add_action('init', function() {
    // Pobierz origin z requestu
    $origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
    
    // Lista dozwolonych domen
    $allowed_origins = array(
        'http://localhost:5173',
        'http://localhost:3000',
        'http://localhost:8080',
        'https://newgarage.pl',
        'https://www.newgarage.pl'
    );
    
    // Sprawdź czy origin jest na liście dozwolonych
    if (in_array($origin, $allowed_origins)) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Access-Control-Allow-Credentials: true');
    }
    
    // Obsługa preflight requests dla wszystkich żądań
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        header('Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE, PATCH');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-WP-Nonce');
        http_response_code(200);
        exit();
    }
});

/**
 * Funkcja obsługująca upload obrazów z konfiguratora
 */
function newgarage_upload_image($request) {
    // Sprawdź czy plik został przesłany
    $files = $request->get_file_params();
    if (empty($files['file'])) {
        return new WP_Error('no_file', 'Nie przesłano pliku', array('status' => 400));
    }
    
    $file = $files['file'];
    
    // Walidacja typu pliku
    $allowed_types = array('image/jpeg', 'image/jpg', 'image/png', 'image/gif');
    if (!in_array($file['type'], $allowed_types)) {
        return new WP_Error('invalid_file_type', 'Nieprawidłowy typ pliku. Dozwolone: JPG, PNG, GIF', array('status' => 400));
    }
    
    // Walidacja rozmiaru pliku (max 5MB)
    $max_size = 5 * 1024 * 1024; // 5MB
    if ($file['size'] > $max_size) {
        return new WP_Error('file_too_large', 'Plik jest za duży. Maksymalny rozmiar: 5MB', array('status' => 400));
    }
    
    // Przygotowanie nazwy pliku
    $filename = 'garage-config-' . time() . '-' . sanitize_file_name($file['name']);
    
    // Upload pliku do WordPress
    $upload_overrides = array('test_form' => false);
    $movefile = wp_handle_upload($file, $upload_overrides);
    
    if ($movefile && !isset($movefile['error'])) {
        // Plik został przesłany pomyślnie
        $attachment = array(
            'guid' => $movefile['url'],
            'post_mime_type' => $file['type'],
            'post_title' => preg_replace('/\.[^.]+$/', '', $filename),
            'post_content' => '',
            'post_status' => 'inherit'
        );
        
        // Dodaj załącznik do biblioteki mediów
        $attach_id = wp_insert_attachment($attachment, $movefile['file']);
        
        if ($attach_id) {
            // Generuj metadane dla obrazu
            require_once(ABSPATH . 'wp-admin/includes/image.php');
            $attach_data = wp_generate_attachment_metadata($attach_id, $movefile['file']);
            wp_update_attachment_metadata($attach_id, $attach_data);
            
            return array(
                'success' => true,
                'message' => 'Obraz został przesłany pomyślnie',
                'id' => $attach_id,
                'url' => $movefile['url'],
                'guid' => array('rendered' => $movefile['url'])
            );
        }
    }
    
    return new WP_Error('upload_failed', 'Błąd podczas przesyłania pliku: ' . (isset($movefile['error']) ? $movefile['error'] : 'Nieznany błąd'), array('status' => 500));
}

/**
 * Funkcja obsługująca wysyłanie emaili z konfiguratora
 */
function newgarage_send_email($request) {
    // Pobranie danych z requestu
    $data = $request->get_json_params();
    
    // Walidacja podstawowych danych
    if (empty($data['contact']['name']) || empty($data['contact']['email']) || empty($data['contact']['phone'])) {
        return new WP_Error('missing_data', 'Brakuje wymaganych danych kontaktowych', array('status' => 400));
    }
    
    // Walidacja email
    if (!is_email($data['contact']['email'])) {
        return new WP_Error('invalid_email', 'Nieprawidłowy adres email', array('status' => 400));
    }
    
    // Przygotowanie danych do emaila
    $contact = $data['contact'];
    $garage_config = $data['garage_config'];
    $price = $data['price'];
    $image_url = $data['imageURL'];
    
    // Przygotowanie treści emaila
    $subject = 'Nowe zapytanie z konfiguratora garażu - ' . $contact['name'];
    
    // HTML template emaila
    $message = newgarage_prepare_email_template($contact, $garage_config, $price, $image_url);
    
    // Nagłówki emaila
    $headers = array(
        'Content-Type: text/html; charset=UTF-8',
        'From: Konfigurator <noreply@newgarage.pl>',
        'Reply-To: ' . $contact['email']
    );
    
    // Adres docelowy (można ustawić w opcjach WordPress)
    $to_email = get_option('newgarage_email', 'jaroslawmatusiak124@gmail.com');
    
    // Wysłanie emaila
    $sent = wp_mail($to_email, $subject, $message, $headers);
    
    if ($sent) {
        return array(
            'success' => true,
            'message' => 'Email został wysłany pomyślnie'
        );
    } else {
        return new WP_Error('email_failed', 'Błąd wysyłania emaila', array('status' => 500));
    }
}

/**
 * Przygotowanie szablonu emaila HTML
 */
function newgarage_prepare_email_template($contact, $garage_config, $price, $image_url) {
    ob_start();
    ?>
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 800px; margin: 0 auto; padding: 20px; }
            .header { background: #2c3e50; color: white; padding: 20px; text-align: center; }
            .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
            .section h3 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 5px; }
            .price { font-size: 24px; color: #e74c3c; font-weight: bold; text-align: center; padding: 15px; background: #f8f9fa; border-radius: 5px; }
            .image { text-align: center; margin: 20px 0; }
            .image img { max-width: 100%; height: auto; border: 1px solid #ddd; border-radius: 5px; }
            table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: #f2f2f2; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🏠 Nowe zapytanie z konfiguratora garażu</h1>
                <p>Otrzymano nowe zapytanie od klienta</p>
            </div>

            <!-- Dane kontaktowe -->
            <div class="section">
                <h3>📞 Dane kontaktowe</h3>
                <table>
                    <tr><th>Imię i nazwisko:</th><td><?php echo esc_html($contact['name']); ?></td></tr>
                    <tr><th>Email:</th><td><a href="mailto:<?php echo esc_attr($contact['email']); ?>"><?php echo esc_html($contact['email']); ?></a></td></tr>
                    <tr><th>Telefon:</th><td><a href="tel:<?php echo esc_attr($contact['phone']); ?>"><?php echo esc_html($contact['phone']); ?></a></td></tr>
                    <tr><th>Województwo:</th><td><?php echo esc_html($contact['wojewodztwo']); ?></td></tr>
                    <tr><th>Adres dostawy:</th><td><?php echo esc_html($contact['address']); ?></td></tr>
                    <?php if (!empty($contact['message'])): ?>
                    <tr><th>Wiadomość:</th><td><?php echo nl2br(esc_html($contact['message'])); ?></td></tr>
                    <?php endif; ?>
                </table>
            </div>

            <!-- Cena -->
            <div class="price">
                💰 Cena z transportem: <?php echo number_format($price, 0, ',', ' '); ?> zł
            </div>

            <!-- Zdjęcie garażu -->
            <?php if (!empty($image_url)): ?>
            <div class="image">
                <h3>📸 Wizualizacja garażu</h3>
                <img src="<?php echo esc_url($image_url); ?>" alt="Wizualizacja garażu" />
            </div>
            <?php endif; ?>

            <!-- Konfiguracja garażu -->
            <div class="section">
                <h3>🏗️ Konfiguracja garażu</h3>
                
                <h4>Podstawowe parametry:</h4>
                <table>
                    <tr><th>Szerokość:</th><td><?php echo esc_html($garage_config['width']); ?> m</td></tr>
                    <tr><th>Głębokość:</th><td><?php echo esc_html($garage_config['depth']); ?> m</td></tr>
                    <tr><th>Wysokość:</th><td><?php echo esc_html($garage_config['height']); ?> cm</td></tr>
                    <tr><th>Kolor:</th><td><?php echo esc_html($garage_config['color']); ?></td></tr>
                    <tr><th>Tłoczenie:</th><td><?php echo esc_html($garage_config['emboss']); ?></td></tr>
                    <tr><th>Kierunek:</th><td><?php echo esc_html($garage_config['direction']); ?></td></tr>
                </table>

                <h4>Dach:</h4>
                <table>
                    <tr><th>Typ dachu:</th><td><?php echo esc_html($garage_config['roof']); ?></td></tr>
                    <tr><th>Kolor dachu:</th><td><?php echo esc_html($garage_config['roofColor']); ?></td></tr>
                    <tr><th>Rodzaj pokrycia:</th><td><?php echo esc_html($garage_config['roofType']); ?></td></tr>
                </table>

                <?php if ($garage_config['gateCount'] > 0): ?>
                <h4>Bramy:</h4>
                <table>
                    <tr><th>Liczba bram:</th><td><?php echo esc_html($garage_config['gateCount']); ?></td></tr>
                    <?php for ($i = 1; $i <= min(3, $garage_config['gateCount']); $i++): ?>
                        <?php if (!empty($garage_config["gateType$i"])): ?>
                        <tr>
                            <th>Brama <?php echo $i; ?>:</th>
                            <td>
                                <?php echo esc_html($garage_config["gateType$i"]); ?> - 
                                <?php echo esc_html($garage_config["gateColor$i"]); ?> - 
                                <?php echo esc_html($garage_config["gateWidth$i"]); ?>m x <?php echo esc_html($garage_config["gateHeight$i"]); ?>cm
                            </td>
                        </tr>
                        <?php endif; ?>
                    <?php endfor; ?>
                </table>
                <?php endif; ?>

                <?php if ($garage_config['doorCount'] > 0): ?>
                <h4>Drzwi:</h4>
                <table>
                    <tr><th>Liczba drzwi:</th><td><?php echo esc_html($garage_config['doorCount']); ?></td></tr>
                    <tr><th>Szczegóły drzwi:</th><td><?php echo nl2br(esc_html($garage_config['doors'])); ?></td></tr>
                </table>
                <?php endif; ?>

                <?php if ($garage_config['windowCount'] > 0): ?>
                <h4>Okna:</h4>
                <table>
                    <tr><th>Liczba okien:</th><td><?php echo esc_html($garage_config['windowCount']); ?></td></tr>
                    <tr><th>Szczegóły okien:</th><td><?php echo nl2br(esc_html($garage_config['windows'])); ?></td></tr>
                </table>
                <?php endif; ?>

                <?php if ($garage_config['carport']): ?>
                <h4>Carport:</h4>
                <table>
                    <tr><th>Szerokość carportu:</th><td><?php echo esc_html($garage_config['carportWidth']); ?> m</td></tr>
                    <tr><th>Strona carportu:</th><td><?php echo esc_html($garage_config['carportSide']); ?></td></tr>
                    <tr><th>Typ carportu:</th><td><?php echo esc_html($garage_config['carportType']); ?></td></tr>
                    <?php if (!empty($garage_config['carportSides'])): ?>
                    <tr><th>Ściany carportu:</th><td><?php echo nl2br(esc_html($garage_config['carportSides'])); ?></td></tr>
                    <?php endif; ?>
                    <?php if (!empty($garage_config['carportSides2'])): ?>
                    <tr><th>Ściany carportu 2:</th><td><?php echo nl2br(esc_html($garage_config['carportSides2'])); ?></td></tr>
                    <?php endif; ?>
                </table>
                <?php endif; ?>

                <h4>Dodatki:</h4>
                <table>
                    <tr><th>Rynny:</th><td><?php echo $garage_config['gutter'] ? 'Tak' : 'Nie'; ?></td></tr>
                    <tr><th>Automatyka:</th><td><?php echo $garage_config['automatic'] ? 'Tak (' . $garage_config['countAutomatic'] . ' szt.)' : 'Nie'; ?></td></tr>
                    <tr><th>Filc:</th><td><?php echo $garage_config['filc'] ? 'Tak' : 'Nie'; ?></td></tr>
                    <tr><th>Transport:</th><td><?php echo $garage_config['transport'] ? 'Tak' : 'Nie'; ?></td></tr>
                </table>
            </div>

            <div class="section">
                <h3>📅 Informacje systemowe</h3>
                <table>
                    <tr><th>Data zapytania:</th><td><?php echo date('d.m.Y H:i:s'); ?></td></tr>
                    <tr><th>IP klienta:</th><td><?php echo $_SERVER['REMOTE_ADDR']; ?></td></tr>                  
                </table>
            </div>
        </div>
    </body>
    </html>
    <?php
    return ob_get_clean();
}

/**
 * Dodanie opcji konfiguracyjnych do WordPress
 */
add_action('admin_init', function() {
    register_setting('general', 'newgarage_email', array(
        'type' => 'string',
        'description' => 'Email do otrzymywania zapytań z konfiguratora',
        'sanitize_callback' => 'sanitize_email',
        'default' => 'jaroslawmatusiak124@gmail.com'
    ));
    
    add_settings_field(
        'newgarage_email',
        'Email konfiguratora garażu',
        function() {
            $value = get_option('newgarage_email', 'jaroslawmatusiak124@gmail.com');
            echo '<input type="email" name="newgarage_email" value="' . esc_attr($value) . '" class="regular-text" />';
            echo '<p class="description">Adres email, na który będą wysyłane zapytania z konfiguratora garażu.</p>';
        },
        'general'
    );
});
?>
