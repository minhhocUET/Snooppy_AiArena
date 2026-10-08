import { AssetReference, AvatarPreset, BackgroundPreset } from '../types';

function pendingAsset(assetId: string): AssetReference {
  return { status: 'PENDING_ASSET', assetId };
}

const uprightReferenceLandmarks = {
  headCenter: { x: 0.5, y: 0.155 },
  neckCenter: { x: 0.5, y: 0.227 },
  leftShoulder: { x: 0.35, y: 0.264 },
  rightShoulder: { x: 0.65, y: 0.264 },
  chestCenter: { x: 0.5, y: 0.386 },
  waistCenter: { x: 0.5, y: 0.489 },
  hipCenter: { x: 0.5, y: 0.534 },
  leftFoot: { x: 0.408, y: 0.895 },
  rightFoot: { x: 0.592, y: 0.895 },
  leftHand: { x: 0.292, y: 0.591 },
  rightHand: { x: 0.708, y: 0.591 },
  leftEye: { x: 0.475, y: 0.148 },
  rightEye: { x: 0.525, y: 0.148 },
} as const;

export const AVATAR_PRESETS: AvatarPreset[] = [
  {
    avatarPresetId: 'avatar_001',
    name: 'Mẫu người 01',
    description: 'Mẫu đứng thẳng, nhìn chính diện.',
    assets: { base: pendingAsset('avatar_001_base') },
    canvas: { width: 1000, height: 1400 },
    rendererProfileId: 'upright-front-provisional',
    landmarks: uprightReferenceLandmarks,
  },
  {
    avatarPresetId: 'avatar_002',
    name: 'Mẫu người 02',
    description: 'Mẫu đứng thẳng thứ hai, dùng chung rig tham chiếu.',
    assets: { base: pendingAsset('avatar_002_base') },
    canvas: { width: 1000, height: 1400 },
    rendererProfileId: 'upright-front-provisional',
    landmarks: uprightReferenceLandmarks,
  },
];

export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  {
    backgroundPresetId: 'background_001',
    name: 'Studio tối giản',
    description: 'Phông trung tính mặc định.',
    asset: pendingAsset('background_001'),
    recommendedOccasionIds: [],
  },
  {
    backgroundPresetId: 'background_002',
    name: 'Sân khấu tốt nghiệp',
    description: 'Phông sự kiện tốt nghiệp tổng quát.',
    asset: pendingAsset('background_002'),
    recommendedOccasionIds: ['occ_graduation'],
  },
  {
    backgroundPresetId: 'background_003',
    name: 'Phố xuân cách tân',
    description: 'Phông phố xuân cách tân tổng quát.',
    asset: pendingAsset('background_003'),
    recommendedOccasionIds: ['occ_spring_walk'],
  },
];
