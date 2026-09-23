import HomeHero from "@/components/HomeHero";
import TryCollegeScout from "@/components/TryCollegeScout";
import FindMyFit from "@/components/FindMyFit";
import CareerOutcomesStory from "@/components/CareerOutcomesStory";
import BuildYourList from "@/components/BuildYourList";
import RunwayPreview from "@/components/RunwayPreview";
import AccessMission from "@/components/AccessMission";
import JourneySteps from "@/components/JourneySteps";

export default function HomePage() {
  return (
    <div>
      <HomeHero />
      <div className="mt-8">
        <TryCollegeScout />
      </div>
      <div className="mt-10">
        <FindMyFit />
      </div>
      <div className="mt-10">
        <CareerOutcomesStory />
      </div>
      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        <BuildYourList />
        <RunwayPreview />
      </div>
      <div className="mt-10">
        <AccessMission />
      </div>
      <div className="mt-10">
        <JourneySteps compact />
      </div>
    </div>
  );
}
