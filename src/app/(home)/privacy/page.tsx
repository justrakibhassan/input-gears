import Metadata from "next";
import { ShieldCheck, Lock, Eye, FileText, Bell } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | InputGears",
  description: "Read our privacy policy to understand how InputGears collects, uses, and protects your personal data.",
};

export default function PrivacyPage() {
  return (
    <div className="bg-[#fcfcff] min-h-screen py-12 md:py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-widest">
            <ShieldCheck size={14} />
            <span>Your Data Security</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-gray-900 tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-sm sm:text-base text-gray-500 max-w-xl mx-auto font-medium">
            Last updated: July 25, 2026. Learn how we handle and protect your information at InputGears.
          </p>
        </div>

        {/* Content Box */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50 p-6 sm:p-10 space-y-8 text-gray-600 leading-relaxed text-sm sm:text-base">
          
          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
              <Eye className="text-indigo-600" size={20} />
              1. Information We Collect
            </h2>
            <p>
              When you browse, create an account, or place an order at InputGears, we collect essential personal information necessary to process your orders and provide a seamless gaming gear experience. This includes:
            </p>
            <ul className="list-disc pl-6 space-y-1.5 font-medium text-gray-700">
              <li>Full Name, Email Address, Phone Number, and Shipping Address.</li>
              <li>Order details and transaction history.</li>
              <li>Technical usage data (IP address, browser type, cookies) for site optimization.</li>
            </ul>
          </section>

          <hr className="border-gray-100" />

          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
              <Lock className="text-indigo-600" size={20} />
              2. How We Protect & Use Your Data
            </h2>
            <p>
              We treat your data with utmost confidentiality. Your personal information is strictly used for order processing, customer support, shipping updates, and occasional promotional communications if opted-in.
            </p>
            <p>
              Payments are securely encrypted and processed via accredited gateway providers like Stripe. InputGears does not store or process raw credit/debit card credentials on our servers.
            </p>
          </section>

          <hr className="border-gray-100" />

          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
              <FileText className="text-indigo-600" size={20} />
              3. Data Sharing & Third Parties
            </h2>
            <p>
              We never sell, rent, or trade your personal data to third-party marketers. We only share essential details with verified logistics partners (delivery services) to ensure your gear arrives promptly at your doorstep.
            </p>
          </section>

          <hr className="border-gray-100" />

          <section className="space-y-3">
            <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
              <Bell className="text-indigo-600" size={20} />
              4. Your Privacy Rights
            </h2>
            <p>
              You have full control over your data. You may request to review, edit, or delete your account data at any time by accessing your Account Settings or contacting our support team at <span className="font-bold text-gray-900">privacy@inputgears.com</span>.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
