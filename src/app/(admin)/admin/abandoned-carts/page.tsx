import { Suspense } from "react";
import { getAbandonedCarts } from "@/modules/admin/actions/abandoned-cart-actions";
import { AbandonedCartsTable } from "@/modules/admin/components/abandoned-carts-table";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Abandoned Carts — Admin",
};

function AbandonedCartsLoading() {
  return (
    <div className="w-full space-y-4">
      <Skeleton className="h-14 w-full rounded-xl" />
      <Skeleton className="h-12 w-full rounded-xl" />
      <Skeleton className="h-96 w-full rounded-xl" />
    </div>
  );
}

async function AbandonedCartsContent() {
  const carts = await getAbandonedCarts();
  return <AbandonedCartsTable data={carts} />;
}

export default function AbandonedCartsPage() {
  return (
    <div className="w-full space-y-6 pb-10">
      <Suspense fallback={<AbandonedCartsLoading />}>
        <AbandonedCartsContent />
      </Suspense>
    </div>
  );
}
