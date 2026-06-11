import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enLogin from '../../domains/auth/locales/en/login.json';
import idLogin from '../../domains/auth/locales/id/login.json';
import enRegister from '../../domains/auth/locales/en/register.json';
import idRegister from '../../domains/auth/locales/id/register.json';
import enSessions from '../../domains/auth/locales/en/sessions.json';
import idSessions from '../../domains/auth/locales/id/sessions.json';
import enPeriode from '../../domains/settings/locales/en/periode.json';
import idPeriode from '../../domains/settings/locales/id/periode.json';
import enMenu from '../../domains/menu/locales/en/menu.json';
import idMenu from '../../domains/menu/locales/id/menu.json';
import enDashboard from '../../domains/dashboard/locales/en/dashboard.json';
import idDashboard from '../../domains/dashboard/locales/id/dashboard.json';
import enLogs from '../../domains/activity/locales/en/logs.json';
import idLogs from '../../domains/activity/locales/id/logs.json';
import enCompany from '../../domains/settings/locales/en/company.json';
import idCompany from '../../domains/settings/locales/id/company.json';
import enNumbering from '../../domains/settings/locales/en/numbering.json';
import idNumbering from '../../domains/settings/locales/id/numbering.json';
import enUsers from '../../domains/users/locales/en/users.json';
import idUsers from '../../domains/users/locales/id/users.json';
import enReports from '../../domains/reports/locales/en/reports.json';
import idReports from '../../domains/reports/locales/id/reports.json';
import enAccounting from '../../domains/accounting/locales/en/accounting.json';
import idAccounting from '../../domains/accounting/locales/id/accounting.json';

const resources = {
  en: {
    auth: {
      login: enLogin,
      register: enRegister,
      session: enSessions,
    },
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
    auth: {
      login: idLogin,
      register: idRegister,
      session: idSessions,
    },
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
    defaultNS: 'menu',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
  });

export default i18n;
