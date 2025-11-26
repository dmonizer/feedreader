'use client';

import Link from "next/link";

export default function NavigationBar() {
  return (
    <nav className="bg-white dark:bg-gray-800 shadow-lg border-b dark:border-gray-700 transition-colors">
      <div className="container mx-auto">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex-1">
            <Link href="/" className="text-xl font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Feedreader
            </Link>
          </div>
          <div className="flex-none">
            <ul className="flex space-x-6">
              <li>
                <Link href="/feeds" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Feeds
                </Link>
              </li>
              <li>
                <Link href="/settings" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Settings
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </nav>
  );
}
