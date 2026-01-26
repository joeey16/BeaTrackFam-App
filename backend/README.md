# Shopify + Stripe Backend

Minimal Express backend for:

- Stripe PaymentIntent creation (cards + Apple Pay + Google Pay)
- Optional PaymentIntent status check
- Shopify Admin API order creation
- Shopify customer addresses

## Environment

Copy `.env.example` to `.env` and fill in:

- `STRIPE_SECRET_KEY`
- `SHOPIFY_DOMAIN`
- `SHOPIFY_ADMIN_TOKEN`

## Endpoints

### POST /payments/create-intent

Body:

```json
{ "amount": 1299, "currency": "usd", "customerEmail": "test@email.com" }
```

Returns:

```json
{ "clientSecret": "pi_..._secret_..." }
```

### POST /payments/confirm-wallet

Body:

```json
{ "paymentIntentId": "pi_..." }
```

Returns:

```json
{ "status": "succeeded" }
```

### POST /shopify/create-order

Body:

```json
{
  "lineItems": [{ "variantId": "gid://shopify/ProductVariant/123", "quantity": 1 }],
  "customerEmail": "test@email.com",
  "shippingAddress": { "first_name": "Jane", "last_name": "Doe" },
  "currency": "USD",
  "transactionId": "pi_...",
  "totalAmount": "12.99"
}
```

### GET /customers/:id/addresses

Returns:

```json
{ "addresses": [] }
```

## Notes

- This backend expects line item variant IDs in Shopify GID format or numeric IDs.
- Shopify Admin API access token must have order and customer read/write scopes.
