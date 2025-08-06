import React from "react";
import { Home, Clock, Shield, Settings } from "lucide-react";

const Navigation = ({ currentPage, onPageChange }) => {
  const navItems = [
    { id: "home", label: "홈", icon: Home, path: "/" },
    { id: "timer", label: "타이머", icon: Clock, path: "/timer" },
    { id: "block", label: "차단", icon: Shield, path: "/block" },
    { id: "settings", label: "설정", icon: Settings, path: "/settings" },
  ];

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* 로고 */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">EIE</span>
              </div>
              <span className="ml-3 text-xl font-semibold text-gray-800">
                EIE Concierge
              </span>
            </div>
          </div>

          {/* 네비게이션 메뉴 */}
          <div className="flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onPageChange(item.id)}
                  className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-blue-100 text-blue-700 border border-blue-200"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  <Icon size={18} className="mr-2" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
