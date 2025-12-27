import Auth from "./Auth.jsx";

export default function Login({setSignedIn, setRole}) {
  return <Auth setSignedIn={setSignedIn} setRole={setRole} initialMode="login" />;
}
