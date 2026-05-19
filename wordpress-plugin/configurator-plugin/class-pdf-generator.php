<?php
/**
 * PDF Order Document Generator for Garage Configurator.
 *
 * Generates a professional PDF with order details and 2D schematic drawings.
 * Uses TCPDF for rendering.
 */

if (!defined('ABSPATH')) {
    exit;
}

// Configure TCPDF paths before loading the library.
$tcpdf_dir = plugin_dir_path(__FILE__) . 'lib/tcpdf/';
if (!defined('K_PATH_MAIN')) {
    define('K_PATH_MAIN', $tcpdf_dir);
}
if (!defined('K_PATH_URL')) {
    define('K_PATH_URL', plugin_dir_url(__FILE__) . 'lib/tcpdf/');
}
if (!defined('K_PATH_FONTS')) {
    define('K_PATH_FONTS', $tcpdf_dir . 'fonts/');
}
if (!defined('K_PATH_CACHE')) {
    define('K_PATH_CACHE', $tcpdf_dir . 'cache/');
}
if (!defined('K_PATH_IMAGES')) {
    define('K_PATH_IMAGES', $tcpdf_dir . 'images/');
}
// Disable TCPDF default theme / logo.
if (!defined('K_BLANK_IMAGE')) {
    define('K_BLANK_IMAGE', $tcpdf_dir . 'images/_blank.png');
}

require_once $tcpdf_dir . 'tcpdf.php';

// Custom TCPDF subclass that throws exceptions instead of die() on errors.
class Configurator_TCPDF extends TCPDF {
    public function Error($msg) {
        throw new \RuntimeException('TCPDF Error: ' . $msg);
    }
}

class Configurator_PDF_Generator {

    // Roof angles in degrees — configurable.
    const SINGLE_PITCH_ANGLE = 5;
    const DUAL_PITCH_ANGLE   = 20;
    const REAR_SLOPE_BASE_RISE_CM = 23;
    const REAR_SLOPE_BASE_LENGTH_M = 5;
    const REAR_SLOPE_EXTRA_RISE_CM_PER_METER = 5;
    const FRONT_SLOPE_BASE_RISE_CM = 23;
    const FRONT_SLOPE_BASE_LENGTH_M = 5;
    const FRONT_SLOPE_EXTRA_RISE_CM_PER_METER = 5;

    // Colors [R, G, B].
    const COLOR_WALL     = [50, 50, 50];
    const COLOR_ROOF     = [150, 50, 50];
    const COLOR_GATE     = [70, 100, 180];
    const COLOR_DOOR     = [70, 160, 70];
    const COLOR_WINDOW   = [200, 180, 60];
    const COLOR_DIM      = [0, 0, 0];
    const COLOR_FILL     = [240, 240, 245];
    const COLOR_ROOF_FILL = [245, 235, 235];

    const LW_WALL     = 0.5;
    const LW_OPENING  = 0.4;
    const LW_DIM      = 0.25;

    private $pdf;
    private $garage;
    private $contact;
    private $price;
    private $image_url;
    private $lang;

    // Normalized dimensions in cm.
    private $width_cm;
    private $depth_cm;
    private $height_cm;

    // Parsed elements.
    private $doors   = [];
    private $windows = [];

    // Roof geometry (populated by calculate_roof_geometry).
    private $roof_type;      // 'single' or 'dual'
    private $roof_rise_cm;   // height added by roof at its peak
    private $roof_direction; // 'front-back' | 'left-right' | 'front-back-dual' | 'left-right-dual'

    // Page layout constants (A4 landscape, mm).
    const PAGE_W = 297;
    const PAGE_H = 210;
    const MARGIN = 12;

    // Translations for PDF text.
    private static function translations($lang = 'pl') {
        $t = [
            'pl' => [
                'title'          => 'ZAPYTANIE OFERTOWE',
                'date'           => 'Data',
                'contact'        => 'Dane kontaktowe',
                'full_name'      => 'Imię i nazwisko',
                'email'          => 'Email',
                'phone'          => 'Telefon',
                'postal_code'    => 'Kod pocztowy',
                'city'           => 'Miasto',
                'address'        => 'Adres dostawy',
                'message'        => 'Wiadomość',
                'config'         => 'Konfiguracja garażu',
                'basic'          => 'Parametry podstawowe',
                'width'          => 'Szerokość',
                'depth'          => 'Głębokość',
                'height'         => 'Wysokość',
                'color'          => 'Kolor',
                'emboss'         => 'Tłoczenie',
                'direction'      => 'Kierunek tłoczenia',
                'roof'           => 'Dach',
                'roof_slope'     => 'Typ spadu',
                'roof_color'     => 'Kolor dachu',
                'roof_type'      => 'Rodzaj pokrycia',
                'gates'          => 'Bramy',
                'gate_count'     => 'Liczba bram',
                'gate'           => 'Brama',
                'type'           => 'Typ',
                'size'           => 'Rozmiar',
                'position'       => 'Pozycja',
                'doors_section'  => 'Drzwi',
                'door_count'     => 'Liczba drzwi',
                'details'        => 'Szczegóły',
                'windows_section'=> 'Okna',
                'window_count'   => 'Liczba okien',
                'carport'        => 'Wiata',
                'side'           => 'Strona',
                'addons'         => 'Dodatki',
                'gutter'         => 'Rynny',
                'automation'     => 'Automatyka',
                'filc'           => 'Filc antykondensacyjny',
                'transport'      => 'Transport',
                'price'          => 'Cena',
                'drawings'       => 'RYSUNKI TECHNICZNE',
                'view_front'     => 'WIDOK PRZÓD',
                'view_back'      => 'WIDOK TYŁ',
                'view_left'      => 'WIDOK LEWO',
                'view_right'     => 'WIDOK PRAWO',
                'view_top'       => 'WIDOK Z GÓRY',
                'yes'            => 'Tak',
                'no'             => 'Nie',
                'pcs'            => ' szt.',
                'm'              => ' m',
                'cm'             => ' cm',
                'from_left'      => 'od lewej',
                'from_front'     => 'od przodu',
            ],
        ];
        return isset($t[$lang]) ? $t[$lang] : $t['pl'];
    }

