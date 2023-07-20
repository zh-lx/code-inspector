import { fetchUserInfo } from '@/services/api';
import { setUserInfo } from '@/store/reducer/userSlice';
import { store } from '@/store';

export const useUserInfo = function () {
  return useAppSelector(selectUserInfo);
};

export const initUserInfo = async function () {
  const user = JSON.parse(localStorage.getItem('persist:user') || '{}');
  if (!user.token) {
    return;
  }
  const userInfo = await fetchUserInfo();
  store.dispatch(setUserInfo(userInfo));
};
