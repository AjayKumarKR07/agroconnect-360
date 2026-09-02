/**
 * RazorpayCheckout.jsx
 *
 * Reusable Razorpay payment component.
 *
 * Security notes:
 *  - Only the public keyId is used here (never the secret).
 *  - Success is NOT shown until backend /api/payment/verify passes.
 *  - Dismissal never marks payment as paid.
 *  - Duplicate clicks are prevented by the `processing` state.
 *  - Multiple popups are prevented by the `rzpRef` ref guard.
 *  - Script loading failure is handled gracefully.
 */

import { useRef, useState, useCallback, useEffect } from "react";
import { API_URL } from "../config/api";

const RAZORPAY_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

/**
 * loadRazorpayScript — loads the Razorpay checkout script once.
 * Returns a Promise that resolves true on success, false on failure.
 */
const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT;
    script.onload  = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

/**
 * Props:
 *  - orderId        {string}   MongoDB Order _id
 *  - amount         {number}   order total in INR (display only — backend re-derives from DB)
 *  - orderDesc      {string}   description shown in Razorpay modal
 *  - userName       {string}
 *  - userEmail      {string}
 *  - userPhone      {string}
 *  - onSuccess      {(orderId: string) => void}   called AFTER backend verify passes
 *  - onFailure      {(error: string)  => void}   called on failure (optional)
 *  - children       button content
 *  - disabled       external disable flag
 */
export default function RazorpayCheckout({
  orderId,
  amount,
  orderDesc = "AgroConnect 360 Order",
  userName  = "",
  userEmail = "",
  userPhone = "",
  onSuccess,
  onFailure,
  children,
  disabled = false,
  // preloadedData: { razorpayOrderId, amount, currency, keyId }
  // When provided (e.g. retry flow), skips the /create-order fetch.
  preloadedData = null,
  // verifyEndpoint: override verification URL (default: /api/payment/verify)
  // Used by BuyInputs which has its own InputOrder verify route.
  verifyEndpoint = null,
  // autoOpen: when true, triggers handlePayment on mount (used by BuyInputs
  // invisible-trigger pattern so popup opens without a user click).
  autoOpen = false,
}) {
  const token = localStorage.getItem("agroconnect_token");
  const rzpRef     = useRef(null);   // prevents multiple popup instances
  const [processing, setProcessing] = useState(false);
  const [error,      setError]      = useState("");

  // The actual verify endpoint — default is the main Order verify endpoint.
  // BuyInputs passes its own route to keep the two models cleanly separated.
  const resolvedVerifyEndpoint = verifyEndpoint || `${API_URL}/api/payment/verify`;

  const handlePayment = useCallback(async () => {
    if (processing || disabled) return;
    if (rzpRef.current)  { rzpRef.current.open(); return; } // reopen if already created

    setError("");
    setProcessing(true);

    // 1. Load Razorpay checkout script
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      const msg = "Payment service unavailable. Please check your internet connection.";
      setError(msg);
      onFailure?.(msg);
      setProcessing(false);
      return;
    }

    // 2. Create Razorpay order on backend (amount read from DB there).
    //    Skip this fetch when preloadedData is already available (retry flow).
    let rzpOrderId, keyId, rzpAmount;
    if (preloadedData && preloadedData.razorpayOrderId) {
      // Pre-fetched by caller — use directly, no extra network round-trip
      rzpOrderId = preloadedData.razorpayOrderId;
      keyId      = preloadedData.keyId;
      rzpAmount  = preloadedData.amount;
    } else {
      try {
        const res = await fetch(`${API_URL}/api/payment/create-order`, {
          method:  "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body:    JSON.stringify({ orderId }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || "Failed to initiate payment");
        }
        rzpOrderId = data.razorpayOrderId;
        keyId      = data.keyId;
        rzpAmount  = data.amount; // paise from backend
      } catch (err) {
        setError(err.message);
        onFailure?.(err.message);
        setProcessing(false);
        return;
      }
    }

    // 3. Open Razorpay checkout modal
    const options = {
      key:         keyId,
      amount:      rzpAmount,
      currency:    "INR",
      name:        "AgroConnect 360",
      description: orderDesc,
      order_id:    rzpOrderId,
      prefill: {
        name:    userName,
        email:   userEmail,
        contact: userPhone,
      },
      theme: { color: "#16a34a" },

      // Called by Razorpay on successful payment
      handler: async (response) => {
        rzpRef.current = null; // reset ref
        setProcessing(true);

        // 4. Verify payment on backend before showing success
        try {
          const vRes = await fetch(resolvedVerifyEndpoint, {
            method:  "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body:    JSON.stringify({
              orderId,
              razorpayOrderId:   response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            }),
          });
          const vData = await vRes.json();
          if (!vRes.ok || !vData.success) {
            throw new Error(vData.message || "Payment verification failed");
          }
          onSuccess?.(orderId);
        } catch (err) {
          const msg = err.message || "Payment verification failed. Contact support.";
          setError(msg);
          onFailure?.(msg);
        } finally {
          setProcessing(false);
        }
      },

      // Modal dismissed (user closed without paying) — NOT a payment failure
      modal: {
        ondismiss: () => {
          rzpRef.current = null;
          setProcessing(false);
          // Do NOT call onFailure — user just closed the modal, order stays pending
        },
      },
    };

    try {
      rzpRef.current = new window.Razorpay(options);
      rzpRef.current.on("payment.failed", (response) => {
        rzpRef.current = null;
        const msg = response.error?.description || "Payment failed";
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
  }, [orderId, processing, disabled, token, userName, userEmail, userPhone, orderDesc, onSuccess, onFailure, resolvedVerifyEndpoint]);

  // autoOpen: open the payment popup immediately on mount.
  // Used by BuyInputs where the component is rendered with an invisible child
  // and should open the Razorpay modal automatically as soon as it mounts.
  useEffect(() => {
    if (autoOpen) handlePayment();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty: run once on mount only

  return (
    <div>
      {error && (
        <div style={{
          marginBottom: 10,
          padding: "10px 14px",
          background: "rgba(239,68,68,0.08)",
          border: "1px solid rgba(239,68,68,0.2)",
          borderRadius: 10,
          color: "#f87171",
          fontSize: 13,
          fontWeight: 600,
        }}>
          ⚠️ {error}{" "}
          {/* Always allow retry */}
          <button
            onClick={() => { setError(""); setProcessing(false); rzpRef.current = null; }}
            style={{ background: "none", border: "none", color: "#38bdf8", cursor: "pointer", fontSize: 12, fontWeight: 700, marginLeft: 8 }}
          >
            Try again
          </button>
        </div>
      )}
      <button
        onClick={handlePayment}
        disabled={disabled || processing}
        style={{ opacity: disabled || processing ? 0.55 : 1, cursor: disabled || processing ? "not-allowed" : "pointer" }}
      >
        {processing ? "⏳ Processing…" : children}
      </button>
    </div>
  );
}