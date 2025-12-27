import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import doctorBg from "../assets/doctor-bg.png";
import Footer from "../components/Footer";
import API_BASE_URL from "../config/api";
// PeopleSearch moved to Navbar

function decodeHTML(html) {
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
}

export default function Home() {
  const [newsArticles, setNewsArticles] = useState([]);
  const [whoUpdates, setWhoUpdates] = useState([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [whoLoading, setWhoLoading] = useState(true);

  useEffect(() => {
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
    <div className="min-h-screen bg-linear-to-br from-accent via-white to-white">

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 pt-20 pb-16 flex flex-col md:flex-row items-center gap-12">

        {/* Left Text */}
        <div className="md:w-1/2 text-center md:text-left">
          <span className="inline-block px-4 py-1.5 rounded-full bg-red-100 text-primary-dark text-sm font-semibold mb-6">
             The #1 Healthcare Network
          </span>
          
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Connect, Collaborate, <br/>
            <span className="text-primary">Save Lives.</span>
          </h1>

          <p className="text-lg text-gray-600 mb-10 leading-relaxed max-w-lg mx-auto md:mx-0">
            DocSpace is the exclusive professional network for verified doctors and healthcare providers.
            Build your profile, find top jobs, and connect with peers in a secure environment.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
            <a href="/resume" className="px-8 py-3.5 bg-primary text-white rounded-lg font-semibold shadow-lg hover:bg-[var(--color-primary-dark)] hover:shadow-xl transition transform hover:-translate-y-0.5">
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
                 <div className="absolute inset-0 bg-linear-to-tr from-red-50 to-transparent opacity-50"></div>
                 {/* Re-using the image but without full background overlay */}
                 <img src={doctorBg} alt="Doctors" className="object-cover w-full h-full rounded-2xl opacity-90" />
            </div>
        </div>
      </div>

      {/* Features Grid */}
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

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-6 py-16 bg-linear-to-r from-primary to-primary-dark text-white">
        <div className="grid md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-4xl font-bold mb-2">10K+</div>
            <div className="text-red-100">Verified Doctors</div>
          </div>
          <div>
            <div className="text-4xl font-bold mb-2">500+</div>
            <div className="text-red-100">Hospitals</div>
          </div>
          <div>
            <div className="text-4xl font-bold mb-2">2K+</div>
            <div className="text-red-100">Job Openings</div>
          </div>
          <div>
            <div className="text-4xl font-bold mb-2">50K+</div>
            <div className="text-red-100">Connections Made</div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="max-w-7xl mx-auto px-6 py-20 bg-white">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
          <p className="text-gray-500">Get started in three simple steps</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <StepCard
            number="1"
            title="Create Your Profile"
            desc="Sign up and build your professional profile with your credentials and experience."
          />
          <StepCard
            number="2"
            title="Get Verified"
            desc="Upload your medical license and get verified to unlock all platform features."
          />
          <StepCard
            number="3"
            title="Connect & Grow"
            desc="Start networking, apply for jobs, and collaborate with healthcare professionals."
          />
        </div>
      </div>

      {/* News & Updates Section */}
      <div className="max-w-7xl mx-auto px-6 py-20 bg-gray-50">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
            <span className="material-symbols-outlined text-4xl text-primary">newspaper</span>
            Stay Informed
          </h2>
          <p className="text-gray-500">Latest medical news and WHO updates</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Medical News */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-2xl text-primary">article</span>
                Medical News
              </h3>
              <Link 
                to="/news" 
                className="text-primary text-sm font-semibold hover:underline flex items-center gap-1"
              >
                View All
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>
            
            {newsLoading ? (
              <p className="text-gray-500 text-center py-8">Loading news...</p>
            ) : newsArticles.length > 0 ? (
              <div className="space-y-4">
                {newsArticles.map((article, index) => (
                  <NewsCard key={`${article.url}-${index}`} article={article} />
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No news available</p>
            )}
          </div>

          {/* WHO Updates */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-2xl text-primary">local_hospital</span>
                WHO Updates
              </h3>
              <Link 
                to="/who" 
                className="text-primary text-sm font-semibold hover:underline flex items-center gap-1"
              >
                View All
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>
            
            {whoLoading ? (
              <p className="text-gray-500 text-center py-8">Loading updates...</p>
            ) : whoUpdates.length > 0 ? (
              <div className="space-y-4">
                {whoUpdates.map((article, index) => (
                  <WHOUpdateCard key={index} article={article} />
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No updates available</p>
            )}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-6 py-16 bg-linear-to-br from-accent to-white rounded-3xl mx-auto mb-20">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Ready to Transform Your Career?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Join thousands of healthcare professionals who trust DocSpace for their career growth.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/resume" 
              className="px-8 py-3.5 bg-primary text-white rounded-lg font-semibold shadow-lg hover:bg-primary-dark hover:shadow-xl transition transform hover:-translate-y-0.5"
            >
              Join DocSpace Today
            </a>
            <a 
              href="/search/jobs" 
              className="px-8 py-3.5 bg-white text-gray-700 border-2 border-gray-200 rounded-lg font-semibold shadow-sm hover:bg-gray-50 transition"
            >
              Browse Opportunities
            </a>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

function StepCard({ number, title, desc }) {
  return (
    <div className="text-center p-8 rounded-2xl bg-gray-50 hover:bg-white hover:shadow-xl transition duration-300 border border-transparent hover:border-gray-100">
      <div className="w-16 h-16 rounded-full bg-primary text-white text-2xl font-bold flex items-center justify-center mx-auto mb-6">
        {number}
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-500 leading-relaxed">{desc}</p>
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

function NewsCard({ article }) {
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block border-l-4 border-primary pl-4 py-3 hover:bg-gray-50 transition rounded-r group"
    >
      {article.image && (
        <img
          src={article.image}
          alt={article.title}
          className="w-full h-32 object-cover rounded-lg mb-3"
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
      )}
      <h4 className="font-semibold text-gray-900 mb-1 line-clamp-2 text-sm group-hover:text-primary transition">
        {article.title}
      </h4>
      <p className="text-xs text-gray-600 mb-2 line-clamp-2">
        {article.description}
      </p>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">{article.source}</span>
        <span className="text-xs text-primary font-medium flex items-center gap-1">
          Read
          <span className="material-symbols-outlined text-xs">arrow_forward</span>
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
      className="block border-l-4 border-primary pl-4 py-3 hover:bg-gray-50 transition rounded-r group"
    >
      {article.image && (
        <img
          src={article.image}
          alt={article.title}
          className="w-full h-32 object-cover rounded-lg mb-3"
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
      )}
      <h4 className="font-semibold text-gray-900 mb-1 line-clamp-2 text-sm group-hover:text-primary transition">
        {article.title}
      </h4>
      <div 
        className="text-xs text-gray-600 mb-2 line-clamp-2"
        dangerouslySetInnerHTML={{
          __html: decodeHTML(article.description || "").substring(0, 100) + "..."
        }}
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500 flex items-center gap-1">
          <span className="material-symbols-outlined text-xs">schedule</span>
          {article.publishedAt
            ? new Date(article.publishedAt).toLocaleDateString()
            : "WHO"}
        </span>
        <span className="text-xs text-primary font-medium flex items-center gap-1">
          Read
          <span className="material-symbols-outlined text-xs">arrow_forward</span>
        </span>
      </div>
    </a>
  );
}
