import { useNavigate, matchRoutes, matchPath } from 'react-router-dom';
import type { ItemType } from 'antd/es/menu/hooks/useItems';
import { routes } from '@/router';
import { menus, type MenuItem } from '@/config/menuConfig';
import { useSetState, useEventListener } from 'ahooks';
import { flatArrTree } from '@/utils/utils';
import Icon from '@/components/Icons';

interface State {
  openKeys?: string[];
  selectKey?: string;
}

export default function useMenu() {
  const navigate = useNavigate();

  const [state, setState] = useSetState<State>({
    openKeys: [],
    selectKey: ''
  });

  const updateMenuState = ({ openKeys = [], selectKey }: State) => {
    setState((prevState) => ({
      openKeys: openKeys.length > 0 ? openKeys : prevState.openKeys,
      selectKey
    }));
  };

  // Calculate the menu status at initialization
  useEffect(() => {
    if (menus.length === 0) {
      return;
    }
    const menuState = mapRouteToMenuStatus(menus, location.pathname) || {};
    updateMenuState(menuState as State);
  }, []);

  // Calculates the status of the menu when the page moves forward or backward
  useEventListener(
    'popstate',
    () => {
      const menuState = mapRouteToMenuStatus(menus, location.pathname) || {};
      updateMenuState(menuState as State);
    },
    { target: window }
  );

  const onOpenChange = (keys: string[]) => {
    const rootKeys = menus
      .filter((item) => item.children && item.children.length > 0)
      .map((item) => item.key);

    const latestOpenKey = keys.length > 0 ? keys[keys.length - 1] : undefined;

    if (latestOpenKey && rootKeys.includes(latestOpenKey)) {
      // 走到这里说明打开新的根菜单
      setState({ openKeys: [latestOpenKey] });
    } else {
      // 走到这里说明两种情况：
      // 1. onchange keys 是空的，直接赋值。
      // 2. 打开的是子菜单，也是直接赋值。
      setState({ openKeys: keys });
    }
  };

  return {
    selectKey: state.selectKey,
    onSelectKey: (key: string) => {
      setState({ selectKey: key });
      navigate(key);
    },
    openKeys: state.openKeys,
    onOpenKeys: onOpenChange,
    items: generateMenuItems(menus)
  };
}

/**
 * Generate Menu component data
 * @param {MenuItem[]} data
 * @returns
 */
const generateMenuItems = (data: MenuItem[]): ItemType[] => {
  const menu: ItemType[] = [];
  data.forEach((item) => {
    let children;
    if (item.children) {
      children = generateMenuItems(item.children);
    }
    menu.push({
      key: item.key,
      label: item.label,
      icon: <Icon type={item.icon} />,
      children
    } as ItemType);
  });
  return menu;
};

/**
 * Map route to menu status
 * @returns
 */
export const mapRouteToMenuStatus = (menus: MenuItem[], pathname: string) => {
  const selectKey = computeMenuStatusSelectKey(menus, pathname);
  if (!selectKey) return;
  const openKeys = computeMenuStatusOpenKeys(menus, selectKey);
  return { selectKey, openKeys };
};

/**
 * Compute the selectKey value
 */
function computeMenuStatusSelectKey(menus: MenuItem[], path: string) {
  if (menus.length === 0) return;
  // First step: Check whether the current route is a menu route.
  const menuKeys: string[] = flatArrTree(menus, 'children')
    .map((item: any) => item.key)
    .filter(Boolean);
  if (menuKeys.length === 0) return;
  let selectKey = menuKeys.find((item) => item === path);
  if (selectKey) return selectKey;
  // Second step: Whether menuKey is configured in the current route configuration.
  const currentPageMatchRoutes = matchRoutes(routes, path);
  const currentRoute = currentPageMatchRoutes?.at(-1)?.route;
  if (currentRoute?.menuKey) return currentRoute.menuKey;
  // Third step: Check whether the current route is a dynamic route, obtain the matching mode, and check whether there is a key successfully matched in the menu.
  return menuKeys.find((item) => matchPath(currentRoute?.path as any, item));
}

/**
 * Compute the openKeys value
 */
function computeMenuStatusOpenKeys(menus: MenuItem[], selectKey: string) {
  const newMenus: (MenuItem & { _parent_: string })[] = flatArrTree(
    menus,
    'children'
  );
  let openKeys: string[] = [];
  const generateOpenKeys = (key: string, isUseValue: boolean) => {
    const item = newMenus.find((item) => item.key === key);
    if (!item) {
      return;
    }
    isUseValue && openKeys.push(item.key);
    if (item?._parent_) {
      generateOpenKeys(item._parent_, true);
    }
  };
  generateOpenKeys(selectKey, false);
  return openKeys;
}
