import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import axios from "axios";
import config from "../config";
import {
  Home,
  Database,
  FileText,
  UserPlus,
  CreditCard,
  Users,
  ChartBar,
  Settings,
  User,
  Stethoscope,
  Pill,
  ClipboardList,
  Building2,
  History,
  Activity,
  BedDouble,
  Receipt,
  Timer,
  BarChart,
  Shield,
  Layout,
  Menu,
  Sun,
  Moon,
  LogOut,
  PillBottle,
  Package,
  Boxes,
  Tablets,
} from "lucide-react";

const ICON_MAP = {
  home: Home,
  database: Database,
  "file-medical": Tablets,
  "user-plus": UserPlus,
  "credit-card": CreditCard,
  users: Users,
  "chart-bar": ChartBar,
  settings: Settings,
  user: User,
  stethoscope: Stethoscope,
  pill: Pill,
  "clipboard-list": ClipboardList,
  "building-2": Building2,
  history: History,
  activity: Activity,
  "bed-double": BedDouble,
  "file-text": FileText,
  receipt: Receipt,
  timer: Timer,
  "bar-chart": BarChart,
  shield: Shield,
  layout: Layout,
  menu: Menu,
  dashboard: Home,
  master: Database,
  rm: FileText,
  pendaftaran: UserPlus,
  kasir: CreditCard,
  antrian: Timer,
  laporan: BarChart,
  diagnosa: Activity,
  pasien: Users,
  dokter: Stethoscope,
  obat: Pill,
  tindakan: Activity,
  poli: Building2,
  rawat: BedDouble,
  invoice: Receipt,
  tagihan: CreditCard,
  kunjungan: History,
  capsule: PillBottle,
  package: Package,
  boxes: Boxes,
};

const DEFAULT_MENUS = [
  {
    id: 1,
    menu_name: "Dashboard",
    menu_path: "/dashboard",
    icon: "dashboard",
  },
  {
    id: 2,
    menu_name: "Master Data",
    icon: "master",
    children: [
      {
        id: 21,
        menu_name: "Pasien",
        menu_path: "/master/pasien",
        icon: "pasien",
      },
      {
        id: 22,
        menu_name: "Dokter",
        menu_path: "/master/dokter",
        icon: "dokter",
      },
      { id: 23, menu_name: "Obat", menu_path: "/master/obat", icon: "obat" },
      {
        id: 24,
        menu_name: "Tindakan",
        menu_path: "/master/tindakan",
        icon: "tindakan",
      },
      { id: 25, menu_name: "Poli", menu_path: "/master/poli", icon: "poli" },
    ],
  },
  {
    id: 3,
    menu_name: "Rekam Medis",
    icon: "rm",
    children: [
      { id: 31, menu_name: "Input RM", menu_path: "/rm/input", icon: "rm" },
      {
        id: 32,
        menu_name: "Riwayat RM",
        menu_path: "/rm/history",
        icon: "history",
      },
      {
        id: 33,
        menu_name: "Diagnosa",
        menu_path: "/rm/diagnosa",
        icon: "diagnosa",
      },
    ],
  },
  {
    id: 4,
    menu_name: "Pendaftaran",
    icon: "pendaftaran",
    children: [
      {
        id: 41,
        menu_name: "Rawat Jalan",
        menu_path: "/pendaftaran/rawat-jalan",
        icon: "rawat",
      },
      {
        id: 42,
        menu_name: "Rawat Inap",
        menu_path: "/pendaftaran/rawat-inap",
        icon: "rawat",
      },
    ],
  },
  {
    id: 5,
    menu_name: "Kasir / Billing",
    icon: "kasir",
    children: [
      {
        id: 51,
        menu_name: "Resep Obat",
        menu_path: "/kasir/resep",
        icon: "file-medical",
      },
      {
        id: 51,
        menu_name: "Pembayaran",
        menu_path: "/kasir/pembayaran",
        icon: "kasir",
      },
      {
        id: 52,
        menu_name: "Invoice",
        menu_path: "/kasir/invoice",
        icon: "invoice",
      },
      {
        id: 53,
        menu_name: "Tagihan Pasien",
        menu_path: "/kasir/tagihan",
        icon: "tagihan",
      },
    ],
  },
  {
    id: 6,
    menu_name: "Antrian",
    icon: "antrian",
    children: [
      {
        id: 61,
        menu_name: "Antrian Poli",
        menu_path: "/antrian/poli",
        icon: "antrian",
      },
      {
        id: 62,
        menu_name: "Antrian Kasir",
        menu_path: "/antrian/kasir",
        icon: "antrian",
      },
    ],
  },
  {
    id: 7,
    menu_name: "Laporan",
    icon: "laporan",
    children: [
      {
        id: 71,
        menu_name: "Kunjungan",
        menu_path: "/laporan/kunjungan",
        icon: "kunjungan",
      },
      {
        id: 72,
        menu_name: "Diagnosa",
        menu_path: "/laporan/diagnosa",
        icon: "diagnosa",
      },
      {
        id: 73,
        menu_name: "Pendapatan",
        menu_path: "/laporan/pendapatan",
        icon: "laporan",
      },
    ],
  },
  {
    id: 8,
    menu_name: "Pengaturan Sistem",
    icon: "settings",
    children: [
      { id: 81, menu_name: "User", menu_path: "/settings/user", icon: "users" },
      {
        id: 82,
        menu_name: "Role & Privilege",
        menu_path: "/settings/role",
        icon: "shield",
      },
      {
        id: 83,
        menu_name: "Master Menu",
        menu_path: "/settings/menu",
        icon: "menu",
      },
    ],
  },
];

