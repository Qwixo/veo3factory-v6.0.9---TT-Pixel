import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Zap, CheckCircle } from 'lucide-react';
import { STRIPE_CONFIG, getStripeProductConfig } from '../../stripe-config';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import '/checkout-styles.css';
import { Modal } from "../Modal";
import { hasSeenWithin, markSeenFor } from "../hooks";


// TikTok typings + safe wrapper
declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    ttq?: { track: (...args: any[]) => void; identify?: (data: any) => void };
  }
}
const ttqTrack = (name: string, props: Record<string, any> = {}, opts?: Record<string, any>) => {
  try { if (typeof window !== 'undefined' && window.ttq?.track) window.ttq.track(name, props, opts); } catch {}
};




// --- dev-helper: clear popup locks via console or querystring ---
if (typeof window !== "undefined") {
  (window as any).__pop = {
    reset() {
      ["modal_checkout_until", "modal_checkout_early_until"]
        .forEach(k => localStorage.removeItem(k));
      console.log("[popups] checkout reset done");
    }
  };
  if (new URLSearchParams(location.search).get("debugPopups") === "1") (window as any).__pop.reset();
}














async function hashEmail(email) {
  const encoder = new TextEncoder();
  const data = encoder.encode(email.trim().toLowerCase());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}


export function CheckoutPage() {
  // --- CHECKOUT POPUP STATE ---





const [utmData, setUtmData] = useState<any>(null);

useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const data = {
    utm_source: params.get("utm_source"),
    utm_medium: params.get("utm_medium"),
    utm_campaign: params.get("utm_campaign"),
    utm_content: params.get("utm_content"),
  };

  // If any param exists, save it for this session
  if (Object.values(data).some(v => v)) {
    localStorage.setItem("utm_data", JSON.stringify(data));
    setUtmData(data);
  } else {
    // fallback to stored values if user navigates
    const stored = localStorage.getItem("utm_data");
    if (stored) setUtmData(JSON.parse(stored));
  }
}, []);






// --- CHECKOUT POPUP STATE ---
const [checkoutOpen, setCheckoutOpen] = useState(false);
const [checkoutSeen, setCheckoutSeen] = useState(
  hasSeenWithin("modal_checkout_until")
);
// NEW: 1s “WAIT! WAIT! WAIT!” popup
const [earlyOpen, setEarlyOpen] = useState(false);
const [earlySeen, setEarlySeen] = useState(
  hasSeenWithin("modal_checkout_early_until")
);


// only used to attach to wrapper (not required for the timer itself)
const containerRef = useRef<HTMLDivElement | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');


  


const product = getStripeProductConfig();


  
  // Store checkout data in localStorage for success page
const storeCheckoutData = () => {
  const utm = localStorage.getItem("utm_data");
  const checkoutData = {
    firstName,
    lastName,
    email,
    timestamp: new Date().toISOString(),
    product: product.name,
    amount: product.price,
    currency: product.currency,
    ...(utm ? JSON.parse(utm) : {}), // ⬅️ merge UTMs if available
  };
  localStorage.setItem("checkoutData", JSON.stringify(checkoutData));
};

  // Send webhook to Make.com with checkout initiation data
