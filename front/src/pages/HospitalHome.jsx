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
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gray-900 text-white">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900 to-gray-800 opacity-90"></div>
        <div className="max-w-7xl mx-auto px-6 py-24 sm:py-32 relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="md:w-1/2">
               {hospitalData && hospitalData.hospital_name && (
                <div className="mb-6 inline-block">
                   <div className="px-4 py-2 bg-gray-800 rounded-lg border border-gray-700">
                    <p className="text-gray-300 font-medium text-sm">
                      Welcome back, {hospitalData.hospital_name}
                    </p>
                   </div>
                </div>
              )}

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                <span className="text-[var(--color-primary)]">Hire Trusted</span> <br />
                Medical Professionals
              </h1>

              <p className="text-lg text-gray-400 mb-8 max-w-lg leading-relaxed">
                Connect with thousands of verified doctors and streamline your recruitment process with AI-powered verification.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/post-job"
                  className="btn-primary px-8 py-3.5 text-lg shadow-lg shadow-red-900/20"
                >
                  Post a Job
                </Link>
                <Link
                  to="/hospital-profile"
                  className="px-8 py-3.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition border border-gray-700 text-lg"
                >
                  Manage Profile
                </Link>
              </div>
            </div>

            <div className="md:w-1/2 flex justify-center">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-700">
                <img
                  src={hospitalImage}
                  alt="Hospital Management"
                  className="object-cover w-full h-full max-h-[500px]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="max-w-7xl mx-auto px-6 -mt-16 relative z-20 mb-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <ActionCard
            icon="add_business"
            title="Post New Job"
            desc="Create a new job posting"
            link="/post-job"
          />
          <ActionCard
            icon="work"
            title="Manage Jobs"
            desc="View active listings"
            link="/posted-jobs"
          />
          <ActionCard
            icon="local_hospital"
            title="Hospital Profile"
            desc="Update your details"
            link="/hospital-profile"
          />
          <ActionCard
            icon="person_search"
            title="Search Doctors"
            desc="Find candidates"
            link="/find-doctor"
          />
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-gray-50 py-20 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
           <div className="text-center mb-16">
             <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Hospitals Choose DocSpace</h2>
             <p className="text-gray-600 max-w-2xl mx-auto">
               Our platform offers the most advanced verification system to ensure you hire only qualified professionals.
             </p>
           </div>

           <div className="grid md:grid-cols-3 gap-8 text-center">
             <div className="p-8 bg-white rounded-xl shadow-sm border border-gray-100">
               <div className="w-16 h-16 bg-red-50 text-[var(--color-primary)] rounded-full flex items-center justify-center mx-auto mb-6">
                 <span className="material-symbols-outlined text-4xl">verified_user</span>
               </div>
               <h3 className="text-xl font-bold text-gray-900 mb-2">99% Verification Accuracy</h3>
               <p className="text-gray-500">AI-driven document analysis and registry checks.</p>
             </div>
             <div className="p-8 bg-white rounded-xl shadow-sm border border-gray-100">
               <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                 <span className="material-symbols-outlined text-4xl">speed</span>
               </div>
               <h3 className="text-xl font-bold text-gray-900 mb-2">Fast Hiring</h3>
               <p className="text-gray-500">Reduce time-to-hire with instant candidate matching.</p>
             </div>
             <div className="p-8 bg-white rounded-xl shadow-sm border border-gray-100">
               <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                 <span className="material-symbols-outlined text-4xl">group</span>
               </div>
               <h3 className="text-xl font-bold text-gray-900 mb-2">Large Talent Pool</h3>
               <p className="text-gray-500">Access thousands of active healthcare professionals.</p>
             </div>
           </div>
        </div>
      </div>
  
      {/* News & Updates Section */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="flex items-center justify-between mb-12">
           <div>
             <h2 className="text-3xl font-bold text-gray-900 mb-2">Latest Updates</h2>
             <p className="text-gray-600">Stay informed with medical news and WHO alerts.</p>
           </div>
           <Link to="/news" className="text-[var(--color-primary)] font-semibold hover:underline hidden sm:block">View All News</Link>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Medical News */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2 pb-4 border-b">
              <span className="material-symbols-outlined text-[var(--color-primary)]">newspaper</span>
              Medical News
            </h3>
            
            {newsLoading ? (
               <div className="space-y-4 animate-pulse">
                 {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-lg"></div>)}
               </div>
            ) : newsArticles.length > 0 ? (
              <div className="space-y-4">
                {newsArticles.map((article, index) => (
                  <NewsCard key={`${article.url}-${index}`} article={article} />
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No news available.</p>
            )}
          </div>

          {/* WHO Updates */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2 pb-4 border-b">
              <span className="material-symbols-outlined text-blue-600">health_and_safety</span>
              WHO Updates
            </h3>
            
            {whoLoading ? (
               <div className="space-y-4 animate-pulse">
                 {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-lg"></div>)}
               </div>
            ) : whoUpdates.length > 0 ? (
              <div className="space-y-4">
                {whoUpdates.map((article, index) => (
                  <NewsCard key={index} article={article} isWho />
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No updates available.</p>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

function ActionCard({ icon, title, desc, link }) {
  return (
    <Link 
      to={link}
      className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 border border-gray-100 flex flex-col items-center text-center group"
    >
      <div className="w-14 h-14 bg-gray-50 text-gray-600 rounded-full flex items-center justify-center mb-4 group-hover:bg-[var(--color-primary)] group-hover:text-white transition-colors">
        <span className="material-symbols-outlined text-3xl">{icon}</span>
      </div>
      <h3 className="font-bold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500">{desc}</p>
    </Link>
  );
}

function NewsCard({ article, isWho }) {
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex gap-4 p-4 rounded-xl bg-white border border-gray-100 hover:border-gray-300 hover:shadow-md transition-all group"
    >
      {article.image && (
        <div className="w-24 h-24 shrink-0 rounded-lg overflow-hidden bg-gray-100">
          <img
            src={article.image}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-gray-900 line-clamp-2 mb-2 group-hover:text-[var(--color-primary)] transition-colors">
          {article.title}
        </h4>
        <div className="flex items-center gap-2 text-xs text-gray-500">
           <span>{isWho ? 'WHO' : 'Medical News'}</span>
           <span>•</span>
           <span>{article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : "Recent"}</span>
        </div>
      </div>
    </a>
  );
}
