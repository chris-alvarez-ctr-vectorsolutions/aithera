import svgPaths from "../imports/svg-noxp2i2m0s";
import imgVectorSolutionsLogoIconColor11 from "figma:asset/3706f6b18012d836cb26db882d770f4260d341c0.png";
import { Bell, Info } from "lucide-react";
import { Button } from "./ui/button";

function FaInfoCircle() {
  return (
    <div className="absolute aspect-[32/32] left-[31.25%] overflow-clip right-[31.25%] top-[15px]" data-name="faInfoCircle">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
        <path d={svgPaths.p16beb600} fill="var(--fill-0, black)" id="Vector" />
      </svg>
    </div>
  );
}

function TopNav() {
  return (
    <div className="absolute bg-white box-border content-stretch flex gap-[8px] h-[56px] items-center left-0 px-[24px] py-0 shadow-[0px_1px_8px_0px_rgba(0,0,0,0.25)] top-[8px] w-full" data-name="TopNav">
      <div className="h-[31px] relative shrink-0 w-[36px]" data-name="VectorSolutions_Logo_Icon_Color (1) 1">
        <img alt="Vector Solutions Logo" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none size-full" src={imgVectorSolutionsLogoIconColor11} />
      </div>
      <div className="basis-0 bg-[rgba(217,217,217,0)] grow h-[50px] min-h-px min-w-px shrink-0" data-name="topNavFillColumn" />
      <div className="relative shrink-0 size-[48px]" data-name="NotificationsButton">
        <Button
          variant="ghost"
          size="icon"
          className="size-[48px] rounded-[4px] hover:bg-gray-100"
          title="Notifications"
        >
          <div className="h-[18px] w-[16px]" data-name="Vector">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 18">
              <path d={svgPaths.pc659800} fill="currentColor" id="Vector" />
            </svg>
          </div>
        </Button>
      </div>
      <div className="relative shrink-0 size-[48px]" data-name="InfoButton">
        <Button
          variant="ghost"
          size="icon"
          className="size-[48px] rounded-[4px] hover:bg-gray-100"
          title="Information"
        >
          <FaInfoCircle />
        </Button>
      </div>
    </div>
  );
}

export default function TopNav1() {
  return (
    <div className="relative h-[64px] w-full shrink-0 shadow-[0px_4px_12px_rgba(0,0,0,0.15),0px_2px_6px_rgba(0,0,0,0.1)] z-50" data-name="TopNav">
      <div className="absolute bg-[#3d4543] h-[8px] left-0 top-0 w-full" data-name="TopNavColorBar" />
      <TopNav />
    </div>
  );
}
