import Link from "next/link";
import { Clock, Home, Mail } from "lucide-react";

/**
 * Landing for the rare case where payment succeeded but the browser couldn't
 * finish creating the order. The Stripe webhook completes it server-side, so
 * this reassures the customer instead of showing a payment error.
 */
export default function OrderPendingPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full text-center bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50 p-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 mb-5">
          <Clock className="h-8 w-8 text-amber-600" strokeWidth={2.5} />
        </div>

        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
          Payment received
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-gray-600">
          Your payment went through and we&apos;re finalising your order now. This
          usually takes a few seconds.
        </p>

        <div className="mt-6 flex items-start gap-3 rounded-2xl bg-gray-50 p-4 text-left">
          <Mail size={18} className="mt-0.5 shrink-0 text-gray-500" />
          <p className="text-xs leading-relaxed text-gray-600">
            A confirmation email with your order number is on its way. You can
            also find the order in your account once it&apos;s ready.
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/account/orders"
            className="flex-1 rounded-xl bg-gray-950 px-6 py-3 font-bold text-white transition-all hover:bg-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          >
            View my orders
          </Link>
          <Link
            href="/"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 px-6 py-3 font-medium text-gray-700 transition-all hover:border-indigo-300 hover:text-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          >
            <Home size={18} /> Home
          </Link>
        </div>
      </div>
    </div>
  );
}
