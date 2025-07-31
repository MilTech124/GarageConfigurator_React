<?php
/**
 * Kod do dodania do functions.php w WordPress
 * Obsługa wysyłania maili z konfiguratora garażu
 */

// Dodanie custom endpoint do WordPress REST API
add_action('rest_api_init', function () {
    register_rest_route('newgarage/v1', '/send-email', array(
        'methods' => 'POST',
        'callback' => 'newgarage_send_email',
        'permission_callback' => '__return_true', // Można dodać własną walidację
    ));
});

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
    $to_email = get_option('newgarage_email', 'biuro@newgarage.pl');
    
    // Wysłanie emaila
    $sent = wp_mail($to_email, $subject, $message, $headers);
    
    if ($sent) {
        // Opcjonalnie: zapis do bazy danych
        newgarage_save_inquiry($contact, $garage_config, $price, $image_url);
        
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
            .row { display: flex; margin: 10px 0; }
            .label { font-weight: bold; min-width: 150px; }
            .value { flex: 1; }
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
                    <tr><th>User Agent:</th><td><?php echo esc_html($_SERVER['HTTP_USER_AGENT']); ?></td></tr>
                </table>
            </div>
        </div>
    </body>
    </html>
    <?php
    return ob_get_clean();
}

/**
 * Opcjonalne: Zapis zapytania do bazy danych
 */
function newgarage_save_inquiry($contact, $garage_config, $price, $image_url) {
    global $wpdb;
    
    $table_name = $wpdb->prefix . 'garage_inquiries';
    
    // Sprawdź czy tabela istnieje, jeśli nie - utwórz
    $charset_collate = $wpdb->get_charset_collate();
    $sql = "CREATE TABLE IF NOT EXISTS $table_name (
        id mediumint(9) NOT NULL AUTO_INCREMENT,
        name varchar(255) NOT NULL,
        email varchar(255) NOT NULL,
        phone varchar(50) NOT NULL,
        wojewodztwo varchar(100),
        address text,
        message text,
        garage_config longtext,
        price decimal(10,2),
        image_url varchar(500),
        created_at datetime DEFAULT CURRENT_TIMESTAMP,
        ip_address varchar(45),
        user_agent text,
        PRIMARY KEY (id)
    ) $charset_collate;";
    
    require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
    dbDelta($sql);
    
    // Wstaw dane
    $wpdb->insert(
        $table_name,
        array(
            'name' => $contact['name'],
            'email' => $contact['email'],
            'phone' => $contact['phone'],
            'wojewodztwo' => $contact['wojewodztwo'],
            'address' => $contact['address'],
            'message' => $contact['message'],
            'garage_config' => json_encode($garage_config),
            'price' => $price,
            'image_url' => $image_url,
            'ip_address' => $_SERVER['REMOTE_ADDR'],
            'user_agent' => $_SERVER['HTTP_USER_AGENT']
        ),
        array('%s', '%s', '%s', '%s', '%s', '%s', '%s', '%f', '%s', '%s', '%s')
    );
}

/**
 * Dodanie opcji konfiguracyjnych do WordPress
 */
add_action('admin_init', function() {
    register_setting('general', 'newgarage_email', array(
        'type' => 'string',
        'description' => 'Email do otrzymywania zapytań z konfiguratora',
        'sanitize_callback' => 'sanitize_email',
        'default' => 'biuro@newgarage.pl'
    ));
    
    add_settings_field(
        'newgarage_email',
        'Email konfiguratora garażu',
        function() {
            $value = get_option('newgarage_email', 'biuro@newgarage.pl');
            echo '<input type="email" name="newgarage_email" value="' . esc_attr($value) . '" class="regular-text" />';
            echo '<p class="description">Adres email, na który będą wysyłane zapytania z konfiguratora garażu.</p>';
        },
        'general'
    );
});

/**
 * Dodanie menu w panelu administracyjnym do przeglądania zapytań
 */
add_action('admin_menu', function() {
    add_menu_page(
        'Zapytania z konfiguratora',
        'Konfigurator',
        'manage_options',
        'garage-inquiries',
        'newgarage_admin_page',
        'dashicons-admin-home',
        30
    );
});

/**
 * Strona administracyjna do przeglądania zapytań
 */
function newgarage_admin_page() {
    global $wpdb;
    $table_name = $wpdb->prefix . 'garage_inquiries';
    
    // Pobranie zapytań z bazy
    $inquiries = $wpdb->get_results("SELECT * FROM $table_name ORDER BY created_at DESC LIMIT 50");
    
    echo '<div class="wrap">';
    echo '<h1>Zapytania z konfiguratora garażu</h1>';
    
    if (empty($inquiries)) {
        echo '<p>Brak zapytań.</p>';
    } else {
        echo '<table class="wp-list-table widefat fixed striped">';
        echo '<thead><tr>';
        echo '<th>Data</th><th>Imię</th><th>Email</th><th>Telefon</th><th>Województwo</th><th>Cena</th><th>Akcje</th>';
        echo '</tr></thead><tbody>';
        
        foreach ($inquiries as $inquiry) {
            echo '<tr>';
            echo '<td>' . esc_html($inquiry->created_at) . '</td>';
            echo '<td>' . esc_html($inquiry->name) . '</td>';
            echo '<td><a href="mailto:' . esc_attr($inquiry->email) . '">' . esc_html($inquiry->email) . '</a></td>';
            echo '<td><a href="tel:' . esc_attr($inquiry->phone) . '">' . esc_html($inquiry->phone) . '</a></td>';
            echo '<td>' . esc_html($inquiry->wojewodztwo) . '</td>';
            echo '<td>' . number_format($inquiry->price, 0, ',', ' ') . ' zł</td>';
            echo '<td><a href="?page=garage-inquiries&view=' . $inquiry->id . '">Szczegóły</a></td>';
            echo '</tr>';
        }
        
        echo '</tbody></table>';
    }
    
    // Szczegóły zapytania
    if (isset($_GET['view'])) {
        $inquiry_id = intval($_GET['view']);
        $inquiry = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table_name WHERE id = %d", $inquiry_id));
        
        if ($inquiry) {
            echo '<h2>Szczegóły zapytania #' . $inquiry->id . '</h2>';
            echo '<div style="background: white; padding: 20px; margin: 20px 0; border: 1px solid #ddd;">';
            
            $garage_config = json_decode($inquiry->garage_config, true);
            echo newgarage_prepare_email_template(
                array(
                    'name' => $inquiry->name,
                    'email' => $inquiry->email,
                    'phone' => $inquiry->phone,
                    'wojewodztwo' => $inquiry->wojewodztwo,
                    'address' => $inquiry->address,
                    'message' => $inquiry->message
                ),
                $garage_config,
                $inquiry->price,
                $inquiry->image_url
            );
            
            echo '</div>';
        }
    }
    
    echo '</div>';
}
?>
