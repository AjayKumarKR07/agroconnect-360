/**
 * RazorpaySubscriptionCheckout.jsx
 *
 * Handles the Razorpay Subscription checkout flow for AgroConnect 360 farm boxes.
 *
 * Security notes:
 *  - Only the public keyId is used here (secret never reaches the frontend).
 *  - Subscription activation happens ONLY after /api/subscriptions/verify passes on backend.
 *  - Modal dismissal does NOT activate the subscription.
 *  - Duplicate clicks prevented by `processing` state guard + `rzpRef` ref guard.
 *  - Subscription ID is what Razorpay uses, not an order ID.
 *
 * Signature verification formula (subscriptions, different from orders):
 *   Backend verifies: HMAC-SHA256( razorpay_payment_id + "|" + razorpay_subscription_id )
 *
 * This component is completely separate from RazorpayCheckout.jsx (order payments).
 * It does NOT modify the existing order payment flow.
 */

import { useRef, useState, useCallback } from "react";
import { API_URL } from "../config/api";
import { AlertTriangle, Loader2 } from "lucide-react";

const RAZORPAY_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

// Load the Razorpay checkout script once — same pattern as RazorpayCheckout.jsx
const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement("script");
    script.src     = RAZORPAY_SCRIPT;
    script.onload  = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

/**
 * Props:
 *  - planId         {string}   Application plan ID (e.g. "sub-1") — backend validates this
 *  - planName       {string}   Display name for the Razorpay modal description
 *  - userName       {string}
 *  - userEmail      {string}
 *  - userPhone      {string}
 *  - onSuccess      {() => void}         called AFTER backend verify passes
 *  - onFailure      {(err: string) => void}
 *  - onDismiss      {() => void}         called when user closes modal without paying
 *  - children       button content
 *  - disabled       external disable flag
 *  - style          optional inline style for the wrapper button
 *  - className      optional class for the wrapper button
 */
export default function RazorpaySubscriptionCheckout({
  planId,
  planName     = "AgroConnect Farm Box",
  userName     = "",
  userEmail    = "",
  userPhone    = "",
  onSuccess,
  onFailure,
  onDismiss,
  children,
  disabled     = false,
  style        = {},
  className    = "",
}) {
  const token      = localStorage.getItem("agroconnect_token");
  const rzpRef     = useRef(null);    // prevents multiple popup instances
  const [processing, setProcessing] = useState(false);
  const [error,      setError]      = useState("");

  const handleSubscribe = useCallback(async () => {
    if (processing || disabled) return;
    if (rzpRef.current) { rzpRef.current.open(); return; } // reopen existing popup

    setError("");
    setProcessing(true);

    // Step 1: Load Razorpay checkout.js script
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      const msg = "Payment service unavailable. Please check your internet connection.";
      setError(msg);
      onFailure?.(msg);
      setProcessing(false);
      return;
    }

    // Step 2: Backend creates Razorpay Plan (if needed) + Subscription
    //         Amount/frequency are determined server-side from planId — never trusted from frontend
    let subscriptionDbId, razorpaySubscriptionId, keyId, amount, currency;
    try {
      const res = await fetch(`${API_URL}/api/subscriptions/create`, {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({ planId }),  // only the plan ID — backend decides everything else
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to initiate subscription");
      }
      subscriptionDbId       = data.subscriptionDbId;
      razorpaySubscriptionId = data.razorpaySubscriptionId;
      keyId                  = data.keyId;
      amount                 = data.amount;    // paise — for display only
      currency               = data.currency;
    } catch (err) {
      setError(err.message);
      onFailure?.(err.message);
      setProcessing(false);
      return;
    }

    // Step 3: Open Razorpay Checkout in subscription mode
    //         Use subscription_id (NOT order_id) — this triggers the mandate/recurring flow
    const options = {
      key:             keyId,
      subscription_id: razorpaySubscriptionId,  // ← subscription mode: Razorpay handles recurring
      name:            "AgroConnect 360",
      description:     `${planName} — Farm Box Subscription`,
      prefill: {
        name:    userName,
        email:   userEmail,
        contact: userPhone,
      },
      theme: { color: "#0ea5e9" },

      // Called by Razorpay after successful payment/mandate authorisation
      handler: async (response) => {
        rzpRef.current = null;
        setProcessing(true);

        // Step 4: Verify on backend BEFORE showing success to the user
        //         Backend checks HMAC-SHA256( paymentId | subscriptionId )
        try {
          const vRes = await fetch(`${API_URL}/api/subscriptions/verify`, {
            method:  "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization:  `Bearer ${token}`,
            },
            body: JSON.stringify({
              subscriptionDbId,
              razorpayPaymentId:      response.razorpay_payment_id,
              razorpaySubscriptionId: response.razorpay_subscription_id,
              razorpaySignature:      response.razorpay_signature,
            }),
          });
          const vData = await vRes.json();
          if (!vRes.ok || !vData.success) {
            throw new Error(vData.message || "Subscription verification failed");
          }
          // ✅ Backend verified — only now can UI show success
          onSuccess?.();
        } catch (err) {
          const msg = err.message || "Subscription verification failed. Please contact support.";
          setError(msg);
          onFailure?.(msg);
        } finally {
          setProcessing(false);
        }
      },

      // User dismissed the modal without completing payment
      // Subscription stays in "created" state — NOT activated
      modal: {
        ondismiss: () => {
          rzpRef.current = null;
          setProcessing(false);
          onDismiss?.();
          // Do NOT call onSuccess — subscription is NOT active
        },
      },
    };

    try {
      rzpRef.current = new window.Razorpay(options);
      rzpRef.current.on("payment.failed", (response) => {
        rzpRef.current = null;
        const msg = response.error?.description || "Payment failed. Please try again.";
        setError(msg);
        onFailure?.(msg);
        setProcessing(false);
      });
      rzpRef.current.open();
    } catch (err) {
      const msg = "Unable to open payment window. Please try again.";
      setError(msg);
      onFailure?.(msg);
      setProcessing(false);
    }
  }, [planId, planName, processing, disabled, token, userName, userEmail, userPhone, onSuccess, onFailure, onDismiss]);

  return (
    <div>
      {error && (
        <div style={{
          marginBottom: 10,
          padding: "10px 14px",
          background: "rgba(239,68,68,0.08)",
          border: "1px solid rgba(239,68,68,0.2)",
          borderRadius: 10,
          color: "#dc2626",
          fontSize: 13,
          fontWeight: 600,
        }}>
          <AlertTriangle size={14} style={{ verticalAlign: "middle", marginRight: 6 }} />
          {error}{" "}
          <button
            onClick={() => { setError(""); setProcessing(false); rzpRef.current = null; }}
            style={{ background: "none", border: "none", color: "#0369a1", cursor: "pointer", fontSize: 12, fontWeight: 700, marginLeft: 8 }}
          >
            Try again
          </button>
        </div>
      )}
      <button
        onClick={handleSubscribe}
        disabled={disabled || processing}
        style={{
          opacity: disabled || processing ? 0.55 : 1,
          cursor:  disabled || processing ? "not-allowed" : "pointer",
          ...style,
        }}
        className={className}
      >
        {processing ? (
          <>
            <Loader2 size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: 6, animation: "spin 1s linear infinite" }} />
            Processing…
          </>
        ) : children}
      </button>
    </div>
  );
}
