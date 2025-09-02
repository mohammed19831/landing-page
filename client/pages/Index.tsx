import { useEffect } from "react";
import HeroSlider from "@/components/home/HeroSlider";
import DynamicBoxes from "@/components/home/DynamicBoxes";
import LogosMarquee from "@/components/home/LogosMarquee";
import ContactSection from "@/components/home/ContactSection";

export default function Index() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div>
      <HeroSlider />
      <DynamicBoxes />
      <LogosMarquee />
      <ContactSection />
    </div>
  );
}
