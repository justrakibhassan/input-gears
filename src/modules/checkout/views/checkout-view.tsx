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

interface AppliedCoupon {
  id: string;
  code: string;
  type: string;
  value: number;
}

interface Quote {
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
  taxRate: number;
  couponCode: string | null;
  couponError: string | null;
}

const money = (cents: number) => (cents / 100).toFixed(2);

export default function CheckoutForm() {
  const cart = useCart();
  const { isPending: sessionPending } = useSession();
  const [clientSecret, setClientSecret] = useState("");
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [intentError, setIntentError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState<"cod" | "stripe">("cod");
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<string>("");
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [quote, setQuote] = useState<Quote | null>(null);

  useEffect(() => {
    fetch("/api/checkout-settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.zones) setZones(data.zones);
      })
      .catch(() => {
        /* zone list is optional — the server falls back to flat-rate shipping */
      });
  }, []);

  const orderPayload = cart.items.map((item) => ({
    id: item.id,
    quantity: item.quantity,
  }));
  // Stringified so the effects below re-run on real cart changes, not on every
  // render's fresh array identity.
  const cartKey = JSON.stringify(orderPayload);

  // The summary must show server-computed money, or it can disagree with the
  // amount Stripe actually captures.
  useEffect(() => {
    if (cart.items.length === 0) {
      setQuote(null);
      return;
    }

    let cancelled = false;

    fetch("/api/checkout-quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: JSON.parse(cartKey),
        couponCode: appliedCoupon?.code,
        shippingZoneId: selectedZoneId || undefined,
      }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (cancelled) return;
        if (!res.ok) {
          toast.error(data?.error || "Could not price your cart");
          return;
        }
        setQuote(data);
        if (data.couponError && appliedCoupon) {
          toast.error(data.couponError);
          setAppliedCoupon(null);
        }
      })
      .catch(() => {
        if (!cancelled) toast.error("Could not price your cart");
      });

    return () => {
      cancelled = true;
    };
  }, [cartKey, appliedCoupon, selectedZoneId, cart.items.length]);

  // Only card payments need an intent, and its amount must track the quote.
  useEffect(() => {
    if (paymentMethod !== "stripe" || cart.items.length === 0) return;

    let cancelled = false;
    setIntentError(null);

    fetch("/api/create-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: JSON.parse(cartKey),
        couponCode: appliedCoupon?.code,
        shippingZoneId: selectedZoneId || undefined,
        paymentIntentId: paymentIntentId ?? undefined,
      }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (cancelled) return;
        if (!res.ok) {
          setIntentError(data?.error || "Failed to start payment");
          return;
        }
        setClientSecret(data?.clientSecret || "");
        setPaymentIntentId(data?.paymentIntentId ?? null);
      })
      .catch(() => {
        if (!cancelled) setIntentError("Failed to start payment");
      });

    return () => {
      cancelled = true;
    };
    // paymentIntentId is intentionally omitted: it's an output of this effect,
    // and including it would loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartKey, appliedCoupon, selectedZoneId, paymentMethod, cart.items.length]);

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

  if (sessionPending || !quote) {
    return <CheckoutSkeleton />;
  }

  const shared = {
    onPaymentSuccess: () => setIsSuccess(true),
    paymentMethod,
    setPaymentMethod,
    appliedCoupon,
    setAppliedCoupon,
    zones,
    selectedZoneId,
    setSelectedZoneId,
    quote,
    paymentIntentId,
    intentError,
  };

  // Elements can only mount once a client secret exists, so card payments
  // render inside the provider and COD renders without it.
  if (paymentMethod === "stripe" && clientSecret) {
    return (
      <Elements
        options={{ clientSecret, appearance: { theme: "stripe" as const } }}
        stripe={stripePromise}
      >
        <CheckoutContent {...shared} />
      </Elements>
    );
  }

  return <CheckoutContent {...shared} />;
}

interface CheckoutContentProps {
  onPaymentSuccess: () => void;
  paymentMethod: "cod" | "stripe";
  setPaymentMethod: (method: "cod" | "stripe") => void;
  appliedCoupon: AppliedCoupon | null;
  setAppliedCoupon: (coupon: AppliedCoupon | null) => void;
  zones: ShippingZone[];
  selectedZoneId: string;
  setSelectedZoneId: (id: string) => void;
  quote: Quote;
  paymentIntentId: string | null;
  intentError: string | null;
}


