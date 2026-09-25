import HomeHero from "@/components/HomeHero";
import JourneySteps from "@/components/JourneySteps";
import CareerOutcomesStory from "@/components/CareerOutcomesStory";
import TryCollegeScout from "@/components/TryCollegeScout";
import WhyCollegeScout from "@/components/WhyCollegeScout";
import FindMyFit from "@/components/FindMyFit";
import AccessMissionStatement from "@/components/AccessMissionStatement";
import AccessMission from "@/components/AccessMission";

/**
 * Order:
 *   1 hero                                     navy
 *   2 what actually makes a college right      slate
 *   3 start anywhere                           light
 *   4 two schools, one subject                 slate
 *   5 what are you interested in               white card  <- the tool
 *   6 now make it personal                     slate
 *   7 why we built it                          NAVY   <- closes the argument
 *   8 where the numbers come from              light
 *
 * The mission sits at the end rather than a third of the way down: it reads as
 * earned once someone has used the thing, and as a claim when it interrupts.
 */
export default function HomePage() {
  return (
    <div>
      <HomeHero />

      <div className="mt-16">
        <WhyCollegeScout />
      </div>
      <div className="mt-12">
        <JourneySteps />
      </div>
      <div className="mt-12">
        <CareerOutcomesStory />
      </div>

      {/* The tool */}
      <div className="mt-16">
        <TryCollegeScout />
      </div>
      <div className="mt-16">
        <FindMyFit />
      </div>

      <div className="mt-16">
        <AccessMissionStatement />
      </div>
      <div className="mt-16">
        <AccessMission />
      </div>
    </div>
  );
}
