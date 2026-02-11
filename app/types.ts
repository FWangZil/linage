
export type WindowShape = 'haitang' | 'octagon' | 'moon' | 'square';
export type ActivePage = 'Home' | 'Origin' | 'Curated' | 'Journey' | 'Profile' | 'Embroidery' | 'Tea' | 'Experience';

export interface HeritageItem {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  shape: WindowShape;
}

export interface TeaRegion {
  id: string;
  name: string;
  chineseName: string;
  x: string;
  y: string;
  img: string;
  description: string;
}

export interface ExperienceItem {
  id: string;
  title: string;
  chineseTitle: string;
  description: string;
  imageUrl: string;
  location: string;
}
