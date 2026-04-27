"use client";

import { useState } from "react";

const LeadType = {
  ENQUIRY: "ENQUIRY",
  TEST_DRIVE: "TEST_DRIVE",
  FINANCE: "FINANCE",
  TRADE_IN: "TRADE_IN",
  CALL_BACK: "CALL_BACK",
} as const;

export default function EnquiryForm({ vehicleId, stockNumber }: { vehicleId: string; stockNumber: string }) {
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<null | "ok" | "err">(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    const fd = new FormData(e.currentTarget);
    const payload = Object.fromEntries(fd.entries());
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, vehicleId }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `Request failed (${res.status})`);
      }
      setDone("ok");
    } catch (err: unknown) {
      setDone("err");
      setErrorMsg(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSubmitting(false);
    }
  }

  if (done === "ok") {
    return (
      <div className="mt-3 rounded-md bg-green-50 p-3 text-sm text-green-800">
        Thanks — we&apos;ll be in touch shortly about stock {stockNumber}.
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-3 grid gap-3">
      {/* honeypot */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" />

      <div className="grid gap-1">
        <label htmlFor="customerName">Your name</label>
        <input id="customerName" name="customerName" required maxLength={120} />
      </div>
      <div className="grid gap-1">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" maxLength={200} />
      </div>
      <div className="grid gap-1">
        <label htmlFor="phone">Phone</label>
        <input id="phone" name="phone" maxLength={40} />
      </div>
      <div className="grid gap-1">
        <label htmlFor="leadType">Enquiry type</label>
        <select id="leadType" name="leadType" defaultValue={LeadType.ENQUIRY}>
          <option value={LeadType.ENQUIRY}>General enquiry</option>
          <option value={LeadType.TEST_DRIVE}>Book a test drive</option>
          <option value={LeadType.FINANCE}>Finance enquiry</option>
          <option value={LeadType.TRADE_IN}>Trade-in valuation</option>
          <option value={LeadType.CALL_BACK}>Request a call back</option>
        </select>
      </div>
      <div className="grid gap-1">
        <label htmlFor="message">Message</label>
        <textarea id="message" name="message" rows={4} maxLength={2000} placeholder={`I'd like to know more about stock ${stockNumber}.`} />
      </div>
      <label className="flex items-start gap-2 text-xs text-slate-600">
        <input type="checkbox" name="consentMarketing" value="true" className="!mt-1" />
        <span>I consent to marketing communications. Read our <a href="/privacy">privacy policy</a>.</span>
      </label>

      <button type="submit" className="primary" disabled={submitting}>
        {submitting ? "Sending…" : "Send enquiry"}
      </button>

      {done === "err" && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
          Sorry — could not send. {errorMsg ?? ""}
        </div>
      )}
    </form>
  );
}
