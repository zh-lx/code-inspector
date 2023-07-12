import { Suspense } from 'react';
import { RouterProvider } from 'react-router-dom';
import router from '@/router/index';
import Loading from '@/components/Loading';
import useGlobalTips from '@/hooks/useGlobalTips';

function MyApp() {
  useGlobalTips();
  return (
    <Suspense fallback={<Loading />}>
      <RouterProvider router={router} />
    </Suspense>
  );
}

export default MyApp;
