import Footer from "@/components/Footer";
import NavigationBar from "@/components/NavigationBar";
import HeroComponent from "@/components/HeroComponent";

export default function Home() {
  return (
    <div className="min-h-screen  bg-transparent text-stone-900">
      <NavigationBar />
      <main className="pb-12">
         {/* improve the design of this hero component */}
            <HeroComponent />

      </main>
      <Footer />
    </div>
  );
}