    public function __construct($garage, $contact, $price, $image_url, $lang = 'pl') {
        $this->garage   = is_array($garage) ? $garage : [];
        $this->contact  = is_array($contact) ? $contact : [];
        $this->price    = $price;
        $this->image_url = $image_url;
        $this->lang     = in_array($lang, ['pl','cs','sl','hu'], true) ? $lang : 'pl';

        // Normalize dimensions to cm.
        $this->width_cm  = (float) $this->gv('width') * 100;
        $this->depth_cm  = (float) $this->gv('depth') * 100;
        $this->height_cm = (float) $this->gv('height');

        // Parse doors and windows.
        $this->doors   = $this->parse_items($this->gv('doors'));
        $this->windows = $this->parse_items($this->gv('windows'));

        // Calculate roof geometry.
        $this->calculate_roof_geometry();

        // Setup TCPDF.
        $this->pdf = new Configurator_TCPDF('L', 'mm', 'A4', true, 'UTF-8', false);
        $this->pdf->SetCreator('Configurator Plugin');
        $this->pdf->SetAuthor('NewGarage');
        $this->pdf->SetTitle('Zapytanie ofertowe - garaż');
        $this->pdf->setPrintHeader(false);
        $this->pdf->setPrintFooter(false);
        $this->pdf->SetMargins(self::MARGIN, self::MARGIN, self::MARGIN);
        $this->pdf->SetAutoPageBreak(false);
        $this->pdf->SetFont('dejavusans', '', 9);
    }

    /**
     * Generate the PDF and return the file path.
     */
    public function generate() {
        $this->draw_page1();
        $this->draw_page2();

        $upload = wp_upload_dir();
        $upload_path = isset($upload['path']) ? $upload['path'] : sys_get_temp_dir();

        // Ensure directory exists and is writable.
        if (!is_dir($upload_path)) {
            wp_mkdir_p($upload_path);
        }

        $tmp = wp_tempnam($upload_path, 'cfg_order_');
        if (!$tmp) {
            $tmp = tempnam(sys_get_temp_dir(), 'cfg_order_');
        }
        // Ensure .pdf extension.
        $pdf_path = preg_replace('/\.\w+$/', '.pdf', $tmp);
        if ($pdf_path !== $tmp && file_exists($tmp)) {
            rename($tmp, $pdf_path);
        }

        $this->pdf->Output($pdf_path, 'F');

        return $pdf_path;
    }

    // =====================================================================
    // Page 1: Order Summary
    // =====================================================================

    private function draw_page1() {
        $this->pdf->AddPage('L');
        $t = self::translations($this->lang);
        $p = $this->pdf;
        $x0 = self::MARGIN;
        $y = self::MARGIN;

        // --- Header ---
        $p->SetFont('dejavusans', 'B', 18);
        $p->SetXY($x0, $y);
        $p->Cell(0, 10, $t['title'], 0, 1, 'C');
        $y += 10;

        $p->SetFont('dejavusans', '', 9);
        $p->SetXY($x0, $y);
        $p->Cell(0, 6, $t['date'] . ': ' . date('d.m.Y H:i'), 0, 1, 'C');
        $y += 10;

        // Helper: section header.
        $section = function($title, $yy) use ($p, $x0) {
            $p->SetFont('dejavusans', 'B', 11);
            $p->SetFillColor(31, 41, 55);
            $p->SetTextColor(255, 255, 255);
            $p->SetXY($x0, $yy);
            $p->Cell(self::PAGE_W - 2 * self::MARGIN, 7, '  ' . $title, 0, 1, 'L', true);
            $p->SetTextColor(0, 0, 0);
            return $yy + 7;
        };

        // Helper: table row.
        $row = function($label, $value, $yy, $col_w = 60) use ($p, $x0) {
            $p->SetFont('dejavusans', 'B', 8);
            $p->SetFillColor(245, 245, 245);
            $p->SetXY($x0, $yy);
            $p->Cell($col_w, 5.5, '  ' . $label, 'B', 0, 'L', true);
            $p->SetFont('dejavusans', '', 8);
            $p->SetXY($x0 + $col_w, $yy);
            $p->Cell(self::PAGE_W - 2 * self::MARGIN - $col_w, 5.5, '  ' . $value, 'B', 1, 'L');
            return $yy + 5.5;
        };

        // --- Contact Info ---
        $y = $section($t['contact'], $y);
        $y = $row($t['full_name'],   $this->cv('name'),        $y);
        $y = $row($t['email'],       $this->cv('email'),       $y);
        $y = $row($t['phone'],       $this->cv('phone'),       $y);
        $y = $row($t['postal_code'], $this->cv('postal_code'), $y);
        $y = $row($t['city'],        $this->cv('city'),        $y);
        $y = $row($t['address'],     $this->cv('address'),     $y);
        $y = $row($t['message'],     $this->cv('message'),     $y);
        $y += 3;

        // --- Garage Config ---
        $y = $section($t['config'], $y);
        $y = $row($t['width'],      $this->gv('width') . $t['m'],   $y);
        $y = $row($t['depth'],      $this->gv('depth') . $t['m'],   $y);
        $y = $row($t['height'],     $this->gv('height') . $t['cm'],  $y);
        $y = $row($t['color'],      $this->gv('color'),              $y);
        $y = $row($t['emboss'],     $this->gv('emboss'),             $y);
        $y = $row($t['direction'],  $this->gv('direction'),          $y);

        // Roof
        $y = $row($t['roof_slope'], $this->gv('roof'),               $y);
        $y = $row($t['roof_color'], $this->gv('roofColor'),           $y);
        $y = $row($t['roof_type'],  $this->gv('roofType'),            $y);
        $y += 3;

        // --- Gates ---
        $gate_count = (int) $this->gv('gateCount', 0);
        $y = $section($t['gates'] . ' (' . $gate_count . ')', $y);
        for ($i = 1; $i <= min(3, $gate_count); $i++) {
            $gt = $this->gv('gateType' . $i);
            if ($gt === '') continue;
            $desc = $t['type'] . ': ' . $gt
                . ', ' . $t['size'] . ': ' . $this->gv('gateWidth' . $i) . $t['m']
                . ' x ' . $this->gv('gateHeight' . $i) . $t['cm']
                . ', ' . $this->from_left_label() . ': ' . $this->gv('gatePositionValue' . $i) . $t['cm'];
            $y = $row($t['gate'] . ' ' . $i, $desc, $y);
        }
        $y += 3;

        // --- Doors ---
        $door_count = (int) $this->gv('doorCount', 0);
        if ($door_count > 0) {
            $y = $section($t['doors_section'] . ' (' . $door_count . ')', $y);
            foreach ($this->doors as $idx => $door) {
                $size = isset($door['size']) ? $door['size'] : '-';
                $pos  = isset($door['position']) ? $door['position'] : '-';
                $pv   = $this->position_value_text(isset($door['positionValue']) ? $door['positionValue'] : null);
                $y = $row($t['doors_section'] . ' ' . ($idx + 1),
                    $size . ', ' . $pos . ', ' . $this->opening_position_label($pos) . ': ' . $pv . $t['cm'], $y);
            }
            $y += 3;
        }

        // --- Windows ---
        $window_count = (int) $this->gv('windowCount', 0);
        if ($window_count > 0) {
            $y = $section($t['windows_section'] . ' (' . $window_count . ')', $y);
            foreach ($this->windows as $idx => $win) {
                $size = isset($win['size']) ? $win['size'] : '-';
                $pos  = isset($win['position']) ? $win['position'] : '-';
                $pv   = $this->position_value_text(isset($win['positionValue']) ? $win['positionValue'] : null);
                $y = $row($t['windows_section'] . ' ' . ($idx + 1),
                    $size . ', ' . $pos . ', ' . $this->opening_position_label($pos) . ': ' . $pv . $t['cm'], $y);
            }
            $y += 3;
        }

        // --- Addons ---
        $y = $section($t['addons'], $y);
        $y = $row($t['gutter'],     $this->yes_no($this->gv('gutter')),    $y);
        $y = $row($t['automation'],  $this->yes_no($this->gv('automatic'))
            . ($this->gv('automatic') ? ' (' . $this->gv('countAutomatic', 0) . $t['pcs'] . ')' : ''), $y);
        $y = $row($t['filc'],       $this->yes_no($this->gv('filc')),      $y);
        $y = $row($t['transport'],  $this->yes_no($this->gv('transport')), $y);
        $y += 3;

        // --- Price ---
        if (!empty($this->price)) {
            $p->SetFont('dejavusans', 'B', 12);
            $p->SetXY($x0, $y);
            $p->Cell(0, 8, $t['price'] . ': ' . $this->price . ' PLN', 0, 1, 'R');
            $y += 10;
        }

        // --- Screenshot image ---
        if (!empty($this->image_url)) {
            $img_path = $this->resolve_image_path($this->image_url);
            if ($img_path && file_exists($img_path)) {
                $max_w = 80;
                $max_h = 50;
                $p->Image($img_path, self::PAGE_W - self::MARGIN - $max_w, self::MARGIN + 18, $max_w, $max_h);
            }
        }
    }

