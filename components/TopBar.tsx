const baseTextItems = [
  '•Фото букета перед доставкой•',
  '•Доставка от 30 минут•',
  '•1000 бонусных рублей при первом заказе на сайте•',
  '•Кешбэк с каждого заказа до 15%•',
];

const LONG_ITEMS = Array(7).fill(baseTextItems).flat();

export default function TopBar() {
  return (
    <div className="relative h-10 select-none overflow-hidden bg-white text-black topbar-fade lg:bg-black lg:text-white">
      <div className="relative h-full w-full">
        <div
          className="absolute left-0 top-0 flex h-10 items-center"
          style={{
            width: 'max-content',
            minWidth: '220vw',
            animation: 'marquee-scroll 80s linear infinite',
            willChange: 'transform',
          }}
        >
          <div className="flex items-center whitespace-nowrap">
            {LONG_ITEMS.map((text, idx) => (
              <span key={idx} className="mx-5 text-[12px] font-medium sm:text-sm">
                {text}
              </span>
            ))}
          </div>

          <div className="flex items-center whitespace-nowrap" aria-hidden="true">
            {LONG_ITEMS.map((text, idx) => (
              <span key={idx} className="mx-5 text-[12px] font-medium sm:text-sm">
                {text}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
