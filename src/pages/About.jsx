import React from 'react';
import { ArrowRight, CheckCircle, Globe, Users, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

export const About = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="py-20 bg-gradient-to-br from-emerald-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl font-bold text-slate-900 mb-6">About Suraj Ventures</h1>
          <p className="text-xl text-slate-600 max-w-3xl">
            We're on a mission to revolutionize how people discover products. Instead of choosing based on brand names and marketing, we empower you to choose based on what's actually inside.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Mission */}
            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="flex items-center gap-3 mb-4">
                <Globe size={32} className="text-emerald-600" />
                <h2 className="text-2xl font-bold text-slate-900">Our Mission</h2>
              </div>
              <p className="text-slate-600 leading-relaxed mb-4">
                To create a transparent, ingredient-focused product discovery platform that empowers consumers to make informed choices about the products they use for their health and wellness.
              </p>
              <p className="text-slate-600 leading-relaxed">
                We believe everyone deserves to know exactly what they're putting on their skin, in their bodies, and using in their homes.
              </p>
            </div>

            {/* Vision */}
            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="flex items-center gap-3 mb-4">
                <Zap size={32} className="text-emerald-600" />
                <h2 className="text-2xl font-bold text-slate-900">Our Vision</h2>
              </div>
              <p className="text-slate-600 leading-relaxed mb-4">
                To build a world where product discovery is ingredient-first, transparent, and empowering. Where consumers make choices based on facts, not marketing.
              </p>
              <p className="text-slate-600 leading-relaxed">
                We aim to be the trusted platform for conscious consumers who care about quality, transparency, and their health.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why We Started */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-slate-900 mb-12 text-center">Why We Started Suraj Ventures</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Users size={32} className="text-emerald-600" />,
                title: "Consumers Deserve Better",
                description: "Studies show that 80% of consumers want to know what's in their products, but current platforms hide this information."
              },
              {
                icon: <CheckCircle size={32} className="text-emerald-600" />,
                title: "Transparency Matters",
                description: "Brand names shouldn't matter more than actual ingredients. Real choice comes from knowing exactly what you're getting."
              },
              {
                icon: <Globe size={32} className="text-emerald-600" />,
                title: "Conscious Living",
                description: "More people are choosing products based on health, wellness, and environmental impact. We're here to support that journey."
              }
            ].map((item, idx) => (
              <div key={idx} className="text-center">
                <div className="flex justify-center mb-4">{item.icon}</div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                <p className="text-slate-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Approach */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-slate-900 mb-12">Our Approach</h2>
          <div className="space-y-8">
            {[
              {
                number: "01",
                title: "Ingredient First",
                description: "We list every ingredient in every product. No hiding, no marketing speak. Just facts."
              },
              {
                number: "02",
                title: "Feature Focused",
                description: "Find products by the features that matter to you - vegan, organic, gluten-free, paraben-free, and more."
              },
              {
                number: "03",
                title: "Benefit Based",
                description: "Discover products by the benefits they offer - whether it's skin care, immunity, digestive health, or wellness."
              },
              {
                number: "04",
                title: "No Brand Bias",
                description: "We don't promote brands. We promote informed choice. All products are shown equally."
              }
            ].map((item, idx) => (
              <div key={idx} className="flex gap-8 items-start">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-emerald-600 text-white font-bold">
                    {item.number}
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-lg text-slate-600">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">Start Making Informed Choices Today</h2>
          <p className="text-lg mb-8 opacity-90">Explore thousands of products by ingredients, features, and benefits.</p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 bg-white text-emerald-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
          >
            Explore Products
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>
    </div>
  );
};
