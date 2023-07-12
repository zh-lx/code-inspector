import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '@/store';
import type { BreadcrumbType } from '@/layouts/default/components/Breadcrumb';
import type { LayoutModeType } from '@/layouts/default';

export interface LayoutState {
  layoutMode: LayoutModeType;
  collapsed: boolean;
  breadcrumb: BreadcrumbType;
  isDarkMode: boolean;
  themeColor: string;
  isOpenSetting: boolean;
  isFixedWidth: boolean;
}

const initialState: LayoutState = {
  layoutMode: 'sidemenu',
  collapsed: false,
  breadcrumb: ['首页'],
  isDarkMode: false,
  themeColor: '#1677ff',
  isOpenSetting: false,
  isFixedWidth: false
};

export const layoutSlice = createSlice({
  name: 'layout',
  initialState,
  reducers: {
    setLayoutMode: (state, action: PayloadAction<LayoutModeType>) => {
      state.layoutMode = action.payload;
    },
    setBreadcrumb: (state, action: PayloadAction<BreadcrumbType>) => {
      state.breadcrumb = action.payload;
    },
    setCollapsed: (state, action: PayloadAction<boolean>) => {
      state.collapsed = action.payload;
    },
    setDarkMode: (state, action: PayloadAction<boolean>) => {
      state.isDarkMode = action.payload;
    },
    setThemeColor: (state, action: PayloadAction<string>) => {
      state.themeColor = action.payload;
    },
    setIsOpenSetting: (state, action: PayloadAction<boolean>) => {
      state.isOpenSetting = action.payload;
    },
    setIsFixedWidth: (state, action: PayloadAction<boolean>) => {
      state.isFixedWidth = action.payload;
    }
  }
});

export const {
  setLayoutMode,
  setBreadcrumb,
  setCollapsed,
  setDarkMode,
  setThemeColor,
  setIsOpenSetting,
  setIsFixedWidth
} = layoutSlice.actions;

export const selectLayoutMode = (state: RootState) => state.layout.layoutMode;

export const selectCollapsed = (state: RootState) => state.layout.collapsed;

export const selectBreadcrumb = (state: RootState) => state.layout.breadcrumb;

export const selectIsDarkMode = (state: RootState) => state.layout.isDarkMode;

export const selectThemeColor = (state: RootState) => state.layout.themeColor;

export const selectIsOpenSetting = (state: RootState) =>
  state.layout.isOpenSetting;

export const selectIsFixedWidth = (state: RootState) =>
  state.layout.isFixedWidth;

export default layoutSlice.reducer;
