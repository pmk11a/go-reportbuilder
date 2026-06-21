import i18n from '../i18n/i18n';
import { APIError, ValidationError } from '../api/errors';

/**
 * Formats an API error into a user-friendly string based on the active language.
 */
/**
 * Extracts a user-friendly error message from an API error.
 * Falls back to the provided default string if the error cannot be parsed.
 */
export function apiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof APIError) {
    return error.message || fallback;
  }
  if (error instanceof ValidationError) {
    return error.message || fallback;
  }
  if (error instanceof Error) {
    return error.message || fallback;
  }
  return fallback;
}

export function formatAPIError(status: number, rawMsg: string): string {
  let issue = i18n.t('api.error.system_error');
  let cause = rawMsg || i18n.t('api.error.system_error');
  let nextSteps = i18n.t('api.error.default_next_steps');

  if (status === 401) {
    issue = i18n.t('api.error.authentication_failed');
    if (typeof rawMsg === 'string' && (rawMsg.toLowerCase().includes('username') || rawMsg.toLowerCase().includes('password'))) {
      cause = i18n.t('api.error.invalid_credentials_cause');
      nextSteps = i18n.t('api.error.invalid_credentials_next_steps');
    } else {
      cause = i18n.t('api.error.session_expired_cause');
      nextSteps = i18n.t('api.error.session_expired_next_steps');
    }
  } else if (status === 403) {
    issue = i18n.t('api.error.access_denied');
    nextSteps = i18n.t('api.error.access_denied_next_steps');
  } else if (status === 404) {
    issue = i18n.t('api.error.not_found');
    nextSteps = i18n.t('api.error.not_found_next_steps');
  } else if (status === 400) {
    issue = i18n.t('api.error.bad_request');
    nextSteps = i18n.t('api.error.bad_request_next_steps');
  } else if (status >= 500) {
    issue = i18n.t('api.error.internal_server_error');
    nextSteps = i18n.t('api.error.internal_server_error_next_steps');
  } else if (status === 504) {
    issue = i18n.t('api.error.connection_timeout');
    cause = i18n.t('api.error.timeout_cause');
    nextSteps = i18n.t('api.error.timeout_next_steps');
  }

  const cleanCause = String(cause).replace(/\.$/, '');
  return `${issue}: ${cleanCause}. ${nextSteps}`;
}
