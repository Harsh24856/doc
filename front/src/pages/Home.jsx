import doctorBg from "../assets/doctor-bg.png";
import PeopleSearch from "../components/PeopleSearch";

export default function Home() {
  return (
    <div
      className="relative min-h-screen bg-cover bg-center"
      style={{ backgroundImage: `url(${doctorBg})` }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Content */}
      <div className="relative z-10 flex items-center min-h-screen">
        <div className="max-w-3xl px-6 mx-auto text-center text-white">
          
          <h1 className="text-4xl md:text-5xl font-semibold mb-6 leading-tight">
            DocSpace for Medical Professionals
          </h1>

          <p className="text-lg md:text-xl text-gray-200 leading-relaxed mb-8">
            DocSpace is a professional network built exclusively for verified doctors
            and healthcare professionals.  
            <br /><br />
            Build your medical profile, connect with peers, share clinical insights,
            and explore career opportunities — all within a secure, trusted environment.
          </p>

          {/* People Search */}
          <div className="flex justify-center mt-8">
            <PeopleSearch />
          </div>

        </div>
      </div>
    </div>
  );
}