    // =====================================================================
    // Page 2: Schematic 2D Views
    // =====================================================================

    private function draw_page2() {
        $this->pdf->AddPage('L');
        $t = self::translations($this->lang);
        $p = $this->pdf;

        // Title.
        $p->SetFont('dejavusans', 'B', 14);
        $p->SetXY(self::MARGIN, self::MARGIN);
        $p->Cell(0, 8, $t['drawings'], 0, 1, 'C');

        // Layout: 2 columns x 3 rows.
        $col_w = 130;
        $row_h = 58;
        $gap_x = 10;
        $gap_y = 6;
        $x0 = self::MARGIN + 4;
        $y0 = self::MARGIN + 12;

        $views = [
            ['fn' => 'draw_front_view', 'label' => $t['view_front']],
            ['fn' => 'draw_back_view',  'label' => $t['view_back']],
            ['fn' => 'draw_left_view',  'label' => $t['view_left']],
            ['fn' => 'draw_right_view', 'label' => $t['view_right']],
        ];

        for ($i = 0; $i < 4; $i++) {
            $col = $i % 2;
            $row = (int) floor($i / 2);
            $x = $x0 + $col * ($col_w + $gap_x);
            $y = $y0 + $row * ($row_h + $gap_y);
            $this->draw_view_frame($x, $y, $col_w, $row_h, $views[$i]['label']);
            $this->{$views[$i]['fn']}($x, $y, $col_w, $row_h);
        }

        // Top view — centered below.
        $top_x = $x0 + ($col_w + $gap_x) / 2;
        $top_y = $y0 + 2 * ($row_h + $gap_y);
        $this->draw_view_frame($top_x, $top_y, $col_w, $row_h - 5, $t['view_top']);
        $this->draw_top_view($top_x, $top_y, $col_w, $row_h - 5);
    }

    /**
     * Draw a labeled frame for a view.
     */
    private function draw_view_frame($x, $y, $w, $h, $label) {
        $p = $this->pdf;
        $p->SetFont('dejavusans', 'B', 7);
        $p->SetTextColor(80, 80, 80);
        $p->SetXY($x, $y);
        $p->Cell($w, 5, $label, 0, 0, 'C');
        $p->SetTextColor(0, 0, 0);

        // Thin border.
        $p->SetDrawColor(200, 200, 200);
        $p->SetLineWidth(0.2);
        $p->Rect($x, $y + 5, $w, $h - 5);
        $p->SetDrawColor(0, 0, 0);
    }

    /**
     * Calculate scale factor to fit real dimensions (cm) into drawing area (mm).
     */
    private function calc_scale($area_w_mm, $area_h_mm, $real_w_cm, $real_h_cm) {
        $margin_mm = 14; // space for dimension lines.
        $aw = $area_w_mm - $margin_mm;
        $ah = $area_h_mm - $margin_mm;
        $rw = $real_w_cm / 10; // cm -> mm (1:1 scale).
        $rh = $real_h_cm / 10;
        if ($rw <= 0 || $rh <= 0) return 1;
        return min($aw / $rw, $ah / $rh);
    }

    /**
     * Get the height a wall presents in a given view direction.
     * @param string $wall 'front'|'back'|'left'|'right'
     */
    private function wall_height($wall) {
        $h = $this->height_cm;
        $rise = $this->roof_rise_cm;
        $roof = $this->gv('roof');

        if ($this->roof_type === 'single') {
            // Determine which wall is high/low.
            $high_wall = $this->single_pitch_high_wall($roof);
            $low_wall  = $this->single_pitch_low_wall($roof);
            if ($wall === $high_wall) {
                return $h + $rise;
            }
            if ($wall === $low_wall) {
                return $h;
            }
            // Side walls: average height (the slope runs across them).
            return $h + $rise / 2;
        }

        // Dual pitch: all walls are the same base height.
        return $h;
    }

    /**
     * For single pitch, return the high wall direction.
     */
    private function single_pitch_high_wall($roof) {
        $map = [
            'spad tyl'         => 'front',
            'spad tył'         => 'front',
            'spad przod'       => 'back',
            'spad przód'       => 'back',
            'spad w lewo'      => 'right',
            'spad w prawo'     => 'left',
        ];
        return isset($map[$roof]) ? $map[$roof] : 'front';
    }

    private function single_pitch_low_wall($roof) {
        $map = [
            'spad tyl'         => 'back',
            'spad tył'         => 'back',
            'spad przod'       => 'front',
            'spad przód'       => 'front',
            'spad w lewo'      => 'left',
            'spad w prawo'     => 'right',
        ];
        return isset($map[$roof]) ? $map[$roof] : 'back';
    }

