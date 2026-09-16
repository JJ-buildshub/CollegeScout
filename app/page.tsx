import HomeHero from "@/components/HomeHero";
import TryCollegeScout from "@/components/TryCollegeScout";
import WhyCollegeScout from "@/components/WhyCollegeScout";
import FindMyFit from "@/components/FindMyFit";
import CareerOutcomesStory from "@/components/CareerOutcomesStory";
import BuildYourList from "@/components/BuildYourList";
import RunwayPreview from "@/components/RunwayPreview";
import AccessMission from "@/components/AccessMission";
import JourneySteps from "@/components/JourneySteps";

export default function HomePage() {
  return (
    <div className="space-y-12">
      <HomeHero />
      <TryCollegeScout />
      <WhyCollegeScout />
      <FindMyFit />
      <CareerOutcomesStory />
      <div className="grid gap-6 sm:grid-cols-2">
        <BuildYourList />
        <RunwayPreview />
      </div>
      <AccessMission />
      <JourneySteps compact />
    </div>
  );
}