const Sidebar = ({ collapsed, onLogout }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [menus, setMenus] = useState([]);
  const [activeMenu, setActiveMenu] = useState(null);
  const location = useLocation();
  const sidebarRef = useRef(null);

  useEffect(() => {
    fetchUserMenus();

    // Handler untuk klik di luar sidebar
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setActiveMenu(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchUserMenus = async () => {
    try {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user") || "{}");

      if (!user.role_id) {
        console.warn("No role_id found for user");
        setMenus(DEFAULT_MENUS);
        return;
      }

      const response = await axios.get(`${config.apiUrl}/menus/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.status === "success") {
        // Create a Set to track unique menu IDs
        const seenIds = new Set();

        const processedMenus = response.data.data
          .filter((menu) => {
            // Filter out menus with duplicate IDs
            if (!menu.id || !menu.menu_name || seenIds.has(menu.id)) {
              return false;
            }
            seenIds.add(menu.id);
            return true;
          })
          .map((menu) => {
            // Create a Set for child IDs within this menu
            const seenChildIds = new Set();

            return {
              id: menu.id,
              menu_name: menu.menu_name,
              menu_path: menu.menu_path,
              icon: menu.icon?.toLowerCase() || "dashboard",
              order_number: menu.order_number || 999, // Default high number if not specified
              parent_id: menu.parent_id,
              children: (menu.children || [])
                .filter((child) => {
                  // Filter out children with duplicate IDs
                  if (
                    !child ||
                    !child.id ||
                    !child.menu_name ||
                    seenChildIds.has(child.id)
                  ) {
                    return false;
                  }
                  seenChildIds.add(child.id);
                  return true;
                })
                .map((child) => ({
                  id: `${menu.id}_${child.id}`, // Create unique composite key
                  menu_name: child.menu_name,
                  menu_path: child.menu_path,
                  icon:
                    child.icon?.toLowerCase() ||
                    menu.icon?.toLowerCase() ||
                    "dashboard",
                  order_number: child.order_number || 999, // Default high number if not specified
                }))
                // Sort children by order_number
                .sort((a, b) => (a.order_number || 0) - (b.order_number || 0)),
            };
          })
          // Sort parent menus by order_number
          .sort((a, b) => (a.order_number || 0) - (b.order_number || 0));

        setMenus(processedMenus);
      }
    } catch (error) {
      console.error("Error fetching menus:", error);
      setMenus(DEFAULT_MENUS);
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark");
  };

  const handleMenuClick = (menuId, event) => {
    event.preventDefault();
    event.stopPropagation();
    setActiveMenu(menuId); // Langsung set ke menuId baru, tidak perlu toggle
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  return (
    <div
      ref={sidebarRef}
      className="fixed left-0 h-screen w-64 bg-gray-50 border-r border-gray-200 text-gray-700 flex flex-col z-[9]"
    >
      {/* Logo */}
      <div className="flex items-center gap-2 p-4 bg-white border-b border-gray-200">
        {/* <svg width="32" height="30" viewBox="0 0 282 145" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fillRule="evenodd" clipRule="evenodd" d="M110.202 0L131.834 37.4662H131.908L132.669 38.7837L153.642 75.1088L153.648 75.0979L173.567 109.578L153.642 144.09L132.011 106.624L131.935 106.624L110.202 68.9812L88.4695 106.624H48.6432L48.6517 106.609L0 106.609L14.0118 73.2168L67.875 73.3132L110.202 0ZM199.128 65.3051L183.046 37.4662L215.201 37.4663L199.128 65.3051ZM218.713 73.2172L210.316 58.6739L224.507 34.5138L204.188 1.20767L190.634 24.5826L176.441 0L153.402 39.9052L191.922 106.624L238 106.624L237.962 106.557L267.251 106.609L281.262 73.2172L218.713 73.2172Z" fill="#14967F"/>
          <path fillRule="evenodd" clipRule="evenodd" d="M425.79 0L433.403 13.1874H433.43L433.746 13.7352L441.079 26.437L441.082 26.4332L448.093 38.5697L441.079 50.7174L433.466 37.5299H433.439L425.79 24.2803L418.14 37.5299L404.122 37.5299L404.125 37.5247L387 37.5247L391.932 25.7711L410.891 25.8051L425.79 0ZM457.09 22.9863L451.429 13.1874L462.747 13.1874L457.09 22.9863Z" fill="#095D7E"/>
        </svg> 
        <span className="font-semibold text-lg">MEDAVIC</span>*/}
        <svg
          width="150"
          height="32"
          viewBox="0 0 486 123"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M425.79 0L433.403 13.1874H433.43L433.746 13.7352L441.079 26.437L441.082 26.4332L448.093 38.5697L441.079 50.7174L433.466 37.5299H433.439L425.79 24.2803L418.14 37.5299L404.122 37.5299L404.125 37.5247L387 37.5247L391.932 25.7711L410.891 25.8051L425.79 0ZM457.09 22.9863L451.429 13.1874L462.747 13.1874L457.09 22.9863Z"
            fill="#14967F"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M463.983 25.7713L461.028 20.6524L466.023 12.1482L458.871 0.425009L454.1 8.65276L449.104 0L440.995 14.0459L454.553 37.5299L470.772 37.5299L470.759 37.5064L481.068 37.5249L486 25.7713L463.983 25.7713Z"
            fill="#095D7E"
          />
          <path
            d="M46.8125 53.2499L59.375 53.2499L65.8906 100.594L88.8594 53.2499L102.453 53.2499L68.1406 121.5L57.5 121.5L46.8125 53.2499ZM38.6094 53.2499L52.1563 53.2499L45.5 106.266L42.8281 121.5L26.7969 121.5L38.6094 53.2499ZM96.5 53.2499L110.141 53.2499L98.3281 121.5L82.2031 121.5L85.1094 104.906L96.5 53.2499ZM156.313 108.844L154.109 121.5L118.719 121.5L120.922 108.844L156.313 108.844ZM136.344 53.2499L124.484 121.5L108.453 121.5L120.266 53.2499L136.344 53.2499ZM156.688 80.3436L154.578 92.578L123.734 92.578L125.891 80.3436L156.688 80.3436ZM166.063 53.2499L163.859 65.953L128.328 65.953L130.578 53.2499L166.063 53.2499ZM182.984 121.5L167.375 121.5L169.672 108.844L183.5 108.937C187.406 108.937 190.625 107.969 193.156 106.031C195.719 104.094 197.703 101.578 199.109 98.4843C200.547 95.3905 201.516 92.1249 202.016 88.6874L202.344 85.7811C202.625 83.7186 202.75 81.5624 202.719 79.3124C202.688 77.0311 202.359 74.9061 201.734 72.9374C201.109 70.9686 200.047 69.3436 198.547 68.0624C197.078 66.7811 195.016 66.0936 192.359 65.9999L176.75 65.953L178.953 53.2499L192.875 53.2968C197.438 53.3905 201.438 54.328 204.875 56.1093C208.313 57.8593 211.141 60.2499 213.359 63.2811C215.578 66.2811 217.141 69.7186 218.047 73.5936C218.953 77.4686 219.156 81.5468 218.656 85.828L218.328 88.7811C217.734 93.3436 216.453 97.6249 214.484 101.625C212.516 105.594 209.984 109.078 206.891 112.078C203.797 115.047 200.219 117.375 196.156 119.062C192.125 120.719 187.734 121.531 182.984 121.5ZM188.469 53.2499L176.609 121.5L160.578 121.5L172.391 53.2499L188.469 53.2499Z"
            fill="#14967F"
          />
          <path
            d="M257.188 68.3905L232.063 121.5L214.297 121.5L250.484 53.2499L261.828 53.2499L257.188 68.3905ZM261.5 121.5L254.563 66.7499L254.938 53.2499L265.625 53.2499L278.234 121.5L261.5 121.5ZM265.156 96.0468L262.906 108.75L228.828 108.75L231.078 96.0468L265.156 96.0468ZM307.766 104.766L329.422 53.2499L347.844 53.2499L314.797 121.5L302.844 121.5L307.766 104.766ZM303.219 53.2499L308.938 106.219L308.75 121.5L297.313 121.5L285.781 53.2499L303.219 53.2499ZM370.109 53.2499L358.297 121.5L342.266 121.5L354.125 53.2499L370.109 53.2499ZM410.656 98.4374L426.359 98.2499C425.922 103.437 424.25 107.859 421.344 111.516C418.469 115.141 414.828 117.891 410.422 119.766C406.047 121.641 401.375 122.531 396.406 122.437C391.688 122.344 387.719 121.375 384.5 119.531C381.281 117.656 378.75 115.156 376.906 112.031C375.063 108.875 373.844 105.344 373.25 101.437C372.656 97.4999 372.625 93.4374 373.156 89.2499L373.672 85.5468C374.297 81.203 375.453 77.0311 377.141 73.0311C378.828 68.9999 381.031 65.4061 383.75 62.2499C386.5 59.0936 389.766 56.6249 393.547 54.8436C397.328 53.0311 401.609 52.1718 406.391 52.2655C411.484 52.3593 415.813 53.4218 419.375 55.453C422.969 57.4843 425.75 60.328 427.719 63.9843C429.719 67.6405 430.844 71.953 431.094 76.9218L415.109 76.8749C415.203 74.4686 414.969 72.4061 414.406 70.6874C413.844 68.9686 412.844 67.6405 411.406 66.703C410 65.7343 408.016 65.203 405.453 65.1093C402.672 65.0155 400.344 65.5936 398.469 66.8436C396.625 68.0624 395.125 69.703 393.969 71.7655C392.813 73.828 391.922 76.0624 391.297 78.4686C390.703 80.8749 390.25 83.203 389.938 85.453L389.469 89.2968C389.25 91.1405 389.047 93.2186 388.859 95.5311C388.672 97.8124 388.75 100.016 389.094 102.141C389.438 104.234 390.234 105.984 391.484 107.391C392.734 108.797 394.688 109.547 397.344 109.641C399.844 109.703 402.016 109.312 403.859 108.469C405.703 107.594 407.188 106.312 408.313 104.625C409.469 102.906 410.25 100.844 410.656 98.4374Z"
            fill="#095D7E"
          />
        </svg>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {menus.map((menu) => {
          const Icon = ICON_MAP[menu.icon?.toLowerCase()] || Home;
          const hasChildren = menu.children && menu.children.length > 0;
          const isActiveParent =
            hasChildren &&
            menu.children.some(
              (child) => location.pathname === child.menu_path
            );
          const isActive = !hasChildren && location.pathname === menu.menu_path;

          return (
            <div
              key={`menu_${menu.id}`}
              className="relative group px-3"
              data-menu-id={menu.id}
            >
              {hasChildren ? (
                <button
                  onClick={(e) => handleMenuClick(menu.id, e)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors relative
                    ${
                      isActiveParent || isActive || activeMenu === menu.id
                        ? "bg-blue-50 text-blue-600 before:absolute before:right-0 before:top-0 before:bottom-0 before:w-1 before:bg-blue-600 before:rounded-l"
                        : "hover:bg-white"
                    }`}
                >
                  <Icon size={20} />
                  <span className="text-sm font-medium">{menu.menu_name}</span>
                </button>
              ) : (
                <Link
                  to={menu.menu_path || "#"}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors relative
                    ${
                      isActive
                        ? "bg-blue-50 text-blue-600 before:absolute before:right-0 before:top-0 before:bottom-0 before:w-1 before:bg-blue-600 before:rounded-l"
                        : "hover:bg-white"
                    }`}
                >
                  <Icon size={20} />
                  <span className="text-sm font-medium">{menu.menu_name}</span>
                </Link>
              )}

              {activeMenu === menu.id && hasChildren && (
                <div className="mt-1 pl-9">
                  {menu.children.map((child) => {
                    const ChildIcon =
                      ICON_MAP[child.icon?.toLowerCase()] || Icon;
                    const isChildActive = location.pathname === child.menu_path;

                    return (
                      <Link
                        key={child.id}
                        to={child.menu_path}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors
                          ${
                            isChildActive
                              ? "bg-blue-50 text-blue-600"
                              : "text-gray-600 hover:bg-white"
                          }`}
                        onClick={() => setActiveMenu(null)}
                      >
                        <ChildIcon size={16} />
                        <span>{child.menu_name}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50">
          <button
            onClick={toggleDarkMode}
            className="flex items-center gap-3 text-gray-600"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            <span className="text-sm font-medium">
              {darkMode ? "Light Mode" : "Dark Mode"}
            </span>
          </button>
        </div>
        <ul className="mt-auto">
          <li
            onClick={handleLogout}
            className="flex items-center p-3 text-red-500 hover:bg-red-50 cursor-pointer"
          >
            <LogOut className="mr-3" size={20} />
            <span>Logout</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;

const getIconComponent = (iconName) => {
  if (!iconName) return Home;

  // Mapping sesuai dengan data dari database
  const iconMapping = {
    home: Home,
    "#": Database,
    "file-medical": FileMedical,
    "user-plus": UserPlus,
    "credit-card": CreditCard,
    users: Users,
    "chart-bar": ChartBar,
    settings: Settings,
    user: User,
    stethoscope: Stethoscope,
    pill: Pill,
    "clipboard-list": ClipboardList,
    "building-2": Building2,
    history: History,
    activity: Activity,
    "bed-double": BedDouble,
    "file-text": FileText,
    receipt: Receipt,
    timer: Timer,
    "bar-chart": BarChart,
    shield: Shield,
    layout: Layout,
  };

  return iconMapping[iconName] || Home;
};

const renderMenuItem = (menu) => {
  const IconComponent = getIconComponent(menu.icon);

  return (
    <Link
      key={menu.id}
      to={menu.menu_path || "#"}
      className={`flex items-center px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg ${
        location.pathname === menu.menu_path ? "bg-gray-100" : ""
      }`}
    >
      <IconComponent className="w-5 h-5 mr-3" />
      <span>{menu.menu_name}</span>
    </Link>
  );
};
