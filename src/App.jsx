import React, { useState } from "react";
import { motion } from "framer-motion";

export default function App() {
  const [step, setStep] = useState("form");
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    cardNumber: "",
    expiry: "",
    cvv: "",
    country: "",
    amount: "1499",
    discount: "",
  });
  const [errors, setErrors] = useState({});
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const Logo = () => (
    <svg
      width="160"
      height="40"
      viewBox="0 0 160 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-16 h-6"
    >
      <rect width="160" height="40" rx="4" fill="transparent" />
      <text
        x="6"
        y="28"
        fill="#FFFFFF"
        fontFamily="Inter, Arial, sans-serif"
        fontWeight="700"
        fontSize="28"
      >
        FTUK
      </text>
    </svg>
  );

  const handleChange = (field) => (e) => {
    const raw = e.target.value;
    let value = raw;

    if (field === "cardNumber") {
      value = value.replace(/\D/g, "").slice(0, 19);
      value = value.replace(/(.{4})/g, "$1 ").trim();
    }

    if (field === "expiry") {
      value = value.replace(/[^0-9]/g, "").slice(0, 4);
      if (value.length > 2) value = value.slice(0, 2) + "/" + value.slice(2);
    }

    if (field === "cvv") {
      value = value.replace(/\D/g, "").slice(0, 4);
    }

    if (field === "amount") {
      value = value.replace(/\D/g, "").slice(0, 7);
    }

    setForm((s) => {
      const updated = { ...s, [field]: value };
      const base = 1499;

      if (field === "discount") {
        if (value.trim().toUpperCase() === "POWERUP") {
          updated.amount = String(Math.round(base * 0.65));
        } else {
          updated.amount = String(base);
        }
      }

      if (field === "amount") {
        updated.discount = "";
      }

      return updated;
    });

    setErrors((errs) => ({ ...errs, [field]: undefined }));
  };

  const validate = () => {
    const e = {};

    if (!form.fullName.trim()) e.fullName = "Full name is required";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email))
      e.email = "Enter a valid email";
    if (form.cardNumber.replace(/\s/g, "").length < 13)
      e.cardNumber = "Enter a valid card number";
    if (!/^\d{2}\/\d{2}$/.test(form.expiry))
      e.expiry = "Expiry must be MM/YY";
    if (form.cvv.length < 3) e.cvv = "CVV required";
    if (!form.country) e.country = "Country required";
    if (!form.amount || Number(form.amount) <= 0)
      e.amount = "Enter a valid amount";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (ev) => {
    ev.preventDefault();
    if (!validate()) return;

    setStep("processing");
    setTimeout(() => setStep("complete"), 900);
  };

  const isPowerup =
    form.discount && form.discount.trim().toUpperCase() === "POWERUP";

  async function sendReceipt() {
    if (!form.email) {
      alert("Please provide an email address to send the receipt to.");
      return;
    }

    setSendingEmail(true);
    setEmailSent(false);

    const transactionId = `FTUK-${Math.random()
      .toString(36)
      .slice(2, 9)
      .toUpperCase()}`;

    const receiptHtml = `
      <div style="font-family: Inter, Arial, sans-serif; color:#0b131a;">
        <h2>FTUK â€” Payment Receipt</h2>
        <p>Thank you ${form.fullName || "trader"} for your payment.</p>
        <ul>
          <li>Amount: $${form.amount}</li>
          <li>Transaction ID: ${transactionId}</li>
          <li>Date: ${new Date().toLocaleString()}</li>
        </ul>
      </div>
    `;

    try {
      const payload = {
        to: form.email,
        subject: "FTUK Payment Receipt",
        html: receiptHtml,
        attachPdf: true,
        fullName: form.fullName,
        amount: form.amount,
        transactionId,
      };

      const res = await fetch("/api/send-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("send failed");

      setEmailSent(true);
      alert("Receipt emailed to " + form.email);
    } catch (err) {
      const subject = encodeURIComponent("FTUK Payment Receipt");
      const body = encodeURIComponent(
        `Thank you ${form.fullName || "trader"} for your payment of $${form.amount}.
Transaction ID: ${transactionId}
Date: ${new Date().toLocaleString()}`
      );

      window.location.href = `mailto:${encodeURIComponent(
        form.email
      )}?subject=${subject}&body=${body}`;
    } finally {
      setSendingEmail(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#040A18] text-slate-100 p-6">
      <div className="max-w-2xl w-full">
        <div className="bg-gradient-to-b from-[#061022] to-[#071428] rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-6 sm:p-8">
            {/* HEADER */}
            <header className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Logo />
                <div>
                  <div className="text-lg font-semibold">
                    COMPLETE YOUR ORDER
                  </div>
                  <div className="text-xs text-slate-400">
                    Our pricing is simple with no hidden fees.
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-sm text-slate-400">Secure Payment</div>
                <div className="text-xs text-slate-500">
                  SSL Â· PCI Compliant
                </div>

                <div className="mt-2">
                  {isPowerup ? (
                    <>
                      <div className="text-sm line-through text-slate-500">
                        $1499
                      </div>
                      <div className="text-lg font-semibold text-green-400">
                        ${form.amount}
                      </div>
                    </>
                  ) : (
                    <div className="text-lg font-semibold">${form.amount}</div>
                  )}
                </div>
              </div>
            </header>

            {/* FORM */}
            {step === "form" && (
              <motion.form
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="block">
                    <div className="text-xs text-slate-400 mb-1">
                      Full name
                    </div>
                    <input
                      value={form.fullName}
                      onChange={handleChange("fullName")}
                      className={`w-full rounded-md p-3 bg-[#021027] border ${
                        errors.fullName
                          ? "border-rose-500"
                          : "border-transparent"
                      }`}
                      placeholder="Jane Q. Trader"
                    />
                    {errors.fullName && (
                      <div className="text-rose-400 text-xs mt-1">
                        {errors.fullName}
                      </div>
                    )}
                  </label>

                  <label className="block">
                    <div className="text-xs text-slate-400 mb-1">Email</div>
                    <input
                      value={form.email}
                      onChange={handleChange("email")}
                      className={`w-full rounded-md p-3 bg-[#021027] border ${
                        errors.email ? "border-rose-500" : "border-transparent"
                      }`}
                      placeholder="you@domain.com"
                      type="email"
                    />
                    {errors.email && (
                      <div className="text-rose-400 text-xs mt-1">
                        {errors.email}
                      </div>
                    )}
                  </label>
                </div>

                <div>
                  <div className="text-xs text-slate-400 mb-2">
                    Payment details
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <input
                        value={form.cardNumber}
                        onChange={handleChange("cardNumber")}
                        className={`w-full rounded-md p-3 bg-[#021027] border ${
                          errors.cardNumber
                            ? "border-rose-500"
                            : "border-transparent"
                        }`}
                        placeholder="4242 4242 4242 4242"
                        inputMode="numeric"
                      />
                      {errors.cardNumber && (
                        <div className="text-rose-400 text-xs mt-1">
                          {errors.cardNumber}
                        </div>
                      )}
                    </div>

                    <div>
                      <input
                        value={form.expiry}
                        onChange={handleChange("expiry")}
                        className={`w-full rounded-md p-3 bg-[#021027] border ${
                          errors.expiry
                            ? "border-rose-500"
                            : "border-transparent"
                        }`}
                        placeholder="MM/YY"
                        inputMode="numeric"
                      />
                      {errors.expiry && (
                        <div className="text-rose-400 text-xs mt-1">
                          {errors.expiry}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                    <div>
                      <input
                        value={form.cvv}
                        onChange={handleChange("cvv")}
                        className={`w-full rounded-md p-3 bg-[#021027] border ${
                          errors.cvv ? "border-rose-500" : "border-transparent"
                        }`}
                        placeholder="CVV"
                        inputMode="numeric"
                      />
                      {errors.cvv && (
                        <div className="text-rose-400 text-xs mt-1">
                          {errors.cvv}
                        </div>
                      )}
                    </div>

                    <div className="sm:col-span-2">
                      <select
                        value={form.country}
                        onChange={handleChange("country")}
                        className={`w-full rounded-md p-3 bg-[#021027] border ${
                          errors.country
                            ? "border-rose-500"
                            : "border-transparent"
                        }`}
                      >
                        <option value="">Billing country</option>
                        <option>United Kingdom</option>
                        <option>United States</option>
                        <option>India</option>
                        <option>Germany</option>
                        <option>France</option>
                      </select>
                      {errors.country && (
                        <div className="text-rose-400 text-xs mt-1">
                          {errors.country}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-xs text-slate-400 mb-1">
                    Discount code
                  </div>
                  <input
                    value={form.discount}
                    onChange={handleChange("discount")}
                    className="w-full rounded-md p-3 bg-[#021027] border border-transparent"
                    placeholder="Enter code"
                  />
                  {isPowerup && (
                    <div className="text-sm text-green-400 mt-2">
                      POWERUP applied â€” 35% off
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                  <label className="block sm:col-span-2">
                    <div className="text-xs text-slate-400 mb-1">
                      Amount (USD)
                    </div>
                    <input
                      value={form.amount}
                      onChange={handleChange("amount")}
                      className={`w-full rounded-md p-3 bg-[#021027] border ${
                        errors.amount
                          ? "border-rose-500"
                          : "border-transparent"
                      }`}
                    />
                    {errors.amount && (
                      <div className="text-rose-400 text-xs mt-1">
                        {errors.amount}
                      </div>
                    )}
                  </label>

                  <div className="text-right">
                    <div className="text-xs text-slate-400">
                      You will be charged
                    </div>
                    {isPowerup ? (
                      <>
                        <div className="text-sm line-through text-slate-500">
                          $1499
                        </div>
                        <div className="text-lg font-semibold text-green-400">
                          ${form.amount}
                        </div>
                      </>
                    ) : (
                      <div className="text-lg font-semibold">
                        ${form.amount}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => window.history.back()}
                    className="px-4 py-2 rounded-md bg-transparent border border-slate-700 text-slate-300 text-sm"
                  >
                    Cancel
                  </button>

                  <div className="flex items-center gap-3">
                    <button
                      type="submit"
                      className="px-5 py-3 rounded-lg bg-gradient-to-r from-[#0B6BFF] to-[#7C3AED] text-white font-semibold shadow-lg"
                    >
                      Pay ${form.amount}
                    </button>

                    <button
                      type="button"
                      onClick={sendReceipt}
                      disabled={sendingEmail}
                      className="px-4 py-2 rounded-md bg-transparent border border-slate-700 text-slate-300 text-sm"
                    >
                      {sendingEmail
                        ? "Sendingâ€¦"
                        : emailSent
                        ? "Receipt sent"
                        : "Email receipt"}
                    </button>
                  </div>
                </div>
              </motion.form>
            )}

            {/* PROCESSING */}
            {step === "processing" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-10 text-center"
              >
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#021027] mx-auto mb-4 animate-pulse">
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 6v6l4 2"
                    />
                  </svg>
                </div>
                <div className="text-lg font-medium">Processing payment</div>
                <div className="text-sm text-slate-400 mt-2">
                  Securely communicating with your bank...
                </div>
              </motion.div>
            )}

            {/* COMPLETE */}
            {step === "complete" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-8 text-center"
              >
                <div className="w-28 h-28 rounded-full mx-auto grid place-items-center bg-gradient-to-br from-green-500 to-teal-400 mb-4 shadow-lg">
                  <svg
                    width="36"
                    height="36"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M20 6L9 17l-5-5"
                      stroke="#05231A"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                <h3 className="text-2xl font-semibold">Payment complete</h3>
                <p className="text-slate-400 mt-2">
                  Thank you, {form.fullName || "trader"}! Your payment of $
                  {form.amount} is confirmed.
                </p>

                <div className="mt-6 bg-[#021827] rounded-lg p-4 text-left text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Transaction ID</span>
                    <span>
                      FTUK-
                      {Math.random().toString(36).slice(2, 9).toUpperCase()}
                    </span>
                  </div>

                  <div className="flex justify-between mt-2">
                    <span className="text-slate-400">Date</span>
                    <span>{new Date().toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between mt-2">
                    <span className="text-slate-400">Card</span>
                    <span>â€¢â€¢â€¢â€¢ {form.cardNumber.slice(-4)}</span>
                  </div>
                </div>

                <div className="mt-6 flex gap-3 justify-center">
                  <button
                    onClick={() => sendReceipt()}
                    className="px-4 py-2 rounded-md bg-transparent border border-slate-700 text-slate-300 text-sm"
                  >
                    Email receipt
                  </button>

                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 rounded-md bg-gradient-to-r from-[#0B6BFF] to-[#7C3AED] text-white text-sm"
                  >
                    Make another payment
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          <footer className="border-t border-slate-800 p-4 text-xs text-slate-500 flex items-center justify-between">
            <div>Secure Â· FTUK</div>
            <div>
              Need help?{" "}
              <a className="underline" href="#">
                support@ftuk.com
              </a>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
