import { getStoreAppearance } from "@/modules/admin/actions";
import AppearanceForm from "@/modules/admin/appearance/appearance-form";

export default async function AppearancePage() {
  const data = await getStoreAppearance();

  return (
    <AppearanceForm
      initialSettings={data.settings}
      initialSlides={data.slides}
      initialBrandLogos={data.brandLogos}
    />
  );
}
