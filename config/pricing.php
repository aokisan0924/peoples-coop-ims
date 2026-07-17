<?php

return [
    // Standard non-member VAT rate (Philippines standard is 12%)
    'vat_rate' => (float) env('VAT_RATE', 12.00),

    // Fallback markup if a product somehow has none set
    'default_markup' => (float) env('DEFAULT_MARKUP', 18.00),
];