import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../../styles.css';


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



// Hash function to SHA-256 the email for CAPI
async function hashEmail(email: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(email.trim().toLowerCase());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function SuccessPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const userAgent = navigator.userAgent;
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const checkoutData = JSON.parse(localStorage.getItem('checkoutData') || '{}');







// stable event_id per Stripe session (or per visit if no session_id)
const getOrCreatePurchaseEventId = () => {
  const key = `purchase_event_id_${sessionId || 'no_session'}`;
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    sessionStorage.setItem(key, id);
  }
  return id;
};
const eventId = getOrCreatePurchaseEventId();

// helpers for fbp/fbc (improves match + attribution)
const getCookie = (name: string) =>
  document.cookie.split('; ').find(r => r.startsWith(name + '='))?.split('=')[1];

const getFbc = () => {
  const url = new URL(window.location.href);
  const fbclid = url.searchParams.get('fbclid');
  if (fbclid) return `fb.1.${Math.floor(Date.now() / 1000)}.${fbclid}`;
  return getCookie('_fbc');
};

const fbp = getCookie('_fbp');
const fbc = getFbc();






const hasCheckoutData = checkoutData?.email && checkoutData?.amount;









const sendWebhookToMake = async () => {
  try {
    const hashedEmail = await hashEmail(checkoutData.email);

    const webhookPayload = {
      event_name: 'Purchase',
      event_id: eventId,

      fbp,
      fbc,
      user_agent: userAgent,

      firstName: checkoutData.firstName,
      lastName: checkoutData.lastName,
      email: checkoutData.email,
      email_hashed: hashedEmail,
      fullName: `${checkoutData.firstName} ${checkoutData.lastName}`,
      product: checkoutData.product,
      value: Math.round(checkoutData.amount / 100) || 97,
      currency: checkoutData.currency || 'USD',
      timestamp: checkoutData.timestamp,
      sessionId: sessionId,
      successPageTimestamp: new Date().toISOString(),
      source: 'veo3factory_frontend',

      // include UTMs if available
      utm_source: checkoutData.utm_source || null,
      utm_medium: checkoutData.utm_medium || null,
      utm_campaign: checkoutData.utm_campaign || null,
      utm_content: checkoutData.utm_content || null,
    };

    await fetch('https://hook.eu2.make.com/rxn2ecayvl5bcwc5fexe82vbgx9sp71i', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify(webhookPayload),
    });
  } catch (error) {
    console.error('Error sending webhook to Make.com:', error);
  }
};










