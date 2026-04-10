import svgPaths from "./svg-bm3d547odl";
import clsx from "clsx";
import imgFrame6 from "figma:asset/80a13d5d3f404620bfde10e480c6e758aa7fc7b8.png";

function BackgroundImage({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="relative shrink-0 size-[24px]">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        {children}
      </svg>
    </div>
  );
}

function FieldBackgroundImage({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="h-[36px] relative shrink-0 w-full">
      <div className="flex flex-col justify-center size-full">
        <div className="content-stretch flex flex-col h-[36px] items-start justify-center px-[10px] py-0 relative w-full">{children}</div>
      </div>
    </div>
  );
}
type BackgroundImageAndText1Props = {
  text: string;
};

function BackgroundImageAndText1({ text }: BackgroundImageAndText1Props) {
  return (
    <div className="flex flex-col font-['Open_Sans:Medium',sans-serif] justify-center leading-[0] not-italic overflow-ellipsis overflow-hidden relative shrink-0 text-[14px] text-[rgba(27,43,65,0.69)] text-nowrap w-full">
      <p className="[white-space-collapse:collapse] leading-[16px] overflow-ellipsis overflow-hidden">{text}</p>
    </div>
  );
}
type BackgroundImageAndTextProps = {
  text: string;
};

function BackgroundImageAndText({ text }: BackgroundImageAndTextProps) {
  return (
    <div className="basis-0 flex flex-col font-['Open_Sans:Medium',sans-serif] grow h-[22px] justify-center leading-[0] min-h-px min-w-px not-italic overflow-ellipsis overflow-hidden relative shrink-0 text-[16px] text-[rgba(61,69,67,0.94)] text-nowrap">
      <p className="[white-space-collapse:collapse] leading-[22px] overflow-ellipsis overflow-hidden">{text}</p>
    </div>
  );
}
type ValueBackgroundImageAndTextProps = {
  text: string;
};

function ValueBackgroundImageAndText({ text }: ValueBackgroundImageAndTextProps) {
  return (
    <div className="content-stretch flex gap-[6px] items-center relative shrink-0 w-full">
      <BackgroundImageAndText text={text} />
      <BackgroundImage>
        <g id="Dropdown">
          <path d={svgPaths.pedf8280} fill="var(--fill-0, #1C2E45)" fillOpacity="0.6" id="Vector" />
        </g>
      </BackgroundImage>
    </div>
  );
}
type InputFieldBackgroundImageProps = {
  additionalClassNames?: string;
};

function InputFieldBackgroundImage({ additionalClassNames = "" }: InputFieldBackgroundImageProps) {
  return (
    <div className={clsx("absolute content-stretch flex flex-col gap-[4px] h-[36px] items-start left-0 top-0", additionalClassNames)}>
      <div className="bg-white h-[36px] relative rounded-[4px] shrink-0 w-full" data-name="Field">
        <div aria-hidden="true" className="absolute border border-[rgba(28,48,74,0.52)] border-solid inset-0 pointer-events-none rounded-[4px]" />
      </div>
    </div>
  );
}

function CrossBackgroundImage() {
  return (
    <BackgroundImage>
      <g id="Cross">
        <path d={svgPaths.p38db4f80} fill="var(--fill-0, #1C2E45)" fillOpacity="0.6" id="Vector" />
      </g>
    </BackgroundImage>
  );
}

