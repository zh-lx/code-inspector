import { useParams } from 'react-router-dom';

export default function Details() {
  const params = useParams();
  return (
    <>
      <h1>详情页</h1>
      <h1>路由参数 id 值是：{params.id}</h1>
    </>
  );
}
