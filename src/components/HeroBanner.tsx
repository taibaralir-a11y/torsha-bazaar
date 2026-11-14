import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';

interface HeroBannerProps {
  onExploreGrocery: () => void;
  onBookRide: () => void;
  onExploreServices: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  onExploreGrocery,
  onBookRide,
  onExploreServices
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      id: 0,
      title: 'Fresh & Healthy',
      highlight: 'Grocery',
      badge: 'Best Price',
      subtitle: 'Farm fresh vegetables & dairy delivered in Kalchini',
      actionText: 'Shop Now',
      bgGradient: 'from-[#86efac]/40 via-[#bbf7d0]/20 to-white',
      badgeColor: 'bg-[#15803d]',
      image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80',
      alt: 'Fresh Grocery Basket',
      onClick: onExploreGrocery
    },
    {
      id: 1,
      title: 'Instant Ride',
      highlight: 'Toto & Auto',
      badge: 'Zero Surge',
      subtitle: 'Safe local rides across Torsa & Hamiltonganj',
      actionText: 'Book Ride',
      bgGradient: 'from-amber-100/50 via-yellow-50 to-white',
      badgeColor: 'bg-amber-600',
      image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&auto=format&fit=crop&q=80',
      alt: 'Local Ride Booking',
      onClick: onBookRide
    },
    {
      id: 2,
      title: 'Home Care',
      highlight: 'Local Services',
      badge: 'Verified Pros',
      subtitle: 'Electrician, Plumber, Repair at your doorstep',
      actionText: 'Book Service',
      bgGradient: 'from-blue-100/50 via-sky-50 to-white',
      badgeColor: 'bg-blue-600',
      image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop&q=80',
      alt: 'Home Services Kalchini',
      onClick: onExploreServices
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [slides.length]);

  const activeSlide = slides[currentSlide];

  return (
    <div className="px-4 pt-3 pb-1">
      <div
        onClick={activeSlide.onClick}
        className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${activeSlide.bgGradient} border border-emerald-100 shadow-sm cursor-pointer transition-all duration-300 hover:shadow-md`}
      >
        <div className="flex items-center justify-between p-4 min-h-[140px]">
          {/* Text side */}
          <div className="z-10 max-w-[60%] flex flex-col justify-center">
            <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider flex items-center gap-1 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              Torsa Specials
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 leading-tight">
              {activeSlide.title} <br />
              <span className="text-[#0E7438]">{activeSlide.highlight}</span>
            </h2>

            <div className="mt-2.5 flex items-center gap-2">
              <span className={`inline-block ${activeSlide.badgeColor} text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm`}>
                {activeSlide.badge}
              </span>
              <span className="text-xs font-semibold text-emerald-900 flex items-center gap-0.5 hover:underline">
                {activeSlide.actionText} <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>

          {/* Image side */}
          <div className="relative w-36 h-28 sm:w-44 sm:h-32 shrink-0">
            <img
              src={activeSlide.image}
              alt={activeSlide.alt}
              className="w-full h-full object-cover rounded-xl shadow-sm"
              loading="lazy"
            />
          </div>
        </div>
      </div>

      {/* Pagination Dots */}
      <div className="flex justify-center items-center gap-1.5 mt-2">
        {slides.map((slide, idx) => (
          <button
            key={slide.id}
            onClick={() => setCurrentSlide(idx)}
            aria-label={`Go to slide ${idx + 1}`}
            className={`transition-all duration-200 rounded-full ${
              idx === currentSlide
                ? 'w-5 h-2 bg-[#0E7438]'
                : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
