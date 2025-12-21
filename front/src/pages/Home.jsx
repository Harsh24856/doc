import doctorBg from "../assets/doctor-bg.png"

export default function Home() {
  

  return (
    <div
      className="relative min-h-screen bg-cover bg-center"
      style={{ backgroundImage: `url(${doctorBg})` }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Content */}
      <div className="relative z-10 flex items-center min-h-screen text-white">
        <div className="text-center max-w-2xl px-6">
          <h1 className="text-4xl font-bold mb-4">
            Welcome to Doc Space
          </h1>
          <p className="text-lg text-gray-200">
            Doc Space is a trusted professional network designed exclusively for doctors.
           Connect with peers, explore opportunities, and share knowledge in a secure,
           verified environment.

          </p>
        </div>
      </div>
    </div>
  );
}