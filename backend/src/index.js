const express = require("express");
const cors = require("cors");
const Stripe = require("stripe");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: "1mb" }));

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn("Missing STRIPE_SECRET_KEY in environment.");
}
if (!process.env.SHOPIFY_DOMAIN || !process.env.SHOPIFY_ADMIN_TOKEN) {
  console.warn("Missing SHOPIFY_DOMAIN or SHOPIFY_ADMIN_TOKEN in environment.");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-06-20",
});

function normalizeVariantId(rawId) {
  if (!rawId) return null;
  const match = String(rawId).match(/(\d+)$/);
  return match ? match[1] : null;
}

function safeNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function cleanObject(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined && entry !== null && entry !== ""),
  );
}

function normalizeAddress(rawAddress) {
  if (!rawAddress || typeof rawAddress !== "object") return undefined;
  const address = rawAddress;
  return cleanObject({
    first_name: address.first_name || address.firstName || undefined,
    last_name: address.last_name || address.lastName || undefined,
    company: address.company || undefined,
    address1: address.address1 || undefined,
    address2: address.address2 || undefined,
    city: address.city || undefined,
    province: address.province || address.state || undefined,
    zip: address.zip || address.postalCode || undefined,
    country: address.country || undefined,
    phone: address.phone || undefined,
  });
}

async function getOrCreateStripeCustomer(customerEmail, metadata) {
  if (customerEmail) {
    const existing = await stripe.customers.list({ email: customerEmail, limit: 1 });
    if (existing.data.length > 0) {
      return existing.data[0];
    }
  }
  return stripe.customers.create({
    email: customerEmail || undefined,
    metadata: metadata || undefined,
  });
}

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

// Create Stripe PaymentIntent
app.post("/payments/create-intent", async (req, res) => {
  try {
    const amount = safeNumber(req.body.amount);
    const currency = req.body.currency || "usd";
    const customerEmail = req.body.customerEmail || undefined;
    const metadata = req.body.metadata || undefined;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "amount must be a positive number" });
    }

    const intent = await stripe.paymentIntents.create({
      amount: Math.round(amount),
      currency,
      receipt_email: customerEmail,
      automatic_payment_methods: { enabled: true },
      metadata,
    });

    res.json({ clientSecret: intent.client_secret });
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to create payment intent" });
  }
});

// Create Stripe PaymentIntent + customer + ephemeral key for PaymentSheet
app.post("/payments/init-payment-sheet", async (req, res) => {
  try {
    const amount = safeNumber(req.body.amount);
    const currency = req.body.currency || "usd";
    const customerEmail = req.body.customerEmail || undefined;
    const metadata = req.body.metadata || undefined;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "amount must be a positive number" });
    }

    const customer = await getOrCreateStripeCustomer(customerEmail, {
      source: "beatrackfam-app",
    });

    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customer.id },
      { apiVersion: "2024-06-20" },
    );

    const intent = await stripe.paymentIntents.create({
      amount: Math.round(amount),
      currency,
      customer: customer.id,
      receipt_email: customerEmail,
      automatic_payment_methods: { enabled: true },
      setup_future_usage: "on_session",
      metadata,
    });

    res.json({
      clientSecret: intent.client_secret,
      customerId: customer.id,
      ephemeralKey: ephemeralKey.secret,
    });
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to initialize payment sheet" });
  }
});

// Optional: Check Stripe PaymentIntent status
app.post("/payments/confirm-wallet", async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    if (!paymentIntentId) {
      return res.status(400).json({ error: "paymentIntentId is required" });
    }

    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
    res.json({ status: intent.status });
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to confirm payment" });
  }
});

