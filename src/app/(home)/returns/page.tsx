import { RotateCcw, ShieldAlert, CheckCircle2, Truck, HelpCircle } from "lucide-react";

export const metadata = {
  title: "Return & Refund Policy | InputGears",
  description: "Learn about our 7-day hassle-free return and refund policy at InputGears.",
};

export default function ReturnsPage() {
  return (
    <div className="bg-[#fcfcff] min-h-screen py-12 md:py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-widest">
            <RotateCcw size={14} />
            <span>Hassle-Free Returns</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-gray-900 tracking-tight">
            Return & Refund Policy
          </h1>
          <p className="text-sm sm:text-base text-gray-500 max-w-xl mx-auto font-medium">
            We want you to love your gear. If something isn't right, we offer a straightforward 7-day replacement & refund process.
          </p>
        </div>

        {/* Content Box */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50 p-6 sm:p-10 space-y-8 text-gray-600 leading-relaxed text-sm sm:text-base">
          
          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
              <CheckCircle2 className="text-emerald-600" size={20} />
              1. 7-Day Replacement Guarantee
            </h2>
            <p>
              If your product arrives defective, damaged, or significantly different from what you ordered, you are eligible for a replacement or store refund within <span className="font-bold text-gray-900">7 calendar days</span> from delivery.
            </p>
          </section>

          <hr className="border-gray-100" />

          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
              <ShieldAlert className="text-emerald-600" size={20} />
              2. Return Eligibility Criteria
            </h2>
            <p>To qualify for a valid return or exchange, the product must satisfy the following conditions:</p>
            <ul className="list-disc pl-6 space-y-1.5 font-medium text-gray-700">
              <li>Item must be unused, in its original undamaged box with all accessories included.</li>
              <li>Proof of purchase (Order Invoice or Order Number) must be provided.</li>
              <li>Serial numbers and security seals on the product box must remain intact.</li>
            </ul>
          </section>

          <hr className="border-gray-100" />

          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
              <Truck className="text-emerald-600" size={20} />
              3. Refund & Processing Timeline
            </h2>
            <p>
              Once your returned item is received and inspected at our hub, your refund will be processed within <span className="font-bold text-gray-900">3-5 business days</span>. Refunds are issued back to your original payment method (Stripe card or mobile banking).
            </p>
          </section>

          <hr className="border-gray-100" />

          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
              <HelpCircle className="text-emerald-600" size={20} />
              4. How to Request a Return
            </h2>
            <p>
              To initiate a return request, please contact our support team at <span className="font-bold text-gray-900">support@inputgears.com</span> or submit a request via our Contact Us page with your Order Number and photos/videos of the issue.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
