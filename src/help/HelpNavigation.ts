export const HELP_SCENE_KEY = 'HelpScene';

export type HelpReturnSceneKey = 'HomeScene' | 'GameScene' | 'SettingsScene';

export interface HelpSceneData {
  readonly returnSceneKey: HelpReturnSceneKey;
}
