export type PresetName = 'silver_pure'|'silver_mist'|'liquid_chrome'|'metallic_flow'|'cosmic_silver';

// 收敛第三方/核心产出的 presetId → UI 背景名
export function mapPresetIdToUiName(presetId?: string, fallback: PresetName='cosmic_silver'): PresetName {
  if (!presetId) return fallback;
  const id = String(presetId).toLowerCase();
  if (id.includes('break')) return 'silver_pure';
  if (id.includes('build')) return 'silver_mist';
  if (id.includes('fill')) return 'liquid_chrome';
  if (id.includes('drop') || id.includes('flow')) return 'metallic_flow';
  if (id.includes('silver') || id.includes('cosmic')) return 'cosmic_silver';
  return fallback;
}