    private function single_pitch_profile_high_wall($roof) {
        $map = [
            'spad tyl'         => 'back',
            'spad tył'         => 'back',
            'spad przod'       => 'front',
            'spad przód'       => 'front',
            'spad w lewo'      => 'right',
            'spad w prawo'     => 'left',
        ];
        return isset($map[$roof]) ? $map[$roof] : $this->single_pitch_high_wall($roof);
    }

    // -----------------------------------------------------------------
    // Front View
    // -----------------------------------------------------------------

    private function draw_front_view($x, $y, $w, $h) {
        $p = $this->pdf;
        $roof = $this->gv('roof');
        $drawing_top = $y + 8;
        $drawing_h = $h - 12;
        $drawing_w = $w - 8;
        $cx = $x + $w / 2; // center x
        $by = $drawing_top + $drawing_h; // bottom y

        // Determine visible dimensions for front view.
        $vis_w = $this->width_cm;
        $left_h = $this->wall_height('left');   // for single pitch left-right
        $right_h = $this->wall_height('right');
        $front_h = $this->wall_height('front');

        // For front view: show wall height + roof.
        // Max visible height depends on roof type.
        if ($this->roof_type === 'single' && in_array($roof, ['spad w lewo', 'spad w prawo'])) {
            // Slope visible: trapezoid.
            $max_h = max($left_h, $right_h);
            $scale = $this->calc_scale($drawing_w, $drawing_h, $vis_w, $max_h);
            $pw = $vis_w / 10 * $scale;
            $pl_h = $left_h / 10 * $scale;
            $pr_h = $right_h / 10 * $scale;

            $lx = $cx - $pw / 2;
            $rx = $cx + $pw / 2;

            // Draw walls (trapezoid).
            $this->set_draw_color(self::COLOR_WALL);
            $p->SetLineWidth(self::LW_WALL);
            $p->SetFillColorArray(self::COLOR_FILL);

            $pts = [
                $lx, $by,           // bottom-left
                $rx, $by,           // bottom-right
                $rx, $by - $pr_h,   // top-right
                $lx, $by - $pl_h,   // top-left
            ];
            $p->Polygon($pts, 'DF');

            // Roof outline (thicker, colored).
            $this->set_draw_color(self::COLOR_ROOF);
            $p->SetLineWidth(self::LW_WALL + 0.2);
            $p->Line($lx, $by - $pl_h, $rx, $by - $pr_h);

            // Dimension lines.
            $this->draw_dim_h($lx, $rx, $by + 3, $this->format_m($vis_w));
            $this->draw_dim_v($lx - 3, $by, $by - $pl_h, $this->format_cm($left_h));
            if (abs($left_h - $right_h) > 1) {
                $this->draw_dim_v($rx + 3, $by, $by - $pr_h, $this->format_cm($right_h));
            }
        } elseif ($this->roof_type === 'dual' && in_array($roof, ['dwuspad', 'dwuspad przod-tyl', 'dwuspad przód-tył'])) {
            // Dual pitch front view.
            $is_gable = in_array($roof, ['dwuspad']); // gable visible from front.
            $max_h = $front_h + ($is_gable ? $this->roof_rise_cm : 0);

            $scale = $this->calc_scale($drawing_w, $drawing_h, $vis_w, $max_h > 0 ? $max_h : $front_h);
            $pw = $vis_w / 10 * $scale;
            $ph = $front_h / 10 * $scale;
            $pr = $this->roof_rise_cm / 10 * $scale;

            $lx = $cx - $pw / 2;
            $rx = $cx + $pw / 2;

            // Wall rectangle.
            $this->set_draw_color(self::COLOR_WALL);
            $p->SetLineWidth(self::LW_WALL);
            $p->SetFillColorArray(self::COLOR_FILL);
            $p->Rect($lx, $by - $ph, $pw, $ph, 'DF');

            if ($is_gable && $pr > 0) {
                // Gable triangle.
                $this->set_draw_color(self::COLOR_ROOF);
                $p->SetLineWidth(self::LW_WALL + 0.2);
                $p->SetFillColorArray(self::COLOR_ROOF_FILL);
                $pts = [
                    $lx, $by - $ph,
                    $rx, $by - $ph,
                    $cx, $by - $ph - $pr,
                ];
                $p->Polygon($pts, 'DF');

                // Dimension for ridge height.
                $this->draw_dim_v($rx + 3, $by, $by - $ph - $pr, $this->format_cm($front_h + $this->roof_rise_cm));
            } else {
                // Flat roof line from front perspective (ridge runs front-back).
                $this->set_draw_color(self::COLOR_ROOF);
                $p->SetLineWidth(self::LW_WALL + 0.2);
                $p->Line($lx, $by - $ph, $rx, $by - $ph);

                $this->draw_dim_v($rx + 3, $by, $by - $ph, $this->format_cm($front_h));
            }

            // Dimensions.
            $this->draw_dim_h($lx, $rx, $by + 3, $this->format_m($vis_w));
            $this->draw_dim_v($lx - 3, $by, $by - $ph, $this->format_cm($front_h));
        } else {
            // Single pitch front-back: flat wall from front.
            $max_h = $front_h;
            $scale = $this->calc_scale($drawing_w, $drawing_h, $vis_w, $max_h);
            $pw = $vis_w / 10 * $scale;
            $ph = $max_h / 10 * $scale;

            $lx = $cx - $pw / 2;
            $rx = $cx + $pw / 2;

            $this->set_draw_color(self::COLOR_WALL);
            $p->SetLineWidth(self::LW_WALL);
            $p->SetFillColorArray(self::COLOR_FILL);
            $p->Rect($lx, $by - $ph, $pw, $ph, 'DF');

            $this->set_draw_color(self::COLOR_ROOF);
            $p->SetLineWidth(self::LW_WALL + 0.2);
            $p->Line($lx, $by - $ph, $rx, $by - $ph);

            $this->draw_dim_h($lx, $rx, $by + 3, $this->format_m($vis_w));
            $this->draw_dim_v($lx - 3, $by, $by - $ph, $this->format_cm($max_h));
        }

        // Draw openings on front wall.
        $this->draw_wall_openings('front', $lx, $by, $pw, $ph, $vis_w, $front_h, $scale);
    }

    // -----------------------------------------------------------------
    // Back View
    // -----------------------------------------------------------------

