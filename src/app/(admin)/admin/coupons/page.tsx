import { getCoupons } from "@/modules/admin/actions";
import CouponManager from "@/modules/admin/components/coupon-manager";
import { Coupon } from "@prisma/client";

export const metadata = {
  title: "Coupons & Discounts — Admin",
};

export default async function AdminCouponsPage() {
  const coupons = (await getCoupons()) as Coupon[];

  return (
    <div className="w-full space-y-6 pb-10">
      <CouponManager initialCoupons={coupons} />
    </div>
  );
}
