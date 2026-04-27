"use client";

import { MetricEventType } from "@prisma/client";

type Props = {
  href: string;
  vehicleId: string;
  eventType: keyof typeof MetricEventType;
  className?: string;
  children: React.ReactNode;
};

export default function TrackedLink({ href, vehicleId, eventType, className, children }: Props) {
  function handleClick() {
    const body = JSON.stringify({ vehicleId, eventType });
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }));
    } else {
      fetch("/api/track", { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true }).catch(() => {});
    }
  }
  return (
    <a href={href} onClick={handleClick} className={className} rel="nofollow">
      {children}
    </a>
  );
}
