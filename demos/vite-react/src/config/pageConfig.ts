export type LayoutType = 'default' | false;

export interface PageConfig {
  // When the page is a non-menu page, this title will be displayed in the breadcrumbs. conversely, configuring this property in a menu page is invalid.
  title: string;
  layout?: LayoutType;
  // Whether to perform route authentication
  auth?: boolean;
  // If the page is not a menu page, then the page in the menu is stateless, at this time you want to specify the page to a certain state of the menu, add this property can be (while simultaneously rendering the crumbs)
  // In contrast, configuring the menuKey property in the menu page is invalid
  // The value is the menu key
  menuKey?: string;
  // wrappers?: Array<any>;
}

export const defaultPageConfig: Omit<PageConfig, 'title'> = {
  layout: 'default',
  auth: true
};

export const pageConfig: { [propName: string]: PageConfig } = {
  '/login': { title: '登录', layout: false, auth: false },
  '/non-menu': { title: '非菜单页面', menuKey: '/test' },
  '/details/:id?': { title: '动态详情页', menuKey: '/test' }
};
