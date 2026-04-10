import svgPaths from "./svg-m3rg52vlmq";
import clsx from "clsx";

function Wrapper1({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="flex flex-row items-center justify-center size-full">
      <div className="content-stretch flex h-[29px] items-center justify-center px-[9px] py-[5px] relative w-full">{children}</div>
    </div>
  );
}
type WrapperProps = {
  additionalClassNames?: string;
};

function Wrapper({ children, additionalClassNames = "" }: React.PropsWithChildren<WrapperProps>) {
  return (
    <div className={clsx("size-[16px]", additionalClassNames)}>
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        {children}
      </svg>
    </div>
  );
}
type IconProps = {
  additionalClassNames?: string;
};

function Icon({ children, additionalClassNames = "" }: React.PropsWithChildren<IconProps>) {
  return (
    <Wrapper additionalClassNames={additionalClassNames}>
      <g id="Icon">{children}</g>
    </Wrapper>
  );
}
type PrimitiveLabelTextProps = {
  text: string;
  additionalClassNames?: string;
};

function PrimitiveLabelText({ text, additionalClassNames = "" }: PrimitiveLabelTextProps) {
  return (
    <div className={clsx("absolute content-stretch flex h-[17px] items-start left-0 top-[4px]", additionalClassNames)}>
      <p className="font-['Inter:Medium',sans-serif] font-medium leading-[14px] not-italic relative shrink-0 text-[#0f2e3d] text-[14px] text-nowrap tracking-[-0.1504px] whitespace-pre">{text}</p>
    </div>
  );
}

