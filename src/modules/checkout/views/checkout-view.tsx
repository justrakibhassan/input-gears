"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCart } from "@/modules/cart/hooks/use-cart";
import { useSession } from "@/lib/auth-client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { stripePromise } from "@/lib/stripe";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import {
  CreditCard,
  MapPin,
  Loader2,
  ShieldCheck,
  User,
  Phone,
  Mail,
  ShoppingCart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import CheckoutSkeleton from "../components/checkout-skeleton";
import { placeOrder, validateCoupon } from "../actions";
import { Tag, X, CheckCircle2, Ticket } from "lucide-react";

const checkoutSchema = z.object({
  fullName: z.string().min(2, "Name is required"),
  phone: z.string().min(11, "Valid phone number required"),
  email: z.string().email("Valid email is required"),
  address: z.string().min(10, "Full shipping address is required"),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

interface ShippingZone {
  id: string;
  name: string;
  charge: number;
}

export default function CheckoutForm() {
  const cart = useCart();
  const { isPending: sessionPending } = useSession();
  const [clientSecret, setClientSecret] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (cart.items.length > 0) {
      fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.items.map((item) => ({
            id: item.id,
            quantity: item.quantity,
          })),
        }),
      })
        .then(async (res) => {
          const data = await res.json().catch(() => null);
          if (!res.ok) {
            toast.error(data?.error || "Failed to start payment");
            setClientSecret("");
            return;
          }
          setClientSecret(data?.clientSecret || "");
        })
        .catch(() => {
          toast.error("Failed to start payment");
          setClientSecret("");
        });
    }
  }, [cart.items]);

  const options = {
    clientSecret,
    appearance: { theme: "stripe" as const },
  };

  if (isSuccess) {
    return <CheckoutSkeleton />;
  }

  if (cart.items.length === 0) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-6 animate-in fade-in zoom-in duration-500">
        <div className="bg-gray-100 p-6 rounded-full">
          <ShoppingCart size={48} className="text-gray-400" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-gray-900">
            Your cart is empty
          </h2>
          <p className="text-gray-500 max-w-sm mx-auto">
            Looks like you haven&apos;t added anything to your cart yet.
          </p>
        </div>
        <Link
          href="/products"
          className="px-8 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-indigo-600 transition-colors"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  if (sessionPending || !clientSecret) {
    return <CheckoutSkeleton />;
  }

  return (
    <Elements options={options} stripe={stripePromise}>
      <CheckoutContent
        onPaymentSuccess={() => setIsSuccess(true)}
      />
    </Elements>
  );
}

