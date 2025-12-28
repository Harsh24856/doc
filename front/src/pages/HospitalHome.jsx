import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import Footer from "../components/Footer";
import API_BASE_URL from "../config/api.js";
import hospitalImage from "../assets/image.png";

function decodeHTML(html) {
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
}

export default function HospitalHome() {
  const [hospitalData, setHospitalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newsArticles, setNewsArticles] = useState([]);
  const [whoUpdates, setWhoUpdates] = useState([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [whoLoading, setWhoLoading] = useState(true);

  useEffect(() => {
    const fetchHospitalData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/hospital/fetch`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setHospitalData(data);
        }
      } catch (err) {
        console.error("Error fetching hospital data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHospitalData();
    fetchNews();
    fetchWHOUpdates();
  }, []);

  const fetchNews = async () => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/news/medical?q=medical&limit=3`
      );
      if (res.ok) {
        const data = await res.json();
        setNewsArticles(data.articles || []);
      }
    } catch (err) {
      console.error("Failed to fetch news:", err);
    } finally {
      setNewsLoading(false);
    }
  };

  const fetchWHOUpdates = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/who/updates`);
      if (res.ok) {
        const data = await res.json();
        setWhoUpdates((data.articles || []).slice(0, 3));
      }
    } catch (err) {
      console.error("Failed to fetch WHO updates:", err);
    } finally {
      setWhoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--color-accent)] via-white to-white">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 pt-12 sm:pt-16 md:pt-20 pb-16 flex flex-col md:flex-row items-center gap-12">
        {/* Left Text */}
        <div className="md:w-1/2 text-center md:text-left">
          <div className="mb-8 sm:mb-10">
            <span className="inline-flex items-center gap-3 sm:gap-4 px-6 sm:px-8 py-3 sm:py-4 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] text-white text-lg sm:text-xl md:text-2xl font-bold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <span className="material-symbols-outlined text-2xl sm:text-3xl md:text-4xl">local_hospital</span>
              <span>Hospital Portal</span>
            </span>
          </div>
          
          {hospitalData && hospitalData.hospital_name && (
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                Welcome, {hospitalData.hospital_name}
              </h2>
              {hospitalData.hospital_city && hospitalData.hospital_state && (
                <p className="text-gray-600">
                  {hospitalData.hospital_city}, {hospitalData.hospital_state}
                </p>
              )}
              {hospitalData.hospital_type && (
                <p className="text-sm text-gray-500 mt-1">
                  {hospitalData.hospital_type}
                </p>
              )}
            </div>
          )}
          
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Manage Your Hospital, <br/>
            <span className="text-[var(--color-primary)]">Find Top Talent.</span>
          </h1>
  
          <p className="text-lg text-gray-600 mb-10 leading-relaxed">
            DocSpace Hospital Portal helps you recruit verified doctors, manage your team, 
            and streamline your hiring process. Connect with qualified healthcare professionals 
            and grow your institution.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
            <Link 
              to="/post-job" 
              className="px-8 py-3.5 bg-[var(--color-primary)] text-white rounded-lg font-semibold shadow-lg hover:bg-[var(--color-primary-dark)] hover:shadow-xl transition transform hover:-translate-y-0.5"
            >
              Post a Job
            </Link>
            <Link 
              to="/hospital-profile" 
              className="px-8 py-3.5 bg-white text-gray-700 border border-gray-200 rounded-lg font-semibold shadow-sm hover:bg-gray-50 transition"
            >
              Manage Profile
            </Link>
          </div>
        </div>

        {/* Right Image */}
        <div className="md:w-1/2 flex justify-center">
          <div className="relative w-full max-w-lg aspect-square bg-white rounded-3xl shadow-2xl p-8 flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-red-50 to-transparent opacity-50"></div>
            <img
              src={hospitalImage}
              alt="Hospital Management"
              className="object-cover w-full h-full rounded-2xl opacity-90 border-0"
            />
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-6 py-20 bg-white rounded-t-[3rem] shadow-sm">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Hospital Management Tools</h2>
          <p className="text-gray-500">Everything you need to run your hospital efficiently</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<span className="material-symbols-outlined text-4xl text-[var(--color-primary)]">verified_user</span>}
            title="Hospital Profile"
            desc="Set up your hospital profile to get verified and connect with qualified healthcare professionals."
            link="/hospital-profile"
            linkText="Manage Doctors"
          />
          <FeatureCard
            icon={<span className="material-symbols-outlined text-4xl text-[var(--color-primary)]">work</span>}
            title="Job Posting"
            desc="Post job openings and reach thousands of qualified healthcare professionals. Find the perfect candidates."
            link="/post-job"
            linkText="Post Jobs"
          />
          <FeatureCard
            icon={<span className="material-symbols-outlined text-4xl text-[var(--color-primary)]">bar_chart</span>}
            title="Analytics & Reports"
            desc="View detailed analytics, application statistics, and compliance reports for your hospital."
            link="/posted-jobs"
            linkText="View Reports"
          />
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-6 py-16 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] text-white">
        <div className="grid md:grid-cols-4 gap-8 text-center mb-8">
          <div>
            <div className="text-4xl font-bold mb-2">0</div>
            <div className="text-red-100">Hospitals Registered</div>
          </div>
          <div>
            <div className="text-4xl font-bold mb-2">0</div>
            <div className="text-red-100">Verified Doctors</div>
          </div>
          <div>
            <div className="text-4xl font-bold mb-2">0</div>
            <div className="text-red-100">Active Job Postings</div>
          </div>
          <div>
            <div className="text-4xl font-bold mb-2">99%</div>
            <div className="text-red-100">AI Verification Accuracy</div>
          </div>
        </div>
        <div className="text-center mt-8 pt-8 border-t border-red-300">
          <div className="flex items-center justify-center gap-3 mb-2">
            <span className="material-symbols-outlined text-3xl">psychology</span>
            <h3 className="text-2xl font-bold">AI-Driven Verification System</h3>
          </div>
          <p className="text-red-100 text-lg">Advanced AI technology with 99% accuracy for doctor credential verification</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="max-w-7xl mx-auto px-6 py-20 bg-white">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <p className="text-gray-500">Get started with these essential tasks</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <ActionCard
            icon={<span className="material-symbols-outlined text-2xl text-white">add</span>}
            title="Post New Job"
            desc="Create a new job posting"
            link="/post-job"
            color="bg-[var(--color-primary)]"
          />
          <ActionCard
            icon={<span className="material-symbols-outlined text-2xl text-white">visibility</span>}
            title="View Posted Jobs"
            desc="Manage your job listings"
            link="/posted-jobs"
            color="bg-[var(--color-primary-dark)]"
          />
          <ActionCard
            icon={<span className="material-symbols-outlined text-2xl text-white">local_hospital</span>}
            title="Hospital Profile"
            desc="Update your hospital info"
            link="/hospital-profile"
            color="bg-[var(--color-primary)]"
          />
          <ActionCard
            icon={<span className="material-symbols-outlined text-2xl text-white">search</span>}
            title="Search Doctors"
            desc="Find qualified candidates"
            link="/find-doctor"
            color="bg-[var(--color-primary-dark)]"
          />
        </div>
      </div>

      {/* How It Works Section */}
      <div className="max-w-7xl mx-auto px-6 py-20 bg-gray-50">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
          <p className="text-gray-500">Recruit top talent in three simple steps</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <StepCard
            number="1"
            title="Complete Your Profile"
            desc="Set up your hospital profile with all necessary details and verification documents."
          />
          <StepCard
            number="2"
            title="Post Job Openings"
            desc="Create detailed job postings with requirements, benefits, and application process."
          />
          <StepCard
            number="3"
            title="Review & Hire"
            desc="Review applications from verified doctors and connect with the best candidates."
          />
        </div>
            </div>
  
      {/* Benefits Section */}
      <div className="max-w-7xl mx-auto px-6 py-20 bg-white">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose DocSpace?</h2>
          <p className="text-gray-500">Benefits of using our platform</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <BenefitCard
            icon="✅"
            title="Verified Professionals"
            desc="All doctors are verified with authentic credentials and licenses."
          />
          <BenefitCard
            icon="⚡"
            title="Fast Hiring Process"
            desc="Streamlined application process helps you hire faster."
          />
          <BenefitCard
            icon="🔒"
            title="Secure Platform"
            desc="Your data and communications are protected with enterprise-grade security."
          />
          <BenefitCard
            icon="📈"
            title="Analytics Dashboard"
            desc="Track applications, views, and hiring metrics in real-time."
          />
          <BenefitCard
            icon="💬"
            title="Direct Communication"
            desc="Chat directly with candidates and manage conversations easily."
          />
          <BenefitCard
            icon="🌐"
            title="Wide Reach"
            desc="Access to thousands of qualified healthcare professionals nationwide."
          />
        </div>
            </div>
  
      {/* News & Updates Section */}
      <div className="max-w-7xl mx-auto px-6 py-20 bg-gray-50">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
            <span className="material-symbols-outlined text-4xl text-[var(--color-primary)]">newspaper</span>
            Stay Informed
          </h2>
          <p className="text-gray-500">Latest medical news and WHO updates</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Medical News */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-2xl text-[var(--color-primary)]">article</span>
                Medical News
              </h3>
              <Link 
                to="/news" 
                className="text-[var(--color-primary)] text-sm font-semibold hover:underline flex items-center gap-1"
              >
                View All
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>
            
            {newsLoading ? (
              <div className="text-center py-8">
                <span className="material-symbols-outlined text-4xl text-gray-400 mb-2 block animate-spin">hourglass_empty</span>
                <p className="text-gray-500">Loading news...</p>
              </div>
            ) : newsArticles.length > 0 ? (
              <div className="space-y-4">
                {newsArticles.map((article, index) => (
                  <NewsCard key={`${article.url}-${index}`} article={article} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <span className="material-symbols-outlined text-4xl text-gray-400 mb-2 block">newspaper</span>
                <p className="text-gray-500">No news available</p>
              </div>
            )}
          </div>

          {/* WHO Updates */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-2xl text-[var(--color-primary)]">local_hospital</span>
                WHO Updates
              </h3>
              <Link 
                to="/who" 
                className="text-[var(--color-primary)] text-sm font-semibold hover:underline flex items-center gap-1"
              >
                View All
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>
            
            {whoLoading ? (
              <div className="text-center py-8">
                <span className="material-symbols-outlined text-4xl text-gray-400 mb-2 block animate-spin">hourglass_empty</span>
                <p className="text-gray-500">Loading updates...</p>
              </div>
            ) : whoUpdates.length > 0 ? (
              <div className="space-y-4">
                {whoUpdates.map((article, index) => (
                  <WHOUpdateCard key={index} article={article} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <span className="material-symbols-outlined text-4xl text-gray-400 mb-2 block">local_hospital</span>
                <p className="text-gray-500">No updates available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-6 py-16 bg-gradient-to-br from-[var(--color-accent)] to-white rounded-3xl mx-6 mb-20">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Ready to Find Your Next Hire?
              </h2>
          <p className="text-lg text-gray-600 mb-8">
            Join hundreds of hospitals already using DocSpace to recruit top medical talent.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/post-job" 
              className="px-8 py-3.5 bg-[var(--color-primary)] text-white rounded-lg font-semibold shadow-lg hover:bg-[var(--color-primary-dark)] hover:shadow-xl transition transform hover:-translate-y-0.5"
            >
              Post Your First Job
            </Link>
            <Link 
              to="/hospital-profile" 
              className="px-8 py-3.5 bg-white text-gray-700 border-2 border-gray-200 rounded-lg font-semibold shadow-sm hover:bg-gray-50 transition"
            >
              Complete Profile
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

function FeatureCard({ icon, title, desc, link, linkText }) {
  return (
    <div className="p-8 rounded-2xl bg-gray-50 hover:bg-white hover:shadow-xl transition duration-300 border border-transparent hover:border-gray-100 group">
      <div className="w-14 h-14 rounded-xl bg-white flex items-center justify-center shadow-sm mb-6 group-hover:scale-110 transition">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-500 leading-relaxed mb-4">{desc}</p>
      {link && (
        <Link 
          to={link}
          className="text-[var(--color-primary)] font-semibold hover:underline inline-flex items-center gap-2"
        >
          {linkText}
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </Link>
      )}
    </div>
  );
}

function ActionCard({ icon, title, desc, link, color }) {
  return (
    <Link 
      to={link}
      className="p-6 rounded-xl bg-white border border-gray-200 hover:shadow-lg transition duration-300 group"
    >
      <div className={`w-12 h-12 ${color} text-white rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition`}>
        {icon}
      </div>
      <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500">{desc}</p>
    </Link>
  );
}

function StepCard({ number, title, desc }) {
  return (
    <div className="text-center p-8 rounded-2xl bg-white hover:shadow-xl transition duration-300 border border-gray-100">
      <div className="w-16 h-16 rounded-full bg-[var(--color-primary)] text-white text-2xl font-bold flex items-center justify-center mx-auto mb-6">
        {number}
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-500 leading-relaxed">{desc}</p>
    </div>
  );
}

function BenefitCard({ icon, title, desc }) {
  return (
    <div className="p-6 rounded-xl bg-gray-50 hover:bg-white hover:shadow-lg transition duration-300 border border-transparent hover:border-gray-100">
      <div className="text-3xl mb-4">{icon}</div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
      </div>
    );
  }

function NewsCard({ article }) {
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-4 rounded-xl border border-gray-200 hover:border-[var(--color-primary)] hover:shadow-md transition-all duration-200 group"
    >
      {article.image && (
        <img
          src={article.image}
          alt={article.title}
          className="w-full h-40 object-cover rounded-lg mb-3"
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
      )}
      <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-[var(--color-primary)] transition">
        {article.title}
      </h4>
      {article.description && (
        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
          {decodeHTML(article.description).replace(/<[^>]*>/g, "").substring(0, 120)}...
        </p>
      )}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">schedule</span>
          {article.publishedAt
            ? new Date(article.publishedAt).toLocaleDateString()
            : "Recent"}
        </span>
        <span className="text-[var(--color-primary)] font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
          Read more
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </span>
      </div>
    </a>
  );
}

function WHOUpdateCard({ article }) {
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-4 rounded-xl border border-gray-200 hover:border-[var(--color-primary)] hover:shadow-md transition-all duration-200 group"
    >
      {article.image && (
        <img
          src={article.image}
          alt={article.title}
          className="w-full h-40 object-cover rounded-lg mb-3"
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
      )}
      <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-[var(--color-primary)] transition">
        {article.title}
      </h4>
      {article.description && (
        <div
          className="text-sm text-gray-600 line-clamp-3 mb-3"
          dangerouslySetInnerHTML={{
            __html: decodeHTML(article.description).substring(0, 150) + "...",
          }}
        />
      )}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">schedule</span>
          {article.publishedAt
            ? new Date(article.publishedAt).toLocaleDateString()
            : "Recent"}
        </span>
        <span className="text-[var(--color-primary)] font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
          Read on WHO
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </span>
      </div>
    </a>
  );
}