import type { IDbMenu } from '@/domains/menu/menu';

export interface PThemeToggleProps {
  className?: string;
}

export interface PStatCardProps {
  title: string;
  value: string | number;
  icon: string;
  trend?: string;
  trendUp?: boolean;
}

export interface PQuickLinkProps {
  title: string;
  icon: string;
  href: string;
  description: string;
}

export interface PAppBackgroundProps {
  children: React.ReactNode;
}

export interface PActivityItemProps {
  title: string;
  description: string;
  time: string;
  icon: string;
}

export interface PSidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export interface PHeaderProps {
  toggleSidebar: () => void;
  isScrolled: boolean;
}

export interface PMenuItemProps {
  item: {
    title: string;
    icon: string;
    route?: string;
    type: 'item' | 'group';
    items?: IDbMenu[];
  };
  isActive: (route?: string) => boolean;
}

// Filter Props
export interface PCustomerPickerProps {
  value?: string;
  onChange: (kode: string, name: string) => void;
  disabled?: boolean;
}

export interface PKasBankSelectProps {
  value?: string;
  onChange: (kode: string, name: string) => void;
  disabled?: boolean;
}

export interface PPerkiraanSelectProps {
  value?: string;
  onChange: (kode: string, name: string) => void;
  disabled?: boolean;
}

// Report Builder Props
export interface PLayoutHeaderBuilderProps {
  config: any;
  onChange: (config: any) => void;
}

export interface PLayoutBodyBuilderProps {
  config: any;
  onChange: (config: any) => void;
}

export interface PLayoutFooterBuilderProps {
  config: any;
  onChange: (config: any) => void;
}

export interface PMenuFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: IDbMenu | null;
}
