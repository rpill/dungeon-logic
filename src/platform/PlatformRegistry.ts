import type { TechnicalErrorReporter } from '../analytics/AnalyticsService';
import type { PlatformServices } from './services';

export const PLATFORM_SERVICES_REGISTRY_KEY = 'platform-services';

export async function resolvePlatformServices(
  yandexFactory: () => Promise<PlatformServices | null>,
  localFactory: () => PlatformServices,
  reportTechnicalError: TechnicalErrorReporter = () => {},
): Promise<PlatformServices> {
  try {
    const yandex = await yandexFactory();
    if (yandex !== null) return yandex;
  } catch {
    reportTechnicalError('platform_init_failed', 'platform');
    // Fall through to the local adapter. The game must remain playable.
  }

  return localFactory();
}
