export interface NavigationMenuItem {
  title: string;
  path: string;
  icon: string;
  activePaths?: string[];
}

export interface NavigationMenuGroup {
  title: string;
  items: NavigationMenuItem[];
}
