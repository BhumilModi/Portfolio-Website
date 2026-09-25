import StageLoader from "@/components/experience/stage-loader";
import Onboarding from "@/components/experience/onboarding";
import Nav from "@/components/sections/nav";
import Hero from "@/components/sections/hero";
import Engagement from "@/components/sections/engagement";
import Approach from "@/components/sections/approach";
import Work from "@/components/sections/work";
import Cases from "@/components/sections/cases";
import Record from "@/components/sections/record";
import Faq from "@/components/sections/faq";
import Footer from "@/components/sections/footer";

export default function Page() {
  return (
    <>
      <StageLoader />
      <main className="relative z-10 bg-field">
        <Onboarding />
        <Nav />
        <Hero />
        <Engagement />
        <Approach />
        <Work />
        <Cases />
        <Record />
        <Faq />
      </main>
      <Footer />
    </>
  );
}