function CheckoutContent({
  onPaymentSuccess,
}: {
  onPaymentSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const cart = useCart();
  const { data: session } = useSession();
  const router = useRouter();

  const [paymentMethod, setPaymentMethod] = useState<"cod" | "stripe">("cod");
  const [isProcessing, setIsProcessing] = useState(false);

  // --- Coupon State ---
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    id: string;
    code: string;
    type: string;
    value: number;
  } | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // --- Shipping & Tax State ---
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<string>("");
  const [taxRate, setTaxRate] = useState(0);

  useEffect(() => {
    fetch("/api/checkout-settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.zones) setZones(data.zones);
        if (data.taxRate) setTaxRate(data.taxRate);
      })
      .catch(console.error);
  }, []);

  const subtotal = cart.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const discountAmount = appliedCoupon
    ? appliedCoupon.type === "PERCENTAGE"
      ? subtotal * (appliedCoupon.value / 100)
      : appliedCoupon.value
    : 0;

  const selectedZone = zones.find((z) => z.id === selectedZoneId);
  const shipping = selectedZone ? selectedZone.charge : (subtotal > 1000 ? 0 : 60);
  const taxAmount = (subtotal - discountAmount) * (taxRate / 100);
  const total = Math.max(0, subtotal - discountAmount + shipping + taxAmount);

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setIsValidating(true);
    try {
      const res = await validateCoupon(couponCode);
      if (res.success && res.coupon) {
        setAppliedCoupon(res.coupon as { id: string; code: string; type: string; value: number });
        toast.success(`Coupon "${res.coupon.code}" applied!`);
      } else {
        toast.error(res.message || "Invalid coupon");
      }
    } catch {
      toast.error("Failed to validate coupon");
    } finally {
      setIsValidating(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
  };

  const form = useForm({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      address: "",
      email: "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (session?.user) {
      form.setValue("fullName", session.user.name);
      form.setValue("email", session.user.email);
    }
  }, [session, form]);

  const onSubmit = async (data: CheckoutFormValues) => {
    setIsProcessing(true);

    try {
      if (paymentMethod === "cod") {
        const result = await placeOrder(
          data, 
          cart.items, 
          "cod", 
          undefined, 
          appliedCoupon?.code,
          selectedZoneId
        );

        if (result.success) {
          onPaymentSuccess();
          cart.clearCart();
          router.push(`/order-confirmation/${result.orderId}`);
        } else {
          toast.error(result.error || "Failed to place order.");
          setIsProcessing(false);
        }
      } else {
        if (!stripe || !elements) return;

        const { error, paymentIntent } = await stripe.confirmPayment({
          elements,
          redirect: "if_required",
        });

        if (error) {
          toast.error(error.message || "Payment failed");
          setIsProcessing(false);
        } else if (paymentIntent && paymentIntent.status === "succeeded") {
          toast.success("Payment Successful!");

          const result = await placeOrder(
            data,
            cart.items,
            "stripe",
            paymentIntent.id,
            appliedCoupon?.code,
            selectedZoneId
          );

          if (result.success) {
            onPaymentSuccess();
            cart.clearCart();
            router.push(`/order-confirmation/${result.orderId}`);
          } else {
            toast.error(
              `Payment success but order save failed. ID: ${paymentIntent.id}`
            );
            setIsProcessing(false);
          }
        }
      }
    } catch (_error) {
      console.error(_error);
      toast.error("Something went wrong.");
      setIsProcessing(false);
    }
  };

  const isFormValid = form.formState.isValid;

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Secure Checkout</h1>

      <div className="lg:grid lg:grid-cols-12 lg:gap-12 items-start">
        <div className="lg:col-span-7 space-y-8">
          <form id="checkout-form" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                <MapPin className="text-indigo-600" />
                <h2 className="text-xl font-bold text-gray-900">
                  Delivery Details
                </h2>
              </div>
              <div className="space-y-5">
                <div className="relative">
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                    Full Name
                  </label>
                  <div className="relative">
                    <User
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                    <input
                      {...form.register("fullName")}
                      className={cn(
                        "w-full rounded-xl border-gray-200 border bg-gray-50/30 pl-11 pr-4 py-3 text-sm outline-none focus:border-indigo-500 transition-all",
                        form.formState.errors.fullName && "border-red-500"
                      )}
                      placeholder="Enter full name"
                    />
                  </div>
                </div>
                <div className="relative">
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                    Phone
                  </label>
                  <div className="relative">
                    <Phone
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                    <input
                      {...form.register("phone")}
                      className={cn(
                        "w-full rounded-xl border-gray-200 border bg-gray-50/30 pl-11 pr-4 py-3 text-sm outline-none focus:border-indigo-500 transition-all",
                        form.formState.errors.phone && "border-red-500"
                      )}
                      placeholder="017..."
                    />
                  </div>
                </div>
                <div className="relative">
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                    <input
                      {...form.register("email")}
                      type="email"
                      className={cn(
                        "w-full rounded-xl border-gray-200 border bg-gray-50/30 pl-11 pr-4 py-3 text-sm outline-none focus:border-indigo-500 transition-all",
                        form.formState.errors.email && "border-red-500"
                      )}
                      placeholder="Enter your email"
                    />
                  </div>
                  {!session && (
                    <p className="mt-1.5 text-[10px] text-gray-400 font-medium">
                      Guest checkout. We&apos;ll use this to send your order confirmation.
                    </p>
                  )}
                </div>
                <div className="relative">
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                    Address
                  </label>
                  <textarea
                    {...form.register("address")}
                    rows={2}
                    className={cn(
                      "w-full rounded-xl border-gray-200 border bg-gray-50/30 px-4 py-3 text-sm outline-none focus:border-indigo-500 transition-all resize-none",
                      form.formState.errors.address && "border-red-500"
                    )}
                    placeholder="House, Road, City..."
                  />
                </div>

                {/* Shipping Zone Selection */}
                <div className="relative">
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                    Shipping Zone
                  </label>
                  <select
                    value={selectedZoneId}
                    onChange={(e) => setSelectedZoneId(e.target.value)}
                    className="w-full rounded-xl border-gray-200 border bg-gray-50/30 px-4 py-3 text-sm outline-none focus:border-indigo-500 transition-all cursor-pointer"
                  >
                    <option value="">Select Shipping Zone (Default)</option>
                    {zones.map((zone) => (
                      <option key={zone.id} value={zone.id}>
                        {zone.name} (${zone.charge.toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm mt-8">
              <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                <CreditCard size={20} className="text-indigo-600" />
                <h2 className="text-xl font-bold text-gray-900">
                  Payment Method
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  onClick={() => setPaymentMethod("cod")}
                  className={cn(
                    "relative p-5 border-2 rounded-2xl cursor-pointer transition-all flex items-start gap-4 hover:shadow-md",
                    paymentMethod === "cod"
                      ? "border-gray-900 bg-gray-50/50"
                      : "border-gray-100 bg-white"
                  )}
                >
                  <div
                    className={cn(
                      "h-5 w-5 rounded-full border-2 flex items-center justify-center mt-1 shrink-0",
                      paymentMethod === "cod"
                        ? "border-gray-900"
                        : "border-gray-300"
                    )}
                  >
                    {paymentMethod === "cod" && (
                      <div className="h-2.5 w-2.5 bg-gray-900 rounded-full" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">
                      Cash On Delivery
                    </h3>
                    <p className="text-sm text-gray-500">
                      Pay when you receive
                    </p>
                  </div>
                </div>

                <div
                  onClick={() => setPaymentMethod("stripe")}
                  className={cn(
                    "relative p-5 border-2 rounded-2xl cursor-pointer transition-all flex items-start gap-4 hover:shadow-md",
                    paymentMethod === "stripe"
                      ? "border-indigo-600 bg-indigo-50/50"
                      : "border-gray-100 bg-white"
                  )}
                >
                  <div
                    className={cn(
                      "h-5 w-5 rounded-full border-2 flex items-center justify-center mt-1 shrink-0",
                      paymentMethod === "stripe"
                        ? "border-indigo-600"
                        : "border-gray-300"
                    )}
                  >
                    {paymentMethod === "stripe" && (
                      <div className="h-2.5 w-2.5 bg-indigo-600 rounded-full" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Online Payment</h3>
                    <p className="text-sm text-gray-500">Cards / Stripe</p>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        <div className="lg:col-span-5 mt-8 lg:mt-0 relative">
          <div className="sticky top-24">
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-xl shadow-gray-200/50 relative overflow-hidden">
              <h2 className="text-xl font-bold text-gray-900 mb-6 relative z-10">
                Order Summary
              </h2>

              <div className="space-y-4 max-h-[240px] overflow-y-auto custom-scrollbar pr-2 mb-6">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex gap-4 items-center">
                    <div className="h-14 w-14 bg-gray-50 rounded-xl relative overflow-hidden shrink-0 border border-gray-100">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                          No Img
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium truncate">
                        {item.name}
                      </h4>
                      <p className="text-xs text-gray-500">
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <p className="text-sm font-bold">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Coupon Section */}
              <div className="mb-6">
                {!appliedCoupon ? (
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Ticket size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="Promo Code"
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-indigo-500 transition-all font-medium uppercase placeholder:normal-case"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={!couponCode || isValidating}
                      className="px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-bold disabled:bg-gray-200 disabled:text-gray-400 transition-all hover:bg-indigo-600 min-w-[80px] flex items-center justify-center"
                    >
                      {isValidating ? <Loader2 size={16} className="animate-spin" /> : "Apply"}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-100 rounded-xl animate-in zoom-in-95 duration-200">
                    <div className="flex items-center gap-2 text-emerald-700">
                      <CheckCircle2 size={18} />
                      <div>
                        <p className="text-xs font-bold leading-tight uppercase">{appliedCoupon.code}</p>
                        <p className="text-[10px] opacity-70">Coupon Applied Successfully</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeCoupon}
                      className="p-1.5 hover:bg-emerald-100 rounded-lg text-emerald-600 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-3 border-t border-dashed border-gray-200 pt-6 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>

                {appliedCoupon && (
                  <div className="flex justify-between text-emerald-600 font-medium animate-in slide-in-from-right-2">
                    <div className="flex items-center gap-1">
                      <Tag size={14} />
                      <span>Discount ({appliedCoupon.code})</span>
                    </div>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? "Free" : `$${shipping}`}</span>
                </div>

                {taxRate > 0 && (
                  <div className="flex justify-between text-gray-400">
                    <span>VAT/Tax ({taxRate}%)</span>
                    <span>${taxAmount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between items-end pt-3 border-t border-gray-100 mt-3">
                  <span className="text-base font-bold">Total</span>
                  <span className="text-2xl font-extrabold text-indigo-600">
                    ${total.toFixed(2)}
                  </span>
                </div>
              </div>

              {paymentMethod === "stripe" && (
                <div className="mt-6 p-4 bg-white rounded-xl border border-indigo-200 shadow-inner animate-in fade-in">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 block">
                    Card Information
                  </label>
                  <PaymentElement
                    id="payment-element"
                    options={{ layout: "tabs" }}
                  />
                </div>
              )}

              <button
                type="submit"
                form="checkout-form"
                disabled={
                  isProcessing ||
                  !isFormValid ||
                  (!stripe && paymentMethod === "stripe")
                }
                className={cn(
                  "w-full mt-6 py-4 rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center",
                  isProcessing || !isFormValid
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-gray-900 text-white hover:bg-indigo-600 hover:shadow-indigo-500/30 active:scale-[0.98]"
                )}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="animate-spin mr-2" /> Processing...
                  </>
                ) : paymentMethod === "cod" ? (
                  "Confirm Order"
                ) : (
                  `Pay $${total.toFixed(2)}`
                )}
              </button>

              <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400 bg-gray-50 py-2 rounded-lg">
                <ShieldCheck size={14} /> <span>Secure Encrypted Checkout</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
