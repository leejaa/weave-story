import 'i18next';
import type common from '@/locales/en/common.json';
import type home from '@/locales/en/home.json';
import type library from '@/locales/en/library.json';
import type weave from '@/locales/en/weave.json';
import type reading from '@/locales/en/reading.json';
import type you from '@/locales/en/you.json';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: {
      common: typeof common;
      home: typeof home;
      library: typeof library;
      weave: typeof weave;
      reading: typeof reading;
      you: typeof you;
    };
  }
}
