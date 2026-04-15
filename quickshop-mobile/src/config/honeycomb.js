/**
 * Honeycomb Demo Backend Configuration
 *
 * Static data derived from Howard's locust load-generation script.
 * Used by honeycombClient.js to fire real requests against the
 * Honeycomb microservices demo backend for end-to-end tracing.
 */

export const HONEYCOMB_BASE_URL = 'https://microservices.honeydemo.io';

// ── Product IDs from the demo backend catalogue ──────────────
export const DEMO_PRODUCTS = [
    '16BEE20109',
    '999SLO4D20',
    'OLJCESPC7Z',
    '66VCHSJNUP',
    '1YMWWN1N4O',
    'DG9ZAG9RCG',
    'L9ECAV7KIM',
    '2ZYFJ3GM2N',
    '0PUK6V6EV0',
    'LS4PSXUNUM',
    '9SIQT8TOJO',
    '6E92ZMYYFZ',
];

// ── Supported currencies ─────────────────────────────────────
export const DEMO_CURRENCIES = ['EUR', 'USD', 'JPY', 'CAD'];

// ── Sample people (checkout payloads) ────────────────────────
export const DEMO_PEOPLE = [
    {
        email: 'someone@example.com',
        street_address: '1600 Amphitheatre Parkway',
        zip_code: '94043',
        city: 'Mountain View',
        state: 'CA',
        country: 'United States',
        credit_card_number: '4432-8015-6152-0454',
        credit_card_expiration_month: '1',
        credit_card_expiration_year: '2029',
        credit_card_cvv: '672',
    },
    {
        email: 'anyone@sample.com',
        street_address: '410 Terry Avenue North',
        zip_code: '98109',
        city: 'Seattle',
        state: 'WA',
        country: 'United States',
        credit_card_number: '4452-7643-1892-6453',
        credit_card_expiration_month: '3',
        credit_card_expiration_year: '2027',
        credit_card_cvv: '397',
    },
    {
        email: 'aperson@acompany.com',
        street_address: 'One Microsoft Way',
        zip_code: '98052',
        city: 'Redmond',
        state: 'WA',
        country: 'United States',
        credit_card_number: '4582-5783-3465-4667',
        credit_card_expiration_month: '11',
        credit_card_expiration_year: '2026',
        credit_card_cvv: '784',
    },
    {
        email: 'another@thing.com',
        street_address: '1 Apple Park Way',
        zip_code: '95014',
        city: 'Cupertino',
        state: 'CA',
        country: 'United States',
        credit_card_number: '4104-6732-9834-0990',
        credit_card_expiration_month: '7',
        credit_card_expiration_year: '2027',
        credit_card_cvv: '649',
    },
    {
        email: 'foo@bar.com',
        street_address: '1 Hacker Way',
        zip_code: '94025',
        city: 'Menlo Park',
        state: 'CA',
        country: 'United States',
        credit_card_number: '4456-7843-4578-8943',
        credit_card_expiration_month: '8',
        credit_card_expiration_year: '2029',
        credit_card_cvv: '835',
    },
];

// ── Helpers ──────────────────────────────────────────────────

/**
 * Map an app-local product ID (1–18) to a demo backend product ID.
 * Cycles through DEMO_PRODUCTS if the app has more products.
 */
export function mapProductId(appProductId) {
    const index = ((appProductId - 1) % DEMO_PRODUCTS.length + DEMO_PRODUCTS.length) % DEMO_PRODUCTS.length;
    return DEMO_PRODUCTS[index];
}

/** Pick a random person from the locust dataset. */
export function getRandomPerson() {
    return DEMO_PEOPLE[Math.floor(Math.random() * DEMO_PEOPLE.length)];
}

/** Pick a random currency code. */
export function getRandomCurrency() {
    return DEMO_CURRENCIES[Math.floor(Math.random() * DEMO_CURRENCIES.length)];
}

/** Pick a random demo product ID. */
export function getRandomProductId() {
    return DEMO_PRODUCTS[Math.floor(Math.random() * DEMO_PRODUCTS.length)];
}
