import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import FeaturesSection from "./components/FeaturesSection";
import EmotionalHookSection from "./components/EmotionalHookSection";
import SocialProofSection from "./components/SocialProofSection";
import ProductPreviewSection from "./components/ProductPreviewSection";
import CTASection from "./components/CTASection";
import Footer from "./components/Footer";

export default function WelcomePage() {
  return (
    <div className="font-sans antialiased" style={{ scrollBehavior: "smooth" }}>
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <EmotionalHookSection />
        <SocialProofSection />
        <ProductPreviewSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}