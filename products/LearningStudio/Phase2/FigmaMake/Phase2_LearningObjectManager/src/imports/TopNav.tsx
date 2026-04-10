import svgPaths from "./svg-noxp2i2m0s";
import imgVectorSolutionsLogoIconColor11 from "figma:asset/3706f6b18012d836cb26db882d770f4260d341c0.png";

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
    <div className="absolute bg-white box-border content-stretch flex gap-[8px] h-[56px] items-center left-0 px-[24px] py-0 shadow-[0px_1px_8px_0px_rgba(0,0,0,0.25)] top-[8px] w-[1440px]" data-name="TopNav">
      <div className="h-[31px] relative shrink-0 w-[36px]" data-name="VectorSolutions_Logo_Icon_Color (1) 1">
        <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none size-full" src={imgVectorSolutionsLogoIconColor11} />
      </div>
      <div className="basis-0 bg-[rgba(217,217,217,0)] grow h-[50px] min-h-px min-w-px shrink-0" data-name="topNavFillColumn" />
      <div className="relative shrink-0 size-[48px]" data-name="NotificationsButton">
        <div className="absolute aspect-[100/100] bg-white left-0 right-0 rounded-[4px] top-0" />
        <div className="absolute h-[18px] left-[16px] top-[15px] w-[16px]" data-name="Vector">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 18">
            <path d={svgPaths.pc659800} fill="var(--fill-0, black)" id="Vector" />
          </svg>
        </div>
      </div>
      <div className="relative shrink-0 size-[48px]" data-name="InfoButton">
        <div className="absolute aspect-[100/100] bg-white left-0 right-0 rounded-[4px] top-0" />
        <FaInfoCircle />
      </div>
    </div>
  );
}

export default function TopNav1() {
  return (
    <div className="relative size-full" data-name="TopNav">
      <div className="absolute bg-[#3d4543] h-[8px] left-0 top-0 w-[1440px]" data-name="TopNavColorBar" />
      <TopNav />
    </div>
  );
}