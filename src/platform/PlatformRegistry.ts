import type { PlatformServices } from './services';

export const PLATFORM_SERVICES_REGISTRY_KEY = 'platform-services';

export async function resolvePlatformServices(
  yandexFactory: () => Promise<PlatformServices | null>,
  localFactory: () => PlatformServices,
): Promise<PlatformServices> {
  try {
    const yandex = await yandexFactory();
    if (yandex !== null) return yandex;
  } catch {
    // Fall through to the local adapter. The game must remain playable.
  }

  return localFactory();
}
