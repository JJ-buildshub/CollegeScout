import HomeHero from "@/components/HomeHero";
import JourneySteps from "@/components/JourneySteps";
import CareerOutcomesStory from "@/components/CareerOutcomesStory";
import TryCollegeScout from "@/components/TryCollegeScout";
import WhyCollegeScout from "@/components/WhyCollegeScout";
import FindMyFit from "@/components/FindMyFit";
import AccessMissionStatement from "@/components/AccessMissionStatement";
import AccessMission from "@/components/AccessMission";

/**
 * The first five minutes of using CollegeScout, not a description of it:
 *
 *   1 hero — who built this, and the promise            navy
 *   2 great guidance shouldn't depend on what you can afford  <- why it exists
 *   3 same interest, different odds, different price     slate <- proof
 *   4 what are you interested in                         white <- try it
 *   5 which of these schools make sense for you          slate <- personalise
 *   6 what actually makes a college right for you              <- the system, once it means something
 *   7 explore / my fit / my plan                               <- the three parts
 *   8 where the numbers come from                        light
 *
 * The dimensions list sits AFTER the tool on purpose. Placed before it, a
 * student who has just seen two real schools compared gets an evaluation
 * framework instead of their own results — a pause in the story at exactly the
 * moment they want to act.
 */
export default function HomePage() {
  return (
    <div>
      <HomeHero />

      <div className="mt-10 sm:mt-16">
        <AccessMissionStatement />
      </div>
      <div className="mt-10 sm:mt-12">
        <CareerOutcomesStory />
      </div>

      {/* Try it */}
      <div className="mt-10 sm:mt-16">
        <TryCollegeScout />
      </div>
      <div className="mt-10 sm:mt-16">
        <FindMyFit />
      </div>
      <div className="mt-10 sm:mt-12">
        <WhyCollegeScout />
      </div>
      <div className="mt-10 sm:mt-16">
        <JourneySteps />
      </div>

      <div className="mt-10 sm:mt-16">
        <AccessMission />
      </div>
    </div>
  );
}