    private function draw_back_view($x, $y, $w, $h) {
        $p = $this->pdf;
        $roof = $this->gv('roof');
        $drawing_top = $y + 8;
        $drawing_h = $h - 12;
        $drawing_w = $w - 8;
        $cx = $x + $w / 2;
        $by = $drawing_top + $drawing_h;

        $vis_w = $this->width_cm;
        $back_h = $this->wall_height('back');

        // Mirror logic of front view but for back wall.
        if ($this->roof_type === 'single' && in_array($roof, ['spad w lewo', 'spad w prawo'])) {
            // Same trapezoid but mirrored.
            $left_h = $this->wall_height('left');
            $right_h = $this->wall_height('right');
            $max_h = max($left_h, $right_h);
            $scale = $this->calc_scale($drawing_w, $drawing_h, $vis_w, $max_h);
            $pw = $vis_w / 10 * $scale;
            $pl_h = $right_h / 10 * $scale; // mirrored
            $pr_h = $left_h / 10 * $scale;  // mirrored

            $lx = $cx - $pw / 2;
            $rx = $cx + $pw / 2;

            $this->set_draw_color(self::COLOR_WALL);
            $p->SetLineWidth(self::LW_WALL);
            $p->SetFillColorArray(self::COLOR_FILL);
            $pts = [$lx, $by, $rx, $by, $rx, $by - $pr_h, $lx, $by - $pl_h];
            $p->Polygon($pts, 'DF');

            $this->set_draw_color(self::COLOR_ROOF);
            $p->SetLineWidth(self::LW_WALL + 0.2);
            $p->Line($lx, $by - $pl_h, $rx, $by - $pr_h);

            $this->draw_dim_h($lx, $rx, $by + 3, $this->format_m($vis_w));
            $this->draw_dim_v($lx - 3, $by, $by - $pl_h, $this->format_cm($right_h));
            if (abs($left_h - $right_h) > 1) {
                $this->draw_dim_v($rx + 3, $by, $by - $pr_h, $this->format_cm($left_h));
            }
        } elseif ($this->roof_type === 'dual') {
            $is_gable = in_array($roof, ['dwuspad']);
            $max_h = $back_h + ($is_gable ? $this->roof_rise_cm : 0);
            $scale = $this->calc_scale($drawing_w, $drawing_h, $vis_w, $max_h > 0 ? $max_h : $back_h);
            $pw = $vis_w / 10 * $scale;
            $ph = $back_h / 10 * $scale;
            $pr = $this->roof_rise_cm / 10 * $scale;

            $lx = $cx - $pw / 2;
            $rx = $cx + $pw / 2;

            $this->set_draw_color(self::COLOR_WALL);
            $p->SetLineWidth(self::LW_WALL);
            $p->SetFillColorArray(self::COLOR_FILL);
            $p->Rect($lx, $by - $ph, $pw, $ph, 'DF');

            if ($is_gable && $pr > 0) {
                $this->set_draw_color(self::COLOR_ROOF);
                $p->SetLineWidth(self::LW_WALL + 0.2);
                $p->SetFillColorArray(self::COLOR_ROOF_FILL);
                $pts = [$lx, $by - $ph, $rx, $by - $ph, $cx, $by - $ph - $pr];
                $p->Polygon($pts, 'DF');
                $this->draw_dim_v($rx + 3, $by, $by - $ph - $pr, $this->format_cm($back_h + $this->roof_rise_cm));
            } else {
                $this->set_draw_color(self::COLOR_ROOF);
                $p->SetLineWidth(self::LW_WALL + 0.2);
                $p->Line($lx, $by - $ph, $rx, $by - $ph);
                $this->draw_dim_v($rx + 3, $by, $by - $ph, $this->format_cm($back_h));
            }

            $this->draw_dim_h($lx, $rx, $by + 3, $this->format_m($vis_w));
            $this->draw_dim_v($lx - 3, $by, $by - $ph, $this->format_cm($back_h));
        } else {
            $scale = $this->calc_scale($drawing_w, $drawing_h, $vis_w, $back_h);
            $pw = $vis_w / 10 * $scale;
            $ph = $back_h / 10 * $scale;
            $lx = $cx - $pw / 2;
            $rx = $cx + $pw / 2;

            $this->set_draw_color(self::COLOR_WALL);
            $p->SetLineWidth(self::LW_WALL);
            $p->SetFillColorArray(self::COLOR_FILL);
            $p->Rect($lx, $by - $ph, $pw, $ph, 'DF');

            $this->set_draw_color(self::COLOR_ROOF);
            $p->SetLineWidth(self::LW_WALL + 0.2);
            $p->Line($lx, $by - $ph, $rx, $by - $ph);

            $this->draw_dim_h($lx, $rx, $by + 3, $this->format_m($vis_w));
            $this->draw_dim_v($lx - 3, $by, $by - $ph, $this->format_cm($back_h));
        }

        $this->draw_wall_openings('back', $lx, $by, $pw, $ph, $vis_w, $back_h, $scale);
    }

    // -----------------------------------------------------------------
    // Left View
    // -----------------------------------------------------------------

    private function draw_left_view($x, $y, $w, $h) {
        $this->draw_side_view('left', $x, $y, $w, $h);
    }

    // -----------------------------------------------------------------
    // Right View
    // -----------------------------------------------------------------

    private function draw_right_view($x, $y, $w, $h) {
        $this->draw_side_view('right', $x, $y, $w, $h);
    }