// Fire TikTok + Meta Purchase with the same event_id and hashed email
useEffect(() => {
  const firedKey = `purchaseFired_${sessionId || 'no_session'}`;
  const alreadyFired = sessionStorage.getItem(firedKey);

  if (!alreadyFired && hasCheckoutData) {
    (async () => {
      const value = Math.round(checkoutData.amount / 100) || 97;
      const currency = checkoutData.currency || 'USD';

      // hash email for identify
      const hashedEmail = await hashEmail(checkoutData.email || '');

      // TikTok: identify + Purchase with same event_id
      if (window.ttq) {
        window.ttq.identify?.({ email: hashedEmail });
        ttqTrack('Purchase', {
          value,
          currency,
          contents: [{
            content_id: checkoutData.product || 'veo3factory',
            content_type: 'product',
            content_name: checkoutData.product || 'Veo3Factory Lifetime',
            price: value,
            num_items: 1
          }],
          status: 'paid'
        }, { event_id: eventId });
        console.log('ttq: Purchase event sent');
      }

      // Meta: Purchase with same eventID
      if (typeof window.fbq !== 'undefined') {
        window.fbq('track', 'Purchase', {
          value,
          currency,
          eventID: eventId,
          utm_source: checkoutData.utm_source,
          utm_medium: checkoutData.utm_medium,
          utm_campaign: checkoutData.utm_campaign,
          utm_content: checkoutData.utm_content,
        });
        console.log('fbq: Purchase event sent');
      }

      // CAPI webhook (already uses hashed email)
      await sendWebhookToMake();

      // de-dupe
      sessionStorage.setItem(firedKey, 'true');
    })();
  } else {
    console.log('Purchase event already fired or no checkout data.');
  }
}, [sessionId]);







  useEffect(() => {
  if (!hasCheckoutData) {
    window.location.href = '/';
  }
}, []);





  



  return (
    <div className="min-h-screen bg-black text-white">
      {/* Yellow Cross */}
      <Link to="/" className="yellow-cross">
        <svg width="24" height="32" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 0H14V10H24V14H14V32H10V14H0V10H10V0Z" fill="#FFD700"/>
        </svg>
      </Link>
      
      {/* Success Hero Section */}
      <section className="hero-section">
        <div className="container">
          <h1 className="hero-headline">
            <span className="highlight">PAYMENT SUCCESSFUL!</span><br />
            Welcome to the Future
          </h1>
          
          <div className="video-container">
            <div className="video-placeholder large">
              <div className="success-checkmark">
                <svg width="120" height="120" viewBox="0 0 120 120" fill="none" style={{ filter: 'drop-shadow(0 0 20px rgba(76, 175, 80, 0.5))' }}>
                  <circle cx="60" cy="60" r="60" fill="#4CAF50"/>
                  <path d="M35 60L50 75L85 40" stroke="white" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="video-text">Your veo3factory is ready!</p>
            </div>
          </div>
          
          <p className="hero-subtext">
            Thank you for your purchase! You now have access to the complete AI automation system that will transform your social media presence forever.
          </p>
        </div>
      </section>

      {/* What You Get Section */}
      <section className="use-cases-section section-bg-blue">
        <div className="container">
          <h2 className="section-headline">
            <span className="highlight">YOU NOW HAVE ACCESS TO</span>
          </h2>
          
          <div className="testimonials-grid">
            <div className="testimonial-card">
              <div className="stars">✅ DELIVERED</div>
              <h3 style={{ color: '#FFD700', fontSize: '20px', fontWeight: '700', marginBottom: '16px' }}>Complete Automation System</h3>
              <p>Your n8n workflow, VEO 3 setup, and all automation files are being sent to your email right now.</p>
            </div>
            
            <div className="testimonial-card">
              <div className="stars">✅ INCLUDED</div>
              <h3 style={{ color: '#FFD700', fontSize: '20px', fontWeight: '700', marginBottom: '16px' }}>Setup Guides & Support</h3>
              <p>Step-by-step instructions, video tutorials, and direct access to our expert automation team.</p>
            </div>
            
            <div className="testimonial-card">
              <div className="stars">✅ READY</div>
              <h3 style={{ color: '#FFD700', fontSize: '20px', fontWeight: '700', marginBottom: '16px' }}>24/7 Viral Content</h3>
              <p>Your AI will start creating and posting viral ASMR videos every 8 hours, completely automatically.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Next Steps Section */}
      <section className="social-proof-section section-bg-purple">
        <div className="container">
          <h2 className="section-headline">
            <span className="highlight">NEXT STEPS</span> - GET STARTED NOW
          </h2>
          
          <div className="fomo-content" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className="fomo-text">
              <p className="value-prop" style={{ fontSize: '20px', marginBottom: '24px' }}>
                <span className="highlight">STEP 1:</span> Check your email (including SPAM folder) for your automation files
              </p>
              <p className="social-proof" style={{ fontSize: '18px', marginBottom: '24px' }}>
                <span className="highlight">STEP 2:</span> Follow the setup guide to connect your API keys
              </p>
              <p className="urgency-text" style={{ fontSize: '18px', marginBottom: '32px' }}>
                <span className="highlight">STEP 3:</span> Watch your social media accounts grow automatically
              </p>
            </div>
            
            <div className="countdown-timer">
              <div className="timer-label">🎯 Your automation will be live within:</div>
              <div className="timer-display">
                <div className="time-unit">
                  <span>30</span>
                  <label>Minutes</label>
                </div>
                <div className="time-unit">
                  <span>Setup</span>
                  <label>Time</label>
                </div>
                <div className="time-unit">
                  <span>∞</span>
                  <label>Results</label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Support Section */}
      <section className="video-usecase-section section-bg-green">
        <div className="container">
          <h2 className="section-headline">
            <span className="highlight">NEED HELP?</span> WE'VE GOT YOU
          </h2>
          
          <div className="video-container">
            <div className="video-placeholder">
              <div className="play-button">
      {/* 
               <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                  <circle cx="40" cy="40" r="40" fill="#FFD700"/>
                  <path d="M30 35L50 45L30 55V35Z" fill="#000000"/>
                </svg>
      */}
              </div>
              <p className="video-text">Watch setup tutorial - link in email</p>
            </div>
          </div>
          
          <p className="section-description">
            Our expert team is standing by to help you get your automation system running perfectly. 
            Contact us at <strong style={{ color: '#FFD700' }}>jan@veo3factory.com</strong> for immediate assistance.
          </p>
          
          <Link to="/" className="cta-button primary">
            BACK TO HOMEPAGE
          </Link>
        </div>
      </section>

      {/* Final Message Section */}
      <section className="fomo-section">
        <div className="container">
          <h2 className="section-headline">
            <span className="highlight">CONGRATULATIONS!</span> YOU'RE IN
          </h2>
          
          <div className="fomo-content">
            <div className="price-comparison">
              <div className="old-price">
                <span className="label">You Saved</span>
                <span className="price">553 USD</span>
              </div>
              <div className="new-price">
                <span className="label">You Paid</span>
                <span className="price highlight">97 USD</span>
              </div>
            </div>
            
            <div className="fomo-text">
              <p className="final-warning" style={{ fontSize: '24px', textAlign: 'center' }}>
                You're now part of an <span className="highlight">exclusive group</span> of creators who are using AI to dominate social media.
              </p>
              <p className="social-proof" style={{ textAlign: 'center', marginTop: '24px' }}>
                While others struggle to create content manually, your AI will be working <strong>24/7</strong> to grow your following and generate income.
              </p>
            </div>
          </div>
        </div>
      </section>

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
  );
}