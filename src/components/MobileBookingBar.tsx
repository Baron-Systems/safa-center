import type { Dict } from "@/i18n";
import { contact } from "@/lib/site";
import { PhoneIcon, WhatsAppIcon } from "./Icons";

export default function MobileBookingBar({ t }: { t: Dict }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur md:hidden">
      <div className="grid grid-cols-2 gap-3">
        <a href={contact.tel} className="btn-primary !py-3">
          <PhoneIcon className="h-[18px] w-[18px]" />
          {t.cta.callShort}
        </a>
        <a href={contact.whatsapp} target="_blank" rel="noopener" className="btn-outline !py-3">
          <WhatsAppIcon className="h-[18px] w-[18px]" />
          {t.cta.whatsapp}
        </a>
      </div>
    </div>
  );
}
