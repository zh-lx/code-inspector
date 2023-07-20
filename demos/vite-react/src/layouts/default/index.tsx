import TopMenuLayout from './TopMenuLayout';
import SideMenuLayout from './SideMenuLayout';
import { useSelector } from 'react-redux';
import { selectLayoutMode } from '@/store/reducer/layoutSlice';
import { LocalSettingsDrawer } from './components/LocalSettings';

export type LayoutModeType = 'sidemenu' | 'topmenu';

export default function DefaultLayout() {
  const layoutMode = useSelector(selectLayoutMode);
  return (
    <>
      {layoutMode === 'sidemenu' && <SideMenuLayout />}
      {layoutMode === 'topmenu' && <TopMenuLayout />}
      <LocalSettingsDrawer />
    </>
  );
}
