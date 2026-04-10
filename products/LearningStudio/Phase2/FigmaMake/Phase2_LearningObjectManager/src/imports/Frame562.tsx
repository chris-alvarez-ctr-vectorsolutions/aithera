import clsx from "clsx";
type WrapperProps = {
  additionalClassNames?: string;
};

function Wrapper({ children, additionalClassNames = "" }: React.PropsWithChildren<WrapperProps>) {
  return (
    <div style={{ "--transform-inner-width": "63.125", "--transform-inner-height": "18.5" } as React.CSSProperties} className={clsx("flex items-center justify-center relative shrink-0", additionalClassNames)}>
      {children}
    </div>
  );
}

function ButtonIconOnly2({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="bg-white content-stretch flex items-center justify-center px-[8px] py-[6px] relative rounded-[4px] shadow-[0px_3px_12px_-1px_rgba(28,55,90,0.16),0px_2px_4px_-1px_rgba(28,55,90,0.16)] shrink-0 size-[40px]">
      <Wrapper additionalClassNames="h-[12px] w-[16px]">{children}</Wrapper>
    </div>
  );
}
type ButtonIconOnly1Props = {
  additionalClassNames?: string;
};

function ButtonIconOnly1({ children, additionalClassNames = "" }: React.PropsWithChildren<ButtonIconOnly1Props>) {
  return (
    <div className={clsx("content-stretch flex items-center justify-center px-[8px] py-[6px] relative rounded-[4px] shadow-[0px_3px_12px_-1px_rgba(28,55,90,0.16),0px_2px_4px_-1px_rgba(28,55,90,0.16)] shrink-0 size-[40px]", additionalClassNames)}>
      <Wrapper additionalClassNames="size-[19.799px]">
        <div className="flex-none rotate-[315deg]">{children}</div>
      </Wrapper>
    </div>
  );
}

function ButtonIconOnly() {
  return (
    <div className="bg-white content-stretch flex items-center justify-center px-[8px] py-[6px] relative rounded-[4px] shadow-[0px_3px_12px_-1px_rgba(28,55,90,0.16),0px_2px_4px_-1px_rgba(28,55,90,0.16)] shrink-0 size-[40px]">
      <Wrapper additionalClassNames="size-[19.799px]">
        <div className="flex-none rotate-[45deg]">
          <V7IconProText text="arrow-up" />
        </div>
      </Wrapper>
    </div>
  );
}
type V7IconProTextProps = {
  text: string;
  additionalClassNames?: string;
};

function V7IconProText({ text, additionalClassNames = "" }: V7IconProTextProps) {
  return (
    <div className={clsx("content-stretch flex flex-col items-center justify-center pb-[16px] pt-0 px-0 relative", additionalClassNames)}>
      <div className="flex flex-col font-['Font_Awesome_7_Pro:Regular',sans-serif] justify-center leading-[0] mb-[-16px] not-italic relative shrink-0 text-[#192434] text-[16px] text-center text-nowrap">
        <p className="leading-[normal] whitespace-pre">{text}</p>
      </div>
    </div>
  );
}

export default function Frame() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start relative size-full">
      <div className="content-stretch flex gap-[4px] items-start relative shrink-0">
        <ButtonIconOnly1 additionalClassNames="bg-[#0065ba]">
          <div className="content-stretch flex flex-col items-center justify-center pb-[16px] pt-0 px-0 relative" data-name="v7-icon (pro)">
            <div className="flex flex-col font-['Font_Awesome_7_Pro:Regular',sans-serif] justify-center leading-[0] mb-[-16px] not-italic relative shrink-0 text-[16px] text-center text-nowrap text-white">
              <p className="leading-[normal] whitespace-pre">arrow-up</p>
            </div>
          </div>
        </ButtonIconOnly1>
        <div className="bg-white content-stretch flex h-[40px] items-center justify-center px-[8px] py-[6px] relative rounded-[4px] shadow-[0px_3px_12px_-1px_rgba(28,55,90,0.16),0px_2px_4px_-1px_rgba(28,55,90,0.16)] shrink-0" data-name="Button (icon-only)">
          <div className="content-stretch flex items-center justify-center relative shrink-0 size-[24px]" data-name="Font Awesome Icon">
            <V7IconProText text="arrow-up" additionalClassNames="shrink-0" />
          </div>
        </div>
        <ButtonIconOnly />
      </div>
      <div className="content-stretch flex gap-[4px] items-start relative shrink-0">
        <ButtonIconOnly2>
          <div className="flex-none rotate-[270deg]">
            <V7IconProText text="arrow-up" />
          </div>
        </ButtonIconOnly2>
        <div className="bg-white content-stretch flex h-[40px] items-center justify-center px-[8px] py-[6px] relative rounded-[4px] shadow-[0px_3px_12px_-1px_rgba(28,55,90,0.16),0px_2px_4px_-1px_rgba(28,55,90,0.16)] shrink-0" data-name="Button (icon-only)">
          <div className="content-stretch flex items-center justify-center relative shrink-0 size-[24px]" data-name="Font Awesome Icon">
            <V7IconProText text="circle" additionalClassNames="shrink-0" />
          </div>
        </div>
        <ButtonIconOnly2>
          <div className="flex-none rotate-[90deg]">
            <V7IconProText text="arrow-up" />
          </div>
        </ButtonIconOnly2>
      </div>
      <div className="flex items-center justify-center relative shrink-0">
        <div className="flex-none rotate-[180deg]">
          <div className="content-stretch flex gap-[4px] items-start relative">
            <ButtonIconOnly1 additionalClassNames="bg-white">
              <V7IconProText text="arrow-up" />
            </ButtonIconOnly1>
            <div className="bg-white content-stretch flex h-[40px] items-center justify-center px-[8px] py-[6px] relative rounded-[4px] shadow-[0px_3px_12px_-1px_rgba(28,55,90,0.16),0px_2px_4px_-1px_rgba(28,55,90,0.16)] shrink-0" data-name="Button (icon-only)">
              <div className="content-stretch flex items-center justify-center relative shrink-0 size-[24px]" data-name="Font Awesome Icon">
                <V7IconProText text="arrow-up" additionalClassNames="shrink-0" />
              </div>
            </div>
            <ButtonIconOnly />
          </div>
        </div>
      </div>
    </div>
  );
}