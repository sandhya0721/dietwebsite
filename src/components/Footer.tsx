import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="border-t border-[#DCE3D8] bg-white mt-20">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-2">
          <p className="font-display text-lg font-semibold text-[#16221A]">
            Verdant Bowl
          </p>
          <p className="mt-2 text-sm text-[#4D5E53] max-w-md leading-relaxed">
            Freshly harvested greens, measured macros, and dependable daily
            membership deliveries prepared every morning in our kitchen.
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold text-[#16221A] mb-3">Explore</p>
          <ul className="space-y-2 text-sm text-[#4D5E53]">
            <li>
              <Link to="/menu" className="hover:text-[#1B5E37] transition-colors">
                Salad Menu
              </Link>
            </li>
            <li>
              <Link to="/plans" className="hover:text-[#1B5E37] transition-colors">
                Membership Plans
              </Link>
            </li>
            <li>
              <Link to="/builder" className="hover:text-[#1B5E37] transition-colors">
                Custom Salad Builder
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold text-[#16221A] mb-3">Kitchen Hours</p>
          <p className="text-sm text-[#4D5E53] leading-relaxed">
            Monday – Saturday
            <br />
            7:30 AM – 9:00 PM
            <br />
            Indiranagar, Bengaluru
          </p>
        </div>
      </div>
      <div className="border-t border-[#EEF2EC]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#4D5E53]">
          <span>© {new Date().getFullYear()} Verdant Bowl Kitchens.</span>
          <span>Fresh farm-to-bowl daily nutrition.</span>
        </div>
      </div>
    </footer>
  );
}