const sendCheckoutWebhookToMake = async () => {
  try {
    // stable event_id per email/session for dedupe + re-mount safety
    const eidKey = `ic_event_id_${email || 'no_email'}`;
    let eventId = sessionStorage.getItem(eidKey);
    if (!eventId) {
      eventId = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
      sessionStorage.setItem(eidKey, eventId);
    }

    // one-time guard (prevents accidental double-fire)
    const firedKey = `ic_fired_${email || 'no_email'}`;
    if (sessionStorage.getItem(firedKey) === '1') return;
    sessionStorage.setItem(firedKey, '1');

    // helpers for fbp/fbc (improves match)
    const getCookie = (name: string) =>
      document.cookie.split('; ').find(r => r.startsWith(name + '='))?.split('=')[1];
    const getFbc = () => {
      const fbclid = new URL(window.location.href).searchParams.get('fbclid');
      if (fbclid) return `fb.1.${Math.floor(Date.now() / 1000)}.${fbclid}`;
      return getCookie('_fbc');
    };
    const fbp = getCookie('_fbp');
    const fbc = getFbc();



    // TikTok identify + InitiateCheckout with same event_id
const hashedEmail = await hashEmail(email || '');
if (window.ttq) {
  window.ttq.identify?.({ email: hashedEmail });
  ttqTrack('InitiateCheckout', {
    value: Math.round(product.price / 100),
    currency: product.currency || 'USD',
    contents: [{
      content_id: product.id,
      content_type: 'product',
      content_name: product.name,
      price: Math.round(product.price / 100),
      num_items: 1
    }],
    status: 'initiated'
  }, { event_id: eventId });
  console.log('ttq: InitiateCheckout (with event_id) triggered');
}




    // 1) FIRE PIXEL with matching eventID
    if (window.fbq) {
      window.fbq('track', 'InitiateCheckout', {
        currency: product.currency || 'USD',
        value: Math.round(product.price / 100),
        content_type: 'product',
        contents: [{ id: product.id, quantity: 1 }],
        eventID: eventId, // <-- match CAPI
      });
      console.log('fbq: InitiateCheckout (with eventID) triggered');
    }

// 2) SEND TO MAKE (server CAPI) — use snake_case event_id
const webhookPayload = {
  event_name: 'InitiateCheckout',
  event_id: eventId, // <-- snake_case for Make→CAPI
  value: Math.round(product.price / 100),
  currency: product.currency || 'USD',
  fbp,
  fbc,
  user_agent: navigator.userAgent,
  source_url: window.location.href,

  // extra business/meta you already used
  firstName,
  lastName,
  email,
  email_hashed: hashedEmail,
  fullName: `${firstName} ${lastName}`,
  product: product.name,
  productId: product.id,
  priceId: product.priceId,
  amount: product.price, // keep raw cents if you need it in Make
  timestamp: new Date().toISOString(),
  eventType: 'checkout_initiated',
  source: 'veo3factory_frontend',
  referrer: document.referrer || 'direct',

  // ⬅️ NEW: attach UTM info
  ...(utmData || {}),
};

    await fetch('https://hook.eu2.make.com/tunuspfpge3x5e17py3fxjyhb7kpo3qn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify(webhookPayload),
    });
    console.log('Make webhook (IC) sent.');
  } catch (err) {
    console.error('Error during InitiateCheckout tracking:', err);
  }
};




useEffect(() => {
  window.scrollTo(0, 0);
}, []);



// Open “WAIT! WAIT! WAIT!” 1s after load (one-shot via localStorage)
useEffect(() => {
  if (earlySeen) return;
  const id = window.setTimeout(() => {
    setEarlyOpen(true);
  }, 1000); // 1s
  return () => window.clearTimeout(id);
}, [earlySeen]);


  


  useEffect(() => {
    // If user is already logged in and has active subscription, redirect to dashboard
    if (user?.subscription_status === 'active') {
      navigate('/dashboard');
    }
  }, [user, navigate]);





// ▶ Idle popup: show once after 5 min of no typing,
// but only after the early popup has been closed at least once.
// Do not arm while the early popup is open.
useEffect(() => {
  // already shown? or already open? bail
  if (checkoutSeen || checkoutOpen) return;

  // wait until user has *seen/closed* the early popup at least once
  if (!earlySeen) return;

  // don't arm while early popup is currently open
  if (earlyOpen) return;

  // arm a fresh 5 min timer since last input change
  const t = window.setTimeout(() => {
    setCheckoutOpen(true);
    markSeenFor("modal_checkout_until");
    setCheckoutSeen(true);
  }, 300000); // 5 min

  // any keystroke (firstName/lastName/email changes) cancels & restarts
  return () => window.clearTimeout(t);
}, [
  firstName,
  lastName,
  email,
  earlySeen,     // must be closed at least once
  earlyOpen,     // don't run while it's visible
  checkoutSeen,
  checkoutOpen
]);