    /**
     * Generic side view drawer (left or right).
     */
    private function draw_side_view($side, $x, $y, $w, $h) {
        $p = $this->pdf;
        $roof = $this->gv('roof');
        $drawing_top = $y + 8;
        $drawing_h = $h - 12;
        $drawing_w = $w - 8;
        $cx = $x + $w / 2;
        $by = $drawing_top + $drawing_h;

        $vis_w = $this->depth_cm; // side view shows depth.
        $front_h = $this->wall_height('front');
        $back_h  = $this->wall_height('back');
        $side_h  = $this->wall_height($side);

        if ($this->roof_type === 'single' && in_array($roof, ['spad tyl', 'spad tył', 'spad przod', 'spad przód'])) {
            // Slope visible in side view.
            $max_h = max($front_h, $back_h);
            $scale = $this->calc_scale($drawing_w, $drawing_h, $vis_w, $max_h);
            $pw = $vis_w / 10 * $scale;

            $profile_front_h = $front_h;
            $profile_back_h  = $back_h;
            if (in_array($roof, ['spad tyl', 'spad tył', 'spad przod', 'spad przód'])) {
                $profile_front_h = $back_h;
                $profile_back_h  = $front_h;
            }

            // For left view: left=edge is front, right=edge is back.
            // For right view: left=edge is back, right=edge is front.
            $near_h = ($side === 'left') ? $profile_front_h : $profile_back_h;
            $far_h  = ($side === 'left') ? $profile_back_h  : $profile_front_h;

            $pn_h = $near_h / 10 * $scale;
            $pf_h = $far_h / 10 * $scale;

            $lx = $cx - $pw / 2;
            $rx = $cx + $pw / 2;

            $this->set_draw_color(self::COLOR_WALL);
            $p->SetLineWidth(self::LW_WALL);
            $p->SetFillColorArray(self::COLOR_FILL);
            $pts = [$lx, $by, $rx, $by, $rx, $by - $pf_h, $lx, $by - $pn_h];
            $p->Polygon($pts, 'DF');

            $this->set_draw_color(self::COLOR_ROOF);
            $p->SetLineWidth(self::LW_WALL + 0.2);
            $p->Line($lx, $by - $pn_h, $rx, $by - $pf_h);

            $this->draw_dim_h($lx, $rx, $by + 3, $this->format_m($vis_w));
            $this->draw_dim_v($lx - 3, $by, $by - $pn_h, $this->format_cm($near_h));
            if (abs($near_h - $far_h) > 1) {
                $this->draw_dim_v($rx + 3, $by, $by - $pf_h, $this->format_cm($far_h));
            }
        } elseif ($this->roof_type === 'dual') {
            $is_gable = in_array($roof, ['dwuspad przod-tyl', 'dwuspad przód-tył']);
            $max_h = $side_h + ($is_gable ? $this->roof_rise_cm : 0);
            $scale = $this->calc_scale($drawing_w, $drawing_h, $vis_w, $max_h > 0 ? $max_h : $side_h);
            $pw = $vis_w / 10 * $scale;
            $ph = $side_h / 10 * $scale;
            $pr = $this->roof_rise_cm / 10 * $scale;

            $lx = $cx - $pw / 2;
            $rx = $cx + $pw / 2;

            $this->set_draw_color(self::COLOR_WALL);
            $p->SetLineWidth(self::LW_WALL);
            $p->SetFillColorArray(self::COLOR_FILL);
            $p->Rect($lx, $by - $ph, $pw, $ph, 'DF');

            if ($is_gable && $pr > 0) {
                $this->set_draw_color(self::COLOR_ROOF);
                $p->SetLineWidth(self::LW_WALL + 0.2);
                $p->SetFillColorArray(self::COLOR_ROOF_FILL);
                $pts = [$lx, $by - $ph, $rx, $by - $ph, $cx, $by - $ph - $pr];
                $p->Polygon($pts, 'DF');
                $this->draw_dim_v($rx + 3, $by, $by - $ph - $pr, $this->format_cm($side_h + $this->roof_rise_cm));
            } else {
                $this->set_draw_color(self::COLOR_ROOF);
                $p->SetLineWidth(self::LW_WALL + 0.2);
                $p->Line($lx, $by - $ph, $rx, $by - $ph);
                $this->draw_dim_v($rx + 3, $by, $by - $ph, $this->format_cm($side_h));
            }

            $this->draw_dim_h($lx, $rx, $by + 3, $this->format_m($vis_w));
            $this->draw_dim_v($lx - 3, $by, $by - $ph, $this->format_cm($side_h));
        } else {
            // Single pitch left-right: flat wall from side.
            $scale = $this->calc_scale($drawing_w, $drawing_h, $vis_w, $side_h);
            $pw = $vis_w / 10 * $scale;
            $ph = $side_h / 10 * $scale;
            $lx = $cx - $pw / 2;
            $rx = $cx + $pw / 2;

            $this->set_draw_color(self::COLOR_WALL);
            $p->SetLineWidth(self::LW_WALL);
            $p->SetFillColorArray(self::COLOR_FILL);
            $p->Rect($lx, $by - $ph, $pw, $ph, 'DF');

            $this->set_draw_color(self::COLOR_ROOF);
            $p->SetLineWidth(self::LW_WALL + 0.2);
            $p->Line($lx, $by - $ph, $rx, $by - $ph);

            $this->draw_dim_h($lx, $rx, $by + 3, $this->format_m($vis_w));
            $this->draw_dim_v($lx - 3, $by, $by - $ph, $this->format_cm($side_h));
        }

        $this->draw_wall_openings($side, $lx, $by, $pw, $ph, $vis_w, $side_h, $scale);
    }

    // -----------------------------------------------------------------
    // Top View
    // -----------------------------------------------------------------

    private function draw_top_view($x, $y, $w, $h) {
        $p = $this->pdf;
        $roof = $this->gv('roof');
        $drawing_top = $y + 8;
        $drawing_h = $h - 12;
        $drawing_w = $w - 8;
        $cx = $x + $w / 2;
        $cy = $drawing_top + $drawing_h / 2;

        $vis_w = $this->width_cm;
        $vis_d = $this->depth_cm;

        $scale = $this->calc_scale($drawing_w - 6, $drawing_h - 6, $vis_w, $vis_d);
        $pw = $vis_w / 10 * $scale;
        $pd = $vis_d / 10 * $scale;

        $lx = $cx - $pw / 2;
        $rx = $cx + $pw / 2;
        $ty = $cy - $pd / 2;

        // Rectangle.
        $this->set_draw_color(self::COLOR_WALL);
        $p->SetLineWidth(self::LW_WALL);
        $p->SetFillColorArray(self::COLOR_FILL);
        $p->Rect($lx, $ty, $pw, $pd, 'DF');

        // Roof direction indicator.
        $this->set_draw_color(self::COLOR_ROOF);
        $p->SetLineWidth(0.3);
        $p->SetLineStyle(['dash' => '2,1']);

        if ($this->roof_type === 'dual') {
            if (in_array($roof, ['dwuspad'])) {
                // Ridge along depth (vertical line in center).
                $p->Line($cx, $ty + 2, $cx, $ty + $pd - 2);
            } else {
                // Ridge along width (horizontal line in center).
                $p->Line($lx + 2, $cy, $rx - 2, $cy);
            }
        } else {
            // Arrow showing slope direction.
            $high_wall = $this->single_pitch_profile_high_wall($roof);
            $ax1 = $cx; $ay1 = $cy;
            switch ($high_wall) {
                case 'front': $ax2 = $cx; $ay2 = $ty + 2; break;
                case 'back':  $ax2 = $cx; $ay2 = $ty + $pd - 2; break;
                case 'left':  $ax2 = $lx + 2; $ay2 = $cy; break;
                case 'right': $ax2 = $rx - 2; $ay2 = $cy; break;
                default:      $ax2 = $cx; $ay2 = $ty + 2;
            }
            $p->Line($ax1, $ay1, $ax2, $ay2);
            // Arrowhead.
            $angle = atan2($ay2 - $ay1, $ax2 - $ax1);
            $al = 3;
            $p->Line($ax2, $ay2, $ax2 - $al * cos($angle - 0.4), $ay2 - $al * sin($angle - 0.4));
            $p->Line($ax2, $ay2, $ax2 - $al * cos($angle + 0.4), $ay2 - $al * sin($angle + 0.4));
        }
        $p->SetLineStyle(['dash' => '']);

        // Dimensions.
        $this->draw_dim_h($lx, $rx, $ty + $pd + 3, $this->format_m($vis_w));
        $this->draw_dim_v($lx - 3, $ty, $ty + $pd, $this->format_m($vis_d));
    }