// Create Shopify order (Admin API)
app.post("/shopify/create-order", async (req, res) => {
  try {
    const {
      lineItems,
      customerEmail,
      shippingAddress,
      billingAddress,
      discountCode,
      discountAmount,
      discountType,
      currency,
      transactionId,
      totalAmount,
    } = req.body;

    if (!Array.isArray(lineItems) || lineItems.length === 0) {
      return res.status(400).json({ error: "lineItems is required" });
    }

    const normalizedLineItems = lineItems
      .map((item) => {
        const variantId = normalizeVariantId(item.variantId || item.variant_id);
        const quantity = safeNumber(item.quantity);
        if (!variantId || !quantity) return null;
        return { variant_id: Number(variantId), quantity: Number(quantity) };
      })
      .filter(Boolean);

    if (normalizedLineItems.length === 0) {
      return res.status(400).json({ error: "No valid line items" });
    }

    const normalizedShipping = normalizeAddress(shippingAddress);
    const normalizedBilling = normalizeAddress(billingAddress);
    const hasDiscount =
      discountCode && discountAmount && safeNumber(discountAmount) && safeNumber(discountAmount) > 0;

    const orderPayload = {
      order: {
        email: customerEmail,
        line_items: normalizedLineItems,
        currency: currency || "USD",
        shipping_address: normalizedShipping,
        billing_address: normalizedBilling,
        financial_status: "paid",
        transactions: [
          {
            kind: "sale",
            status: "success",
            gateway: "stripe",
            amount: totalAmount ? String(totalAmount) : undefined,
            authorization: transactionId || undefined,
          },
        ],
        discount_codes: hasDiscount
          ? [
              {
                code: String(discountCode),
                amount: String(Math.abs(Number(discountAmount))),
                type: discountType === "percentage" ? "percentage" : "fixed_amount",
              },
            ]
          : undefined,
      },
    };

    const response = await fetch(
      `https://${process.env.SHOPIFY_DOMAIN}/admin/api/2024-10/orders.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": process.env.SHOPIFY_ADMIN_TOKEN || "",
        },
        body: JSON.stringify(orderPayload),
      },
    );

    const data = await response.json();
    if (!response.ok) {
      return res.status(400).json({ error: data.errors || data });
    }

    res.json({ orderId: data.order.id, orderNumber: data.order.order_number });
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to create order" });
  }
});

// Fetch Shopify discount codes (Admin API)
app.get("/shopify/discount-codes", async (req, res) => {
  try {
    if (!process.env.SHOPIFY_DOMAIN || !process.env.SHOPIFY_ADMIN_TOKEN) {
      return res.status(500).json({ error: "Shopify Admin API not configured" });
    }

    const priceRuleResponse = await fetch(
      `https://${process.env.SHOPIFY_DOMAIN}/admin/api/2024-10/price_rules.json?limit=50`,
      {
        headers: {
          "X-Shopify-Access-Token": process.env.SHOPIFY_ADMIN_TOKEN || "",
        },
      },
    );

    const priceRuleData = await priceRuleResponse.json();
    if (!priceRuleResponse.ok) {
      return res.status(400).json({ error: priceRuleData.errors || priceRuleData });
    }

    const priceRules = Array.isArray(priceRuleData.price_rules) ? priceRuleData.price_rules : [];
    if (priceRules.length === 0) {
      return res.json({ codes: [] });
    }

    const codes = (
      await Promise.all(
        priceRules.map(async (rule) => {
          const ruleId = rule.id;
          if (!ruleId) return [];
          const response = await fetch(
            `https://${process.env.SHOPIFY_DOMAIN}/admin/api/2024-10/price_rules/${ruleId}/discount_codes.json?limit=50`,
            {
              headers: {
                "X-Shopify-Access-Token": process.env.SHOPIFY_ADMIN_TOKEN || "",
              },
            },
          );
          const data = await response.json();
          if (!response.ok) {
            return [];
          }
          const valueType = rule.value_type === "percentage" ? "percentage" : "fixed_amount";
          const value = Math.abs(Number(rule.value));
          return (data.discount_codes || []).map((code) => ({
            code: code.code,
            valueType,
            value,
          }));
        }),
      )
    ).flat();

    res.json({ codes });
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to fetch discount codes" });
  }
});

// Fetch Shopify customer addresses (Admin API)
app.get("/customers/:id/addresses", async (req, res) => {
  try {
    const customerId = req.params.id;
    if (!customerId) {
      return res.status(400).json({ error: "customerId is required" });
    }

    const response = await fetch(
      `https://${process.env.SHOPIFY_DOMAIN}/admin/api/2024-10/customers/${customerId}/addresses.json`,
      {
        headers: {
          "X-Shopify-Access-Token": process.env.SHOPIFY_ADMIN_TOKEN || "",
        },
      },
    );

    const data = await response.json();
    if (!response.ok) {
      return res.status(400).json({ error: data.errors || data });
    }

    res.json({ addresses: data.addresses || [] });
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to fetch addresses" });
  }
});

app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});
