import doctorBg from "../assets/doctor-bg.png"; // Keeping import in case we want to use it differently, but plan says remove overly
// PeopleSearch moved to Navbar

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--color-accent)] via-white to-white">

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 pt-20 pb-16 flex flex-col md:flex-row items-center gap-12">

        {/* Left Text */}
        <div className="md:w-1/2 text-center md:text-left">
          <span className="inline-block px-4 py-1.5 rounded-full bg-red-100 text-[var(--color-primary-dark)] text-sm font-semibold mb-6">
             The #1 Healthcare Network
          </span>
          
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Connect, Collaborate, <br/>
            <span className="text-[var(--color-primary)]">Save Lives.</span>
          </h1>

          <p className="text-lg text-gray-600 mb-10 leading-relaxed max-w-lg mx-auto md:mx-0">
            DocSpace is the exclusive professional network for verified doctors and healthcare providers.
            Build your profile, find top jobs, and connect with peers in a secure environment.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
            <a href="/signup" className="px-8 py-3.5 bg-[var(--color-primary)] text-white rounded-lg font-semibold shadow-lg hover:bg-[var(--color-primary-dark)] hover:shadow-xl transition transform hover:-translate-y-0.5">
              Get Started
            </a>
            <a href="/search/jobs" className="px-8 py-3.5 bg-white text-gray-700 border border-gray-200 rounded-lg font-semibold shadow-sm hover:bg-gray-50 transition">
              Find Jobs
            </a>
          </div>
        </div>

        {/* Right Image/Illustration Placeholder */}
        <div className="md:w-1/2 flex justify-center">
            {/* Using a clean placeholder or the existing image with different styling if desired.
                For now, a clean card or abstract shape looks modern. */}
            <div className="relative w-full max-w-lg aspect-square bg-white rounded-3xl shadow-2xl p-8 flex items-center justify-center overflow-hidden">
                 <div className="absolute inset-0 bg-gradient-to-tr from-red-50 to-transparent opacity-50"></div>
                 {/* Re-using the image but without full background overlay */}
                 <img src={doctorBg} alt="Doctors" className="object-cover w-full h-full rounded-2xl opacity-90" />
            </div>
        </div>
      </div>

      {/* Features Grid (Optional but good for landing) */}
      <div className="max-w-7xl mx-auto px-6 py-20 bg-white rounded-t-[3rem] shadow-sm">
        <div className="text-center mb-16">
           <h2 className="text-3xl font-bold text-gray-900">Why DocSpace?</h2>
           <p className="text-gray-500 mt-4">Everything you need to advance your medical career</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon="🩺"
              title="Verified Profiles"
              desc="Connect with real professionals. All profiles are verified for authenticity."
            />
             <FeatureCard
              icon="💼"
              title="Career Opportunities"
              desc="Access exclusive job openings from top hospitals and clinics nationwide."
            />
             <FeatureCard
              icon="🤝"
              title="Clinical Networking"
              desc="Discuss cases, share insights, and collaborate with peers securely."
            />
        </div>
      </div>

    </div>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div className="p-8 rounded-2xl bg-gray-50 hover:bg-white hover:shadow-xl transition duration-300 border border-transparent hover:border-gray-100 group">
      <div className="w-14 h-14 rounded-xl bg-white text-3xl flex items-center justify-center shadow-sm mb-6 group-hover:scale-110 transition">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-500 leading-relaxed">{desc}</p>
    </div>
  )
}
