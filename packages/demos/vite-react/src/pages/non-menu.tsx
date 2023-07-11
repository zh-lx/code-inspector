export default function NonMenuPage() {
  return (
    <>
      <h1>非菜单页面</h1>
      <h3>
        当前页面不属于菜单页面，但也可以通过在 `config/pageConfig.ts`
        中为当前页面配置menuKey从而定位到菜单某个状态
      </h3>
    </>
  );
}