export default function PrimitiveDiv() {
  return (
    <div className="bg-[#f0f7fb] border border-[rgba(148,163,184,0.2)] border-solid relative rounded-[12px] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] size-full" data-name="Primitive.div">
      <div className="absolute content-stretch flex flex-col gap-[8px] h-[48px] items-start left-[24px] top-[24px] w-[850px]" data-name="DialogHeader">
        <div className="h-[20px] relative shrink-0 w-[850px]" data-name="Primitive.h2">
          <div className="bg-clip-padding border-0 border-[transparent] border-solid h-[20px] relative w-[850px]">
            <div className="absolute left-0 size-[20px] top-0" data-name="Icon">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
                <g clipPath="url(#clip0_2007_1515)" id="Icon">
                  <path d={svgPaths.p2061d800} id="Vector" stroke="var(--stroke-0, #0EA5E9)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                  <path d="M16.6667 1.66667V5" id="Vector_2" stroke="var(--stroke-0, #0EA5E9)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                  <path d="M18.3333 3.33333H15" id="Vector_3" stroke="var(--stroke-0, #0EA5E9)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                  <path d={svgPaths.p2661f400} id="Vector_4" stroke="var(--stroke-0, #0EA5E9)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                </g>
                <defs>
                  <clipPath id="clip0_2007_1515">
                    <rect fill="white" height="20" width="20" />
                  </clipPath>
                </defs>
              </svg>
            </div>
            <p className="absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[18px] left-[28px] not-italic text-[#0f2e3d] text-[18px] text-nowrap top-px tracking-[-0.4395px] whitespace-pre">Add Media</p>
          </div>
        </div>
        <div className="basis-0 grow min-h-px min-w-px relative shrink-0 w-[850px]" data-name="Primitive.p">
          <div className="bg-clip-padding border-0 border-[transparent] border-solid h-full relative w-[850px]">
            <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[20px] left-0 not-italic text-[14px] text-nowrap text-slate-600 top-0 tracking-[-0.1504px] whitespace-pre">Upload your own media, choose from stock images, or generate with AI</p>
          </div>
        </div>
      </div>
      <div className="absolute content-stretch flex flex-col gap-[8px] h-[572px] items-start left-[24px] top-[88px] w-[850px]" data-name="Container">
        <div className="bg-[rgba(240,249,255,0.6)] h-[36px] relative rounded-[16px] shrink-0 w-[850px]" data-name="Tab List">
          <div className="bg-clip-padding border-0 border-[transparent] border-solid grid grid-cols-[repeat(2,_minmax(0px,_1fr))] grid-rows-[repeat(1,_minmax(0px,_1fr))] h-[36px] px-[3px] py-[3.5px] relative w-[850px]">
            <div className="[grid-area:1_/_1] bg-white h-[29px] justify-self-stretch relative rounded-[16px] shrink-0" data-name="Primitive.button">
              <div aria-hidden="true" className="absolute border border-[rgba(14,165,233,0.3)] border-solid inset-0 pointer-events-none rounded-[16px] shadow-[0px_4px_12px_0px_rgba(14,165,233,0.15),0px_2px_6px_0px_rgba(14,165,233,0.1)]" />
              <Wrapper1>
                <p className="font-['Inter:Medium',sans-serif] font-medium leading-[20px] not-italic relative shrink-0 text-[14px] text-center text-nowrap text-sky-500 tracking-[-0.1504px] whitespace-pre">Custom Media</p>
              </Wrapper1>
              <div className="absolute inset-0 pointer-events-none shadow-[0px_1px_0px_0px_inset_rgba(255,255,255,0.9)]" />
            </div>
            <div className="[grid-area:1_/_2] h-[29px] justify-self-stretch relative rounded-[16px] shrink-0" data-name="Primitive.button">
              <div aria-hidden="true" className="absolute border border-[rgba(0,0,0,0)] border-solid inset-0 pointer-events-none rounded-[16px]" />
              <Wrapper1>
                <p className="font-['Inter:Medium',sans-serif] font-medium leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(15,46,61,0.7)] text-center text-nowrap tracking-[-0.1504px] whitespace-pre">Stock Media</p>
              </Wrapper1>
            </div>
          </div>
        </div>
        <div className="basis-0 grow min-h-px min-w-px relative shrink-0 w-[850px]" data-name="Tab Panel">
          <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[24px] h-full items-start pb-0 pt-[16px] px-0 relative w-[850px]">
            <div className="h-[164px] relative shrink-0 w-full" data-name="GenerateMediaDialog">
              <PrimitiveLabelText text="Upload Your Image" additionalClassNames="w-[124.844px]" />
              <div className="absolute content-stretch flex flex-col h-[140px] items-start left-0 pb-[2px] pt-[26px] px-[26px] rounded-[12px] top-[24px] w-[850px]" data-name="Container">
                <div aria-hidden="true" className="absolute border-2 border-[rgba(71,85,105,0.25)] border-solid inset-0 pointer-events-none rounded-[12px]" />
                <div className="content-stretch flex flex-col gap-[8px] h-[88px] items-center justify-center relative shrink-0 w-full" data-name="Label">
                  <div className="relative shrink-0 size-[40px]" data-name="Icon">
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 40 40">
                      <g id="Icon">
                        <path d="M20 5V25" id="Vector" stroke="var(--stroke-0, #475569)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.33333" />
                        <path d={svgPaths.p15151560} id="Vector_2" stroke="var(--stroke-0, #475569)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.33333" />
                        <path d={svgPaths.p3a358180} id="Vector_3" stroke="var(--stroke-0, #475569)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.33333" />
                      </g>
                    </svg>
                  </div>
                  <div className="h-[20px] relative shrink-0 w-[161.75px]" data-name="Text">
                    <div className="bg-clip-padding border-0 border-[transparent] border-solid h-[20px] relative w-[161.75px]">
                      <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[20px] left-0 not-italic text-[#0f2e3d] text-[14px] text-nowrap top-0 tracking-[-0.1504px] whitespace-pre">Click to upload an image</p>
                    </div>
                  </div>
                  <div className="h-[16px] relative shrink-0 w-[244.828px]" data-name="Text">
                    <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex h-[16px] items-start relative w-[244.828px]">
                      <p className="font-['Inter:Regular',sans-serif] font-normal leading-[16px] not-italic relative shrink-0 text-[12px] text-nowrap text-slate-600 whitespace-pre">Upload an existing image to edit or animate</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="h-[16px] relative shrink-0 w-full" data-name="GenerateMediaDialog">
              <div className="absolute border-[1px_0px_0px] border-[rgba(148,163,184,0.2)] border-solid h-px left-0 top-[7.5px] w-[850px]" data-name="Text" />
              <div className="absolute bg-[#f0f7fb] content-stretch flex h-[16px] items-start left-[351.14px] px-[8px] py-0 top-0 w-[147.703px]" data-name="Text">
                <p className="font-['Inter:Regular',sans-serif] font-normal leading-[16px] not-italic relative shrink-0 text-[12px] text-nowrap text-slate-600 uppercase whitespace-pre">Or generate with AI</p>
              </div>
            </div>
            <div className="h-[124px] relative shrink-0 w-full" data-name="GenerateMediaDialog">
              <PrimitiveLabelText text="Description" additionalClassNames="w-[75.938px]" />
              <div className="absolute bg-[rgba(255,255,255,0.5)] h-[100px] left-0 rounded-[10px] top-[24px] w-[850px]" data-name="Textarea">
                <div className="content-stretch flex h-[100px] items-start overflow-clip px-[12px] py-[8px] relative rounded-[inherit] w-[850px]">
                  <p className="font-['Inter:Regular',sans-serif] font-normal leading-[24px] not-italic relative shrink-0 text-[16px] text-nowrap text-slate-600 tracking-[-0.3125px] whitespace-pre">{`Describe the image you want to generate... (e.g., "A futuristic cityscape at sunset with flying cars")`}</p>
                </div>
                <div aria-hidden="true" className="absolute border border-[rgba(0,0,0,0)] border-solid inset-0 pointer-events-none rounded-[10px]" />
              </div>
            </div>
            <div className="h-[60px] relative shrink-0 w-full" data-name="GenerateMediaDialog">
              <PrimitiveLabelText text="Style" additionalClassNames="w-[33.406px]" />
              <div className="absolute content-stretch flex gap-[4px] h-[36px] items-start left-0 top-[24px] w-[850px]" data-name="Container">
                <div className="basis-0 bg-[rgba(255,255,255,0.5)] grow h-[36px] min-h-px min-w-px relative rounded-[10px] shrink-0" data-name="Primitive.button">
                  <div aria-hidden="true" className="absolute border border-[rgba(0,0,0,0)] border-solid inset-0 pointer-events-none rounded-[10px]" />
                  <div className="flex flex-row items-center size-full">
                    <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex h-[36px] items-center justify-between px-[13px] py-px relative w-full">
                      <div className="h-[36px] relative shrink-0 w-[128.516px]" data-name="GenerateMediaDialog">
                        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col h-[36px] items-start overflow-clip relative rounded-[inherit] w-[128.516px]">
                          <div className="basis-0 grow min-h-px min-w-px relative shrink-0 w-[128.516px]" data-name="Text">
                            <div className="bg-clip-padding border-0 border-[transparent] border-solid h-full relative w-[128.516px]">
                              <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[20px] left-[63.78px] not-italic text-[#0f2e3d] text-[14px] text-center text-nowrap top-0 tracking-[-0.1504px] translate-x-[-50%] whitespace-pre">Professional</p>
                            </div>
                          </div>
                          <div className="h-[16px] relative shrink-0 w-[128.516px]" data-name="Text">
                            <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex h-[16px] items-start relative w-[128.516px]">
                              <p className="font-['Inter:Regular',sans-serif] font-normal leading-[16px] not-italic relative shrink-0 text-[12px] text-center text-nowrap text-slate-600 whitespace-pre">Clear and authoritative</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <Wrapper additionalClassNames="relative shrink-0">
                        <g id="Icon" opacity="0.5">
                          <path d="M4 6L8 10L12 6" id="Vector" stroke="var(--stroke-0, #475569)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
                        </g>
                      </Wrapper>
                    </div>
                  </div>
                </div>
                <div className="bg-[#f0f7fb] relative rounded-[10px] shrink-0 size-[36px]" data-name="Button">
                  <div aria-hidden="true" className="absolute border border-[rgba(148,163,184,0.2)] border-solid inset-0 pointer-events-none rounded-[10px]" />
                  <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center p-px relative size-[36px]">
                    <Icon additionalClassNames="relative shrink-0">
                      <path d="M3.33333 8H12.6667" id="Vector" stroke="var(--stroke-0, #0F2E3D)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
                      <path d="M8 3.33333V12.6667" id="Vector_2" stroke="var(--stroke-0, #0F2E3D)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
                    </Icon>
                  </div>
                </div>
              </div>
            </div>
            <div className="content-stretch flex gap-[8px] h-[36px] items-start justify-end relative shrink-0 w-full" data-name="DialogFooter">
              <div className="bg-[#f0f7fb] h-[36px] relative rounded-[10px] shrink-0 w-[79.359px]" data-name="Button">
                <div aria-hidden="true" className="absolute border border-[rgba(148,163,184,0.2)] border-solid inset-0 pointer-events-none rounded-[10px]" />
                <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex h-[36px] items-center justify-center px-[17px] py-[9px] relative w-[79.359px]">
                  <p className="font-['Inter:Medium',sans-serif] font-medium leading-[20px] not-italic relative shrink-0 text-[#0f2e3d] text-[14px] text-center text-nowrap tracking-[-0.1504px] whitespace-pre">Cancel</p>
                </div>
              </div>
              <div className="bg-sky-500 h-[36px] opacity-50 relative rounded-[10px] shrink-0 w-[108.766px]" data-name="Button">
                <div className="bg-clip-padding border-0 border-[transparent] border-solid h-[36px] relative w-[108.766px]">
                  <Wrapper additionalClassNames="absolute left-[12px] top-[10px]">
                    <g clipPath="url(#clip0_2007_1500)" id="Icon">
                      <path d={svgPaths.p3b9f6b00} id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
                      <path d="M13.3333 1.33333V4" id="Vector_2" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
                      <path d="M14.6667 2.66667H12" id="Vector_3" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
                      <path d={svgPaths.p22966600} id="Vector_4" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
                    </g>
                    <defs>
                      <clipPath id="clip0_2007_1500">
                        <rect fill="white" height="16" width="16" />
                      </clipPath>
                    </defs>
                  </Wrapper>
                  <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[20px] left-[66.5px] not-italic text-[14px] text-center text-nowrap text-white top-[8px] tracking-[-0.1504px] translate-x-[-50%] whitespace-pre">Generate</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute left-[866px] opacity-70 rounded-[2px] size-[16px] top-[16px]" data-name="Primitive.button">
        <Icon additionalClassNames="absolute left-0 top-0">
          <path d="M12 4L4 12" id="Vector" stroke="var(--stroke-0, #0F2E3D)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d="M4 4L12 12" id="Vector_2" stroke="var(--stroke-0, #0F2E3D)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </Icon>
        <div className="absolute left-[7px] overflow-clip size-px top-[15px]" data-name="DialogContent">
          <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[24px] left-[20px] not-italic text-[#0f2e3d] text-[16px] text-center text-nowrap top-0 tracking-[-0.3125px] translate-x-[-50%] whitespace-pre">Close</p>
        </div>
      </div>
    </div>
  );
}