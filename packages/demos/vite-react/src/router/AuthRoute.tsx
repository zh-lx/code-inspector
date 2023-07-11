import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/hooks/useAppHooks';
import { fetchIsTokenValid } from '@/services/api';
import { selectToken } from '@/store/reducer/userSlice';
import { useRequest } from 'ahooks';
import { Spin, Row, Col } from 'antd';

/**
 * Route authentication
 * @description Verify whether the user token is valid.
 * @workflow The current workflow is as follows: This component will be executed once each time the route authentication page that enters the system is initialized, and will not be executed again when the subsequent non-refresh mode jumps the page.
 * Instead, it is checked by the api used in the page, and if the api returns 401, authentication fails.
 */
// eslint-disable-next-line no-undef
export default function AuthRoute({ children }: { children: JSX.Element }) {
  const location = useLocation();
  const token = useAppSelector(selectToken);
  const { data: tokenIsValid, loading } = useRequest(fetchIsTokenValid, {
    // If you need to require authentication each time you switch routes, open the following two lines of comments.
    // loadingDelay: 300,
    // refreshDeps: [location]
  });

  if (loading) return <Loading />;

  if (!token || tokenIsValid === false) {
    return <Navigate to="/login" state={location} replace />;
  }

  return children;
}

function Loading() {
  return (
    <Row justify="center" align="middle" style={{ flex: 1 }}>
      <Col>
        <Spin tip="正在进行权限认证..." />
      </Col>
    </Row>
  );
}
