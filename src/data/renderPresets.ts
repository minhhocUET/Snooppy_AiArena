import { AvatarPreset, BackgroundPreset } from '../types';

export const AVATAR_PRESETS: AvatarPreset[] = [
  {
    avatarPresetId: 'avatar_snoopy_classic',
    name: 'Mannequin Tiêu Chuẩn (2D)',
    description: 'Người mẫu thời trang 2D phong cách minh họa cổ điển.',
    assets: {
      base: {
        status: 'PENDING_ASSET',
        assetId: 'snoopy_base',
      },
    },
    canvas: { width: 1000, height: 1400 },
    rendererProfileId: 'profile_snoopy_2d',
    landmarks: {
      headCenter: { x: 0.5, y: 0.22 },
      neckCenter: { x: 0.5, y: 0.35 },
      leftShoulder: { x: 0.35, y: 0.38 },
      rightShoulder: { x: 0.65, y: 0.38 },
      chestCenter: { x: 0.5, y: 0.45 },
      waistCenter: { x: 0.5, y: 0.55 },
      hipCenter: { x: 0.5, y: 0.65 },
      leftFoot: { x: 0.42, y: 0.9 },
      rightFoot: { x: 0.58, y: 0.9 },
      leftHand: { x: 0.25, y: 0.55 },
      rightHand: { x: 0.75, y: 0.55 },
      leftEye: { x: 0.45, y: 0.2 },
      rightEye: { x: 0.55, y: 0.2 },
    },
  },
  {
    avatarPresetId: 'avatar_model_nu',
    name: 'Người Mẫu Nữ (Thanh Lịch)',
    description: 'Phom dáng thanh thoát, phù hợp với Áo Tấc, Áo Ngũ Thân và váy/quần suông.',
    assets: {
      base: {
        status: 'PENDING_ASSET',
        assetId: 'model_nu_base',
      },
    },
    canvas: { width: 1000, height: 1400 },
    rendererProfileId: 'profile_model_nu',
    landmarks: {
      headCenter: { x: 0.5, y: 0.2 },
      neckCenter: { x: 0.5, y: 0.32 },
      leftShoulder: { x: 0.36, y: 0.36 },
      rightShoulder: { x: 0.64, y: 0.36 },
      chestCenter: { x: 0.5, y: 0.44 },
      waistCenter: { x: 0.5, y: 0.54 },
      hipCenter: { x: 0.5, y: 0.63 },
      leftFoot: { x: 0.43, y: 0.88 },
      rightFoot: { x: 0.57, y: 0.88 },
      leftHand: { x: 0.28, y: 0.53 },
      rightHand: { x: 0.72, y: 0.53 },
      leftEye: { x: 0.46, y: 0.18 },
      rightEye: { x: 0.54, y: 0.18 },
    },
  },
  {
    avatarPresetId: 'avatar_model_nam',
    name: 'Người Mẫu Nam (Đĩnh Đạc)',
    description: 'Phom dáng đĩnh đạc, chuẩn tỷ lệ áo ngũ thân tay chẽn hoặc tay thụng.',
    assets: {
      base: {
        status: 'PENDING_ASSET',
        assetId: 'model_nam_base',
      },
    },
    canvas: { width: 1000, height: 1400 },
    rendererProfileId: 'profile_model_nam',
    landmarks: {
      headCenter: { x: 0.5, y: 0.2 },
      neckCenter: { x: 0.5, y: 0.32 },
      leftShoulder: { x: 0.32, y: 0.35 },
      rightShoulder: { x: 0.68, y: 0.35 },
      chestCenter: { x: 0.5, y: 0.43 },
      waistCenter: { x: 0.5, y: 0.55 },
      hipCenter: { x: 0.5, y: 0.65 },
      leftFoot: { x: 0.42, y: 0.9 },
      rightFoot: { x: 0.58, y: 0.9 },
      leftHand: { x: 0.24, y: 0.55 },
      rightHand: { x: 0.76, y: 0.55 },
      leftEye: { x: 0.46, y: 0.18 },
      rightEye: { x: 0.54, y: 0.18 },
    },
  },
];

export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  {
    backgroundPresetId: 'bg_hue_citadel',
    name: 'Hoàng Thành Cố Đô',
    description: 'Khung cảnh cung đình cổ kính với hành lang sơn son thếp vàng.',
    asset: {
      status: 'PENDING_ASSET',
      assetId: 'bg_hue_asset',
    },
    recommendedOccasionIds: ['occ_royal_court', 'occ_traditional_festival'],
  },
  {
    backgroundPresetId: 'bg_van_mieu',
    name: 'Văn Miếu - Quốc Tử Giám',
    description: 'Khuê Văn Các và hồ sen ngát hương, đậm chất học thức trang trọng.',
    asset: {
      status: 'PENDING_ASSET',
      assetId: 'bg_van_mieu_asset',
    },
    recommendedOccasionIds: ['occ_graduation', 'occ_school_event'],
  },
  {
    backgroundPresetId: 'bg_hanoi_cafe',
    name: 'Phố Cổ & Quán Cà Phê Mùa Thu',
    description: 'Ban công rêu phong với nắng vàng ấm áp bên tách cà phê trứng.',
    asset: {
      status: 'PENDING_ASSET',
      assetId: 'bg_hanoi_cafe_asset',
    },
    recommendedOccasionIds: ['occ_casual_walk', 'occ_dating'],
  },
  {
    backgroundPresetId: 'bg_studio_minimal',
    name: 'Studio Nghệ Thuật Đương Đại',
    description: 'Phông nền studio trung tính, tối giản phong cách bảo tàng triển lãm.',
    asset: {
      status: 'PENDING_ASSET',
      assetId: 'bg_studio_asset',
    },
    recommendedOccasionIds: ['occ_art_gallery', 'occ_fashion_remix'],
  },
];
