import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ChevronRightIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import content from '../content/content.json';

export const Landing: React.FC = () => {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
  const [isScrolled, setIsScrolled] = React.useState(false);

  // Add scroll listener
  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Add smooth scrolling behavior
  React.useEffect(() => {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e: Event) => {
        e.preventDefault();
        const href = (e.currentTarget as HTMLAnchorElement).getAttribute('href');
        if (href) {
          const target = document.querySelector(href);
          target?.scrollIntoView({
            behavior: 'smooth'
          });
        }
      });
    });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 overflow-x-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <motion.div
          style={{ y }}
          className="absolute inset-0 opacity-20"
        >
          {/* Sakura Petals - CSS Animation */}
          <div className="absolute animate-sakura w-2 h-2 bg-pink-300 rounded-full" style={{ left: '10%', animationDelay: '0s' }} />
          <div className="absolute animate-sakura w-2 h-2 bg-pink-300 rounded-full" style={{ left: '20%', animationDelay: '2s' }} />
          <div className="absolute animate-sakura w-2 h-2 bg-pink-300 rounded-full" style={{ left: '30%', animationDelay: '4s' }} />
          <div className="absolute animate-sakura w-2 h-2 bg-pink-300 rounded-full" style={{ left: '40%', animationDelay: '1s' }} />
          <div className="absolute animate-sakura w-2 h-2 bg-pink-300 rounded-full" style={{ left: '50%', animationDelay: '3s' }} />
          <div className="absolute animate-sakura w-2 h-2 bg-pink-300 rounded-full" style={{ left: '60%', animationDelay: '5s' }} />
          <div className="absolute animate-sakura w-2 h-2 bg-pink-300 rounded-full" style={{ left: '70%', animationDelay: '1.5s' }} />
          <div className="absolute animate-sakura w-2 h-2 bg-pink-300 rounded-full" style={{ left: '80%', animationDelay: '2.5s' }} />
          <div className="absolute animate-sakura w-2 h-2 bg-pink-300 rounded-full" style={{ left: '90%', animationDelay: '4.5s' }} />
        </motion.div>
      </div>

      {/* Sticky Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${isScrolled
          ? 'bg-white/70 dark:bg-gray-900/70 backdrop-blur-md border-gray-200/50 dark:border-gray-800/50'
          : 'bg-transparent border-transparent'
        }`}>
        <div className="container mx-auto">
          <div className="flex items-center justify-between p-4">
            <div className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent hover:scale-105 transition-transform">
              Libraria AI
            </div>
            <div className="flex items-center space-x-8">
              <a
                href="#home"
                className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-all duration-300 hover:scale-105"
              >
                Home
              </a>
              <a
                href="#services"
                className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-all duration-300 hover:scale-105"
              >
                Services
              </a>
              <a
                href="#features"
                className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-all duration-300 hover:scale-105"
              >
                Features
              </a>
              <a
                href="#about"
                className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-all duration-300 hover:scale-105"
              >
                About
              </a>
              <a
                href="#contact"
                className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-all duration-300 hover:scale-105"
              >
                Contact
              </a>
              <ThemeToggle />
              <Link to="/login">
                <Button
                  variant="neon"
                  size="sm"
                  className="hover:scale-105 transition-all duration-300 hover:shadow-neon"
                >
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="relative z-10 min-h-screen flex items-center pt-16">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-white/20 dark:bg-gray-900/20 backdrop-blur-md rounded-full border border-gray-400/30 dark:border-accent-500 shadow-[0_4px_15px_rgba(0,0,0,0.1)] dark:shadow-none"
                >
                  <SparklesIcon className="w-4 h-4 text-accent-500" />
                  <span className="text-sm font-medium text-gray-800 dark:text-white">
                    Powered by Intelligence
                  </span>
                </motion.div>


                <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
                  <span className="bg-gradient-to-r from-primary-600 via-accent-600 to-neon-purple bg-clip-text text-transparent">
                    {content.landing.hero.title}
                  </span>
                </h1>

                <h2 className="text-2xl lg:text-3xl font-semibold text-gray-700 dark:text-gray-300">
                  {content.landing.hero.subtitle}
                </h2>

                <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl">
                  {content.landing.hero.tagline}
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                {content.landing.hero.features.map((feature, index) => (
                  <motion.div
                    key={feature}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className="px-4 py-2 bg-white/10 dark:bg-gray-900/20 backdrop-blur-md rounded-full border border-gray-400/30 dark:border-accent-500 shadow-[0_4px_15px_rgba(0,0,0,0.1)] dark:shadow-none"
                  >
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {feature}
                    </span>
                  </motion.div>
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Link to="/login">
                  <Button variant="neon" size="lg" className="group">
                    {content.landing.hero.cta}
                    <ChevronRightIcon className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </motion.div>
            </motion.div>

            {/* Mascot Animation Placeholder */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="lg:flex justify-center items-center hidden"
            >
              <motion.div
                animate={{
                  y: [0, -20, 0],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="w-96 h-96 bg-gradient-to-br from-neon-purple to-neon-pink rounded-full opacity-20 blur-3xl"
              />
              <div className="absolute text-6xl animate-float">
                🤖
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="relative z-10 py-20 bg-gradient-to-b from-transparent via-primary-50/10 to-transparent dark:via-primary-900/10">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">Powerful Features</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Experience the future of knowledge management with our AI-powered platform
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {content.landing.features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="card-stagger"
              >
                <Card
                  hover
                  glow
                  className="h-full text-center card-interactive card-overlay transition-all duration-300 hover:scale-105 hover:shadow-xl dark:hover:shadow-primary-500/20 border border-primary-100 dark:border-primary-800/50 hover:border-primary-500/50 dark:hover:border-primary-500/50"
                >
                  <div className="text-4xl mb-4 animate-bounce-in">{feature.icon}</div>
                  <h3 className="text-xl font-semibold mb-3 text-reveal">{feature.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-20 bg-gradient-to-b from-transparent via-accent-50/10 to-transparent dark:via-accent-900/10">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">See It In Action</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Discover how Libraria AI transforms your workflow
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {content.landing.gallery.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="card-stagger"
              >
                <Card hover className="overflow-hidden card-interactive card-overlay">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-48 object-cover rounded-lg mb-4 hover:scale-110 transition-transform duration-300"
                    loading="lazy"
                  />
                  <h3 className="text-lg font-semibold mb-2 text-reveal">{item.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">{item.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20">
        <div className="container mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <Card className="max-w-4xl mx-auto">
              <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
                Join thousands of organizations already using Libraria AI to transform their operations
              </p>
              <Link to="/login">
                <Button variant="neon" size="lg">
                  Start Your Journey
                  <ChevronRightIcon className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Services Section */}
      <section className="relative z-10 py-20">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">Our Services</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Comprehensive solutions for your organization
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="card-stagger"
            >
              <Card hover glow className="h-full card-interactive card-overlay">
                <div className="text-4xl mb-4 animate-bounce-in">📚</div>
                <h3 className="text-xl font-semibold mb-3">Library Management</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Advanced digital library system with AI-powered cataloging and recommendations.
                </p>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="card-stagger"
            >
              <Card hover glow className="h-full card-interactive card-overlay">
                <div className="text-4xl mb-4 animate-bounce-in">🏥</div>
                <h3 className="text-xl font-semibold mb-3">Healthcare Solutions</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Streamlined patient management and healthcare documentation systems.
                </p>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
              className="card-stagger"
            >
              <Card hover glow className="h-full card-interactive card-overlay">
                <div className="text-4xl mb-4 animate-bounce-in">📝</div>
                <h3 className="text-xl font-semibold mb-3">Smart Documentation</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  AI-powered note-taking and documentation management system.
                </p>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="relative z-10 py-20 bg-gradient-to-b from-transparent via-neon-purple/5 to-transparent dark:via-neon-purple/10">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <Card hover glow className="p-8 card-interactive card-overlay">
              <div className="max-w-3xl mx-auto text-center">
                <h2 className="text-4xl font-bold mb-6 gradient-text-animated">About Libraria AI</h2>
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                  Libraria AI is a cutting-edge platform that combines artificial intelligence with library management and healthcare documentation. Our mission is to streamline organizational workflows and enhance knowledge management through innovative technology.
                </p>
                <div className="grid md:grid-cols-3 gap-6 mt-12">
                  <motion.div
                    className="text-center group cursor-pointer"
                    whileHover={{ scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <div className="relative">
                      <div className="text-5xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent group-hover:opacity-0 transition-opacity duration-300">5+</div>
                      <div className="absolute inset-0 text-5xl font-bold text-primary-500 dark:text-primary-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 group-hover:animate-pulse">5+</div>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">Years Experience</p>
                  </motion.div>
                  <motion.div
                    className="text-center group cursor-pointer"
                    whileHover={{ scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <div className="relative">
                      <div className="text-5xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent group-hover:opacity-0 transition-opacity duration-300">1000+</div>
                      <div className="absolute inset-0 text-5xl font-bold text-accent-500 dark:text-accent-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 group-hover:animate-pulse">1000+</div>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">Happy Users</p>
                  </motion.div>
                  <motion.div
                    className="text-center group cursor-pointer"
                    whileHover={{ scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <div className="relative">
                      <div className="text-5xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent group-hover:opacity-0 transition-opacity duration-300">24/7</div>
                      <div className="absolute inset-0 text-5xl font-bold text-neon-purple dark:text-neon-pink opacity-0 group-hover:opacity-100 transition-opacity duration-300 group-hover:animate-pulse">24/7</div>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">Support Available</p>
                  </motion.div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="relative z-10 py-20 bg-gradient-to-b from-transparent via-neon-pink/5 to-transparent dark:via-neon-pink/10">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <Card hover glow className="p-8">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-4xl font-bold text-center mb-8">Contact Us</h2>
                <div className="grid md:grid-cols-2 gap-12">
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Get in Touch</h3>
                    <div className="space-y-4">
                      <p className="flex items-center text-gray-600 dark:text-gray-400">
                        <span className="mr-3">📍</span>
                        123 Tech Street, Digital City, 12345
                      </p>
                      <p className="flex items-center text-gray-600 dark:text-gray-400">
                        <span className="mr-3">📧</span>
                        contact@libraria.ai
                      </p>
                      <p className="flex items-center text-gray-600 dark:text-gray-400">
                        <span className="mr-3">📞</span>
                        +1 (555) 123-4567
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Name</label>
                      <input type="text" className="w-full px-4 py-2 rounded-lg bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Email</label>
                      <input type="email" className="w-full px-4 py-2 rounded-lg bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Message</label>
                      <textarea rows={4} className="w-full px-4 py-2 rounded-lg bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700"></textarea>
                    </div>
                    <Button variant="primary" className="w-full">Send Message</Button>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12 border-t border-gray-200/50 dark:border-gray-800/50">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent mb-4">
                Libraria AI
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Empowering the future of knowledge management
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                <li>Library Management</li>
                <li>Smart Documentation</li>
                <li>AI Integration</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                <li>About Us</li>
                <li>Careers</li>
                <li>Blog</li>
                <li>Press Kit</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
                <li>Cookie Policy</li>
                <li>GDPR Compliance</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200/50 dark:border-gray-800/50 mt-8 pt-8 text-center">
            <span className="text-gray-500">© 2025 Libraria AI. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};