import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enCommon from '../../locales/en/common.json';
import idCommon from '../../locales/id/common.json';
import enPeriode from '../../locales/en/periode.json';
import idPeriode from '../../locales/id/periode.json';
import enMenu from '../../locales/en/menu.json';
import idMenu from '../../locales/id/menu.json';
import enDashboard from '../../locales/en/dashboard.json';
import idDashboard from '../../locales/id/dashboard.json';
import enLogs from '../../locales/en/logs.json';
import idLogs from '../../locales/id/logs.json';
import enCompany from '../../locales/en/company.json';
import idCompany from '../../locales/id/company.json';
import enNumbering from '../../locales/en/numbering.json';
import idNumbering from '../../locales/id/numbering.json';
import enUsers from '../../locales/en/users.json';
import idUsers from '../../locales/id/users.json';
import enReports from '../../locales/en/reports.json';
import idReports from '../../locales/id/reports.json';
import enAccounting from '../../locales/en/accounting.json';
import idAccounting from '../../locales/id/accounting.json';

const resources = {
  en: {
    common: enCommon,
    periode: enPeriode,
    menu: enMenu,
    dashboard: enDashboard,
    logs: enLogs,
    company: enCompany,
    numbering: enNumbering,
    users: enUsers,
    reports: enReports,
    accounting: enAccounting,
  },
  id: {
    common: idCommon,
    periode: idPeriode,
    menu: idMenu,
    dashboard: idDashboard,
    logs: idLogs,
    company: idCompany,
    numbering: idNumbering,
    users: idUsers,
    reports: idReports,
    accounting: idAccounting,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    defaultNS: 'common',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
  });

export default i18n;
