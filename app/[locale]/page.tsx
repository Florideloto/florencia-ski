import Navbar from '@/components/Navbar';
import HeroSection from '@/components/sections/HeroSection';
import AboutSection from '@/components/sections/AboutSection';
import MethodSection from '@/components/sections/MethodSection';
import ServicesSection from '@/components/sections/ServicesSection';
import ReviewsSection from '@/components/sections/ReviewsSection';
import CtaSection from '@/components/sections/CtaSection';
import BookingSection from '@/components/sections/BookingSection';
import FooterSection from '@/components/sections/FooterSection';

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await params;
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <AboutSection />
        <MethodSection />
        <ServicesSection />
        <ReviewsSection />
        <CtaSection />
        <BookingSection />
      </main>
      <FooterSection />
    </>
  );
}
