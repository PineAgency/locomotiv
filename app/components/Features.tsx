import {
  Search, Car, Calendar, Tag, Shield, Zap, Award, TrendingUp, CheckCircle,
  ArrowRight, X, MapPin, Fuel, AlertCircle, Droplets, Ruler
} from 'lucide-react';
import dynamic from 'next/dynamic';

export default function Features() {
  return (
    <div>

      {/* Features Section */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">
              Why Choose LocoMotiv?
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              The most comprehensive vehicle specification database at your fingertips
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                <Zap className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Instant Access</h3>
              <p className="text-slate-600">
                Get vehicle specifications in seconds with our lightning-fast search engine.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                <Shield className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Verified Data</h3>
              <p className="text-slate-600">
                All information sourced from official NHTSA databases for accuracy.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                <Award className="w-7 h-7 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Comprehensive</h3>
              <p className="text-slate-600">
                Thousands of vehicle makes and models from multiple decades.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center mb-6">
                <TrendingUp className="w-7 h-7 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Always Updated</h3>
              <p className="text-slate-600">
                Regular updates ensure you have access to the latest vehicle data.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            <div>
              <div className="text-5xl md:text-6xl font-black mb-2">10K+</div>
              <div className="text-xl text-blue-100">Vehicle Models</div>
            </div>
            <div>
              <div className="text-5xl md:text-6xl font-black mb-2">500+</div>
              <div className="text-xl text-blue-100">Manufacturers</div>
            </div>
            <div>
              <div className="text-5xl md:text-6xl font-black mb-2">30</div>
              <div className="text-xl text-blue-100">Years of Data</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-slate-600">
              Finding vehicle specifications has never been easier
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-lg">
                1
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Select Vehicle</h3>
              <p className="text-slate-600 text-lg">
                Choose the year, make, and model from our comprehensive database
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-lg">
                2
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Get Instant Results</h3>
              <p className="text-slate-600 text-lg">
                Our system retrieves detailed specifications from official sources
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-lg">
                3
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Make Decisions</h3>
              <p className="text-slate-600 text-lg">
                Use accurate data to make informed purchasing or research decisions
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <>
        <section className="py-24 bg-slate-900 text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl md:text-5xl font-black mb-6">
              Ready to Find Your Vehicle?
            </h2>
            <p className="text-xl text-slate-300 mb-8">
              Start searching now and access comprehensive vehicle specifications instantly
            </p>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl text-lg"
            >
              <span>Start Searching</span>
              <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
          </div>
        </section>


        <footer className="bg-slate-950 text-slate-400 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-lg font-semibold text-white mb-2">LocoMotiv</p>
            <p className="text-sm">© {new Date().getFullYear()} LocoMotiv. Lagos, Nigeria. All rights reserved.</p>
          </div>
        </footer>
      </>

    </div>
  );
}