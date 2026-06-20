import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LuxuryHeroSection } from '../../components/3d/LuxuryHeroSection';
// Button component imported but not used in this component
import { SparklesIcon, BookOpenIcon, VideoCameraIcon, BoltIcon } from '@heroicons/react/24/outline';

interface InteractiveLandingProps {
  onNavigate?: (path: string) => void;
}

export const InteractiveLanding: React.FC<InteractiveLandingProps> = ({ onNavigate }) => {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  const features = [
    {
      icon: BookOpenIcon,
      title: 'Study Notes',
      description: 'Access curated notes from experts and peers',
      color: 'from-amber-500 to-orange-600',
      highlights: ['Upload', 'Share', 'Download', 'Collaborate'],
    },
    {
      icon: VideoCameraIcon,
      title: 'Learning Videos',
      description: 'Discover educational content tailored to your interests',
      color: 'from-blue-500 to-cyan-600',
      highlights: ['Real-time', 'Quality', 'Diverse', 'Trending'],
    },
    {
      icon: BoltIcon,
      title: 'AI Tools',
      description: 'Powerful AI-driven features for enhanced learning',
      color: 'from-purple-500 to-pink-600',
      highlights: ['Smart', 'Fast', 'Accurate', 'Helpful'],
    },
    {
      icon: SparklesIcon,
      title: 'Recommendations',
      description: 'Personalized suggestions based on your activity',
      color: 'from-green-500 to-emerald-600',
      highlights: ['Smart', 'Relevant', 'Fresh', 'Engaging'],
    },
  ];

  const stats = [
    { number: '10K+', label: 'Active Users' },
    { number: '50K+', label: 'Study Notes' },
    { number: '1M+', label: 'Videos' },
    { number: '24/7', label: 'Support' },
  ];

  return (
    <div className="w-full bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <LuxuryHeroSection
        title="Libraria"
        subtitle="Your Digital Knowledge Hub"
        onExplore={() => onNavigate?.('all')}
      />

      {/* Stats Section */}
      <section className="relative px-6 py-20 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {stats.map((stat, idx) => (
            <motion.div
              key={idx}
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              viewport={{ once: true }}
            >
              <motion.h3
                className="text-4xl md:text-5xl font-black bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: idx * 0.2 }}
              >
                {stat.number}
              </motion.h3>
              <p className="text-amber-100 text-lg mt-2 font-light">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="relative px-6 py-20 max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <h2 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-amber-200 via-amber-100 to-orange-200 bg-clip-text text-transparent mb-4">
            Powerful Features
          </h2>
          <p className="text-amber-100 text-xl font-light max-w-2xl mx-auto">
            Everything you need for an exceptional learning experience
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={idx}
                className={`relative group p-8 rounded-2xl bg-gradient-to-br ${feature.color} bg-opacity-5 border border-white/10 hover:border-white/30 transition-all cursor-pointer overflow-hidden`}
                onHoverStart={() => setHoveredCard(idx)}
                onHoverEnd={() => setHoveredCard(null)}
                whileHover={{ y: -5 }}
              >
                {/* Animated gradient background on hover */}
                <motion.div
                  className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
                  animate={hoveredCard === idx ? { opacity: 0.15 } : { opacity: 0 }}
                />

                <div className="relative z-10">
                  {/* Icon */}
                  <motion.div
                    className={`w-16 h-16 rounded-xl bg-gradient-to-br ${feature.color} p-3 mb-6 flex items-center justify-center`}
                    whileHover={{ rotate: 10, scale: 1.1 }}
                  >
                    <Icon className="w-8 h-8 text-white" />
                  </motion.div>

                  {/* Content */}
                  <h3 className="text-2xl font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-300 mb-6 font-light leading-relaxed">
                    {feature.description}
                  </p>

                  {/* Highlights */}
                  <div className="flex flex-wrap gap-2">
                    {feature.highlights.map((highlight, hIdx) => (
                      <motion.span
                        key={hIdx}
                        className="px-3 py-1 rounded-full text-sm font-semibold text-white bg-white/10 border border-white/20"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={
                          hoveredCard === idx
                            ? { opacity: 1, scale: 1 }
                            : { opacity: 0.6, scale: 0.9 }
                        }
                        transition={{ delay: hIdx * 0.05 }}
                      >
                        {highlight}
                      </motion.span>
                    ))}
                  </div>

                  {/* CTA Arrow */}
                  <motion.div
                    className="mt-6 flex items-center gap-2 text-amber-300 font-semibold"
                    animate={hoveredCard === idx ? { x: 5 } : { x: 0 }}
                  >
                    <span>Explore</span>
                    <motion.span
                      animate={hoveredCard === idx ? { x: 3 } : { x: 0 }}
                      transition={{ type: 'spring', stiffness: 400 }}
                    >
                      →
                    </motion.span>
                  </motion.div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative px-6 py-20 max-w-7xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="py-12"
        >
          <h2 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-amber-200 via-amber-100 to-orange-200 bg-clip-text text-transparent mb-6">
            Ready to Level Up?
          </h2>
          <p className="text-amber-100 text-xl font-light mb-8 max-w-2xl mx-auto">
            Join thousands of learners transforming their education with Libraria
          </p>
          <motion.button
            className="px-10 py-4 bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 text-gray-900 font-bold text-lg rounded-full shadow-2xl hover:shadow-amber-500/50"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onNavigate?.('all')}
          >
            Get Started Now
          </motion.button>
        </motion.div>
      </section>

      {/* Footer accent */}
      <div className="h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
    </div>
  );
};
