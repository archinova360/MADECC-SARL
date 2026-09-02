import { useState, useEffect, useMemo } from 'react';
import { 
  Newspaper, 
  Calendar, 
  User as UserIcon, 
  Tag, 
  X, 
  ArrowRight, 
  Clock,
  Search,
  BookOpen,
  Filter,
  CheckCircle2,
  Share2
} from 'lucide-react';
import { BlogPost } from '../types.ts';
import { getOptimizedImageUrl } from '../lib/utils.ts';

export default function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [activePost, setActivePost] = useState<BlogPost | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const res = await fetch('/api/blogs');
        if (res.ok) {
          setPosts(await res.json());
        }
      } catch (err) {
        console.error('Error fetching blog posts:', err);
      }
    };
    fetchBlogs();
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    posts.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ['All', ...Array.from(set)];
  }, [posts]);

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
      const matchesSearch = 
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.content.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [posts, selectedCategory, searchQuery]);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-GB', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="font-sans text-slate-200 bg-[#0A0A0B] min-h-screen">
      
      {/* Blog Header */}
      <section className="bg-slate-950/80 border-b border-slate-850/60 text-white py-16 relative overflow-hidden" id="blog-header">
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative space-y-4">
          <span className="text-xs font-bold font-mono uppercase text-amber-500 tracking-widest block">Technical Knowledge Hub</span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Cameroon Construction & Engineering Insights</h1>
          <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
            Practical guides on building permits, geotechnical soil analysis, structural calculations, concrete batching standards, and construction cost estimation in Cameroon.
          </p>

          {/* Search and Category Filter */}
          <div className="pt-4 flex flex-col sm:flex-row items-center gap-4 max-w-2xl">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search engineering articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 outline-none transition-all"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
                >
                  Clear
                </button>
              )}
            </div>

            {categories.length > 1 && (
              <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      selectedCategory === cat
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'bg-slate-900/80 text-slate-400 border border-slate-800 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Blog Cards list */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        
        {filteredPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {filteredPosts.map((post) => (
              <div
                key={post.id}
                onClick={() => setActivePost(post)}
                className="bg-slate-900/50 border border-slate-800/85 rounded-xl overflow-hidden shadow-sm hover:border-slate-700/80 hover:bg-slate-900 transition-all flex flex-col md:flex-row h-full cursor-pointer group"
                id={`blog-card-${post.id}`}
              >
                <div className="md:w-2/5 h-48 md:h-auto bg-slate-950 shrink-0 relative">
                  <img
                    src={getOptimizedImageUrl(post.image, 600, 80)}
                    alt={post.title}
                    className="w-full h-full object-cover opacity-90 group-hover:scale-102 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute bottom-3 left-3">
                    <span className="inline-flex items-center gap-1 bg-slate-950/90 backdrop-blur-sm text-white px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
                      <Tag className="w-3 h-3 text-amber-500" /> {post.category}
                    </span>
                  </div>
                </div>

                <div className="p-6 md:w-3/5 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-[10px] text-slate-500 font-mono">
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {formatDate(post.publishedAt)}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> 4 min read</span>
                    </div>

                    <h3 className="font-extrabold text-base text-white leading-tight line-clamp-2 group-hover:text-amber-500 transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                      {post.summary}
                    </p>
                  </div>

                  <span className="text-amber-500 font-bold text-xs inline-flex items-center gap-1 group-hover:text-amber-400 transition-colors">
                    Read Engineering Article <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-[#0E0E10]/90 border border-slate-850 rounded-xl max-w-lg mx-auto space-y-3">
            <BookOpen className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="font-bold text-white text-sm">No Articles Found</p>
            <p className="text-xs text-slate-400">
              {searchQuery ? `No articles matching "${searchQuery}". Try a different keyword.` : 'Engineering publications will be posted here.'}
            </p>
          </div>
        )}

      </div>

      {/* Reading Detail Modal */}
      {activePost && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-[#0E0E10] border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative animate-in zoom-in-95 duration-200">
            
            {/* Close button */}
            <button
              onClick={() => setActivePost(null)}
              className="absolute right-4 top-4 bg-amber-500 hover:bg-amber-400 text-slate-950 p-1.5 rounded-full transition-colors z-10"
              id="close-blog-modal"
              aria-label="Close article modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Banner image */}
            <div className="h-64 bg-slate-950 relative">
              <img
                src={getOptimizedImageUrl(activePost.image, 1000, 85)}
                alt={activePost.title}
                className="w-full h-full object-cover opacity-80"
                referrerPolicy="no-referrer"
                loading="lazy"
                decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0E0E10] via-slate-950/30 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 text-white">
                <span className="inline-block bg-amber-500 text-slate-950 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded mb-2.5">
                  {activePost.category}
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight leading-tight">{activePost.title}</h2>
              </div>
            </div>

            {/* Reading Details */}
            <div className="p-8 space-y-6">
              <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-4 text-xs text-slate-500 font-mono gap-4">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-amber-500" /> {formatDate(activePost.publishedAt)}</span>
                  <span className="flex items-center gap-1.5"><UserIcon className="w-4 h-4 text-amber-500" /> MADECC Engineering Directorate</span>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 bg-slate-900 border border-slate-800 text-slate-400 font-bold uppercase tracking-wide rounded">Technical Publication</span>
              </div>

              {/* Video Player if present */}
              {activePost.videoUrl && (
                <div className="my-6 rounded-xl overflow-hidden border border-slate-800 bg-black aspect-video relative">
                  <video 
                    src={activePost.videoUrl} 
                    controls 
                    className="w-full h-full object-contain"
                    preload="metadata"
                  />
                </div>
              )}

              {/* Body Content */}
              <div className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed space-y-4 whitespace-pre-wrap">
                {activePost.content}
              </div>

              {/* Bottom bar */}
              <div className="pt-6 border-t border-slate-800 flex justify-between items-center text-xs text-slate-500">
                <span>© {new Date().getFullYear()} MADECC GROUP Technical Directorate</span>
                <button
                  onClick={() => setActivePost(null)}
                  className="bg-slate-900 hover:bg-slate-850 text-slate-350 hover:text-white border border-slate-800 px-4 py-2 rounded-lg font-bold transition-all"
                >
                  Close Article
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
