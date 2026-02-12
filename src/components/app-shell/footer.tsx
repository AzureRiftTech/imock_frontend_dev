import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-gradient-to-br from-violet-50 via-white to-purple-50 border-t border-purple-100 overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-300 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-violet-300 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          
          {/* Brand Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30 transform transition-transform hover:scale-110 duration-300">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-700 to-violet-600 bg-clip-text text-transparent">
                YourBrand
              </h3>
            </div>
            <p className="text-gray-600 leading-relaxed">
              Empowering innovation through exceptional digital experiences and cutting-edge solutions.
            </p>
            <div className="flex gap-3">
              {[
                { icon: 'M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z', label: 'Twitter' },
                { icon: 'M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z M4 2a2 2 0 100 4 2 2 0 000-4z', label: 'LinkedIn' },
                { icon: 'M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22', label: 'GitHub' }
              ].map((social, idx) => (
                <Link 
                  key={idx}
                  href="#" 
                  className="w-11 h-11 rounded-xl bg-white border border-purple-200 flex items-center justify-center text-purple-600 hover:bg-gradient-to-br hover:from-purple-600 hover:to-violet-600 hover:text-white hover:border-transparent transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/30 group"
                  aria-label={social.label}
                >
                  <svg className="w-5 h-5 transform group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={social.icon} />
                  </svg>
                </Link>
              ))}
            </div>
          </div>

          {/* Products */}
          <div>
            <h4 className="text-lg font-bold text-gray-900 mb-6 relative inline-block">
              Products
              <span className="absolute -bottom-2 left-0 w-12 h-1 bg-gradient-to-r from-purple-600 to-violet-600 rounded-full"></span>
            </h4>
            <ul className="space-y-4">
              {['Features', 'Integrations', 'Pricing', 'Changelog', 'Documentation'].map((item) => (
                <li key={item}>
                  <Link 
                    href="#" 
                    className="text-gray-600 hover:text-purple-600 transition-colors duration-200 inline-flex items-center group"
                  >
                    <span className="w-0 h-0.5 bg-purple-600 rounded-full group-hover:w-4 transition-all duration-300 mr-0 group-hover:mr-2"></span>
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-lg font-bold text-gray-900 mb-6 relative inline-block">
              Company
              <span className="absolute -bottom-2 left-0 w-12 h-1 bg-gradient-to-r from-purple-600 to-violet-600 rounded-full"></span>
            </h4>
            <ul className="space-y-4">
              {['About Us', 'Careers', 'Blog', 'Press Kit', 'Contact'].map((item) => (
                <li key={item}>
                  <Link 
                    href="#" 
                    className="text-gray-600 hover:text-purple-600 transition-colors duration-200 inline-flex items-center group"
                  >
                    <span className="w-0 h-0.5 bg-purple-600 rounded-full group-hover:w-4 transition-all duration-300 mr-0 group-hover:mr-2"></span>
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-lg font-bold text-gray-900 mb-6 relative inline-block">
              Stay Updated
              <span className="absolute -bottom-2 left-0 w-12 h-1 bg-gradient-to-r from-purple-600 to-violet-600 rounded-full"></span>
            </h4>
            <p className="text-gray-600 mb-6 text-sm leading-relaxed">
              Get the latest updates and news delivered to your inbox.
            </p>
            <form className="space-y-3">
              <div className="relative">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full px-4 py-3.5 bg-white border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-sm"
                />
              </div>
              <button
                type="submit"
                className="w-full px-6 py-3.5 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/40 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 text-sm"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-purple-200">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-gray-600 text-sm text-center md:text-left">
              © {currentYear} YourBrand. All rights reserved.
            </p>
            <div className="flex flex-wrap justify-center gap-8">
              {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map((item) => (
                <Link 
                  key={item}
                  href="#" 
                  className="text-sm text-gray-600 hover:text-purple-600 transition-colors duration-200 relative group"
                >
                  {item}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-purple-600 rounded-full group-hover:w-full transition-all duration-300"></span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Decorative wave pattern at top */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 via-violet-500 to-purple-600"></div>
    </footer>
  );
}