export default function QuestionPanel() {
  return (
    <div className="bg-white content-stretch flex flex-col isolate items-start relative shadow-[0px_12px_48px_-6px_rgba(28,52,84,0.26),0px_3px_18px_-2px_rgba(26,56,96,0.1)] size-full" data-name="Question Panel">
      <div className="relative shadow-[0px_3px_12px_-1px_rgba(28,55,90,0.16),0px_2px_4px_-1px_rgba(28,55,90,0.16)] shrink-0 w-full z-[3]" data-name="Panel Header" style={{ backgroundImage: "linear-gradient(90deg, rgba(25, 59, 103, 0.05) 0%, rgba(25, 59, 103, 0.05) 100%), linear-gradient(90deg, rgb(255, 255, 255) 0%, rgb(255, 255, 255) 100%)" }}>
        <div className="overflow-clip rounded-[inherit] size-full">
          <div className="content-stretch flex flex-col gap-[8px] items-start p-[24px] relative w-full">
            <div className="content-stretch flex gap-[24px] items-center relative shrink-0 w-full" data-name="Header Top Row">
              <div className="basis-0 content-stretch flex gap-[6px] grow items-center min-h-px min-w-px relative shrink-0" data-name="Heading">
                <div className="flex flex-col font-['Open_Sans:Semi_Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[20px] text-[rgba(61,69,67,0.94)] text-nowrap">
                  <p className="leading-[24px] whitespace-pre">Add/Edit Knowledge Check</p>
                </div>
              </div>
              <CrossBackgroundImage />
            </div>
            <div className="content-stretch flex items-center relative shrink-0" data-name="Header Top Row">
              <div className="content-stretch flex gap-[6px] items-center relative shrink-0 w-[835px]" data-name="Heading">
                <div className="flex flex-col font-['Open_Sans:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[14px] text-[rgba(61,69,67,0.94)] text-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
                  <p className="leading-[20px] whitespace-pre">Fill out question details below to add to Learning Object</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="basis-0 bg-white content-stretch flex flex-col gap-[8px] grow items-start min-h-px min-w-px overflow-x-clip overflow-y-auto relative shrink-0 w-full z-[2]" data-name="Panel Header">
        <div className="bg-white content-stretch flex flex-col gap-[16px] items-start justify-center px-[16px] py-[15px] relative shadow-[0px_3px_12px_-1px_rgba(28,55,90,0.16),0px_2px_4px_-1px_rgba(28,55,90,0.16)] shrink-0 w-[931px]">
          <div className="content-stretch flex gap-[24px] items-end relative shrink-0 w-full">
            <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0 w-[283.5px]" data-name="Combo Box">
              <BackgroundImageAndText1 text="Question Type" />
              <FieldBackgroundImage>
                <InputFieldBackgroundImage additionalClassNames="right-[-0.5px]" />
                <ValueBackgroundImageAndText text="Matching (Dropdown)" />
              </FieldBackgroundImage>
            </div>
            <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0" data-name="Combo Box">
              <BackgroundImageAndText1 text="# of Answers" />
              <FieldBackgroundImage>
                <InputFieldBackgroundImage additionalClassNames="right-0" />
                <ValueBackgroundImageAndText text="4" />
              </FieldBackgroundImage>
            </div>
            <div className="basis-0 bg-white grow h-[26px] min-h-px min-w-px shrink-0" />
            <div className="bg-[#0271ce] content-stretch flex gap-[4px] h-[36px] items-center justify-center px-[14px] py-[8px] relative rounded-[4px] shrink-0" data-name="Button (primary)">
              <div className="flex flex-col font-['Open_Sans:Semi_Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-center text-nowrap text-white">
                <p className="leading-[normal] whitespace-pre">Generate Question</p>
              </div>
            </div>
          </div>
          <div className="content-stretch flex gap-[16px] items-start relative shrink-0" data-name="Question/Thumbnail">
            <div className="content-stretch flex flex-col gap-[4px] h-[96px] items-start relative shrink-0 w-[743px]" data-name="Text area">
              <BackgroundImageAndText1 text="Statement" />
              <div className="basis-0 content-stretch flex flex-col gap-[4px] grow items-start min-h-px min-w-px relative shrink-0 w-full" data-name="Input field with Large Text Area">
                <div className="basis-0 bg-white grow min-h-px min-w-px relative rounded-[4px] shrink-0 w-full" data-name="Text">
                  <div aria-hidden="true" className="absolute border border-[rgba(28,48,74,0.52)] border-solid inset-0 pointer-events-none rounded-[4px]" />
                  <div className="size-full">
                    <div className="content-stretch flex items-start p-[8px] relative size-full">
                      <div className="basis-0 content-stretch flex grow h-[68px] items-start min-h-px min-w-px relative shrink-0" data-name="Value">
                        <p className="[white-space-collapse:collapse] basis-0 font-['Open_Sans:Regular',sans-serif] font-normal grow h-full leading-[24px] min-h-px min-w-px overflow-ellipsis overflow-hidden relative shrink-0 text-[16px] text-[rgba(61,69,67,0.94)] text-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
                          Review the image and match each labeled section with the appropriate description.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white content-stretch flex flex-col gap-[4px] h-[96px] items-center p-[8px] relative rounded-[4px] shadow-[0px_3px_12px_-1px_rgba(28,55,90,0.16),0px_2px_4px_-1px_rgba(28,55,90,0.16)] shrink-0 w-[140px]" data-name="Img Thumbnail">
              <div className="basis-0 grow min-h-px min-w-px relative shrink-0 w-full">
                <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-contain pointer-events-none size-full" src={imgFrame6} />
              </div>
              <div className="content-stretch flex gap-[4px] items-center relative shrink-0 w-full">
                <div className="basis-0 flex flex-col font-['Open_Sans:Regular',sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px relative shrink-0 text-[#3d4543] text-[12px] text-center" style={{ fontVariationSettings: "'wdth' 100" }}>
                  <p className="leading-[1.25]">testImage.png</p>
                </div>
                <CrossBackgroundImage />
              </div>
            </div>
          </div>
        </div>
        <div className="content-stretch flex flex-col items-start relative shadow-[0px_3px_12px_-1px_rgba(28,55,90,0.16),0px_2px_4px_-1px_rgba(28,55,90,0.16)] shrink-0" data-name="Answer Bank">
          <div className="bg-neutral-50 content-stretch flex flex-col items-start justify-center px-[16px] py-[24px] relative shrink-0 w-[931px]" data-name="Answer Frame">
            <div aria-hidden="true" className="absolute border-[0px_0px_1px] border-[rgba(28,55,90,0.16)] border-solid inset-0 pointer-events-none" />
            <div className="content-stretch flex items-start relative shrink-0 w-full">
              <div className="basis-0 content-stretch flex gap-[16px] grow items-end min-h-px min-w-px relative shrink-0" data-name="Question/Thumbnail">
                <div className="basis-0 content-stretch flex flex-col gap-[4px] grow items-start min-h-px min-w-px relative shrink-0" data-name="Text field">
                  <BackgroundImageAndText1 text="Answer Statement" />
                  <FieldBackgroundImage>
                    <InputFieldBackgroundImage additionalClassNames="right-[-0.5px]" />
                    <div className="content-stretch flex gap-[6px] items-center relative shrink-0 w-full" data-name="Value">
                      <BackgroundImageAndText text="Motorcycle" />
                    </div>
                  </FieldBackgroundImage>
                </div>
                <div className="basis-0 content-stretch flex flex-col gap-[4px] grow items-start min-h-px min-w-px relative shrink-0" data-name="Text field">
                  <BackgroundImageAndText1 text="Answer Selection" />
                  <FieldBackgroundImage>
                    <InputFieldBackgroundImage additionalClassNames="right-[-0.5px]" />
                    <div className="content-stretch flex gap-[6px] items-center relative shrink-0 w-full" data-name="Value">
                      <BackgroundImageAndText text="Vehicle with 2 wheels and an engine" />
                    </div>
                  </FieldBackgroundImage>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="content-stretch flex flex-col items-start relative shadow-[0px_3px_12px_-1px_rgba(28,55,90,0.16),0px_2px_4px_-1px_rgba(28,55,90,0.16)] shrink-0" data-name="Answer Bank">
          <div className="bg-neutral-50 content-stretch flex flex-col items-start justify-center px-[16px] py-[24px] relative shrink-0 w-[931px]" data-name="Answer Frame">
            <div aria-hidden="true" className="absolute border-[0px_0px_1px] border-[rgba(28,55,90,0.16)] border-solid inset-0 pointer-events-none" />
            <div className="content-stretch flex items-start relative shrink-0 w-full">
              <div className="basis-0 content-stretch flex gap-[16px] grow items-end min-h-px min-w-px relative shrink-0" data-name="Question/Thumbnail">
                <div className="basis-0 content-stretch flex flex-col gap-[4px] grow items-start min-h-px min-w-px relative shrink-0" data-name="Text field">
                  <BackgroundImageAndText1 text="Answer Statement" />
                  <FieldBackgroundImage>
                    <InputFieldBackgroundImage additionalClassNames="right-[-0.5px]" />
                    <div className="content-stretch flex gap-[6px] items-center relative shrink-0 w-full" data-name="Value">
                      <BackgroundImageAndText text="Boat" />
                    </div>
                  </FieldBackgroundImage>
                </div>
                <div className="basis-0 content-stretch flex flex-col gap-[4px] grow items-start min-h-px min-w-px relative shrink-0" data-name="Text field">
                  <BackgroundImageAndText1 text="Answer Selection" />
                  <FieldBackgroundImage>
                    <InputFieldBackgroundImage additionalClassNames="right-[-0.5px]" />
                    <div className="content-stretch flex gap-[6px] items-center relative shrink-0 w-full" data-name="Value">
                      <BackgroundImageAndText text="Vehicle that runs on water" />
                    </div>
                  </FieldBackgroundImage>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="content-stretch flex flex-col items-start relative shadow-[0px_3px_12px_-1px_rgba(28,55,90,0.16),0px_2px_4px_-1px_rgba(28,55,90,0.16)] shrink-0" data-name="Answer Bank">
          <div className="bg-neutral-50 content-stretch flex flex-col items-start justify-center px-[16px] py-[24px] relative shrink-0 w-[931px]" data-name="Answer Frame">
            <div aria-hidden="true" className="absolute border-[0px_0px_1px] border-[rgba(28,55,90,0.16)] border-solid inset-0 pointer-events-none" />
            <div className="content-stretch flex items-start relative shrink-0 w-full">
              <div className="basis-0 content-stretch flex gap-[16px] grow items-end min-h-px min-w-px relative shrink-0" data-name="Question/Thumbnail">
                <div className="basis-0 content-stretch flex flex-col gap-[4px] grow items-start min-h-px min-w-px relative shrink-0" data-name="Text field">
                  <BackgroundImageAndText1 text="Answer Statement" />
                  <FieldBackgroundImage>
                    <InputFieldBackgroundImage additionalClassNames="right-[-0.5px]" />
                    <div className="content-stretch flex gap-[6px] items-center relative shrink-0 w-full" data-name="Value">
                      <BackgroundImageAndText text="Car" />
                    </div>
                  </FieldBackgroundImage>
                </div>
                <div className="basis-0 content-stretch flex flex-col gap-[4px] grow items-start min-h-px min-w-px relative shrink-0" data-name="Text field">
                  <BackgroundImageAndText1 text="Answer Selection" />
                  <FieldBackgroundImage>
                    <InputFieldBackgroundImage additionalClassNames="right-[-0.5px]" />
                    <div className="content-stretch flex gap-[6px] items-center relative shrink-0 w-full" data-name="Value">
                      <BackgroundImageAndText text="Vehicle with 4 wheels" />
                    </div>
                  </FieldBackgroundImage>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="content-stretch flex flex-col items-start relative shadow-[0px_3px_12px_-1px_rgba(28,55,90,0.16),0px_2px_4px_-1px_rgba(28,55,90,0.16)] shrink-0" data-name="Answer Bank">
          <div className="bg-neutral-50 content-stretch flex flex-col items-start justify-center px-[16px] py-[24px] relative shrink-0 w-[931px]" data-name="Answer Frame">
            <div aria-hidden="true" className="absolute border-[0px_0px_1px] border-[rgba(28,55,90,0.16)] border-solid inset-0 pointer-events-none" />
            <div className="content-stretch flex items-start relative shrink-0 w-full">
              <div className="basis-0 content-stretch flex gap-[16px] grow items-end min-h-px min-w-px relative shrink-0" data-name="Question/Thumbnail">
                <div className="basis-0 content-stretch flex flex-col gap-[4px] grow items-start min-h-px min-w-px relative shrink-0" data-name="Text field">
                  <BackgroundImageAndText1 text="Answer Statement" />
                  <FieldBackgroundImage>
                    <InputFieldBackgroundImage additionalClassNames="right-[-0.5px]" />
                    <div className="content-stretch flex gap-[6px] items-center relative shrink-0 w-full" data-name="Value">
                      <BackgroundImageAndText text="Bicycle" />
                    </div>
                  </FieldBackgroundImage>
                </div>
                <div className="basis-0 content-stretch flex flex-col gap-[4px] grow items-start min-h-px min-w-px relative shrink-0" data-name="Text field">
                  <BackgroundImageAndText1 text="Answer Selection" />
                  <FieldBackgroundImage>
                    <InputFieldBackgroundImage additionalClassNames="right-[-0.5px]" />
                    <div className="content-stretch flex gap-[6px] items-center relative shrink-0 w-full" data-name="Value">
                      <div className="basis-0 flex flex-col font-['Open_Sans:Medium',sans-serif] grow h-[22px] justify-center leading-[0] min-h-px min-w-px not-italic overflow-ellipsis overflow-hidden relative shrink-0 text-[16px] text-[rgba(61,69,67,0.94)] text-nowrap">
                        <p className="[white-space-collapse:collapse] leading-[22px] overflow-ellipsis overflow-hidden"> </p>
                      </div>
                    </div>
                  </FieldBackgroundImage>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white relative shrink-0 w-full z-[1]" data-name="Panel Header">
        <div className="overflow-clip rounded-[inherit] size-full">
          <div className="content-stretch flex gap-[8px] items-start px-[24px] py-[16px] relative w-full">
            <div className="bg-white content-stretch flex gap-[4px] h-[36px] items-center justify-center px-[14px] py-[8px] relative rounded-[4px] shrink-0" data-name="Button (Secondary)">
              <div aria-hidden="true" className="absolute border border-[#0271ce] border-solid inset-0 pointer-events-none rounded-[4px]" />
              <div className="flex flex-col font-['Open_Sans:Medium',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#0271ce] text-[16px] text-center text-nowrap">
                <p className="leading-[normal] whitespace-pre">Cancel</p>
              </div>
            </div>
            <div className="basis-0 bg-white grow min-h-px min-w-px opacity-0 self-stretch shrink-0" data-name="Placeholder" />
            <div className="bg-[#0271ce] h-[36px] relative rounded-[4px] shrink-0" data-name="Button (primary)">
              <div className="flex flex-row items-center justify-center size-full">
                <div className="content-stretch flex gap-[4px] h-[36px] items-center justify-center p-[24px] relative">
                  <div className="flex flex-col font-['Open_Sans:Semi_Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-center text-nowrap text-white">
                    <p className="leading-[normal] whitespace-pre">Add to Learning Object</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div aria-hidden="true" className="absolute border-[1px_0px_0px] border-[rgba(28,48,74,0.52)] border-solid inset-0 pointer-events-none shadow-[0px_3px_12px_-1px_rgba(28,55,90,0.16),0px_2px_4px_-1px_rgba(28,55,90,0.16)]" />
      </div>
    </div>
  );
}