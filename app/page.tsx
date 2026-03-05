import { LandingNav } from "@/components/landing/landing-nav";
import { HeroSection } from "@/components/landing/hero-section";
import { PainSection } from "@/components/landing/pain-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { StepsSection } from "@/components/landing/steps-section";
import { PricingSection } from "@/components/landing/pricing-section";
import { FaqSection } from "@/components/landing/faq-section";
import { CtaSection } from "@/components/landing/cta-section";
import { FooterSection } from "@/components/landing/footer-section";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <LandingNav />
      <HeroSection />
      <PainSection />
      <FeaturesSection />
      <StepsSection />
      <PricingSection />
      <FaqSection />
      <CtaSection />
      <FooterSection />
    </div>
  );
}
