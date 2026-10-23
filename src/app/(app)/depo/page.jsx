import DepotBoard from "@/components/DepotBoard";

export const metadata = { title: "Depo" };

export default function DepotsPage() {
  return (
    <main className="mx-auto w-full max-w-[1400px] p-4 md:p-8">
      <DepotBoard />
    </main>
  );
}
