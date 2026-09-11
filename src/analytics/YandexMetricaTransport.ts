import {
  NOOP_ANALYTICS_TRANSPORT,
  type AnalyticsTransport,
} from './AnalyticsTransport';

interface MetricaGlobalsLike {
  YaGames?: { init?: unknown };
  ym?: MetricaFunction;
}

type MetricaFunction = ((...args: unknown[]) => void) & {
  a?: readonly unknown[];
  l?: number;
};

export interface YandexMetricaTransportOptions {
  readonly prod: boolean;
  readonly counterId: string | undefined;
  readonly globals?: MetricaGlobalsLike;
  readonly document?: Document | null;
}

function parseCounterId(raw: string | undefined): number | null {
  if (raw === undefined || !/^\d+$/.test(raw.trim())) return null;
  const value = Number(raw);
  return Number.isSafeInteger(value) && value > 0 ? value : null;
}

export function createYandexMetricaTransport(
  options: YandexMetricaTransportOptions,
): AnalyticsTransport {
  const counterId = parseCounterId(options.counterId);
  const globals = options.globals ?? (globalThis as unknown as MetricaGlobalsLike);
  const documentRef = options.document === undefined
    ? (typeof document === 'undefined' ? null : document)
    : options.document;

  if (
    !options.prod
    || counterId === null
    || typeof globals.YaGames?.init !== 'function'
    || documentRef === null
  ) {
    return NOOP_ANALYTICS_TRANSPORT;
  }

  let disabled = false;
  let warned = false;
  const warnOnce = (error: unknown): void => {
    if (warned) return;
    warned = true;
    console.warn('Yandex Metrica disabled after provider failure.', error);
  };

  try {
    if (typeof globals.ym !== 'function') {
      const queue = ((...args: unknown[]) => {
        queue.a = [...(queue.a ?? []), args];
      }) as MetricaFunction;
      queue.a = [];
      queue.l = Date.now();
      globals.ym = queue;

      const script = documentRef.createElement('script');
      script.src = 'https://mc.yandex.ru/metrika/tag.js';
      script.async = true;
      script.onerror = () => {
        disabled = true;
        warnOnce(new Error('Yandex Metrica script failed to load.'));
      };
      documentRef.head.appendChild(script);
    }

    globals.ym(counterId, 'init', {
      clickmap: false,
      trackLinks: false,
      accurateTrackBounce: true,
      webvisor: false,
    });
  } catch (error) {
    disabled = true;
    warnOnce(error);
  }

  return {
    sendGoal(name, params): void {
      if (disabled) return;
      try {
        globals.ym?.(counterId, 'reachGoal', name, params);
      } catch (error) {
        disabled = true;
        warnOnce(error);
      }
    },
  };
}
