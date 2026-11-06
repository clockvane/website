/** Copy deck `services.shared`: the four services as the "one place" tabs present them. */
import type { ExampleId } from './examples';
import type { ServiceKey } from './services';
import { services } from './services';

export interface ServiceTab {
  key: ServiceKey;
  name: string;
  summary: string;
  audience: string;
  cta: { label: string; href: string };
  link: { label: string; href: string };
  thumbs: [ExampleId, ExampleId, ExampleId];
}

export const serviceTabs: ServiceTab[] = services.map((service) => ({
  key: service.key,
  name: service.label,
  summary: service.summary,
  audience: service.audience,
  cta: service.cta,
  link: { label: service.linkLabel, href: service.href },
  thumbs: service.thumbs,
}));
