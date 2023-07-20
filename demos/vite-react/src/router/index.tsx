/* eslint-disable no-undef */
/**
 * Generating routes
 * Issues to consider here:
 * 1. Route nesting
 * 2. Route parameter
 * 3. Route authentication
 */
import { lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';
import {
  defaultPageConfig,
  pageConfig,
  type LayoutType,
  type PageConfig
} from '@/config/pageConfig';

const AuthRoute = lazy(() => import('./AuthRoute'));
const ErrorPage = lazy(() => import('@/components/ErrorBoundary'));
const NotFound = lazy(() => import('@/pages/404'));

const pageComponentModules = import.meta.glob([
  '@/pages/**/*.tsx',
  '!@/pages/**/components/**/*.tsx'
]);

const layoutComponentModules = import.meta.glob([
  '@/layouts/*.tsx',
  '@/layouts/*/index.tsx'
]);

type LayoutConfig = { type: LayoutType; component: JSX.Element };

const layoutConfigs = Object.entries(layoutComponentModules).map(
  ([layoutPath, layoutComp]) => {
    const layoutType = layoutPath
      .replace('/src/layouts/', '')
      .replace(/.tsx|\/index.tsx/, '') as LayoutType;
    const LayoutComponent = lazy(layoutComp as any);
    return { type: layoutType, component: <LayoutComponent /> } as LayoutConfig;
  }
);

export type RouteConfig = RouteObject & Partial<PageConfig>;

const routeConfigs: Array<RouteConfig> = Object.entries(
  pageComponentModules
).map(([pagePath, dynamicImport]) => {
  const PageComponent = lazy(dynamicImport as any);
  const path = parsePath(pagePath);
  const config = { ...defaultPageConfig, ...(pageConfig[path] || {}) };
  return {
    ...config,
    path,
    element: config.auth ? (
      <AuthRoute>
        <PageComponent />
      </AuthRoute>
    ) : (
      <PageComponent />
    )
  };
});

export type Routes = RouteObject[];
export const routes = generateRoutes(layoutConfigs, routeConfigs);

export default createBrowserRouter(
  [...routes, { path: '*', element: <NotFound /> }],
  { basename: import.meta.env.BASE_URL }
);

/**
 * The route path is generated based on the page file address
 * @param pagePath
 * @returns
 */
function parsePath(pagePath: string) {
  let path = pagePath.replace('/src/pages', '').replace(/.tsx|\/index.tsx/, '');
  if (/\[\[.+?\]\]/.test(path)) {
    return path.replace(/\[\[/g, ':').replace(/\]\]/g, '?');
  }
  if (/\[.+?\]/.test(path)) {
    return path.replace(/\[/g, ':').replace(/\]/g, '');
  }
  return path || '/';
}

/**
 * Generate react-router configuration
 * @param layoutConfigs
 * @param routeConfigs
 * @returns
 */
function generateRoutes(
  layoutConfigs: Array<LayoutConfig>,
  routeConfigs: Array<RouteConfig>
): RouteConfig[] {
  const noUseLayoutRoutes = routeConfigs.filter(
    (routeConfig) => routeConfig.layout === false
  );
  const useLayoutRoutes = layoutConfigs.map((layoutConf) => {
    const layoutRoutes = routeConfigs.filter(
      (routeConf) => routeConf.layout === layoutConf.type
    );
    return {
      errorElement: <ErrorPage />,
      element: layoutConf.component,
      children: layoutRoutes
    };
  });
  return [...useLayoutRoutes, ...noUseLayoutRoutes];
}