function closeEarlyAndFocusForm() {
  // ✅ mark ONLY the early popup as seen
  markSeenFor("modal_checkout_early_until");
  setEarlySeen(true);

  // close early + idle popups just in case
  setEarlyOpen(false);
  setCheckoutOpen(false);

  // focus the first missing field
  const first = document.querySelector<HTMLInputElement>('input[placeholder="First Name"]');
  const last  = document.querySelector<HTMLInputElement>('input[placeholder="Last Name"]');
  const mail  = document.querySelector<HTMLInputElement>('input[placeholder="Email"]');

  let target: HTMLInputElement | null = null;
  if (!firstName && first) target = first;
  else if (!lastName && last) target = last;
  else if (!email && mail) target = mail;

  (target ?? first ?? mail)?.scrollIntoView({ behavior: "smooth", block: "center" });
  setTimeout(() => (target ?? first ?? mail)?.focus(), 250);
}




// ✅ Real purchase handler — VALIDATES, sends webhook, then Stripe
async function handlePurchase() {
  // basic validation
  if (!firstName || !lastName || !email || !/.+@.+\..+/.test(email)) {
    setError("Please enter your first name, last name, and a valid email.");
    closeEarlyAndFocusForm(); // also closes any popup & focuses
    return;
  }

  try {
    setLoading(true);
    setError("");

    // make sure popups are “seen” once the user decides to buy
    markSeenFor("modal_checkout_early_until");
    markSeenFor("modal_checkout_until");
    setEarlySeen(true);
    setCheckoutSeen(true);
    setEarlyOpen(false);
    setCheckoutOpen(false);

    // webhook + tracking
    await sendCheckoutWebhookToMake();

    // stash data locally for success page
    storeCheckoutData();

    // create Stripe checkout session
    const checkoutData = {
      price_id: product.priceId,
      success_url: `${window.location.origin}/success`,
      cancel_url: `${window.location.origin}/checkout`,
      mode: product.mode,
      customer_email: email,
      metadata: {
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`,
      },
    };

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(checkoutData),
      }
    );

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Failed to create checkout session");
    if (!data.url) throw new Error("No checkout URL received");

    window.location.href = data.url;
  } catch (err: any) {
    console.error(err);
    setError(err.message || "Something went wrong. Please try again.");
  } finally {
    setLoading(false);
  }
}












  return (
<div className="min-h-screen bg-black text-white" ref={containerRef}>

      
      {/* Yellow Cross */}
<Link
  to="/"
  className="yellow-cross"
  style={{
    position: 'absolute',
    top: '20px',
    left: '20px',
    zIndex: 20,
  }}
>
  <svg
    width="24"
    height="32"
    viewBox="0 0 24 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M10 0H14V10H24V14H14V32H10V14H0V10H10V0Z" fill="#FFD700" />
  </svg>
</Link>


      
      <div className="checkout-container">
        {/* Header */}
        <header className="checkout-header">
          <div className="container">
<Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
  <h1 className="checkout-title" style={{ cursor: 'pointer' }}>
    Fully Automated Social Media Pack
  </h1>
</Link>
          </div>
        </header>

        {/* Main Checkout Content */}
        <main className="checkout-main">
          <div className="container">
            <div className="checkout-grid">
              <div className="features-card">
                <div className="product-header">
                  <h2>WHAT YOU GET</h2>
                </div>

                <div className="product-features">
<ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
  {[
    { text: 'Complete n8n Automation Workflow', value: '650 USD', color: '#4CAF50' },
    { text: 'Step-by-Step Setup Guide', value: '49 USD', color: '#4CAF50' },
    { text: 'Direct Access to Team of AI Automation Experts', value: '1,500 USD', color: '#4CAF50' },
    { text: 'GROK + GPT Integration', value: '🎁 BONUS', color: '#00BFFF' },
    { text: 'Auto-posting to 3 Platforms', value: '🎁 BONUS', color: '#00BFFF' },
    { text: 'Viral ASMR Video Templates', value: '🎁 BONUS', color: '#00BFFF' },
  ].map((item, idx) => (
    <li
      key={idx}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '6px 0',
        fontSize: '15px',
        gap: '12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff' }}>
        <span>✅</span>
        <span>{item.text}</span>
      </div>
      <span style={{ fontWeight: '600', color: item.color }}>{item.value}</span>
    </li>
  ))}

  {/* INVALUABLE ITEM */}
  <li
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '6px 0',
      fontSize: '15px',
      gap: '12px',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff' }}>
      <span>📈</span>
      <span>A Clear Roadmap to Monetization on Social Media</span>
    </div>
    <span style={{ fontWeight: '600', color: '#FFD700' }}>🌟 INVALUABLE</span>
  </li>
</ul>

{/* LINE */}
<div style={{ height: '1px', backgroundColor: '#333', margin: '18px 0' }} />

{/* TOTAL VALUE HIGHLIGHTED BLOCK */}
<div
  style={{
    backgroundColor: '#141414',
    border: '1px solid #FFD700',
    padding: '12px',
    textAlign: 'center',
    fontSize: '20px',
    fontWeight: '800',
    color: '#FFD700',
    borderRadius: '8px',
  }}
>
  TOTAL VALUE: <span style={{ color: '#fff' }}>2,199+ USD</span>
</div>


                </div>






                
              </div>
              

<div className="pricing-card">
  {/* 🔥 Value Stack (sits above the whole pricing breakdown) */}
  <div
    style={{
      background: '#111',
      border: '1px solid #FFD700',
      padding: '12px 16px',
      borderRadius: '8px',
      marginTop: '0',         // flush with card top
      marginBottom: '14px',   // space before the breakdown
      fontSize: '14px',
      color: '#eee'
    }}
  >
    <strong>🔥 2,000+ USD in value — today only 97 USD</strong><br />
    Lifetime access. Automated growth. No catch.
  </div>

  <div className="pricing-breakdown">
    <div className="price-row">
      <span>{product.name}</span>
      <span className="original-price">650 USD</span>
    </div>
    <div className="price-row discount">
      <span>First 100 Members Discount</span>
      <span className="discount-amount">-553 USD</span>
    </div>
    <div className="price-row total">
      <span>Your Price Today</span>
      <span className="final-price">{Math.round(product.price / 100)} USD</span>
    </div>
  </div>




  {/* 🔽 Form */}
  {error && (
    <div className="mb-4 p-3 bg-red-900 border border-red-600 rounded-lg">
      <p className="text-red-200 text-sm">{error}</p>
    </div>
  )}

  <div className="mb-6 space-y-3">
    <input
      type="text"
      placeholder="First Name"
      value={firstName}
      onChange={(e) => setFirstName(e.target.value)}
      className="w-full p-3 rounded-md bg-gray-900 text-white border border-gray-700 placeholder-gray-400"
    />
    <input
      type="text"
      placeholder="Last Name"
      value={lastName}
      onChange={(e) => setLastName(e.target.value)}
      className="w-full p-3 rounded-md bg-gray-900 text-white border border-gray-700 placeholder-gray-400"
    />
    <input
      type="email"
      placeholder="Email"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      className="w-full p-3 rounded-md bg-gray-900 text-white border border-gray-700 placeholder-gray-400"
      required
    />
  </div>

  {/* 💳 CTA Button */}
<button
  onClick={handlePurchase}   // ⬅️ change from goToCheckoutButton
  disabled={loading}
  className="checkout-button w-full"
>

    <span className="button-text">
      {loading ? 'Processing...' : `COMPLETE PURCHASE - ${Math.round(product.price / 100)} USD`}
    </span>

  </button>


  {/* 🔔 Urgency Alert */}
  <div style={{
    background: '#220000',
    border: '1px solid #FF4444',
    borderRadius: '8px',
    padding: '10px 14px',
    textAlign: 'center',
    color: '#FFAAAA',
    fontSize: '13px',
    fontWeight: '600',
    marginBottom: '16px'
  }}>
    🚨 Only <span style={{ fontSize: '16px', color: '#FF6666' }}>16</span> spots left at this price
  </div>
  
  {/* 🧭 What Happens Next */}
  <div style={{
    fontSize: '12px',
    color: '#999',
    marginTop: '16px',
    lineHeight: '1.6'
  }}>
    <strong>🟡 What Happens Next?</strong><br />
    • Redirect to secure Stripe checkout<br />
    • Get instant access to veo3factory & guides<br />
    • Set the system up in the next 30–60 mins<br />
  </div>

  {/* ✅ Trust Signals */}

</div>

            </div>
          </div>
          <style>
  {`
    @media (max-width: 640px) {
      .yellow-cross {
        display: none !important;
      }
    }
  `}
</style>

        </main>

      {/* Footer */}
<footer
  style={{
    background: '#111',
    color: '#aaa',
    padding: '16px 5%',
    fontSize: '13px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '8px',
    borderTop: '1px solid #222',
  }}
>
  {/* Left */}
  <span>
    © 2025 Veo3Factory &nbsp;•&nbsp;
    Contact us at jan@veo3factory.com
  </span>

  {/* Right */}
  <nav style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
    <a href="privacy-policy.html" style={{ color: '#aaa' }}>Privacy</a>
    <a href="cookie-policy.html" style={{ color: '#aaa' }}>Cookies</a>
    <a href="terms-conditions.html" style={{ color: '#aaa' }}>Terms</a>
  </nav>
</footer>
      </div>




{/* NEW: Early “WAIT! WAIT! WAIT!” popup (1s after load) */}
<Modal
  open={earlyOpen}
  onClose={() => { 
    setEarlyOpen(false);
    markSeenFor("modal_checkout_early_until");
    setEarlySeen(true);
  }}
  title=""
>
  <h2 style={{
    textAlign: "center",
    fontSize: "30px",
    fontWeight: 900,
    color: "#FFD700",
    marginBottom: "4px",
    letterSpacing: ".2px"
  }}>
    WAIT! WAIT! WAIT!
  </h2>

  <div style={{
    textAlign: "center",
    fontSize: "15px",
    color: "#ddd",
    marginBottom: "10px"
  }}>
    ⚠️ Don’t buy yet, watch this first!
  </div>

  <div style={{ marginBottom: 14 }}>
    <iframe
      title="Reassurance"
      width="100%"
      height="320"
      src="https://www.youtube.com/embed/dZxinPudpNM?controls=1&rel=0&modestbranding=1"
      allow="encrypted-media; picture-in-picture"
      style={{ border: "none", borderRadius: 12, width: "100%" }}
    />
  </div>

  <div style={{ display: "flex", gap: 10 }}>
<button
  onClick={closeEarlyAndFocusForm}   // ⬅️ was goToCheckoutButton
  className="cta-button primary"
  style={{
    flex: 1,
    padding: "12px 14px",
    background: "linear-gradient(135deg,#FFD700,#EFB600)",
    color: "#000",
    fontWeight: 900,
    borderRadius: 10,
    textTransform: "uppercase",
    letterSpacing: ".02em",
    fontSize: 12
  }}
>
  🚀 Okay, I’m Ready To Go Viral
</button>
  </div>
</Modal>






{/* Existing idle popup (5 min of no typing) — no video, short nudge */}
<Modal
  open={checkoutOpen}
  onClose={() => { setCheckoutOpen(false); markSeenFor("modal_checkout_until"); setCheckoutSeen(true); }}
  title=""
>
  <h2 style={{
    textAlign: "center",
    fontSize: "30px",
    fontWeight: 900,
    color: "#FFD700",
    marginBottom: 8
  }}>
    Almost there — finish your access
  </h2>

  <div style={{
    textAlign: "center",
    fontSize: 16,
    lineHeight: 1.65,
    marginBottom: 16
  }}>
    You’re <span style={{ fontWeight: 800, color: "#FFD700" }}>seconds away</span> from turning on an AI engine that
    creates and posts for you 24/7. Early access is limited so the system stays effective.
    <br />
    <span style={{ fontWeight: 800, color: "#FFD700" }}>Finish your details below</span> to lock it in.
  </div>

  <div style={{ display: "flex", gap: 10 }}>
    <button
      onClick={closeEarlyAndFocusForm}
      className="cta-button primary"
      style={{
        flex: 1,
        padding: "12px 14px",
        background: "linear-gradient(135deg,#FFD700,#EFB600)",
        color: "#000",
        fontWeight: 900,
        borderRadius: 10,
        textTransform: "uppercase",
        letterSpacing: ".02em",
        fontSize: 12
      }}
    >
      Continue checkout
    </button>
  </div>
</Modal>




    </div>
  );
}