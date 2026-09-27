import { calculateCompletionPanelLayout } from '../runtime/CompletionPanelLayout.ts';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const desktop = calculateCompletionPanelLayout(1920, 1080, 0, 2, true, {
  boardFrameWidth: 684, infoCount: 2, showMascots: true,
});
assert(desktop.mode === 'desktop', 'Wide desktop uses the two-column completion composition.');
assert(desktop.boardCenterX + 684 / 2 + 28 <= desktop.panelX - desktop.panelWidth / 2,
  'The solved board remains completely visible beside the panel.');
assert(desktop.panelTop > 100 && desktop.panelBottom < 980,
  'The dialog sits near the board instead of being pinned to the bottom edge.');
assert(desktop.primaryAction !== null && desktop.secondaryActions.length === 1,
  'Normal completion retains primary and secondary actions.');
assert(desktop.primaryAction!.height === desktop.secondaryActions[0]!.height,
  'Both action skins share a visible height.');

const shortDesktop = calculateCompletionPanelLayout(1280, 640, 0, 2, true, {
  boardFrameWidth: 400, infoCount: 4,
});
assert(shortDesktop.panelTop >= 100 && shortDesktop.panelBottom <= 640,
  'Four-stat short-desktop dialog fits the viewport.');
assert(shortDesktop.boardCenterX + 200 < shortDesktop.panelX - shortDesktop.panelWidth / 2,
  'Large solved board and result panel do not collide on short desktop.');

const phone = calculateCompletionPanelLayout(390, 844, 0, 2, true, {
  boardFrameWidth: 360, infoCount: 4,
});
assert(phone.mode === 'phone' && phone.panelWidth === 366,
  'Phone uses a wide portrait overlay within side margins.');
assert(phone.panelTop > 500 && phone.panelBottom <= 844,
  'Phone dialog leaves most of the solved puzzle visible.');
assert(phone.primaryAction !== null && phone.secondaryActions.length === 1,
  'Phone keeps a distinct full-width CTA and secondary action.');
assert(phone.primaryAction!.height === phone.secondaryActions[0]!.height && phone.primaryAction!.height >= 48,
  'Phone actions have matching usable height.');
assert(phone.secondaryActions[0]!.y + phone.secondaryActions[0]!.height / 2 <= phone.panelBottom,
  'The final phone button stays inside the stone surface.');

const secondaryOnly = calculateCompletionPanelLayout(390, 844, 0, 2, false);
assert(secondaryOnly.primaryAction === null && secondaryOnly.secondaryActions.length === 2,
  'Secondary-only completion does not invent a gold action.');

console.info('[Dungeon Logic] Completion layout sanity: board-first desktop + content-aware phone overlay passed');
