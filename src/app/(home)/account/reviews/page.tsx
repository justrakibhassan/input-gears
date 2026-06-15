import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import AccountReviewsView from "@/modules/account/views/reviews-view";

export const metadata = {
  title: "My Reviews | InputGears",
  description: "View and manage the reviews you have submitted for products.",
};

export default async function AccountReviewsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/sign-in");
  }

  // Fetch all reviews for this user
  const reviews = await prisma.review.findMany({
    where: {
      userId: session.user.id,
    },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          image: true,
          price: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return <AccountReviewsView reviews={reviews} />;
}
