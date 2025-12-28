import Auth from "./Auth.jsx";

export default function Signup({setSignedIn, setRole}) {
  return <Auth setSignedIn={setSignedIn} setRole={setRole} initialMode="signup" />;
}
