import type { Dict } from "@/i18n";
import { contact, mapsEmbed, mapsLink } from "@/lib/site";
import { ArrowIcon, FacebookIcon, InstagramIcon, MailIcon } from "./Icons";
import { SectionHead } from "./ui";
import { BrandIcon } from "./BrandIcons";

function Row({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 border-t border-line py-6">
      <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-100 text-navy-800">{icon}</span>
      <div className="min-w-0">
        <dt className="text-sm text-ink-mute">{label}</dt>
        <dd className="mt-1 text-navy-900">{children}</dd>
      </div>
    </div>
  );
}

export default function Contact({ t }: { t: Dict }) {
  return (
    <section id="contact" aria-labelledby="contact-title" className="section">
      <div className="container">
        <SectionHead id="contact-title" index="08" label={t.contact.label} title={t.contact.title} />
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
          <address className="not-italic">
            <dl>
              <Row icon={<BrandIcon name="location" className="h-5 w-5" />} label={t.contact.addressLabel}>
                {t.contact.address.map((l) => (
                  <span key={l} className="block leading-relaxed">{l}</span>
                ))}
                <a href={mapsLink} target="_blank" rel="noopener" className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-teal-700 hover:underline">
                  {t.contact.openMap}
                  <ArrowIcon />
                </a>
              </Row>
              <Row icon={<BrandIcon name="phone" className="h-5 w-5" />} label={t.contact.phoneLabel}>
                <a href={contact.tel} dir="ltr" className="font-en text-lg font-medium hover:text-navy-700">
                  {contact.phoneDisplay}
                </a>
              </Row>
              <Row icon={<MailIcon />} label={t.contact.emailLabel}>
                <a href={`mailto:${contact.email}`} className="break-all font-en hover:text-navy-700">
                  {contact.email}
                </a>
              </Row>
              <Row icon={<InstagramIcon />} label={t.contact.socialLabel}>
                <span className="flex flex-wrap gap-x-6 gap-y-2">
                  <a href={contact.facebook} target="_blank" rel="noopener" className="inline-flex items-center gap-2 hover:text-navy-700">
                    <FacebookIcon className="h-4 w-4" />
                    {t.contact.facebook}
                  </a>
                  <a href={contact.instagram} target="_blank" rel="noopener" className="inline-flex items-center gap-2 hover:text-navy-700">
                    <InstagramIcon className="h-4 w-4" />
                    {t.contact.instagram}
                  </a>
                </span>
              </Row>
            </dl>
          </address>

          <div className="overflow-hidden rounded-[18px] border border-line bg-navy-50 shadow-card">
            <iframe
              title={t.contact.mapTitle}
              src={mapsEmbed}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-[340px] w-full lg:h-full lg:min-h-[420px]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
