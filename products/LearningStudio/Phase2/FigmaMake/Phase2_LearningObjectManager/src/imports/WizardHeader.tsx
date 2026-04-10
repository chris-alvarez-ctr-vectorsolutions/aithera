function Heading() {
  return (
    <div className="content-stretch flex items-start overflow-clip relative rounded-[4px] shrink-0" data-name="Heading">
      <div className="flex flex-col font-['Open_Sans:Semi_Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-[rgba(0,0,0,0.87)] text-nowrap">
        <p className="leading-[20px] whitespace-pre">Manage Content</p>
      </div>
    </div>
  );
}

function Heading1() {
  return (
    <div className="basis-0 content-stretch flex grow items-start min-h-px min-w-px overflow-clip relative rounded-[4px] shrink-0" data-name="Heading">
      <div className="basis-0 flex flex-col font-['Open_Sans:Semi_Bold',sans-serif] grow justify-center leading-[0] min-h-px min-w-px not-italic opacity-0 relative shrink-0 text-[16px] text-[rgba(0,0,0,0.87)]">
        <p className="leading-[20px]">Manage Content</p>
      </div>
    </div>
  );
}

function IconBefore() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-name="Icon before">
      <div className="content-stretch flex h-[24px] items-center justify-center relative shrink-0" data-name="Icon">
        <div className="flex flex-col font-['Font_Awesome_6_Pro:Regular',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#3d4543] text-[16px] text-center text-nowrap">
          <p className="leading-[normal] whitespace-pre">comments</p>
        </div>
      </div>
    </div>
  );
}

function Button() {
  return (
    <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] place-items-start relative shrink-0" data-name="Button">
      <div className="[grid-area:1_/_1] bg-white box-border content-stretch flex gap-[4px] h-[36px] items-center justify-center ml-0 mt-0 p-[8px] relative" data-name="Toolbar-Icon-button">
        <div aria-hidden="true" className="absolute border-[0px_1px] border-solid border-white inset-0 pointer-events-none" />
        <IconBefore />
      </div>
    </div>
  );
}

export default function WizardHeader() {
  return (
    <div className="relative size-full" data-name="Wizard Header" style={{ backgroundImage: "linear-gradient(90deg, rgba(245, 249, 253, 0.05) 0%, rgba(245, 249, 253, 0.05) 100%), linear-gradient(90deg, rgb(255, 255, 255) 0%, rgb(255, 255, 255) 100%)" }}>
      <div aria-hidden="true" className="absolute border-[0px_0px_1px] border-[rgba(28,55,90,0.16)] border-solid bottom-[-1px] left-0 pointer-events-none right-0 top-0" />
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[24px] items-center px-[24px] py-0 relative size-full">
          <div className="box-border content-stretch flex gap-[4px] h-[36px] items-center justify-center min-w-[64px] px-[6px] py-[8px] relative rounded-[4px] shrink-0" data-name="Button (tertiary)">
            <div className="basis-0 flex flex-col font-['Open_Sans:Medium',sans-serif] grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#0271ce] text-[0px] text-center">
              <p className="[text-decoration-skip-ink:none] [text-underline-position:from-font] decoration-solid font-['Open_Sans:Regular',sans-serif] font-normal leading-[normal] text-[16px] underline" style={{ fontVariationSettings: "'wdth' 100" }}>{`Exit `}</p>
            </div>
          </div>
          <Heading />
          <Heading1 />
          <div className="bg-white box-border content-stretch flex gap-[4px] h-[36px] items-center justify-center px-[14px] py-[8px] relative rounded-[4px] shrink-0" data-name="Button (Secondary)">
            <div aria-hidden="true" className="absolute border border-[#0271ce] border-solid inset-0 pointer-events-none rounded-[4px]" />
            <div className="flex flex-col font-['Open_Sans:Medium',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#0271ce] text-[16px] text-center text-nowrap">
              <p className="leading-[normal] whitespace-pre">{`Save `}</p>
            </div>
          </div>
          <Button />
        </div>
      </div>
    </div>
  );
}