    // =====================================================================
    // Openings (Gates, Doors, Windows) on a Wall
    // =====================================================================

    private function draw_wall_openings($wall, $wall_lx, $wall_by, $wall_pw_mm, $wall_ph_mm, $wall_w_cm, $wall_h_cm, $scale) {
        $p = $this->pdf;

        // Gates — always on front wall.
        if ($wall === 'front') {
            $gate_count = (int) $this->gv('gateCount', 0);
            for ($i = 1; $i <= min(3, $gate_count); $i++) {
                $gw = (float) $this->gv('gateWidth' . $i) * 100; // m -> cm
                $gh = (float) $this->gv('gateHeight' . $i);       // cm
                $gp = (float) $this->gv('gatePositionValue' . $i); // cm from left
                if ($gw <= 0 || $gh <= 0) continue;

                $ox = $wall_lx + ($gp / 10) * $scale;
                $ow = ($gw / 10) * $scale;
                $oh = ($gh / 10) * $scale;
                $oy = $wall_by - $oh;

                // Clamp to wall bounds.
                if ($ox + $ow > $wall_lx + $wall_pw_mm) {
                    $ow = $wall_lx + $wall_pw_mm - $ox;
                }

                $this->set_draw_color(self::COLOR_GATE);
                $p->SetLineWidth(self::LW_OPENING);
                $p->SetFillColorArray([220, 230, 250]);
                $p->Rect($ox, $oy, $ow, $oh, 'DF');
            }
        }

        // Doors on this wall.
        foreach ($this->doors as $door) {
            $pos = isset($door['position']) ? $door['position'] : '';
            // Normalize position.
            $pos = str_replace(['przód', 'tył'], ['przod', 'tyl'], $pos);
            $pos_map = ['przod' => 'front', 'tyl' => 'back', 'lewo' => 'left', 'prawo' => 'right'];
            $wall_key = isset($pos_map[$pos]) ? $pos_map[$pos] : $pos;
            if ($wall_key !== $wall) continue;

            $size = isset($door['size']) ? $door['size'] : '80x190';
            $parts = explode('x', $size);
            $dw = (float) (isset($parts[0]) ? $parts[0] : 80);
            $dh = (float) (isset($parts[1]) ? $parts[1] : 190);
            $dp = (float) (isset($door['positionValue']) ? $door['positionValue'] : 0);

            $ow = ($dw / 10) * $scale;
            $ox = $this->opening_x($wall, $wall_lx, $wall_pw_mm, $dp, $dw, $scale);
            $oh = ($dh / 10) * $scale;
            $oy = $wall_by - $oh;

            if ($ox + $ow > $wall_lx + $wall_pw_mm) {
                $ow = $wall_lx + $wall_pw_mm - $ox;
            }

            $this->set_draw_color(self::COLOR_DOOR);
            $p->SetLineWidth(self::LW_OPENING);
            $p->SetFillColorArray([220, 245, 220]);
            $p->Rect($ox, $oy, $ow, $oh, 'DF');
        }

        // Windows on this wall.
        foreach ($this->windows as $win) {
            $pos = isset($win['position']) ? $win['position'] : '';
            $pos = str_replace(['przód', 'tył'], ['przod', 'tyl'], $pos);
            $pos_map = ['przod' => 'front', 'tyl' => 'back', 'lewo' => 'left', 'prawo' => 'right'];
            $wall_key = isset($pos_map[$pos]) ? $pos_map[$pos] : $pos;
            if ($wall_key !== $wall) continue;

            $size = isset($win['size']) ? $win['size'] : '80x60';
            $parts = explode('x', $size);
            $ww = (float) (isset($parts[0]) ? $parts[0] : 80);
            $wh = (float) (isset($parts[1]) ? $parts[1] : 60);
            $wp = (float) (isset($win['positionValue']) ? $win['positionValue'] : 0);

            $ow = ($ww / 10) * $scale;
            $ox = $this->opening_x($wall, $wall_lx, $wall_pw_mm, $wp, $ww, $scale);
            $oh = ($wh / 10) * $scale;

            // Windows are placed higher on the wall (approx 150cm from floor).
            $win_bottom_cm = 150;
            $win_bottom_mm = ($win_bottom_cm / 10) * $scale;
            $oy = $wall_by - $win_bottom_mm;

            if ($ox + $ow > $wall_lx + $wall_pw_mm) {
                $ow = $wall_lx + $wall_pw_mm - $ox;
            }

            $this->set_draw_color(self::COLOR_WINDOW);
            $p->SetLineWidth(self::LW_OPENING);
            $p->SetFillColorArray([255, 255, 210]);
            $p->Rect($ox, $oy, $ow, $oh, 'DF');
        }
    }

    private function opening_x($wall, $wall_lx, $wall_pw_mm, $position_cm, $opening_width_cm, $scale) {
        $start_mm = ($position_cm / 10) * $scale;
        $opening_mm = ($opening_width_cm / 10) * $scale;
        if ($wall === 'left') {
            return $wall_lx + $wall_pw_mm - $start_mm - $opening_mm;
        }
        return $wall_lx + $start_mm;
    }

    // =====================================================================
    // Dimension Lines
    // =====================================================================

    /**
     * Draw horizontal dimension line with arrows and label.
     */
    private function draw_dim_h($x1, $x2, $y, $label) {
        $p = $this->pdf;
        $this->set_draw_color(self::COLOR_DIM);
        $p->SetLineWidth(self::LW_DIM);

        // Extension lines.
        $ext = 2;
        $p->Line($x1, $y - $ext, $x1, $y + 1);
        $p->Line($x2, $y - $ext, $x2, $y + 1);

        // Main line.
        $p->Line($x1, $y, $x2, $y);

        // Arrowheads.
        $al = 1.5;
        $p->Line($x1, $y, $x1 + $al, $y - 0.5);
        $p->Line($x1, $y, $x1 + $al, $y + 0.5);
        $p->Line($x2, $y, $x2 - $al, $y - 0.5);
        $p->Line($x2, $y, $x2 - $al, $y + 0.5);

        // Label.
        $p->SetFont('dejavusans', '', 6);
        $lw = $p->GetStringWidth($label) + 2;
        $lx = ($x1 + $x2) / 2 - $lw / 2;
        $p->SetFillColor(255, 255, 255);
        $p->Rect($lx, $y - 2, $lw, 4, 'F');
        $p->SetXY($lx, $y - 2);
        $p->Cell($lw, 4, $label, 0, 0, 'C');
    }