function CheckoutContent({
  onPaymentSuccess,
  paymentMethod,
  setPaymentMethod,
  appliedCoupon,
  setAppliedCoupon,
  zones,
  selectedZoneId,
  setSelectedZoneId,
  quote,
  paymentIntentId,
  intentError,
}: CheckoutContentProps) {
  const stripe = useStripe();
  const elements = useElements();
  const cart = useCart();
  const { data: session } = useSession();
  const router = useRouter();

  const [isProcessing, setIsProcessing] = useState(false);

  const [couponCode, setCouponCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setIsValidating(true);
    try {
      const res = await validateCoupon(couponCode);
      if (res.success && res.coupon) {
        setAppliedCoupon(res.coupon as AppliedCoupon);
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
            // The payment succeeded, so the Stripe webhook will still create
            // the order — the customer is not charged without an order.
            cart.clearCart();
            onPaymentSuccess();
            router.push(`/order-confirmation/pending?intent=${paymentIntent.id}`);
          }
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong.");
      setIsProcessing(false);
    }
  };

  const isFormValid = form.formState.isValid;
  const canPayByCard = paymentMethod === "stripe" && Boolean(stripe && paymentIntentId);


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
                  <label
                    htmlFor="checkout-fullName"
                    className="text-sm font-medium text-gray-700 mb-1.5 block"
                  >
                    Full Name
                  </label>
                  <div className="relative">
                    <User
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                    <input
                      id="checkout-fullName"
                      {...form.register("fullName")}
                      aria-invalid={Boolean(form.formState.errors.fullName)}
                      aria-describedby={
                        form.formState.errors.fullName ? "checkout-fullName-error" : undefined
                      }
                      className={cn(
                        "w-full rounded-xl border-gray-200 border bg-gray-50/30 pl-11 pr-4 py-3 text-sm outline-none focus:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500 transition-all",
                        form.formState.errors.fullName && "border-red-500"
                      )}
                      placeholder="Enter full name"
                    />
                  </div>
                  {form.formState.errors.fullName && (
                    <p
                      id="checkout-fullName-error"
                      role="alert"
                      className="mt-1.5 text-xs font-medium text-red-600"
                    >
                      {form.formState.errors.fullName.message}
                    </p>
                  )}
                </div>
                <div className="relative">
                  <label
                    htmlFor="checkout-phone"
                    className="text-sm font-medium text-gray-700 mb-1.5 block"
                  >
                    Phone
                  </label>
                  <div className="relative">
                    <Phone
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                    <input
                      id="checkout-phone"
                      {...form.register("phone")}
                      inputMode="tel"
                      aria-invalid={Boolean(form.formState.errors.phone)}
                      aria-describedby={
                        form.formState.errors.phone ? "checkout-phone-error" : undefined
                      }
                      className={cn(
                        "w-full rounded-xl border-gray-200 border bg-gray-50/30 pl-11 pr-4 py-3 text-sm outline-none focus:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500 transition-all",
                        form.formState.errors.phone && "border-red-500"
                      )}
                      placeholder="017..."
                    />
                  </div>
                  {form.formState.errors.phone && (
                    <p
                      id="checkout-phone-error"
                      role="alert"
                      className="mt-1.5 text-xs font-medium text-red-600"
                    >
                      {form.formState.errors.phone.message}
                    </p>
                  )}
                </div>
                <div className="relative">
                  <label
                    htmlFor="checkout-email"
                    className="text-sm font-medium text-gray-700 mb-1.5 block"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                    <input
                      id="checkout-email"
                      {...form.register("email")}
                      type="email"
                      autoComplete="email"
                      aria-invalid={Boolean(form.formState.errors.email)}
                      aria-describedby={cn(
                        form.formState.errors.email && "checkout-email-error",
                        !session && "checkout-email-hint"
                      ) || undefined}
                      className={cn(
                        "w-full rounded-xl border-gray-200 border bg-gray-50/30 pl-11 pr-4 py-3 text-sm outline-none focus:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500 transition-all",
                        form.formState.errors.email && "border-red-500"
                      )}
                      placeholder="Enter your email"
                    />
                  </div>
                  {form.formState.errors.email && (
                    <p
                      id="checkout-email-error"
                      role="alert"
                      className="mt-1.5 text-xs font-medium text-red-600"
                    >
                      {form.formState.errors.email.message}
                    </p>
                  )}
                  {!session && (
                    <p
                      id="checkout-email-hint"
                      className="mt-1.5 text-[10px] text-gray-500 font-medium"
                    >
                      Guest checkout. We&apos;ll use this to send your order confirmation.
                    </p>
                  )}
                </div>
                <div className="relative">
                  <label
                    htmlFor="checkout-address"
                    className="text-sm font-medium text-gray-700 mb-1.5 block"
                  >
                    Address
                  </label>
                  <textarea
                    id="checkout-address"
                    {...form.register("address")}
                    rows={2}
                    aria-invalid={Boolean(form.formState.errors.address)}
                    aria-describedby={
                      form.formState.errors.address ? "checkout-address-error" : undefined
                    }
                    className={cn(
                      "w-full rounded-xl border-gray-200 border bg-gray-50/30 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500 transition-all resize-none",
                      form.formState.errors.address && "border-red-500"
                    )}
                    placeholder="House, Road, City..."
                  />
                  {form.formState.errors.address && (
                    <p
                      id="checkout-address-error"
                      role="alert"
                      className="mt-1.5 text-xs font-medium text-red-600"
                    >
                      {form.formState.errors.address.message}
                    </p>
                  )}
                </div>

                {/* Shipping Zone Selection */}
                <div className="relative">
                  <label
                    htmlFor="checkout-zone"
                    className="text-sm font-medium text-gray-700 mb-1.5 block"
                  >
                    Shipping Zone
                  </label>
                  <select
                    id="checkout-zone"
                    value={selectedZoneId}
                    onChange={(e) => setSelectedZoneId(e.target.value)}
                    className="w-full rounded-xl border-gray-200 border bg-gray-50/30 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500 transition-all cursor-pointer"
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

              <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <legend className="sr-only">Choose a payment method</legend>

                <label
                  className={cn(
                    "relative p-5 border-2 rounded-2xl cursor-pointer transition-all flex items-start gap-4 hover:shadow-md has-focus-visible:ring-2 has-focus-visible:ring-indigo-500 has-focus-visible:ring-offset-2",
                    paymentMethod === "cod"
                      ? "border-gray-900 bg-gray-50/50"
                      : "border-gray-100 bg-white"
                  )}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={paymentMethod === "cod"}
                    onChange={() => setPaymentMethod("cod")}
                    className="sr-only"
                  />
                  <div
                    aria-hidden="true"
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
                </label>

                <label
                  className={cn(
                    "relative p-5 border-2 rounded-2xl cursor-pointer transition-all flex items-start gap-4 hover:shadow-md has-focus-visible:ring-2 has-focus-visible:ring-indigo-500 has-focus-visible:ring-offset-2",
                    paymentMethod === "stripe"
                      ? "border-indigo-600 bg-indigo-50/50"
                      : "border-gray-100 bg-white"
                  )}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="stripe"
                    checked={paymentMethod === "stripe"}
                    onChange={() => setPaymentMethod("stripe")}
                    className="sr-only"
                  />
                  <div
                    aria-hidden="true"
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
                </label>
              </fieldset>
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
                  <span className="font-medium">${money(quote.subtotalCents)}</span>
                </div>

                {quote.discountCents > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium animate-in slide-in-from-right-2">
                    <div className="flex items-center gap-1">
                      <Tag size={14} />
                      <span>Discount ({quote.couponCode})</span>
                    </div>
                    <span>-${money(quote.discountCents)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>
                    {quote.shippingCents === 0 ? "Free" : `$${money(quote.shippingCents)}`}
                  </span>
                </div>

                {quote.taxRate > 0 && (
                  <div className="flex justify-between text-gray-500">
                    <span>VAT/Tax ({quote.taxRate}%)</span>
                    <span>${money(quote.taxCents)}</span>
                  </div>
                )}

                <div className="flex justify-between items-end pt-3 border-t border-gray-100 mt-3">
                  <span className="text-base font-bold">Total</span>
                  <span className="text-2xl font-extrabold text-indigo-600">
                    ${money(quote.totalCents)}
                  </span>
                </div>
              </div>

              {paymentMethod === "stripe" && intentError && (
                <div
                  role="alert"
                  className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                >
                  <p className="font-semibold">Couldn&apos;t start payment</p>
                  <p className="mt-1 text-red-600">{intentError}</p>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("stripe")}
                    className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-red-700 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                  >
                    Try again
                  </button>
                </div>
              )}

              {paymentMethod === "stripe" && !intentError && (
                <div className="mt-6 p-4 bg-white rounded-xl border border-indigo-200 shadow-inner animate-in fade-in">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 block">
                    Card Information
                  </span>
                  {canPayByCard ? (
                    <PaymentElement
                      id="payment-element"
                      options={{ layout: "tabs" }}
                    />
                  ) : (
                    <div className="flex items-center gap-2 py-4 text-sm text-gray-500">
                      <Loader2 size={16} className="animate-spin" />
                      Preparing secure payment form...
                    </div>
                  )}
                </div>
              )}

              <button
                type="submit"
                form="checkout-form"
                disabled={
                  isProcessing ||
                  !isFormValid ||
                  (paymentMethod === "stripe" && !canPayByCard)
                }
                className={cn(
                  "w-full mt-6 py-4 rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2",
                  isProcessing ||
                    !isFormValid ||
                    (paymentMethod === "stripe" && !canPayByCard)
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
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
                  `Pay $${money(quote.totalCents)}`
                )}
              </button>

              {!isFormValid && (
                <p className="mt-3 text-center text-xs text-gray-500">
                  Complete your delivery details to continue.
                </p>
              )}

              <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-500 bg-gray-50 py-2 rounded-lg">
                <ShieldCheck size={14} /> <span>Secure Encrypted Checkout</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
