import { useState, useEffect } from "react";
import api from "../api";
import Navbar from "../components/Navbar";

const TIER_LABELS = {
  comfort: "Comfort Picks",
  discovery: "Discovery Picks",
  adventurous: "Adventurous Picks",
};

const TIER_ORDER = ["comfort", "discovery", "adventurous"];

function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let timeout;

    const load = async () => {
      try{
        const res = await api.get("/api/v1/recommendations/");

        //202-> request received and accepted, but the work is not finished
        if (res.status === 202){
          timeout = setTimeout(load, 5000); //try again in 5 seconds
        } else{
          //if 200, we have real recs so we need to set the states
          setRecommendations(res.data);
          setLoading(false);
        }
      } catch (error){
        console.log(error);
        setLoading(false);
      }
    };

    load();
    return () => clearTimeout(timeout); //cleanup if components unmounts
  }, []);

  const grouped = TIER_ORDER.reduce((acc, tier) => {
    acc[tier] = recommendations.filter((r) => r.tier === tier);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-[#FAF8F4]">
      <Navbar />
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1
            className="font-serif text-3xl text-stone-900"
          >
            Recommended for You
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            Curated from your reading history
          </p>
        </div>

        {loading && (
          <p className="text-stone-400 text-sm">Finding your next reads...</p>
        )}

        {!loading && recommendations.length === 0 && (
          <p className="text-stone-400 text-sm">
            Log some books to get recommendations.
          </p>
        )}

        {!loading &&
          TIER_ORDER.map((tier) => {
            const recs = grouped[tier];
            if (!recs.length) return null;
            return (
              <div key={tier} className="mb-12">
                <h2
                  className="font-serif text-xl text-stone-800 mb-5"
                >
                  {TIER_LABELS[tier]}
                </h2>
                <div
                  className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5"
                >
                  {recs.map((rec) => (
                    <div
                      key={rec.id}
                      className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden"
                    >
                      {rec.cover_url ? (
                        <img
                          src={rec.cover_url}
                          alt={rec.title}
                          className="w-full h-56 object-cover"
                        />
                      ) : (
                        <div
                          className="w-full h-56 bg-stone-100 flex items-center justify-center p-4 text-center"
                        >
                          <span
                            className="font-serif text-stone-500 text-sm"
                          >
                            {rec.title}
                          </span>
                        </div>
                      )}
                      <div className="p-4">
                        <h4
                          className="font-serif text-stone-900 text-sm font-medium leading-tight truncate"
                        >
                          {rec.title}
                        </h4>
                        <p
                          className="text-stone-400 text-xs mt-0.5 truncate"
                        >
                          {rec.author}
                        </p>
                        <span
                          className="inline-block mt-2 px-2 py-0.5 bg-stone-100 rounded-full text-xs text-stone-500"
                        >
                          {rec.genre}
                        </span>
                        {rec.reason && (
                          <p
                            className="text-stone-500 text-xs mt-2 leading-relaxed line-clamp-3"
                          >
                            {rec.reason}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}

export default RecommendationsPage;
