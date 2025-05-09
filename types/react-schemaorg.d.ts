declare module 'react-schemaorg' {
    import { ReactNode } from 'react';
  
    interface Organization {
      '@context': string;
      '@type': 'Organization';
      name: string;
      url: string;
      logo: string;
      sameAs?: string[];
      description: string;
      contactPoint: {
        '@type': 'ContactPoint';
        telephone: string;
        contactType: string;
        areaServed: string;
        availableLanguage: string;
      };
      address: {
        '@type': 'PostalAddress';
        streetAddress: string;
        addressLocality: string;
        addressCountry: string;
      };
      openingHours: string;
    }
  
    interface JsonLdProps<T> {
      item: T;
      children?: ReactNode;
    }
  
    export function JsonLd<T>(props: JsonLdProps<T>): JSX.Element;
  }