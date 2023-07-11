import { Link } from 'react-router-dom';

export default function LayoutLogo() {
  return (
    <Link className="logo" to="/">
      <img
        style={{ width: 43 }}
        src={`${import.meta.env.BASE_URL}logo64.png`}
      />
      <h1 className="logo_text">Fine Admin</h1>
    </Link>
  );
}
