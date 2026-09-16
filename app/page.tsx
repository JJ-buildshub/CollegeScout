import HomeHero from "@/components/HomeHero";
import JourneySteps from "@/components/JourneySteps";
import WhyCollegeScout from "@/components/WhyCollegeScout";
import DiscoveryExample from "@/components/DiscoveryExample";
import CareerOutcomesStory from "@/components/CareerOutcomesStory";
import AccessMission from "@/components/AccessMission";

export default function HomePage() {
  return (
    <div className="space-y-12">
      <HomeHero />
      <JourneySteps />
      <WhyCollegeScout />
      <DiscoveryExample />
      <CareerOutcomesStory />
      <AccessMission />
    </div>
  );
}