    /**
     * Draw vertical dimension line with arrows and label.
     */
    private function draw_dim_v($x, $y1, $y2, $label) {
        $p = $this->pdf;
        $this->set_draw_color(self::COLOR_DIM);
        $p->SetLineWidth(self::LW_DIM);

        // Extension lines.
        $ext = 2;
        $p->Line($x - 1, $y1, $x + $ext, $y1);
        $p->Line($x - 1, $y2, $x + $ext, $y2);

        // Main line.
        $p->Line($x, $y1, $x, $y2);

        // Arrowheads.
        $al = 1.5;
        $p->Line($x, $y1, $x - 0.5, $y1 + $al);
        $p->Line($x, $y1, $x + 0.5, $y1 + $al);
        $p->Line($x, $y2, $x - 0.5, $y2 - $al);
        $p->Line($x, $y2, $x + 0.5, $y2 - $al);

        // Label (rotated).
        $p->SetFont('dejavusans', '', 6);
        $lw = $p->GetStringWidth($label) + 2;
        $mid = ($y1 + $y2) / 2;
        $p->SetFillColor(255, 255, 255);
        $p->Rect($x - $lw / 2, $mid - 2, $lw, 4, 'F');
        $p->SetXY($x - $lw / 2, $mid - 2);
        $p->Cell($lw, 4, $label, 0, 0, 'C');
    }

    // =====================================================================
    // Roof Geometry
    // =====================================================================

    private function calculate_roof_geometry() {
        $roof = $this->gv('roof');
        $single_types = ['spad tyl', 'spad tył', 'spad przod', 'spad przód', 'spad w lewo', 'spad w prawo'];
        $dual_types   = ['dwuspad', 'dwuspad przod-tyl', 'dwuspad przód-tył'];

        if (in_array($roof, $single_types)) {
            $this->roof_type = 'single';
            if (in_array($roof, ['spad tyl', 'spad tył', 'spad przod', 'spad przód'])) {
                // Slope along depth.
                $span = $this->depth_cm;
                $this->roof_direction = 'front-back';
            } else {
                // Slope along width.
                $span = $this->width_cm;
                $this->roof_direction = 'left-right';
            }
            if (in_array($roof, ['spad tyl', 'spad tył', 'spad tyĹ‚'])) {
                $this->roof_rise_cm = $this->rear_slope_rise_from_depth($span);
            } elseif (in_array($roof, ['spad przod', 'spad przód', 'spad przĂłd'])) {
                $this->roof_rise_cm = $this->front_slope_rise_from_depth($span);
            } else {
                $this->roof_rise_cm = $span * tan(deg2rad(self::SINGLE_PITCH_ANGLE));
            }
        } elseif (in_array($roof, $dual_types)) {
            $this->roof_type = 'dual';
            if (in_array($roof, ['dwuspad'])) {
                // Ridge along depth, half-span is width/2.
                $half_span = $this->width_cm / 2;
                $this->roof_direction = 'left-right-dual';
            } else {
                // Ridge along width, half-span is depth/2.
                $half_span = $this->depth_cm / 2;
                $this->roof_direction = 'front-back-dual';
            }
            $this->roof_rise_cm = $half_span * tan(deg2rad(self::DUAL_PITCH_ANGLE));
        } else {
            $this->roof_type = 'single';
            $this->roof_rise_cm = 0;
            $this->roof_direction = 'front-back';
        }
    }

    private function rear_slope_rise_from_depth($depth_cm) {
        $depth_m = $depth_cm / 100;
        return self::REAR_SLOPE_BASE_RISE_CM
            + max(0, $depth_m - self::REAR_SLOPE_BASE_LENGTH_M) * self::REAR_SLOPE_EXTRA_RISE_CM_PER_METER;
    }

    private function front_slope_rise_from_depth($depth_cm) {
        $depth_m = $depth_cm / 100;
        return self::FRONT_SLOPE_BASE_RISE_CM
            + max(0, $depth_m - self::FRONT_SLOPE_BASE_LENGTH_M) * self::FRONT_SLOPE_EXTRA_RISE_CM_PER_METER;
    }

    // =====================================================================
    // Data Helpers
    // =====================================================================

    private function gv($key, $default = '') {
        if (!is_array($this->garage)) return $default;
        return array_key_exists($key, $this->garage) ? $this->garage[$key] : $default;
    }

    private function cv($key, $default = '') {
        if (!is_array($this->contact)) return $default;
        return array_key_exists($key, $this->contact) ? $this->contact[$key] : $default;
    }

    private function yes_no($value) {
        $t = self::translations($this->lang);
        return !empty($value) ? $t['yes'] : $t['no'];
    }

    private function from_left_label() {
        $t = self::translations($this->lang);
        return $t['from_left'];
    }

    private function from_front_label() {
        $t = self::translations($this->lang);
        return isset($t['from_front']) ? $t['from_front'] : 'od przodu';
    }

    private function opening_position_label($position) {
        $position = str_replace(['przĂłd', 'tyĹ‚', 'tył'], ['przod', 'tyl', 'tyl'], (string) $position);
        return $position === 'lewo' ? $this->from_front_label() : $this->from_left_label();
    }

    private function position_value_text($value) {
        return $value === null || $value === '' ? '-' : (string) $value;
    }

    private function format_m($cm) {
        return number_format($cm / 100, 1) . ' m';
    }

    private function format_cm($cm) {
        return round($cm) . ' cm';
    }

    private function parse_items($raw) {
        if (!is_string($raw) || trim($raw) === '') return [];
        $lines = preg_split('/\r\n|\r|\n/', trim($raw));
        $items = [];
        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '') continue;
            if (preg_match('/^[^:]+:\s*(\{.*\})$/', $line, $m)) {
                $decoded = json_decode($m[1], true);
                if (is_array($decoded)) {
                    $items[] = $decoded;
                }
            }
        }
        return $items;
    }

    private function resolve_image_path($url) {
        if (empty($url)) return false;
        $upload = wp_upload_dir();
        $base_url = isset($upload['baseurl']) ? (string) $upload['baseurl'] : '';
        $base_dir = isset($upload['basedir']) ? (string) $upload['basedir'] : '';
        if ($base_url === '' || $base_dir === '' || strpos($url, $base_url) !== 0) return false;
        $relative = ltrim(substr($url, strlen($base_url)), '/');
        $file_path = wp_normalize_path($base_dir . '/' . $relative);
        return file_exists($file_path) ? $file_path : false;
    }

    private function set_draw_color($rgb) {
        $this->pdf->SetDrawColor($rgb[0], $rgb[1], $rgb[2]);
    }
}
