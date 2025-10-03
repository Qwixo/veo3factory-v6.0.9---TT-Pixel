import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-12-18.acacia',
  httpClient: Stripe.createFetchHttpClient(),
});

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, stripe-signature',
};

Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      });
    }

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      console.error('Missing stripe-signature header');
      return new Response(JSON.stringify({ error: 'Missing signature' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Processing webhook event: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionChange(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log(`Processing checkout session completed: ${session.id}`);

  try {
    if (session.mode === 'payment') {
      // Handle one-time payment
      await handleOneTimePayment(session);
    } else if (session.mode === 'subscription') {
      // Handle subscription
      await handleSubscriptionPayment(session);
    }
  } catch (error) {
    console.error('Error handling checkout session completed:', error);
    throw error;
  }
}

async function handleOneTimePayment(session: Stripe.Checkout.Session) {
  const customerId = session.customer as string;
  const paymentIntentId = session.payment_intent as string;

  // Create order record
  const { error: orderError } = await supabase
    .from('stripe_orders')
    .insert({
      checkout_session_id: session.id,
      payment_intent_id: paymentIntentId,
      customer_id: customerId,
      amount_subtotal: session.amount_subtotal || 0,
      amount_total: session.amount_total || 0,
      currency: session.currency || 'usd',
      payment_status: session.payment_status,
      status: 'completed',
    });

  if (orderError) {
    console.error('Error creating order:', orderError);
    throw orderError;
  }

  // ✅ Call Make.com webhook to send product
  await fetch('https://hook.eu2.make.com/rxn2ecayvl5bcwc5fexe82vbgx9sp71i', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: session.customer_email,
      name: session.customer_details?.name,
      product: 'veo3factory',
      sessionId: session.id,
      amount: session.amount_total,
      currency: session.currency,
    }),
  });

  console.log(`Successfully processed one-time payment for customer ${customerId}`);
}


async function handleSubscriptionPayment(session: Stripe.Checkout.Session) {
  const subscriptionId = session.subscription as string;
  
  if (!subscriptionId) {
    console.error('No subscription ID found in checkout session');
    return;
  }

  // Fetch the subscription from Stripe to get full details
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  await handleSubscriptionChange(subscription);
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  console.log(`Processing subscription change: ${subscription.id}`);

  try {
    const customerId = subscription.customer as string;
    const priceId = subscription.items.data[0]?.price?.id;

    // Get payment method details if available
    let paymentMethodBrand = null;
    let paymentMethodLast4 = null;

    if (subscription.default_payment_method) {
      try {
        const paymentMethod = await stripe.paymentMethods.retrieve(
          subscription.default_payment_method as string
        );
        paymentMethodBrand = paymentMethod.card?.brand || null;
        paymentMethodLast4 = paymentMethod.card?.last4 || null;
      } catch (error) {
        console.error('Error fetching payment method:', error);
      }
    }

    const { error } = await supabase
      .from('stripe_subscriptions')
      .upsert({
        customer_id: customerId,
        subscription_id: subscription.id,
        price_id: priceId,
        status: subscription.status as any,
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
        cancel_at_period_end: subscription.cancel_at_period_end,
        payment_method_brand: paymentMethodBrand,
        payment_method_last4: paymentMethodLast4,
      }, {
        onConflict: 'customer_id'
      });

    if (error) {
      console.error('Error updating subscription:', error);
      throw error;
    }

    console.log(`Successfully updated subscription for customer ${customerId}`);
  } catch (error) {
    console.error('Error handling subscription change:', error);
    throw error;
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log(`Processing subscription deleted: ${subscription.id}`);

  try {
    const customerId = subscription.customer as string;

    const { error } = await supabase
      .from('stripe_subscriptions')
      .update({
        status: 'canceled',
        deleted_at: new Date().toISOString(),
      })
      .eq('customer_id', customerId);

    if (error) {
      console.error('Error marking subscription as deleted:', error);
      throw error;
    }

    console.log(`Successfully marked subscription as deleted for customer ${customerId}`);
  } catch (error) {
    console.error('Error handling subscription deletion:', error);
    throw error;
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log(`Processing invoice payment succeeded: ${invoice.id}`);

  if (invoice.subscription) {
    // Fetch and update the subscription
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
    await handleSubscriptionChange(subscription);
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log(`Processing invoice payment failed: ${invoice.id}`);

  if (invoice.subscription) {
    const customerId = invoice.customer as string;

    // Update subscription status to indicate payment failure
    const { error } = await supabase
      .from('stripe_subscriptions')
      .update({
        status: 'past_due',
      })
      .eq('customer_id', customerId);

    if (error) {
      console.error('Error updating subscription for failed payment:', error);
      throw error;
    }

    console.log(`Updated subscription status to past_due for customer ${customerId}`);
  }
}

function generateTempPassword(): string {
  // Generate a secure temporary password
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}