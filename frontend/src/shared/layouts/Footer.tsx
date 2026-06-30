import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-8 px-4 py-10 sm:grid-cols-3 sm:px-6 lg:px-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4 4h16v4H4zM4 10h10v4H4zM4 16h16v4H4z" />
              </svg>
            </span>
            <span className="text-base font-semibold text-slate-900">Sessions Marketplace</span>
          </div>
          <p className="mt-3 max-w-sm text-sm text-slate-500">
            Discover, book, and run live sessions with creators from around the world.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-900">Product</h4>
          <ul className="mt-3 space-y-2 text-sm text-slate-500">
            <li><Link to="/sessions" className="hover:text-slate-900">Browse sessions</Link></li>
            <li><Link to="/signup" className="hover:text-slate-900">Get started</Link></li>
            <li><Link to="/creator" className="hover:text-slate-900">For creators</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-900">Company</h4>
          <ul className="mt-3 space-y-2 text-sm text-slate-500">
            <li><a href="#" className="hover:text-slate-900">About</a></li>
            <li><a href="#" className="hover:text-slate-900">Privacy</a></li>
            <li><a href="#" className="hover:text-slate-900">Terms</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-200">
        <div className="mx-auto w-full max-w-7xl px-4 py-4 text-center text-xs text-slate-400 sm:px-6 lg:px-8">
          &copy; {new Date().getFullYear()} Sessions Marketplace. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
